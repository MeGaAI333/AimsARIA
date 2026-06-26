import { useState, useEffect } from "react";
import { C } from "../data.js";
import { getProfile, saveProfile, getAllProfiles } from "../lib/db.js";

const PLATFORMS = ["Facebook","Instagram","LinkedIn","Twitter/X","TikTok","Google Business","YouTube"];
const TONES = ["Professional","Friendly & Casual","Urgent / Sales-Focused","Inspirational","Educational","Humorous"];
const FREQUENCIES = ["Daily","3x/week","2x/week","Weekly","Bi-weekly","Monthly"];

function ProfileForm({ orgId }) {
  const BLANK = {
    business_name:"", industry:"", website:"", service_area:"",
    target_audience:"", demographics:"", pain_points:"",
    platforms:[], posting_frequency:{},
    content_pillars:"", brand_tone:"Professional", competitors:"",
    restrictions:"", hashtags:"", approval_contact:"",
    buffer_setup:false, notes:""
  };
  const [form, setForm]     = useState(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    setSaved(false);
    getProfile(orgId)
      .then(data => { if (data) setForm(f => ({ ...BLANK, ...data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  const set = (k, v) => { setForm(p => ({ ...p, [k]:v })); setSaved(false); };

  const togglePlatform = (p) => {
    setForm(prev => {
      const platforms = prev.platforms?.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...(prev.platforms||[]), p];
      return { ...prev, platforms };
    });
    setSaved(false);
  };

  const save = async () => {
    if (!orgId) return;
    setSaving(true);
    await saveProfile(orgId, form);
    setSaving(false);
    setSaved(true);
  };

  if (loading) return <div style={{ padding:40, textAlign:"center", color:C.textMuted, fontSize:13 }}>Loading profile…</div>;

  const Section = ({ title }) => (
    <div style={{ fontSize:10, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>{title}</div>
  );

  const Field = ({ label, k, type="text", placeholder="" }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>{label}</label>
      <input type={type} value={form[k]||""} onChange={e => set(k, e.target.value)} placeholder={placeholder}
        style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
    </div>
  );

  const Textarea = ({ label, k, placeholder="", rows=3 }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>{label}</label>
      <textarea value={form[k]||""} onChange={e => set(k, e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", fontFamily:"inherit", resize:"vertical" }} />
    </div>
  );

  return (
    <div style={{ maxWidth:800 }}>
      {/* Business Basics */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:22, marginBottom:16 }}>
        <Section title="Business Basics" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Field label="Business Name" k="business_name" placeholder="Acme HVAC" />
          <Field label="Industry" k="industry" placeholder="HVAC, Roofing, Legal…" />
          <Field label="Website" k="website" placeholder="https://acmehvac.com" />
          <Field label="Service Area / Location" k="service_area" placeholder="Atlanta, GA" />
        </div>
      </div>

      {/* Target Audience */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:22, marginBottom:16 }}>
        <Section title="Target Audience" />
        <Textarea label="Who is the ideal customer?" k="target_audience"
          placeholder="e.g. Homeowners aged 35–65 in suburban Atlanta needing HVAC repair or replacement" />
        <Textarea label="Demographics & Interests" k="demographics"
          placeholder="e.g. Middle-income homeowners, concerned about energy costs, active on Facebook" />
        <Textarea label="Pain Points We Solve" k="pain_points"
          placeholder="e.g. High energy bills, unreliable contractors, fear of being overcharged" />
      </div>

      {/* Social Platforms */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:22, marginBottom:16 }}>
        <Section title="Social Media Platforms" />
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Active Platforms</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => togglePlatform(p)}
              style={{ padding:"7px 14px", borderRadius:20, border:`2px solid ${(form.platforms||[]).includes(p)?C.primary:C.border}`, background:(form.platforms||[]).includes(p)?`${C.primary}15`:"transparent", color:(form.platforms||[]).includes(p)?C.primary:C.textMuted, fontSize:12, fontWeight:700, cursor:"pointer" }}>
              {p}
            </button>
          ))}
        </div>
        {(form.platforms||[]).length > 0 && (
          <>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Posting Frequency per Platform</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {(form.platforms||[]).map(p => (
                <div key={p} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:12, color:C.textSecondary, width:130, flexShrink:0 }}>{p}</span>
                  <select value={(form.posting_frequency||{})[p]||""} onChange={e => set("posting_frequency", { ...form.posting_frequency, [p]:e.target.value })}
                    style={{ flex:1, padding:"7px 10px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:12, outline:"none" }}>
                    <option value="">Select frequency</option>
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content Strategy */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:22, marginBottom:16 }}>
        <Section title="Content Strategy" />
        <Textarea label="Content Pillars / Themes" k="content_pillars"
          placeholder="e.g. Before & After, Seasonal Tips, Customer Testimonials, Team Spotlight, Promotions, Educational How-Tos" rows={2} />
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Brand Tone</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {TONES.map(t => (
              <button key={t} onClick={() => set("brand_tone", t)}
                style={{ padding:"9px 12px", borderRadius:8, border:`2px solid ${form.brand_tone===t?C.primary:C.border}`, background:form.brand_tone===t?`${C.primary}15`:"transparent", color:form.brand_tone===t?C.primary:C.textMuted, fontSize:11, fontWeight:700, cursor:"pointer", textAlign:"left" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <Textarea label="Competitor Accounts to Watch" k="competitors"
          placeholder="e.g. @AcmeRoofingATL, @CoolBreeze_HVAC — list handles or profile URLs" rows={2} />
      </div>

      {/* Content Rules */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:22, marginBottom:16 }}>
        <Section title="Content Rules & Publishing" />
        <Textarea label="Content We NEVER Post" k="restrictions"
          placeholder="e.g. No price comparisons, no political content, no before photos without written client consent" rows={2} />
        <Field label="Required Hashtags or Disclaimers" k="hashtags"
          placeholder="e.g. #AtlantaHVAC #AcmeAir | Licensed & Insured" />
        <Field label="Who Approves Content Before Publishing?" k="approval_contact"
          placeholder="Name & email of the approver at this company" />
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div onClick={() => set("buffer_setup", !form.buffer_setup)}
            style={{ width:36, height:20, borderRadius:10, background:form.buffer_setup?C.green:C.border, cursor:"pointer", position:"relative", flexShrink:0 }}>
            <div style={{ position:"absolute", top:2, left:form.buffer_setup?18:2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.15s" }} />
          </div>
          <span style={{ fontSize:13, color:C.textSecondary }}>Buffer / scheduling tool is already connected for this client</span>
        </div>
      </div>

      {/* Notes for LYRIC */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:22, marginBottom:20 }}>
        <Section title="Additional Notes for LYRIC" />
        <Textarea label="Anything else LYRIC should know?" k="notes"
          placeholder="Upcoming campaigns, seasonal promotions, brand history, key differentiators, preferred content formats, special offers…" rows={4} />
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:14, paddingBottom:32 }}>
        <button onClick={save} disabled={saving||!orgId}
          style={{ padding:"10px 28px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving||!orgId?0.6:1 }}>
          {saving ? "Saving…" : "Save Profile"}
        </button>
        {saved && <span style={{ fontSize:13, color:C.green, fontWeight:700 }}>✓ Profile saved — LYRIC will use this automatically</span>}
        {!orgId && <span style={{ fontSize:12, color:C.amber }}>⚠️ No org ID — this client needs to be invited with a Company Name</span>}
      </div>
    </div>
  );
}

export default function ClientProfile({ role, orgId }) {
  const [profiles, setProfiles]   = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(role === "admin" ? null : orgId);
  const [newOrgInput, setNewOrgInput] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);
  const [loadingList, setLoadingList]  = useState(role === "admin");

  useEffect(() => {
    if (role !== "admin") return;
    getAllProfiles()
      .then(data => { setProfiles(data||[]); setLoadingList(false); })
      .catch(() => setLoadingList(false));
  }, [role]);

  if (role !== "admin") {
    return (
      <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
        <h2 style={{ margin:"0 0 6px", fontSize:20, fontWeight:800, color:C.textPrimary }}>My Business Profile</h2>
        <p style={{ margin:"0 0 24px", fontSize:13, color:C.textSecondary }}>This information is used by LYRIC to generate content tailored to your business. Fill it in once and LYRIC will reference it automatically.</p>
        <ProfileForm orgId={orgId} />
      </div>
    );
  }

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Left panel — profile list */}
      <div style={{ width:240, background:C.sidebar, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:12, fontWeight:800, color:C.textPrimary, marginBottom:10 }}>Client Profiles</div>
          <button onClick={() => setShowNewInput(v => !v)}
            style={{ width:"100%", padding:"7px 0", borderRadius:7, border:`1px solid ${C.primary}`, background:`${C.primary}15`, color:C.primary, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            + New Profile
          </button>
          {showNewInput && (
            <div style={{ marginTop:10 }}>
              <input value={newOrgInput} onChange={e => setNewOrgInput(e.target.value)}
                placeholder="org-id (e.g. acme-hvac)"
                style={{ width:"100%", boxSizing:"border-box", padding:"7px 10px", borderRadius:6, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:12, outline:"none", marginBottom:6 }} />
              <button onClick={() => { if (newOrgInput.trim()) { setSelectedOrg(newOrgInput.trim()); setShowNewInput(false); setNewOrgInput(""); } }}
                style={{ width:"100%", padding:"6px 0", borderRadius:6, border:"none", background:C.primary, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                Open
              </button>
            </div>
          )}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
          {loadingList && <div style={{ padding:20, fontSize:12, color:C.textMuted, textAlign:"center" }}>Loading…</div>}
          {!loadingList && profiles.length === 0 && (
            <div style={{ padding:20, fontSize:12, color:C.textMuted, textAlign:"center" }}>No profiles yet.<br />Click + New Profile to add one.</div>
          )}
          {profiles.map(p => (
            <div key={p.org_id} onClick={() => setSelectedOrg(p.org_id)}
              style={{ padding:"10px 14px", cursor:"pointer", background:selectedOrg===p.org_id?C.card:"transparent", borderLeft:`3px solid ${selectedOrg===p.org_id?C.primary:"transparent"}` }}
              onMouseEnter={e => selectedOrg!==p.org_id && (e.currentTarget.style.background=C.surface)}
              onMouseLeave={e => selectedOrg!==p.org_id && (e.currentTarget.style.background="transparent")}
            >
              <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>{p.business_name||p.org_id}</div>
              <div style={{ fontSize:11, color:C.textMuted }}>{p.org_id}</div>
              {p.industry && <div style={{ fontSize:10, color:C.textSecondary, marginTop:2 }}>{p.industry}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
        {!selectedOrg ? (
          <div style={{ textAlign:"center", marginTop:80, color:C.textMuted }}>
            <div style={{ fontSize:40, marginBottom:16 }}>📋</div>
            <div style={{ fontSize:15, fontWeight:700, color:C.textSecondary, marginBottom:8 }}>Select a client profile</div>
            <div style={{ fontSize:13 }}>Choose from the list or create a new profile for a client org.</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:20 }}>
              <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:800, color:C.textPrimary }}>
                {profiles.find(p=>p.org_id===selectedOrg)?.business_name || selectedOrg}
              </h2>
              <div style={{ fontSize:12, color:C.textMuted }}>Org ID: {selectedOrg}</div>
            </div>
            <ProfileForm key={selectedOrg} orgId={selectedOrg} />
          </>
        )}
      </div>
    </div>
  );
}
