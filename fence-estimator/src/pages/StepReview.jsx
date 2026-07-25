import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject, fmtMoney } from "../context/ProjectContext.jsx";

export default function StepReview() {
  const { draft, updateDraft, draftPricing, saveProject, resetDraft } = useProject();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  function handleCustomerField(field, value) {
    updateDraft({ customer: { ...draft.customer, [field]: value } });
  }

  function handleSubmit() {
    if (!draft.customer.name || !draft.customer.email) {
      setError("Name and email are required so we can send your proposal.");
      return;
    }
    const project = saveProject();
    navigate(`/proposal/${project.id}`);
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>Step 5 — Review &amp; request your proposal</h2>
      <p className="muted" style={{ marginBottom: 22 }}>
        Double check everything below, add your contact info, and we'll generate your proposal.
      </p>

      <table className="doc-table" style={{ marginBottom: 20 }}>
        <thead>
          <tr>
            <th>Item</th>
            <th className="num">Qty</th>
            <th className="num">Rate</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {draftPricing.lines.map((l, i) => (
            <tr key={i}>
              <td>{l.label}</td>
              <td className="num">{l.qty}</td>
              <td className="num">{typeof l.rate === "number" ? fmtMoney(l.rate) : l.rate}</td>
              <td className="num">{fmtMoney(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="total-row" style={{ marginBottom: 26 }}>
        <span>Estimated Total</span>
        <span>{fmtMoney(draftPricing.subtotal)}</span>
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label">Full name</label>
          <input type="text" value={draft.customer.name} onChange={(e) => handleCustomerField("name", e.target.value)} placeholder="Jane Homeowner" />
        </div>
        <div className="field">
          <label className="field-label">Email</label>
          <input type="email" value={draft.customer.email} onChange={(e) => handleCustomerField("email", e.target.value)} placeholder="jane@email.com" />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label className="field-label">Phone</label>
          <input type="tel" value={draft.customer.phone} onChange={(e) => handleCustomerField("phone", e.target.value)} placeholder="(850) 555-0100" />
        </div>
        <div className="field">
          <label className="field-label">Project address</label>
          <input type="text" value={draft.customer.address} onChange={(e) => handleCustomerField("address", e.target.value)} placeholder="123 Live Oak Ln, Tallahassee, FL" />
        </div>
      </div>

      {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <button className="btn btn-outline" onClick={() => navigate("/estimate/accessories")}>← Back</button>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => { resetDraft(); navigate("/"); }}>Start over</button>
          <button className="btn btn-gold" onClick={handleSubmit}>Request My Proposal →</button>
        </div>
      </div>
    </div>
  );
}
