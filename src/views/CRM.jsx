import { useState, useEffect } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar, Badge, Btn, SectionHeader } from "../components/utils.jsx";
import { getContacts, addContact, updateContact, deleteContact, getNotes, addNote, getAgentVoice } from "../lib/db.js";
import { supabase } from "../lib/supabase.js";

const STAGE_COLOR = { cold:C.textSecondary, contacted:"#00B4FF", qualified:C.primary, negotiating:C.amber, won:C.green, lost:C.red };
const STAGES = ["cold","contacted","qualified","negotiating","won","lost"];

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ComposeModal({ contact, orgId, onClose }) {
  const [action, setAction] = useState("call"); // call | text | email
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const a = AGENTS.find(ag => ag.id === contact.assigned_to);

  const send = async () => {
    if (!message.trim() || !contact.phone && action === "call") return;
    setSending(true);
    try {
      let voiceId = null;
      if (action === "call" && orgId) {
        voiceId = await getAgentVoice(orgId, contact.assigned_to);
      }

      const payload = {
        contact_id: contact.id,
        contact_name: contact.name,
        contact_phone: contact.phone,
        contact_email: contact.email,
        agent_id: contact.assigned_to,
        action,
        message: message.trim(),
        voice_id: voiceId,
        created_at: new Date().toISOString(),
      };

      const res = await supabase.functions.invoke("send-outreach", { body: payload });
      if (res.error) throw new Error(res.error.message);

      setMessage("");
      onClose();
    } catch (e) {
      console.error("Failed to send:", e);
      alert(`Error: ${e.message}`);
    }
    setSending(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:500, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28, maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.textPrimary }}>Send Message</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Channel</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { value:"call", icon:"☎️", label:"Call" },
              { value:"text", icon:"💬", label:"Text" },
              { value:"email", icon:"📧", label:"Email" },
            ].map(ch => (
              <button key={ch.value} onClick={() => setAction(ch.value)}
                style={{ padding:"12px 14px", borderRadius:10, border:`2px solid ${action===ch.value?a?.color:C.border}`, background:action===ch.value?`${a?.color}12`:"transparent", cursor:"pointer", textAlign:"center" }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{ch.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:action===ch.value?a?.color:C.textPrimary }}>{ch.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>
            {action === "call" ? "Call Script" : action === "text" ? "Message" : "Email Body"}
          </label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={
            action === "call" ? "What should the AI agent say?" :
            action === "text" ? "Text message content…" :
            "Email message…"
          } rows={5}
            style={{ width:"100%", padding:12, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.textPrimary, fontSize:13, fontFamily:"inherit", resize:"none", outline:"none", boxSizing:"border-box" }} />
        </div>

        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:14, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Going to</div>
          <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary, marginBottom:4 }}>{contact.name}</div>
          <div style={{ fontSize:12, color:C.textSecondary }}>
            {action === "call" ? `☎️ ${contact.phone || "No phone"}` :
             action === "text" ? `💬 ${contact.phone || "No phone"}` :
             `📧 ${contact.email || "No email"}`}
          </div>
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={send} disabled={sending || !message.trim() || (action === "call" && !contact.phone)}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:sending || !message.trim() ? 0.6 : 1 }}>
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ c, selected, onClick }) {
  const a = AGENTS.find(ag => ag.id === c.assigned_to);
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", cursor:"pointer", background:selected ? C.card:"transparent", borderBottom:`1px solid ${C.border}` }}
      onMouseEnter={e => !selected && (e.currentTarget.style.background = C.surface)}
      onMouseLeave={e => !selected && (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width:36, height:36, borderRadius:"50%", background:`${a?.color||C.primary}18`, border:`2px solid ${a?.color||C.primary}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, fontWeight:700, color:a?.color||C.primary }}>
        {c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
        <div style={{ fontSize:11, color:C.textSecondary }}>{c.company}</div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:11, fontWeight:700, color:STAGE_COLOR[c.stage]||C.textSecondary, textTransform:"capitalize" }}>{c.stage}</div>
        <div style={{ fontSize:10, color:C.textMuted }}>${Number(c.value||0).toLocaleString()}</div>
      </div>
    </div>
  );
}

function ContactDetail({ contact, orgId, onClose, onStageChange }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const a = AGENTS.find(ag => ag.id === contact.assigned_to);

  useEffect(() => {
    getNotes().then(all => setNotes(all.filter(n => n.contact_id === contact.id)));
  }, [contact.id]);

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    const n = await addNote({ contact_id: contact.id, contact_name: contact.name, content: noteText.trim(), author: "Advisor", role: "advisor" });
    setNotes(prev => [n, ...prev]);
    setNoteText("");
    setSavingNote(false);
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"20px 24px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:C.textPrimary }}>{contact.name}</div>
            <div style={{ fontSize:13, color:C.textSecondary }}>{contact.company}{contact.industry ? ` · ${contact.industry}` : ""}</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ fontSize:24, fontWeight:800, color:contact.score>=80?C.green:contact.score>=55?C.amber:C.red }}>{contact.score}</div>
            <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <select value={contact.stage} onChange={e => onStageChange(contact.id, e.target.value)}
            style={{ padding:"3px 8px", borderRadius:6, border:`1px solid ${STAGE_COLOR[contact.stage]||C.border}`, background:C.card, color:STAGE_COLOR[contact.stage]||C.textSecondary, fontSize:11, fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>
            {STAGES.map(s => <option key={s} value={s} style={{ textTransform:"capitalize" }}>{s}</option>)}
          </select>
          {(contact.tags||[]).map(t => <Badge key={t} color={C.textMuted}>{t}</Badge>)}
          {a && <Badge color={a.color}>{a.avatar} {a.name}</Badge>}
        </div>
      </div>

      <div style={{ display:"flex", gap:4, padding:"0 24px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0, justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:4 }}>
          {["overview","notes"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding:"10px 14px", border:"none", background:"transparent", color:activeTab===t?C.primary:C.textSecondary, fontSize:12, fontWeight:700, cursor:"pointer", borderBottom:`2px solid ${activeTab===t?C.primary:"transparent"}`, textTransform:"capitalize" }}>{t}</button>
          ))}
        </div>
        <button onClick={() => setShowCompose(true)}
          style={{ padding:"8px 14px", borderRadius:6, border:`1px solid ${a?.color}`, background:a?.color, color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
          ☎️ Send Message
        </button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
        {activeTab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Contact Info</div>
              {[
                { label:"Email",   val:contact.email||"—" },
                { label:"Phone",   val:contact.phone||"—" },
                { label:"Source",  val:contact.source||"—" },
                { label:"Value",   val:`$${Number(contact.value||0).toLocaleString()}` },
                { label:"Last Contact", val:timeAgo(contact.last_contact) },
                { label:"Added",   val:new Date(contact.created_at).toLocaleDateString() },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:12, color:C.textMuted }}>{r.label}</span>
                  <span style={{ fontSize:12, color:C.textPrimary, fontWeight:600 }}>{r.val}</span>
                </div>
              ))}
            </div>
            {a && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
                <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Assigned Agent</div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <AgentAvatar agentId={a.id} size={40} />
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:a.color }}>{a.name}</div>
                    <div style={{ fontSize:11, color:C.textSecondary }}>{a.role} · {a.direction}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:16 }}>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note…" rows={3}
                style={{ width:"100%", padding:10, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, color:C.textPrimary, fontSize:13, fontFamily:"inherit", resize:"none", outline:"none", boxSizing:"border-box" }} />
              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
                <button onClick={saveNote} disabled={savingNote}
                  style={{ padding:"6px 16px", borderRadius:6, border:"none", background:C.primary, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                  {savingNote ? "Saving…" : "Save Note"}
                </button>
              </div>
            </div>
            {notes.length === 0 && <div style={{ fontSize:12, color:C.textMuted, textAlign:"center", marginTop:24 }}>No notes yet.</div>}
            {notes.map(n => (
              <div key={n.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:14, marginBottom:10, borderLeft:`3px solid ${C.amber}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:C.amber }}>{n.author}</span>
                  <span style={{ fontSize:10, color:C.textMuted }}>{timeAgo(n.created_at)}</span>
                </div>
                <p style={{ margin:0, fontSize:12, color:C.textSecondary, lineHeight:1.6 }}>{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCompose && <ComposeModal contact={contact} orgId={orgId} onClose={() => setShowCompose(false)} />}
    </div>
  );
}

function AddContactModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:"", company:"", email:"", phone:"", industry:"", stage:"cold", value:"", source:"", assigned_to:"aria", score:50 });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]:v }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave({ ...form, value: Number(form.value)||0, score: Number(form.score)||50, tags: [], last_contact: new Date().toISOString() });
    setSaving(false);
  };

  const field = (label, key, type="text", placeholder="") => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
        style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:480, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28, maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.textPrimary }}>New Contact</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <div>{field("Name *","name","text","Full name")}</div>
          <div>{field("Company","company","text","Company name")}</div>
          <div>{field("Email","email","email","email@example.com")}</div>
          <div>{field("Phone","phone","text","(555) 000-0000")}</div>
          <div>{field("Industry","industry","text","e.g. HVAC")}</div>
          <div>{field("Deal Value","value","number","0")}</div>
          <div>{field("Source","source","text","e.g. Facebook Ad")}</div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>Stage</label>
            <select value={form.stage} onChange={e => set("stage", e.target.value)}
              style={{ width:"100%", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", marginBottom:14 }}>
              {STAGES.map(s => <option key={s} value={s} style={{ textTransform:"capitalize" }}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>Assigned Agent</label>
            <select value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)}
              style={{ width:"100%", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", marginBottom:14 }}>
              <option value="aria">ARIA</option>
              <option value="melody">MELODY</option>
              <option value="lyric">LYRIC</option>
              <option value="muse">MUSE</option>
            </select>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving||!form.name.trim()}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving||!form.name.trim()?0.6:1 }}>
            {saving ? "Saving…" : "Add Contact"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRM({ orgId }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd]   = useState(false);

  useEffect(() => {
    getContacts().then(data => { setContacts(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleAddContact = async (data) => {
    const c = await addContact(data);
    setContacts(prev => [c, ...prev]);
    setShowAdd(false);
  };

  const handleStageChange = async (id, stage) => {
    await updateContact(id, { stage });
    setContacts(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
    if (selected?.id === id) setSelected(prev => ({ ...prev, stage }));
  };

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || (c.company||"").toLowerCase().includes(q);
    const matchStage  = stageFilter === "all" || c.stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <div style={{ width:selected?320:"100%", maxWidth:selected?320:"none", borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"18px 16px 12px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <SectionHeader title="AIMS AI CRM" sub={`${contacts.length} contacts`} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…"
            style={{ width:"100%", padding:"8px 12px", borderRadius:7, background:C.card, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", marginBottom:10, boxSizing:"border-box" }} />
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {["all",...STAGES].map(s => (
              <button key={s} onClick={() => setStageFilter(s)}
                style={{ padding:"3px 10px", borderRadius:20, border:`1px solid ${stageFilter===s?(STAGE_COLOR[s]||C.primary):C.border}`, background:stageFilter===s?`${STAGE_COLOR[s]||C.primary}20`:"transparent", color:stageFilter===s?(STAGE_COLOR[s]||C.primary):C.textMuted, fontSize:10, fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          {loading && <div style={{ padding:32, textAlign:"center", fontSize:12, color:C.textMuted }}>Loading…</div>}
          {!loading && filtered.map(c => (
            <ContactRow key={c.id} c={c} selected={selected?.id===c.id} onClick={() => setSelected(selected?.id===c.id?null:c)} />
          ))}
          {!loading && filtered.length===0 && (
            <div style={{ padding:32, textAlign:"center", fontSize:12, color:C.textMuted }}>
              {contacts.length===0 ? "No contacts yet. Add your first one!" : "No contacts match your search."}
            </div>
          )}
        </div>
        <div style={{ padding:14, borderTop:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
          <button onClick={() => setShowAdd(true)} style={{ width:"100%", padding:"9px 0", borderRadius:8, border:`1px solid ${C.primary}`, background:`${C.primary}15`, color:C.primary, fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Add Contact</button>
        </div>
      </div>

      {selected && (
        <div style={{ flex:1, overflow:"hidden" }}>
          <ContactDetail contact={selected} orgId={orgId} onClose={() => setSelected(null)} onStageChange={handleStageChange} />
        </div>
      )}

      {showAdd && <AddContactModal onClose={() => setShowAdd(false)} onSave={handleAddContact} />}
    </div>
  );
}
