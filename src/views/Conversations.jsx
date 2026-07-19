import { useState, useRef, useEffect } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar, ChannelBadge } from "../components/utils.jsx";
import { supabase } from "../lib/supabase.js";
import {
  getOrCreateConversation,
  appendConversationMessage,
  setConversationNeedsHuman,
} from "../lib/db.js";

function useContacts() {
  const [contacts, setContacts] = useState([]);
  useEffect(() => {
    supabase.from("contacts").select("id, name, company, stage, source, industry")
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setContacts(data || []));
  }, []);
  return contacts;
}

export default function Conversations({ selectedLead, setSelectedLead, orgId }) {
  const [activeAgentId, setActiveAgentId] = useState("aria");
  const [messages, setMessages]           = useState([]);
  const [convId, setConvId]               = useState(null);
  const [convStatus, setConvStatus]       = useState("active");
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [requesting, setRequesting]       = useState(false);
  const bottomRef = useRef(null);
  const activeAgent = AGENTS.find(a => a.id === activeAgentId);
  const contacts = useContacts();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  // Load or create a persisted conversation when contact changes
  useEffect(() => {
    if (!selectedLead) { setMessages([]); setConvId(null); setConvStatus("active"); return; }
    getOrCreateConversation(
      selectedLead.id,
      selectedLead.name,
      selectedLead.company || "",
      orgId || "",
      activeAgentId,
    ).then(conv => {
      setConvId(conv.id);
      setConvStatus(conv.status);
      setMessages(conv.messages || []);
    }).catch(() => { setMessages([]); setConvId(null); });
  }, [selectedLead?.id]);

  const persistMsg = async (msg) => {
    if (!convId) return;
    try { await appendConversationMessage(convId, msg); } catch {}
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = {
      id: Date.now(), role:"user", agent:null, channel:"text",
      ts: new Date().toISOString(), content: input,
    };
    setMessages(prev => [...prev, userMsg]);
    await persistMsg(userMsg);
    setInput("");
    setLoading(true);
    try {
      const history = [...messages, userMsg]
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/call-claude`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          system: activeAgent.systemPrompt + (selectedLead ? `\n\nContact context: ${selectedLead.name}, ${selectedLead.company||""}, ${selectedLead.industry||""}. Stage: ${selectedLead.stage}. Source: ${selectedLead.source||""}.` : ""),
          messages: history,
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || (data.error ? `⚠️ ${data.error}` : "Unable to respond.");
      const aiMsg = {
        id: Date.now()+1, role:"ai", agent:activeAgentId,
        channel: activeAgent.channels[0], ts: new Date().toISOString(), content: text,
      };
      setMessages(prev => [...prev, aiMsg]);
      await persistMsg(aiMsg);
    } catch {
      setMessages(prev => [...prev, { id:Date.now()+1, role:"ai", agent:activeAgentId, channel:"text", ts:new Date().toISOString(), content:"⚠️ Connection error. Check API key in Settings." }]);
    }
    setLoading(false);
  };

  const requestHuman = async () => {
    if (!convId || requesting) return;
    setRequesting(true);
    try {
      const sysMsg = {
        id: Date.now(), role:"system",
        content: `Contact requested a human agent — conversation transferred to Work Queue`,
        ts: new Date().toISOString(),
      };
      setMessages(prev => [...prev, sysMsg]);
      await persistMsg(sysMsg);
      await setConversationNeedsHuman(convId);
      setConvStatus("needs_human");
    } catch {}
    setRequesting(false);
  };

  const needsHuman   = convStatus === "needs_human";
  const humanActive  = convStatus === "human_active";
  const chatDisabled = needsHuman || humanActive;

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
              style={{ padding:"9px 14px", cursor:"pointer", background:selectedLead?.id===contact.id?C.surface:"transparent", borderLeft:`3px solid ${selectedLead?.id===contact.id?C.primary:"transparent"}`, transition:"all .15s" }}>
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
        {/* Header */}
        <div style={{ padding:"14px 22px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              {selectedLead ? (
                <>
                  <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary }}>{selectedLead.name} <span style={{ fontSize:12, fontWeight:400, color:C.textSecondary }}>— {selectedLead.company || selectedLead.industry || ""}</span></div>
                  <div style={{ fontSize:11, color:C.textSecondary, marginTop:2 }}>Stage: {selectedLead.stage}{selectedLead.source?` · ${selectedLead.source}`:""}</div>
                </>
              ) : (
                <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary }}>Live Agent Chat</div>
              )}
            </div>
            {selectedLead && convId && !chatDisabled && (
              <button onClick={requestHuman} disabled={requesting}
                style={{ padding:"6px 14px", borderRadius:7, border:`1px solid ${C.amber}`, background:`${C.amber}10`, color:C.amber, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                {requesting ? "Transferring…" : "👤 Request Human Agent"}
              </button>
            )}
            {needsHuman && (
              <div style={{ padding:"6px 14px", borderRadius:7, background:C.amberDim, border:`1px solid ${C.amber}40`, color:C.amber, fontSize:11, fontWeight:700, flexShrink:0 }}>
                ⏳ Waiting for human agent…
              </div>
            )}
            {humanActive && (
              <div style={{ padding:"6px 14px", borderRadius:7, background:`${C.primary}15`, border:`1px solid ${C.primary}40`, color:C.primary, fontSize:11, fontWeight:700, flexShrink:0 }}>
                👤 Human agent active
              </div>
            )}
          </div>
          {/* Agent selector */}
          <div style={{ display:"flex", gap:6 }}>
            {AGENTS.map(a => (
              <button key={a.id} onClick={() => !chatDisabled && setActiveAgentId(a.id)}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, border:`1px solid ${activeAgentId===a.id?a.color:C.border}`, background:activeAgentId===a.id?`${a.color}15`:"transparent", color:activeAgentId===a.id?a.color:C.textSecondary, fontSize:11, fontWeight:700, cursor:chatDisabled?"default":"pointer", opacity:chatDisabled?0.5:1 }}>
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
            </div>
          )}
          {messages.map((msg, i) => {
            if (msg.role === "system") return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, margin:"10px 0" }}>
                <div style={{ flex:1, height:1, background:C.border }} />
                <div style={{ padding:"5px 14px", borderRadius:20, fontSize:11, background:C.amberDim, border:`1px solid ${C.amber}40`, color:C.amber, textAlign:"center", maxWidth:"75%" }}>{msg.content}</div>
                <div style={{ flex:1, height:1, background:C.border }} />
              </div>
            );
            if (msg.role === "human") return (
              <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:`${C.primary}20`, border:`1px solid ${C.primary}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>👤</div>
                <div style={{ maxWidth:"72%" }}>
                  <div style={{ fontSize:11, color:C.primary, fontWeight:700, marginBottom:3 }}>{msg.human_name || "Staff"}</div>
                  <div style={{ padding:"9px 13px", borderRadius:"14px 14px 14px 4px", background:`${C.primary}15`, border:`1px solid ${C.primary}30`, color:C.textPrimary, fontSize:13, lineHeight:1.55 }}>{msg.content}</div>
                </div>
              </div>
            );
            const a = msg.agent ? AGENTS.find(ag => ag.id === msg.agent) : null;
            const isUser = msg.role === "user";
            return (
              <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", flexDirection:isUser?"row-reverse":"row", marginBottom:10 }}>
                {!isUser && a && <AgentAvatar agentId={a.id} size={26} />}
                <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", gap:3, alignItems:isUser?"flex-end":"flex-start" }}>
                  {!isUser && a && (
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:a.color }}>{a.name}</span>
                      {msg.channel && <ChannelBadge channel={msg.channel} />}
                    </div>
                  )}
                  <div style={{ padding:"9px 13px", borderRadius:isUser?"14px 14px 4px 14px":"14px 14px 14px 4px", background:isUser?C.primary:C.card, border:`1px solid ${isUser?C.primary:a?`${a.color}30`:C.border}`, color:C.textPrimary, fontSize:13, lineHeight:1.55 }}>{msg.content}</div>
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
        <div style={{ padding:"12px 22px", borderTop:`1px solid ${C.border}`, background:chatDisabled?C.amberDim:C.surface, flexShrink:0 }}>
          {chatDisabled ? (
            <div style={{ textAlign:"center", fontSize:12, color:C.amber, fontWeight:700, padding:"6px 0" }}>
              {needsHuman ? "⏳ Waiting for a human agent to claim this conversation…" : "👤 A human agent has taken over this conversation"}
            </div>
          ) : (
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:18 }}>{activeAgent.avatar}</span>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
                placeholder={`Message ${activeAgent.name}…`}
                style={{ flex:1, padding:"9px 13px", borderRadius:7, background:C.card, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
              <button onClick={send} disabled={loading || !input.trim()}
                style={{ padding:"9px 18px", borderRadius:7, border:"none", background:!input.trim()||loading?C.border:activeAgent.color, color:"#fff", fontSize:13, fontWeight:700, cursor:!input.trim()||loading?"not-allowed":"pointer" }}>
                {loading ? "…" : "Send"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
