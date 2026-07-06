import { useState } from "react";
import { C } from "../data.js";

const TOUR_STOPS = [
  {
    section: "Dashboard",
    icon: "📊",
    title: "Welcome to Command Center",
    description: "Your central hub for managing leads, campaigns, and AI agents. See real-time metrics on pipeline value, recent activity, and team updates.",
    highlights: ["Revenue Flywheel", "Pipeline Summary", "Recent Activity"],
  },
  {
    section: "Pipeline",
    icon: "📈",
    title: "Manage Your Sales Pipeline",
    description: "Visual Kanban board showing leads organized by stage. Filter by score, agent, value, or recency. Bulk email, score leads, and export to CSV.",
    highlights: ["Advanced Filtering", "Lead Scoring (🤖)", "Bulk Actions", "Quick Email", "Activity Timeline"],
  },
  {
    section: "Conversations",
    icon: "💬",
    title: "AI-Powered Messaging",
    description: "Communicate with leads and get AI-assisted replies. The AI agents help craft smart responses based on conversation context.",
    highlights: ["Message History", "AI Suggestions", "Read Receipts"],
  },
  {
    section: "Campaigns",
    icon: "📢",
    title: "Marketing Campaigns",
    description: "Create, schedule, and track marketing campaigns. Choose from templates (Lead Recovery, Closing Sequence, Content) and monitor performance.",
    highlights: ["Campaign Templates", "Scheduling", "Performance Tracking"],
  },
  {
    section: "LYRIC Workstation",
    icon: "✨",
    title: "AI Content Generation",
    description: "Generate unique social content with AI. Create, schedule, and auto-publish to Facebook, Instagram, LinkedIn, Twitter, TikTok via Buffer.",
    highlights: ["AI Content Gen", "Scheduling Rules", "Brand Customization", "Auto-Publish", "Analytics"],
  },
  {
    section: "Calendar",
    icon: "📅",
    title: "Schedule Events",
    description: "Track all calls, demos, onboarding sessions, and meetings. See upcoming events and assign to team members.",
    highlights: ["Schedule Call", "Schedule Demo", "Event Types", "Team Assignment"],
  },
  {
    section: "AI Agents",
    icon: "🤖",
    title: "Meet Your AI Team",
    description: "Four powerful agents work 24/7: ARIA (lead capture), MELODY (closing), LYRIC (content), MUSE (reputation). See their performance and chat directly.",
    highlights: ["ARIA - Inbound", "MELODY - Outbound", "LYRIC - Content", "MUSE - Reputation"],
  },
  {
    section: "Settings",
    icon: "⚙️",
    title: "Configure Everything",
    description: "Connect API keys, invite team members, set notification preferences, and customize your workspace.",
    highlights: ["Anthropic API", "Buffer Integration", "Team Invites", "Appearance", "Notifications"],
  },
];

export default function InteractiveTour({ setActiveTab }) {
  const [currentStop, setCurrentStop] = useState(0);
  const stop = TOUR_STOPS[currentStop];

  const handleNext = () => {
    if (currentStop < TOUR_STOPS.length - 1) {
      setCurrentStop(currentStop + 1);
    }
  };

  const handleBack = () => {
    if (currentStop > 0) {
      setCurrentStop(currentStop - 1);
    }
  };

  const handleGoToSection = (section) => {
    // Map section names to tab values if needed
    const tabMap = {
      "Dashboard": "dashboard",
      "Pipeline": "pipeline",
      "Conversations": "conversations",
      "Campaigns": "campaigns",
      "LYRIC Workstation": "lyric-workstation",
      "Calendar": "calendar",
      "AI Agents": "agents",
      "Settings": "settings",
    };
    if (tabMap[section]) {
      setActiveTab(tabMap[section]);
    }
  };

  return (
    <div>
      {/* Tour Progress */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {TOUR_STOPS.map((s, idx) => (
            <div
              key={s.section}
              onClick={() => setCurrentStop(idx)}
              style={{
                flex: 1,
                height: 4,
                background: idx <= currentStop ? C.primary : C.border,
                borderRadius: 2,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary, textAlign: "right" }}>
          Stop {currentStop + 1} of {TOUR_STOPS.length}
        </div>
      </div>

      {/* Tour Stop Card */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primary}12 0%, ${C.accent}12 100%)`,
        border: `2px solid ${C.primary}`,
        borderRadius: 12,
        padding: "32px",
        marginBottom: 24,
      }}>
        {/* Icon & Title */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{stop.icon}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: C.textPrimary, margin: "0 0 8px 0" }}>
            {stop.section}
          </h2>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.primary, margin: 0 }}>
            {stop.title}
          </p>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 14,
          color: C.textSecondary,
          lineHeight: 1.6,
          margin: "0 0 24px 0",
        }}>
          {stop.description}
        </p>

        {/* Highlights */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, margin: "0 0 12px 0" }}>
            Key Features
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {stop.highlights.map((highlight, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px 14px",
                  background: "white",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.textPrimary,
                }}
              >
                ✓ {highlight}
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleGoToSection(stop.section)}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: C.primary,
            color: "white",
            border: "none",
            borderRadius: 7,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          🔍 Go to {stop.section}
        </button>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
        <button
          onClick={handleBack}
          disabled={currentStop === 0}
          style={{
            padding: "12px 24px",
            background: "transparent",
            color: currentStop === 0 ? C.textSecondary : C.textPrimary,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            fontWeight: 600,
            fontSize: 13,
            cursor: currentStop === 0 ? "not-allowed" : "pointer",
            opacity: currentStop === 0 ? 0.5 : 1,
          }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", gap: 12 }}>
          {currentStop < TOUR_STOPS.length - 1 && (
            <button
              onClick={handleNext}
              style={{
                padding: "12px 24px",
                background: C.primary,
                color: "white",
                border: "none",
                borderRadius: 7,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Next →
            </button>
          )}
          {currentStop === TOUR_STOPS.length - 1 && (
            <button
              onClick={() => {
                // Tour complete
              }}
              style={{
                padding: "12px 24px",
                background: C.success,
                color: "white",
                border: "none",
                borderRadius: 7,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ✓ Tour Complete
            </button>
          )}
        </div>
      </div>

      {/* All Sections Grid */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, margin: "0 0 16px 0" }}>
          Jump to Any Section
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {TOUR_STOPS.map((s, idx) => (
            <button
              key={s.section}
              onClick={() => setCurrentStop(idx)}
              style={{
                padding: "14px",
                background: currentStop === idx ? C.primary : C.surface,
                color: currentStop === idx ? "white" : C.textPrimary,
                border: `1px solid ${currentStop === idx ? C.primary : C.border}`,
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                if (currentStop !== idx) {
                  e.currentTarget.style.background = C.hoverBg;
                }
              }}
              onMouseLeave={e => {
                if (currentStop !== idx) {
                  e.currentTarget.style.background = C.surface;
                }
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
              <div>{s.section}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
