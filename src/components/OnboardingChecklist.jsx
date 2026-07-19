import { C } from "../data.js";

export default function OnboardingChecklist({ tasks, completed, onToggle, setActiveTab }) {
  const categories = ["setup", "marketing", "team", "learning"];
  const categoryLabels = {
    setup: "🔧 Setup & Configuration",
    marketing: "📢 Marketing & Content",
    team: "👥 Team & Collaboration",
    learning: "🎓 Learning & Exploration",
  };

  const categoryEmojis = {
    setup: "🔧",
    marketing: "📢",
    team: "👥",
    learning: "🎓",
  };

  return (
    <div>
      {categories.map(cat => {
        const catTasks = tasks.filter(t => t.category === cat);
        const catCompleted = catTasks.filter(t => completed.has(t.id)).length;
        const catPercent = Math.round((catCompleted / catTasks.length) * 100);

        return (
          <div key={cat} style={{ marginBottom: 28 }}>
            {/* Category Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, margin: "0 0 4px 0" }}>
                  {categoryLabels[cat]}
                </h3>
                <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>
                  {catCompleted} of {catTasks.length} completed
                </p>
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: 800,
                color: catPercent === 100 ? C.success : C.primary,
              }}>
                {catPercent}%
              </div>
            </div>

            {/* Category Progress Bar */}
            <div style={{
              height: 4,
              background: C.border,
              borderRadius: 2,
              overflow: "hidden",
              marginBottom: 16,
            }}>
              <div style={{
                height: "100%",
                width: `${catPercent}%`,
                background: catPercent === 100 ? C.success : C.primary,
                transition: "width 0.3s ease",
              }} />
            </div>

            {/* Tasks */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {catTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onToggle(task.id)}
                  style={{
                    padding: "14px 16px",
                    background: completed.has(task.id) ? `${C.success}15` : C.surface,
                    border: `1px solid ${completed.has(task.id) ? C.success : C.border}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    opacity: completed.has(task.id) ? 0.7 : 1,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = completed.has(task.id) ? `${C.success}25` : C.hoverBg;
                    e.currentTarget.style.borderColor = completed.has(task.id) ? C.success : C.primary;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = completed.has(task.id) ? `${C.success}15` : C.surface;
                    e.currentTarget.style.borderColor = completed.has(task.id) ? C.success : C.border;
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: completed.has(task.id) ? C.success : "transparent",
                    border: `2px solid ${completed.has(task.id) ? C.success : C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "white",
                    flexShrink: 0,
                  }}>
                    {completed.has(task.id) && "✓"}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.textPrimary,
                      marginBottom: 2,
                      textDecoration: completed.has(task.id) ? "line-through" : "none",
                    }}>
                      {task.icon} {task.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
