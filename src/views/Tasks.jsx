import { useState } from "react";
import { C, AGENTS, SAMPLE_TASKS } from "../data.js";
import { AgentAvatar, Badge } from "../components/utils.jsx";

export default function Tasks() {
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const pc = { high:C.red, medium:C.amber, low:C.green };
  const toggle = id => setTasks(prev => prev.map(t => t.id === id ? { ...t, done:!t.done } : t));

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:C.textPrimary }}>Tasks</h2>
        <div style={{ display:"flex", gap:8 }}>
          <Badge color={C.red}>{tasks.filter(t => !t.done && t.priority==="high").length} High</Badge>
          <Badge color={C.amber}>{tasks.filter(t => !t.done && t.priority==="medium").length} Medium</Badge>
          <button style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Add Task</button>
        </div>
      </div>
      {["high","medium","low"].map(p => (
        <div key={p} style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, fontWeight:800, color:pc[p], textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>{p} Priority</div>
          {tasks.filter(t => t.priority === p).map(task => {
            const a = AGENTS.find(ag => ag.name === task.assignee);
            return (
              <div key={task.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:8, background:task.done ? C.surface:C.card, border:`1px solid ${C.border}`, marginBottom:6, opacity:task.done?.5:1 }}>
                <div onClick={() => toggle(task.id)} style={{ width:18, height:18, borderRadius:4, border:`2px solid ${task.done ? C.green:C.border}`, background:task.done ? C.green:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, flexShrink:0 }}>
                  {task.done ? "✓" : ""}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary, textDecoration:task.done?"line-through":"none" }}>{task.title}</div>
                  {task.lead
                    ? <div style={{ fontSize:11, color:C.textSecondary, marginTop:2 }}>👤 {task.lead} · {task.due}</div>
                    : <div style={{ fontSize:11, color:C.textSecondary, marginTop:2 }}>Due: {task.due}</div>
                  }
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  {a && <AgentAvatar agentId={a.id} size={20} />}
                  <span style={{ fontSize:11, color:a?.color || C.textSecondary, fontWeight:600, background:C.surface, padding:"3px 8px", borderRadius:4, border:`1px solid ${C.border}` }}>{task.assignee}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
