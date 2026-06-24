import { C, AGENTS } from "../data.js";
import { AgentAvatar, Badge } from "../components/utils.jsx";

export default function Settings({ apiKey, setApiKey, role, setRole }) {
  const ROLES = {
    admin:  { label:"Admin",  icon:"⚙️", color:C.primary, desc:"Full system access — all views, settings, and data" },
    client: { label:"Client", icon:"🏢", color:C.amber,   desc:"Campaign & lead visibility — no system settings" },
    user:   { label:"User",   icon:"👤", color:C.green,   desc:"Basic access — conversations, calendar, tasks" },
  };

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <h2 style={{ margin:"0 0 24px", fontSize:20, fontWeight:800, color:C.textPrimary }}>Settings</h2>

      {/* API Key */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
        <h3 style={{ margin:"0 0 6px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Anthropic API Key</h3>
        <p style={{ margin:"0 0 16px", fontSize:12, color:C.textSecondary }}>Required for live AI agent chat and LYRIC content generation.</p>
        <div style={{ display:"flex", gap:10 }}>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-…"
            style={{ flex:1, padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${apiKey ? C.green : C.border}`, color:C.textPrimary, fontSize:13, outline:"none", fontFamily:"monospace" }} />
          {apiKey && <div style={{ display:"flex", alignItems:"center", gap:6, color:C.green, fontSize:12, fontWeight:700 }}>✓ Key set</div>}
        </div>
        <p style={{ margin:"10px 0 0", fontSize:11, color:C.textMuted }}>Key is stored in memory only and cleared on refresh. Never shared or logged.</p>
      </div>

      {/* Role Switcher */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
        <h3 style={{ margin:"0 0 6px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Active Role</h3>
        <p style={{ margin:"0 0 16px", fontSize:12, color:C.textSecondary }}>Switch between roles to preview different access levels.</p>
        <div style={{ display:"flex", gap:10 }}>
          {Object.entries(ROLES).map(([key, r]) => (
            <button key={key} onClick={() => setRole(key)}
              style={{ flex:1, padding:"14px 12px", borderRadius:10, border:`2px solid ${role===key ? r.color : C.border}`, background:role===key ? `${r.color}15`:"transparent", cursor:"pointer", textAlign:"left" }}>
              <div style={{ fontSize:20, marginBottom:6 }}>{r.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:role===key ? r.color : C.textPrimary, marginBottom:4 }}>{r.label}</div>
              <div style={{ fontSize:11, color:C.textSecondary, lineHeight:1.4 }}>{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Agent Info */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Active Agents</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {AGENTS.map(a => (
            <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:8, background:C.surface, border:`1px solid ${a.color}30` }}>
              <AgentAvatar agentId={a.id} size={36} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:a.color }}>{a.name}</div>
                <div style={{ fontSize:11, color:C.textSecondary }}>{a.role}</div>
              </div>
              <Badge color={C.green}>● Live</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, color:C.textPrimary }}>System Information</h3>
        {[
          { label:"Platform",  val:"AIMS AI Command Center v2.0" },
          { label:"Build",     val:"June 2026" },
          { label:"AI Model",  val:"Claude Sonnet (via Anthropic API)" },
          { label:"Agents",    val:"ARIA · MELODY · LYRIC · MUSE" },
          { label:"Company",   val:"AIMS Marketing Systems, Inc." },
        ].map(row => (
          <div key={row.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:12, color:C.textMuted }}>{row.label}</span>
            <span style={{ fontSize:12, color:C.textPrimary, fontWeight:600 }}>{row.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
