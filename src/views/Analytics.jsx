import { useState, useEffect } from "react";
import { C, AGENTS } from "../data.js";
import { SectionHeader } from "../components/utils.jsx";
import { getContacts, getAllCommunications, getLyricPosts, getScheduleRules, getNotifications } from "../lib/db.js";

function StatCard({ label, value, color, change, icon }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </div>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || C.textPrimary, marginBottom: 8 }}>
        {value}
      </div>
      {change && (
        <div style={{ fontSize: 11, color: change > 0 ? C.green : C.red }}>
          {change > 0 ? "↑" : "↓"} {Math.abs(change)}% from last month
        </div>
      )}
    </div>
  );
}

function ChartBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
          {value} <span style={{ color: C.textMuted }}>({Math.round(percentage)}%)</span>
        </span>
      </div>
      <div style={{ width: "100%", height: 8, background: C.card, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${percentage}%`, height: "100%", background: color || C.primary, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export default function Analytics({ orgId }) {
  const [contacts, setContacts] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [lyricPosts, setLyricPosts] = useState([]);
  const [scheduleRules, setScheduleRules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [orgId]);

  const loadData = async () => {
    try {
      const [contacts, comms, posts, rules, notifs] = await Promise.all([
        getContacts().catch(() => []),
        getAllCommunications().catch(() => []),
        getLyricPosts(orgId, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date()).catch(() => []),
        getScheduleRules(orgId).catch(() => []),
        getNotifications(orgId, 500).catch(() => []),
      ]);
      setContacts(contacts || []);
      setCommunications(comms || []);
      setLyricPosts(posts || []);
      setScheduleRules(rules || []);
      setNotifications(notifs || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setLoading(false);
    }
  };

  // Calculate metrics
  const leadStats = {
    total: contacts.length,
    cold: contacts.filter(c => c.stage === "cold").length,
    contacted: contacts.filter(c => c.stage === "contacted").length,
    qualified: contacts.filter(c => c.stage === "qualified").length,
    negotiating: contacts.filter(c => c.stage === "negotiating").length,
    won: contacts.filter(c => c.stage === "won").length,
    lost: contacts.filter(c => c.stage === "lost").length,
  };

  const totalValue = contacts.reduce((sum, c) => sum + Number(c.value || 0), 0);
  const avgDealSize = leadStats.total > 0 ? Math.round(totalValue / leadStats.total) : 0;
  const conversionRate = leadStats.total > 0 ? Math.round((leadStats.won / (leadStats.won + leadStats.lost)) * 100) : 0;

  const commStats = {
    total: communications.length,
    completed: communications.filter(c => c.status === "completed").length,
    failed: communications.filter(c => c.status === "failed").length,
    pending: communications.filter(c => c.status === "pending").length,
  };

  const successRate = commStats.total > 0 ? Math.round((commStats.completed / commStats.total) * 100) : 0;

  const channelBreakdown = {
    email: communications.filter(c => c.channel === "email").length,
    sms: communications.filter(c => c.channel === "sms").length,
    call: communications.filter(c => c.channel === "call").length,
    linkedin: communications.filter(c => c.channel === "linkedin").length,
  };

  const lyricStats = {
    total: lyricPosts.length,
    published: lyricPosts.filter(p => p.status === "published").length,
    pending_approval: lyricPosts.filter(p => p.status === "pending_approval").length,
    scheduled: lyricPosts.filter(p => p.status === "scheduled").length,
    failed: lyricPosts.filter(p => p.status === "failed").length,
    draft: lyricPosts.filter(p => p.status === "draft").length,
  };

  const publishRate = lyricStats.total > 0 ? Math.round((lyricStats.published / lyricStats.total) * 100) : 0;

  const agentActivity = AGENTS.map(agent => ({
    name: agent.name,
    color: agent.color,
    leads: contacts.filter(c => c.assigned_to === agent.id).length,
    communications: communications.filter(c => c.agent_id === agent.id).length,
  }));

  const notificationEvents = {
    lead_stage_changed: notifications.filter(n => n.event_type === "lead_stage_changed").length,
    post_published: notifications.filter(n => n.event_type === "post_published").length,
    task_assigned: notifications.filter(n => n.event_type === "task_assigned").length,
    communication_failed: notifications.filter(n => n.event_type === "communication_failed").length,
  };

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%" }}>
      <SectionHeader
        title="Analytics Dashboard"
        sub="Real-time metrics on leads, communications, and content performance"
      />

      {loading ? (
        <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, paddingTop: 60 }}>Loading analytics…</div>
      ) : (
        <>
          {/* KPI Section */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
            <StatCard label="Total Leads" value={leadStats.total} color={C.primary} icon="👥" />
            <StatCard label="Pipeline Value" value={`$${(totalValue / 1000).toFixed(1)}K`} color={C.green} icon="💰" />
            <StatCard label="Avg Deal Size" value={`$${avgDealSize.toLocaleString()}`} color={C.amber} icon="📈" />
            <StatCard label="Win Rate" value={`${conversionRate}%`} color={conversionRate > 30 ? C.green : C.red} icon="🎯" />
            <StatCard label="Total Communications" value={commStats.total} color={C.primary} icon="💬" />
          </div>

          {/* Pipeline Section */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 28 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.textPrimary }}>Lead Pipeline Breakdown</h3>
            <ChartBar label="Cold" value={leadStats.cold} total={leadStats.total} color={C.textSecondary} />
            <ChartBar label="Contacted" value={leadStats.contacted} total={leadStats.total} color="#00B4FF" />
            <ChartBar label="Qualified" value={leadStats.qualified} total={leadStats.total} color={C.primary} />
            <ChartBar label="Negotiating" value={leadStats.negotiating} total={leadStats.total} color={C.amber} />
            <ChartBar label="Won" value={leadStats.won} total={leadStats.total} color={C.green} />
            <ChartBar label="Lost" value={leadStats.lost} total={leadStats.total} color={C.red} />
          </div>

          {/* Communication Section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.textPrimary }}>Communication Performance</h3>
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.green, marginBottom: 4 }}>{successRate}%</div>
                  <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase" }}>Success Rate</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.green, marginBottom: 4 }}>{commStats.completed}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase" }}>Completed</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.red, marginBottom: 4 }}>{commStats.failed}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase" }}>Failed</div>
                </div>
              </div>
              <ChartBar label="Email" value={channelBreakdown.email} total={commStats.total} color="#0066FF" />
              <ChartBar label="SMS" value={channelBreakdown.sms} total={commStats.total} color="#00AA66" />
              <ChartBar label="Call" value={channelBreakdown.call} total={commStats.total} color="#FF6600" />
              <ChartBar label="LinkedIn" value={channelBreakdown.linkedin} total={commStats.total} color="#0A66C2" />
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.textPrimary }}>LYRIC Content Performance</h3>
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.green, marginBottom: 4 }}>{publishRate}%</div>
                  <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase" }}>Publish Rate</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.primary, marginBottom: 4 }}>{lyricStats.published}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase" }}>Published</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.amber, marginBottom: 4 }}>{lyricStats.pending_approval}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase" }}>Pending</div>
                </div>
              </div>
              <ChartBar label="Published" value={lyricStats.published} total={lyricStats.total} color={C.green} />
              <ChartBar label="Pending Approval" value={lyricStats.pending_approval} total={lyricStats.total} color={C.amber} />
              <ChartBar label="Scheduled" value={lyricStats.scheduled} total={lyricStats.total} color={C.primary} />
              <ChartBar label="Draft" value={lyricStats.draft} total={lyricStats.total} color={C.textMuted} />
              <ChartBar label="Failed" value={lyricStats.failed} total={lyricStats.total} color={C.red} />
            </div>
          </div>

          {/* Agent Activity Section */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 28 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.textPrimary }}>Agent Activity</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {agentActivity.map(agent => (
                <div key={agent.name} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 12, height: 12, background: agent.color, borderRadius: "50%" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: agent.color }}>{agent.name.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary }}>{agent.leads}</div>
                      <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase" }}>Leads</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary }}>{agent.communications}</div>
                      <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase" }}>Communications</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Activity */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.textPrimary }}>Recent Activity (Last 90 Days)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginBottom: 4 }}>{notificationEvents.lead_stage_changed}</div>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase" }}>Lead Changes</div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.green, marginBottom: 4 }}>{notificationEvents.post_published}</div>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase" }}>Posts Published</div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.amber, marginBottom: 4 }}>{notificationEvents.task_assigned}</div>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase" }}>Tasks Assigned</div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.red, marginBottom: 4 }}>{notificationEvents.communication_failed}</div>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase" }}>Failures</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
