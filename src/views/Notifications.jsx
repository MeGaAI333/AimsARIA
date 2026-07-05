import { useState, useEffect } from "react";
import { C } from "../data.js";
import { SectionHeader } from "../components/utils.jsx";
import { getNotifications, markNotificationRead, getUnreadNotificationCount, getNotificationPreferences, updateNotificationPreferences } from "../lib/db.js";

const EVENT_COLORS = {
  lead_stage_changed: C.primary,
  post_published: C.green,
  task_assigned: C.amber,
  communication_failed: C.red,
  agent_escalation: "#FF6B35",
};

const EVENT_ICONS = {
  lead_stage_changed: "📊",
  post_published: "📱",
  task_assigned: "✓",
  communication_failed: "⚠️",
  agent_escalation: "🚨",
};

const EVENT_LABELS = {
  lead_stage_changed: "Lead Updated",
  post_published: "Post Published",
  task_assigned: "Task Assigned",
  communication_failed: "Communication Failed",
  agent_escalation: "Agent Escalation",
};

function NotificationCard({ notif, onMarkRead }) {
  const handleClick = () => {
    if (!notif.read_at) {
      onMarkRead(notif.id);
    }
  };

  const isRead = !!notif.read_at;
  const sentDate = new Date(notif.sent_at);
  const timeAgo = getTimeAgo(sentDate);

  return (
    <div onClick={handleClick} style={{
      padding: "14px",
      background: isRead ? C.card : `${EVENT_COLORS[notif.event_type]}10`,
      border: `1px solid ${isRead ? C.border : EVENT_COLORS[notif.event_type]}`,
      borderRadius: 8,
      marginBottom: 10,
      cursor: "pointer",
      opacity: isRead ? 0.7 : 1,
      transition: "all 0.2s",
    }}
      onMouseEnter={e => !isRead && (e.currentTarget.style.background = `${EVENT_COLORS[notif.event_type]}20`)}
      onMouseLeave={e => !isRead && (e.currentTarget.style.background = `${EVENT_COLORS[notif.event_type]}10`)}>
      <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
        <span style={{ fontSize: 18 }}>{EVENT_ICONS[notif.event_type] || "🔔"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: EVENT_COLORS[notif.event_type] || C.textPrimary }}>
              {EVENT_LABELS[notif.event_type] || notif.event_type}
            </span>
            {!isRead && <span style={{ fontSize: 8, fontWeight: 800, color: EVENT_COLORS[notif.event_type], textTransform: "uppercase", letterSpacing: 0.5 }}>New</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>
            {notif.subject}
          </div>
          {notif.data?.message && (
            <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8 }}>
              {notif.data.message}
            </div>
          )}
          <div style={{ fontSize: 11, color: C.textMuted }}>
            {timeAgo}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferencesPanel({ preferences, orgId, onUpdate }) {
  const [prefs, setPrefs] = useState(preferences);
  const [saving, setSaving] = useState(false);

  const handleToggle = (event_type) => {
    setPrefs(p => ({ ...p, [event_type]: !p[event_type] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationPreferences(orgId, prefs);
      onUpdate(prefs);
    } catch (err) {
      console.error("Failed to save preferences:", err);
    }
    setSaving(false);
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.textPrimary }}>Notification Preferences</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {Object.entries(EVENT_LABELS).map(([eventType, label]) => (
          <div key={eventType} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: 12, color: C.textSecondary, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <span>{EVENT_ICONS[eventType]}</span>
              <span>{label}</span>
            </label>
            <button onClick={() => handleToggle(eventType)} style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              background: prefs[eventType] ? C.green : C.red,
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              opacity: 0.8,
            }}>
              {prefs[eventType] ? "On" : "Off"}
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} style={{
        width: "100%",
        padding: "10px",
        borderRadius: 8,
        border: "none",
        background: C.primary,
        color: "white",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        opacity: saving ? 0.6 : 1,
      }}>
        {saving ? "Saving…" : "Save Preferences"}
      </button>
    </div>
  );
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function Notifications({ orgId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({});
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [orgId]);

  const loadData = async () => {
    try {
      const [notifs, unread, prefs] = await Promise.all([
        getNotifications(orgId, 100),
        getUnreadNotificationCount(orgId),
        getNotificationPreferences(orgId),
      ]);
      setNotifications(notifs);
      setUnreadCount(unread);
      setPreferences(prefs);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setLoading(false);
    }
  };

  const handleMarkRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      setNotifications(p => p.map(n => n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(p => Math.max(0, p - 1));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handlePrefsUpdate = (newPrefs) => {
    setPreferences(newPrefs);
    setShowPrefs(false);
  };

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%" }}>
      <SectionHeader
        title="Notifications"
        sub={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
        action={<button onClick={() => setShowPrefs(!showPrefs)} style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: C.surface,
          color: C.textSecondary,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}>⚙️ Preferences</button>}
      />

      {showPrefs && (
        <div style={{ marginBottom: 28 }}>
          <PreferencesPanel preferences={preferences} orgId={orgId} onUpdate={handlePrefsUpdate} />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, paddingTop: 60 }}>Loading notifications…</div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: C.textMuted }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: C.textSecondary }}>No notifications yet</h4>
          <p style={{ margin: 0, fontSize: 13, maxWidth: 340, lineHeight: 1.6 }}>
            You'll receive notifications when leads move, posts publish, or tasks are assigned.
          </p>
        </div>
      ) : (
        <div>
          {notifications.map(notif => (
            <NotificationCard key={notif.id} notif={notif} onMarkRead={handleMarkRead} />
          ))}
        </div>
      )}
    </div>
  );
}
