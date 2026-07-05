import { useState } from "react";
import { C } from "../data.js";
import { updateLyricPost } from "../lib/db.js";

export default function EditDraftModal({ post, onClose, onSave }) {
  const [text, setText] = useState(post.text || "");
  const [topic, setTopic] = useState(post.topic || "");
  const [platform, setPlatform] = useState(post.platform || "All Platforms");
  const [contentType, setContentType] = useState(post.content_type || "Post");
  const [scheduledAt, setScheduledAt] = useState(post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : "");
  const [saving, setSaving] = useState(false);

  const PLATFORMS = ["All Platforms", "Facebook", "Instagram", "LinkedIn"];
  const CONTENT_TYPES = ["Post", "Reel Script", "Carousel", "Email", "Newsletter", "Blog Post"];

  const handleSave = async () => {
    if (!text.trim() || !topic.trim()) return;
    setSaving(true);
    try {
      await updateLyricPost(post.id, {
        text,
        topic,
        platform,
        content_type: contentType,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : post.scheduled_at,
      });
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save draft:", err);
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}>
      <div style={{ width: 600, maxHeight: "90vh", overflow: "auto", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.textPrimary }}>Edit Draft</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {/* Topic */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What's the topic for this content?"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 12px",
                borderRadius: 8,
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.textPrimary,
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          {/* Content */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Content</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Edit your content here…"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: 8,
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.textPrimary,
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
                minHeight: 150,
                resize: "vertical",
              }}
            />
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{text.length} characters</div>
          </div>

          {/* Type & Platform */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  color: C.textPrimary,
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {CONTENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  color: C.textPrimary,
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheduled Date & Time */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Schedule (Optional)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 12px",
                borderRadius: 8,
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.textPrimary,
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.textSecondary,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !text.trim() || !topic.trim()}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: C.primary,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              opacity: saving || !text.trim() || !topic.trim() ? 0.6 : 1,
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
