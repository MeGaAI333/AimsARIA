import { C, AGENTS, AC } from "../data.js";

export const PulsingDot = ({ color = C.green }) => (
  <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:color, boxShadow:`0 0 8px ${color}`, animation:"aiPulse 2s infinite", flexShrink:0 }} />
);

export const Badge = ({ children, color = C.primary }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, background:`${color}22`, color, border:`1px solid ${color}30`, letterSpacing:0.3, whiteSpace:"nowrap" }}>{children}</span>
);

export const ChannelBadge = ({ channel }) => {
  const map = {
    sms:    { icon:"💬", color:C.green,         label:"SMS" },
    email:  { icon:"📧", color:C.primary,       label:"Email" },
    voice:  { icon:"🎙️", color:AC.lyric.color,  label:"Voice" },
    social: { icon:"📲", color:AC.melody.color, label:"Social" },
    text:   { icon:"💬", color:C.green,         label:"Text" },
  };
  const c = map[channel] || { icon:"📡", color:C.textSecondary, label:channel };
  return <Badge color={c.color}>{c.icon} {c.label}</Badge>;
};

export const AgentAvatar = ({ agentId, size = 30 }) => {
  const a = AGENTS.find(ag => ag.id === agentId);
  if (!a) return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.45, color:C.textSecondary, flexShrink:0 }}>👤</div>
  );
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`${a.color}18`, border:`2px solid ${a.color}50`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.45, flexShrink:0 }}>{a.avatar}</div>
  );
};

export const StatCard = ({ label, value, sub, icon, color }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"18px 20px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
      <span style={{ fontSize:22 }}>{icon}</span>
      <span style={{ fontSize:10, color:C.textMuted }}>30d</span>
    </div>
    <div style={{ fontSize:26, fontWeight:800, color, letterSpacing:-1 }}>{value}</div>
    <div style={{ fontSize:11, color:C.textSecondary, marginTop:4 }}>{label}</div>
    {sub && <div style={{ fontSize:10, color, marginTop:2 }}>{sub}</div>}
  </div>
);

export const SectionHeader = ({ title, sub, action }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
    <div>
      <h2 style={{ fontSize:20, fontWeight:800, color:C.textPrimary, margin:0 }}>{title}</h2>
      {sub && <p style={{ color:C.textSecondary, fontSize:12, margin:"4px 0 0" }}>{sub}</p>}
    </div>
    {action}
  </div>
);

export const Btn = ({ children, onClick, color = C.primary, variant = "solid", size = "md", disabled = false, style: extra = {} }) => {
  const pad = size === "sm" ? "5px 12px" : size === "lg" ? "11px 24px" : "8px 16px";
  const fs  = size === "sm" ? 11 : size === "lg" ? 14 : 13;
  const bg  = variant === "solid" ? (disabled ? C.border : color) : "transparent";
  const border = variant === "outline" ? `1px solid ${color}` : "none";
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding:pad, borderRadius:8, border, background:bg, color: variant === "solid" ? "#fff" : color, fontSize:fs, fontWeight:700, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1, ...extra }}>
      {children}
    </button>
  );
};

export const FlywheelBanner = () => {
  const steps = [
    { agentId:"lyric",  label:"Attracts leads" },
    { agentId:"muse",   label:"Answers inbound" },
    { agentId:"aria",   label:"Recovers cold leads" },
    { agentId:"melody", label:"Closes deals" },
    { agentId:null,     label:"YOU sign & collect", isYou:true },
  ];
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 22px", marginBottom:24, display:"flex", alignItems:"center", gap:0, overflowX:"auto" }}>
      {steps.map((step, i) => {
        const a = AGENTS.find(ag => ag.id === step.agentId);
        const color = step.isYou ? C.green : a?.color;
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:0, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:8, background:`${color}12`, border:`1px solid ${color}30` }}>
              {step.isYou ? <span style={{ fontSize:16 }}>🤝</span> : <AgentAvatar agentId={step.agentId} size={22} />}
              <div>
                <div style={{ fontSize:11, fontWeight:700, color }}>{step.isYou ? "YOU" : a?.name}</div>
                <div style={{ fontSize:10, color:C.textSecondary }}>{step.label}</div>
              </div>
            </div>
            {i < steps.length - 1 && <div style={{ fontSize:16, color:C.textMuted, padding:"0 6px" }}>→</div>}
          </div>
        );
      })}
    </div>
  );
};
