import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext.jsx";
import { ACCESSORIES } from "../data/pricing.js";

export default function StepAccessories() {
  const { draft, updateDraft, toggleAccessory } = useProject();
  const navigate = useNavigate();

  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>Step 4 — Accessories</h2>
      <p className="muted" style={{ marginBottom: 22 }}>Optional add-ons for your project.</p>

      {ACCESSORIES.map((a) => {
        const checked = draft.accessories.includes(a.id);
        return (
          <div key={a.id} className={`checkbox-row ${checked ? "checked" : ""}`} onClick={() => toggleAccessory(a.id)}>
            <input type="checkbox" checked={checked} readOnly />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{a.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>${a.price} {a.unit}</div>
            </div>
            {a.id === "solar-lights" && checked && (
              <input
                type="number"
                min="1"
                style={{ width: 70 }}
                value={draft.solarLightQty}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateDraft({ solarLightQty: Number(e.target.value) || 0 })}
              />
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button className="btn btn-outline" onClick={() => navigate("/estimate/gates")}>← Back</button>
        <button className="btn btn-primary" onClick={() => navigate("/estimate/review")}>Next: Review →</button>
      </div>
    </div>
  );
}
