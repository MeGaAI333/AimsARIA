import { C, AGENTS } from "../data.js";
import { AgentAvatar, PulsingDot } from "./utils.jsx";

const ROLE_NAV = {
  admin: [
    { id:"dashboard",    icon:"⬡",  label:"Command Center" },
    { divider:"AIMS AI CRM" },
    { id:"crm",          icon:"👥",  label:"Contacts" },
    { id:"pipeline",     icon:"◈",   label:"Pipeline" },
    { divider:"COMMUNICATION" },
    { id:"conversations",icon:"💬",  label:"Conversations" },
    { id:"campaigns",    icon:"📡",  label:"Campaigns" },
    { divider:"AI AGENTS" },
    { id:"agent-aria",   agentId:"aria" },
    { id:"agent-melody", agentId:"melody" },
    { id:"agent-lyric",  agentId:"lyric", workstation:true },
    { id:"agent-muse",   agentId:"muse" },
    { divider:"MANAGEMENT" },
    { id:"calendar",     icon:"📅",  label:"Calendar" },
    { id:"tasks",        icon:"✓",   label:"Tasks" },
    { id:"notes",        icon:"📝",  label:"Notes" },
    { divider:"BUSINESS" },
    { id:"pricing",      icon:"$",   label:"Pricing" },
    { id:"settings",     icon:"⚙",   label:"Settings" },
  ],
  client: [
    { id:"dashboard",    icon:"⬡",  label:"Command Center" },
    { id:"pipeline",     icon:"◈",   label:"Pipeline" },
    { id:"conversations",icon:"💬",  label:"Conversations" },
    { id:"campaigns",    icon:"📡",  label:"Campaigns" },
    { id:"calendar",     icon:"📅",  label:"Calendar" },
    { id:"tasks",        icon:"✓",   label:"Tasks" },
    { id:"notes",        icon:"📝",  label:"Notes" },
    { id:"pricing",      icon:"$",   label:"Pricing" },
    { id:"settings",     icon:"⚙",   label:"Settings" },
  ],
  lyric: [
    { divider:"LYRIC WORKSTATION" },
    { id:"lyric-workstation", agentId:"lyric" },
    { id:"settings",     icon:"⚙",   label:"Settings" },
  ],
  user: [
    { id:"dashboard",    icon:"⬡",  label:"Command Center" },
    { id:"conversations",icon:"💬",  label:"Conversations" },
    { id:"calendar",     icon:"📅",  label:"Calendar" },
    { id:"tasks",        icon:"✓",   label:"Tasks" },
  ],
};

const ROLE_COLOR = { admin: C.primary, client: C.amber, user: C.green, lyric: "#39FF14" };
const ROLE_LABEL = { admin: "Admin", client: "Client", user: "User", lyric: "LYRIC Client" };

export default function Sidebar({ tab, setTab, role, onSignOut }) {
  const nav = ROLE_NAV[role] || ROLE_NAV.user;

  return (
    <div style={{ width:200, background:C.sidebar, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>
      {/* Logo */}
      <div style={{ padding:"20px 16px 14px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:18, fontWeight:900, color:C.textPrimary, letterSpacing:-0.5 }}>AIMS <span style={{ color:C.primary }}>AI</span></div>
        <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>Command Center</div>
        <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:20, background:`${ROLE_COLOR[role]}15`, border:`1px solid ${ROLE_COLOR[role]}30` }}>
          <span style={{ fontSize:9, fontWeight:800, color:ROLE_COLOR[role], textTransform:"uppercase", letterSpacing:0.5 }}>{ROLE_LABEL[role]}</span>
        </div>
      </div>

      {/* Flywheel status */}
      <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:9, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Revenue Flywheel</div>
        {AGENTS.map(a => (
          <div key={a.id} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
            <PulsingDot color={a.color} />
            <span style={{ fontSize:10, fontWeight:700, color:a.color }}>{a.name}</span>
            <span style={{ fontSize:9, color:C.textMuted, marginLeft:"auto" }}>{a.direction}</span>
          </div>
        ))}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
        {nav.map((item, i) => {
          if (item.divider) {
            return <div key={i} style={{ padding:"14px 16px 5px", fontSize:9, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1 }}>{item.divider}</div>;
          }
          if (item.agentId) {
            const a = AGENTS.find(ag => ag.id === item.agentId);
            const active = tab === item.id || (item.workstation && tab === "lyric-workstation" && item.id === "agent-lyric");
            return (
              <div key={item.id}>
                <div onClick={() => setTab(item.id)}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", cursor:"pointer", background:active ? `${a.color}15`:"transparent", borderLeft:`3px solid ${active ? a.color:"transparent"}` }}
                  onMouseEnter={e => !active && (e.currentTarget.style.background = C.surface)}
                  onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent")}
                >
                  <AgentAvatar agentId={a.id} size={20} />
                  <span style={{ fontSize:12, fontWeight:700, color:active ? a.color:C.textSecondary }}>{a.name}</span>
                </div>
                {item.workstation && (
                  <div onClick={() => setTab("lyric-workstation")}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 16px 6px 44px", cursor:"pointer", background:tab==="lyric-workstation" ? `${a.color}15`:"transparent", borderLeft:`3px solid ${tab==="lyric-workstation" ? a.color:"transparent"}` }}
                    onMouseEnter={e => tab!=="lyric-workstation" && (e.currentTarget.style.background = C.surface)}
                    onMouseLeave={e => tab!=="lyric-workstation" && (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize:10, color:tab==="lyric-workstation" ? a.color:C.textMuted }}>✨</span>
                    <span style={{ fontSize:11, fontWeight:600, color:tab==="lyric-workstation" ? a.color:C.textMuted }}>Workstation</span>
                  </div>
                )}
              </div>
            );
          }
          const active = tab === item.id;
          return (
            <div key={item.id} onClick={() => setTab(item.id)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", cursor:"pointer", background:active ? C.surface:"transparent", borderLeft:`3px solid ${active ? C.primary:"transparent"}` }}
              onMouseEnter={e => !active && (e.currentTarget.style.background = C.surface)}
              onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize:14, width:20, textAlign:"center", color:active ? C.primary:C.textMuted }}>{item.icon}</span>
              <span style={{ fontSize:12, fontWeight:600, color:active ? C.textPrimary:C.textSecondary }}>{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Footer + Sign Out */}
      <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.border}` }}>
        <div
          onClick={onSignOut}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 10px", borderRadius:8, cursor:"pointer", marginBottom:8, color:C.textMuted, fontSize:11, fontWeight:600 }}
          onMouseEnter={e => e.currentTarget.style.background = C.surface}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span>↪</span> Sign Out
        </div>
        <div style={{ fontSize:10, color:C.textMuted }}>AIMS Marketing Systems © 2026</div>
      </div>
    </div>
  );
}
