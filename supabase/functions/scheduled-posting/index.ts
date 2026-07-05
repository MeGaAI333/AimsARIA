import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface ScheduledPost {
  id: string;
  org_id: string;
  platform: string;
  copy: string;
  images: string[];
  status: string;
  scheduled_at: string;
  buffer_post_id: string | null;
}

serve(async (req) => {
  try {
    // This function is called by Supabase's cron job scheduler
    // It runs periodically to check for posts that should be published

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

    // Fetch all posts that should have been published in the last 5 minutes
    // but haven't been posted yet (status = 'pending_approval')
    const { data: posts, error: fetchError } = await supabase
      .from("lyric_posts")
      .select("*")
      .eq("status", "pending_approval")
      .gte("scheduled_at", fiveMinutesAgo.toISOString())
      .lte("scheduled_at", now.toISOString());

    if (fetchError) throw fetchError;

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No posts to publish", checked_at: now.toISOString() }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const results = [];
    for (const post of posts) {
      try {
        // Fetch the org's Buffer token
        const { data: settings, error: settingsError } = await supabase
          .from("org_settings")
          .select("buffer_api_token")
          .eq("org_id", post.org_id)
          .single();

        if (settingsError || !settings?.buffer_api_token) {
          // No Buffer token — mark as failed
          await supabase
            .from("lyric_posts")
            .update({
              status: "failed",
              error_message: "No Buffer API token configured for organization",
            })
            .eq("id", post.id);

          results.push({ post_id: post.id, status: "failed", reason: "No Buffer token" });
          continue;
        }

        // Format for Buffer API and post
        const bufferPayload = {
          posts: [
            {
              text: post.copy,
              media: post.images && post.images.length > 0
                ? { link: post.images[0] }
                : undefined,
              service: [post.platform.toLowerCase() === "all platforms" ? ["facebook", "instagram", "linkedin", "twitter"] : post.platform.toLowerCase()],
              scheduled_at: Math.floor(new Date(post.scheduled_at).getTime() / 1000),
            },
          ],
        };

        // Call Buffer API
        const bufferResponse = await fetch(
          "https://api.bufferapp.com/1/updates/create.json",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

        // Update post status to published
        await supabase
          .from("lyric_posts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            buffer_post_id: bufferData.success ? bufferData.id : null,
          })
          .eq("id", post.id);

        results.push({ post_id: post.id, status: "published", buffer_id: bufferData.id });
      } catch (error) {
        // Mark post as failed
        await supabase
          .from("lyric_posts")
          .update({
            status: "failed",
            error_message: String(error),
          })
          .eq("id", post.id);

        results.push({ post_id: post.id, status: "failed", reason: String(error) });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${posts.length} posts`,
        results,
        checked_at: now.toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scheduled posting error:", error);
    return new Response(
      JSON.stringify({ error: String(error), timestamp: new Date().toISOString() }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
