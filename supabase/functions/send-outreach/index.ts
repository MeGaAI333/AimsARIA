import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const body = await req.json();
    const { action, contact_id, contact_name, contact_phone, contact_email, message, agent_id, campaign_id, org_id } = body;

    if (!action || !message) {
      return new Response(JSON.stringify({ error: "action and message required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (action === "call") {
      if (!contact_phone) {
        return new Response(JSON.stringify({ error: "phone required for calls" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const twilio_sid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilio_auth = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilio_from = Deno.env.get("TWILIO_PHONE_NUMBER");
      const voiceAgentBaseUrl = Deno.env.get("VOICE_AGENT_BASE_URL"); // e.g. https://aimsai.aimsmarketingsystems.com

      if (!twilio_sid || !twilio_auth || !twilio_from || !voiceAgentBaseUrl) {
        return new Response(JSON.stringify({ error: "Twilio or voice agent not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      // Stash call context for the voice-agent service to read once Twilio connects.
      // Twilio's TwiML webhook is a bare HTTP request with no room to carry a full
      // script + agent persona, so we hand it a row id instead.
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // opening_message is a fallback only — agents with a Deepgram Voice Agent
      // config (agent_voice_configs) speak from their own greeting/prompt instead.
      const { data: ctx, error: ctxError } = await supabase
        .from("voice_call_contexts")
        .insert({
          org_id: org_id || null,
          agent_id: agent_id || "aria",
          campaign_id: campaign_id || null,
          contact_id: contact_id || null,
          contact_name: contact_name || null,
          contact_phone,
          opening_message: message,
          direction: "outbound",
        })
        .select()
        .single();

      if (ctxError || !ctx) {
        console.error("Error storing voice call context:", ctxError);
        return new Response(JSON.stringify({ error: "Failed to prepare call context" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const auth = btoa(`${twilio_sid}:${twilio_auth}`);
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio_sid}/Calls.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: contact_phone,
          From: twilio_from,
          Url: `${voiceAgentBaseUrl}/voice/outbound?ctx=${ctx.id}`,
          StatusCallback: `${voiceAgentBaseUrl}/voice/status?ctx=${ctx.id}`,
          StatusCallbackEvent: "completed",
          Method: "POST",
        }).toString(),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Twilio Voice API error:", err);
        return new Response(JSON.stringify({ error: err }), {
          status: res.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const data = await res.json();
      return new Response(JSON.stringify({ success: true, call_id: data.sid }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (action === "text") {
      const twilio_sid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilio_auth = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilio_from = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!twilio_sid || !twilio_auth || !twilio_from) {
        return new Response(JSON.stringify({ error: "Twilio not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      if (!contact_phone) {
        return new Response(JSON.stringify({ error: "phone required for texts" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const auth = btoa(`${twilio_sid}:${twilio_auth}`);
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio_sid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: twilio_from,
          To: contact_phone,
          Body: message,
        }).toString(),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Twilio API error:", err);
        return new Response(JSON.stringify({ error: err }), {
          status: res.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const data = await res.json();
      return new Response(JSON.stringify({ success: true, message_id: data.sid }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (action === "email") {
      if (!contact_email) {
        return new Response(JSON.stringify({ error: "email required for emails" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM_EMAIL") || "noreply@aims.ai",
          to: contact_email,
          subject: `Message from ${agent_id || "AIMS"}`,
          html: `<p>${message.replace(/\n/g, "<br>")}</p>`,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Resend API error:", err);
        return new Response(JSON.stringify({ error: err }), {
          status: res.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const data = await res.json();
      return new Response(JSON.stringify({ success: true, email_id: data.id }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
