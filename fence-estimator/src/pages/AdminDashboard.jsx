import { Link } from "react-router-dom";
import { useProject, fmtMoney, STATUS_LABEL } from "../context/ProjectContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { findMaterial } from "../data/pricing.js";

export default function AdminDashboard() {
  const { projects } = useProject();

  const totals = projects.reduce(
    (acc, p) => {
      const paid = p.payments.reduce((s, pay) => s + pay.amount, 0);
      acc.pipeline += p.pricing.subtotal;
      acc.collected += paid;
      if (p.status !== "paid") acc.outstanding += p.pricing.subtotal - paid;
      return acc;
    },
    { pipeline: 0, collected: 0, outstanding: 0 }
  );

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Business Dashboard</h2>
          <p className="muted">Every project submitted through the customer estimator.</p>
        </div>
        <Link to="/estimate/measurements" className="btn btn-primary">+ New Project (test flow)</Link>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        <StatCard label="Total Pipeline" value={fmtMoney(totals.pipeline)} />
        <StatCard label="Collected" value={fmtMoney(totals.collected)} tone="success" />
        <StatCard label="Outstanding Balance" value={fmtMoney(totals.outstanding)} tone="warning" />
      </div>

      <div className="card">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects yet. Run through the customer flow to create one.</p>
            <Link to="/estimate/measurements" className="btn btn-primary">Build a Fence →</Link>
          </div>
        ) : (
          <table className="doc-table" style={{ padding: 8 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>Project</th>
                <th>Customer</th>
                <th>Fence</th>
                <th className="num">Total</th>
                <th>Status</th>
                <th style={{ paddingRight: 16 }}></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const material = findMaterial(p.snapshot.materialId);
                return (
                  <tr key={p.id}>
                    <td style={{ paddingLeft: 16, fontWeight: 700 }}>{p.id}</td>
                    <td>
                      <div>{p.snapshot.customer.name || "—"}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{p.snapshot.customer.email}</div>
                    </td>
                    <td className="muted">{material?.name} · {p.snapshot.line.linearFt} ft</td>
                    <td className="num">{fmtMoney(p.pricing.subtotal)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td style={{ paddingRight: 16, textAlign: "right" }}>
                      <RowActions project={p} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function RowActions({ project }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
      <Link to={`/proposal/${project.id}`} className="btn btn-outline btn-sm">Proposal</Link>
      <Link to={`/invoice/${project.id}`} className="btn btn-outline btn-sm">Invoice</Link>
      <Link to={`/payments/${project.id}`} className="btn btn-outline btn-sm">Ledger</Link>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const color = tone === "success" ? "var(--success)" : tone === "warning" ? "var(--warning)" : "var(--ink)";
  return (
    <div className="card card-pad">
      <div className="muted" style={{ fontSize: 11.5, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

export { STATUS_LABEL };
