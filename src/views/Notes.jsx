import { useState } from "react";
import { C, SAMPLE_NOTES, SAMPLE_LEADS } from "../data.js";
import { AgentAvatar, Badge } from "../components/utils.jsx";

export default function Notes() {
  const [notes, setNotes] = useState(SAMPLE_NOTES);
  const [filter, setFilter] = useState(null);
  const [input, setInput] = useState("");
  const rc = { ai:C.primary, advisor:C.amber, admin:"#A855F7" };

  const save = () => {
    if (!input.trim()) return;
    setNotes(p => [{ id:Date.now(), lead:filter||"General", author:"Advisor", agentId:null, role:"advisor", ts:"Just now", content:input.trim() }, ...p]);
    setInput("");
  };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <div style={{ width:210, background:C.sidebar, borderRight:`1px solid ${C.border}`, overflowY:"auto", flexShrink:0, padding:14 }}>
        <div style={{ fontSize:10, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Filter</div>
        <div onClick={() => setFilter(null)} style={{ padding:"7px 10px", borderRadius:6, cursor:"pointer", background:!filter ? C.card:"transparent", fontSize:12, color:!filter ? C.textPrimary:C.textSecondary, marginBottom:3 }}>
          All Notes ({notes.length})
        </div>
        {SAMPLE_LEADS.map(lead => {
          const count = notes.filter(n => n.lead === lead.name).length;
          return count ? (
            <div key={lead.id} onClick={() => setFilter(lead.name)}
              style={{ padding:"7px 10px", borderRadius:6, cursor:"pointer", background:filter===lead.name ? C.card:"transparent", fontSize:12, color:filter===lead.name ? C.textPrimary:C.textSecondary, marginBottom:3 }}>
              {lead.name} ({count})
            </div>
          ) : null;
        })}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
        <h2 style={{ margin:"0 0 20px", fontSize:20, fontWeight:800, color:C.textPrimary }}>Notes</h2>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Add a note about a lead or account…" rows={3}
            style={{ width:"100%", padding:10, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, color:C.textPrimary, fontSize:13, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }} />
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
            <button onClick={save} style={{ padding:"7px 18px", borderRadius:6, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Save Note</button>
          </div>
        </div>
        {notes.filter(n => !filter || n.lead === filter).map(note => (
          <div key={note.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:10, borderLeft:`3px solid ${rc[note.role]||C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {note.agentId && <AgentAvatar agentId={note.agentId} size={22} />}
                <span style={{ fontSize:12, fontWeight:700, color:rc[note.role]||C.textSecondary }}>{note.author}</span>
                <Badge color={rc[note.role]||C.textSecondary}>{note.role.toUpperCase()}</Badge>
              </div>
              <span style={{ fontSize:10, color:C.textMuted }}>{note.ts}</span>
            </div>
            <div style={{ fontSize:10, color:C.textMuted, marginBottom:7 }}>re: {note.lead}</div>
            <p style={{ margin:0, fontSize:13, color:C.textSecondary, lineHeight:1.6 }}>{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
