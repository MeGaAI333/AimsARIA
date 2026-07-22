import { useState } from "react";
import { supabase } from "../lib/supabase.js";
import { C } from "../data.js";

// Public, unauthenticated page — reached via a link Allegra texts or emails
// during outreach. Rendered directly by App.jsx before any auth check, for
// anyone visiting /analysis. contact/org come from the link's query string
// (?c=<contact_id>&org=<org_id>) so the submission ties back to the right
// CRM contact and org without needing the prospect to log in.
const QUESTIONS = [
  { key: "lead_sources", label: "How do most new customers reach you — phone, website, Google, social, referrals, or paid ads?" },
  { key: "missed_calls", label: "Do you know how many calls are missed during the week or after hours?" },
  { key: "form_response_time", label: "When someone fills out a form, how quickly do they get a response?" },
  { key: "estimate_followup", label: "What happens to people who request an estimate but don't buy right away?" },
  { key: "old_lead_followup", label: "Do you follow up with old leads or past customers automatically?" },
  { key: "reminders_rebooking", label: "Do you have appointment reminders, no-show rebooking, and review requests?" },
  { key: "crm_usage", label: "Are you using a CRM, or is follow-up mostly manual?" },
];

export default function ProfitLeakAnalysis() {
  const params = new URLSearchParams(window.location.search);
  const contactId = params.get("c") || null;
  const orgId = params.get("org") || null;

  const [form, setForm] = useState({ business_name: "", contact_name: "", email: "", phone: "" });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setAnswer = (k, v) => setAnswers(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.business_name.trim() || !form.contact_name.trim()) return;
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.from("profit_leak_analyses").insert({
      org_id: orgId,
      contact_id: contactId,
      business_name: form.business_name.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      ...answers,
    });
    if (err) {
      setError("Something went wrong submitting this — please try again.");
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:C.bg, fontFamily:"'Inter', -apple-system, sans-serif", padding:20 }}>
        <div style={{ width:"100%", maxWidth:480, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:40, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
          <h2 style={{ margin:"0 0 10px", fontSize:20, fontWeight:800, color:C.textPrimary }}>Thanks — that's everything we need.</h2>
          <p style={{ margin:0, fontSize:14, color:C.textSecondary, lineHeight:1.6 }}>
            Someone from our team will follow up shortly to walk through what your answers show and what to fix first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", justifyContent:"center", minHeight:"100vh", background:C.bg, fontFamily:"'Inter', -apple-system, sans-serif", padding:"40px 20px" }}>
      <form onSubmit={handleSubmit} style={{ width:"100%", maxWidth:560, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:36 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:24, fontWeight:900, color:C.textPrimary, letterSpacing:-0.5 }}>
            AIMS <span style={{ color:C.primary }}>AI</span>
          </div>
          <h1 style={{ margin:"10px 0 6px", fontSize:20, fontWeight:800, color:C.textPrimary }}>Profit Leak Analysis</h1>
          <p style={{ margin:0, fontSize:13, color:C.textSecondary }}>Takes about 5 minutes. Answer as accurately as you can.</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:24 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Business Name *</label>
              <input required value={form.business_name} onChange={e => set("business_name", e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Your Name *</label>
              <input required value={form.contact_name} onChange={e => set("contact_name", e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Email</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Phone</label>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
            </div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {QUESTIONS.map((q, i) => (
            <div key={q.key}>
              <label style={{ display:"block", fontSize:13, color:C.textPrimary, fontWeight:600, marginBottom:8, lineHeight:1.4 }}>
                {i + 1}. {q.label}
              </label>
              <textarea rows={2} value={answers[q.key] || ""} onChange={e => setAnswer(q.key, e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", fontFamily:"inherit", resize:"vertical" }} />
            </div>
          ))}
        </div>

        {error && <p style={{ color:C.red, fontSize:12, marginTop:16 }}>{error}</p>}

        <button type="submit" disabled={submitting || !form.business_name.trim() || !form.contact_name.trim()}
          style={{ width:"100%", marginTop:24, padding:"12px 20px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", opacity:submitting || !form.business_name.trim() || !form.contact_name.trim() ? 0.6 : 1 }}>
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
