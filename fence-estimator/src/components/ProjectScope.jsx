import { findMaterial } from "../data/pricing.js";

export default function ProjectScope({ snapshot }) {
  const material = findMaterial(snapshot.materialId);
  return (
    <div className="grid-2" style={{ marginBottom: 20 }}>
      <div>
        <div className="field-label">Bill to</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{snapshot.customer.name}</div>
        <div className="muted" style={{ fontSize: 13 }}>{snapshot.customer.email}</div>
        <div className="muted" style={{ fontSize: 13 }}>{snapshot.customer.phone}</div>
      </div>
      <div>
        <div className="field-label">Project site</div>
        <div style={{ fontSize: 13.5 }}>{snapshot.customer.address || "—"}</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
          {material?.name} · {snapshot.height} ft · {snapshot.finish}
        </div>
        <div className="muted" style={{ fontSize: 13 }}>{snapshot.line.linearFt} linear ft · {snapshot.gates.length} gate(s)</div>
      </div>
    </div>
  );
}
