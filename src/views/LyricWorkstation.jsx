import { useState, useEffect } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar, Badge } from "../components/utils.jsx";
import { getProfile } from "../lib/db.js";

const LYRIC = AGENTS.find(a => a.id === "lyric");
const GREEN = "#39FF14";

const PLATFORMS = ["All Platforms","Facebook","Instagram","LinkedIn"];
const CONTENT_TYPES = ["Post","Reel Script","Carousel","Email","Newsletter","Blog Post"];
const TONES = ["Authoritative","Educational","Conversational","Urgency-Driven"];
const INDUSTRIES = ["Roofing","Law Firm","Financial Services","Real Estate","MedSpa","HVAC","Plumbing","CPA/Tax","Pest Control","Landscaping","Fence & Gate","Other"];

function buildPrompt({ platform, contentType, industry, topic, tone, profile }) {
  const platformStr = platform === "All Platforms" ? "Facebook, Instagram, and LinkedIn" : platform;
  const profileCtx = profile ? `\n\nCLIENT PROFILE:\nBusiness: ${profile.business_name||""}\nService Area: ${profile.service_area||""}\nTarget Audience: ${profile.target_audience||""}\nContent Pillars: ${profile.content_pillars||""}\nBrand Tone: ${profile.brand_tone||""}\nContent Restrictions: ${profile.restrictions||""}\nRequired Hashtags: ${profile.hashtags||""}\nKey Pain Points: ${profile.pain_points||""}` : "";
  const base = `You are LYRIC — AIMS AI's Content & Brand Voice agent. Write in LYRIC's voice: authoritative but never corporate, industry-fluent, and every piece ends with a clear CTA.\n\nIndustry: ${industry}\nGoal/Topic: ${topic}\nTone: ${tone}\nPlatform: ${platformStr}${profileCtx}\n\n`;
  const imgNote = `\n\n[IMAGE PROMPT]: Write a single sentence describing a professional marketing visual to accompany this content. Be specific about the scene, style, and mood.`;

  if (contentType === "Post") return base + `Write a single social media post for ${platformStr}. Include: a bold hook sentence, 2-3 value points, a strong CTA, and 3-5 relevant hashtags. Keep it under 280 words.` + imgNote;

  if (contentType === "Reel Script") return base + `Write a 45-60 second Reel/TikTok script for ${industry}. Format:\n[0:00-0:05] HOOK (on-screen text + spoken)\n[0:05-0:20] PROBLEM or INSIGHT\n[0:20-0:40] SOLUTION or VALUE\n[0:40-0:55] CTA\n[CAPTION]: Short caption with hashtags` + imgNote;

  if (contentType === "Carousel") return base + `Write an Instagram/LinkedIn carousel for ${industry}. Create 7 slides:\nSlide 1: Title/Hook (big bold claim)\nSlides 2-6: One point each (title + 2-3 bullet points)\nSlide 7: CTA slide` + imgNote;

  if (contentType === "Email") return base + `Write a marketing email for ${industry}.\nSUBJECT: (compelling subject line)\nPREVIEW TEXT: (30-50 chars)\nBODY:\n[Opening — personal/direct]\n[Problem or insight]\n[Solution/offer]\n[Social proof, 1 line]\n[CTA button text and link placeholder]\nKeep under 250 words.` + imgNote;

  if (contentType === "Newsletter") return base + `Write a monthly newsletter for ${industry} clients.\n## SUBJECT LINE:\n## PREVIEW TEXT:\n## SECTION 1 — FEATURED INSIGHT: (150 words)\n## SECTION 2 — INDUSTRY NEWS: (3 brief bullets)\n## SECTION 3 — CLIENT TIP OF THE MONTH: (50 words)\n## SECTION 4 — CTA: (book a call, view services, etc.)` + imgNote;

  if (contentType === "Blog Post") return base + `Write a 600-word SEO-optimized blog post for ${industry}.\nTITLE: (compelling H1)\nMETA DESCRIPTION: (155 chars)\n\nIntro (2 paragraphs)\nH2: [Main point 1]\n[2-3 paragraphs]\nH2: [Main point 2]\n[2-3 paragraphs]\nH2: [Main point 3]\n[2-3 paragraphs]\nConclusion with CTA` + imgNote;

  return base + `Write compelling ${contentType} content.` + imgNote;
}

function extractImagePrompt(text, industry, tone) {
  const match = text.match(/\[IMAGE PROMPT\][:\s]+(.+?)(?:\n|$)/i);
  const base = match ? match[1].trim() : `Professional ${industry} business marketing photo, ${tone.toLowerCase()} style`;
  return `${base}, commercial photography, high quality, cinematic lighting, professional`;
}

const platIcon = { "All Platforms":"🌐", Facebook:"📘", Instagram:"📸", LinkedIn:"💼" };
const typeIcon = { Post:"📝", "Reel Script":"🎬", Carousel:"🎠", Email:"📧", Newsletter:"📰", "Blog Post":"✍️" };
export default function LyricWorkstation({ orgId }) {
  const [tab, setTab]               = useState("create");
  const [platform, setPlatform]     = useState("All Platforms");
  const [contentType, setContentType] = useState("Post");
  const [industry, setIndustry]     = useState("Roofing");
  const [topic, setTopic]           = useState("");
  const [tone, setTone]             = useState("Authoritative");
  const [generated, setGenerated]   = useState("");
  const [imageUrl, setImageUrl]     = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [copied, setCopied]         = useState(false);
  const [profile, setProfile]       = useState(null);

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
        setTone(toneMap[p.brand_tone] || "Authoritative");
      }
    }).catch(() => {});
  }, [orgId]);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setGenerated("");
    setImageUrl("");
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

      // Generate image from extracted prompt
      const imgPrompt = extractImagePrompt(text, industry, tone);
      const seed = Math.floor(Math.random() * 999999);
      setImageUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=1200&height=630&nologo=true&model=flux&seed=${seed}`);
    } catch { setGenerated("⚠️ Connection error. Please try again."); }
    setLoading(false);
  };

  const copy = () => { navigator.clipboard.writeText(generated); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // Strip the [IMAGE PROMPT] line from displayed text
  const displayText = generated.replace(/\[IMAGE PROMPT\][:\s]+.+(\n|$)/i, "").trim();

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
          {["create","schedule","published","analytics"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:"10px 20px", border:"none", background:"transparent", color:tab===t?GREEN:C.textSecondary, fontSize:13, fontWeight:700, cursor:"pointer", borderBottom:`2px solid ${tab===t?GREEN:"transparent"}`, textTransform:"capitalize" }}>
              {t === "create" ? "✨ Create" : t === "schedule" ? "📅 Schedule" : t === "published" ? "📡 Published" : "📊 Analytics"}
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
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:24 }}>
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${tone===t?GREEN:C.border}`, background:tone===t?`${GREEN}15`:"transparent", color:tone===t?GREEN:C.textMuted, fontSize:10, fontWeight:700, cursor:"pointer" }}>{t}</button>
                ))}
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
                    {!apiKey && <div style={{ fontSize:11, color:C.amber, marginTop:20, padding:"10px 18px", background:`${C.amber}15`, border:`1px solid ${C.amber}30`, borderRadius:8, display:"inline-block" }}>⚠️ API key required — add it in Settings</div>}
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
                        <button style={{ padding:"6px 14px", borderRadius:6, border:"none", background:GREEN, color:"#000", fontSize:12, cursor:"pointer", fontWeight:700 }}>Schedule →</button>
                      </div>
                    </div>

                    {/* Generated Image */}
                    {imageUrl && (
                      <div style={{ marginBottom:20, borderRadius:12, overflow:"hidden", border:`1px solid ${GREEN}30`, background:C.card, position:"relative" }}>
                        <div style={{ fontSize:10, fontWeight:800, color:GREEN, textTransform:"uppercase", letterSpacing:1, padding:"10px 14px", borderBottom:`1px solid ${C.border}`, background:C.surface }}>
                          🖼 AI-Generated Visual
                          {!imageLoaded && <span style={{ marginLeft:8, color:C.textMuted, fontWeight:400 }}>Generating…</span>}
                        </div>
                        <img
                          src={imageUrl}
                          alt="AI generated visual"
                          onLoad={() => setImageLoaded(true)}
                          style={{ width:"100%", display:"block", maxHeight:400, objectFit:"cover", opacity:imageLoaded?1:0.3, transition:"opacity .5s" }}
                        />
                        {imageLoaded && (
                          <div style={{ padding:"8px 14px", display:"flex", justifyContent:"flex-end", gap:8 }}>
                            <a href={imageUrl} download="lyric-visual.jpg" target="_blank" rel="noreferrer"
                              style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${GREEN}`, background:`${GREEN}15`, color:GREEN, fontSize:11, fontWeight:700, cursor:"pointer", textDecoration:"none" }}>
                              ↓ Download
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generated Text */}
                    <div style={{ background:C.card, border:`1px solid ${GREEN}25`, borderRadius:10, padding:24 }}>
                      <pre style={{ margin:0, fontFamily:"inherit", fontSize:13, color:C.textPrimary, lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{displayText}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "schedule" && (
          <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
            <h3 style={{ margin:"0 0 20px", fontSize:16, fontWeight:700, color:C.textPrimary }}>Content Calendar — June 2026</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, background:C.border, borderRadius:10, overflow:"hidden" }}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} style={{ background:C.surface, padding:"10px 8px", textAlign:"center", fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.5 }}>{d}</div>
              ))}
              {Array.from({ length:30 }, (_,i) => {
                const day = i + 1;
                const hasContent = [2,5,9,12,15,16,19,22,23,26,29].includes(day);
                const types = ["📱","📧","📲","✍️"];
                return (
                  <div key={day} style={{ background:C.card, padding:10, minHeight:80, cursor:hasContent?"pointer":"default" }}>
                    <div style={{ fontSize:12, fontWeight:600, color:day===24?GREEN:C.textSecondary, marginBottom:6 }}>{day}</div>
                    {hasContent && (
                      <div style={{ fontSize:10, padding:"3px 6px", borderRadius:4, background:`${GREEN}15`, color:GREEN, fontWeight:700, display:"inline-block" }}>
                        {types[day%4]} Scheduled
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:24 }}>
              <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Upcoming Scheduled Posts</h3>
              {[
                { date:"Jun 25", platform:"LinkedIn",  type:"Post",      title:"3 Signs Your Follow-Up System Is Broken",  time:"9:00 AM" },
                { date:"Jun 26", platform:"Instagram", type:"Reel",      title:"Cold Lead Recovery in 60 Seconds",          time:"11:00 AM" },
                { date:"Jun 28", platform:"Email",     type:"Newsletter", title:"July Strategy Preview — What's Coming",    time:"8:00 AM" },
                { date:"Jun 30", platform:"Facebook",  type:"Post",      title:"Why Speed-to-Lead Wins in Home Services",   time:"10:00 AM" },
              ].map((p, i) => (
                <div key={i} style={{ display:"flex", gap:14, alignItems:"center", padding:"12px 16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:8, marginBottom:8 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:C.textMuted, width:50, flexShrink:0 }}>{p.date}</div>
                  <div style={{ fontSize:12, color:C.textMuted, width:60, flexShrink:0 }}>{p.time}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.primary, width:80, flexShrink:0 }}>{p.platform}</div>
                  <div style={{ flex:1, fontSize:13, color:C.textPrimary }}>{p.title}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <span style={{ fontSize:10, padding:"3px 8px", borderRadius:4, background:`${C.amber}15`, color:C.amber, fontWeight:700 }}>{p.type}</span>
                    <button style={{ fontSize:11, padding:"3px 10px", borderRadius:4, border:`1px solid ${C.red}`, background:"transparent", color:C.red, cursor:"pointer" }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
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
      </div>
    </div>
  );
}
