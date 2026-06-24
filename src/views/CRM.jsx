import { useState } from "react";
import { C, AGENTS, SAMPLE_CONTACTS, SAMPLE_NOTES } from "../data.js";
import { AgentAvatar, Badge, Btn, SectionHeader } from "../components/utils.jsx";

const STAGE_COLOR = { cold: C.textSecondary, contacted: "#00B4FF", qualified: C.primary, negotiating: C.amber, won: C.green, lost: C.red };

function ContactRow({ c, selected, onClick }) {
  const a = AGENTS.find(ag => ag.id === c.assignedTo);
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", cursor:"pointer", background: selected ? C.card : "transparent", borderBottom:`1px solid ${C.border}`, transition:"background .15s" }}
      onMouseEnter={e => !selected && (e.currentTarget.style.background = C.surface)}
      onMouseLeave={e => !selected && (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width:36, height:36, borderRadius:"50%", background:`${a?.color || C.primary}18`, border:`2px solid ${a?.color || C.primary}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
        {c.name.split(" ").map(n => n[0]).join("").slice(0,2)}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
        <div style={{ fontSize:11, color:C.textSecondary }}>{c.company}</div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:11, fontWeight:700, color: STAGE_COLOR[c.stage] || C.textSecondary, textTransform:"capitalize" }}>{c.stage}</div>
        <div style={{ fontSize:10, color:C.textMuted }}>${c.value.toLocaleString()}</div>
      </div>
    </div>
  );
}

function ContactDetail({ contact, onClose }) {
  const [tab, setTab] = useState("overview");
  const a = AGENTS.find(ag => ag.id === contact.assignedTo);
  const notes = SAMPLE_NOTES.filter(n => n.lead === contact.name);
  const tabs = ["overview", "timeline", "notes"];

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"20px 24px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:C.textPrimary }}>{contact.name}</div>
            <div style={{ fontSize:13, color:C.textSecondary }}>{contact.company} · {contact.industry}</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ fontSize:24, fontWeight:800, color: contact.score >= 80 ? C.green : contact.score >= 55 ? C.amber : C.red }}>{contact.score}</div>
            <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer", padding:"2px 6px" }}>✕</button>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Badge color={STAGE_COLOR[contact.stage] || C.textSecondary}>{contact.stage.toUpperCase()}</Badge>
          {(contact.tags || []).map(t => <Badge key={t} color={C.textMuted}>{t}</Badge>)}
          {a && <Badge color={a.color}>{a.avatar} {a.name}</Badge>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, padding:"0 24px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"10px 14px", border:"none", background:"transparent", color: tab === t ? C.primary : C.textSecondary, fontSize:12, fontWeight:700, cursor:"pointer", borderBottom:`2px solid ${tab === t ? C.primary : "transparent"}`, textTransform:"capitalize" }}>{t}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
        {tab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Contact Info</div>
              {[
                { label:"Email",   val:contact.email },
                { label:"Phone",   val:contact.phone },
                { label:"Source",  val:contact.source },
                { label:"Value",   val:`$${contact.value.toLocaleString()}` },
                { label:"Last Contact", val:contact.lastContact },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:12, color:C.textMuted }}>{r.label}</span>
                  <span style={{ fontSize:12, color:C.textPrimary, fontWeight:600 }}>{r.val}</span>
                </div>
              ))}
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Assigned Agent</div>
              {a ? (
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <AgentAvatar agentId={a.id} size={40} />
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:a.color }}>{a.name}</div>
                    <div style={{ fontSize:11, color:C.textSecondary }}>{a.role}</div>
                    <div style={{ fontSize:11, color:C.textSecondary }}>{a.direction} · {a.channels.join(", ")}</div>
                  </div>
                </div>
              ) : <div style={{ fontSize:12, color:C.textMuted }}>Unassigned</div>}
            </div>
          </div>
        )}

        {tab === "timeline" && (
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:14 }}>Activity Timeline</div>
            {[
              { icon:"📱", text:`ARIA initiated recovery sequence`, time:contact.lastContact, color:"#00B4FF" },
              { icon:"📧", text:`Email sent — case study + ROI brief`, time:"3 days ago", color:C.primary },
              { icon:"💬", text:`SMS follow-up sent`, time:"2 days ago", color:C.green },
              { icon:"📊", text:`Lead score updated → ${contact.score}`, time:"1 day ago", color:C.amber },
            ].map((ev, i) => (
              <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:14 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:`${ev.color}15`, border:`1px solid ${ev.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{ev.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:C.textPrimary }}>{ev.text}</div>
                  <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{ev.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "notes" && (
          <div>
            {notes.length === 0 && <div style={{ fontSize:12, color:C.textMuted, textAlign:"center", marginTop:32 }}>No notes yet for this contact.</div>}
            {notes.map(n => {
              const rc = { ai:C.primary, advisor:C.amber, admin:"#A855F7" };
              return (
                <div key={n.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:14, marginBottom:10, borderLeft:`3px solid ${rc[n.role] || C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {n.agentId && <AgentAvatar agentId={n.agentId} size={20} />}
                      <span style={{ fontSize:12, fontWeight:700, color: rc[n.role] || C.textSecondary }}>{n.author}</span>
                      <Badge color={rc[n.role] || C.textSecondary}>{n.role.toUpperCase()}</Badge>
                    </div>
                    <span style={{ fontSize:10, color:C.textMuted }}>{n.ts}</span>
                  </div>
                  <p style={{ margin:0, fontSize:12, color:C.textSecondary, lineHeight:1.6 }}>{n.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CRM({ setActiveTab, setSelectedLead: setConvLead }) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const stages = ["all","cold","contacted","qualified","negotiating","won","lost"];
  const filtered = SAMPLE_CONTACTS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase());
    const matchStage  = stageFilter === "all" || c.stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Contact List */}
      <div style={{ width: selected ? 320 : "100%", maxWidth: selected ? 320 : "none", borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", transition:"width .2s", flexShrink:0 }}>
        <div style={{ padding:"18px 16px 12px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <SectionHeader title="AIMS AI CRM" sub={`${SAMPLE_CONTACTS.length} contacts`} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…"
            style={{ width:"100%", padding:"8px 12px", borderRadius:7, background:C.card, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", marginBottom:10 }} />
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {stages.map(s => (
              <button key={s} onClick={() => setStageFilter(s)}
                style={{ padding:"3px 10px", borderRadius:20, border:`1px solid ${stageFilter===s ? (STAGE_COLOR[s]||C.primary) : C.border}`, background: stageFilter===s ? `${STAGE_COLOR[s]||C.primary}20` : "transparent", color: stageFilter===s ? (STAGE_COLOR[s]||C.primary) : C.textMuted, fontSize:10, fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.map(c => (
            <ContactRow key={c.id} c={c} selected={selected?.id === c.id} onClick={() => setSelected(c === selected ? null : c)} />
          ))}
          {filtered.length === 0 && <div style={{ padding:32, textAlign:"center", fontSize:12, color:C.textMuted }}>No contacts match your search.</div>}
        </div>
        <div style={{ padding:14, borderTop:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
          <Btn style={{ width:"100%" }}>+ Add Contact</Btn>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div style={{ flex:1, overflow:"hidden" }}>
          <ContactDetail contact={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}
