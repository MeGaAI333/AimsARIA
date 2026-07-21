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
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function xmlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Twilio does not forward URL query parameters for <Connect><Stream> (unlike
// the legacy one-way <Start><Stream>) — it strips them silently, so ctx has
// to travel as a <Parameter> instead. It arrives in the WebSocket's "start"
// event as start.customParameters.ctx rather than in the connection URL.
function streamTwiml(ctxId) {
  const wssUrl = `${VOICE_AGENT_BASE_URL.replace(/^http/, "ws")}/voice/stream`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${xmlEscape(wssUrl)}">
      <Parameter name="ctx" value="${xmlEscape(ctxId)}" />
    </Stream>
  </Connect>
</Response>`;
}

async function hangupCall(callSid) {
  if (!callSid || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls/${callSid}.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ Status: "completed" }).toString(),
  }).catch(err => console.error("Error hanging up call:", err.message));
}

// Twilio hits this right after an outbound call (originated by send-outreach) connects.
app.post("/voice/outbound", (req, res) => {
  const ctxId = req.query.ctx;
  if (!ctxId) return res.status(400).send("Missing ctx");
  res.type("text/xml").send(streamTwiml(ctxId));
});

// Twilio hits this when someone calls in to a number pointed at an inbound agent (e.g. MUSE).
app.post("/voice/incoming", async (req, res) => {
  try {
    const fromNumber = req.body.From;

    const { data: ctx, error } = await supabase
      .from("voice_call_contexts")
      .insert({
        org_id: null,
        agent_id: "muse",
        contact_phone: fromNumber,
        opening_message: "",
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
          org_id: ctx.org_id || "default",
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
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

// Looks up the org-specific config first, falls back to the global default for that agent.
async function loadAgentSettings(agentId, orgId) {
  const { data: rows } = await supabase
    .from("agent_voice_configs")
    .select("settings, org_id")
    .eq("agent_id", agentId)
    .or(`org_id.eq.${orgId || "__none__"},org_id.is.null`);

  if (!rows || rows.length === 0) return null;
  const orgSpecific = rows.find(r => r.org_id === orgId);
  return orgSpecific ? orgSpecific.settings : rows.find(r => r.org_id === null)?.settings || rows[0].settings;
}

function personalize(text, contactName) {
  if (!text) return text;
  return text.replace(/\{\{name\}\}/g, contactName || "there");
}

wss.on("connection", (twilioWs) => {
  const call = {
    streamSid: null,
    callSid: null,
    ctx: null,
    deepgramWs: null,
    startedAt: null,
    fullTranscript: [],
    ended: false,
  };

  async function finalizeCall() {
    if (call.ended) return;
    call.ended = true;

    const durationSeconds = call.startedAt ? Math.round((Date.now() - call.startedAt) / 1000) : 0;
    if (call.deepgramWs && call.deepgramWs.readyState === WebSocket.OPEN) call.deepgramWs.close();

    if (call.ctx) {
      await supabase.from("call_recordings").upsert({
        call_id: call.callSid,
        org_id: call.ctx.org_id || "default",
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
          .update({ status: "completed", duration_seconds: durationSeconds, updated_at: new Date().toISOString() })
          .eq("campaign_id", call.ctx.campaign_id)
          .eq("contact_id", call.ctx.contact_id);
      }
    }
  }

  function connectDeepgramAgent(settings) {
    const dg = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", {
      headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` },
    });

    dg.on("open", () => {
      // Force the audio format to match Twilio exactly (mulaw/8000 both ways)
      // regardless of what was captured while testing in Deepgram's console,
      // so no transcoding is needed on either side of this bridge.
      const settingsMessage = {
        ...settings,
        audio: {
          input: { encoding: "mulaw", sample_rate: 8000 },
          output: { encoding: "mulaw", sample_rate: 8000, container: "none" },
        },
      };
      if (settingsMessage.agent?.greeting) {
        settingsMessage.agent.greeting = personalize(settingsMessage.agent.greeting, call.ctx.contact_name);
      }
      dg.send(JSON.stringify(settingsMessage));
    });

    dg.on("message", (raw, isBinary) => {
      if (isBinary) {
        sendAudioToTwilio(raw.toString("base64"));
        return;
      }

      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      switch (msg.type) {
        case "ConversationText":
          call.fullTranscript.push(`${msg.role === "user" ? "Caller" : "Agent"}: ${msg.content}`);
          break;
        case "UserStartedSpeaking":
          clearTwilioPlayback();
          break;
        case "FunctionCallRequest": {
          const call_id = msg.function_call_id || msg.id;
          dg.send(JSON.stringify({
            type: "FunctionCallResponse",
            function_call_id: call_id,
            name: msg.function_name || msg.name,
            content: "ok",
          }));
          if ((msg.function_name || msg.name) === "end_conversation") {
            setTimeout(() => hangupCall(call.callSid), 2500);
          }
          break;
        }
        case "Error":
          console.error("Deepgram agent error:", msg);
          break;
        default:
          break;
      }
    });

    dg.on("error", (err) => console.error("Deepgram agent connection error:", err.message));
    dg.on("close", () => finalizeCall());

    call.deepgramWs = dg;
  }

  function sendAudioToTwilio(payloadBase64) {
    if (!call.streamSid) return;
    twilioWs.send(JSON.stringify({ event: "media", streamSid: call.streamSid, media: { payload: payloadBase64 } }));
  }

  function clearTwilioPlayback() {
    if (!call.streamSid) return;
    twilioWs.send(JSON.stringify({ event: "clear", streamSid: call.streamSid }));
  }

  twilioWs.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.event === "start") {
      call.streamSid = msg.start.streamSid;
      call.callSid = msg.start.callSid;
      call.startedAt = Date.now();
      const ctxId = msg.start.customParameters?.ctx;

      const { data: ctx, error } = await supabase
        .from("voice_call_contexts")
        .select("*")
        .eq("id", ctxId)
        .single();

      if (error || !ctx) {
        console.error("Missing voice call context for", ctxId);
        twilioWs.close();
        return;
      }
      call.ctx = ctx;

      const settings = await loadAgentSettings(ctx.agent_id, ctx.org_id);
      if (!settings) {
        console.error(`No Deepgram voice config found for agent "${ctx.agent_id}"`);
        twilioWs.close();
        return;
      }

      connectDeepgramAgent(settings);
      return;
    }

    if (msg.event === "media") {
      if (call.deepgramWs && call.deepgramWs.readyState === WebSocket.OPEN) {
        call.deepgramWs.send(Buffer.from(msg.media.payload, "base64"));
      }
      return;
    }

    if (msg.event === "stop") {
      await finalizeCall();
      return;
    }
  });

  twilioWs.on("close", () => finalizeCall());
});

server.listen(PORT, () => {
  console.log(`Voice agent listening on port ${PORT}`);
});
