import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // Get all failed posts that haven't exceeded max retries and are past backoff time
    const now = new Date();
    const { data: failedPosts, error: postsError } = await supabase
      .from("lyric_posts")
      .select("*")
      .eq("status", "failed")
      .lt("retry_count", 3) // Max 3 retries
      .or(`backoff_until.is.null,backoff_until.lt.${now.toISOString()}`) // Past backoff period
      .order("updated_at", { ascending: true })
      .limit(10);

    if (postsError) throw postsError;

    if (!failedPosts || failedPosts.length === 0) {
      return new Response(JSON.stringify({ message: "No failed posts to retry" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const post of failedPosts) {
      try {
        // Get Buffer token from org settings
        const { data: settings } = await supabase
          .from("org_settings")
          .select("buffer_token")
          .eq("org_id", post.org_id)
          .single();

        if (!settings?.buffer_token) {
          // Can't retry without buffer token
          await supabase
            .from("lyric_posts")
            .update({
              status: "failed",
              error_message: "Buffer token not configured",
              retry_count: (post.retry_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", post.id);

          results.push({ id: post.id, success: false, reason: "No buffer token" });
          continue;
        }

        // Retry posting to Buffer
        const bufferResponse = await fetch("https://api.bufferapp.com/1/updates/create.json", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            access_token: settings.buffer_token,
            profile_ids: post.profile_ids?.join(",") || "",
            text: post.text || "",
            ...(post.image && { media: { link: post.image } }),
            scheduled_at: Math.floor(new Date(post.scheduled_at).getTime() / 1000).toString(),
          }).toString(),
        });

        const bufferData = await bufferResponse.json();

        if (bufferResponse.ok && bufferData.success) {
          // Success - mark as published
          await supabase
            .from("lyric_posts")
            .update({
              status: "published",
              buffer_id: bufferData.buffer_id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", post.id);

          results.push({ id: post.id, success: true });
        } else {
          // Still failed - increment retry count with exponential backoff
          const newRetryCount = (post.retry_count || 0) + 1;
          const shouldDiscard = newRetryCount >= 3;
          // Exponential backoff: 2^retryCount minutes (2, 4, 8 minutes)
          const backoffMinutes = Math.pow(2, newRetryCount);
          const backoffUntil = new Date(Date.now() + backoffMinutes * 60 * 1000);

          await supabase
            .from("lyric_posts")
            .update({
              status: shouldDiscard ? "discarded" : "failed",
              error_message: bufferData.message || "Buffer API error",
              retry_count: newRetryCount,
              backoff_until: shouldDiscard ? null : backoffUntil.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", post.id);

          results.push({
            id: post.id,
            success: false,
            reason: bufferData.message || "Buffer error",
            retryCount: newRetryCount,
            discarded: shouldDiscard,
          });
        }
      } catch (error) {
        const newRetryCount = (post.retry_count || 0) + 1;
        const shouldDiscard = newRetryCount >= 3;
        const backoffMinutes = Math.pow(2, newRetryCount);
        const backoffUntil = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await supabase
          .from("lyric_posts")
          .update({
            status: shouldDiscard ? "discarded" : "failed",
            error_message: error.message,
            retry_count: newRetryCount,
            backoff_until: shouldDiscard ? null : backoffUntil.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        results.push({
          id: post.id,
          success: false,
          reason: error.message,
          retryCount: newRetryCount,
          discarded: shouldDiscard,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Retry attempt complete",
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Retry function error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
