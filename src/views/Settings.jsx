import { useState, useEffect } from "react";
import { C, AGENTS, THEMES } from "../data.js";
import { AgentAvatar, Badge } from "../components/utils.jsx";
import { supabase } from "../lib/supabase.js";
import { useTheme } from "../App.jsx";

const ROLE_LABEL = { admin: "Admin", client: "Client", lyric: "LYRIC Client", user: "User" };
const ROLE_COLOR = { admin: C.primary, client: C.amber, lyric: "#39FF14", user: C.green };

const INVITE_ROLES = [
  { value:"admin",  label:"Admin",        desc:"Full access — all views, settings, and data",            color:C.primary },
  { value:"client", label:"Client",       desc:"Pipeline, campaigns, calendar, tasks, pricing",           color:C.amber },
  { value:"lyric",  label:"LYRIC Client", desc:"LYRIC Workstation only — content generation",            color:"#39FF14" },
  { value:"user",   label:"User",         desc:"Basic access — conversations, calendar, tasks",           color:C.green },
];

function InvitePanel({ currentColors }) {
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
    <div style={{ background:currentColors.card, border:`1px solid ${currentColors.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
      <h3 style={{ margin:"0 0 6px", fontSize:14, fontWeight:700, color:currentColors.textPrimary }}>Invite Team Member / Client</h3>
      <p style={{ margin:"0 0 20px", fontSize:12, color:currentColors.textSecondary }}>Send an email invite with login instructions. They'll be prompted to set their password on first login.</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
        <div>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:currentColors.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
            style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:currentColors.surface, border:`1px solid ${currentColors.border}`, color:currentColors.textPrimary, fontSize:13, outline:"none" }} />
        </div>
        <div>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:currentColors.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@example.com"
            style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:currentColors.surface, border:`1px solid ${currentColors.border}`, color:currentColors.textPrimary, fontSize:13, outline:"none" }} />
        </div>
        <div style={{ gridColumn:"1 / -1" }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:currentColors.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>Company Name</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme HVAC (used to isolate their data)"
            style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:currentColors.surface, border:`1px solid ${currentColors.border}`, color:currentColors.textPrimary, fontSize:13, outline:"none" }} />
          {company.trim() && <div style={{ fontSize:10, color:currentColors.textMuted, marginTop:4 }}>Org ID: {company.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")}</div>}
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:currentColors.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Access Level</label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {INVITE_ROLES.map(r => (
            <button key={r.value} onClick={() => setRole(r.value)}
              style={{ padding:"12px 14px", borderRadius:10, border:`2px solid ${role===r.value ? r.color : currentColors.border}`, background:role===r.value ? `${r.color}12` : "transparent", cursor:"pointer", textAlign:"left" }}>
              <div style={{ fontSize:13, fontWeight:700, color:role===r.value ? r.color : currentColors.textPrimary, marginBottom:3 }}>{r.label}</div>
              <div style={{ fontSize:11, color:currentColors.textSecondary, lineHeight:1.4 }}>{r.desc}</div>
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
        style={{ padding:"10px 24px", borderRadius:8, border:"none", background:!email.trim()||status==="sending" ? currentColors.border : currentColors.primary, color:!email.trim()||status==="sending" ? currentColors.textMuted : "#fff", fontSize:13, fontWeight:700, cursor:!email.trim()||status==="sending"?"not-allowed":"pointer" }}>
        {status === "sending" ? "Sending…" : "Send Invite →"}
      </button>
    </div>
  );
}

function BufferSettings({ orgId, currentColors }) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // null | "success" | "error"
  const [errMsg, setErrMsg] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (orgId) loadSettings();
  }, [orgId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("org_settings")
        .select("buffer_api_token, buffer_connected_at")
        .eq("org_id", orgId)
        .single();
      if (!error && data?.buffer_api_token) {
        setConnected(true);
        setToken("••••••••" + data.buffer_api_token.slice(-4));
      }
    } catch (e) {
      console.error("Failed to load Buffer settings:", e);
    }
  };

  const handleSave = async () => {
    if (!token.trim()) return;
    setSaving(true);
    setStatus(null);
    setErrMsg("");
    try {
      const { error } = await supabase
        .from("org_settings")
        .upsert(
          { org_id: orgId, buffer_api_token: token.trim(), buffer_connected_at: new Date().toISOString() },
          { onConflict: "org_id" }
        );
      if (error) throw error;
      setStatus("success");
      setConnected(true);
      setTimeout(() => setStatus(null), 2000);
    } catch (e) {
      setErrMsg(e.message || "Failed to save token.");
      setStatus("error");
    }
    setSaving(false);
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Buffer? LYRIC will no longer be able to post to social media.")) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("org_settings")
        .update({ buffer_api_token: null, buffer_connected_at: null })
        .eq("org_id", orgId);
      if (error) throw error;
      setConnected(false);
      setToken("");
      setStatus("success");
      setTimeout(() => setStatus(null), 2000);
    } catch (e) {
      setErrMsg(e.message || "Failed to disconnect.");
      setStatus("error");
    }
    setSaving(false);
  };

  return (
    <div style={{ background:currentColors.card, border:`1px solid ${currentColors.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <h3 style={{ margin:"0 0 6px", fontSize:14, fontWeight:700, color:currentColors.textPrimary }}>Buffer Integration</h3>
          <p style={{ margin:0, fontSize:12, color:currentColors.textSecondary }}>Connect your Buffer account to auto-post LYRIC content to all social platforms.</p>
        </div>
        {connected && (
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:20, background:`${C.green}15`, border:`1px solid ${C.green}30` }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.green }}>● Connected</span>
          </div>
        )}
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:currentColors.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>
          Buffer API Token {!connected && "*"}
        </label>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <input type={showToken ? "text" : "password"} value={token} onChange={e => setToken(e.target.value)} placeholder="Enter your Buffer API token"
            disabled={connected && saving}
            style={{ flex:1, padding:"10px 14px", borderRadius:8, background:currentColors.surface, border:`1px solid ${currentColors.border}`, color:currentColors.textPrimary, fontSize:13, outline:"none", opacity:connected && !saving ? 0.6 : 1 }} />
          <button onClick={() => setShowToken(!showToken)} style={{ padding:"8px 12px", borderRadius:6, border:`1px solid ${currentColors.border}`, background:"transparent", color:currentColors.textSecondary, fontSize:11, fontWeight:700, cursor:"pointer" }}>
            {showToken ? "Hide" : "Show"}
          </button>
        </div>
        <p style={{ margin:"6px 0 0", fontSize:11, color:currentColors.textMuted }}>
          Get your token from <a href="https://buffer.com/developers/api" target="_blank" rel="noreferrer" style={{ color:C.primary, textDecoration:"none", fontWeight:600 }}>Buffer Developer Settings →</a>
        </p>
      </div>

      {status === "success" && (
        <div style={{ padding:"12px 16px", borderRadius:8, background:`${C.green}15`, border:`1px solid ${C.green}40`, color:C.green, fontSize:13, fontWeight:600, marginBottom:14 }}>
          ✓ {connected ? "Buffer connected successfully!" : "Buffer disconnected."}
        </div>
      )}
      {status === "error" && (
        <div style={{ padding:"12px 16px", borderRadius:8, background:`${C.red}15`, border:`1px solid ${C.red}40`, color:C.red, fontSize:13, marginBottom:14 }}>
          ⚠️ {errMsg}
        </div>
      )}

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        {connected && (
          <button onClick={handleDisconnect} disabled={saving}
            style={{ padding:"9px 18px", borderRadius:8, border:`1px solid ${C.red}`, background:"transparent", color:C.red, fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving ? 0.6 : 1 }}>
            {saving ? "Disconnecting…" : "Disconnect"}
          </button>
        )}
        <button onClick={handleSave} disabled={!token.trim() || saving || connected}
          style={{ padding:"9px 18px", borderRadius:8, border:"none", background:!token.trim()||saving||connected ? currentColors.border : C.primary, color:!token.trim()||saving||connected ? currentColors.textMuted : "#fff", fontSize:13, fontWeight:700, cursor:!token.trim()||saving||connected ? "not-allowed" : "pointer" }}>
          {saving ? "Saving…" : connected ? "Token Saved" : "Save Token"}
        </button>
      </div>
    </div>
  );
}

export default function Settings({ role, userEmail, orgId, theme, onThemeToggle, onSignOut }) {
  const currentColors = THEMES[theme];

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", height:"100%", background: currentColors.bg }}>
      <h2 style={{ margin:"0 0 24px", fontSize:20, fontWeight:800, color:currentColors.textPrimary }}>Settings</h2>

      {/* Account Info */}
      <div style={{ background:currentColors.card, border:`1px solid ${currentColors.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:currentColors.textPrimary }}>Account</h3>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:currentColors.textPrimary, marginBottom:6 }}>{userEmail}</div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:20, background:`${ROLE_COLOR[role]||currentColors.primary}15`, border:`1px solid ${ROLE_COLOR[role]||currentColors.primary}30` }}>
              <span style={{ fontSize:10, fontWeight:800, color:ROLE_COLOR[role]||currentColors.primary, textTransform:"uppercase", letterSpacing:0.5 }}>{ROLE_LABEL[role]||role}</span>
            </div>
          </div>
          <button onClick={onSignOut}
            style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${currentColors.border}`, background:"transparent", color:currentColors.textSecondary, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Theme Settings */}
      <div style={{ background:currentColors.card, border:`1px solid ${currentColors.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:currentColors.textPrimary }}>Appearance</h3>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:currentColors.textPrimary, marginBottom:6 }}>Theme</div>
            <div style={{ fontSize:12, color:currentColors.textSecondary }}>
              {theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </div>
          </div>
          <button onClick={onThemeToggle}
            style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${currentColors.border}`, background:currentColors.surface, color:currentColors.textPrimary, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>
      </div>

      {/* Invite — admin only */}
      {role === "admin" && <InvitePanel currentColors={currentColors} />}

      {/* API Configuration */}
      <div style={{ background:currentColors.card, border:`1px solid ${currentColors.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
        <h3 style={{ margin:"0 0 6px", fontSize:14, fontWeight:700, color:currentColors.textPrimary }}>AI Configuration</h3>
        <p style={{ margin:"0 0 16px", fontSize:12, color:currentColors.textSecondary }}>Anthropic API key is managed server-side by AIMS staff. Live AI agent chat and LYRIC content generation are automatically enabled.</p>
        <div style={{ padding:"12px 14px", borderRadius:8, background:currentColors.surface, border:`1px solid ${C.green}30`, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>✓</span>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:C.green }}>API Active</div>
            <div style={{ fontSize:11, color:currentColors.textSecondary }}>All AI features enabled</div>
          </div>
        </div>
      </div>

      {/* Buffer Integration — admin only */}
      {role === "admin" && orgId && <BufferSettings orgId={orgId} currentColors={currentColors} />}

      {/* Agent Info — admin only */}
      {role === "admin" && (
        <div style={{ background:currentColors.card, border:`1px solid ${currentColors.border}`, borderRadius:12, padding:24, marginBottom:20 }}>
          <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:currentColors.textPrimary }}>Active Agents</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {AGENTS.map(a => (
              <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:8, background:currentColors.surface, border:`1px solid ${a.color}30` }}>
                <AgentAvatar agentId={a.id} size={36} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:a.color }}>{a.name}</div>
                  <div style={{ fontSize:11, color:currentColors.textSecondary }}>{a.role}</div>
                </div>
                <Badge color={C.green}>● Live</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Info */}
      <div style={{ background:currentColors.surface, border:`1px solid ${currentColors.border}`, borderRadius:12, padding:24 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, color:currentColors.textPrimary }}>System Information</h3>
        {[
          { label:"Platform", val:"AIMS AI Command Center v2.0" },
          { label:"Build",    val:"June 2026" },
          { label:"AI Model", val:"Claude Sonnet (via Anthropic API)" },
          { label:"Agents",   val:"ARIA · MELODY · LYRIC · MUSE" },
          { label:"Company",  val:"AIMS Marketing Systems, Inc." },
        ].map(row => (
          <div key={row.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${currentColors.border}` }}>
            <span style={{ fontSize:12, color:currentColors.textMuted }}>{row.label}</span>
            <span style={{ fontSize:12, color:currentColors.textPrimary, fontWeight:600 }}>{row.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
