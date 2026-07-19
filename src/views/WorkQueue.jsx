import { useState, useEffect, useRef } from "react";
import { C, AGENTS } from "../data.js";
import { AgentAvatar } from "../components/utils.jsx";
import {
  getQueuedConversations,
  claimConversation,
  returnConversationToAI,
  closeConversation,
  appendConversationMessage,
} from "../lib/db.js";

const STATUS_COLOR = {
  active:       C.green,
  needs_human:  C.amber,
  human_active: C.primary,
  closed:       C.textMuted,
};
const STATUS_LABEL = {
  active:       "AI Active",
  needs_human:  "Needs Human",
  human_active: "Human Active",
  closed:       "Closed",
};

function MsgBubble({ msg }) {
  const isUser   = msg.role === "user";
  const isHuman  = msg.role === "human";
  const isAI     = msg.role === "ai";
  const isSystem = msg.role === "system";

  if (isSystem) return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"12px 0" }}>
      <div style={{ flex:1, height:1, background:C.border }} />
      <div style={{ padding:"5px 14px", borderRadius:20, fontSize:11, background:C.amberDim, border:`1px solid ${C.amber}40`, color:C.amber, whiteSpace:"nowrap" }}>{msg.content}</div>
      <div style={{ flex:1, height:1, background:C.border }} />
    </div>
  );

  const agent = isAI && msg.agent ? AGENTS.find(a => a.id === msg.agent) : null;
  const alignRight = isUser || isHuman;
  const ts = msg.ts ? new Date(msg.ts).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" }) : "";

  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", flexDirection:alignRight?"row-reverse":"row", marginBottom:10 }}>
      {isAI && agent && <AgentAvatar agentId={agent.id} size={26} />}
      {isHuman && (
        <div style={{ width:26, height:26, borderRadius:"50%", background:`${C.primary}20`, border:`1px solid ${C.primary}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>👤</div>
      )}
      <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", gap:3, alignItems:alignRight?"flex-end":"flex-start" }}>
        <div style={{ fontSize:11, color:isHuman?C.primary:agent?agent.color:C.textMuted, fontWeight:700 }}>
          {isHuman ? (msg.human_name || "Staff") : agent ? agent.name : "Contact"}
          {ts && <span style={{ fontWeight:400, color:C.textMuted, marginLeft:6 }}>{ts}</span>}
        </div>
        <div style={{ padding:"9px 13px", borderRadius:alignRight?"14px 14px 4px 14px":"14px 14px 14px 4px", background:isUser?C.surface:isHuman?`${C.primary}15`:C.card, border:`1px solid ${isUser?C.border:isHuman?`${C.primary}30`:agent?`${agent.color}25`:C.border}`, color:C.textPrimary, fontSize:13, lineHeight:1.55 }}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

export default function WorkQueue({ userEmail }) {
  const [convs, setConvs]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply]       = useState("");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => { load(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [selected]);

  async function load() {
    setLoading(true);
    try {
      const data = await getQueuedConversations();
      setConvs(data);
      if (selected) {
        const refreshed = data.find(c => c.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    } catch {}
    setLoading(false);
  }

  const activeConv = selected ? (convs.find(c => c.id === selected.id) || selected) : null;
  const isMine = activeConv?.assigned_to_human === userEmail;

  async function handleClaim() {
    if (!activeConv) return;
    try {
      const updated = await claimConversation(activeConv.id, userEmail || "Staff");
      setConvs(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSelected(updated);
    } catch {}
  }

  async function handleReturnToAI() {
    if (!activeConv) return;
    try {
      await returnConversationToAI(activeConv.id, userEmail || "Staff");
      setConvs(prev => prev.filter(c => c.id !== activeConv.id));
      setSelected(null);
    } catch {}
  }

  async function handleClose() {
    if (!activeConv) return;
    try {
      await closeConversation(activeConv.id);
      setConvs(prev => prev.filter(c => c.id !== activeConv.id));
      setSelected(null);
    } catch {}
  }

  async function sendReply() {
    if (!reply.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const msg = {
        id: Date.now(),
        role: "human",
        human_name: userEmail || "Staff",
        content: reply,
        ts: new Date().toISOString(),
        channel: "text",
      };
      const updated = await appendConversationMessage(activeConv.id, msg);
      setConvs(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSelected(updated);
      setReply("");
    } catch {}
    setSending(false);
  }

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Left — queue list */}
      <div style={{ width:260, background:C.sidebar, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"14px 16px 12px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:16 }}>📋</span>
            <span style={{ fontSize:13, fontWeight:800, color:C.textPrimary }}>Work Queue</span>
            {convs.length > 0 && (
              <span style={{ marginLeft:"auto", fontSize:11, fontWeight:800, color:C.amber, background:`${C.amber}15`, padding:"2px 8px", borderRadius:10 }}>{convs.length}</span>
            )}
          </div>
          <div style={{ fontSize:11, color:C.textMuted }}>Human-flagged conversations</div>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          {loading && <div style={{ padding:20, textAlign:"center", color:C.textMuted, fontSize:12 }}>Loading…</div>}
          {!loading && convs.length === 0 && (
            <div style={{ padding:"48px 20px", textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>✓</div>
              <div style={{ fontSize:13, color:C.textSecondary, fontWeight:600, marginBottom:6 }}>Queue is clear</div>
              <div style={{ fontSize:11, color:C.textMuted }}>No conversations need human attention right now.</div>
            </div>
          )}
          {convs.map(conv => {
            const agent = AGENTS.find(a => a.id === conv.agent_id);
            const isSel = activeConv?.id === conv.id;
            return (
              <div key={conv.id} onClick={() => setSelected(conv)}
                style={{ padding:"12px 14px", cursor:"pointer", borderLeft:`3px solid ${isSel?STATUS_COLOR[conv.status]:"transparent"}`, background:isSel?C.card:"transparent" }}
                onMouseEnter={e => !isSel && (e.currentTarget.style.background=C.surface)}
                onMouseLeave={e => !isSel && (e.currentTarget.style.background="transparent")}
              >
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>{conv.contact_name}</div>
                  <div style={{ fontSize:9, fontWeight:800, color:STATUS_COLOR[conv.status], textTransform:"uppercase" }}>
                    {STATUS_LABEL[conv.status]}
                  </div>
                </div>
                {conv.contact_company && <div style={{ fontSize:11, color:C.textSecondary, marginBottom:4 }}>{conv.contact_company}</div>}
                {agent && (
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:3 }}>
                    <AgentAvatar agentId={agent.id} size={13} />
                    <span style={{ fontSize:10, color:agent.color, fontWeight:700 }}>via {agent.name}</span>
                  </div>
                )}
                {conv.assigned_to_human && (
                  <div style={{ fontSize:10, color:C.primary }}>👤 {conv.assigned_to_human}</div>
                )}
                <div style={{ fontSize:10, color:C.textMuted, marginTop:3 }}>{(conv.messages||[]).length} messages</div>
              </div>
            );
          })}
        </div>
        <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}` }}>
          <button onClick={load} style={{ width:"100%", padding:"7px 0", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:C.textMuted, fontSize:11, fontWeight:700, cursor:"pointer" }}>
            ↺ Refresh Queue
          </button>
        </div>
      </div>

      {/* Right — conversation thread */}
      {!activeConv ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:C.textMuted }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
          <div style={{ fontSize:15, color:C.textSecondary, fontWeight:600, marginBottom:6 }}>Select a conversation</div>
          <div style={{ fontSize:13 }}>Full AI + human history displayed here.</div>
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Header */}
          <div style={{ padding:"14px 22px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary }}>{activeConv.contact_name}</div>
                {activeConv.contact_company && <div style={{ fontSize:12, color:C.textSecondary }}>{activeConv.contact_company}</div>}
                {activeConv.assigned_to_human && (
                  <div style={{ fontSize:11, color:C.primary, marginTop:3 }}>👤 Claimed by: {activeConv.assigned_to_human}</div>
                )}
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:800, color:STATUS_COLOR[activeConv.status], padding:"3px 10px", borderRadius:20, border:`1px solid ${STATUS_COLOR[activeConv.status]}40`, background:`${STATUS_COLOR[activeConv.status]}10` }}>
                  {STATUS_LABEL[activeConv.status]}
                </span>
                {activeConv.status === "needs_human" && (
                  <button onClick={handleClaim}
                    style={{ padding:"6px 14px", borderRadius:7, border:"none", background:C.primary, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    Claim
                  </button>
                )}
                {activeConv.status === "human_active" && isMine && (
                  <>
                    <button onClick={handleReturnToAI}
                      style={{ padding:"6px 14px", borderRadius:7, border:`1px solid ${C.green}`, background:"transparent", color:C.green, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      Return to AI
                    </button>
                    <button onClick={handleClose}
                      style={{ padding:"6px 14px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:C.textMuted, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
            <div style={{ fontSize:11, color:C.textMuted }}>Full conversation history — AI messages, human replies, and system events in chronological order</div>
          </div>

          {/* Thread */}
          <div style={{ flex:1, overflowY:"auto", padding:"18px 22px", display:"flex", flexDirection:"column" }}>
            {(activeConv.messages || []).length === 0 && (
              <div style={{ textAlign:"center", color:C.textMuted, marginTop:60, fontSize:13 }}>No messages in this conversation yet</div>
            )}
            {(activeConv.messages || []).map((msg, i) => <MsgBubble key={i} msg={msg} />)}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          {activeConv.status === "human_active" && isMine && (
            <div style={{ padding:"12px 22px", borderTop:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
              <div style={{ fontSize:11, color:C.primary, fontWeight:700, marginBottom:8 }}>
                👤 Replying as: {userEmail || "Staff"} — this will appear in the contact's conversation thread
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()}
                  placeholder="Type your reply to the contact…"
                  style={{ flex:1, padding:"9px 13px", borderRadius:7, background:C.card, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, outline:"none" }} />
                <button onClick={sendReply} disabled={!reply.trim() || sending}
                  style={{ padding:"9px 18px", borderRadius:7, border:"none", background:!reply.trim()||sending?C.border:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:!reply.trim()||sending?"not-allowed":"pointer" }}>
                  {sending ? "…" : "Send"}
                </button>
              </div>
            </div>
          )}
          {activeConv.status === "needs_human" && (
            <div style={{ padding:"12px 22px", borderTop:`1px solid ${C.border}`, background:C.amberDim, flexShrink:0 }}>
              <div style={{ fontSize:12, color:C.amber, fontWeight:700, textAlign:"center" }}>
                ⚠ Claim this conversation to reply and keep context intact
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
