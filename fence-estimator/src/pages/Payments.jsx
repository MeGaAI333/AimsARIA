import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProject, fmtMoney, round2 } from "../context/ProjectContext.jsx";
import DocHeader from "../components/DocHeader.jsx";

const METHODS = ["Card", "Check", "Cash", "ACH / Bank Transfer"];

export default function Payments() {
  const { id } = useParams();
  const { getProject, addPayment, setStatus } = useProject();
  const project = getProject(id);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(METHODS[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (!project) return <NotFound />;
  const { pricing, payments, status } = project;
  const paidTotal = round2(payments.reduce((s, p) => s + p.amount, 0));
  const balance = round2(pricing.subtotal - paidTotal);

  function handleAddPayment() {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError("Enter a payment amount greater than $0.");
      return;
    }
    addPayment(project.id, { amount: round2(amt), method, note, date: new Date().toISOString() });
    const newBalance = round2(pricing.subtotal - (paidTotal + amt));
    if (newBalance <= 0) setStatus(project.id, "paid");
    else if (status === "invoiced") setStatus(project.id, "invoiced");
    setAmount("");
    setNote("");
    setError("");
  }

  return (
    <div className="container-narrow">
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Link to={`/invoice/${project.id}`} className="btn btn-ghost btn-sm">← Back to Invoice</Link>
        <Link to="/admin" className="btn btn-outline btn-sm">Business Dashboard</Link>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <DocHeader project={project} docLabel="Payments Ledger" docNumber={`LDG-${project.id}`} />

        <div className="kv"><span className="k">Project total</span><span className="v">{fmtMoney(pricing.subtotal)}</span></div>
        <div className="kv"><span className="k">Total paid</span><span className="v">{fmtMoney(paidTotal)}</span></div>
        <div className="total-row">
          <span>Balance Due</span>
          <span>{fmtMoney(Math.max(0, balance))}</span>
        </div>

        <hr className="hr" />

        <table className="doc-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Method</th>
              <th>Note</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr><td colSpan={4} className="muted">No payments recorded yet.</td></tr>
            )}
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.date).toLocaleDateString()}</td>
                <td>{p.method}</td>
                <td className="muted">{p.note || "—"}</td>
                <td className="num">{fmtMoney(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {status !== "draft" && status !== "sent" && balance > 0 && (
        <div className="card card-pad no-print">
          <div className="field-label" style={{ marginBottom: 12 }}>Record a payment</div>
          <div className="field-row">
            <div className="field">
              <label className="field-label">Amount</label>
              <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`e.g. ${pricing.deposit}`} />
            </div>
            <div className="field">
              <label className="field-label">Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field-label">Note (optional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Deposit, final payment" />
          </div>
          {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{error}</div>}
          <button className="btn btn-primary" onClick={handleAddPayment}>Record Payment</button>
        </div>
      )}

      {balance <= 0 && payments.length > 0 && (
        <div className="card card-pad" style={{ textAlign: "center" }}>
          <div className="badge badge-paid" style={{ marginBottom: 8 }}>Paid in Full</div>
          <p className="muted" style={{ fontSize: 13 }}>This project is fully paid — nice work.</p>
        </div>
      )}
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
