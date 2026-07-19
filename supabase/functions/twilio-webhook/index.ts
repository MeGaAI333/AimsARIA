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
    const formData = await req.formData();
    const messageFrom = formData.get("From");
    const messageTo = formData.get("To");
    const messageBody = formData.get("Body");
    const messageSid = formData.get("MessageSid");

    console.log("Twilio webhook received - From:", messageFrom, "SID:", messageSid);

    if (!messageSid || !messageFrom || !messageBody) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find contact by phone number
    const { data: contacts } = await supabase
      .from("contacts")
      .select("*")
      .eq("phone", messageFrom)
      .limit(1);

    const contact = contacts?.[0];
    const contactId = contact?.id || null;
    const contactName = contact?.name || messageFrom;
    const orgId = contact?.org_id || "default";

    // Create or get conversation in needs_human state (incoming message)
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("*")
      .eq("contact_id", contactId || messageSid)
      .in("status", ["needs_human", "human_active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let conversation;
    if (existingConv) {
      // Append to existing conversation
      const messages = [...(existingConv.messages || []), {
        id: Date.now(),
        role: "user",
        channel: "text",
        ts: new Date().toISOString(),
        content: messageBody,
      }];

      const { data: updated } = await supabase
        .from("conversations")
        .update({
          messages,
          status: "needs_human",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConv.id)
        .select()
        .single();

      conversation = updated;
    } else {
      // Create new conversation
      const { data: created } = await supabase
        .from("conversations")
        .insert([{
          contact_id: contactId,
          contact_name: contactName,
          contact_phone: messageFrom,
          org_id: orgId,
          agent_id: "twilio",
          status: "needs_human",
          channel: "text",
          messages: [{
            id: Date.now(),
            role: "user",
            channel: "text",
            ts: new Date().toISOString(),
            content: messageBody,
          }],
        }])
        .select()
        .single();

      conversation = created;
    }

    // Log as communication
    if (conversation) {
      const { error: logError } = await supabase
        .from("communication_logs")
        .insert([{
          org_id: orgId,
          contact_id: contactId || null,
          contact_name: contactName,
          contact_phone: messageFrom,
          agent_id: "inbound",
          channel: "text",
          message: messageBody,
          status: "received",
          external_id: messageSid,
        }]);

      if (logError) {
        console.error("Error logging communication:", logError);
      }
    }

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 200,
        headers: { "Content-Type": "application/xml" },
      }
    );
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error</Message></Response>`,
      {
        status: 500,
        headers: { "Content-Type": "application/xml" },
      }
    );
  }
});
