import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const body = await req.json();
    const { voice_id, text } = body;

    if (!voice_id || !text) {
      return new Response(JSON.stringify({ error: "voice_id and text required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const res = await fetch("https://api.bland.ai/v1/speak", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("BLAND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voice_id,
        text,
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
    return new Response(JSON.stringify(data), {
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
