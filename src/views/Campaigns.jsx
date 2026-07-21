import { useState, useEffect } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar, Badge } from "../components/utils.jsx";
import { supabase } from "../lib/supabase.js";

// Only outbound, call-capable agents can run campaigns.
// LYRIC (content) belongs in the Lyric Workstation; MUSE is inbound-only.
const CAMPAIGN_AGENT_IDS = ["aria", "melody", "allegra"];

const CAMPAIGN_TYPES = [
  { id: "lead-recovery", label: "Lead Recovery", desc: "Reconnect with cold/lost leads", agent: "aria", stages: ["cold", "lost"] },
  { id: "closing", label: "Closing Sequence", desc: "Convert qualified/negotiating leads", agent: "melody", stages: ["qualified", "negotiating"] },
  { id: "appointment", label: "Appointment Booking", desc: "Book time with contacted leads", agent: "allegra", stages: ["contacted", "qualified"] },
  { id: "profit-leak-analysis", label: "Profit Leak Analysis", desc: "First-touch diagnostic call for cold leads", agent: "allegra", stages: ["cold"] },
];

const CHANNEL_OPTIONS = [
  { value: "call", icon: "☎️", label: "Call" },
  { value: "text", icon: "💬", label: "Text" },
  { value: "email", icon: "📧", label: "Email" },
];

function CreateCampaignModal({ onClose, onSave, orgId, campaign }) {
  const isEdit = !!campaign;
  const [form, setForm] = useState(() => campaign ? {
    name: campaign.name || "",
    description: campaign.description || "",
    agent_id: campaign.agent_id || "aria",
    campaign_type: campaign.campaign_type || "lead-recovery",
    channel: campaign.channel || "call",
    target_audience: campaign.target_audience || "",
    goal: campaign.goal || "",
    start_date: campaign.start_date || new Date().toISOString().split('T')[0],
  } : {
    name: "",
    description: "",
    agent_id: "aria",
    campaign_type: "lead-recovery",
    channel: "call",
    target_audience: "",
    goal: "",
    start_date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  const campaignAgents = AGENTS.filter(a => CAMPAIGN_AGENT_IDS.includes(a.id));
  const currentAgent = campaignAgents.find(a => a.id === form.agent_id);
  const availableChannels = CHANNEL_OPTIONS.filter(ch => {
    if (!currentAgent) return true;
    if (ch.value === "call") return currentAgent.channels.includes("voice");
    if (ch.value === "text") return currentAgent.channels.includes("sms") || currentAgent.channels.includes("text");
    if (ch.value === "email") return currentAgent.channels.includes("email");
    return true;
  });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const handleTypeSelect = (ct) => {
    setForm(p => ({ ...p, campaign_type: ct.id, agent_id: ct.agent }));
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:520, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.textPrimary }}>{isEdit ? "Edit Campaign" : "New Campaign"}</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Campaign Name */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Campaign Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} placeholder="e.g. Q3 Lead Recovery"
              style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
          </div>

          {/* Description */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Message / Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({...p, description:e.target.value}))} placeholder="What should the agent say? e.g. Hi {{name}}, following up on..."
              rows={3}
              style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", fontFamily:"inherit", resize:"vertical" }} />
          </div>

          {/* Campaign Type */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Campaign Type *</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {CAMPAIGN_TYPES.map(ct => (
                <button key={ct.id} onClick={() => handleTypeSelect(ct)}
                  style={{ padding:"12px 14px", borderRadius:10, border:`2px solid ${form.campaign_type===ct.id?C.primary:C.border}`, background:form.campaign_type===ct.id?`${C.primary}12`:"transparent", cursor:"pointer", textAlign:"left" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:form.campaign_type===ct.id?C.primary:C.textPrimary, marginBottom:2 }}>{ct.label}</div>
                  <div style={{ fontSize:10, color:C.textSecondary }}>{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Agent Selection */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>AI Agent *</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
              {campaignAgents.map(a => (
                <button key={a.id} onClick={() => setForm(p => ({...p, agent_id:a.id}))}
                  style={{ padding:"10px 12px", borderRadius:8, border:`2px solid ${form.agent_id===a.id?a.color:C.border}`, background:form.agent_id===a.id?`${a.color}12`:"transparent", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                  <AgentAvatar agentId={a.id} size={20} />
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:form.agent_id===a.id?a.color:C.textPrimary }}>{a.name}</div>
                    <div style={{ fontSize:9, color:C.textMuted }}>{a.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Channel */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Channel *</label>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${availableChannels.length}, 1fr)`, gap:8 }}>
              {availableChannels.map(ch => (
                <button key={ch.value} onClick={() => setForm(p => ({...p, channel:ch.value}))}
                  style={{ padding:"12px 14px", borderRadius:10, border:`2px solid ${form.channel===ch.value?C.primary:C.border}`, background:form.channel===ch.value?`${C.primary}12`:"transparent", cursor:"pointer", textAlign:"center" }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{ch.icon}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:form.channel===ch.value?C.primary:C.textPrimary }}>{ch.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Target Audience (label only)</label>
            <input type="text" value={form.target_audience} onChange={e => setForm(p => ({...p, target_audience:e.target.value}))} placeholder="e.g. HVAC contractors in NY"
              style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
            <p style={{ fontSize:11, color:C.textMuted, margin:"6px 0 0" }}>
              Actual contacts are auto-selected by stage: {CAMPAIGN_TYPES.find(t => t.id === form.campaign_type)?.stages.join(", ")}
            </p>
          </div>

          {/* Goal */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Campaign Goal</label>
            <input type="text" value={form.goal} onChange={e => setForm(p => ({...p, goal:e.target.value}))} placeholder="e.g. 50 qualified leads"
              style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
          </div>

          {/* Start Date */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Start Date</label>
            <input type="date" value={form.start_date} onChange={e => setForm(p => ({...p, start_date:e.target.value}))}
              style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={onClose} style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()}
              style={{ padding:"10px 20px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving || !form.name.trim()?0.6:1 }}>
              {isEdit ? (saving ? "Saving…" : "Save Changes") : (saving ? "Creating…" : "Create Campaign")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LaunchPreviewModal({ campaign, matchedContacts, onClose, onConfirm, launching, progress, onAddContact }) {
  const typeInfo = CAMPAIGN_TYPES.find(t => t.id === campaign.campaign_type);
  const channel = campaign.channel || "call";
  const estCost = channel === "call" ? (matchedContacts.length * 0.09 * 12).toFixed(2) : null;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:440, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:800, color:C.textPrimary }}>Launch "{campaign.name}"?</h3>

        <div style={{ padding:14, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:C.textSecondary }}>Channel</span>
            <span style={{ fontSize:12, fontWeight:700, color:C.textPrimary, textTransform:"capitalize" }}>{channel}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:C.textSecondary }}>Matching stages</span>
            <span style={{ fontSize:12, fontWeight:700, color:C.textPrimary }}>{typeInfo?.stages.join(", ")}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:estCost ? 8 : 0 }}>
            <span style={{ fontSize:12, color:C.textSecondary }}>Contacts to reach</span>
            <span style={{ fontSize:12, fontWeight:700, color:C.textPrimary }}>{matchedContacts.length}</span>
          </div>
          {estCost && (
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:C.textSecondary }}>Est. max cost</span>
              <span style={{ fontSize:12, fontWeight:700, color:C.amber }}>~${estCost}</span>
            </div>
          )}
        </div>

        {matchedContacts.length === 0 && (
          <div style={{ marginBottom:16 }}>
            <p style={{ fontSize:12, color:C.red, margin:"0 0 10px" }}>No contacts match this campaign's stage criteria, or none have already been contacted by this campaign.</p>
            <button onClick={onAddContact} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${C.primary}`, background:"transparent", color:C.primary, fontSize:12, fontWeight:700, cursor:"pointer" }}>
              + Add Contact Now
            </button>
          </div>
        )}

        {launching && (
          <div style={{ marginBottom:16 }}>
            <div style={{ width:"100%", height:4, background:C.border, borderRadius:20, overflow:"hidden" }}>
              <div style={{ height:"100%", background:C.green, width:`${(progress/matchedContacts.length)*100}%`, transition:"width 0.3s" }} />
            </div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:6 }}>{progress} / {matchedContacts.length} sent</div>
          </div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} disabled={launching} style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, cursor:"pointer", opacity:launching?0.6:1 }}>Cancel</button>
          <button onClick={onConfirm} disabled={launching || matchedContacts.length === 0}
            style={{ padding:"10px 20px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:launching || matchedContacts.length === 0 ? 0.6 : 1 }}>
            {launching ? `Launching… ${progress}/${matchedContacts.length}` : "🚀 Confirm & Launch"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Campaigns({ setActiveTab }) {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignStats, setCampaignStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [launchTarget, setLaunchTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [matchedContacts, setMatchedContacts] = useState([]);
  const [launching, setLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);

  useEffect(() => {
    const loadCampaigns = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentOrgId = user.user_metadata?.org_id || user.id;
      setOrgId(currentOrgId);

      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("created_at", { ascending: false });

      setCampaigns(data || []);
      setLoading(false);

      if (data?.length) {
        const { data: cc } = await supabase
          .from("campaign_contacts")
          .select("campaign_id, status")
          .in("campaign_id", data.map(c => c.id));

        const stats = {};
        (cc || []).forEach(row => {
          if (!stats[row.campaign_id]) stats[row.campaign_id] = { total: 0, completed: 0 };
          stats[row.campaign_id].total++;
          if (row.status === "completed" || row.status === "sent") stats[row.campaign_id].completed++;
        });
        setCampaignStats(stats);
      }
    };

    loadCampaigns();
  }, []);

  const handleCreate = async (form) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        ...form,
        org_id: orgId,
        created_by: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      setCampaigns(p => [data, ...p]);
      setShowAdd(false);
    } else if (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign: " + error.message);
    }
  };

  const handleUpdate = async (form) => {
    const { data, error } = await supabase
      .from("campaigns")
      .update({
        name: form.name,
        description: form.description,
        agent_id: form.agent_id,
        campaign_type: form.campaign_type,
        channel: form.channel,
        target_audience: form.target_audience,
        goal: form.goal,
        start_date: form.start_date,
      })
      .eq("id", editTarget.id)
      .select()
      .single();

    if (!error && data) {
      setCampaigns(p => p.map(c => c.id === data.id ? data : c));
      setEditTarget(null);
    } else if (error) {
      console.error("Error updating campaign:", error);
      alert("Failed to update campaign: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this campaign?")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    setCampaigns(p => p.filter(c => c.id !== id));
  };

  const openLaunchPreview = async (campaign) => {
    const typeInfo = CAMPAIGN_TYPES.find(t => t.id === campaign.campaign_type);
    const stages = typeInfo?.stages || [];
    const channel = campaign.channel || "call";

    const { data: contacts } = await supabase
      .from("contacts")
      .select("*")
      .eq("org_id", orgId)
      .in("stage", stages);

    // Exclude contacts already reached by this campaign
    const { data: already } = await supabase
      .from("campaign_contacts")
      .select("contact_id")
      .eq("campaign_id", campaign.id);
    const alreadyIds = new Set((already || []).map(r => r.contact_id));

    const eligible = (contacts || []).filter(c => {
      if (alreadyIds.has(c.id)) return false;
      if (channel === "email") return !!c.email;
      return !!c.phone;
    });

    setMatchedContacts(eligible);
    setLaunchTarget(campaign);
  };

  const confirmLaunch = async () => {
    const campaign = launchTarget;
    if (!campaign) return;
    setLaunching(true);
    setLaunchProgress(0);

    try {
      await supabase
        .from("campaigns")
        .update({ status: "active", launched_at: new Date().toISOString() })
        .eq("id", campaign.id);
      setCampaigns(p => p.map(c => c.id === campaign.id ? { ...c, status: "active" } : c));

      const channel = campaign.channel || "call";

      let successCount = 0;
      for (let i = 0; i < matchedContacts.length; i++) {
        const contact = matchedContacts[i];

        // Reserve the row up front so a retried launch doesn't double-contact
        await supabase.from("campaign_contacts").upsert({
          campaign_id: campaign.id,
          contact_id: contact.id,
          channel,
          status: "pending",
        }, { onConflict: "campaign_id,contact_id" });

        const personalizedMessage = (campaign.description || `Hi {{name}}, this is regarding ${campaign.name}.`)
          .replace(/\{\{name\}\}/g, contact.name)
          .replace(/\{\{company\}\}/g, contact.company || "");

        const { data, error } = await supabase.functions.invoke("send-outreach", {
          body: {
            action: channel,
            contact_id: contact.id,
            contact_phone: contact.phone,
            contact_name: contact.name,
            contact_email: contact.email,
            // For "call": this is a fallback only — Allegra (and any other
            // Deepgram Voice Agent-driven agent) speaks from its own configured
            // greeting/prompt, not this field. It's the real message for text/email.
            message: personalizedMessage,
            agent_id: campaign.agent_id,
            campaign_id: campaign.id,
            org_id: orgId,
          },
        });

        const ok = !error && !data?.error;
        await supabase
          .from("campaign_contacts")
          .update({
            status: ok ? "sent" : "failed",
            external_id: data?.call_id || data?.message_id || data?.email_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("campaign_id", campaign.id)
          .eq("contact_id", contact.id);

        if (ok) successCount++;
        setLaunchProgress(i + 1);
      }

      setCampaignStats(p => ({ ...p, [campaign.id]: { total: matchedContacts.length, completed: successCount } }));
      alert(`Campaign launched! ${successCount} of ${matchedContacts.length} outreach attempts sent successfully.`);
      setLaunchTarget(null);
    } catch (err) {
      console.error("Error launching campaign:", err);
      alert("Error launching campaign. Check console.");
    } finally {
      setLaunching(false);
      setLaunchProgress(0);
    }
  };

  const getAgentColor = (agentId) => {
    const agent = AGENTS.find(a => a.id === agentId);
    return agent?.color || C.primary;
  };

  const getStatusColor = (status) => {
    return status === "active" ? C.green : status === "completed" ? C.textSecondary : C.amber;
  };

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:C.textPrimary }}>Campaigns</h2>
        <button onClick={() => setShowAdd(true)} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ New Campaign</button>
      </div>

      {loading && <div style={{ textAlign:"center", color:C.textMuted, fontSize:13, paddingTop:40 }}>Loading campaigns…</div>}

      {!loading && campaigns.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px", background:C.card, borderRadius:12, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📡</div>
          <h3 style={{ margin:"0 0 8px", fontSize:16, fontWeight:700, color:C.textPrimary }}>No Campaigns Yet</h3>
          <p style={{ margin:"0 0 20px", fontSize:13, color:C.textSecondary, maxWidth:340 }}>Create your first campaign to launch AI-powered outreach sequences.</p>
          <button onClick={() => setShowAdd(true)} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Create Campaign</button>
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <div style={{ display:"grid", gap:12 }}>
          {campaigns.map(campaign => {
            const stats = campaignStats[campaign.id];
            return (
              <div key={campaign.id} style={{ padding:"16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:10, display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <div style={{ fontSize:18 }}>📊</div>
                    <div>
                      <h4 style={{ margin:0, fontSize:14, fontWeight:700, color:C.textPrimary }}>{campaign.name}</h4>
                      {campaign.description && <p style={{ margin:"4px 0 0", fontSize:12, color:C.textSecondary }}>{campaign.description}</p>}
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:10 }}>
                    <Badge color={getAgentColor(campaign.agent_id)}>
                      {AGENTS.find(a => a.id === campaign.agent_id)?.name || campaign.agent_id}
                    </Badge>
                    <Badge color={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    {campaign.channel && <Badge color={C.textSecondary}>{campaign.channel}</Badge>}
                    {campaign.target_audience && <Badge color={C.textSecondary}>{campaign.target_audience}</Badge>}
                  </div>

                  {campaign.goal && <div style={{ fontSize:12, color:C.textSecondary, marginTop:8 }}>🎯 Goal: {campaign.goal}</div>}
                  {stats && (
                    <div style={{ fontSize:12, color:C.textSecondary, marginTop:6 }}>
                      📈 {stats.completed}/{stats.total} reached successfully
                    </div>
                  )}
                </div>

                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  {campaign.status !== "completed" && (
                    <button
                      onClick={() => openLaunchPreview(campaign)}
                      style={{
                        padding:"6px 12px",
                        background:C.primary,
                        color:"white",
                        border:"none",
                        borderRadius:6,
                        fontSize:12,
                        fontWeight:600,
                        cursor:"pointer",
                      }}
                    >
                      🚀 {campaign.status === "active" ? "Relaunch" : "Launch"}
                    </button>
                  )}
                  <button onClick={() => setEditTarget(campaign)}
                    style={{ padding:"6px 12px", background:"transparent", border:`1px solid ${C.border}`, color:C.textSecondary, borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    ✎ Edit
                  </button>
                  <button onClick={() => handleDelete(campaign.id)} style={{ background:"transparent", border:"none", color:C.textMuted, cursor:"pointer", fontSize:14, padding:"0 8px" }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <CreateCampaignModal onClose={() => setShowAdd(false)} onSave={handleCreate} orgId={orgId} />}
      {editTarget && <CreateCampaignModal campaign={editTarget} onClose={() => setEditTarget(null)} onSave={handleUpdate} orgId={orgId} />}
      {launchTarget && (
        <LaunchPreviewModal
          campaign={launchTarget}
          matchedContacts={matchedContacts}
          onClose={() => !launching && setLaunchTarget(null)}
          onConfirm={confirmLaunch}
          launching={launching}
          progress={launchProgress}
          onAddContact={() => { setLaunchTarget(null); setActiveTab?.("crm"); }}
        />
      )}
    </div>
  );
}
