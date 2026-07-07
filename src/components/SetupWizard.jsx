import { useState } from "react";
import { C } from "../data.js";
import CustomSelect from "./CustomSelect.jsx";

const WIZARD_STEPS = [
  {
    id: "api-keys",
    title: "Connect API Keys",
    icon: "🔑",
    description: "Connect your Anthropic and Buffer API keys to unlock AI features and social media posting.",
    fields: [
      { label: "Anthropic API Key", key: "anthropic_key", type: "password", placeholder: "sk-ant-...", help: "Get from", helpLink: { text: "console.anthropic.com", url: "https://console.anthropic.com" } },
      { label: "Buffer API Token", key: "buffer_token", type: "password", placeholder: "your-buffer-token", help: "Get from", helpLink: { text: "buffer.com/developers/api", url: "https://buffer.com/developers/api" } },
    ],
  },
  {
    id: "import-contacts",
    title: "Import Your First Contacts",
    icon: "👥",
    description: "Add your initial contacts to the CRM. You can add them individually or import from a CSV file.",
    fields: [
      { label: "CSV File", key: "csv_file", type: "file", help: "Format: Name, Email, Phone, Company, Industry, Deal Value" },
    ],
  },
  {
    id: "brand-voice",
    title: "Configure Your Brand Voice",
    icon: "🎙",
    description: "Tell the AI agents how your brand should communicate. This ensures all generated content matches your style.",
    fields: [
      { label: "Brand Name", key: "brand_name", placeholder: "Your company name" },
      { label: "Tone", key: "tone", type: "select", options: ["Professional", "Friendly & Warm", "Direct & Urgent", "Educational", "Casual"], help: "How should your brand sound?" },
      { label: "Key Phrases to Use", key: "phrases", type: "textarea", placeholder: "e.g., 'Let's revolutionize...'" },
      { label: "Phrases to Avoid", key: "avoid_phrases", type: "textarea", placeholder: "e.g., 'used', 'cheap'" },
    ],
  },
  {
    id: "agent-setup",
    title: "Activate AI Agents",
    icon: "🤖",
    description: "Enable the four AI agents (ARIA, MELODY, LYRIC, MUSE) that will work 24/7 for your business.",
    fields: [
      { label: "Enable ARIA (Lead Recovery)", key: "aria_enabled", type: "checkbox", help: "Responds to cold leads & handles objections" },
      { label: "Enable MELODY (Closing Agent)", key: "melody_enabled", type: "checkbox", help: "Books appointments from warm leads" },
      { label: "Enable LYRIC (Content)", key: "lyric_enabled", type: "checkbox", help: "Generates social content & emails" },
      { label: "Enable MUSE (Reputation)", key: "muse_enabled", type: "checkbox", help: "Monitors reviews & protects brand" },
    ],
  },
  {
    id: "first-campaign",
    title: "Create Your First Campaign",
    icon: "📢",
    description: "Launch your first marketing campaign to test the system and see results.",
    fields: [
      { label: "Campaign Name", key: "campaign_name", placeholder: "e.g., Summer Lead Push" },
      { label: "Target Audience", key: "target_audience", placeholder: "e.g., Small businesses in NY" },
      { label: "Campaign Goal", key: "campaign_goal", type: "select", options: ["Generate Leads", "Nurture Existing", "Close Deals", "Build Awareness"] },
    ],
  },
];

export default function SetupWizard({ tasks, completed, onToggle, currentStep, setCurrentStep, setActiveTab, role = "user" }) {
  const [stepData, setStepData] = useState({});

  // Filter wizard steps based on role
  const filteredSteps = WIZARD_STEPS.filter(s => {
    if (s.id === "agent-setup" && role !== "admin") return false;
    return true;
  });

  const step = filteredSteps[currentStep];

  const handleNext = async () => {
    if (currentStep < filteredSteps.length - 1) {
      onToggle(filteredSteps[currentStep].id);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFieldChange = (key, value) => {
    setStepData(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const isCompleted = completed.has(step.id);

  return (
    <div>
      {/* Progress Indicator */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          {filteredSteps.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              style={{
                width: `${100 / filteredSteps.length}%`,
                height: 4,
                background: idx <= currentStep ? C.primary : C.border,
                borderRadius: 2,
                cursor: "pointer",
                transition: "background 0.2s",
                marginRight: idx < filteredSteps.length - 1 ? 4 : 0,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary, textAlign: "right" }}>
          Step {currentStep + 1} of {filteredSteps.length}
        </div>
      </div>

      {/* Step Content */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "32px",
        marginBottom: 24,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{step.icon}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary, margin: "0 0 8px 0" }}>
            {step.title}
          </h2>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
            {step.description}
          </p>
        </div>

        {/* Fields */}
        <div style={{ marginBottom: 32 }}>
          {step.fields.map(field => (
            <div key={field.key} style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: C.textPrimary,
                marginBottom: 8,
              }}>
                {field.label}
              </label>

              {field.type === "password" || field.type === "text" ? (
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={stepData[field.key] || ""}
                  onChange={e => handleFieldChange(field.key, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    background: C.input,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    color: C.textPrimary,
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  placeholder={field.placeholder}
                />
              ) : field.type === "textarea" ? (
                <textarea
                  placeholder={field.placeholder}
                  value={stepData[field.key] || ""}
                  onChange={e => handleFieldChange(field.key, e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    background: C.input,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    color: C.textPrimary,
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              ) : field.type === "select" ? (
                <CustomSelect
                  value={stepData[field.key] || ""}
                  onChange={val => handleFieldChange(field.key, val)}
                  options={field.options}
                  placeholder="Select an option..."
                />
              ) : field.type === "checkbox" ? (
                <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={stepData[field.key] || false}
                    onChange={e => handleFieldChange(field.key, e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 13, color: C.textPrimary }}>Enable</span>
                </label>
              ) : field.type === "file" ? (
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => handleFieldChange(field.key, e.target.files?.[0])}
                  style={{
                    padding: "11px 14px",
                    background: C.input,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                />
              ) : null}

              {field.help && (
                <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 6, margin: "6px 0 0 0" }}>
                  💡 {field.help}
                  {field.helpLink && (
                    <>
                      {" "}
                      <a
                        href={field.helpLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: C.primary,
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                        onMouseEnter={e => e.target.style.opacity = "0.8"}
                        onMouseLeave={e => e.target.style.opacity = "1"}
                      >
                        {field.helpLink.text} ↗
                      </a>
                    </>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Completion Message */}
        {isCompleted && (
          <div style={{
            padding: "12px 14px",
            background: `${C.success}15`,
            border: `1px solid ${C.success}`,
            borderRadius: 7,
            color: C.success,
            fontSize: 13,
            marginBottom: 24,
            fontWeight: 600,
          }}>
            ✓ This step is complete!
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          style={{
            padding: "12px 24px",
            background: "transparent",
            color: currentStep === 0 ? C.textSecondary : C.textPrimary,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            fontWeight: 600,
            fontSize: 13,
            cursor: currentStep === 0 ? "not-allowed" : "pointer",
            opacity: currentStep === 0 ? 0.5 : 1,
          }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", gap: 12 }}>
          {currentStep < filteredSteps.length - 1 && (
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
          {currentStep === filteredSteps.length - 1 && (
            <button
              onClick={() => setCurrentStep(0)}
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
              ✓ Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
