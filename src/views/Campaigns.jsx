import { C, AGENTS } from "../data.js";
import { AgentAvatar, Badge } from "../components/utils.jsx";

export default function Campaigns() {
  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Sidebar */}
      <div style={{ width:240, background:C.sidebar, borderRight:`1px solid ${C.border}`, overflowY:"auto", flexShrink:0, padding:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Campaigns</div>
        <div style={{ padding:"12px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, marginBottom:8, textAlign:"center" }}>
          <div style={{ fontSize:11, color:C.textMuted }}>No campaigns yet</div>
        </div>
        <button style={{ width:"100%", padding:10, borderRadius:8, border:`1px dashed ${C.border}`, background:"transparent", color:C.textMuted, fontSize:12, cursor:"pointer", marginTop:8 }}>+ New Campaign</button>
      </div>

      {/* Empty State */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:40 }}>
        <div style={{ fontSize:48, marginBottom:20 }}>📡</div>
        <h2 style={{ margin:"0 0 10px", fontSize:20, fontWeight:800, color:C.textPrimary }}>No Campaigns Configured Yet</h2>
        <p style={{ color:C.textSecondary, fontSize:13, textAlign:"center", maxWidth:420, lineHeight:1.6, margin:"0 0 24px" }}>
          Campaigns are outreach sequences run by your AIMS agents — ARIA for lead recovery, MELODY for closing, LYRIC for content, and MUSE for reputation.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, maxWidth:480, width:"100%" }}>
          {AGENTS.map(a => (
            <div key={a.id} style={{ padding:"14px 16px", borderRadius:10, background:C.card, border:`1px solid ${a.color}30`, display:"flex", alignItems:"center", gap:10 }}>
              <AgentAvatar agentId={a.id} size={32} />
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:a.color }}>{a.name}</div>
                <div style={{ fontSize:10, color:C.textMuted }}>{a.direction}</div>
              </div>
              <Badge color={a.color} style={{ marginLeft:"auto" }}>Ready</Badge>
            </div>
          ))}
        </div>
        <p style={{ color:C.textMuted, fontSize:11, marginTop:24 }}>Contact your AIMS team to configure your first campaign sequence.</p>
      </div>
    </div>
  );
}
