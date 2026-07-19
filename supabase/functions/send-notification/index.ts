import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") || "";
  const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "noreply@aimscenter.com";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const { user_email, subject, event_type, data, org_id } = await req.json();

    if (!user_email || !subject || !event_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Get user notification preferences
    const { data: settings } = await supabase
      .from("org_settings")
      .select("notification_preferences")
      .eq("org_id", org_id)
      .single();

    const prefs = settings?.notification_preferences || {};

    // Check if user has disabled this notification type
    if (prefs[event_type] === false) {
      return new Response(JSON.stringify({ message: "Notification disabled" }), { status: 200 });
    }

    // Build email content
    let htmlContent = "";
    switch (event_type) {
      case "lead_stage_changed":
        htmlContent = `
          <h2>Lead Pipeline Update</h2>
          <p><strong>${data.lead_name}</strong> has moved to <strong>${data.new_stage}</strong></p>
          <p>Deal Value: $${Number(data.deal_value).toLocaleString()}</p>
          <p><a href="${data.dashboard_url}">View in Pipeline</a></p>
        `;
        break;
      case "post_published":
        htmlContent = `
          <h2>Content Published 🎉</h2>
          <p>Your LYRIC post has been published to ${data.platforms.join(", ")}</p>
          <p><strong>${data.post_title}</strong></p>
          <p><a href="${data.dashboard_url}">View Published Posts</a></p>
        `;
        break;
      case "task_assigned":
        htmlContent = `
          <h2>New Task Assigned</h2>
          <p><strong>${data.task_title}</strong></p>
          <p>Due: ${new Date(data.due_date).toLocaleDateString()}</p>
          <p><a href="${data.dashboard_url}">View Task</a></p>
        `;
        break;
      case "communication_failed":
        htmlContent = `
          <h2>Communication Failed ⚠️</h2>
          <p>Failed to reach <strong>${data.contact_name}</strong> via ${data.channel}</p>
          <p>Error: ${data.error_message}</p>
          <p><a href="${data.dashboard_url}">View Communication Logs</a></p>
        `;
        break;
      case "agent_escalation":
        htmlContent = `
          <h2>Agent Escalation</h2>
          <p>Conversation with <strong>${data.contact_name}</strong> needs human attention</p>
          <p>Agent: ${data.agent_name}</p>
          <p><a href="${data.dashboard_url}">View Conversation</a></p>
        `;
        break;
      default:
        htmlContent = `<p>${data.message || "Event notification"}</p>`;
    }

    // Send via SendGrid if configured
    if (SENDGRID_API_KEY) {
      const sendgridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: user_email }],
            subject: subject,
          }],
          from: { email: SENDER_EMAIL, name: "AIMS Command Center" },
          content: [{
            type: "text/html",
            value: `
              <html>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    ${htmlContent}
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999;">
                      You're receiving this because you're an admin or assigned to this account.
                      <a href="${data.dashboard_url}#settings" style="color: #0066cc;">Manage notification preferences</a>
                    </p>
                  </div>
                </body>
              </html>
            `,
          }],
        }),
      });

      if (!sendgridResponse.ok) {
        const error = await sendgridResponse.json();
        console.error("SendGrid error:", error);
        throw new Error(`SendGrid error: ${error.errors?.[0]?.message || "Unknown error"}`);
      }
    }

    // Log notification to database
    const { error: logError } = await supabase.from("notifications").insert([{
      org_id,
      user_email,
      event_type,
      subject,
      data,
      sent_at: new Date().toISOString(),
      status: "sent",
    }]);

    if (logError) console.error("Notification log error:", logError);

    return new Response(JSON.stringify({ success: true, message: "Notification sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notification function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
