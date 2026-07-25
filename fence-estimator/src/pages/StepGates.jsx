import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext.jsx";
import { GATE_TYPES, findGateType } from "../data/pricing.js";
import { fmtMoney } from "../context/ProjectContext.jsx";

export default function StepGates() {
  const { draft, addGate, removeGate } = useProject();
  const navigate = useNavigate();

  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>Step 3 — Gates</h2>
      <p className="muted" style={{ marginBottom: 22 }}>
        Add every gate you need. Exact placement along the fence line is confirmed at the on-site
        measurement — for now just tell us how many and what kind.
      </p>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {GATE_TYPES.map((g) => (
          <div key={g.id} className="card card-pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{g.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{g.widthFt} ft wide · {fmtMoney(g.basePrice)} est.</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => addGate(g.id)}>+ Add</button>
          </div>
        ))}
      </div>

      <div>
        <div className="field-label" style={{ marginBottom: 10 }}>Gates on this project ({draft.gates.length})</div>
        {draft.gates.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No gates added yet — that's fine if you don't need one.</div>}
        {draft.gates.map((g) => {
          const type = findGateType(g.typeId);
          return (
            <div className="gate-chip" key={g.id}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{type?.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="muted" style={{ fontSize: 12.5 }}>{fmtMoney(type?.basePrice)}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => removeGate(g.id)}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button className="btn btn-outline" onClick={() => navigate("/estimate/style")}>← Back</button>
        <button className="btn btn-primary" onClick={() => navigate("/estimate/accessories")}>Next: Accessories →</button>
      </div>
    </div>
  );
}
