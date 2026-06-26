import { useState, useEffect } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar, StatCard, PulsingDot, ChannelBadge, FlywheelBanner } from "../components/utils.jsx";
import { supabase } from "../lib/supabase.js";

function useDashboardData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    async function load() {
      const [{ data: contacts }, { data: events }] = await Promise.all([
        supabase.from("contacts").select("id, name, company, stage, source, value, industry"),
        supabase.from("events").select("id, title, start_time, agent").order("start_time", { ascending: true }).limit(10),
      ]);
      const c = contacts || [];
      const e = events || [];
      const active = c.filter(x => x.stage !== "won" && x.stage !== "lost");
      const won    = c.filter(x => x.stage === "won");
      const recovery = c.filter(x => x.stage === "cold" || x.stage === "contacted");
      const hot    = c.filter(x => x.stage === "qualified" || x.stage === "negotiating");
      const pipeline = active.reduce((s, x) => s + (x.value || 0), 0);
      const revenue  = won.reduce((s, x) => s + (x.value || 0), 0);

      const today = new Date().toDateString();
      const todayEvents = e.filter(ev => ev.start_time && new Date(ev.start_time).toDateString() === today);

      setData({ active, won, recovery, hot, pipeline, revenue, todayEvents, totalContacts: c.length });
    }
    load();
  }, []);
  return data;
}

export default function Dashboard({ setActiveTab, setSelectedLead }) {
  const d = useDashboardData();
  const pipeline = d?.pipeline ?? 0;
  const revenue  = d?.revenue  ?? 0;
  const recovery = d?.recovery?.length ?? "—";
  const hot      = d?.hot ?? [];

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.textPrimary, margin:0, letterSpacing:-0.5 }}>AIMS Command Center</h1>
        <p style={{ color:C.textSecondary, fontSize:12, margin:"4px 0 0" }}>
          {new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })} · Revenue Flywheel: All 4 agents active
        </p>
      </div>

      <FlywheelBanner />

      {/* KPI Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <StatCard label="Active Pipeline"      value={pipeline > 0 ? `$${(pipeline/1000).toFixed(0)}K` : "—"} sub={`${d?.active?.length ?? "—"} live deals`}    icon="📈" color={C.primary} />
        <StatCard label="Revenue Recovered"    value={revenue  > 0 ? `$${(revenue/1000).toFixed(0)}K`  : "—"} sub={`${d?.won?.length ?? "—"} deal(s) closed`}    icon="💰" color={C.green} />
        <StatCard label="Leads in Recovery"    value={recovery}                                                 sub="ARIA sequencing now"                             icon="🎯" color="#00B4FF" />
        <StatCard label="Total Contacts"       value={d?.totalContacts ?? "—"}                                  sub="All stages"                                      icon="⚡" color="#FF6600" />
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
            <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Qualified Leads</h3>
            {!d && <div style={{ color:C.textMuted, fontSize:12, textAlign:"center", padding:"16px 0" }}>Loading…</div>}
            {d && hot.length === 0 && (
              <div style={{ color:C.textMuted, fontSize:12, textAlign:"center", padding:"16px 0" }}>No qualified leads yet</div>
            )}
            {hot.slice(0, 5).map(contact => {
              const a = AGENTS.find(ag => ag.id === contact.assignedTo) || AGENTS[0];
              return (
                <div key={contact.id}
                  onClick={() => { setSelectedLead(contact); setActiveTab("conversations"); }}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:7, marginBottom:5, background:C.surface, border:`1px solid ${C.border}`, cursor:"pointer" }}>
                  <AgentAvatar agentId={a.id} size={24} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{contact.name}</div>
                    <div style={{ fontSize:10, color:C.textSecondary }}>{contact.value ? `$${contact.value.toLocaleString()}` : "—"} · {contact.stage}</div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:C.amber, textTransform:"capitalize" }}>{contact.stage}</span>
                </div>
              );
            })}
          </div>

          {/* Today's Events */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Today's Events</h3>
            {!d && <div style={{ color:C.textMuted, fontSize:12, textAlign:"center", padding:"16px 0" }}>Loading…</div>}
            {d && d.todayEvents.length === 0 && (
              <div style={{ color:C.textMuted, fontSize:12, textAlign:"center", padding:"16px 0" }}>No events today</div>
            )}
            {d?.todayEvents.map(ev => {
              const a = AGENTS.find(ag => ag.id === ev.agent);
              const time = ev.start_time ? new Date(ev.start_time).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" }) : "—";
              return (
                <div key={ev.id} style={{ display:"flex", gap:10, alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
                  {a && <AgentAvatar agentId={a.id} size={22} />}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.textPrimary }}>{ev.title}</div>
                    <div style={{ fontSize:10, color:C.textSecondary }}>{time}</div>
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
