import { Link } from "react-router-dom";
import { MATERIALS } from "../data/pricing.js";

export default function Landing() {
  return (
    <div>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="badge badge-accepted" style={{ marginBottom: 16 }}>Wireframe Preview</div>
            <h1 style={{ fontSize: 40, lineHeight: 1.15, marginBottom: 16 }}>
              See your new fence before we ever break ground.
            </h1>
            <p className="soft" style={{ fontSize: 16, marginBottom: 28, maxWidth: 480 }}>
              Pick your material, height, gates, and accessories, draw your property line, and get a
              real-time visual preview and price estimate — then request a proposal straight from
              Galloway Fence &amp; Gate.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Link to="/estimate/measurements" className="btn btn-primary" style={{ padding: "14px 26px", fontSize: 14 }}>
                Build My Fence →
              </Link>
              <Link to="/admin" className="btn btn-outline" style={{ padding: "14px 26px", fontSize: 14 }}>
                Business Dashboard
              </Link>
            </div>
          </div>
          <div className="card card-pad">
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 14 }}>
              How it works
            </div>
            {[
              ["1", "Draw your property line & set linear footage"],
              ["2", "Choose your fence material, height & finish"],
              ["3", "Add gates and accessories"],
              ["4", "Get an instant visual + price estimate"],
              ["5", "Request your proposal, quote & invoice"],
            ].map(([n, t]) => (
              <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                <div
                  style={{
                    width: 26, height: 26, borderRadius: "50%", background: "var(--brand)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}
                >
                  {n}
                </div>
                <div style={{ fontSize: 13.5, paddingTop: 3 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        <h2 style={{ fontSize: 24, marginBottom: 6 }}>Fencing we install</h2>
        <p className="muted" style={{ marginBottom: 24 }}>Every material below is fully configurable in the estimator.</p>
        <div className="grid-3">
          {MATERIALS.map((m) => (
            <div className="card card-pad" key={m.id}>
              <div className="material-swatch" style={{ background: m.swatch }} />
              <h3 style={{ fontSize: 15, marginBottom: 6 }}>{m.name}</h3>
              <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>{m.blurb}</p>
              <div className="soft" style={{ fontSize: 12.5, fontWeight: 700 }}>from ${m.ratePerFt}/ft (est.)</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
