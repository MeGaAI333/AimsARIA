import { useState, useEffect } from "react";
import { C } from "../data.js";
import { SectionHeader } from "../components/utils.jsx";
import { getAllCommunications, updateCommunicationStatus } from "../lib/db.js";

const STATUS_COLORS = {
  pending: C.amber,
  in_progress: C.primary,
  completed: C.green,
  failed: C.red,
  bounced: "#FF6B35",
};

const CHANNEL_ICONS = {
  email: "📧",
  sms: "💬",
  call: "☎️",
  voicemail: "🎤",
  linkedin: "💼",
  facebook: "📘",
  instagram: "📸",
  web: "🌐",
};

function FilterBar({ filter, setFilter, statuses }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      <button
        onClick={() => setFilter("all")}
        style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: `1px solid ${filter === "all" ? C.primary : C.border}`,
          background: filter === "all" ? `${C.primary}15` : "transparent",
          color: filter === "all" ? C.primary : C.textSecondary,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        All Communications
      </button>
      {Object.keys(STATUS_COLORS).map((status) => (
        <button
          key={status}
          onClick={() => setFilter(status)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${filter === status ? STATUS_COLORS[status] : C.border}`,
            background: filter === status ? `${STATUS_COLORS[status]}15` : "transparent",
            color: filter === status ? STATUS_COLORS[status] : C.textSecondary,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            textTransform: "capitalize",
          }}
        >
          {status === "in_progress" ? "In Progress" : status}
        </button>
      ))}
    </div>
  );
}

function CommunicationCard({ comm, onStatusChange }) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    await onStatusChange(comm.id, newStatus);
    setUpdating(false);
  };

  const commDate = new Date(comm.created_at);
  const updatedDate = comm.updated_at ? new Date(comm.updated_at) : null;

  return (
    <div
      style={{
        padding: "16px",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${STATUS_COLORS[comm.status]}`,
        borderRadius: 8,
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{CHANNEL_ICONS[comm.channel] || "💬"}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{comm.contact_name || "Unknown"}</span>
            <span style={{ fontSize: 11, color: C.textSecondary }}>·</span>
            <span style={{ fontSize: 11, color: C.textSecondary }}>{comm.channel.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8 }}>
            {commDate.toLocaleDateString()} @ {commDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ fontSize: 12, color: C.textSecondary, maxHeight: 80, overflowY: "auto", marginBottom: 8 }}>
            {comm.message}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 4,
              background: `${STATUS_COLORS[comm.status]}15`,
              color: STATUS_COLORS[comm.status],
              fontSize: 11,
              fontWeight: 700,
              textTransform: "capitalize",
              marginBottom: 8,
            }}
          >
            {comm.status === "in_progress" ? "In Progress" : comm.status}
          </div>
        </div>
      </div>

      {comm.agent_id && (
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
          Agent: <span style={{ fontWeight: 700, color: C.textSecondary }}>{comm.agent_id.toUpperCase()}</span>
        </div>
      )}

      {comm.error_message && (
        <div
          style={{
            fontSize: 11,
            color: C.red,
            background: `${C.red}10`,
            padding: "8px 10px",
            borderRadius: 6,
            marginBottom: 8,
            maxHeight: 60,
            overflowY: "auto",
          }}
        >
          <strong>Error:</strong> {comm.error_message}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {["pending", "in_progress", "completed", "failed"].map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={updating || comm.status === status}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${STATUS_COLORS[status]}`,
              background: comm.status === status ? `${STATUS_COLORS[status]}15` : "transparent",
              color: STATUS_COLORS[status],
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              opacity: updating || comm.status === status ? 0.7 : 1,
              textTransform: "capitalize",
            }}
          >
            {status === "in_progress" ? "Progress" : status.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CommunicationLogs() {
  const [communications, setCommunications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    loadCommunications();
  }, []);

  const loadCommunications = async () => {
    setLoading(true);
    try {
      const data = await getAllCommunications();
      setCommunications(data || []);
    } catch (err) {
      console.error("Failed to load communications:", err);
    }
    setLoading(false);
  };

  const handleStatusChange = async (commId, newStatus) => {
    try {
      await updateCommunicationStatus(commId, newStatus);
      setCommunications((prev) =>
        prev.map((c) => (c.id === commId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  let filtered = communications;
  if (filter !== "all") {
    filtered = communications.filter((c) => c.status === filter);
  }

  if (sortBy === "recent") {
    filtered = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sortBy === "oldest") {
    filtered = filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (sortBy === "status") {
    const order = ["failed", "in_progress", "pending", "completed"];
    filtered = filtered.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  }

  const stats = {
    total: communications.length,
    pending: communications.filter((c) => c.status === "pending").length,
    in_progress: communications.filter((c) => c.status === "in_progress").length,
    completed: communications.filter((c) => c.status === "completed").length,
    failed: communications.filter((c) => c.status === "failed").length,
  };

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%" }}>
      <SectionHeader
        title="Communication Logs"
        sub="Track all outreach attempts, responses, and outcomes across all channels"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Total", value: stats.total, color: C.textSecondary },
          { label: "Pending", value: stats.pending, color: STATUS_COLORS.pending },
          { label: "In Progress", value: stats.in_progress, color: STATUS_COLORS.in_progress },
          { label: "Completed", value: stats.completed, color: STATUS_COLORS.completed },
          { label: "Failed", value: stats.failed, color: STATUS_COLORS.failed },
        ].map((stat) => (
          <div key={stat.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: stat.color, marginBottom: 6 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", fontWeight: 700 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <FilterBar filter={filter} setFilter={setFilter} statuses={Object.keys(STATUS_COLORS)} />

      <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "flex-end" }}>
        <label style={{ fontSize: 12, color: C.textSecondary, display: "flex", alignItems: "center", gap: 8 }}>
          Sort by:
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: C.textPrimary,
              fontSize: 12,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="status">By Status</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, paddingTop: 60 }}>
          Loading communications…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: C.textMuted }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: C.textSecondary }}>
            No communications yet
          </h4>
          <p style={{ margin: 0, fontSize: 13, maxWidth: 340, lineHeight: 1.6 }}>
            Communications will appear here as outreach attempts are logged. All channel activity (email, SMS, call, etc.) is tracked automatically.
          </p>
        </div>
      ) : (
        <div>
          {filtered.map((comm) => (
            <CommunicationCard key={comm.id} comm={comm} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
