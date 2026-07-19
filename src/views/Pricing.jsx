import { C } from "../data.js";

const PLANS = [
  {
    name:"Starter", price:"$497", setup:"$997", popular:false, color:"#F59E0B",
    target:"Small businesses — pure AI lead recovery",
    features:["100 leads/month","SMS + Email outreach","1 industry playbook","Analytics dashboard","Email support"],
  },
  {
    name:"Pro", price:"$797", setup:"$1,500", popular:true, color:"#4F7EFF",
    target:"Service businesses ready to recover AND close faster",
    features:["500 leads/month","SMS, Email, Voice + DM","All 11 industry playbooks","Custom AI agent name","CRM sync + A/B testing","Priority support"],
  },
  {
    name:"Elite", price:"$1,497", setup:"$2,500", popular:false, color:"#A855F7",
    target:"Multi-location operations needing full control",
    features:["Unlimited leads","All channels + WhatsApp","White-label your brand","10 sub-accounts","Dedicated CSM","API access"],
  },
];

const ROIS = [
  { ind:"MedSpa",           val:"$1,500–$5,000",   rec:"31x ROI — consultation bookings",      color:"#FF0080",  rank:"#1" },
  { ind:"HVAC",             val:"$500–$8,000",     rec:"24x ROI — after-hours + estimates",    color:"#FF6600",  rank:"#2" },
  { ind:"Roofing",          val:"$10,000–$25,000", rec:"18x ROI — storm season floods",        color:"#F59E0B",  rank:"#3" },
  { ind:"Real Estate",      val:"$8,000–$25,000",  rec:"28x ROI — ISA replacement",            color:"#4F7EFF",  rank:"#4" },
  { ind:"Financial Pros",   val:"$5,000–$50,000+", rec:"40x ROI — seminar lead recovery",      color:"#00B4FF",  rank:"#5" },
  { ind:"Plumbing",         val:"$500–$8,000",     rec:"19x ROI — planned work recovery",      color:"#39FF14",  rank:"#6" },
  { ind:"Law Firms",        val:"$3,500–$15,000",  rec:"22x ROI — after-hours intake",         color:"#A855F7",  rank:"#7" },
  { ind:"CPA / Tax",        val:"$1,000–$5,000",   rec:"14x ROI — seasonal overflow",          color:"#06B6D4",  rank:"#8" },
  { ind:"Pest Control",     val:"$600–$1,800/yr",  rec:"11x ROI — recurring conversion",       color:"#10B981",  rank:"#9" },
  { ind:"Landscaping",      val:"$3,000–$30,000",  rec:"12x ROI — spring quote recovery",      color:"#F59E0B",  rank:"#10" },
  { ind:"Fence & Gate",     val:"$3,500–$15,000",  rec:"16x ROI — quote follow-up",            color:"#EC4899",  rank:"#11" },
];

export default function Pricing() {
  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:C.textPrimary }}>Pricing Tiers</h2>
        <p style={{ color:C.textSecondary, fontSize:12, margin:"4px 0 0" }}>No contracts · Cancel anytime · 30-day money-back guarantee · TCPA compliant</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:28 }}>
        {PLANS.map(p => (
          <div key={p.name} style={{ background:C.card, border:`2px solid ${p.popular?p.color:C.border}`, borderRadius:12, padding:22, position:"relative" }}>
            {p.popular && (
              <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:p.color, color:"#fff", fontSize:10, fontWeight:800, padding:"3px 14px", borderRadius:10, whiteSpace:"nowrap" }}>MOST POPULAR</div>
            )}
            <div style={{ fontSize:12, fontWeight:800, color:p.color, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>{p.name}</div>
            <div style={{ fontSize:28, fontWeight:900, color:C.textPrimary, letterSpacing:-1, marginBottom:2 }}>{p.price}<span style={{ fontSize:13, fontWeight:500, color:C.textSecondary }}>/mo</span></div>
            <div style={{ fontSize:11, color:C.textMuted, marginBottom:12 }}>{p.setup} one-time setup</div>
            <div style={{ fontSize:11, color:C.textSecondary, lineHeight:1.5, marginBottom:14 }}>{p.target}</div>
            <ul style={{ margin:"0 0 16px", padding:"0 0 0 16px" }}>
              {p.features.map(f => <li key={f} style={{ fontSize:11, color:C.textSecondary, marginBottom:4 }}>{f}</li>)}
            </ul>
            <button style={{ width:"100%", padding:"8px 0", borderRadius:7, border:`1px solid ${p.color}`, background:p.popular?p.color:`${p.color}15`, color:p.popular?"#fff":p.color, fontSize:12, fontWeight:700, cursor:"pointer" }}>Get Started →</button>
          </div>
        ))}
      </div>

      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:C.textPrimary }}>ROI by Industry — Ranked by Performance</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {ROIS.map(r => (
            <div key={r.ind} style={{ padding:"12px 14px", borderRadius:8, background:C.card, border:`1px solid ${r.color}30` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:700, color:r.color }}>{r.ind}</span>
                <span style={{ fontSize:10, fontWeight:800, color:C.textMuted }}>{r.rank}</span>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:C.textPrimary, marginBottom:2 }}>{r.val}</div>
              <div style={{ fontSize:10, color:C.textSecondary }}>{r.rec}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
