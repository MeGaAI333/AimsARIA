import { C, AGENTS, SAMPLE_EVENTS } from "../data.js";
import { AgentAvatar } from "../components/utils.jsx";

export default function CalendarView() {
  const tc = { discovery:C.primary, demo:"#A855F7", onboarding:C.green, close:C.amber, internal:C.textSecondary };
  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:C.textPrimary }}>Calendar</h2>
          <p style={{ color:C.textSecondary, fontSize:12, margin:"4px 0 0" }}>Upcoming calls, demos & events</p>
        </div>
        <button style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#FF0080", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Schedule via MELODY</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {SAMPLE_EVENTS.map(ev => {
          const a = ev.agent ? AGENTS.find(ag => ag.id === ev.agent) : null;
          const color = tc[ev.type] || C.primary;
          return (
            <div key={ev.id} style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px", borderRadius:10, background:C.card, border:`1px solid ${C.border}`, borderLeft:`4px solid ${color}` }}>
              <div style={{ width:100, flexShrink:0 }}>
                <div style={{ fontSize:10, fontWeight:800, color, textTransform:"uppercase" }}>{ev.type}</div>
                <div style={{ fontSize:11, color:C.textSecondary, marginTop:2 }}>{ev.duration}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.textPrimary }}>{ev.title}</div>
                <div style={{ fontSize:12, color:C.textSecondary, marginTop:2 }}>{ev.time}</div>
              </div>
              {a && (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <AgentAvatar agentId={a.id} size={24} />
                  <span style={{ fontSize:12, color:a.color, fontWeight:700 }}>{a.name}</span>
                </div>
              )}
              <button style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:12, cursor:"pointer" }}>Join</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
