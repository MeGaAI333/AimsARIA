import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
      },
    });
  }

  try {
    const { email, name, role, org_id } = await req.json();

    if (!email || !role || !org_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, role, org_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
        { status: 400, headers: { "Content-Type": "application/json" } }
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
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
