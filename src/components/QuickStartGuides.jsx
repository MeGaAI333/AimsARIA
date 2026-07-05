import { useState } from "react";
import { C } from "../data.js";

const GUIDES = [
  {
    title: "Getting Your First 10 Leads",
    icon: "👥",
    duration: "15 min",
    steps: [
      "Go to CRM → + Add Contact",
      "Enter lead name, email, phone, company, deal value",
      "Move them to the appropriate pipeline stage",
      "Set up email notifications in Settings",
      "Create a follow-up task in Tasks",
    ],
  },
  {
    title: "Creating & Publishing Your First Post",
    icon: "📝",
    duration: "10 min",
    steps: [
      "Go to LYRIC Workstation → Create",
      "Select a platform (Facebook, Instagram, LinkedIn, etc.)",
      "Choose content type (Post, Carousel, Reel Script, Email)",
      "Fill in topic/goal and select your industry & tone",
      "Click Generate → Review preview → Click Approve",
      "Post automatically publishes at scheduled time",
    ],
  },
  {
    title: "Setting Up Your First Campaign",
    icon: "📢",
    duration: "20 min",
    steps: [
      "Go to Campaigns → + New Campaign",
      "Enter campaign name and description",
      "Select a template (Blank, Lead Recovery, Closing Sequence, etc.)",
      "Configure targeting and scheduling",
      "Activate the campaign",
      "Track performance in Campaigns → Analytics",
    ],
  },
  {
    title: "Inviting Team Members",
    icon: "👫",
    duration: "5 min",
    steps: [
      "Go to Settings → Invite Team Member",
      "Enter their name and email",
      "Select their role (Admin, Client, LYRIC Client, User)",
      "Click Send Invite",
      "They'll receive an email to set their password",
    ],
  },
  {
    title: "Connecting Your Buffer Account",
    icon: "🔗",
    duration: "5 min",
    steps: [
      "Go to buffer.com/developers/api → Generate API token",
      "Copy the token and go to Settings → Buffer Integration",
      "Paste the token and click Save",
      "Verify connection shows ● Connected",
      "LYRIC posts will now auto-publish to all platforms",
    ],
  },
  {
    title: "Using the AI Agents",
    icon: "🤖",
    duration: "15 min",
    steps: [
      "Go to AI AGENTS in sidebar → Click an agent",
      "See their Brand Voice and Performance stats",
      "Scroll to Live Chat at bottom",
      "Type a question or request to the agent",
      "Agent responds using their unique persona",
    ],
  },
  {
    title: "Filtering & Exporting Leads",
    icon: "📊",
    duration: "10 min",
    steps: [
      "Go to Pipeline → Click Filter icon",
      "Filter by stage, score range, deal value, agent, recency",
      "Apply filters and see live results",
      "Click Export → Choose format (CSV)",
      "Use for reporting or external tools",
    ],
  },
  {
    title: "Understanding Lead Scoring",
    icon: "⭐",
    duration: "5 min",
    steps: [
      "Lead scores (0-100) are calculated automatically",
      "Score considers: stage, deal value, recency, communications, notes",
      "Hot leads (qualified/negotiating) score highest",
      "Use scores to prioritize follow-ups",
      "Higher scores = more likely to close",
    ],
  },
];

const QUICK_TIPS = [
  { icon: "💡", title: "Auto-Reply Setup", description: "Enable AI-powered replies in Conversations → Settings" },
  { icon: "📅", title: "Schedule Rules", description: "Create recurring posts in LYRIC → Calendar → + New Rule" },
  { icon: "📧", title: "Bulk Email", description: "Multi-select leads in Pipeline, click Email to send to all" },
  { icon: "🎨", title: "Custom Branding", description: "Set brand colors and voice in Settings → Brand Voice" },
  { icon: "⏰", title: "Notifications", description: "Control what alerts you in Settings → Notifications" },
  { icon: "📱", title: "Mobile Access", description: "Access Command Center from any device at aimsai.aimsmarketingsystems.com" },
];

export default function QuickStartGuides() {
  const [expandedGuide, setExpandedGuide] = useState(null);

  return (
    <div>
      {/* Quick Tips */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, marginBottom: 16, margin: "0 0 16px 0" }}>
          💡 Quick Tips
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {QUICK_TIPS.map((tip, idx) => (
            <div
              key={idx}
              style={{
                padding: "16px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{tip.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>
                {tip.title}
              </div>
              <div style={{ fontSize: 12, color: C.textSecondary }}>
                {tip.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guides */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, marginBottom: 16, margin: "0 0 16px 0" }}>
          📚 Step-by-Step Guides
        </h3>
        <div style={{ display: "grid", gap: 12 }}>
          {GUIDES.map((guide, idx) => (
            <div
              key={idx}
              onClick={() => setExpandedGuide(expandedGuide === idx ? null : idx)}
              style={{
                padding: "16px",
                background: expandedGuide === idx ? `${C.primary}08` : C.surface,
                border: `1px solid ${expandedGuide === idx ? C.primary : C.border}`,
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  <div style={{ fontSize: 24 }}>{guide.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
                      {guide.title}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                      ⏱ {guide.duration}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 18, color: C.textSecondary }}>
                  {expandedGuide === idx ? "−" : "+"}
                </div>
              </div>

              {/* Steps */}
              {expandedGuide === idx && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    {guide.steps.map((step, stepIdx) => (
                      <li
                        key={stepIdx}
                        style={{
                          fontSize: 13,
                          color: C.textPrimary,
                          marginBottom: 8,
                          lineHeight: 1.6,
                        }}
                      >
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, marginBottom: 16, margin: "0 0 16px 0" }}>
          📖 Resources
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <a href="https://aimsai.aimsmarketingsystems.com" style={{
            padding: "16px",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            textDecoration: "none",
            color: C.primary,
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span>📚 Full User Manual</span>
            <span>→</span>
          </a>
          <a href="mailto:support@aimsmarketingsystems.com" style={{
            padding: "16px",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            textDecoration: "none",
            color: C.primary,
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span>💬 Contact Support</span>
            <span>→</span>
          </a>
          <a href="https://console.anthropic.com" style={{
            padding: "16px",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            textDecoration: "none",
            color: C.primary,
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span>🔑 Anthropic API Keys</span>
            <span>→</span>
          </a>
          <a href="https://buffer.com/developers/api" style={{
            padding: "16px",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            textDecoration: "none",
            color: C.primary,
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span>🔗 Buffer API</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
