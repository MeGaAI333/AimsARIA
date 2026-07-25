import { findMaterial, findGateType } from "../data/pricing.js";
import { fmtMoney } from "../context/ProjectContext.jsx";

const VB_W = 320;
const VB_H = 200;

export default function FencePreview({ draft, pricing, compact }) {
  const material = findMaterial(draft.materialId);
  const points = draft.line?.points || [];
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const color = material?.swatch || "#2f5233";

  const gateMarkers = [];
  if (points.length > 1 && draft.gates?.length) {
    const segCount = points.length - 1;
    draft.gates.forEach((g, i) => {
      const segIdx = i % segCount;
      const a = points[segIdx];
      const b = points[segIdx + 1];
      const t = 0.5;
      gateMarkers.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, id: g.id });
    });
  }

  return (
    <div className="card card-pad preview-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15 }}>Live Preview</h3>
        <span className="muted" style={{ fontSize: 11.5 }}>top-down, not to exact scale</span>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "#fbfaf6" }}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <rect x={0} y={0} width={VB_W} height={VB_H} fill="#fbfaf6" />
          {points.length === 0 && (
            <text x={VB_W / 2} y={VB_H / 2} textAnchor="middle" fontSize="9" fill="#9aa08c">
              Draw your property line to see it here
            </text>
          )}
          {points.length > 1 && (
            <path d={pathD} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3} fill="#fff" stroke={color} strokeWidth={2} />
          ))}
          {gateMarkers.map((g) => (
            <g key={g.id}>
              <rect x={g.x - 6} y={g.y - 4} width={12} height={8} fill="#fff" stroke="#b8863b" strokeWidth={2} rx={2} />
            </g>
          ))}
        </svg>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="kv">
          <span className="k">Material</span>
          <span className="v">{material ? material.name : "—"}</span>
        </div>
        <div className="kv">
          <span className="k">Height</span>
          <span className="v">{draft.height ? `${draft.height} ft` : "—"}</span>
        </div>
        <div className="kv">
          <span className="k">Finish / Color</span>
          <span className="v">{draft.finish || "—"}</span>
        </div>
        <div className="kv">
          <span className="k">Linear footage</span>
          <span className="v">{draft.line?.linearFt ? `${draft.line.linearFt} ft` : "—"}</span>
        </div>
        <div className="kv">
          <span className="k">Gates</span>
          <span className="v">{draft.gates?.length || 0}</span>
        </div>
      </div>

      {!compact && (
        <>
          <hr className="hr" />
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>
            ESTIMATED PROJECT COST
          </div>
          {pricing.lines.length === 0 && <div className="muted" style={{ fontSize: 12.5 }}>Add fencing details to see pricing.</div>}
          {pricing.lines.map((l, i) => (
            <div className="kv" key={i}>
              <span className="k">{l.label}</span>
              <span className="v">{fmtMoney(l.amount)}</span>
            </div>
          ))}
          <div className="total-row">
            <span>Estimated Total</span>
            <span>{fmtMoney(pricing.subtotal)}</span>
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
            Estimate only — final price confirmed after an on-site measurement.
          </div>
        </>
      )}
    </div>
  );
}

export function gateTypeName(typeId) {
  return findGateType(typeId)?.name || typeId;
}
