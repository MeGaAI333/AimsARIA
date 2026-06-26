import { useState, useEffect } from "react";
import { C } from "../data.js";
import { getOnboarding, saveOnboarding, getAllOnboarding, addTask } from "../lib/db.js";

// ─── Step definitions ────────────────────────────────────────────────────────

const ADMIN_STEPS = [
  { label: "Business Basics",   icon: "🏢" },
  { label: "Current Situation", icon: "📊" },
  { label: "AIMS Services",     icon: "🤖" },
  { label: "Lead Sources",      icon: "📥" },
  { label: "Brand Voice",       icon: "🎙" },
  { label: "Digital Presence",  icon: "🌐" },
  { label: "Technical Setup",   icon: "⚙" },
  { label: "Go-Live Planning",  icon: "🚀" },
];

// Steps the CLIENT fills out — AIMS staff fills in the rest
const CLIENT_STEPS = [
  { label: "Business Basics",   icon: "🏢" },
  { label: "Your Situation",    icon: "📊" },
  { label: "Brand Voice",       icon: "🎙" },
  { label: "Digital Presence",  icon: "🌐" },
  { label: "Contacts & Access", icon: "📋" },
];

// ─── Field constants ─────────────────────────────────────────────────────────

const INDUSTRIES    = ["HVAC","Roofing","Plumbing","MedSpa","Dental","Legal","Real Estate","Solar","Pest Control","Landscaping","Auto Repair","Financial Services","Other"];
const REVENUE_RANGES= ["Under $250K","$250K–$500K","$500K–$1M","$1M–$3M","$3M–$10M","$10M+"];
const STAFF_SIZES   = ["1–3","4–10","11–25","26–50","51+"];
const AD_SPENDS     = ["Under $1K/mo","$1K–$3K/mo","$3K–$5K/mo","$5K–$10K/mo","$10K–$25K/mo","$25K+/mo"];
const LEAD_VOLUMES  = ["Under 20/mo","20–50/mo","50–100/mo","100–200/mo","200–300/mo","300+/mo"];
const RESPONSE_TIMES= ["Under 5 min","5–30 min","30 min–1 hr","1–4 hours","Same day","Next day+"];
const CRMS          = ["ServiceTitan","Jobber","HouseCall Pro","GoHighLevel","HubSpot","Salesforce","Mindbody","Vagaro","Spreadsheet / None","Other"];
const LEAD_SOURCES  = ["Google Ads","LSA (Local Services Ads)","Facebook / Meta Ads","Instagram Ads","Angi","HomeAdvisor","Thumbtack","Yelp","Website Form","Referrals","Email Marketing","Other"];
const SOCIAL_PLATS  = ["Facebook","Instagram","LinkedIn","Twitter/X","TikTok","Google Business","YouTube"];
const CALENDAR_OPTS = ["Google Calendar","Acuity","Calendly","Mindbody","Vagaro","Jane App","ServiceTitan","Jobber","HouseCall Pro","Other"];
const STATUS_OPTS   = ["Not Started","In Progress","Awaiting Client Info","Config Complete","Live","Paused"];
const TONES         = ["Professional","Friendly & Warm","Direct & Urgent","Inspirational","Educational","Casual"];
const AIMS_SERVICES = [
  { id:"aria",   name:"ARIA",   icon:"🔵", desc:"AI lead recovery — responds to cold leads 24/7, handles objections, qualifies prospects" },
  { id:"melody", name:"MELODY", icon:"🟣", desc:"AI closing agent — books appointments from warm leads that ARIA hands off" },
  { id:"lyric",  name:"LYRIC",  icon:"🟢", desc:"AI content creation — social posts, email copy, ad copy, blog content" },
  { id:"muse",   name:"MUSE",   icon:"🟡", desc:"AI reputation management — monitors reviews, generates responses, protects brand" },
];

const BLANK = {
  business_name:"", industry:"", years_in_business:"", website:"", phone:"",
  service_area:"", staff_size:"", revenue_range:"",
  primary_pain:"", monthly_lead_volume:"", ad_spend:"", current_response_time:"",
  current_crm:"", crm_other:"", situation_notes:"",
  services_selected:[], plan_tier:"Pro ($797/mo)",
  lead_sources:[], has_cold_list:false, cold_list_size:"", lead_source_notes:"",
  agent_name:"", brand_tone:"Professional", emoji_use:false,
  certifications:"", phrases_to_avoid:"", top_objections:"",
  google_rating:"", google_review_count:"", social_platforms:[],
  last_post_date:"", has_email_list:false, email_list_size:"", has_job_photos:false,
  crm_integration:"", calendar_system:"", booking_link:"",
  approval_contact:"", leads_notification_contact:"", integration_notes:"",
  target_start_date:"", kickoff_scheduled:false, kickoff_date:"", notes:"",
  status:"Not Started",
};

// ─── Shared input primitives ─────────────────────────────────────────────────

function Field({ label, k, form, set, type="text", placeholder="", adminOnly }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>
        {label}
        {adminOnly && <span style={{ marginLeft:8, fontSize:9, color:C.amber, fontWeight:800, background:`${C.amber}15`, padding:"1px 6px", borderRadius:4 }}>AIMS STAFF</span>}
      </label>
      <input type={type} value={form[k]||""} onChange={e => set(k, e.target.value)} placeholder={placeholder}
        style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
    </div>
  );
}

function Textarea({ label, k, form, set, placeholder="", rows=3, adminOnly }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>
        {label}
        {adminOnly && <span style={{ marginLeft:8, fontSize:9, color:C.amber, fontWeight:800, background:`${C.amber}15`, padding:"1px 6px", borderRadius:4 }}>AIMS STAFF</span>}
      </label>
      <textarea value={form[k]||""} onChange={e => set(k, e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", fontFamily:"inherit", resize:"vertical" }} />
    </div>
  );
}

function SelectField({ label, k, form, set, options, placeholder="", adminOnly }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>
        {label}
        {adminOnly && <span style={{ marginLeft:8, fontSize:9, color:C.amber, fontWeight:800, background:`${C.amber}15`, padding:"1px 6px", borderRadius:4 }}>AIMS STAFF</span>}
      </label>
      <select value={form[k]||""} onChange={e => set(k, e.target.value)}
        style={{ width:"100%", padding:"9px 12px", borderRadius:7, background:C.surface, border:`1px solid ${C.border}`, color:form[k]?C.textPrimary:C.textMuted, fontSize:13, outline:"none" }}>
        <option value="">{placeholder||"Select…"}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Chips({ label, k, form, toggle, options }) {
  const active = form[k] || [];
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>{label}</label>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {options.map(o => (
          <button key={o} onClick={() => toggle(k, o)}
            style={{ padding:"7px 14px", borderRadius:20, border:`2px solid ${active.includes(o)?C.primary:C.border}`, background:active.includes(o)?`${C.primary}15`:"transparent", color:active.includes(o)?C.primary:C.textMuted, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, desc, k, form, set }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14 }}>
      <div onClick={() => set(k, !form[k])}
        style={{ width:36, height:20, borderRadius:10, background:form[k]?C.green:C.border, cursor:"pointer", position:"relative", flexShrink:0, marginTop:2 }}>
        <div style={{ position:"absolute", top:2, left:form[k]?18:2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.15s" }} />
      </div>
      <div>
        <div style={{ fontSize:13, color:C.textPrimary, fontWeight:600 }}>{label}</div>
        {desc && <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{desc}</div>}
      </div>
    </div>
  );
}

function SectionHead({ title, note }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1 }}>{title}</div>
      {note && <div style={{ fontSize:11, color:C.textMuted, marginTop:4, fontStyle:"italic" }}>{note}</div>}
    </div>
  );
}

function AdminOnlyBanner() {
  return (
    <div style={{ padding:"10px 14px", borderRadius:8, background:`${C.amber}08`, border:`1px solid ${C.amber}25`, marginBottom:16 }}>
      <span style={{ fontSize:11, color:C.amber, fontWeight:700 }}>🔒 This section is configured by your AIMS team — no action needed from you.</span>
    </div>
  );
}

// ─── Admin step renderer (all 8 steps) ──────────────────────────────────────

function renderAdminStep(step, form, set, toggle) {
  const shared = { form, set, toggle };
  switch (step) {
    case 0: return (
      <>
        <SectionHead title="Business Information" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Field label="Business Name" k="business_name" placeholder="Acme HVAC Inc." {...shared} />
          <SelectField label="Industry / Vertical" k="industry" options={INDUSTRIES} placeholder="Select industry…" {...shared} />
          <Field label="Years in Business" k="years_in_business" placeholder="e.g. 8" {...shared} />
          <Field label="Phone Number" k="phone" placeholder="(555) 555-5555" {...shared} />
          <Field label="Website" k="website" placeholder="https://acmehvac.com" {...shared} />
          <Field label="Primary Service Area" k="service_area" placeholder="e.g. Atlanta, GA metro" {...shared} />
          <SelectField label="Staff Size" k="staff_size" options={STAFF_SIZES} placeholder="Select range…" {...shared} />
          <SelectField label="Annual Revenue (approx.)" k="revenue_range" options={REVENUE_RANGES} placeholder="Select range…" {...shared} />
        </div>
      </>
    );
    case 1: return (
      <>
        <SectionHead title="Pain & Current State" />
        <Textarea label="Primary Pain / Challenge" k="primary_pain"
          placeholder="e.g. Paying $8K/mo in ads but losing leads because no one responds fast enough after hours" rows={3} {...shared} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <SelectField label="Monthly Inbound Lead Volume" k="monthly_lead_volume" options={LEAD_VOLUMES} placeholder="Select range…" {...shared} />
          <SelectField label="Monthly Ad Spend" k="ad_spend" options={AD_SPENDS} placeholder="Select range…" {...shared} />
          <SelectField label="Current Lead Response Time" k="current_response_time" options={RESPONSE_TIMES} placeholder="Select…" {...shared} />
          <SelectField label="Current CRM / Software" k="current_crm" options={CRMS} placeholder="Select…" {...shared} />
        </div>
        {form.current_crm === "Other" && <Field label="CRM Name (specify)" k="crm_other" placeholder="Enter CRM name" {...shared} />}
        <Textarea label="Additional Notes on Current State" k="situation_notes"
          placeholder="e.g. Has 2 CSRs, overwhelmed in summer. Tracks estimates in email." rows={2} {...shared} />
      </>
    );
    case 2: return (
      <>
        <SectionHead title="Select AIMS Services for This Client" note="Configured by AIMS staff based on the client's plan." />
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          {AIMS_SERVICES.map(s => {
            const active = (form.services_selected||[]).includes(s.id);
            return (
              <div key={s.id} onClick={() => toggle("services_selected", s.id)}
                style={{ padding:"14px 16px", borderRadius:10, border:`2px solid ${active?C.primary:C.border}`, background:active?`${C.primary}08`:"transparent", cursor:"pointer", display:"flex", alignItems:"flex-start", gap:12 }}>
                <span style={{ fontSize:20, marginTop:1 }}>{s.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:active?C.primary:C.textPrimary }}>{s.name}</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>{s.desc}</div>
                </div>
                <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${active?C.primary:C.border}`, background:active?C.primary:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 }}>
                  {active && <span style={{ fontSize:10, color:"#fff", fontWeight:900, lineHeight:1 }}>✓</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Plan Tier</label>
          <div style={{ display:"flex", gap:10 }}>
            {["Starter ($497/mo)","Pro ($797/mo)","Elite ($1,497/mo)"].map(t => (
              <button key={t} onClick={() => set("plan_tier", t)}
                style={{ flex:1, padding:"10px 16px", borderRadius:8, border:`2px solid ${form.plan_tier===t?C.primary:C.border}`, background:form.plan_tier===t?`${C.primary}15`:"transparent", color:form.plan_tier===t?C.primary:C.textMuted, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </>
    );
    case 3: return (
      <>
        <SectionHead title="Lead Sources & Cold List" note="Configured by AIMS staff after reviewing client's marketing setup." />
        <Chips label="Where Do Their Leads Come From?" k="lead_sources" options={LEAD_SOURCES} form={form} toggle={toggle} />
        <div style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:14 }}>
          <Toggle label="Client has a cold lead list" desc="Unconverted inquiries from last 6–12 months — ARIA's first target on launch" k="has_cold_list" {...shared} />
          {form.has_cold_list && <Field label="Estimated Cold List Size (contacts)" k="cold_list_size" placeholder="e.g. 400" {...shared} />}
        </div>
        <Textarea label="Notes on Lead Sources" k="lead_source_notes"
          placeholder="e.g. $5K/mo Google Ads, Angi frustration, website form is primary." rows={2} {...shared} />
      </>
    );
    case 4: return (
      <>
        <SectionHead title="Brand & Agent Voice Configuration" />
        <Field label="AI Agent Display Name (how ARIA signs messages)" k="agent_name"
          placeholder='e.g. "Aria from Acme HVAC" or just "Aria"' adminOnly {...shared} />
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Brand Tone</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {TONES.map(t => (
              <button key={t} onClick={() => set("brand_tone", t)}
                style={{ padding:"9px 12px", borderRadius:8, border:`2px solid ${form.brand_tone===t?C.primary:C.border}`, background:form.brand_tone===t?`${C.primary}15`:"transparent", color:form.brand_tone===t?C.primary:C.textMuted, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <Toggle label="Use emojis in outreach messages" desc="Appropriate for MedSpa, consumer brands; avoid for legal, financial" k="emoji_use" {...shared} />
        <Textarea label="Certifications / Credentials to Highlight" k="certifications"
          placeholder="e.g. NATE-certified, 10-year warranty, A+ BBB, Licensed & Insured" rows={2} {...shared} />
        <Textarea label="Top 3 Objections (what prospects say when they don't book)" k="top_objections"
          placeholder="1. 'Getting other quotes'  2. 'Need to talk to spouse'  3. 'What's the price?'" rows={3} {...shared} />
        <Textarea label="Language / Topics to NEVER Use" k="phrases_to_avoid"
          placeholder="e.g. No competitor comparisons, no political content, no high-pressure language" rows={2} {...shared} />
      </>
    );
    case 5: return (
      <>
        <SectionHead title="Online Presence & Reputation" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Field label="Google Star Rating (e.g. 4.8)" k="google_rating" placeholder="4.8" {...shared} />
          <Field label="Number of Google Reviews" k="google_review_count" placeholder="e.g. 212" {...shared} />
        </div>
        <Chips label="Active Social Media Platforms" k="social_platforms" options={SOCIAL_PLATS} form={form} toggle={toggle} />
        <Field label="Date of Last Social Media Post (approx.)" k="last_post_date" type="date" {...shared} />
        <div style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:14 }}>
          <Toggle label="Has an email / SMS subscriber list" k="has_email_list" {...shared} />
          {form.has_email_list && <Field label="List Size (contacts)" k="email_list_size" placeholder="e.g. 1,200" {...shared} />}
          <Toggle label="Has before/after job photos or testimonial media" desc="Useful for LYRIC content and MUSE reputation management" k="has_job_photos" {...shared} />
        </div>
      </>
    );
    case 6: return (
      <>
        <SectionHead title="Integrations & Workflow" note="AIMS staff configures integrations. Client provides access/credentials separately." />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <SelectField label="CRM to Connect" k="crm_integration" options={CRMS} placeholder="Select CRM…" adminOnly {...shared} />
          <SelectField label="Calendar / Booking System" k="calendar_system" options={CALENDAR_OPTS} placeholder="Select calendar…" adminOnly {...shared} />
        </div>
        <Field label="Direct Booking Link" k="booking_link" placeholder="https://acmehvac.com/book" {...shared} />
        <Field label="Content / Messaging Approval Contact" k="approval_contact" placeholder="Name & email — approves outreach before go-live" {...shared} />
        <Field label="Lead Notification Contact (receives MELODY handoffs)" k="leads_notification_contact" placeholder="Name, email, or phone" {...shared} />
        <Textarea label="Integration Notes" k="integration_notes" adminOnly
          placeholder="e.g. ServiceTitan export is manual CSV. Google Calendar for booking. SMS-only preferred." rows={3} {...shared} />
      </>
    );
    case 7: return (
      <>
        <SectionHead title="Go-Live Planning" note="AIMS staff manages scheduling and internal notes." />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Field label="Target Go-Live Date" k="target_start_date" type="date" adminOnly {...shared} />
          <SelectField label="Onboarding Status" k="status" options={STATUS_OPTS} adminOnly {...shared} />
        </div>
        <div style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:14 }}>
          <Toggle label="Kickoff call has been scheduled" k="kickoff_scheduled" {...shared} />
          {form.kickoff_scheduled && <Field label="Kickoff Call Date & Time" k="kickoff_date" type="datetime-local" adminOnly {...shared} />}
        </div>
        <Textarea label="Internal Notes for AIMS Team" k="notes" adminOnly
          placeholder="Special requirements, commitments made during sale, client expectations, anything else the team needs to know." rows={5} {...shared} />
        {(form.services_selected||[]).length > 0 && (
          <div style={{ background:`${C.primary}08`, border:`1px solid ${C.primary}30`, borderRadius:10, padding:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.primary, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>Tasks Auto-Generated on Completion</div>
            {(form.services_selected||[]).includes("aria")   && <div style={{ fontSize:12, color:C.textSecondary, marginBottom:4 }}>• ARIA: Connect lead sources · Upload cold list · Configure voice · Get sign-off · Go live</div>}
            {(form.services_selected||[]).includes("melody") && <div style={{ fontSize:12, color:C.textSecondary, marginBottom:4 }}>• MELODY: Connect calendar · Configure sequences · Test ARIA handoff</div>}
            {(form.services_selected||[]).includes("lyric")  && <div style={{ fontSize:12, color:C.textSecondary, marginBottom:4 }}>• LYRIC: Complete Client Profile · Draft content calendar · Connect Buffer</div>}
            {(form.services_selected||[]).includes("muse")   && <div style={{ fontSize:12, color:C.textSecondary, marginBottom:4 }}>• MUSE: Connect Google/Facebook · Audit reviews · Build response library</div>}
          </div>
        )}
      </>
    );
    default: return null;
  }
}

// ─── Client step renderer (5 steps, no admin fields) ─────────────────────────

function renderClientStep(step, form, set, toggle) {
  const shared = { form, set, toggle };
  switch (step) {
    case 0: return (
      <>
        <SectionHead title="Tell Us About Your Business" note="This helps us configure your AIMS agents to represent your brand correctly." />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Field label="Business Name" k="business_name" placeholder="Acme HVAC Inc." {...shared} />
          <SelectField label="Industry / Vertical" k="industry" options={INDUSTRIES} placeholder="Select industry…" {...shared} />
          <Field label="Years in Business" k="years_in_business" placeholder="e.g. 8" {...shared} />
          <Field label="Phone Number" k="phone" placeholder="(555) 555-5555" {...shared} />
          <Field label="Website" k="website" placeholder="https://acmehvac.com" {...shared} />
          <Field label="Primary Service Area" k="service_area" placeholder="e.g. Atlanta, GA metro" {...shared} />
          <SelectField label="Staff Size" k="staff_size" options={STAFF_SIZES} placeholder="Select range…" {...shared} />
          <SelectField label="Annual Revenue (approx.)" k="revenue_range" options={REVENUE_RANGES} placeholder="Select range…" {...shared} />
        </div>
      </>
    );
    case 1: return (
      <>
        <SectionHead title="Your Current Lead Situation" note="Understanding where you are today helps us calibrate how aggressively ARIA follows up." />
        <Textarea label="What's your biggest challenge with leads right now?" k="primary_pain"
          placeholder="e.g. We spend $8K/month on ads but nobody follows up fast enough. Leads go cold over the weekend." rows={3} {...shared} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <SelectField label="Monthly Inbound Lead Volume" k="monthly_lead_volume" options={LEAD_VOLUMES} placeholder="Select range…" {...shared} />
          <SelectField label="Monthly Ad Spend" k="ad_spend" options={AD_SPENDS} placeholder="Select range…" {...shared} />
          <SelectField label="How fast do you respond to new leads?" k="current_response_time" options={RESPONSE_TIMES} placeholder="Select…" {...shared} />
          <SelectField label="CRM / Software You Currently Use" k="current_crm" options={CRMS} placeholder="Select…" {...shared} />
        </div>
        {form.current_crm === "Other" && <Field label="CRM Name" k="crm_other" placeholder="Enter CRM name" {...shared} />}
        <Textarea label="Anything else we should know?" k="situation_notes"
          placeholder="e.g. We have 2 office staff who answer calls. We track jobs in ServiceTitan but barely use the follow-up features." rows={2} {...shared} />
      </>
    );
    case 2: return (
      <>
        <SectionHead title="Your Brand Voice" note="Your agents will communicate in your brand's voice — help us get it right." />
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>What tone fits your brand best?</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {TONES.map(t => (
              <button key={t} onClick={() => set("brand_tone", t)}
                style={{ padding:"9px 12px", borderRadius:8, border:`2px solid ${form.brand_tone===t?C.primary:C.border}`, background:form.brand_tone===t?`${C.primary}15`:"transparent", color:form.brand_tone===t?C.primary:C.textMuted, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <Toggle label="Use emojis in messages?" desc="Great for consumer brands and MedSpas. Skip for legal, financial, or B2B." k="emoji_use" {...shared} />
        <Textarea label="Certifications & Credentials to Mention" k="certifications"
          placeholder="e.g. NATE-certified, 10-year labor warranty, A+ BBB, Licensed & Insured in TX, 200+ 5-star reviews" rows={2} {...shared} />
        <Textarea label="What are your top 3 objections? (what do prospects say when they don't book)" k="top_objections"
          placeholder="1. 'I'm getting other quotes'  2. 'Need to talk to my spouse'  3. 'What's the price before you come out?'" rows={3} {...shared} />
        <Textarea label="Topics or language to NEVER use in your name" k="phrases_to_avoid"
          placeholder="e.g. Never compare to competitors, no political topics, no high-pressure language" rows={2} {...shared} />
      </>
    );
    case 3: return (
      <>
        <SectionHead title="Your Online Presence" note="This helps MUSE manage your reputation and LYRIC create better content." />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Field label="Google Star Rating" k="google_rating" placeholder="e.g. 4.8" {...shared} />
          <Field label="Number of Google Reviews" k="google_review_count" placeholder="e.g. 212" {...shared} />
        </div>
        <Chips label="Which social media platforms are you active on?" k="social_platforms" options={SOCIAL_PLATS} form={form} toggle={toggle} />
        <Field label="When did you last post on social media? (approx.)" k="last_post_date" type="date" {...shared} />
        <div style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:14 }}>
          <Toggle label="Do you have an email or SMS subscriber list?" k="has_email_list" {...shared} />
          {form.has_email_list && <Field label="Approximately how many contacts?" k="email_list_size" placeholder="e.g. 1,200" {...shared} />}
          <Toggle label="Do you have before/after photos or client testimonials?" desc="These are great for content — LYRIC and MUSE will use them" k="has_job_photos" {...shared} />
        </div>
        <div style={{ background:C.surface, borderRadius:10, padding:16 }}>
          <Toggle label="Do you have an old lead list? (contacts who inquired but didn't convert)" desc="Even 6–12 months old. ARIA can often warm these up — they're your fastest ROI." k="has_cold_list" {...shared} />
          {form.has_cold_list && <Field label="Approximately how many contacts?" k="cold_list_size" placeholder="e.g. 400" {...shared} />}
        </div>
      </>
    );
    case 4: return (
      <>
        <SectionHead title="Contacts & Approvals" note="Who should we contact for approvals, and how should people reach you?" />
        <Field label="Your Online Booking Link (if you have one)" k="booking_link" placeholder="https://yourbusiness.com/book or Calendly/Acuity link" {...shared} />
        <Field label="Who approves outreach messages before they go live?" k="approval_contact"
          placeholder="Name + email — this person reviews and signs off on your AI messaging" {...shared} />
        <Field label="Who should receive lead notifications?" k="leads_notification_contact"
          placeholder="Name, email, or phone — gets notified when a lead is ready for a human call" {...shared} />
        <div style={{ background:`${C.green}08`, border:`1px solid ${C.green}25`, borderRadius:10, padding:16, marginTop:8 }}>
          <div style={{ fontSize:12, color:C.green, fontWeight:700, marginBottom:6 }}>✓ Almost there!</div>
          <div style={{ fontSize:12, color:C.textSecondary, lineHeight:1.6 }}>
            Once you complete this form, your AIMS team will review your responses and reach out to schedule your kickoff call. We handle all the technical configuration — you just approve the messaging before anything goes live.
          </div>
        </div>
      </>
    );
    default: return null;
  }
}

// ─── Wizard component ────────────────────────────────────────────────────────

function OnboardingWizard({ orgId, role, onComplete }) {
  const STEPS = role === "admin" ? ADMIN_STEPS : CLIENT_STEPS;

  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState(BLANK);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true); setSaved(false); setDone(false); setStep(0);
    getOnboarding(orgId)
      .then(data => { if (data) setForm(f => ({ ...BLANK, ...data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  const set = (k, v) => { setForm(p => ({ ...p, [k]:v })); setSaved(false); };
  const toggle = (k, val) => {
    setForm(p => {
      const arr = p[k] || [];
      return { ...p, [k]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
    setSaved(false);
  };

  const persist = async (overrides = {}) => {
    if (!orgId) return;
    setSaving(true);
    const payload = { ...form, ...overrides };
    ["last_post_date","target_start_date","kickoff_date"].forEach(k => { if (!payload[k]) delete payload[k]; });
    await saveOnboarding(orgId, payload);
    if (overrides.status) setForm(f => ({ ...f, status: overrides.status }));
    setSaving(false);
    setSaved(true);
  };

  const next = async () => { await persist(); if (step < STEPS.length - 1) setStep(s => s + 1); };
  const back = () => { if (step > 0) setStep(s => s - 1); };

  const complete = async () => {
    const newStatus = role === "admin"
      ? (["Not Started","In Progress"].includes(form.status) ? "Config Complete" : form.status)
      : "Awaiting Client Info";
    await persist({ status: newStatus });
    if (role === "admin") {
      const biz = form.business_name || orgId;
      const taskSets = {
        aria:   [`[${biz}] ARIA — Connect lead sources`,`[${biz}] ARIA — Upload cold lead list`,`[${biz}] ARIA — Configure brand voice`,`[${biz}] ARIA — Get client sign-off`,`[${biz}] ARIA — Go live`],
        melody: [`[${biz}] MELODY — Connect calendar`,`[${biz}] MELODY — Configure sequences`,`[${biz}] MELODY — Test handoff from ARIA`],
        lyric:  [`[${biz}] LYRIC — Complete Client Profile`,`[${biz}] LYRIC — Draft content calendar`,`[${biz}] LYRIC — Connect Buffer`],
        muse:   [`[${biz}] MUSE — Connect Google/Facebook`,`[${biz}] MUSE — Audit reviews`,`[${biz}] MUSE — Build response library`],
      };
      for (const svc of (form.services_selected || [])) {
        for (const title of (taskSets[svc] || [])) {
          await addTask({ title, status:"pending" }).catch(() => {});
        }
      }
    }
    setDone(true);
    if (onComplete) onComplete();
  };

  if (loading) return <div style={{ padding:40, textAlign:"center", color:C.textMuted, fontSize:13 }}>Loading…</div>;

  const isClient = role !== "admin";

  return (
    <div style={{ maxWidth:780 }}>
      {/* Step progress bar */}
      <div style={{ display:"flex", gap:3, marginBottom:22 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex:1, cursor:role==="admin"?"pointer":"default" }} onClick={() => role==="admin" && setStep(i)}>
            <div style={{ height:3, borderRadius:2, background:i <= step ? C.primary : C.border, marginBottom:5 }} />
            <div style={{ fontSize:9, fontWeight:i===step?800:600, color:i===step?C.primary:i<step?C.textSecondary:C.textMuted, textTransform:"uppercase", letterSpacing:0.4, textAlign:"center", lineHeight:1.3 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Step heading */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:18, marginBottom:3 }}>{STEPS[step].icon}</div>
        <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:C.textPrimary }}>{STEPS[step].label}</h3>
        <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Step {step+1} of {STEPS.length}</div>
      </div>

      {/* Form card */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:22, marginBottom:14 }}>
        {isClient
          ? renderClientStep(step, form, set, toggle)
          : renderAdminStep(step, form, set, toggle)
        }
      </div>

      {/* Navigation */}
      <div style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:32 }}>
        {step > 0 && (
          <button onClick={back}
            style={{ padding:"10px 18px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            ← Back
          </button>
        )}
        <button onClick={() => persist()} disabled={saving||!orgId}
          style={{ padding:"10px 18px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textMuted, fontSize:13, fontWeight:600, cursor:"pointer", opacity:saving||!orgId?0.5:1 }}>
          {saving ? "Saving…" : "Save Draft"}
        </button>
        <div style={{ flex:1 }} />
        {saved && !saving && <span style={{ fontSize:12, color:C.green, fontWeight:700 }}>✓ Saved</span>}
        {done && <span style={{ fontSize:12, color:C.green, fontWeight:700 }}>{isClient ? "✓ Submitted — your AIMS team will follow up" : "✓ Complete — Tasks Generated"}</span>}
        {!orgId && <span style={{ fontSize:12, color:C.amber }}>⚠ No org ID</span>}
        {step < STEPS.length - 1 ? (
          <button onClick={next} disabled={saving||!orgId}
            style={{ padding:"10px 22px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving||!orgId?0.5:1 }}>
            Next →
          </button>
        ) : (
          <button onClick={complete} disabled={saving||!orgId||done}
            style={{ padding:"10px 22px", borderRadius:8, border:"none", background:C.green, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving||!orgId||done?0.5:1 }}>
            {saving ? "Submitting…" : isClient ? "Submit to AIMS Team ✓" : "✓ Complete Onboarding"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Status color helper ─────────────────────────────────────────────────────

const STATUS_COLOR = {
  "Not Started": C.textMuted,
  "In Progress": C.amber,
  "Awaiting Client Info": C.amber,
  "Config Complete": C.primary,
  "Live": C.green,
  "Paused": C.textMuted,
};

// ─── Main export ─────────────────────────────────────────────────────────────

export default function Onboarding({ role, orgId }) {
  const [records, setRecords]         = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(role === "admin" ? null : orgId);
  const [newOrgInput, setNewOrgInput] = useState("");
  const [showNew, setShowNew]         = useState(false);
  const [listLoading, setListLoading] = useState(role === "admin");

  useEffect(() => {
    if (role !== "admin") return;
    getAllOnboarding()
      .then(data => { setRecords(data||[]); setListLoading(false); })
      .catch(() => setListLoading(false));
  }, [role]);

  const refreshList = () => {
    if (role !== "admin") return;
    getAllOnboarding().then(data => setRecords(data||[])).catch(() => {});
  };

  if (role !== "admin") {
    return (
      <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%", boxSizing:"border-box" }}>
        <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:800, color:C.textPrimary }}>My Onboarding</h2>
        <p style={{ margin:"0 0 24px", fontSize:13, color:C.textSecondary }}>
          Fill in what you know — your AIMS team handles all technical configuration. We'll review your responses and reach out to schedule your kickoff call.
        </p>
        <OnboardingWizard orgId={orgId} role={role} />
      </div>
    );
  }

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Left panel — client list */}
      <div style={{ width:260, background:C.sidebar, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:12, fontWeight:800, color:C.textPrimary, marginBottom:10 }}>Client Onboarding</div>
          <button onClick={() => setShowNew(v => !v)}
            style={{ width:"100%", padding:"7px 0", borderRadius:7, border:`1px solid ${C.primary}`, background:`${C.primary}15`, color:C.primary, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            + New Client
          </button>
          {showNew && (
            <div style={{ marginTop:10 }}>
              <input value={newOrgInput} onChange={e => setNewOrgInput(e.target.value)}
                placeholder="org-id (e.g. acme-hvac)"
                style={{ width:"100%", boxSizing:"border-box", padding:"7px 10px", borderRadius:6, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:12, outline:"none", marginBottom:6 }} />
              <button onClick={() => { if (newOrgInput.trim()) { setSelectedOrg(newOrgInput.trim()); setShowNew(false); setNewOrgInput(""); } }}
                style={{ width:"100%", padding:"6px 0", borderRadius:6, border:"none", background:C.primary, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                Open
              </button>
            </div>
          )}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
          {listLoading && <div style={{ padding:20, fontSize:12, color:C.textMuted, textAlign:"center" }}>Loading…</div>}
          {!listLoading && records.length === 0 && (
            <div style={{ padding:20, fontSize:12, color:C.textMuted, textAlign:"center" }}>No onboarding records yet.<br />Click + New Client to start.</div>
          )}
          {records.map(r => (
            <div key={r.org_id} onClick={() => setSelectedOrg(r.org_id)}
              style={{ padding:"10px 14px", cursor:"pointer", background:selectedOrg===r.org_id?C.card:"transparent", borderLeft:`3px solid ${selectedOrg===r.org_id?C.primary:"transparent"}` }}
              onMouseEnter={e => selectedOrg!==r.org_id && (e.currentTarget.style.background=C.surface)}
              onMouseLeave={e => selectedOrg!==r.org_id && (e.currentTarget.style.background="transparent")}
            >
              <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>{r.business_name||r.org_id}</div>
              <div style={{ fontSize:11, color:C.textMuted }}>{r.org_id}</div>
              <div style={{ display:"flex", alignItems:"center", marginTop:4 }}>
                {r.industry && <span style={{ fontSize:10, color:C.textSecondary }}>{r.industry}</span>}
                <span style={{ fontSize:10, fontWeight:700, color:STATUS_COLOR[r.status]||C.textMuted, marginLeft:"auto" }}>{r.status||"Not Started"}</span>
              </div>
              {(r.services_selected||[]).length > 0 && (
                <div style={{ fontSize:10, color:C.textMuted, marginTop:3 }}>
                  {(r.services_selected||[]).map(s => s.toUpperCase()).join(" · ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — wizard */}
      <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
        {!selectedOrg ? (
          <div style={{ textAlign:"center", marginTop:80, color:C.textMuted }}>
            <div style={{ fontSize:40, marginBottom:16 }}>🚀</div>
            <div style={{ fontSize:15, fontWeight:700, color:C.textSecondary, marginBottom:8 }}>Select a client to onboard</div>
            <div style={{ fontSize:13 }}>Choose from the list or start a new onboarding record.</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:20 }}>
              <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:800, color:C.textPrimary }}>
                {records.find(r=>r.org_id===selectedOrg)?.business_name || selectedOrg}
              </h2>
              <div style={{ fontSize:12, color:C.textMuted }}>Org ID: {selectedOrg} · Admin view — all fields visible</div>
            </div>
            <OnboardingWizard key={selectedOrg} orgId={selectedOrg} role="admin" onComplete={refreshList} />
          </>
        )}
      </div>
    </div>
  );
}
