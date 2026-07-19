import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const body = await req.json();
    console.log("Bland webhook received:", body);

    const { call_id, phone_number, duration_seconds, completed, analysis, recording, transcript, metadata } = body;
    const campaign_id = metadata?.campaign_id || null;

    if (!call_id || !phone_number) {
      return new Response(JSON.stringify({ error: "Missing call_id or phone_number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store call recording
    const { data: call_record, error: recordError } = await supabase
      .from("call_recordings")
      .upsert({
        call_id,
        org_id: body.org_id || "default",
        agent_id: metadata?.agent_id || body.agent_id || "aria",
        campaign_id,
        duration_seconds: duration_seconds || 0,
        transcript: transcript || null,
        recording_url: recording?.url || null,
        status: completed ? "completed" : "in_progress",
        completed_at: completed ? new Date().toISOString() : null,
      }, { onConflict: "call_id" })
      .select()
      .single();

    if (recordError) {
      console.error("Error storing call record:", recordError);
    } else {
      console.log("Call record stored:", call_record.id);
    }

    // Update the matching campaign_contacts row so campaign results roll up
    if (campaign_id && phone_number) {
      const { data: contactMatch } = await supabase
        .from("contacts")
        .select("id")
        .eq("phone", phone_number)
        .limit(1)
        .maybeSingle();

      if (contactMatch) {
        await supabase
          .from("campaign_contacts")
          .update({
            status: completed ? "completed" : "no_answer",
            duration_seconds: duration_seconds || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("campaign_id", campaign_id)
          .eq("contact_id", contactMatch.id);
      }
    }

    return new Response(JSON.stringify({ success: true, stored: !!call_record }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
