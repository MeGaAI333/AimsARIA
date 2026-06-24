import { C, AGENTS, PIPELINE_STAGES } from "../data.js";
import { AgentAvatar, Btn, SectionHeader } from "../components/utils.jsx";

export default function Pipeline({ leads, setSelectedLead, setActiveTab }) {
  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <SectionHeader
        title="Lead Pipeline"
        sub="Cold → Contacted → Qualified → Negotiating → Won / Lost"
        action={<Btn>+ Add Lead</Btn>}
      />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, overflowX:"auto" }}>
        {PIPELINE_STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage.id);
          const val = stageLeads.reduce((s, l) => s + l.value, 0);
          return (
            <div key={stage.id} style={{ display:"flex", flexDirection:"column", gap:8, background:C.surface, borderRadius:12, padding:12, border:`1px solid ${C.border}`, minHeight:400 }}>
              <div>
                <span style={{ fontSize:11, fontWeight:800, color:stage.color, textTransform:"uppercase", letterSpacing:0.5 }}>{stage.label}</span>
                <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>${val.toLocaleString()} · {stageLeads.length} leads</div>
                {stage.agent && (
                  <div style={{ marginTop:6 }}><AgentAvatar agentId={stage.agent} size={16} /></div>
                )}
              </div>
              {stageLeads.map(lead => {
                const a = AGENTS.find(ag => ag.id === lead.assignedTo);
                return (
                  <div key={lead.id}
                    onClick={() => { setSelectedLead(lead); setActiveTab("conversations"); }}
                    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 11px", cursor:"pointer", borderLeft:`3px solid ${a?.color || C.border}`, transition:"border-color .15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = a?.color || C.borderHover}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <div style={{ fontSize:12, fontWeight:700, color:C.textPrimary, marginBottom:2 }}>{lead.name}</div>
                    <div style={{ fontSize:10, color:C.textSecondary, marginBottom:7 }}>{lead.industry}</div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:12, fontWeight:700, color:C.textPrimary }}>${lead.value.toLocaleString()}</span>
                      <span style={{ fontSize:11, fontWeight:700, color: lead.score >= 80 ? C.green : lead.score >= 55 ? C.amber : C.red }}>{lead.score}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:7 }}>
                      <AgentAvatar agentId={lead.assignedTo} size={16} />
                      <span style={{ fontSize:9, color:a?.color, fontWeight:700 }}>{a?.name}</span>
                      <span style={{ fontSize:9, color:C.textMuted, marginLeft:"auto" }}>{lead.lastContact}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
