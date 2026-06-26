import { useState, useRef, useEffect } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar, Badge, ChannelBadge, PulsingDot } from "../components/utils.jsx";
import { supabase } from "../lib/supabase.js";

function useOrgStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    async function load() {
      const [
        { data: contacts },
        { data: tasks },
        { data: notes },
        { data: events },
      ] = await Promise.all([
        supabase.from("contacts").select("stage, source, value"),
        supabase.from("tasks").select("done, status"),
        supabase.from("notes").select("id"),
        supabase.from("events").select("id"),
      ]);
      const c = contacts || [];
      const t = tasks || [];
      const byStage = s => c.filter(x => x.stage === s).length;
      const wonCount  = byStage("won");
      const lostCount = byStage("lost");
      const wonDeals  = c.filter(x => x.stage === "won" && x.value);
      setStats({
        totalContacts: c.length,
        cold:          byStage("cold"),
        contacted:     byStage("contacted"),
        qualified:     byStage("qualified"),
        negotiating:   byStage("negotiating"),
        won:           wonCount,
        lost:          lostCount,
        closeRate:     (wonCount + lostCount) > 0 ? Math.round(wonCount / (wonCount + lostCount) * 100) + "%" : "—",
        avgDealSize:   wonDeals.length > 0 ? "$" + Math.round(wonDeals.reduce((s, x) => s + x.value, 0) / wonDeals.length).toLocaleString() : "—",
        tasksDone:     t.filter(x => x.done || x.status === "completed").length,
        tasksPending:  t.filter(x => !x.done && x.status !== "completed").length,
        notesCount:    (notes || []).length,
        eventsCount:   (events || []).length,
      });
    }
    load();
  }, []);
  return stats;
}

function agentKpis(agentId, stats) {
  if (!stats) return null;
  switch (agentId) {
    case "aria":   return [
      { label: "Total Contacts",  val: stats.totalContacts },
      { label: "Cold Leads",      val: stats.cold },
      { label: "Contacted",       val: stats.contacted },
      { label: "Qualified",       val: stats.qualified },
    ];
    case "melody": return [
      { label: "Negotiating",     val: stats.negotiating },
      { label: "Won",             val: stats.won },
      { label: "Close Rate",      val: stats.closeRate },
      { label: "Avg Deal Size",   val: stats.avgDealSize },
    ];
    case "lyric":  return [
      { label: "Total Contacts",  val: stats.totalContacts },
      { label: "Notes Created",   val: stats.notesCount },
      { label: "Tasks Done",      val: stats.tasksDone },
      { label: "Tasks Pending",   val: stats.tasksPending },
    ];
    case "muse":   return [
      { label: "Total Contacts",  val: stats.totalContacts },
      { label: "Qualified",       val: stats.qualified },
      { label: "Won",             val: stats.won },
      { label: "Upcoming Events", val: stats.eventsCount },
    ];
    default: return [];
  }
}

function LiveChat({ agent }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { id:Date.now(), role:"user", content:input };
    setMsgs(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/call-claude`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body:JSON.stringify({ model:"claude-sonnet-4-6", system:agent.systemPrompt, messages:[...msgs, userMsg].map(m => ({ role:m.role, content:m.content })) }),
      });
      const data = await res.json();
      setMsgs(prev => [...prev, { id:Date.now()+1, role:"assistant", content:data.content?.[0]?.text || "⚠️ " + (data.error || "Error") }]);
    } catch { setMsgs(prev => [...prev, { id:Date.now()+1, role:"assistant", content:"⚠️ Connection error." }]); }
    setLoading(false);
  };

  return (
    <div style={{ background:C.card, border:`1px solid ${agent.color}30`, borderRadius:12, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, background:`${agent.color}08` }}>
        <AgentAvatar agentId={agent.id} size={28} />
        <div>
          <span style={{ fontSize:13, fontWeight:700, color:agent.color }}>{agent.name}</span>
          <span style={{ fontSize:11, color:C.textMuted }}> — Live Chat</span>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
          <PulsingDot color={agent.color} />
          <span style={{ fontSize:10, fontWeight:700, color:agent.color }}>ACTIVE</span>
        </div>
      </div>
      <div style={{ height:280, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:8 }}>
        {msgs.length === 0 && (
          <div style={{ textAlign:"center", color:C.textMuted, marginTop:60 }}>
            <div style={{ fontSize:28 }}>{agent.avatar}</div>
            <div style={{ fontSize:12, marginTop:8 }}>{agent.description}</div>
            {!apiKey && <div style={{ fontSize:11, color:C.amber, marginTop:12 }}>⚠️ Add API key in Settings to activate</div>}
          </div>
        )}
        {msgs.map(m => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start" }}>
              <div style={{ maxWidth:"80%", padding:"8px 12px", borderRadius:isUser?"12px 12px 4px 12px":"12px 12px 12px 4px", background:isUser ? agent.color : C.surface, border:isUser?"none":`1px solid ${agent.color}25`, color:C.textPrimary, fontSize:13, lineHeight:1.5 }}>{m.content}</div>
            </div>
          );
        })}
        {loading && <div style={{ padding:"8px 12px", borderRadius:"12px 12px 12px 4px", background:C.surface, border:`1px solid ${agent.color}25`, color:C.textMuted, fontSize:20, letterSpacing:4, width:"fit-content" }}>···</div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`, display:"flex", gap:8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}
          placeholder={`Ask ${agent.name} anything…`}
          style={{ flex:1, padding:"8px 12px", borderRadius:6, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
        <button onClick={send} disabled={!input.trim()||loading||!apiKey}
          style={{ padding:"8px 16px", borderRadius:6, border:"none", background:!input.trim()||loading||!apiKey ? C.border:agent.color, color:"#fff", fontSize:13, fontWeight:700, cursor:!input.trim()||loading||!apiKey?"not-allowed":"pointer" }}>
          {loading?"…":"Send"}
        </button>
      </div>
    </div>
  );
}

export default function AgentPage({ agentId, setActiveTab, orgId, role }) {
  const agent = AGENTS.find(a => a.id === agentId);
  const stats = useOrgStats();
  if (!agent) return <div style={{ padding:40, color:C.textMuted }}>Agent not found.</div>;

  const kpis = agentKpis(agentId, stats);

  return (
    <div style={{ overflowY:"auto", height:"100%", padding:"28px 32px" }}>
      {/* Hero */}
      <div style={{ background:C.card, border:`1px solid ${agent.color}30`, borderRadius:16, padding:"28px 32px", marginBottom:24, backgroundImage:`radial-gradient(ellipse at top right, ${agent.color}08 0%, transparent 60%)` }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:20 }}>
          <AgentAvatar agentId={agentId} size={72} />
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
              <h1 style={{ margin:0, fontSize:28, fontWeight:900, color:agent.color, letterSpacing:-1 }}>{agent.name}</h1>
              <Badge color={agent.color}>{agent.direction}</Badge>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:"auto" }}>
                <PulsingDot color={agent.color} />
                <span style={{ fontSize:12, fontWeight:700, color:agent.color }}>LIVE</span>
              </div>
            </div>
            <div style={{ fontSize:14, color:C.textSecondary, marginBottom:4 }}>{agent.full}</div>
            <div style={{ fontSize:13, color:agent.color, fontWeight:600, marginBottom:12 }}>{agent.role}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {agent.channels.map(ch => <ChannelBadge key={ch} channel={ch} />)}
              {agent.voiceProfile.map(v => <Badge key={v} color={agent.color}>{v}</Badge>)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:20, marginBottom:20 }}>
        {/* Brand Voice */}
        <div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:22, marginBottom:16 }}>
            <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Brand Voice</h3>
            <div style={{ padding:"10px 14px", borderRadius:8, background:`${agent.color}10`, border:`1px solid ${agent.color}25`, marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:800, color:agent.color, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Tone</div>
              <div style={{ fontSize:13, color:C.textPrimary, fontWeight:600 }}>{agent.brandVoice.tone}</div>
            </div>
            <div style={{ fontSize:12, color:C.textSecondary, lineHeight:1.6, marginBottom:14 }}>{agent.brandVoice.style}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:C.green, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>✓ DO</div>
                {agent.brandVoice.doList.map((d, i) => <div key={i} style={{ fontSize:11, color:C.textSecondary, marginBottom:6, paddingLeft:10, borderLeft:`2px solid ${C.green}` }}>{d}</div>)}
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:C.red, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>✕ DON'T</div>
                {agent.brandVoice.dontList.map((d, i) => <div key={i} style={{ fontSize:11, color:C.textSecondary, marginBottom:6, paddingLeft:10, borderLeft:`2px solid ${C.red}` }}>{d}</div>)}
              </div>
            </div>
            <div style={{ marginTop:14, padding:"12px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10, fontWeight:800, color:agent.color, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Example</div>
              <div style={{ fontSize:12, color:C.textPrimary, fontStyle:"italic", lineHeight:1.6 }}>"{agent.brandVoice.example}"</div>
            </div>
          </div>

          {/* Capabilities */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:22 }}>
            <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Capabilities</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {agent.capabilities.map((cap, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"8px 10px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}` }}>
                  <span style={{ color:agent.color, fontSize:12, marginTop:1, flexShrink:0 }}>◆</span>
                  <span style={{ fontSize:12, color:C.textSecondary, lineHeight:1.4 }}>{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: KPIs + Campaigns + Chat */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* KPIs — live from Supabase, org-specific */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:C.textPrimary }}>Live Activity</h3>
              <span style={{ fontSize:10, color:C.textMuted }}>Your data only</span>
            </div>
            {!kpis ? (
              <div style={{ textAlign:"center", padding:"20px 0", color:C.textMuted, fontSize:12 }}>Loading…</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {kpis.map(({ label, val }) => (
                  <div key={label} style={{ padding:"12px 14px", borderRadius:8, background:C.surface, border:`1px solid ${agent.color}25`, textAlign:"center" }}>
                    <div style={{ fontSize:22, fontWeight:800, color:agent.color }}>{val}</div>
                    <div style={{ fontSize:10, color:C.textMuted, marginTop:4 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Chat */}
          <LiveChat agent={agent} />
        </div>
      </div>
    </div>
  );
}
