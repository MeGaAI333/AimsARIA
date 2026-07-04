import { useState, useEffect } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar, Badge } from "../components/utils.jsx";
import { getProfile, getLyricPosts, getScheduleRules, createScheduleRule, createLyricPost, updateLyricPost } from "../lib/db.js";
import { supabase } from "../lib/supabase.js";

const LYRIC = AGENTS.find(a => a.id === "lyric");
const GREEN = "#39FF14";

const PLATFORMS = ["All Platforms","Facebook","Instagram","LinkedIn"];
const CONTENT_TYPES = ["Post","Reel Script","Carousel","Email","Newsletter","Blog Post"];
const TONES = ["Authoritative","Educational","Conversational","Urgency-Driven"];
const INDUSTRIES = ["Roofing","Law Firm","Financial Services","Real Estate","MedSpa","HVAC","Plumbing","CPA/Tax","Pest Control","Landscaping","Fence & Gate","Other"];

function buildPrompt({ platform, contentType, industry, topic, tone, profile }) {
  const platformStr = platform === "All Platforms" ? "Facebook, Instagram, and LinkedIn" : platform;
  const brandToneStr = profile?.brand_tone ? (Array.isArray(profile.brand_tone) ? profile.brand_tone.join(", ") : profile.brand_tone) : "";
  const profileCtx = profile ? `\n\nCLIENT PROFILE:\nBusiness: ${profile.business_name||""}\nService Area: ${profile.service_area||""}\nTarget Audience: ${profile.target_audience||""}\nContent Pillars: ${profile.content_pillars||""}\nBrand Tone: ${brandToneStr}\nContent Restrictions: ${profile.restrictions||""}\nRequired Hashtags: ${profile.hashtags||""}\nKey Pain Points: ${profile.pain_points||""}` : "";
  const base = `You are LYRIC — AIMS AI's Content & Brand Voice agent. Write in LYRIC's voice: authoritative but never corporate, industry-fluent, and every piece ends with a clear CTA.\n\nIndustry: ${industry}\nGoal/Topic: ${topic}\nTone: ${tone}\nPlatform: ${platformStr}${profileCtx}\n\n`;
  const imgNote = `\n\nIMAGE PROMPT: On a single plain-text line (no markdown, no asterisks), describe a professional marketing photo that literally depicts the MAIN subject of the copy above — the specific scene, people, or product being discussed, not a generic stock image. One vivid sentence.`;

  // Carousels get one visual PER slide, each matched to that slide's specific message.
  const carouselImgNote = `\n\n[SLIDE IMAGES]\nAfter the slides, list exactly one image description per slide. Each must be a single vivid sentence describing a professional marketing visual that directly matches THAT slide's specific message (not a generic brand photo). Format exactly as:\n1: <visual for slide 1>\n2: <visual for slide 2>\n3: <visual for slide 3>\n4: <visual for slide 4>\n5: <visual for slide 5>\n6: <visual for slide 6>\n7: <visual for slide 7>`;

  if (contentType === "Post") return base + `Write a single social media post for ${platformStr}. Include: a bold hook sentence, 2-3 value points, a strong CTA, and 3-5 relevant hashtags. Keep it under 280 words.` + imgNote;

  if (contentType === "Reel Script") return base + `Write a 45-60 second Reel/TikTok script for ${industry}. Format:\n[0:00-0:05] HOOK (on-screen text + spoken)\n[0:05-0:20] PROBLEM or INSIGHT\n[0:20-0:40] SOLUTION or VALUE\n[0:40-0:55] CTA\n[CAPTION]: Short caption with hashtags` + imgNote;

  if (contentType === "Carousel") return base + `Write an Instagram/LinkedIn carousel for ${industry}. Create 7 slides:\nSlide 1: Title/Hook (big bold claim)\nSlides 2-6: One point each (title + 2-3 bullet points)\nSlide 7: CTA slide` + carouselImgNote;

  if (contentType === "Email") return base + `Write a marketing email for ${industry}.\nSUBJECT: (compelling subject line)\nPREVIEW TEXT: (30-50 chars)\nBODY:\n[Opening — personal/direct]\n[Problem or insight]\n[Solution/offer]\n[Social proof, 1 line]\n[CTA button text and link placeholder]\nKeep under 250 words.` + imgNote;

  if (contentType === "Newsletter") return base + `Write a monthly newsletter for ${industry} clients.\n## SUBJECT LINE:\n## PREVIEW TEXT:\n## SECTION 1 — FEATURED INSIGHT: (150 words)\n## SECTION 2 — INDUSTRY NEWS: (3 brief bullets)\n## SECTION 3 — CLIENT TIP OF THE MONTH: (50 words)\n## SECTION 4 — CTA: (book a call, view services, etc.)` + imgNote;

  if (contentType === "Blog Post") return base + `Write a 600-word SEO-optimized blog post for ${industry}.\nTITLE: (compelling H1)\nMETA DESCRIPTION: (155 chars)\n\nIntro (2 paragraphs)\nH2: [Main point 1]\n[2-3 paragraphs]\nH2: [Main point 2]\n[2-3 paragraphs]\nH2: [Main point 3]\n[2-3 paragraphs]\nConclusion with CTA` + imgNote;

  return base + `Write compelling ${contentType} content.` + imgNote;
}

// Matches the image-prompt marker in any form the model emits:
// [IMAGE PROMPT]:, **IMAGE PROMPT:**, IMAGE PROMPT -, IMAGE_PROMPT:, etc.
const IMG_MARKER = /[*_#>\s]*\[?\s*IMAGE[ _]?PROMPT\s*\]?[*_]*\s*[:：-]?\s*/i;
const SLIDE_MARKER = /[*_#>\s]*\[?\s*SLIDE[ _]?IMAGES\s*\]?[*_]*\s*[:：-]?\s*/i;

function cleanPrompt(s) {
  return s.replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
}

function extractImagePrompt(text, industry, tone) {
  // Capture from the marker up to a blank line, a --- rule, or end of text.
  const re = new RegExp(IMG_MARKER.source + "([\\s\\S]+?)(?:\\n\\s*\\n|\\n\\s*-{3,}|$)", "i");
  const match = text.match(re);
  const base = match && cleanPrompt(match[1]) ? cleanPrompt(match[1])
    : `Professional ${industry} business marketing photo, ${tone.toLowerCase()} style`;
  return `${base}, commercial photography, high quality, cinematic lighting, professional`;
}

// Parse the per-slide image descriptions from the SLIDE IMAGES section of a carousel.
function extractCarouselImagePrompts(text, industry, tone) {
  const section = text.split(SLIDE_MARKER)[1];
  const prompts = [];
  if (section) {
    for (const line of section.split("\n")) {
      const m = line.match(/^\s*(\d+)\s*[:.)\-]\s*(.+)$/);
      if (m && cleanPrompt(m[2])) prompts.push(cleanPrompt(m[2]));
    }
  }
  return prompts.map(p => `${p}, commercial photography, high quality, cinematic lighting, professional`);
}

function imgUrl(prompt, square = false) {
  const seed = Math.floor(Math.random() * 999999);
  const dims = square ? "width=1080&height=1080" : "width=1200&height=630";
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${dims}&nologo=true&model=flux&seed=${seed}`;
}

// Split carousel copy into per-slide { num, title, bullets } for the published-look preview.
// Markdown-aware: handles "Slide 1:", "**Slide 1:**", "## Slide 1", "Slide 1 —", etc.
function parseCarouselSlides(text) {
  // Keep only the slide copy — drop the SLIDE IMAGES description block.
  const body = text.split(SLIDE_MARKER)[0].trim();
  const slides = [];
  const re = /[*_#>\s]*Slide\s+(\d+)\s*[*_]*\s*[:.\-–]?\s*([\s\S]*?)(?=\n[*_#>\s]*Slide\s+\d+\b|$)/gi;
  let m;
  while ((m = re.exec(body)) !== null) {
    const lines = m[2].trim().split("\n")
      .map(l => l.replace(/^[#>\s]+/, "").replace(/\*+/g, "").trim())
      .filter(Boolean);
    const title = lines[0] || "";
    const bullets = lines.slice(1)
      .map(l => l.replace(/^[-•*]\s*/, "").trim())
      .filter(b => b && !/^[-–—*•.\s]+$/.test(b));   // drop junk like "--", "—", empty
    slides.push({ num: parseInt(m[1], 10), title, bullets });
  }
  return slides;
}

const platIcon = { "All Platforms":"🌐", Facebook:"📘", Instagram:"📸", LinkedIn:"💼" };
const typeIcon = { Post:"📝", "Reel Script":"🎬", Carousel:"🎠", Email:"📧", Newsletter:"📰", "Blog Post":"✍️" };

const BRAND_PRESETS = ["#39FF14", "#FF0080", "#00B4FF", "#A855F7", "#F59E0B", "#FF4D4D"];

function CreateScheduleRuleModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [platforms, setPlatforms] = useState([]);
  const [days, setDays] = useState([]);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [allowRecent, setAllowRecent] = useState(false);
  const [saving, setSaving] = useState(false);

  const daysList = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const platformsList = ["Facebook", "Instagram", "LinkedIn", "Twitter", "TikTok"];

  const handleCreate = async () => {
    if (!name.trim() || platforms.length === 0 || days.length === 0) return;
    setSaving(true);
    await onCreate({
      name,
      platforms: platforms.map(p => p.toLowerCase()),
      days_of_week: days,
      time_of_day: time,
      duration_days: duration,
      start_date: startDate,
      allow_recent: allowRecent,
    });
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:520, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.textPrimary }}>Create Schedule Rule</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Rule Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="E.g. Client A - Facebook Afternoons"
              style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6, display:"block" }}>Platforms *</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {platformsList.map(p => (
                <button key={p} onClick={() => setPlatforms(platforms.includes(p) ? platforms.filter(x => x !== p) : [...platforms, p])}
                  style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${platforms.includes(p) ? GREEN : C.border}`, background:platforms.includes(p) ? `${GREEN}15` : "transparent", color:platforms.includes(p) ? GREEN : C.textSecondary, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6, display:"block" }}>Days of Week *</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {daysList.map(d => (
                <button key={d} onClick={() => setDays(days.includes(d) ? days.filter(x => x !== d) : [...days, d])}
                  style={{ padding:"6px 8px", borderRadius:6, border:`1px solid ${days.includes(d) ? C.primary : C.border}`, background:days.includes(d) ? `${C.primary}15` : "transparent", color:days.includes(d) ? C.primary : C.textSecondary, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                  {d.slice(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Duration (days)</label>
              <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} min="1"
                style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
            </div>
          </div>

          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:C.surface, borderRadius:8, border:`1px solid ${C.border}` }}>
            <input type="checkbox" id="allowRecent" checked={allowRecent} onChange={e => setAllowRecent(e.target.checked)}
              style={{ cursor:"pointer", width:16, height:16 }} />
            <label htmlFor="allowRecent" style={{ fontSize:12, color:C.textSecondary, cursor:"pointer", flex:1, margin:0 }}>
              Allow content similar to posts from last 4 months
            </label>
          </div>

          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={handleCreate} disabled={!name.trim() || platforms.length === 0 || days.length === 0 || saving}
              style={{ padding:"9px 20px", borderRadius:8, border:"none", background:GREEN, color:"#000", fontSize:13, fontWeight:700, cursor:"pointer", opacity:(!name.trim() || platforms.length === 0 || days.length === 0 || saving) ? 0.6 : 1 }}>
              {saving ? "Creating..." : "Create Rule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SchedulePostModal({ contentType, platform, topic, generated, onClose, onPublish, onSchedule }) {
  const [mode, setMode] = useState(null); // null | "now" | "later"
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [saving, setSaving] = useState(false);

  const handlePublishNow = async () => {
    setSaving(true);
    await onPublish();
    setSaving(false);
    onClose();
  };

  const handleSchedule = async () => {
    if (!scheduleDate) return;
    setSaving(true);
    await onSchedule(scheduleDate, scheduleTime);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:480, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.textPrimary }}>Publish or Schedule</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        {!mode ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <button onClick={() => setMode("now")}
              style={{ padding:"16px 20px", borderRadius:10, border:`2px solid ${GREEN}`, background:`${GREEN}15`, cursor:"pointer", textAlign:"left" }}>
              <div style={{ fontSize:13, fontWeight:700, color:GREEN, marginBottom:4 }}>🚀 Publish Now</div>
              <div style={{ fontSize:12, color:C.textSecondary }}>Post immediately to {platform} for {contentType}</div>
            </button>
            <button onClick={() => setMode("later")}
              style={{ padding:"16px 20px", borderRadius:10, border:`2px solid ${C.primary}`, background:`${C.primary}15`, cursor:"pointer", textAlign:"left" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.primary, marginBottom:4 }}>📅 Schedule for Later</div>
              <div style={{ fontSize:12, color:C.textSecondary }}>Choose a date and time to post</div>
            </button>
          </div>
        ) : mode === "now" ? (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <h4 style={{ margin:"0 0 12px", fontSize:13, fontWeight:700, color:C.textPrimary }}>Ready to Publish?</h4>
              <p style={{ margin:0, fontSize:12, color:C.textSecondary, lineHeight:1.6 }}>
                Your {contentType} for {platform} will be posted immediately. This action cannot be undone.
              </p>
            </div>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", marginBottom:8 }}>Preview</div>
              <div style={{ fontSize:12, color:C.textSecondary, lineHeight:1.5, maxHeight:120, overflowY:"auto" }}>
                {generated.slice(0, 200)}…
              </div>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setMode(null)} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer" }}>Back</button>
              <button onClick={handlePublishNow} disabled={saving}
                style={{ padding:"9px 20px", borderRadius:8, border:"none", background:GREEN, color:"#000", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving?0.6:1 }}>
                {saving ? "Publishing…" : "Publish Now"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Date *</label>
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Time</label>
              <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
            </div>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", marginBottom:8 }}>Content Type</div>
              <div style={{ fontSize:12, color:C.textSecondary }}>
                {typeIcon[contentType]} {contentType} · {platIcon[platform]} {platform}
              </div>
              <div style={{ fontSize:12, color:C.textPrimary, marginTop:8, fontWeight:600 }}>
                Topic: {topic.slice(0, 50)}{topic.length > 50 ? "…" : ""}
              </div>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setMode(null)} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer" }}>Back</button>
              <button onClick={handleSchedule} disabled={!scheduleDate || saving}
                style={{ padding:"9px 20px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:!scheduleDate||saving?0.6:1 }}>
                {saving ? "Scheduling…" : "Schedule Post"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Pick black or white text for legibility against a given background color.
function readableText(hex) {
  const h = (hex || "").replace("#", "");
  if (h.length < 6) return "#0a0a0a";
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return (0.299*r + 0.587*g + 0.114*b) > 150 ? "#0a0a0a" : "#ffffff";
}

// One finished carousel slide. style: "overlay" | "panel" | "split".
function CarouselSlide({ img, slide, total, bizName, handle, topic, color, style }) {
  const s = slide || { title:"", bullets:[] };
  const isCover = img.slide === 1;
  const isLast = img.slide === total;
  const onColor = readableText(color);
  const overlay = style === "overlay";
  const split = style === "split";
  const textColor = split ? onColor : overlay ? "#fff" : "#eef0f6";
  const subColor = split ? onColor : "#cfd4e2";
  const shadow = overlay ? "0 2px 14px rgba(0,0,0,0.7)" : "none";

  const brandHeader = (
    <>
      <div style={{ position:"absolute", top:16, left:18, display:"flex", alignItems:"center", gap:7, zIndex:4 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:color, boxShadow:`0 0 10px ${color}` }} />
        <span style={{ fontSize:11, fontWeight:800, color:"#fff", letterSpacing:1.5, textTransform:"uppercase", textShadow:"0 1px 4px rgba(0,0,0,0.7)" }}>{bizName}</span>
      </div>
      <div style={{ position:"absolute", top:14, right:16, fontSize:11, fontWeight:800, color:onColor, background:color, padding:"3px 10px", borderRadius:20, zIndex:4 }}>{img.slide}/{total}</div>
    </>
  );

  const body = isCover ? (
    <>
      <div style={{ width:48, height:5, borderRadius:3, background:color, marginBottom:18 }} />
      <div style={{ fontSize: overlay?33:27, fontWeight:900, color:textColor, lineHeight:1.1, letterSpacing:-0.5, textShadow:shadow }}>{s.title || topic}</div>
      {s.bullets[0] && <div style={{ fontSize:15, fontWeight:600, color:subColor, marginTop:16, lineHeight:1.5, textShadow:shadow }}>{s.bullets[0]}</div>}
      <div style={{ marginTop:22, alignSelf:"flex-start", display:"inline-flex", alignItems:"center", gap:8, background:color, color:onColor, padding:"9px 18px", borderRadius:30, fontSize:13, fontWeight:800 }}>Swipe →</div>
    </>
  ) : (
    <>
      {s.title && (
        <div style={{ marginBottom:14 }}>
          <div style={{ width:36, height:4, borderRadius:3, background:color, marginBottom:12 }} />
          <div style={{ fontSize:23, fontWeight:900, color:textColor, lineHeight:1.16, letterSpacing:-0.3, textShadow:shadow }}>{s.title}</div>
        </div>
      )}
      {s.bullets.map((b,i) => (
        <div key={i} style={{ display:"flex", gap:11, alignItems:"flex-start", marginTop:i?13:0 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:color, marginTop:7, flexShrink:0 }} />
          <span style={{ fontSize:15, fontWeight:600, color:textColor, lineHeight:1.45, textShadow:shadow }}>{b}</span>
        </div>
      ))}
      {isLast && (
        <div style={{ marginTop:20, alignSelf:"flex-start", display:"inline-flex", alignItems:"center", gap:8, background:color, color:onColor, padding:"10px 18px", borderRadius:30, fontSize:13, fontWeight:800 }}>{handle} →</div>
      )}
    </>
  );

  if (overlay) {
    return (
      <div style={{ position:"relative", flex:"0 0 100%", aspectRatio:"1 / 1", scrollSnapAlign:"start", background:C.bg, overflow:"hidden" }}>
        <img src={img.url} alt="" loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(165deg, rgba(8,11,28,0.40) 0%, rgba(8,11,28,0.74) 52%, rgba(8,11,28,0.95) 100%)" }} />
        <div style={{ position:"absolute", top:-70, right:-70, width:200, height:200, borderRadius:"50%", background:`radial-gradient(circle, ${color}40, transparent 70%)` }} />
        {brandHeader}
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:isCover?"center":"flex-end", padding:isCover?"40px 32px":"30px 28px", zIndex:2 }}>
          {body}
        </div>
      </div>
    );
  }

  // panel & split: image on top, solid text panel below
  return (
    <div style={{ position:"relative", flex:"0 0 100%", aspectRatio:"1 / 1", scrollSnapAlign:"start", background:C.bg, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <div style={{ position:"relative", height:isCover?"44%":"50%", flexShrink:0 }}>
        <img src={img.url} alt="" loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(to bottom, rgba(8,11,28,0.25), transparent 55%, ${split?color:C.card})` }} />
        {brandHeader}
      </div>
      <div style={{ flex:1, background:split?color:C.card, padding:"24px 26px 26px", display:"flex", flexDirection:"column", justifyContent:isCover?"center":"flex-start", overflow:"hidden" }}>
        {body}
      </div>
    </div>
  );
}

export default function LyricWorkstation({ orgId }) {
  const [tab, setTab]               = useState("create");
  const [platform, setPlatform]     = useState("All Platforms");
  const [contentType, setContentType] = useState("Post");
  const [industry, setIndustry]     = useState("Roofing");
  const [topic, setTopic]           = useState("");
  const [tone, setTone]             = useState("Authoritative");
  const [generated, setGenerated]   = useState("");
  const [imageUrl, setImageUrl]     = useState("");
  const [carouselImages, setCarouselImages] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [copied, setCopied]         = useState(false);
  const [profile, setProfile]       = useState(null);
  const [templateStyle, setTemplateStyle] = useState("overlay");
  const [brandColor, setBrandColor] = useState(GREEN);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [calendarPosts, setCalendarPosts] = useState([]);
  const [scheduleRules, setScheduleRules] = useState([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [calendarDateRange, setCalendarDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  });
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPostForApproval, setSelectedPostForApproval] = useState(null);

  useEffect(() => {
    if (!orgId) return;
    getProfile(orgId).then(p => {
      if (!p) return;
      setProfile(p);
      if (p.industry) {
        const match = INDUSTRIES.find(i => i.toLowerCase() === p.industry.toLowerCase());
        setIndustry(match || "Other");
      }
      if (p.brand_tone) {
        const toneMap = { "Professional":"Authoritative", "Friendly & Casual":"Conversational", "Urgent / Sales-Focused":"Urgency-Driven", "Educational":"Educational" };
        const brandTones = Array.isArray(p.brand_tone) ? p.brand_tone : [p.brand_tone];
        const mappedTone = brandTones.length > 0 ? toneMap[brandTones[0]] || "Authoritative" : "Authoritative";
        setTone(mappedTone);
      }
    }).catch(() => {});
  }, [orgId]);

  // Fetch calendar posts and schedule rules
  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      getLyricPosts(orgId, calendarDateRange.start, calendarDateRange.end),
      getScheduleRules(orgId)
    ]).then(([posts, rules]) => {
      setCalendarPosts(posts || []);
      setScheduleRules(rules || []);
    }).catch(err => console.error("Failed to fetch calendar data:", err));
  }, [orgId, calendarDateRange]);

  // Remember each client's brand color locally so their carousels stay on-brand.
  useEffect(() => {
    if (!orgId) return;
    const saved = localStorage.getItem(`lyric_brand_${orgId}`);
    if (saved) setBrandColor(saved);
  }, [orgId]);

  const changeBrandColor = (c) => {
    setBrandColor(c);
    if (orgId) localStorage.setItem(`lyric_brand_${orgId}`, c);
  };

  const handlePublishNow = async () => {
    // In production, this would trigger actual publishing to social platforms
    // For now, we'll add it to scheduled posts marked as published
    const post = {
      id: Math.random().toString(36).slice(2, 9),
      platform,
      content_type: contentType,
      topic,
      copy: generated,
      status: "published",
      scheduled_at: new Date().toISOString(),
    };
    setScheduledPosts(prev => [post, ...prev]);
  };

  const handleSchedulePost = async (date, time) => {
    const dateTimeStr = `${date}T${time}`;
    const post = {
      id: Math.random().toString(36).slice(2, 9),
      platform,
      content_type: contentType,
      topic,
      copy: generated,
      images: carouselImages.length > 0 ? carouselImages.map(img => img.url) : (imageUrl ? [imageUrl] : []),
      status: "scheduled",
      scheduled_at: dateTimeStr,
      brand_color: brandColor,
    };
    setScheduledPosts(prev => [post, ...prev]);
  };

  const handleCreateScheduleRule = async (ruleData) => {
    if (!orgId) return;
    try {
      const result = await supabase.functions.invoke('generate-calendar-posts', {
        body: { org_id: orgId, ...ruleData, topic, industry, tone, content_type: contentType }
      });
      if (result.data?.posts) {
        setCalendarPosts(prev => [...prev, ...result.data.posts]);
        setShowRuleModal(false);
      }
    } catch (e) {
      console.error("Failed to create schedule rule:", e);
    }
  };

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setGenerated("");
    setImageUrl("");
    setCarouselImages([]);
    setImageLoaded(false);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/call-claude`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body:JSON.stringify({ model:"claude-sonnet-4-6", system:LYRIC.systemPrompt, messages:[{ role:"user", content:buildPrompt({ platform, contentType, industry, topic, tone, profile }) }] }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || (data.error ? `⚠️ ${data.error}` : "Error generating content.");
      setGenerated(text);

      if (contentType === "Carousel") {
        // One visual per slide, each matched to that slide's content.
        const slidePrompts = extractCarouselImagePrompts(text, industry, tone);
        if (slidePrompts.length > 0) {
          setCarouselImages(slidePrompts.map((p, i) => ({ slide: i + 1, url: imgUrl(p, true) })));
        } else {
          setImageUrl(imgUrl(extractImagePrompt(text, industry, tone)));
        }
      } else {
        setImageUrl(imgUrl(extractImagePrompt(text, industry, tone)));
      }
    } catch { setGenerated("⚠️ Connection error. Please try again."); }
    setLoading(false);
  };

  const copy = () => { navigator.clipboard.writeText(generated); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // Remove the IMAGE PROMPT / SLIDE IMAGES blocks (both are appended after the copy)
  // plus any leftover --- separators, so the caption is clean and publish-ready.
  const displayText = generated
    .replace(new RegExp("\\n*" + IMG_MARKER.source + "[\\s\\S]*$", "i"), "")
    .replace(new RegExp("\\n*" + SLIDE_MARKER.source + "[\\s\\S]*$", "i"), "")
    .replace(/\n*\s*-{3,}\s*$/g, "")
    .trim();

  const carouselSlides = carouselImages.length > 0 ? parseCarouselSlides(generated) : [];
  const bizName = profile?.business_name || "Your Business";
  const handle = "@" + (profile?.business_name || "yourbusiness").toLowerCase().replace(/[^a-z0-9]/g, "");
  const isSocial = ["Post", "Reel Script", "Carousel"].includes(contentType);
  const platformLabel = platform === "All Platforms" ? "Instagram" : platform;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"18px 28px 0", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
          <AgentAvatar agentId="lyric" size={40} />
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:GREEN }}>LYRIC Workstation</h2>
            <p style={{ margin:0, fontSize:12, color:C.textSecondary }}>Content studio — create, schedule & publish across every channel</p>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
            <Badge color={GREEN}>🎵 LYRIC</Badge>
            <Badge color={C.green}>● Active</Badge>
            {profile && <Badge color={C.primary}>📋 {profile.business_name||"Profile"} loaded</Badge>}
          </div>
        </div>
        <div style={{ display:"flex", gap:0 }}>
          {["create","calendar","schedule","published","analytics"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:"10px 20px", border:"none", background:"transparent", color:tab===t?GREEN:C.textSecondary, fontSize:13, fontWeight:700, cursor:"pointer", borderBottom:`2px solid ${tab===t?GREEN:"transparent"}`, textTransform:"capitalize" }}>
              {t === "create" ? "✨ Create" : t === "calendar" ? "📅 Calendar" : t === "schedule" ? "📋 Schedule" : t === "published" ? "📡 Published" : "📊 Analytics"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:"hidden" }}>
        {tab === "create" && (
          <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
            {/* Controls */}
            <div style={{ width:280, background:C.sidebar, borderRight:`1px solid ${C.border}`, overflowY:"auto", padding:20, flexShrink:0 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>Platform</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => setPlatform(p)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:7, border:`1px solid ${platform===p?GREEN:C.border}`, background:platform===p?`${GREEN}15`:"transparent", color:platform===p?GREEN:C.textSecondary, fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"left" }}>
                    <span>{platIcon[p]}</span>{p}
                  </button>
                ))}
              </div>

              <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>Content Type</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
                {CONTENT_TYPES.map(ct => (
                  <button key={ct} onClick={() => setContentType(ct)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:7, border:`1px solid ${contentType===ct?GREEN:C.border}`, background:contentType===ct?`${GREEN}15`:"transparent", color:contentType===ct?GREEN:C.textSecondary, fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"left" }}>
                    <span>{typeIcon[ct]}</span>{ct}
                  </button>
                ))}
              </div>

              <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Industry</div>
              <select value={industry} onChange={e => setIndustry(e.target.value)}
                style={{ width:"100%", padding:"8px 10px", borderRadius:7, background:C.card, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", marginBottom:20 }}>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>

              <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Topic / Goal</div>
              <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder={`E.g. "Generate roofing estimate leads before storm season"`} rows={3}
                style={{ width:"100%", padding:"10px", borderRadius:7, background:C.card, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:12, resize:"vertical", outline:"none", marginBottom:20, lineHeight:1.5 }} />

              <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Tone</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${tone===t?GREEN:C.border}`, background:tone===t?`${GREEN}15`:"transparent", color:tone===t?GREEN:C.textMuted, fontSize:10, fontWeight:700, cursor:"pointer" }}>{t}</button>
                ))}
              </div>

              {contentType === "Carousel" && (
                <>
                  <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Template</div>
                  <div style={{ display:"flex", gap:6, marginBottom:20 }}>
                    {[["overlay","Overlay"],["panel","Panel"],["split","Split"]].map(([v,l]) => (
                      <button key={v} onClick={() => setTemplateStyle(v)}
                        style={{ flex:1, padding:"7px 0", borderRadius:7, border:`1px solid ${templateStyle===v?GREEN:C.border}`, background:templateStyle===v?`${GREEN}15`:"transparent", color:templateStyle===v?GREEN:C.textSecondary, fontSize:11, fontWeight:700, cursor:"pointer" }}>{l}</button>
                    ))}
                  </div>
                </>
              )}

              <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Brand Color</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center", marginBottom:24 }}>
                {BRAND_PRESETS.map(c => (
                  <button key={c} onClick={() => changeBrandColor(c)} title={c}
                    style={{ width:24, height:24, borderRadius:"50%", background:c, border:brandColor.toLowerCase()===c.toLowerCase()?"2px solid #fff":`2px solid ${C.border}`, cursor:"pointer", boxShadow:brandColor.toLowerCase()===c.toLowerCase()?`0 0 0 2px ${c}`:"none", padding:0 }} />
                ))}
                <label style={{ display:"inline-flex", alignItems:"center", gap:5, cursor:"pointer" }} title="Custom color">
                  <input type="color" value={brandColor} onChange={e => changeBrandColor(e.target.value)}
                    style={{ width:26, height:26, border:"none", background:"transparent", cursor:"pointer", padding:0 }} />
                  <span style={{ fontSize:10, color:C.textMuted }}>Custom</span>
                </label>
              </div>

              <button onClick={generate} disabled={!topic.trim()||loading}
                style={{ width:"100%", padding:"12px", borderRadius:8, border:"none", background:!topic.trim()||loading?C.border:GREEN, color:!topic.trim()||loading?C.textMuted:"#000", fontSize:14, fontWeight:800, cursor:!topic.trim()||loading?"not-allowed":"pointer" }}>
                {loading ? "✨ Generating…" : `✨ Generate ${contentType}`}
              </button>
            </div>

            {/* Output */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ flex:1, overflowY:"auto", padding:24 }}>
                {!generated && !loading && (
                  <div style={{ textAlign:"center", marginTop:80, color:C.textMuted }}>
                    <div style={{ fontSize:48, marginBottom:16 }}>🎵</div>
                    <div style={{ fontSize:16, color:C.textSecondary, fontWeight:600, marginBottom:8 }}>LYRIC is ready to create</div>
                    <div style={{ fontSize:13, color:C.textMuted }}>Select a platform, content type, and topic — then hit Generate</div>
                  </div>
                )}
                {loading && (
                  <div style={{ textAlign:"center", marginTop:80 }}>
                    <div style={{ fontSize:32, marginBottom:16 }}>🎵</div>
                    <div style={{ fontSize:14, color:GREEN, fontWeight:700 }}>LYRIC is creating your {contentType}…</div>
                    <div style={{ fontSize:12, color:C.textMuted, marginTop:8 }}>Writing copy + generating visual for {industry}</div>
                  </div>
                )}
                {generated && !loading && (
                  <div>
                    {/* Toolbar */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                      <span style={{ fontSize:16 }}>{typeIcon[contentType]}</span>
                      <span style={{ fontSize:14, fontWeight:700, color:C.textPrimary }}>{contentType} — {platform}</span>
                      <span style={{ fontSize:11, color:C.textSecondary }}>· {industry}</span>
                      <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                        <button onClick={copy} style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:copied?C.green:C.textSecondary, fontSize:12, cursor:"pointer", fontWeight:600 }}>{copied?"✓ Copied":"Copy"}</button>
                        <button onClick={generate} style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${GREEN}`, background:`${GREEN}15`, color:GREEN, fontSize:12, cursor:"pointer", fontWeight:700 }}>↺ Regenerate</button>
                        <button onClick={() => setShowScheduleModal(true)} style={{ padding:"6px 14px", borderRadius:6, border:"none", background:GREEN, color:"#000", fontSize:12, cursor:"pointer", fontWeight:700 }}>Schedule →</button>
                      </div>
                    </div>

                    {/* Published Preview — the finished piece as it will appear */}
                    <div style={{ maxWidth:480, margin:"0 auto" }}>
                      <div style={{ borderRadius:16, overflow:"hidden", border:`1px solid ${C.border}`, background:"#fff", boxShadow:"0 10px 34px rgba(0,0,0,0.35)" }}>
                        {/* Post header */}
                        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px" }}>
                          <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg, ${brandColor}, ${C.primary})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"#fff", flexShrink:0 }}>
                            {bizName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:"#111" }}>{bizName}</div>
                            <div style={{ fontSize:11, color:"#888" }}>{handle} · {platformLabel}</div>
                          </div>
                          <span style={{ fontSize:18, color:"#888" }}>⋯</span>
                        </div>

                        {/* Visual */}
                        {carouselImages.length > 0 ? (
                          <div style={{ display:"flex", overflowX:"auto", scrollSnapType:"x mandatory" }}>
                            {carouselImages.map(img => (
                              <CarouselSlide key={img.slide} img={img}
                                slide={carouselSlides.find(s => s.num === img.slide)}
                                total={carouselImages.length}
                                bizName={bizName} handle={handle} topic={topic}
                                color={brandColor} style={templateStyle} />
                            ))}
                          </div>
                        ) : imageUrl ? (
                          <img src={imageUrl} alt="visual" onLoad={() => setImageLoaded(true)}
                            style={{ width:"100%", display:"block", aspectRatio:isSocial?"1 / 1":"1.91 / 1", objectFit:"cover", opacity:imageLoaded?1:0.3, transition:"opacity .5s" }} />
                        ) : null}

                        {/* Engagement bar (social only) */}
                        {isSocial && (
                          <div style={{ display:"flex", alignItems:"center", gap:16, padding:"10px 14px 2px", fontSize:20 }}>
                            <span>♡</span><span>💬</span><span>➤</span>
                            {carouselImages.length > 1 && <span style={{ marginLeft:"auto", fontSize:11, color:"#888" }}>← swipe {carouselImages.length} slides →</span>}
                          </div>
                        )}

                        {/* Caption / body */}
                        <div style={{ padding:isSocial?"6px 14px 16px":"14px 16px 18px" }}>
                          {isSocial && <span style={{ fontSize:13, fontWeight:700, color:"#111", marginRight:6 }}>{handle}</span>}
                          <span style={{ fontSize:13, color:"#222", lineHeight:1.6, whiteSpace:"pre-wrap" }}>
                            {carouselImages.length > 0 ? topic : displayText}
                          </span>
                        </div>
                      </div>

                      {/* Asset downloads under the preview */}
                      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:12, justifyContent:"center" }}>
                        {carouselImages.length > 0
                          ? carouselImages.map(img => (
                              <a key={img.slide} href={img.url} download={`lyric-slide-${img.slide}.jpg`} target="_blank" rel="noreferrer"
                                style={{ fontSize:11, fontWeight:700, color:GREEN, textDecoration:"none", border:`1px solid ${GREEN}`, background:`${GREEN}12`, padding:"5px 10px", borderRadius:6 }}>
                                ↓ Slide {img.slide}
                              </a>
                            ))
                          : imageUrl && (
                              <a href={imageUrl} download="lyric-visual.jpg" target="_blank" rel="noreferrer"
                                style={{ fontSize:11, fontWeight:700, color:GREEN, textDecoration:"none", border:`1px solid ${GREEN}`, background:`${GREEN}12`, padding:"5px 12px", borderRadius:6 }}>
                                ↓ Download Visual
                              </a>
                            )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "calendar" && (
          <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:C.textPrimary }}>Social Calendar</h3>
              <button onClick={() => setShowRuleModal(true)}
                style={{ padding:"8px 16px", borderRadius:8, border:"none", background:GREEN, color:"#000", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                + New Schedule Rule
              </button>
            </div>

            {scheduleRules.length === 0 ? (
              <div style={{ textAlign:"center", paddingTop:60, color:C.textMuted }}>
                <div style={{ fontSize:48, marginBottom:16 }}>📅</div>
                <h4 style={{ margin:"0 0 8px", fontSize:16, fontWeight:700, color:C.textSecondary }}>No Schedule Rules Yet</h4>
                <p style={{ margin:0, fontSize:13, maxWidth:340, lineHeight:1.6 }}>Create a schedule rule to automatically generate and post content on a recurring basis.</p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom:20 }}>
                  <h4 style={{ margin:"0 0 12px", fontSize:13, fontWeight:700, color:C.textSecondary }}>Active Rules</h4>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {scheduleRules.map(rule => (
                      <div key={rule.id} style={{ padding:"12px 14px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>{rule.name}</div>
                        <div style={{ fontSize:11, color:C.textSecondary, marginTop:4 }}>
                          {rule.platforms.join(", ")} • {rule.days_of_week.join(", ")} @ {rule.time_of_day}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin:"0 0 12px", fontSize:13, fontWeight:700, color:C.textSecondary }}>Upcoming Posts ({calendarPosts.length})</h4>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {calendarPosts.slice(0, 10).map(post => {
                      const postDate = new Date(post.scheduled_at);
                      return (
                        <div key={post.id} style={{ padding:"12px 14px", background:C.surface, border:`1px solid ${C.border}`, borderLeft:`4px solid ${post.status === "published" ? C.green : GREEN}`, borderRadius:8 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:C.textPrimary }}>{post.topic.slice(0, 40)}...</div>
                          <div style={{ fontSize:11, color:C.textSecondary, marginTop:4 }}>
                            {postDate.toLocaleDateString()} @ {postDate.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})} • {post.platform} • {post.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "schedule" && (
          <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
            <h3 style={{ margin:"0 0 20px", fontSize:16, fontWeight:700, color:C.textPrimary }}>Scheduled Posts</h3>
            {scheduledPosts.length === 0 ? (
              <div style={{ textAlign:"center", paddingTop:60, color:C.textMuted }}>
                <div style={{ fontSize:48, marginBottom:16 }}>📅</div>
                <h4 style={{ margin:"0 0 8px", fontSize:16, fontWeight:700, color:C.textSecondary }}>No Scheduled Content Yet</h4>
                <p style={{ margin:0, fontSize:13, maxWidth:340, lineHeight:1.6 }}>Generate content in the Create tab and schedule it for publishing. Posts will appear here.</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {scheduledPosts.map((post, i) => {
                  const isPublished = post.status === "published";
                  const isScheduled = post.status === "scheduled";
                  const schedDate = new Date(post.scheduled_at);
                  const dateStr = isPublished ? "Published" : schedDate.toLocaleDateString();
                  const timeStr = schedDate.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
                  return (
                    <div key={post.id} style={{ display:"flex", gap:14, alignItems:"center", padding:"14px 16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:8, borderLeft:`4px solid ${isPublished?C.green:GREEN}` }}>
                      <div style={{ fontSize:24 }}>{platIcon[post.platform]}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>{post.topic.slice(0, 50)}{post.topic.length > 50 ? "…" : ""}</div>
                        <div style={{ fontSize:12, color:C.textSecondary, marginTop:2 }}>
                          {typeIcon[post.content_type]} {post.content_type} · {dateStr}{isScheduled && ` · ${timeStr}`}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <span style={{ fontSize:11, padding:"4px 10px", borderRadius:4, background:isPublished?`${C.green}15`:`${C.amber}15`, color:isPublished?C.green:C.amber, fontWeight:700 }}>
                          {isPublished ? "✓ Published" : "Scheduled"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "published" && (
          <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📡</div>
            <h3 style={{ margin:"0 0 10px", fontSize:18, fontWeight:700, color:C.textPrimary }}>No Published Content Yet</h3>
            <p style={{ color:C.textSecondary, fontSize:13, textAlign:"center", maxWidth:380, lineHeight:1.6, margin:0 }}>
              Content you generate and schedule will appear here once published. Use the Create tab to get started.
            </p>
          </div>
        )}

        {tab === "analytics" && (
          <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
            <h3 style={{ margin:"0 0 20px", fontSize:16, fontWeight:700, color:C.textPrimary }}>Content Analytics — June 2026</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
              {[
                { label:"Posts Published", value:"84",   color:GREEN },
                { label:"Avg Engagement",  value:"4.2%", color:C.amber },
                { label:"Email Open Rate", value:"38%",  color:C.primary },
                { label:"Leads Generated", value:"23",   color:C.green },
              ].map(s => (
                <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11, color:C.textSecondary, marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {[
                { platform:"LinkedIn",  posts:28, engagement:"5.1%", reach:"4,200",      color:C.primary },
                { platform:"Instagram", posts:32, engagement:"6.8%", reach:"8,700",      color:"#FF0080" },
                { platform:"Facebook",  posts:18, engagement:"2.9%", reach:"3,100",      color:C.primary },
                { platform:"Email",     posts:6,  engagement:"38%",  reach:"1,840 opens",color:C.amber },
              ].map(p => (
                <div key={p.platform} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:18 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:p.color, marginBottom:12 }}>{p.platform}</div>
                  <div style={{ display:"flex", gap:20 }}>
                    <div><div style={{ fontSize:18, fontWeight:800, color:C.textPrimary }}>{p.posts}</div><div style={{ fontSize:10, color:C.textMuted }}>Posts</div></div>
                    <div><div style={{ fontSize:18, fontWeight:800, color:p.color }}>{p.engagement}</div><div style={{ fontSize:10, color:C.textMuted }}>Engagement</div></div>
                    <div><div style={{ fontSize:18, fontWeight:800, color:C.textPrimary }}>{p.reach}</div><div style={{ fontSize:10, color:C.textMuted }}>Reach</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showRuleModal && (
          <CreateScheduleRuleModal
            onClose={() => setShowRuleModal(false)}
            onCreate={handleCreateScheduleRule}
          />
        )}

        {showScheduleModal && (
          <SchedulePostModal
            contentType={contentType}
            platform={platform}
            topic={topic}
            generated={generated}
            onClose={() => setShowScheduleModal(false)}
            onPublish={handlePublishNow}
            onSchedule={handleSchedulePost}
          />
        )}
      </div>
    </div>
  );
}
