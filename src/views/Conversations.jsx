import { useState, useRef, useEffect } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar, ChannelBadge } from "../components/utils.jsx";
import { supabase } from "../lib/supabase.js";

function useContacts() {
  const [contacts, setContacts] = useState([]);
  useEffect(() => {
    supabase.from("contacts").select("id, name, company, stage, source, industry").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setContacts(data || []));
  }, []);
  return contacts;
}

export default function Conversations({ selectedLead, setSelectedLead, apiKey }) {
  const [activeAgentId, setActiveAgentId] = useState("aria");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const activeAgent = AGENTS.find(a => a.id === activeAgentId);
  const contacts = useContacts();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  useEffect(() => {
    setMessages([]);
  }, [selectedLead, activeAgentId]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { id:Date.now(), role:"user", agent:null, channel:"text", ts:"Now", content:input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = [...messages.filter(m => m.role !== "system"), userMsg]
        .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers: { "Content-Type":"application/json", "x-api-key": apiKey, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:1000,
          system: activeAgent.systemPrompt + (selectedLead ? `\n\nContact context: ${selectedLead.name}, ${selectedLead.company || ""}, ${selectedLead.industry || ""}. Stage: ${selectedLead.stage}. Source: ${selectedLead.source || ""}.` : ""),
          messages: history,
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || (data.error ? `⚠️ API Error: ${data.error.message}` : "Unable to respond.");
      setMessages(prev => [...prev, { id:Date.now()+1, role:"ai", agent:activeAgentId, channel:activeAgent.channels[0], ts:"Now", content:text }]);
    } catch {
      setMessages(prev => [...prev, { id:Date.now()+1, role:"ai", agent:activeAgentId, channel:"text", ts:"Now", content:"⚠️ Connection error. Check API key in Settings." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Contact List */}
      <div style={{ width:210, background:C.sidebar, borderRight:`1px solid ${C.border}`, overflowY:"auto", flexShrink:0 }}>
        <div style={{ padding:"14px 14px 6px", fontSize:10, fontWeight:800, color:C.textMuted, textTransform:"uppercase", letterSpacing:1 }}>Contacts</div>
        {contacts.length === 0 && (
          <div style={{ padding:"20px 14px", fontSize:11, color:C.textMuted, textAlign:"center" }}>No contacts yet</div>
        )}
        {contacts.map(contact => {
          const stageColors = { cold:C.textMuted, contacted:C.primary, qualified:C.green, negotiating:C.amber, won:C.green, lost:C.red };
          const color = stageColors[contact.stage] || C.textMuted;
          return (
            <div key={contact.id} onClick={() => setSelectedLead(contact)}
              style={{ padding:"9px 14px", cursor:"pointer", background:selectedLead?.id===contact.id ? C.surface:"transparent", borderLeft:`3px solid ${selectedLead?.id===contact.id ? C.primary:"transparent"}`, transition:"all .15s" }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.textPrimary }}>{contact.name}</div>
              <div style={{ fontSize:10, color:C.textSecondary }}>{contact.company || contact.industry || "—"}</div>
              <div style={{ fontSize:9, color, fontWeight:700, textTransform:"uppercase", marginTop:3 }}>{contact.stage}</div>
            </div>
          );
        })}
        <div onClick={() => setSelectedLead(null)} style={{ padding:"9px 14px", cursor:"pointer", opacity:.5 }}>
          <div style={{ fontSize:11, color:C.textSecondary }}>+ New Chat</div>
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Chat Header */}
        <div style={{ padding:"14px 22px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
          <div style={{ marginBottom:10 }}>
            {selectedLead ? (
              <>
                <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary }}>{selectedLead.name} <span style={{ fontSize:12, fontWeight:400, color:C.textSecondary }}>— {selectedLead.company || selectedLead.industry || ""}</span></div>
                <div style={{ fontSize:11, color:C.textSecondary, marginTop:2 }}>Stage: {selectedLead.stage}{selectedLead.source ? ` · ${selectedLead.source}` : ""}</div>
              </>
            ) : (
              <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary }}>Live Agent Chat</div>
            )}
          </div>
          {/* Agent selector */}
          <div style={{ display:"flex", gap:6 }}>
            {AGENTS.map(a => (
              <button key={a.id} onClick={() => setActiveAgentId(a.id)}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, border:`1px solid ${activeAgentId===a.id ? a.color : C.border}`, background:activeAgentId===a.id ? `${a.color}15`:"transparent", color:activeAgentId===a.id ? a.color:C.textSecondary, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                <span>{a.avatar}</span>{a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"18px 22px", display:"flex", flexDirection:"column", gap:2 }}>
          {messages.length === 0 && (
            <div style={{ textAlign:"center", color:C.textMuted, marginTop:60 }}>
              <div style={{ fontSize:40, marginBottom:10 }}>{activeAgent.avatar}</div>
              <div style={{ fontSize:14, color:C.textSecondary, fontWeight:600 }}>{activeAgent.name} is ready</div>
              <div style={{ fontSize:12, color:C.textMuted, marginTop:4, maxWidth:320, margin:"8px auto 0" }}>{activeAgent.description}</div>
              {!apiKey && <div style={{ fontSize:11, color:C.amber, marginTop:16, padding:"8px 14px", background:`${C.amber}15`, border:`1px solid ${C.amber}30`, borderRadius:8, display:"inline-block" }}>⚠️ Add your API key in Settings to activate live chat</div>}
            </div>
          )}
          {messages.map(msg => {
            const a = msg.agent ? AGENTS.find(ag => ag.id === msg.agent) : null;
            const isUser = msg.role === "user";
            return (
              <div key={msg.id} style={{ display:"flex", gap:8, alignItems:"flex-start", flexDirection:isUser?"row-reverse":"row", marginBottom:10 }}>
                {!isUser && a && <AgentAvatar agentId={a.id} size={26} />}
                <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", gap:3, alignItems:isUser?"flex-end":"flex-start" }}>
                  {!isUser && a && (
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:a.color }}>{a.name}</span>
                      {msg.channel && <ChannelBadge channel={msg.channel} />}
                      <span style={{ fontSize:10, color:C.textMuted }}>{msg.ts}</span>
                    </div>
                  )}
                  <div style={{ padding:"9px 13px", borderRadius:isUser?"14px 14px 4px 14px":"14px 14px 14px 4px", background:isUser ? C.primary : C.card, border:`1px solid ${isUser ? C.primary : (a ? `${a.color}30` : C.border)}`, color:C.textPrimary, fontSize:13, lineHeight:1.55 }}>{msg.content}</div>
                  {isUser && <span style={{ fontSize:10, color:C.textMuted }}>{msg.ts}</span>}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <AgentAvatar agentId={activeAgentId} size={26} />
              <div style={{ padding:"9px 16px", borderRadius:"14px 14px 14px 4px", background:C.card, border:`1px solid ${activeAgent.color}30`, color:C.textSecondary, fontSize:20, letterSpacing:4 }}>···</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding:"12px 22px", borderTop:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:18 }}>{activeAgent.avatar}</span>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
              placeholder={`Message ${activeAgent.name}…`}
              style={{ flex:1, padding:"9px 13px", borderRadius:7, background:C.card, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
            <button onClick={send} disabled={loading || !input.trim() || !apiKey}
              style={{ padding:"9px 18px", borderRadius:7, border:"none", background:!input.trim()||loading||!apiKey ? C.border : activeAgent.color, color:"#fff", fontSize:13, fontWeight:700, cursor:!input.trim()||loading||!apiKey?"not-allowed":"pointer" }}>
              {loading ? "…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
