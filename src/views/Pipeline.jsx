import { useState, useEffect } from "react";
import { C, AGENTS, PIPELINE_STAGES } from "../data.js";
import { AgentAvatar, SectionHeader } from "../components/utils.jsx";
import { getContacts, addContact, updateContact, getAllCommunications, logCommunication } from "../lib/db.js";

const STAGE_COLORS = { cold:C.textSecondary, contacted:"#00B4FF", qualified:C.primary, negotiating:C.amber, won:C.green, lost:C.red };

function EmailComposeModal({ lead, onClose, onSend }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || !lead.email?.trim()) {
      alert("Please fill in subject and body, and ensure lead has an email");
      return;
    }
    setSending(true);
    try {
      await onSend({
        contact_id: lead.id,
        channel: "email",
        message: body,
        subject,
        to: lead.email,
      });
      onClose();
    } catch (err) {
      console.error("Failed to send email:", err);
      alert("Failed to send email. Please try again.");
      setSending(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1001 }}>
      <div style={{ width:600, maxHeight:"90vh", overflow:"auto", background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.textPrimary }}>Send Email</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ marginBottom:16, padding:"12px", background:C.surface, borderRadius:8 }}>
          <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase", marginBottom:4 }}>To</div>
          <div style={{ fontSize:12, fontWeight:600, color:lead.email?C.textPrimary:C.red }}>
            {lead.email || "⚠️ No email address"}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:20 }}>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject…"
              style={{
                width:"100%",
                boxSizing:"border-box",
                padding:"9px 12px",
                borderRadius:8,
                background:C.surface,
                border:`1px solid ${C.border}`,
                color:C.textPrimary,
                fontSize:13,
                outline:"none",
              }}
            />
          </div>

          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your email…"
              style={{
                width:"100%",
                boxSizing:"border-box",
                padding:"10px 12px",
                borderRadius:8,
                background:C.surface,
                border:`1px solid ${C.border}`,
                color:C.textPrimary,
                fontSize:13,
                outline:"none",
                fontFamily:"inherit",
                minHeight:200,
                resize:"vertical",
              }}
            />
            <div style={{ fontSize:10, color:C.textMuted, marginTop:4 }}>{body.length} characters</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding:"9px 20px",
              borderRadius:8,
              border:`1px solid ${C.border}`,
              background:"transparent",
              color:C.textSecondary,
              fontSize:13,
              cursor:"pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim() || !lead.email?.trim()}
            style={{
              padding:"9px 20px",
              borderRadius:8,
              border:"none",
              background:C.primary,
              color:"#fff",
              fontSize:13,
              fontWeight:700,
              cursor:"pointer",
              opacity:sending || !subject.trim() || !body.trim() || !lead.email?.trim()?0.6:1,
            }}
          >
            {sending?"Sending…":"Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

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

function FilterPanel({ filters, setFilters, onClose }) {
  const updateFilter = (key, value) => {
    setFilters(p => ({ ...p, [key]: value }));
  };

  const activeCount = [
    filters.stage,
    filters.agent,
    filters.minScore > 0,
    filters.maxScore < 100,
    filters.minValue > 0,
    filters.maxValue < 999999,
    filters.lastContactDays !== null,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilters({
      stage: "",
      agent: "",
      minScore: 0,
      maxScore: 100,
      minValue: 0,
      maxValue: 999999,
      lastContactDays: null,
    });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:450, maxHeight:"90vh", overflow:"auto", background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.textPrimary }}>Filter Leads {activeCount > 0 && <span style={{ fontSize:12, fontWeight:700, background:C.primary, color:"#fff", borderRadius:20, padding:"2px 8px", marginLeft:8 }}>{activeCount}</span>}</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:20 }}>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Stage</label>
            <select value={filters.stage} onChange={e => updateFilter("stage", e.target.value)}
              style={{ width:"100%", padding:"9px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", cursor:"pointer" }}>
              <option value="">All Stages</option>
              {["cold","contacted","qualified","negotiating","won","lost"].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Agent</label>
            <select value={filters.agent} onChange={e => updateFilter("agent", e.target.value)}
              style={{ width:"100%", padding:"9px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", cursor:"pointer" }}>
              <option value="">All Agents</option>
              {["aria","melody","lyric","muse"].map(a=><option key={a} value={a}>{a.toUpperCase()}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Lead Score: {filters.minScore} - {filters.maxScore}</label>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <input type="range" min="0" max="100" value={filters.minScore} onChange={e => updateFilter("minScore", Number(e.target.value))}
                style={{ flex:1, cursor:"pointer" }} />
              <input type="range" min="0" max="100" value={filters.maxScore} onChange={e => updateFilter("maxScore", Number(e.target.value))}
                style={{ flex:1, cursor:"pointer" }} />
            </div>
          </div>

          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Deal Value Range</label>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <div style={{ flex:1 }}>
                <input type="number" value={filters.minValue} onChange={e => updateFilter("minValue", Number(e.target.value))} placeholder="Min"
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
              </div>
              <span style={{ color:C.textMuted }}>—</span>
              <div style={{ flex:1 }}>
                <input type="number" value={filters.maxValue} onChange={e => updateFilter("maxValue", Number(e.target.value))} placeholder="Max"
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Last Contact Within Days</label>
            <input type="number" min="0" value={filters.lastContactDays || ""} onChange={e => updateFilter("lastContactDays", e.target.value ? Number(e.target.value) : null)} placeholder="Any"
              style={{ width:"100%", padding:"9px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
          </div>
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={resetFilters} style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer", fontWeight:600 }}>Reset</button>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Done</button>
        </div>
      </div>
    </div>
  );
}

function ActivityTimeline({ lead, communications }) {
  const leadComms = communications.filter(c => c.contact_id === lead.id);

  const activities = [
    ...leadComms.map(c => ({
      type: 'communication',
      timestamp: c.created_at,
      channel: c.channel,
      status: c.status,
      message: c.message,
      icon: c.channel === 'email' ? '📧' : c.channel === 'call' ? '☎️' : c.channel === 'sms' ? '💬' : c.channel === 'linkedin' ? '🔗' : '📨',
    })),
    {
      type: 'created',
      timestamp: lead.created_at,
      icon: '⭐',
      label: 'Lead created',
    }
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 30);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:12, fontWeight:700, color:C.textPrimary, marginBottom:12 }}>📋 Activity Timeline</div>
      {activities.length === 0 ? (
        <div style={{ padding:"16px", background:C.surface, borderRadius:8, color:C.textMuted, fontSize:12, textAlign:"center" }}>No activity yet</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {activities.map((activity, idx) => (
            <div key={`${activity.type}-${idx}`} style={{ display:"flex", gap:12, padding:"12px", background:C.surface, borderRadius:8 }}>
              <div style={{ fontSize:16, flexShrink:0 }}>{activity.icon}</div>
              <div style={{ flex:1 }}>
                {activity.type === 'communication' ? (
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start", marginBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:C.textPrimary }}>{activity.channel.toUpperCase()}</span>
                      <span style={{ fontSize:9, color:C.textMuted }}>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                    <div style={{ fontSize:11, color:C.textSecondary, marginBottom:4 }}>{activity.message?.substring(0,100) || "No message"}</div>
                    <div style={{ fontSize:9, color:C.textMuted }}>
                      Status: <span style={{ fontWeight:700, color:activity.status==='completed'?C.green:activity.status==='failed'?C.red:C.amber }}>{activity.status}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:11, fontWeight:700, color:C.textPrimary }}>{activity.label}</span>
                      <span style={{ fontSize:9, color:C.textMuted }}>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadDetailModal({ lead, communications, onClose, onUpdate, onCommunicationSent }) {
  const [updates, setUpdates] = useState({});
  const [saving, setSaving] = useState(false);
  const [showEmailCompose, setShowEmailCompose] = useState(false);
  const agent = AGENTS.find(a => a.id === lead.assigned_to);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(lead.id, updates);
    setSaving(false);
    onClose();
  };

  const handleSendEmail = async (emailData) => {
    try {
      await logCommunication({
        contact_id: emailData.contact_id,
        channel: "email",
        message: emailData.message,
        status: "completed",
        metadata: JSON.stringify({ subject: emailData.subject, to: emailData.to }),
      });
      if (onCommunicationSent) onCommunicationSent();
    } catch (err) {
      console.error("Failed to send email:", err);
      throw err;
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:600, maxHeight:"90vh", overflow:"auto", background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:C.textPrimary }}>{lead.name}</h3>
            <div style={{ fontSize:12, color:C.textSecondary, marginTop:4 }}>{lead.company || lead.industry || "No company"}</div>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:20, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20, padding:"16px", background:C.surface, borderRadius:10 }}>
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase", marginBottom:4 }}>Deal Value</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary }}>${Number(lead.value||0).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase", marginBottom:4 }}>Lead Score</div>
            <div style={{ fontSize:16, fontWeight:800, color:lead.score>=80?C.green:lead.score>=55?C.amber:C.red }}>{lead.score}</div>
          </div>
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase", marginBottom:4 }}>Stage</div>
            <select defaultValue={lead.stage} onChange={e=>setUpdates(p=>({...p,stage:e.target.value}))}
              style={{ width:"100%", padding:"8px 10px", borderRadius:6, background:C.card, border:`1px solid ${C.border}`, color:STAGE_COLORS[lead.stage], fontSize:12, fontWeight:700, cursor:"pointer" }}>
              {["cold","contacted","qualified","negotiating","won","lost"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase", marginBottom:4 }}>Agent</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:C.card, borderRadius:6, border:`1px solid ${C.border}` }}>
              <AgentAvatar agentId={agent?.id} size={18} />
              <span style={{ fontSize:12, fontWeight:700, color:agent?.color }}>{agent?.name.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <ActivityTimeline lead={lead} communications={communications} />

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={() => setShowEmailCompose(true)} style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer" }}>✉️ Email</button>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer" }}>Close</button>
          <button onClick={handleSave} disabled={saving} style={{ padding:"9px 20px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving?0.6:1 }}>
            {saving?"Saving…":"Save Changes"}
          </button>
        </div>
        {showEmailCompose && <EmailComposeModal lead={lead} onClose={() => setShowEmailCompose(false)} onSend={handleSendEmail} />}
      </div>
    </div>
  );
}

export default function Pipeline({ setSelectedLead, setActiveTab }) {
  const [contacts, setContacts] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLead, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [bulkStage, setBulkStage] = useState("");
  const [bulkAgent, setBulkAgent] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    stage: "",
    agent: "",
    minScore: 0,
    maxScore: 100,
    minValue: 0,
    maxValue: 999999,
    lastContactDays: null,
  });

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

  const handleUpdate = async (id, updates) => {
    await updateContact(id, updates);
    setContacts(p => p.map(c => c.id===id ? {...c,...updates} : c));
  };

  const handleCommunicationSent = async () => {
    const updatedComms = await getAllCommunications().catch(() => []);
    setCommunications(updatedComms || []);
  };

  const toggleLeadSelection = (leadId) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleBulkStageChange = async () => {
    if (!bulkStage || selectedLeads.size === 0) return;
    setBulkProcessing(true);
    try {
      await Promise.all(Array.from(selectedLeads).map(id => updateContact(id, { stage: bulkStage })));
      setContacts(p => p.map(c => selectedLeads.has(c.id) ? {...c, stage: bulkStage} : c));
      setSelectedLeads(new Set());
      setBulkMode(false);
    } catch (err) {
      console.error("Failed to update leads:", err);
    }
    setBulkProcessing(false);
  };

  const handleBulkAgentChange = async () => {
    if (!bulkAgent || selectedLeads.size === 0) return;
    setBulkProcessing(true);
    try {
      await Promise.all(Array.from(selectedLeads).map(id => updateContact(id, { assigned_to: bulkAgent })));
      setContacts(p => p.map(c => selectedLeads.has(c.id) ? {...c, assigned_to: bulkAgent} : c));
      setSelectedLeads(new Set());
      setBulkMode(false);
    } catch (err) {
      console.error("Failed to update leads:", err);
    }
    setBulkProcessing(false);
  };

  const filtered = contacts.filter(c => {
    // Search filter
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase());

    // Stage filter
    if (filters.stage && c.stage !== filters.stage) return false;

    // Agent filter
    if (filters.agent && c.assigned_to !== filters.agent) return false;

    // Score filter
    const score = Number(c.score || 0);
    if (score < filters.minScore || score > filters.maxScore) return false;

    // Value filter
    const value = Number(c.value || 0);
    if (value < filters.minValue || value > filters.maxValue) return false;

    // Last contact days filter
    if (filters.lastContactDays !== null) {
      const lastContact = c.last_contact ? new Date(c.last_contact) : null;
      if (!lastContact) return false;
      const daysSinceContact = (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceContact > filters.lastContactDays) return false;
    }

    return matchesSearch;
  });

  const stats = {
    total: filtered.length,
    value: filtered.reduce((s,l) => s + Number(l.value||0), 0),
    high_priority: filtered.filter(l => l.score >= 80).length,
  };

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <SectionHeader
        title="Lead Pipeline"
        sub="Cold → Contacted → Qualified → Negotiating → Won / Lost"
        action={<button onClick={()=>setShowAdd(true)} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.primary}`, background:`${C.primary}15`, color:C.primary, fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Add Lead</button>}
      />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12, marginBottom:24 }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", marginBottom:6 }}>Total Leads</div>
          <div style={{ fontSize:20, fontWeight:800, color:C.textPrimary }}>{stats.total}</div>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", marginBottom:6 }}>Pipeline Value</div>
          <div style={{ fontSize:20, fontWeight:800, color:C.green }}>${stats.value.toLocaleString()}</div>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", marginBottom:6 }}>High Priority</div>
          <div style={{ fontSize:20, fontWeight:800, color:C.amber }}>{stats.high_priority}</div>
        </div>
      </div>

      <div style={{ marginBottom:20, display:"flex", gap:12, alignItems:"center" }}>
        <input type="text" placeholder="Search leads by name, company, or industry…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:1, padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
        <button onClick={() => setShowFilters(!showFilters)} style={{ position:"relative", padding:"10px 16px", borderRadius:8, border:`1px solid ${showFilters?C.primary:C.border}`, background:showFilters?`${C.primary}15`:"transparent", color:showFilters?C.primary:C.textSecondary, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
          🔽 Filters
          {[filters.stage, filters.agent, filters.minScore > 0, filters.maxScore < 100, filters.minValue > 0, filters.maxValue < 999999, filters.lastContactDays !== null].filter(Boolean).length > 0 && (
            <span style={{ position:"absolute", top:-6, right:-6, background:C.primary, color:"#fff", fontSize:10, fontWeight:700, width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {[filters.stage, filters.agent, filters.minScore > 0, filters.maxScore < 100, filters.minValue > 0, filters.maxValue < 999999, filters.lastContactDays !== null].filter(Boolean).length}
            </span>
          )}
        </button>
        <button onClick={() => { setBulkMode(!bulkMode); setSelectedLeads(new Set()); }} style={{ padding:"10px 16px", borderRadius:8, border:`1px solid ${bulkMode?C.primary:C.border}`, background:bulkMode?`${C.primary}15`:"transparent", color:bulkMode?C.primary:C.textSecondary, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
          {bulkMode ? "✕ Bulk Off" : "✓ Bulk Mode"}
        </button>
      </div>

      {bulkMode && selectedLeads.size > 0 && (
        <div style={{ background:`${C.primary}15`, border:`1px solid ${C.primary}`, borderRadius:10, padding:14, marginBottom:20, display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.primary }}>{selectedLeads.size} lead{selectedLeads.size !== 1 ? "s" : ""} selected</span>
          <select value={bulkStage} onChange={e=>setBulkStage(e.target.value)} style={{ padding:"6px 10px", borderRadius:6, border:`1px solid ${C.primary}`, background:C.card, color:C.textPrimary, fontSize:11, cursor:"pointer" }}>
            <option value="">Move to stage…</option>
            {["cold","contacted","qualified","negotiating","won","lost"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          {bulkStage && <button onClick={handleBulkStageChange} disabled={bulkProcessing} style={{ padding:"6px 14px", borderRadius:6, border:"none", background:C.primary, color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", opacity:bulkProcessing?0.6:1 }}>
            {bulkProcessing ? "Updating…" : "Apply"}
          </button>}

          <select value={bulkAgent} onChange={e=>setBulkAgent(e.target.value)} style={{ padding:"6px 10px", borderRadius:6, border:`1px solid ${C.primary}`, background:C.card, color:C.textPrimary, fontSize:11, cursor:"pointer" }}>
            <option value="">Assign to…</option>
            {["aria","melody","lyric","muse"].map(a=><option key={a} value={a}>{a.toUpperCase()}</option>)}
          </select>
          {bulkAgent && <button onClick={handleBulkAgentChange} disabled={bulkProcessing} style={{ padding:"6px 14px", borderRadius:6, border:"none", background:C.primary, color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", opacity:bulkProcessing?0.6:1 }}>
            {bulkProcessing ? "Updating…" : "Apply"}
          </button>}

          <button onClick={() => { setSelectedLeads(new Set()); setBulkMode(false); }} style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:11, cursor:"pointer", marginLeft:"auto" }}>Clear</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", color:C.textMuted, fontSize:13, paddingTop:60 }}>Loading…</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12 }}>
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = filtered.filter(l => l.stage === stage.id);
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
                  const texts = leadComms.filter(c => c.channel === "sms").length;
                  const emails = leadComms.filter(c => c.channel === "email").length;
                  const isSelected = selectedLeads.has(lead.id);
                  return (
                    <div key={lead.id} onClick={() => bulkMode ? toggleLeadSelection(lead.id) : setSelected(lead)} style={{ background:isSelected?`${C.primary}20`:C.card, border:`1px solid ${isSelected?C.primary:C.border}`, borderRadius:8, padding:"10px 11px", borderLeft:`3px solid ${isSelected?C.primary:a?.color||C.border}`, cursor:"pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.background=isSelected?`${C.primary}20`:C.surface}
                      onMouseLeave={e=>e.currentTarget.style.background=isSelected?`${C.primary}20`:C.card}>
                      {bulkMode && (
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleLeadSelection(lead.id)} style={{ cursor:"pointer", width:16, height:16 }} />
                          <span style={{ fontSize:10, color:C.textMuted }}>{isSelected ? "Selected" : "Select"}</span>
                        </div>
                      )}
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
                      <select value={lead.stage} onClick={e=>e.stopPropagation()} onChange={e=>{e.stopPropagation();moveStage(lead.id, e.target.value);}}
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
      {selectedLead && <LeadDetailModal lead={selectedLead} communications={communications} onClose={()=>setSelected(null)} onUpdate={handleUpdate} onCommunicationSent={handleCommunicationSent} />}
      {showFilters && <FilterPanel filters={filters} setFilters={setFilters} onClose={()=>setShowFilters(false)} />}
    </div>
  );
}
