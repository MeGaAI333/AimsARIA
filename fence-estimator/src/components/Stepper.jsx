import { Link } from "react-router-dom";

const STEPS = [
  { path: "/estimate/measurements", label: "Property" },
  { path: "/estimate/style", label: "Fence Style" },
  { path: "/estimate/gates", label: "Gates" },
  { path: "/estimate/accessories", label: "Accessories" },
  { path: "/estimate/review", label: "Review" },
];

export default function Stepper({ current }) {
  const idx = STEPS.findIndex((s) => s.path === current);
  return (
    <div className="stepper">
      {STEPS.map((s, i) => {
        const state = i < idx ? "done" : i === idx ? "current" : "";
        return (
          <span key={s.path} style={{ display: "flex", alignItems: "center" }}>
            <Link to={s.path} className={`step-pill ${state}`}>
              <span className="dot">{i < idx ? "✓" : i + 1}</span>
              {s.label}
            </Link>
            {i < STEPS.length - 1 && <span className="step-connector" />}
          </span>
        );
      })}
    </div>
  );
}

export { STEPS };
