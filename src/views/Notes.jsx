import { useState, useEffect } from "react";
import { C } from "../data.js";
import { getNotes, addNote, deleteNote } from "../lib/db.js";

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}

export default function Notes() {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState(null);
  const [input, setInput]     = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    getNotes().then(d=>{ setNotes(d); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const save = async () => {
    if (!input.trim()) return;
    setSaving(true);
    const n = await addNote({ contact_name: contact.trim()||"General", content: input.trim(), author:"Advisor", role:"advisor" });
    setNotes(p => [n, ...p]);
    setInput("");
    setContact("");
    setSaving(false);
  };

  const remove = async (id) => {
    await deleteNote(id);
    setNotes(p => p.filter(n => n.id!==id));
  };

  const contactNames = [...new Set(notes.map(n=>n.contact_name).filter(Boolean))];
  const visible = notes.filter(n => !filter || n.contact_name===filter);

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Sidebar */}
      <div style={{ width:210, background:C.sidebar, borderRight:`1px solid ${C.border}`, overflowY:"auto", flexShrink:0, padding:14 }}>
        <div style={{ fontSize:10, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Filter</div>
        <div onClick={()=>setFilter(null)} style={{ padding:"7px 10px", borderRadius:6, cursor:"pointer", background:!filter?C.card:"transparent", fontSize:12, color:!filter?C.textPrimary:C.textSecondary, marginBottom:3 }}>
          All Notes ({notes.length})
        </div>
        {contactNames.map(name => (
          <div key={name} onClick={()=>setFilter(name)}
            style={{ padding:"7px 10px", borderRadius:6, cursor:"pointer", background:filter===name?C.card:"transparent", fontSize:12, color:filter===name?C.textPrimary:C.textSecondary, marginBottom:3 }}>
            {name} ({notes.filter(n=>n.contact_name===name).length})
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
        <h2 style={{ margin:"0 0 20px", fontSize:20, fontWeight:800, color:C.textPrimary }}>Notes</h2>

        {/* Add Note */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
          <input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Contact name (optional)"
            style={{ width:"100%", boxSizing:"border-box", padding:"8px 12px", borderRadius:6, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:12, outline:"none", marginBottom:8 }} />
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Add a note…" rows={3}
            style={{ width:"100%", boxSizing:"border-box", padding:10, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, color:C.textPrimary, fontSize:13, fontFamily:"inherit", resize:"vertical", outline:"none" }} />
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
            <button onClick={save} disabled={saving||!input.trim()}
              style={{ padding:"7px 18px", borderRadius:6, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving||!input.trim()?0.6:1 }}>
              {saving?"Saving…":"Save Note"}
            </button>
          </div>
        </div>

        {loading && <div style={{ textAlign:"center", color:C.textMuted, fontSize:13 }}>Loading…</div>}
        {!loading && visible.length===0 && <div style={{ textAlign:"center", color:C.textMuted, fontSize:13, paddingTop:40 }}>No notes yet.</div>}

        {visible.map(note => (
          <div key={note.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:10, borderLeft:`3px solid ${C.amber}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <span style={{ fontSize:12, fontWeight:700, color:C.amber }}>{note.author}</span>
                {note.contact_name && <span style={{ fontSize:11, color:C.textMuted, marginLeft:8 }}>re: {note.contact_name}</span>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:10, color:C.textMuted }}>{timeAgo(note.created_at)}</span>
                <button onClick={()=>remove(note.id)} style={{ background:"transparent", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13 }}>✕</button>
              </div>
            </div>
            <p style={{ margin:0, fontSize:13, color:C.textSecondary, lineHeight:1.6 }}>{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
