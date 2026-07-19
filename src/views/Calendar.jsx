import { useState, useEffect } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar } from "../components/utils.jsx";
import { getEvents, addEvent, deleteEvent } from "../lib/db.js";

const TC = { discovery:C.primary, demo:"#A855F7", onboarding:C.green, close:C.amber, call:"#00B4FF", internal:C.textSecondary };
const TYPES = ["call","demo","discovery","onboarding","close","internal"];

function AddEventModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title:"", date:"", time:"", duration:"30 min", type:"call", contact_name:"", agent:"" });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const save = async () => {
    if (!form.title.trim()||!form.date) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:440, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.textPrimary }}>Schedule Event</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        {[["Title *","title","text"],["Contact Name","contact_name","text"],["Date *","date","date"],["Time","time","time"],["Duration","duration","text"]].map(([label,key,type])=>(
          <div key={key} style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>{label}</label>
            <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)}
              style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
          </div>
        ))}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Type</label>
            <select value={form.type} onChange={e=>set("type",e.target.value)}
              style={{ width:"100%", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }}>
              {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Agent</label>
            <select value={form.agent} onChange={e=>set("agent",e.target.value)}
              style={{ width:"100%", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }}>
              <option value="">None</option>
              {["aria","melody","lyric","muse"].map(a=><option key={a} value={a}>{a.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving||!form.title.trim()||!form.date}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"#FF0080", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving||!form.title.trim()||!form.date?0.6:1 }}>
            {saving?"Saving…":"Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarView() {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    getEvents().then(d=>{ setEvents(d); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const handleAdd = async (data) => {
    const e = await addEvent(data);
    setEvents(p => [...p, e].sort((a,b)=>a.date.localeCompare(b.date)));
    setShowAdd(false);
  };

  const remove = async (id) => {
    await deleteEvent(id);
    setEvents(p => p.filter(e=>e.id!==id));
  };

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:C.textPrimary }}>Calendar</h2>
          <p style={{ color:C.textSecondary, fontSize:12, margin:"4px 0 0" }}>Upcoming calls, demos & events</p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#FF0080", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Schedule Event</button>
      </div>

      {loading && <div style={{ textAlign:"center", color:C.textMuted, fontSize:13, paddingTop:40 }}>Loading…</div>}
      {!loading && events.length===0 && (
        <div style={{ textAlign:"center", color:C.textMuted, fontSize:13, paddingTop:60 }}>No events scheduled. Click Schedule Event to add one.</div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {events.map(ev => {
          const a = ev.agent ? AGENTS.find(ag=>ag.id===ev.agent) : null;
          const color = TC[ev.type]||C.primary;
          return (
            <div key={ev.id} style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px", borderRadius:10, background:C.card, border:`1px solid ${C.border}`, borderLeft:`4px solid ${color}` }}>
              <div style={{ width:90, flexShrink:0 }}>
                <div style={{ fontSize:10, fontWeight:800, color, textTransform:"uppercase" }}>{ev.type}</div>
                <div style={{ fontSize:11, color:C.textSecondary, marginTop:2 }}>{ev.duration}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.textPrimary }}>{ev.title}</div>
                <div style={{ fontSize:12, color:C.textSecondary, marginTop:2 }}>{ev.date}{ev.time?` · ${ev.time}`:""}{ev.contact_name?` · ${ev.contact_name}`:""}</div>
              </div>
              {a && (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <AgentAvatar agentId={a.id} size={24} />
                  <span style={{ fontSize:12, color:a.color, fontWeight:700 }}>{a.name}</span>
                </div>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <button style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:12, cursor:"pointer" }}>Join</button>
                <button onClick={()=>remove(ev.id)} style={{ padding:"6px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.textMuted, fontSize:12, cursor:"pointer" }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && <AddEventModal onClose={()=>setShowAdd(false)} onSave={handleAdd} />}
    </div>
  );
}
