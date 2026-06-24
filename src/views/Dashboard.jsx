import { C, AGENTS, SAMPLE_LEADS, SAMPLE_EVENTS } from "../data.js";
import { AgentAvatar, StatCard, PulsingDot, ChannelBadge, FlywheelBanner } from "../components/utils.jsx";

export default function Dashboard({ leads, setActiveTab, setSelectedLead }) {
  const active  = leads.filter(l => l.stage !== "won" && l.stage !== "lost");
  const won     = leads.filter(l => l.stage === "won");
  const pipeline = active.reduce((s, l) => s + l.value, 0);
  const revenue  = won.reduce((s, l) => s + l.value, 0);
  const hot      = leads.filter(l => l.score >= 75);

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.textPrimary, margin:0, letterSpacing:-0.5 }}>AIMS Command Center</h1>
        <p style={{ color:C.textSecondary, fontSize:12, margin:"4px 0 0" }}>
          Wednesday, June 24, 2026 · Revenue Flywheel: All 4 agents active
        </p>
      </div>

      <FlywheelBanner />

      {/* KPI Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <StatCard label="Active Pipeline"      value={`$${(pipeline/1000).toFixed(0)}K`} sub={`${active.length} live deals`}    icon="📈" color={C.primary} />
        <StatCard label="Revenue Recovered"    value={`$${(revenue/1000).toFixed(0)}K`}  sub={`${won.length} deal(s) closed`}    icon="💰" color={C.green} />
        <StatCard label="Leads in Recovery"    value="47"                                  sub="ARIA sequencing now"                icon="🎯" color="#00B4FF" />
        <StatCard label="AI Touchpoints / 30d" value="1,284"                               sub="↑ 31% engagement"                  icon="⚡" color="#FF6600" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:18 }}>
        {/* Agent Activity */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:22 }}>
          <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Agent Activity — Live</h3>
          {AGENTS.map(a => (
            <div key={a.id} onClick={() => setActiveTab(`agent-${a.id}`)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, marginBottom:6, background:C.surface, border:`1px solid ${C.border}`, cursor:"pointer", transition:"border-color .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <AgentAvatar agentId={a.id} size={34} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:a.color }}>{a.name}</span>
                  <span style={{ fontSize:10, color:C.textMuted }}>— {a.role}</span>
                </div>
                <div style={{ fontSize:11, color:C.textSecondary, marginTop:1 }}>{a.description.substring(0,60)}…</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <PulsingDot color={a.color} />
                  <span style={{ fontSize:9, fontWeight:700, color:a.color }}>{a.direction.toUpperCase()}</span>
                </div>
                <div style={{ display:"flex", gap:3, marginTop:4, justifyContent:"flex-end" }}>
                  {a.channels.map(ch => <ChannelBadge key={ch} channel={ch} />)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Hot Leads */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Hot Leads</h3>
            {hot.map(lead => {
              const a = AGENTS.find(ag => ag.id === lead.assignedTo);
              return (
                <div key={lead.id}
                  onClick={() => { setSelectedLead(lead); setActiveTab("conversations"); }}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:7, marginBottom:5, background:C.surface, border:`1px solid ${C.border}`, cursor:"pointer" }}>
                  <AgentAvatar agentId={lead.assignedTo} size={24} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.name}</div>
                    <div style={{ fontSize:10, color:C.textSecondary }}>${lead.value.toLocaleString()} · {a?.name}</div>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color: lead.score >= 90 ? C.green : C.amber }}>{lead.score}</span>
                </div>
              );
            })}
          </div>

          {/* Today's Calls */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Today's Calls</h3>
            {SAMPLE_EVENTS.filter(e => e.time.includes("Today")).map(ev => {
              const a = AGENTS.find(ag => ag.id === ev.agent);
              return (
                <div key={ev.id} style={{ display:"flex", gap:10, alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
                  <AgentAvatar agentId={ev.agent} size={22} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.textPrimary }}>{ev.title}</div>
                    <div style={{ fontSize:10, color:C.textSecondary }}>{ev.time} · {ev.duration}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
