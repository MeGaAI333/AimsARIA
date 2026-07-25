import { Link, useNavigate, useParams } from "react-router-dom";
import { useProject, fmtMoney } from "../context/ProjectContext.jsx";
import DocHeader from "../components/DocHeader.jsx";
import ProjectScope from "../components/ProjectScope.jsx";

export default function Invoice() {
  const { id } = useParams();
  const { getProject, setStatus } = useProject();
  const navigate = useNavigate();
  const project = getProject(id);

  if (!project) return <NotFound />;
  const { snapshot, pricing, payments, status } = project;
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, pricing.subtotal - paidTotal);

  if (status === "draft" || status === "sent") {
    return (
      <div className="container-narrow">
        <div className="card card-pad empty-state">
          <p>This project's quote hasn't been accepted yet.</p>
          <Link to={`/quote/${project.id}`} className="btn btn-primary">Go to Quote Acceptance</Link>
        </div>
      </div>
    );
  }

  function generateInvoice() {
    setStatus(project.id, "invoiced");
  }

  return (
    <div className="container-narrow">
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Link to={`/quote/${project.id}`} className="btn btn-ghost btn-sm">← Back to Quote</Link>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Print / Save PDF</button>
          <Link to={`/payments/${project.id}`} className="btn btn-outline btn-sm">Payments Ledger →</Link>
        </div>
      </div>

      <div className="card card-pad">
        <DocHeader project={project} docLabel="Invoice" docNumber={`INV-${project.id}`} />
        <ProjectScope snapshot={snapshot} />

        <table className="doc-table" style={{ marginBottom: 18 }}>
          <thead>
            <tr>
              <th>Line item</th>
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

        <div className="kv"><span className="k">Invoice total</span><span className="v">{fmtMoney(pricing.subtotal)}</span></div>
        <div className="kv"><span className="k">Deposit ({Math.round(pricing.depositPct * 100)}%) due at signing</span><span className="v">{fmtMoney(pricing.deposit)}</span></div>
        <div className="kv"><span className="k">Paid to date</span><span className="v">{fmtMoney(paidTotal)}</span></div>
        <div className="total-row">
          <span>Balance Due</span>
          <span>{fmtMoney(remaining)}</span>
        </div>

        <div className="no-print" style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          {status === "accepted" && (
            <button className="btn btn-primary" onClick={generateInvoice}>Generate Invoice</button>
          )}
          {status !== "accepted" && (
            <button className="btn btn-gold" onClick={() => navigate(`/payments/${project.id}`)}>Record a Payment →</button>
          )}
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
