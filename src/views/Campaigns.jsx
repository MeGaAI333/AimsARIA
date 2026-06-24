import { useState } from "react";
import { C, AGENTS, SAMPLE_CAMPAIGNS } from "../data.js";
import { AgentAvatar, Badge, ChannelBadge } from "../components/utils.jsx";

export default function Campaigns() {
  const [sel, setSel] = useState(SAMPLE_CAMPAIGNS[0]);
  const chColor = { sms:C.green, email:C.primary, voice:"#39FF14", social:"#FF0080" };
  const chIcon  = { sms:"💬", email:"📧", voice:"🎙️", social:"📲" };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Sidebar */}
      <div style={{ width:240, background:C.sidebar, borderRight:`1px solid ${C.border}`, overflowY:"auto", flexShrink:0, padding:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Campaigns</div>
        {SAMPLE_CAMPAIGNS.map(c => {
          const a = AGENTS.find(ag => ag.id === c.agent);
          return (
            <div key={c.id} onClick={() => setSel(c)}
              style={{ padding:"12px 14px", borderRadius:8, cursor:"pointer", marginBottom:6, background:sel?.id===c.id ? C.card : C.surface, border:`1px solid ${sel?.id===c.id ? a?.color : C.border}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, marginBottom:6 }}>{c.name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <Badge color={C.green}>● Active</Badge>
                <span style={{ fontSize:10, color:C.textSecondary }}>{c.leads > 0 ? `${c.leads} leads` : "Always-on"}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <AgentAvatar agentId={c.agent} size={16} />
                <span style={{ fontSize:11, color:a?.color, fontWeight:700 }}>{a?.name}</span>
              </div>
            </div>
          );
        })}
        <button style={{ width:"100%", padding:10, borderRadius:8, border:`1px dashed ${C.border}`, background:"transparent", color:C.textMuted, fontSize:12, cursor:"pointer", marginTop:8 }}>+ New Campaign</button>
      </div>

      {sel && (
        <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
          <div style={{ marginBottom:22, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:C.textPrimary }}>{sel.name}</h2>
              <p style={{ color:C.textSecondary, fontSize:12, margin:"6px 0 0" }}>{sel.description}</p>
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <Badge color={C.green}>● Active</Badge>
                {sel.channels.map(ch => <ChannelBadge key={ch} channel={ch} />)}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <AgentAvatar agentId={sel.agent} size={38} />
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:AGENTS.find(a => a.id===sel.agent)?.color }}>{AGENTS.find(a => a.id===sel.agent)?.name}</div>
                <div style={{ fontSize:11, color:C.textSecondary }}>Owns this campaign</div>
              </div>
            </div>
          </div>

          {/* Sequence */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
            <h3 style={{ margin:"0 0 20px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Sequence</h3>
            {sel.steps.map((step, i) => (
              <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:36, flexShrink:0 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:`${chColor[step.channel]}18`, border:`2px solid ${chColor[step.channel]}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>
                    {chIcon[step.channel]}
                  </div>
                  {i < sel.steps.length-1 && <div style={{ width:2, flex:1, minHeight:20, background:C.border, margin:"4px 0" }} />}
                </div>
                <div style={{ paddingBottom:20, flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:10, fontWeight:800, color:chColor[step.channel], textTransform:"uppercase" }}>{step.channel}</span>
                    <span style={{ fontSize:10, color:C.textMuted }}>Day {step.day}</span>
                  </div>
                  <div style={{ padding:"9px 13px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, fontSize:13, color:C.textPrimary }}>{step.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { l:"Enrolled",   v: sel.leads > 0 ? sel.leads : "∞", c:C.textPrimary },
              { l:"Engagement", v: sel.engagement, c:C.green },
              { l:"Reply Rate", v:"34%",  c:C.primary },
              { l:"Converted",  v:"22%",  c:C.amber },
            ].map(s => (
              <div key={s.l} style={{ padding:"14px 16px", borderRadius:8, background:C.card, border:`1px solid ${C.border}`, textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11, color:C.textSecondary, marginTop:4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
