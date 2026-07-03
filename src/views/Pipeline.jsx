import { useState, useEffect } from "react";
import { C, AGENTS, PIPELINE_STAGES } from "../data.js";
import { AgentAvatar, SectionHeader } from "../components/utils.jsx";
import { getContacts, addContact, updateContact, getAllCommunications } from "../lib/db.js";

const STAGE_COLORS = { cold:C.textSecondary, contacted:"#00B4FF", qualified:C.primary, negotiating:C.amber, won:C.green, lost:C.red };

function AddLeadModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:"", company:"", industry:"", value:"", stage:"cold", assigned_to:"aria", score:50 });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave({ ...form, value:Number(form.value)||0, score:Number(form.score)||50, email:"", phone:"", source:"", tags:[], last_contact:new Date().toISOString() });
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:420, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.textPrimary }}>Add Lead</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        {[["Name *","name","text"],["Company","company","text"],["Industry","industry","text"],["Deal Value ($)","value","number"]].map(([label,key,type])=>(
          <div key={key} style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>{label}</label>
            <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)}
              style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
          </div>
        ))}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Stage</label>
            <select value={form.stage} onChange={e=>set("stage",e.target.value)}
              style={{ width:"100%", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }}>
              {["cold","contacted","qualified","negotiating","won","lost"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Agent</label>
            <select value={form.assigned_to} onChange={e=>set("assigned_to",e.target.value)}
              style={{ width:"100%", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }}>
              {["aria","melody","lyric","muse"].map(a=><option key={a} value={a}>{a.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:16 }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving||!form.name.trim()}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving||!form.name.trim()?0.6:1 }}>
            {saving?"Saving…":"Add Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Pipeline({ setSelectedLead, setActiveTab }) {
  const [contacts, setContacts] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);

  useEffect(() => {
    Promise.all([
      getContacts().then(d => setContacts(d)),
      getAllCommunications().catch(() => []).then(d => setCommunications(d || [])),
    ]).then(() => setLoading(false)).catch(() => setLoading(false));
  }, []);

  const handleAdd = async (data) => {
    const c = await addContact(data);
    setContacts(p => [c,...p]);
    setShowAdd(false);
  };

  const moveStage = async (id, stage) => {
    await updateContact(id, { stage });
    setContacts(p => p.map(c => c.id===id ? {...c, stage} : c));
  };

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <SectionHeader
        title="Lead Pipeline"
        sub="Cold → Contacted → Qualified → Negotiating → Won / Lost"
        action={<button onClick={()=>setShowAdd(true)} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.primary}`, background:`${C.primary}15`, color:C.primary, fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Add Lead</button>}
      />
      {loading ? (
        <div style={{ textAlign:"center", color:C.textMuted, fontSize:13, paddingTop:60 }}>Loading…</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12 }}>
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = contacts.filter(l => l.stage === stage.id);
            const val = stageLeads.reduce((s,l) => s + Number(l.value||0), 0);
            return (
              <div key={stage.id} style={{ display:"flex", flexDirection:"column", gap:8, background:C.surface, borderRadius:12, padding:12, border:`1px solid ${C.border}`, minHeight:400 }}>
                <div>
                  <span style={{ fontSize:11, fontWeight:800, color:stage.color, textTransform:"uppercase", letterSpacing:0.5 }}>{stage.label}</span>
                  <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>${val.toLocaleString()} · {stageLeads.length}</div>
                  {stage.agent && <div style={{ marginTop:6 }}><AgentAvatar agentId={stage.agent} size={16} /></div>}
                </div>
                {stageLeads.map(lead => {
                  const a = AGENTS.find(ag => ag.id === lead.assigned_to);
                  const leadComms = communications.filter(c => c.contact_id === lead.id);
                  const calls = leadComms.filter(c => c.channel === "call").length;
                  const texts = leadComms.filter(c => c.channel === "text").length;
                  const emails = leadComms.filter(c => c.channel === "email").length;
                  return (
                    <div key={lead.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 11px", borderLeft:`3px solid ${a?.color||C.border}` }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.textPrimary, marginBottom:2 }}>{lead.name}</div>
                      <div style={{ fontSize:10, color:C.textSecondary, marginBottom:8 }}>{lead.industry||lead.company||"—"}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:C.textPrimary }}>${Number(lead.value||0).toLocaleString()}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:lead.score>=80?C.green:lead.score>=55?C.amber:C.red }}>{lead.score}</span>
                      </div>
                      {(calls + texts + emails > 0) && (
                        <div style={{ fontSize:9, color:C.amber, marginBottom:6, display:"flex", gap:3 }}>
                          {calls > 0 && <span>☎️{calls}</span>}
                          {texts > 0 && <span>💬{texts}</span>}
                          {emails > 0 && <span>📧{emails}</span>}
                        </div>
                      )}
                      <select value={lead.stage} onChange={e=>moveStage(lead.id, e.target.value)}
                        style={{ width:"100%", padding:"4px 6px", borderRadius:5, border:`1px solid ${STAGE_COLORS[lead.stage]||C.border}`, background:C.surface, color:STAGE_COLORS[lead.stage]||C.textSecondary, fontSize:10, fontWeight:700, cursor:"pointer" }}>
                        {["cold","contacted","qualified","negotiating","won","lost"].map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:7 }}>
                        {a && <><AgentAvatar agentId={a.id} size={14} /><span style={{ fontSize:9, color:a.color, fontWeight:700 }}>{a.name}</span></>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
      {showAdd && <AddLeadModal onClose={()=>setShowAdd(false)} onSave={handleAdd} />}
    </div>
  );
}
