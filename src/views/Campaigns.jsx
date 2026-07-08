import { useState, useEffect } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar, Badge } from "../components/utils.jsx";
import { supabase } from "../lib/supabase.js";

function CreateCampaignModal({ onClose, onSave, orgId }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    agent_id: "aria",
    campaign_type: "lead-recovery",
    target_audience: "",
    goal: "",
    start_date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  const campaignTypes = [
    { id: "lead-recovery", label: "Lead Recovery", desc: "Reconnect with lost leads" },
    { id: "closing", label: "Closing Sequence", desc: "Convert warm leads to customers" },
    { id: "content", label: "Content Campaign", desc: "Generate and publish content" },
    { id: "reputation", label: "Reputation", desc: "Monitor and protect brand" },
  ];

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ width:520, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.textPrimary }}>New Campaign</h3>
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
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({...p, description:e.target.value}))} placeholder="What is this campaign about?"
              rows={3}
              style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", fontFamily:"inherit", resize:"vertical" }} />
          </div>

          {/* Campaign Type */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Campaign Type *</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {campaignTypes.map(ct => (
                <button key={ct.id} onClick={() => setForm(p => ({...p, campaign_type:ct.id}))}
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
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8 }}>
              {AGENTS.slice(0, 4).map(a => (
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

          {/* Target Audience */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Target Audience</label>
            <input type="text" value={form.target_audience} onChange={e => setForm(p => ({...p, target_audience:e.target.value}))} placeholder="e.g. HVAC contractors in NY"
              style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
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
              {saving?"Creating…":"Create Campaign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [orgId, setOrgId] = useState("");

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
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this campaign?")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    setCampaigns(p => p.filter(c => c.id !== id));
  };

  const handleLaunchCampaign = async (campaign) => {
    if (!confirm(`Launch "${campaign.name}" campaign? This will start making outreach calls.`)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Update campaign status to active
      const { data: updated } = await supabase
        .from("campaigns")
        .update({ status: "active", launched_at: new Date().toISOString() })
        .eq("id", campaign.id)
        .select()
        .single();

      if (updated) {
        setCampaigns(p => p.map(c => c.id === campaign.id ? updated : c));
      }

      // Get contacts for this campaign (or all org contacts if no specific filter)
      const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .eq("org_id", orgId)
        .limit(100);

      if (!contacts || contacts.length === 0) {
        alert("No contacts found to call. Please import contacts first.");
        return;
      }

      // Get agent's selected voice
      const { data: agentSettings } = await supabase
        .from("agent_settings")
        .select("selected_voice")
        .eq("org_id", orgId)
        .eq("agent_id", campaign.agent_id)
        .single();

      const voiceId = agentSettings?.selected_voice || "june";

      // Call send-outreach for each contact
      let successCount = 0;
      for (const contact of contacts) {
        if (!contact.phone) continue;

        const res = await fetch("/.netlify/functions/send-outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "call",
            contact_phone: contact.phone,
            contact_name: contact.name,
            contact_email: contact.email,
            message: campaign.description || `Hi ${contact.name}, calling regarding ${campaign.name}`,
            agent_id: campaign.agent_id,
            voice_id: voiceId,
            campaign_id: campaign.id,
          }),
        });

        if (res.ok) successCount++;
      }

      alert(`Campaign launched! Started ${successCount} calls.`);
    } catch (err) {
      console.error("Error launching campaign:", err);
      alert("Error launching campaign. Check console.");
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
          {campaigns.map(campaign => (
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
                  {campaign.target_audience && <Badge color={C.textSecondary}>{campaign.target_audience}</Badge>}
                </div>

                {campaign.goal && <div style={{ fontSize:12, color:C.textSecondary, marginTop:8 }}>🎯 Goal: {campaign.goal}</div>}
              </div>

              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                {campaign.status !== "active" && campaign.status !== "completed" && (
                  <button
                    onClick={() => handleLaunchCampaign(campaign)}
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
                    🚀 Launch
                  </button>
                )}
                <button onClick={() => handleDelete(campaign.id)} style={{ background:"transparent", border:"none", color:C.textMuted, cursor:"pointer", fontSize:14, padding:"0 8px" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <CreateCampaignModal onClose={() => setShowAdd(false)} onSave={handleCreate} orgId={orgId} />}
    </div>
  );
}
