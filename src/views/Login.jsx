import { useState } from "react";
import { supabase } from "../lib/supabase.js";
import { C } from "../data.js";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:C.bg, fontFamily:"'Inter', -apple-system, sans-serif" }}>
      <div style={{ width:380, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:40 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:26, fontWeight:900, color:C.textPrimary, letterSpacing:-0.5 }}>
            AIMS <span style={{ color:C.primary }}>AI</span>
          </div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>Command Center</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", fontFamily:"inherit" }}
            />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSecondary, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none", fontFamily:"inherit" }}
            />
          </div>

          {error && (
            <div style={{ marginBottom:16, padding:"10px 14px", borderRadius:8, background:C.redDim, border:`1px solid ${C.red}40`, fontSize:12, color:C.red }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width:"100%", padding:"12px 0", borderRadius:8, background:C.primary, border:"none", color:"#fff", fontSize:14, fontWeight:700, cursor:loading ? "not-allowed":"pointer", opacity:loading ? 0.7:1 }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign:"center", fontSize:11, color:C.textMuted, marginTop:24 }}>
          Contact your administrator to get access.
        </p>
      </div>
    </div>
  );
}
