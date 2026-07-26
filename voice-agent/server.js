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
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TRANSFER_PHONE_NUMBER = process.env.TRANSFER_PHONE_NUMBER;
const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || "America/New_York";

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

// Injected at the front of every call's prompt so the agent can reference
// specific upcoming day names ("how does Thursday sound?") instead of only
// vague relative terms — Deepgram has no built-in notion of "today."
function todayContext() {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long", timeZone: BUSINESS_TIMEZONE });
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: BUSINESS_TIMEZONE });
  return `Today is ${dayName}, ${dateStr}. Use this to reference specific upcoming days by name (e.g. "Today is Tuesday — how does Thursday sound?") instead of vague relative terms like "in a few days."`;
}

// Redirects the live Twilio call to a real phone number, ending the AI
// bridge — this is a genuine live transfer, not a warm handoff message.
async function transferToHuman(callSid, reason) {
  if (!callSid || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return "Transfer is not available right now.";
  if (!TRANSFER_PHONE_NUMBER) {
    console.error("Transfer requested but TRANSFER_PHONE_NUMBER is not configured. Reason:", reason);
    return "I'm not able to transfer you right now, but let's get something scheduled instead.";
  }
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  // TRANSFER_PHONE_NUMBER may be a comma-separated list — <Dial> rings all
  // of them simultaneously and connects whoever picks up first.
  const numbers = TRANSFER_PHONE_NUMBER.split(",").map(n => n.trim()).filter(Boolean);
  const dialTargets = numbers.map(n => `<Number>${n}</Number>`).join("");
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Dial>${dialTargets}</Dial></Response>`;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls/${callSid}.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ Twiml: twiml }).toString(),
  });
  if (!res.ok) {
    console.error("Error transferring call:", await res.text());
    return "I wasn't able to transfer the call — let's keep going.";
  }
  return "Transferring you now.";
}

// Books the review directly onto the org's Calendar (events table) —
// Melody has no calendar of her own, this just tags the event as hers.
async function scheduleAppointment(ctx, { date, time }) {
  if (!date) return "I need a specific date to book that.";
  const { error } = await supabase.from("events").insert({
    org_id: ctx.org_id || "default",
    title: "Profit Leak Review",
    date,
    time: time || "",
    duration: "15 min",
    type: "call",
    contact_name: ctx.contact_name || "",
    agent: "melody",
  });
  if (error) {
    console.error("Error booking appointment:", error);
    return "I had trouble booking that — let's try a different day or time.";
  }
  return `Booked for ${date}${time ? " at " + time : ""}.`;
}

// Actually texts the Profit Leak Analysis link — not just a promise to.
// contact_id/org_id ride along in the link's query string so the response
// (a public, unauthenticated form submission) ties back to the right CRM
// contact and org.
async function sendAnalysisLink(ctx) {
  if (!ctx.contact_phone) return "I don't have a number on file to text that to.";
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error("send_analysis_link called but Twilio SMS is not configured.");
    return "I'm not able to text that right now, but let's get something scheduled instead.";
  }
  const link = `${VOICE_AGENT_BASE_URL}/analysis?c=${ctx.contact_id || ""}&org=${ctx.org_id || ""}`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      From: TWILIO_PHONE_NUMBER,
      To: ctx.contact_phone,
      Body: `Here's your Profit Leak Analysis from AIMS AI: ${link}`,
    }).toString(),
  });
  if (!res.ok) {
    console.error("Error texting analysis link:", await res.text());
    return "I had trouble sending that text — let's try again in a moment.";
  }
  return "Sent it to your phone just now.";
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
      if (settingsMessage.agent?.think?.prompt) {
        settingsMessage.agent.think.prompt = `${todayContext()}\n\n${settingsMessage.agent.think.prompt}`;
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
          // TEMPORARY: log the exact raw shape Deepgram sends — every
          // format guessed from docs/SDK types has been rejected as
          // UNPARSABLE_CLIENT_MESSAGE, so stop guessing and read the real
          // wire data instead.
          console.log("[debug] raw FunctionCallRequest:", JSON.stringify(msg));

          // Newer Deepgram schema nests calls in a `functions` array
          // (per @deepgram/agent's AgentV1FunctionCallRequest.Functions.Item);
          // fall back to older flat fields in case that's what's live here.
          const fc = (msg.functions && msg.functions[0]) || msg;
          const call_id = fc.id || fc.function_call_id || msg.function_call_id || msg.id;
          const fnName = fc.name || fc.function_name || msg.function_name || msg.name;
          let args = fc.arguments ?? fc.input ?? msg.input ?? msg.arguments ?? {};
          if (typeof args === "string") {
            try { args = JSON.parse(args); } catch { args = {}; }
          }

          (async () => {
            let content = "ok";
            try {
              if (fnName === "transfer_to_human") {
                content = await transferToHuman(call.callSid, args.reason);
              } else if (fnName === "schedule_appointment") {
                content = await scheduleAppointment(call.ctx, args);
              } else if (fnName === "send_analysis_link") {
                content = await sendAnalysisLink(call.ctx);
              }
            } catch (err) {
              // Deepgram waits indefinitely for a FunctionCallResponse — an
              // uncaught error here would leave the agent silent for the
              // rest of the call instead of just this one function failing.
              console.error(`Error running function "${fnName}":`, err);
              content = "I ran into a problem with that just now — let's keep going.";
            }

            // Deepgram's expected schema is function_call_id + output (no
            // "name" field) — confirmed against deepgram/voice-agent-function-calling's
            // reference client.py after the previous {name, content} shape
            // was silently rejected server-side (UNPARSABLE_CLIENT_MESSAGE),
            // which is why every function call left the agent dead silent.
            // The live request came back as {type, functions: [{id, name,
            // arguments, client_side}]}, not the flat {function_call_id,
            // function_name} shape every doc/reference implementation
            // described — the flat {function_call_id, output} response
            // built from that wrong assumption was rejected too. Mirroring
            // the request's own array-wrapped shape here, with both
            // "content" and "output" set since which one is actually read
            // is still unconfirmed.
            // Deepgram's own docs consistently describe this as a FLAT
            // object with "id" (not function_call_id, not array-wrapped
            // like the request) — try that exact documented shape now that
            // two structurally different guesses have both failed.
            const responseMsg = {
              type: "FunctionCallResponse",
              id: call_id,
              name: fnName,
              content,
            };
            console.log("[debug] sending FunctionCallResponse:", JSON.stringify(responseMsg));
            dg.send(JSON.stringify(responseMsg));

            if (fnName === "end_conversation") {
              setTimeout(() => hangupCall(call.callSid), 2500);
            }
          })();
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
