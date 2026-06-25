import { useState, useEffect } from "react";
import { C } from "../data.js";
import { Badge } from "../components/utils.jsx";
import { getTasks, addTask, updateTask, deleteTask } from "../lib/db.js";

const PC = { high:C.red, medium:C.amber, low:C.green };

function AddTaskModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title:"", due:"", priority:"medium", contact_name:"", assignee:"" });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave({ ...form });
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:420, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.textPrimary }}>New Task</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        {[["Task *","title","text"],["Due Date / Time","due","text"],["Contact (optional)","contact_name","text"],["Assignee","assignee","text"]].map(([label,key,type])=>(
          <div key={key} style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>{label}</label>
            <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={label}
              style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
          </div>
        ))}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Priority</label>
          <div style={{ display:"flex", gap:8 }}>
            {["high","medium","low"].map(p=>(
              <button key={p} onClick={()=>set("priority",p)}
                style={{ flex:1, padding:"8px 0", borderRadius:7, border:`2px solid ${form.priority===p?PC[p]:C.border}`, background:form.priority===p?`${PC[p]}15`:"transparent", color:form.priority===p?PC[p]:C.textMuted, fontSize:12, fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving||!form.title.trim()}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving||!form.title.trim()?0.6:1 }}>
            {saving?"Saving…":"Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    getTasks().then(d=>{ setTasks(d); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const toggle = async (id, done) => {
    await updateTask(id, { done: !done });
    setTasks(p => p.map(t => t.id===id ? {...t, done:!done} : t));
  };

  const remove = async (id) => {
    await deleteTask(id);
    setTasks(p => p.filter(t => t.id!==id));
  };

  const handleAdd = async (data) => {
    const t = await addTask({ ...data, done:false });
    setTasks(p => [t,...p]);
    setShowAdd(false);
  };

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:C.textPrimary }}>Tasks</h2>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <Badge color={C.red}>{tasks.filter(t=>!t.done&&t.priority==="high").length} High</Badge>
          <Badge color={C.amber}>{tasks.filter(t=>!t.done&&t.priority==="medium").length} Medium</Badge>
          <button onClick={()=>setShowAdd(true)} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Add Task</button>
        </div>
      </div>

      {loading && <div style={{ textAlign:"center", color:C.textMuted, fontSize:13, paddingTop:40 }}>Loading…</div>}

      {!loading && tasks.length===0 && (
        <div style={{ textAlign:"center", color:C.textMuted, fontSize:13, paddingTop:60 }}>No tasks yet. Add your first one!</div>
      )}

      {!loading && ["high","medium","low"].map(p => {
        const group = tasks.filter(t => t.priority===p);
        if (group.length===0) return null;
        return (
          <div key={p} style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:800, color:PC[p], textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>{p} Priority</div>
            {group.map(task => (
              <div key={task.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:8, background:task.done?C.surface:C.card, border:`1px solid ${C.border}`, marginBottom:6, opacity:task.done?0.5:1 }}>
                <div onClick={()=>toggle(task.id, task.done)} style={{ width:18, height:18, borderRadius:4, border:`2px solid ${task.done?C.green:C.border}`, background:task.done?C.green:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, flexShrink:0 }}>
                  {task.done?"✓":""}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary, textDecoration:task.done?"line-through":"none" }}>{task.title}</div>
                  <div style={{ fontSize:11, color:C.textSecondary, marginTop:2 }}>
                    {task.contact_name && `👤 ${task.contact_name} · `}{task.due||"No due date"}
                    {task.assignee && ` · ${task.assignee}`}
                  </div>
                </div>
                <button onClick={()=>remove(task.id)} style={{ background:"transparent", border:"none", color:C.textMuted, cursor:"pointer", fontSize:14, padding:"0 4px" }}>✕</button>
              </div>
            ))}
          </div>
        );
      })}

      {showAdd && <AddTaskModal onClose={()=>setShowAdd(false)} onSave={handleAdd} />}
    </div>
  );
}
