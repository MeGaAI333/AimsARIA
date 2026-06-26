import { useState } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar, Badge } from "../components/utils.jsx";
import { supabase } from "../lib/supabase.js";

const ROLE_LABEL = { admin: "Admin", client: "Client", lyric: "LYRIC Client", user: "User" };
const ROLE_COLOR = { admin: C.primary, client: C.amber, lyric: "#39FF14", user: C.green };

const INVITE_ROLES = [
  { value:"admin",  label:"Admin",        desc:"Full access — all views, settings, and data",            color:C.primary },
  { value:"client", label:"Client",       desc:"Pipeline, campaigns, calendar, tasks, pricing",           color:C.amber },
  { value:"lyric",  label:"LYRIC Client", desc:"LYRIC Workstation only — content generation",            color:"#39FF14" },
  { value:"user",   label:"User",         desc:"Basic access — conversations, calendar, tasks",           color:C.green },
];

function InvitePanel() {
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [company, setCompany]   = useState("");
  const [role, setRole]         = useState("lyric");
  const [status, setStatus]     = useState(null); // null | "sending" | "success" | "error"
  const [errMsg, setErrMsg]     = useState("");

  const send = async () => {
    if (!email.trim()) return;
    setStatus("sending");
    setErrMsg("");
    const orgId = company.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      const { error } = await supabase.functions.invoke("invite-user", {
        body: { email: email.trim(), name: name.trim(), role, org_id: orgId },
      });
      if (error) throw new Error(error.message);
      setStatus("success");
      setEmail("");
      setName("");
      setCompany("");
    } catch (e) {
      setErrMsg(e.message || "Failed to send invite.");
      setStatus("error");
    }
  };

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
      <h3 style={{ margin:"0 0 6px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Invite Team Member / Client</h3>
      <p style={{ margin:"0 0 20px", fontSize:12, color:C.textSecondary }}>Send an email invite with login instructions. They'll be prompted to set their password on first login.</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
        <div>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
            style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
        </div>
        <div>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@example.com"
            style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
        </div>
        <div style={{ gridColumn:"1 / -1" }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>Company Name</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme HVAC (used to isolate their data)"
            style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
          {company.trim() && <div style={{ fontSize:10, color:C.textMuted, marginTop:4 }}>Org ID: {company.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")}</div>}
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Access Level</label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {INVITE_ROLES.map(r => (
            <button key={r.value} onClick={() => setRole(r.value)}
              style={{ padding:"12px 14px", borderRadius:10, border:`2px solid ${role===r.value ? r.color : C.border}`, background:role===r.value ? `${r.color}12` : "transparent", cursor:"pointer", textAlign:"left" }}>
              <div style={{ fontSize:13, fontWeight:700, color:role===r.value ? r.color : C.textPrimary, marginBottom:3 }}>{r.label}</div>
              <div style={{ fontSize:11, color:C.textSecondary, lineHeight:1.4 }}>{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {status === "success" && (
        <div style={{ padding:"12px 16px", borderRadius:8, background:`${C.green}15`, border:`1px solid ${C.green}40`, color:C.green, fontSize:13, fontWeight:600, marginBottom:14 }}>
          ✓ Invite sent to {email || "client"}! They'll receive an email with login instructions.
        </div>
      )}
      {status === "error" && (
        <div style={{ padding:"12px 16px", borderRadius:8, background:`${C.red}15`, border:`1px solid ${C.red}40`, color:C.red, fontSize:13, marginBottom:14 }}>
          ⚠️ {errMsg}
        </div>
      )}

      <button onClick={send} disabled={!email.trim() || status==="sending"}
        style={{ padding:"10px 24px", borderRadius:8, border:"none", background:!email.trim()||status==="sending" ? C.border : C.primary, color:!email.trim()||status==="sending" ? C.textMuted : "#fff", fontSize:13, fontWeight:700, cursor:!email.trim()||status==="sending"?"not-allowed":"pointer" }}>
        {status === "sending" ? "Sending…" : "Send Invite →"}
      </button>
    </div>
  );
}

export default function Settings({ apiKey, setApiKey, role, userEmail, onSignOut }) {
  const [keyDraft, setKeyDraft] = useState(apiKey);
  const [keySaved, setKeySaved] = useState(false);

  const saveKey = () => {
    setApiKey(keyDraft);
    localStorage.setItem("aims_api_key", keyDraft);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 3000);
  };

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%" }}>
      <h2 style={{ margin:"0 0 24px", fontSize:20, fontWeight:800, color:C.textPrimary }}>Settings</h2>

      {/* Account Info */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Account</h3>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary, marginBottom:6 }}>{userEmail}</div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:20, background:`${ROLE_COLOR[role]||C.primary}15`, border:`1px solid ${ROLE_COLOR[role]||C.primary}30` }}>
              <span style={{ fontSize:10, fontWeight:800, color:ROLE_COLOR[role]||C.primary, textTransform:"uppercase", letterSpacing:0.5 }}>{ROLE_LABEL[role]||role}</span>
            </div>
          </div>
          <button onClick={onSignOut}
            style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textSecondary, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Invite — admin only */}
      {role === "admin" && <InvitePanel />}

      {/* API Key */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
        <h3 style={{ margin:"0 0 6px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Anthropic API Key</h3>
        <p style={{ margin:"0 0 16px", fontSize:12, color:C.textSecondary }}>Required for live AI agent chat and LYRIC content generation.</p>
        <div style={{ display:"flex", gap:10 }}>
          <input type="password" value={keyDraft} onChange={e => setKeyDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveKey()}
            placeholder="sk-ant-api03-…"
            style={{ flex:1, padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${keyDraft ? C.green : C.border}`, color:C.textPrimary, fontSize:13, outline:"none", fontFamily:"monospace" }} />
          <button onClick={saveKey} disabled={!keyDraft.trim()}
            style={{ padding:"10px 20px", borderRadius:8, border:"none", background:keySaved ? C.green : (!keyDraft.trim() ? C.border : C.primary), color:"#fff", fontSize:13, fontWeight:700, cursor:!keyDraft.trim()?"not-allowed":"pointer", flexShrink:0, transition:"background .2s" }}>
            {keySaved ? "✓ Saved!" : "Save Key"}
          </button>
        </div>
        {apiKey && !keySaved && <div style={{ fontSize:11, color:C.green, fontWeight:700, marginTop:8 }}>✓ API key is active</div>}
        <p style={{ margin:"8px 0 0", fontSize:11, color:C.textMuted }}>Stored in your browser only. Never shared or logged. Press Enter or click Save Key.</p>
      </div>

      {/* Agent Info — admin only */}
      {role === "admin" && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
          <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:C.textPrimary }}>Active Agents</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {AGENTS.map(a => (
              <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:8, background:C.surface, border:`1px solid ${a.color}30` }}>
                <AgentAvatar agentId={a.id} size={36} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:a.color }}>{a.name}</div>
                  <div style={{ fontSize:11, color:C.textSecondary }}>{a.role}</div>
                </div>
                <Badge color={C.green}>● Live</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Info */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, color:C.textPrimary }}>System Information</h3>
        {[
          { label:"Platform", val:"AIMS AI Command Center v2.0" },
          { label:"Build",    val:"June 2026" },
          { label:"AI Model", val:"Claude Sonnet (via Anthropic API)" },
          { label:"Agents",   val:"ARIA · MELODY · LYRIC · MUSE" },
          { label:"Company",  val:"AIMS Marketing Systems, Inc." },
        ].map(row => (
          <div key={row.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:12, color:C.textMuted }}>{row.label}</span>
            <span style={{ fontSize:12, color:C.textPrimary, fontWeight:600 }}>{row.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
