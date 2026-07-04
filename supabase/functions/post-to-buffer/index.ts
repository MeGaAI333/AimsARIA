import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface PostRequest {
  lyric_post_id: string;
  org_id: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const { lyric_post_id, org_id } = (await req.json()) as PostRequest;

    // Fetch the lyric post
    const { data: post, error: fetchError } = await supabase
      .from("lyric_posts")
      .select("*")
      .eq("id", lyric_post_id)
      .single();

    if (fetchError || !post) {
      throw new Error("Post not found");
    }

    // Fetch org settings to get Buffer token
    const { data: settings, error: settingsError } = await supabase
      .from("org_settings")
      .select("buffer_api_token")
      .eq("org_id", org_id)
      .single();

    if (settingsError || !settings?.buffer_api_token) {
      throw new Error("Buffer token not configured");
    }

    // Format for Buffer API
    // Note: This is a simplified example. Real Buffer integration would need:
    // - Proper image upload to Buffer
    // - Multiple platform support
    // - Scheduled time handling
    const bufferPayload = {
      posts: [
        {
          text: post.copy,
          media: post.images?.[0]
            ? {
                link: post.images[0],
              }
            : undefined,
          service: ["facebook", "instagram", "linkedin", "twitter"],
          publish_now: true,
        },
      ],
    };

    // Call Buffer API
    const bufferResponse = await fetch(
      "https://api.bufferapp.com/1/updates/create.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...bufferPayload,
          access_token: settings.buffer_api_token,
        }),
      }
    );

    if (!bufferResponse.ok) {
      const errorData = await bufferResponse.text();
      throw new Error(`Buffer API error: ${errorData}`);
    }

    const bufferData = await bufferResponse.json() as any;

    // Update post status
    const { error: updateError } = await supabase
      .from("lyric_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        buffer_post_id: bufferData.success ? bufferData.id : null,
      })
      .eq("id", lyric_post_id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Posted to Buffer successfully",
        buffer_response: bufferData,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error posting to Buffer:", error);

    // Update post with error status
    try {
      const { lyric_post_id } = (await req.json()) as PostRequest;
      await supabase
        .from("lyric_posts")
        .update({
          status: "failed",
          error_message: String(error),
        })
        .eq("id", lyric_post_id);
    } catch {}

    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
