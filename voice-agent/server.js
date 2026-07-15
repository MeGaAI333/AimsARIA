require("dotenv").config();

const express = require("express");
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const { createClient } = require("@supabase/supabase-js");

const PORT = process.env.PORT || 8091;
const VOICE_AGENT_BASE_URL = process.env.VOICE_AGENT_BASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function xmlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function streamTwiml(ctxId) {
  const wssUrl = `${VOICE_AGENT_BASE_URL.replace(/^http/, "ws")}/voice/stream?ctx=${ctxId}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${xmlEscape(wssUrl)}" />
  </Connect>
</Response>`;
}

// Twilio hits this right after an outbound call (originated by send-outreach) connects.
app.post("/voice/outbound", (req, res) => {
  const ctxId = req.query.ctx;
  if (!ctxId) return res.status(400).send("Missing ctx");
  res.type("text/xml").send(streamTwiml(ctxId));
});

// Twilio hits this when someone calls in to a number pointed at MUSE (inbound-only agent).
app.post("/voice/incoming", async (req, res) => {
  try {
    const fromNumber = req.body.From;
    const toNumber = req.body.To;

    const { data: ctx, error } = await supabase
      .from("voice_call_contexts")
      .insert({
        org_id: "default",
        agent_id: "muse",
        contact_phone: fromNumber,
        opening_message: "Thanks for calling! This is MUSE from AIMS. How can I help you today?",
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        direction: "inbound",
      })
      .select()
      .single();

    if (error || !ctx) {
      console.error("Error creating inbound call context:", error);
      return res.status(500).send("Server error");
    }

    res.type("text/xml").send(streamTwiml(ctx.id));
  } catch (err) {
    console.error("Error handling inbound call:", err);
    res.status(500).send("Server error");
  }
});

// Fallback: catches calls that never made it into the media stream (no answer, busy, failed).
app.post("/voice/status", async (req, res) => {
  try {
    const ctxId = req.query.ctx;
    const callStatus = req.body.CallStatus;
    const callSid = req.body.CallSid;

    if (ctxId && ["no-answer", "busy", "failed", "canceled"].includes(callStatus)) {
      const { data: ctx } = await supabase.from("voice_call_contexts").select("*").eq("id", ctxId).single();
      if (ctx) {
        await supabase.from("call_recordings").upsert({
          call_id: callSid,
          org_id: ctx.org_id,
          agent_id: ctx.agent_id,
          campaign_id: ctx.campaign_id,
          duration_seconds: 0,
          status: "completed",
          completed_at: new Date().toISOString(),
        }, { onConflict: "call_id" });

        if (ctx.campaign_id && ctx.contact_id) {
          await supabase
            .from("campaign_contacts")
            .update({ status: "no_answer", updated_at: new Date().toISOString() })
            .eq("campaign_id", ctx.campaign_id)
            .eq("contact_id", ctx.contact_id);
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling status callback:", err);
    res.sendStatus(200);
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/voice/stream") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.ctxId = url.searchParams.get("ctx");
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

async function askClaude(systemPrompt, messages) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/call-claude`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "I'm sorry, could you repeat that?";
}

wss.on("connection", (twilioWs) => {
  const call = {
    streamSid: null,
    callSid: null,
    ctx: null,
    deepgramWs: null,
    elevenWs: null,
    history: [],
    assistantSpeaking: false,
    startedAt: null,
    fullTranscript: [],
  };

  function sendToTwilio(payloadBase64) {
    if (!call.streamSid) return;
    twilioWs.send(JSON.stringify({
      event: "media",
      streamSid: call.streamSid,
      media: { payload: payloadBase64 },
    }));
  }

  function clearTwilioPlayback() {
    if (!call.streamSid) return;
    twilioWs.send(JSON.stringify({ event: "clear", streamSid: call.streamSid }));
  }

  function connectDeepgram() {
    const dgUrl = "wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000&channels=1&interim_results=true&endpointing=300&punctuate=true";
    const dg = new WebSocket(dgUrl, { headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` } });

    dg.on("message", (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      const alt = msg.channel?.alternatives?.[0];
      const transcript = alt?.transcript;
      if (!transcript) return;

      // Barge-in: caller started talking while the agent's audio is still playing.
      if (call.assistantSpeaking) {
        clearTwilioPlayback();
        call.assistantSpeaking = false;
      }

      if (msg.is_final && msg.speech_final) {
        handleUserUtterance(transcript);
      }
    });

    dg.on("error", (err) => console.error("Deepgram error:", err.message));
    call.deepgramWs = dg;
  }

  function connectElevenLabs() {
    const voiceId = call.ctx.voice_id;
    const url = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_turbo_v2_5&output_format=ulaw_8000`;
    const el = new WebSocket(url, { headers: { "xi-api-key": ELEVENLABS_API_KEY } });

    el.on("open", () => {
      el.send(JSON.stringify({
        text: " ",
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
        generation_config: { chunk_length_schedule: [50, 90, 120, 150] },
      }));
    });

    el.on("message", (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.audio) {
        call.assistantSpeaking = true;
        sendToTwilio(msg.audio);
      }
    });

    el.on("error", (err) => console.error("ElevenLabs error:", err.message));
    call.elevenWs = el;
  }

  function speak(text) {
    if (!call.elevenWs || call.elevenWs.readyState !== WebSocket.OPEN) return;
    call.elevenWs.send(JSON.stringify({ text: `${text} `, try_trigger_generation: true }));
  }

  async function handleUserUtterance(transcript) {
    call.history.push({ role: "user", content: transcript });
    call.fullTranscript.push(`Caller: ${transcript}`);

    const reply = await askClaude(call.ctx.system_prompt || defaultSystemPrompt(call.ctx.agent_id), call.history);
    call.history.push({ role: "assistant", content: reply });
    call.fullTranscript.push(`Agent: ${reply}`);
    speak(reply);
  }

  function defaultSystemPrompt(agentId) {
    return `You are ${(agentId || "an AIMS AI").toUpperCase()}, an AI voice agent for AIMS AI making a phone call. Keep responses short, natural, and conversational — this is a live phone call, not a chat. One or two sentences per turn unless asked for more detail.`;
  }

  twilioWs.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.event === "start") {
      call.streamSid = msg.start.streamSid;
      call.callSid = msg.start.callSid;
      call.startedAt = Date.now();

      const { data: ctx, error } = await supabase
        .from("voice_call_contexts")
        .select("*")
        .eq("id", twilioWs.ctxId)
        .single();

      if (error || !ctx) {
        console.error("Missing voice call context for", twilioWs.ctxId);
        twilioWs.close();
        return;
      }

      call.ctx = ctx;
      call.history.push({ role: "assistant", content: ctx.opening_message });
      call.fullTranscript.push(`Agent: ${ctx.opening_message}`);

      connectDeepgram();
      connectElevenLabs();

      // Give the ElevenLabs socket a moment to open before we speak the opener.
      setTimeout(() => speak(ctx.opening_message), 300);
      return;
    }

    if (msg.event === "media") {
      if (call.deepgramWs && call.deepgramWs.readyState === WebSocket.OPEN) {
        call.deepgramWs.send(Buffer.from(msg.media.payload, "base64"));
      }
      return;
    }

    if (msg.event === "stop") {
      const durationSeconds = call.startedAt ? Math.round((Date.now() - call.startedAt) / 1000) : 0;

      if (call.deepgramWs) call.deepgramWs.close();
      if (call.elevenWs) call.elevenWs.close();

      if (call.ctx) {
        await supabase.from("call_recordings").upsert({
          call_id: call.callSid,
          org_id: call.ctx.org_id,
          agent_id: call.ctx.agent_id,
          campaign_id: call.ctx.campaign_id,
          duration_seconds: durationSeconds,
          transcript: call.fullTranscript.join("\n"),
          status: "completed",
          completed_at: new Date().toISOString(),
        }, { onConflict: "call_id" });

        if (call.ctx.campaign_id && call.ctx.contact_id) {
          await supabase
            .from("campaign_contacts")
            .update({
              status: "completed",
              duration_seconds: durationSeconds,
              updated_at: new Date().toISOString(),
            })
            .eq("campaign_id", call.ctx.campaign_id)
            .eq("contact_id", call.ctx.contact_id);
        }
      }
      return;
    }
  });

  twilioWs.on("close", () => {
    if (call.deepgramWs) call.deepgramWs.close();
    if (call.elevenWs) call.elevenWs.close();
  });
});

server.listen(PORT, () => {
  console.log(`Voice agent listening on port ${PORT}`);
});
