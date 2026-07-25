import { useRef } from "react";

const VB_W = 320;
const VB_H = 200;
const GRID = 20;

function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function totalLength(points) {
  let sum = 0;
  for (let i = 1; i < points.length; i++) sum += dist(points[i - 1], points[i]);
  return sum;
}

export default function FenceLineDrawer({ points, onChange, color }) {
  const svgRef = useRef(null);

  function svgPoint(evt) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.max(0, Math.min(VB_W, Math.round(local.x))),
      y: Math.max(0, Math.min(VB_H, Math.round(local.y))),
    };
  }

  function handleClick(evt) {
    const p = svgPoint(evt);
    onChange([...points, p]);
  }

  function undo() {
    onChange(points.slice(0, -1));
  }

  function clear() {
    onChange([]);
  }

  const gridLines = [];
  for (let x = 0; x <= VB_W; x += GRID) gridLines.push({ x1: x, y1: 0, x2: x, y2: VB_H });
  for (let y = 0; y <= VB_H; y += GRID) gridLines.push({ x1: 0, y1: y, x2: VB_W, y2: y });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const total = totalLength(points);

  return (
    <div>
      <div
        style={{
          border: "1px solid var(--border-strong)",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fbfaf6",
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
          onClick={handleClick}
        >
          {gridLines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#e7e3d5" strokeWidth={1} />
          ))}
          {points.length > 1 && (
            <path d={pathD} fill="none" stroke={color || "#2f5233"} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill="#fff" stroke={color || "#2f5233"} strokeWidth={2.5} />
            </g>
          ))}
          {points.length === 0 && (
            <text x={VB_W / 2} y={VB_H / 2} textAnchor="middle" fontSize="9" fill="#9aa08c">
              Click to place fence-line corners (1 grid square ≈ 20 ft)
            </text>
          )}
        </svg>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <div className="muted" style={{ fontSize: 12.5 }}>
          {points.length} point{points.length === 1 ? "" : "s"} · ~{Math.round(total)} linear ft
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={undo} disabled={!points.length}>
            Undo point
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={clear} disabled={!points.length}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export { totalLength };
