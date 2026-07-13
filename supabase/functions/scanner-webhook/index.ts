// scanner-webhook — receives scored leads from the AIMS website scanner
// (aims-scanner/step3_score_leads.py) and inserts/updates them as contacts.
//
// URL: https://<project>.supabase.co/functions/v1/scanner-webhook?org_id=<org_id>
// Auth: optional shared secret via the `x-scanner-secret` header, checked
// against the SCANNER_WEBHOOK_SECRET env var if that var is set.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-scanner-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const requiredSecret = Deno.env.get("SCANNER_WEBHOOK_SECRET");
  if (requiredSecret) {
    const providedSecret = req.headers.get("x-scanner-secret");
    if (providedSecret !== requiredSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const lead = await req.json();

    if (!lead.name) {
      return new Response(JSON.stringify({ error: "Missing required field: name" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id") || "aims-internal";

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const combinedScore = Number(lead.combined_score) || 0;
    const contactRecord = {
      org_id: orgId,
      name: lead.name,
      company: lead.name,
      phone: lead.phone || null,
      industry: lead.vertical || null,
      stage: "cold",
      value: 0,
      score: Math.round(combinedScore * 10), // scanner scores 0-10 -> CRM's 0-100 scale
      source: "aims-scanner",
      assigned_to: "allegra",
      tags: [lead.vertical, lead.allegra_tier].filter(Boolean),
    };

    // Dedupe by phone within the org, since the scanner may rescan the same city later
    let existing = null;
    if (lead.phone) {
      const { data } = await supabase
        .from("contacts")
        .select("id")
        .eq("org_id", orgId)
        .eq("phone", lead.phone)
        .limit(1)
        .maybeSingle();
      existing = data;
    }

    let contact;
    if (existing) {
      const { data, error } = await supabase
        .from("contacts")
        .update(contactRecord)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      contact = data;
    } else {
      const { data, error } = await supabase
        .from("contacts")
        .insert([contactRecord])
        .select()
        .single();
      if (error) throw error;
      contact = data;
    }

    const noteLines = [
      lead.website ? `Website: ${lead.website}` : null,
      lead.address ? `Address: ${lead.address}` : null,
      lead.fit_reason ? `Fit: ${lead.fit_reason}` : null,
      lead.warmth_reason ? `Warmth: ${lead.warmth_reason}` : null,
      lead.suggested_opener ? `Suggested opener: ${lead.suggested_opener}` : null,
    ].filter(Boolean);

    if (noteLines.length > 0) {
      await supabase.from("notes").insert([{
        org_id: orgId,
        contact_id: contact.id,
        contact_name: contact.name,
        content: noteLines.join("\n"),
        author: "AIMS Scanner",
        role: "system",
      }]);
    }

    return new Response(JSON.stringify({ status: existing ? "updated" : "created", contact_id: contact.id }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("scanner-webhook error:", error);
    return new Response(JSON.stringify({ error: String(error?.message || error) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
