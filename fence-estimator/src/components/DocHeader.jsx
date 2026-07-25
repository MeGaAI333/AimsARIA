import StatusBadge from "./StatusBadge.jsx";

export default function DocHeader({ project, docLabel, docNumber }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <div className="brand-mark" style={{ marginBottom: 10 }}>GF</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17 }}>Galloway Fence &amp; Gate</div>
        <div className="muted" style={{ fontSize: 12.5 }}>Tallahassee, FL · (850) 555-0142 · office@gallowayfenceandgate.com</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>{docLabel}</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{docNumber}</div>
        <StatusBadge status={project.status} />
      </div>
    </div>
  );
}
