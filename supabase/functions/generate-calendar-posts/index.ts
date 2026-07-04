import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface GenerateRequest {
  org_id: string;
  name: string;
  platforms: string[];
  days_of_week: string[];
  time_of_day: string;
  duration_days: number;
  start_date: string;
  topic: string;
  industry: string;
  tone: string;
  content_type: string;
}

// Helper: Get day of week number (0=Sunday, 1=Monday, etc.)
function getDayNum(dayName: string): number {
  const days: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return days[dayName.toLowerCase()] || 0;
}

// Generate all scheduled dates for the rule
function getScheduledDates(
  startDate: Date,
  durationDays: number,
  daysOfWeek: string[],
  timeOfDay: string
): Date[] {
  const dates: Date[] = [];
  const [hours, minutes] = timeOfDay.split(":").map(Number);

  for (let i = 0; i < durationDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();

    if (
      daysOfWeek.some((dow) => getDayNum(dow) === dayOfWeek)
    ) {
      date.setHours(hours, minutes, 0, 0);
      dates.push(new Date(date));
    }
  }

  return dates;
}

// Call Claude to generate post content
async function generatePostContent(
  topic: string,
  industry: string,
  tone: string,
  platform: string,
  contentType: string
): Promise<string> {
  const prompt = `Generate a ${contentType} for ${platform} about "${topic}" for the ${industry} industry. Tone: ${tone}. Keep it concise and engaging.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
    },
    body: JSON.stringify({
      model: "claude-opus-4-1",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json() as any;
  return data.content?.[0]?.text || "Generated content";
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const body = (await req.json()) as GenerateRequest;
    const {
      org_id,
      name,
      platforms,
      days_of_week,
      time_of_day,
      duration_days,
      start_date,
      topic,
      industry,
      tone,
      content_type,
    } = body;

    // Generate schedule dates
    const startDt = new Date(start_date);
    const scheduledDates = getScheduledDates(
      startDt,
      duration_days,
      days_of_week,
      time_of_day
    );

    // Create schedule rule
    const { data: rule, error: ruleError } = await supabase
      .from("schedule_rules")
      .insert([
        {
          org_id,
          name,
          platforms,
          days_of_week,
          time_of_day,
          duration_days,
          start_date,
        },
      ])
      .select()
      .single();

    if (ruleError) throw ruleError;

    // Generate a post for each scheduled date
    const posts = [];
    for (const schedDate of scheduledDates) {
      // Generate content for this post
      const copy = await generatePostContent(
        topic,
        industry,
        tone,
        platforms[0],
        content_type
      );

      // Create lyric post
      const { data: post, error: postError } = await supabase
        .from("lyric_posts")
        .insert([
          {
            org_id,
            content_type,
            platform: platforms[0],
            topic,
            copy,
            images: [],
            status: "draft",
            scheduled_at: schedDate.toISOString(),
          },
        ])
        .select()
        .single();

      if (postError) throw postError;
      posts.push(post);
    }

    return new Response(
      JSON.stringify({ rule, posts, count: posts.length }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
