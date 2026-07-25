import { Link, useNavigate, useParams } from "react-router-dom";
import { useProject, fmtMoney } from "../context/ProjectContext.jsx";
import DocHeader from "../components/DocHeader.jsx";
import ProjectScope from "../components/ProjectScope.jsx";

export default function Proposal() {
  const { id } = useParams();
  const { getProject, setStatus } = useProject();
  const navigate = useNavigate();
  const project = getProject(id);

  if (!project) return <NotFound />;
  const { snapshot, pricing } = project;

  function markSent() {
    setStatus(project.id, "sent");
  }

  return (
    <div className="container-narrow">
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Link to="/admin" className="btn btn-ghost btn-sm">← Business Dashboard</Link>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Print / Save PDF</button>
          {project.status === "draft" && (
            <button className="btn btn-primary btn-sm" onClick={markSent}>Mark Proposal as Sent</button>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <DocHeader project={project} docLabel="Proposal" docNumber={project.id} />
        <ProjectScope snapshot={snapshot} />

        <table className="doc-table" style={{ marginBottom: 18 }}>
          <thead>
            <tr>
              <th>Scope of work</th>
              <th className="num">Qty</th>
              <th className="num">Rate</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {pricing.lines.map((l, i) => (
              <tr key={i}>
                <td>{l.label}</td>
                <td className="num">{l.qty}</td>
                <td className="num">{typeof l.rate === "number" ? fmtMoney(l.rate) : l.rate}</td>
                <td className="num">{fmtMoney(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="total-row" style={{ marginBottom: 20 }}>
          <span>Proposed Total</span>
          <span>{fmtMoney(pricing.subtotal)}</span>
        </div>

        {snapshot.notes && (
          <div style={{ marginBottom: 20 }}>
            <div className="field-label">Site notes</div>
            <div className="soft" style={{ fontSize: 13.5 }}>{snapshot.notes}</div>
          </div>
        )}

        <div className="muted" style={{ fontSize: 12, marginBottom: 20 }}>
          This proposal is a wireframe placeholder — figures are illustrative, not a binding quote. A
          {" "}{Math.round(pricing.depositPct * 100)}% deposit is due upon acceptance, balance due at completion.
          Proposal valid 30 days.
        </div>

        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-gold" onClick={() => navigate(`/quote/${project.id}`)}>
            Continue to Quote Acceptance →
          </button>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="container-narrow">
      <div className="empty-state">
        <p>We couldn't find that project.</p>
        <Link to="/estimate/measurements" className="btn btn-primary">Start a new estimate</Link>
      </div>
    </div>
  );
}
