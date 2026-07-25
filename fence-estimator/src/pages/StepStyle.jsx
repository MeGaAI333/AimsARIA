import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext.jsx";
import { MATERIALS, findMaterial } from "../data/pricing.js";

export default function StepStyle() {
  const { draft, updateDraft } = useProject();
  const navigate = useNavigate();
  const material = findMaterial(draft.materialId);

  function pickMaterial(m) {
    updateDraft({ materialId: m.id, height: m.heights[0], finish: m.finishes[0] });
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>Step 2 — Fence style</h2>
      <p className="muted" style={{ marginBottom: 22 }}>Choose a material, then set height and finish.</p>

      <div className="grid-3" style={{ marginBottom: 26 }}>
        {MATERIALS.map((m) => (
          <div
            key={m.id}
            className={`material-card ${draft.materialId === m.id ? "selected" : ""}`}
            onClick={() => pickMaterial(m)}
          >
            <div className="material-swatch" style={{ background: m.swatch }} />
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>{m.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>{m.blurb}</div>
            <div className="soft" style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>${m.ratePerFt}/ft (est.)</div>
          </div>
        ))}
      </div>

      {material && (
        <>
          <div className="field">
            <label className="field-label">Height</label>
            <div className="pill-select">
              {material.heights.map((h) => (
                <button key={h} className={draft.height === h ? "active" : ""} onClick={() => updateDraft({ height: h })}>
                  {h} ft
                </button>
              ))}
            </div>
          </div>

          <div className="field" style={{ maxWidth: 320 }}>
            <label className="field-label">Finish / Color</label>
            <select value={draft.finish} onChange={(e) => updateDraft({ finish: e.target.value })}>
              {material.finishes.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button className="btn btn-outline" onClick={() => navigate("/estimate/measurements")}>← Back</button>
        <button className="btn btn-primary" onClick={() => navigate("/estimate/gates")}>Next: Gates →</button>
      </div>
    </div>
  );
}
