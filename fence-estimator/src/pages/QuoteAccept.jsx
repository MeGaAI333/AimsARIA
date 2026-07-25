import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProject, fmtMoney } from "../context/ProjectContext.jsx";
import DocHeader from "../components/DocHeader.jsx";
import ProjectScope from "../components/ProjectScope.jsx";

export default function QuoteAccept() {
  const { id } = useParams();
  const { getProject, updateProject, setStatus } = useProject();
  const navigate = useNavigate();
  const project = getProject(id);
  const [signature, setSignature] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");

  if (!project) return <NotFound />;

  const alreadyAccepted = !!project.signature;
  const { snapshot, pricing } = project;

  function handleAccept() {
    if (!signature.trim() || !agree) {
      setError("Type your full legal name and confirm you agree to the terms.");
      return;
    }
    updateProject(project.id, { signature: { name: signature.trim(), signedAt: new Date().toISOString() } });
    setStatus(project.id, "accepted");
    navigate(`/invoice/${project.id}`);
  }

  return (
    <div className="container-narrow">
      <div className="no-print" style={{ marginBottom: 16 }}>
        <Link to={`/proposal/${project.id}`} className="btn btn-ghost btn-sm">← Back to Proposal</Link>
      </div>

      <div className="card card-pad">
        <DocHeader project={project} docLabel="Quote — Customer Acceptance" docNumber={project.id} />
        <ProjectScope snapshot={snapshot} />

        <div className="kv"><span className="k">Estimated project total</span><span className="v">{fmtMoney(pricing.subtotal)}</span></div>
        <div className="kv"><span className="k">Deposit due to schedule ({Math.round(pricing.depositPct * 100)}%)</span><span className="v">{fmtMoney(pricing.deposit)}</span></div>
        <div className="kv"><span className="k">Balance due at completion</span><span className="v">{fmtMoney(pricing.balance)}</span></div>

        <hr className="hr" />

        {alreadyAccepted ? (
          <div>
            <div className="badge badge-accepted" style={{ marginBottom: 12 }}>Signed</div>
            <p className="soft" style={{ fontSize: 13.5 }}>
              Accepted by <strong>{project.signature.name}</strong> on{" "}
              {new Date(project.signature.signedAt).toLocaleString()}.
            </p>
            <div className="no-print" style={{ marginTop: 16 }}>
              <button className="btn btn-gold" onClick={() => navigate(`/invoice/${project.id}`)}>Continue to Invoice →</button>
            </div>
          </div>
        ) : (
          <div className="no-print">
            <p className="soft" style={{ fontSize: 13.5, marginBottom: 16 }}>
              By signing below, you approve this quote and authorize Galloway Fence &amp; Gate to schedule
              your installation once the deposit is received.
            </p>
            <div className="field" style={{ maxWidth: 340 }}>
              <label className="field-label">Type your full name to sign</label>
              <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Full legal name" />
            </div>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, marginBottom: 16, cursor: "pointer" }}>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
              I agree to the scope, pricing, and deposit terms above. (Placeholder e-signature for wireframe purposes.)
            </label>
            {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-gold" onClick={handleAccept}>Accept &amp; Sign Quote →</button>
          </div>
        )}
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
