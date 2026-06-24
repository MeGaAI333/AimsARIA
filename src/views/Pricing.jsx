import { C } from "../data.js";

const PLANS = [
  { name:"Starter",  agents:"ARIA only",                             price:"$497",  target:"Small businesses — pure lead recovery",             color:"#F59E0B" },
  { name:"Pro",      agents:"ARIA + MELODY",                         price:"$997",  target:"Service businesses ready to close faster",           color:"#4F7EFF" },
  { name:"Growth",   agents:"ARIA + MELODY + MUSE",                  price:"$1,297",target:"High-inbound businesses needing 24/7 support",       color:"#00B4FF" },
  { name:"Complete", agents:"All 4 Agents",                          price:"$1,797",target:"Full autonomous marketing & sales operation",         color:"#39FF14" },
  { name:"Elite",    agents:"All 4 + White-label + 10 Sub-accounts", price:"$2,497",target:"Multi-location franchises",                          color:"#A855F7" },
  { name:"Agency",   agents:"All 4 + 25 Sub-accounts + Rev Share",   price:"$3,500",target:"Marketing agencies reselling AIMS",                  color:"#FF0080" },
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
        <p style={{ color:C.textSecondary, fontSize:12, margin:"4px 0 0" }}>Setup fee: $997–$5,000 (all tiers) · Monthly recurring · Cancel anytime</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:28 }}>
        {PLANS.map(p => (
          <div key={p.name} style={{ background:C.card, border:`1px solid ${p.color}40`, borderRadius:12, padding:22, position:"relative" }}>
            {p.name === "Complete" && (
              <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:p.color, color:"#000", fontSize:10, fontWeight:800, padding:"3px 12px", borderRadius:10, whiteSpace:"nowrap" }}>MOST POPULAR</div>
            )}
            <div style={{ fontSize:12, fontWeight:800, color:p.color, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>{p.name}</div>
            <div style={{ fontSize:28, fontWeight:900, color:C.textPrimary, letterSpacing:-1, marginBottom:4 }}>{p.price}<span style={{ fontSize:13, fontWeight:500, color:C.textSecondary }}>/mo</span></div>
            <div style={{ fontSize:12, color:p.color, fontWeight:600, marginBottom:8 }}>{p.agents}</div>
            <div style={{ fontSize:11, color:C.textSecondary, lineHeight:1.5, marginBottom:16 }}>{p.target}</div>
            <button style={{ width:"100%", padding:"8px 0", borderRadius:7, border:`1px solid ${p.color}`, background:`${p.color}15`, color:p.color, fontSize:12, fontWeight:700, cursor:"pointer" }}>Get Started →</button>
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
