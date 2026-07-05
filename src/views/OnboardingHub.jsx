import { useState, useEffect } from "react";
import { C } from "../data.js";
import { supabase } from "../lib/supabase.js";
import OnboardingChecklist from "../components/OnboardingChecklist.jsx";
import SetupWizard from "../components/SetupWizard.jsx";
import InteractiveTour from "../components/InteractiveTour.jsx";
import QuickStartGuides from "../components/QuickStartGuides.jsx";

const TASKS = [
  { id: "api-keys", label: "Connect API Keys", icon: "🔑", category: "setup" },
  { id: "import-contacts", label: "Import First Contacts", icon: "👥", category: "setup" },
  { id: "brand-voice", label: "Configure Brand Voice", icon: "🎙", category: "setup" },
  { id: "first-campaign", label: "Create First Campaign", icon: "📢", category: "marketing" },
  { id: "schedule-post", label: "Schedule First Post", icon: "📅", category: "marketing" },
  { id: "agent-setup", label: "Activate AI Agents", icon: "🤖", category: "setup" },
  { id: "team-invite", label: "Invite Team Members", icon: "👫", category: "team" },
  { id: "notifications", label: "Set Up Notifications", icon: "🔔", category: "setup" },
  { id: "customize-theme", label: "Customize Theme & Branding", icon: "🎨", category: "setup" },
  { id: "explore-features", label: "Explore All Features", icon: "🚀", category: "learning" },
];

export default function OnboardingHub({ setActiveTab }) {
  const [completed, setCompleted] = useState(new Set());
  const [currentStep, setCurrentStep] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [activeTab, setInternalActiveTab] = useState("checklist");

  useEffect(() => {
    async function loadProgress() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("onboarding_progress")
        .select("completed_tasks")
        .eq("user_id", user.id)
        .single();

      if (data?.completed_tasks) {
        setCompleted(new Set(data.completed_tasks));
      }
    }
    loadProgress();
  }, []);

  const toggleTask = async (taskId) => {
    const newCompleted = new Set(completed);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompleted(newCompleted);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("onboarding_progress").upsert({
        user_id: user.id,
        completed_tasks: Array.from(newCompleted),
        updated_at: new Date(),
      });
    }
  };

  const progressPercent = Math.round((completed.size / TASKS.length) * 100);
  const nextIncompleteIdx = TASKS.findIndex(t => !completed.has(t.id));

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.textPrimary, margin: "0 0 8px 0", letterSpacing: -0.5 }}>
          Welcome to AIMS Command Center 🚀
        </h1>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
          Let's get you set up and ready to power your sales with AI.
        </p>
      </div>

      {/* Progress Summary Card */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primary}22 0%, ${C.accent}22 100%)`,
        border: `2px solid ${C.primary}`,
        borderRadius: 12,
        padding: "24px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Setup Progress
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.primary, marginBottom: 4 }}>
            {progressPercent}%
          </div>
          <div style={{ fontSize: 12, color: C.textSecondary }}>
            {completed.size} of {TASKS.length} tasks completed
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ flex: 1, marginLeft: 32, marginRight: 24 }}>
          <div style={{
            height: 8,
            background: C.border,
            borderRadius: 4,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: C.primary,
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          {progressPercent < 100 && (
            <button
              onClick={() => setShowWizard(true)}
              style={{
                padding: "10px 18px",
                background: C.primary,
                color: "white",
                border: "none",
                borderRadius: 7,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Continue Setup
            </button>
          )}
          <button
            onClick={() => setShowTour(true)}
            style={{
              padding: "10px 18px",
              background: "transparent",
              color: C.primary,
              border: `2px solid ${C.primary}`,
              borderRadius: 7,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Take Tour
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: "checklist", label: "✓ Checklist", icon: "📋" },
          { id: "wizard", label: "Wizard", icon: "✨" },
          { id: "guides", label: "Quick Start", icon: "📚" },
          { id: "tour", label: "Tour", icon: "🗺" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setInternalActiveTab(tab.id)}
            style={{
              padding: "12px 20px",
              background: "transparent",
              color: activeTab === tab.id ? C.primary : C.textSecondary,
              border: "none",
              borderBottom: activeTab === tab.id ? `3px solid ${C.primary}` : "none",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "checklist" && (
        <OnboardingChecklist tasks={TASKS} completed={completed} onToggle={toggleTask} setActiveTab={setActiveTab} />
      )}

      {activeTab === "wizard" && (
        <SetupWizard tasks={TASKS} completed={completed} onToggle={toggleTask} currentStep={currentStep} setCurrentStep={setCurrentStep} setActiveTab={setActiveTab} />
      )}

      {activeTab === "guides" && (
        <QuickStartGuides />
      )}

      {activeTab === "tour" && (
        <InteractiveTour setActiveTab={setActiveTab} />
      )}
    </div>
  );
}
