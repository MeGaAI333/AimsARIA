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
    const { action, contact_name, contact_phone, contact_email, message, voice_id, agent_id } = body;

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

      const res = await fetch("https://api.bland.ai/v1/calls", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("BLAND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: contact_phone,
          task: message,
          voice: voice_id || "june",
          max_duration: 12,
          webhook_url: `${Deno.env.get("API_BASE_URL") || "https://api.example.com"}/webhooks/bland-call`,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Bland API error:", err);
        return new Response(JSON.stringify({ error: err }), {
          status: res.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const data = await res.json();
      return new Response(JSON.stringify({ success: true, call_id: data.call_id }), {
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
