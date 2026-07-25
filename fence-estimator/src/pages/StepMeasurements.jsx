import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext.jsx";
import FenceLineDrawer, { totalLength } from "../components/FenceLineDrawer.jsx";
import { findMaterial } from "../data/pricing.js";

export default function StepMeasurements() {
  const { draft, updateDraft } = useProject();
  const navigate = useNavigate();
  const material = findMaterial(draft.materialId);

  function handlePointsChange(points) {
    const linearFt = Math.round(totalLength(points));
    updateDraft({ line: { points, linearFt } });
  }

  function handleManualFt(e) {
    const linearFt = Number(e.target.value) || 0;
    updateDraft({ line: { points: draft.line.points, linearFt } });
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>Step 1 — Your property line</h2>
      <p className="muted" style={{ marginBottom: 22 }}>
        Click to drop corner points along the run you want fenced. We'll total the linear footage
        automatically — or just type it in below if you already know it.
      </p>

      <FenceLineDrawer points={draft.line.points} onChange={handlePointsChange} color={material?.swatch} />

      <div className="field" style={{ marginTop: 22, maxWidth: 260 }}>
        <label className="field-label">Total linear footage</label>
        <input type="number" min="0" value={draft.line.linearFt || ""} onChange={handleManualFt} placeholder="e.g. 180" />
      </div>

      <div className="field">
        <label className="field-label">Anything we should know about the site?</label>
        <textarea
          rows={3}
          placeholder="Slopes, gate swing direction, existing fence to remove, pets, HOA rules, etc."
          value={draft.notes}
          onChange={(e) => updateDraft({ notes: e.target.value })}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button className="btn btn-primary" disabled={!draft.line.linearFt} onClick={() => navigate("/estimate/style")}>
          Next: Fence Style →
        </button>
      </div>
    </div>
  );
}
