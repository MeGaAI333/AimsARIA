import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Applied to every response, not just the OPTIONS preflight — a response
// missing these headers gets silently blocked by the browser before the
// caller's code ever sees it, surfacing as a generic "Failed to send a
// request to the Edge Function" even when the server actually succeeded.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, name, role, org_id, org_name, parent_org_id } = await req.json();

    if (!email || !role || !org_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, role, org_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure the org (or location) exists before creating a user for it —
    // every org_id column in the schema is a foreign key against
    // organizations, so this has to happen first or every later insert for
    // a brand-new org_id (contacts, tasks, campaigns, ...) would fail.
    // ignoreDuplicates so inviting a second person to an existing org never
    // clobbers its name/parent — only the first invite for a given org_id
    // sets those.
    const { error: orgError } = await supabase
      .from("organizations")
      .upsert(
        { id: org_id, name: org_name || org_id, parent_org_id: parent_org_id || null },
        { onConflict: "id", ignoreDuplicates: true }
      );

    if (orgError) {
      console.error("Error upserting organization:", orgError);
      return new Response(
        JSON.stringify({ error: orgError.message || "Failed to set up organization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with invite email
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: false, // Send invite email
      user_metadata: {
        role: role,
        org_id: org_id,
        display_name: name || "",
      },
    });

    if (error) {
      console.error("Error creating user:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Failed to create user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trigger invite email via Supabase Auth
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email.toLowerCase(),
      {
        redirectTo: `${Deno.env.get("SUPABASE_URL")}/auth/v1/callback`,
      }
    );

    if (inviteError) {
      console.error("Error sending invite:", inviteError);
      // User was created but invite failed - still return success since user exists
      console.log("User created but invite email may have failed");
    }

    return new Response(
      JSON.stringify({
        message: "User invited successfully",
        user: {
          id: data.user?.id,
          email: data.user?.email,
          role: role,
          org_id: org_id,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
