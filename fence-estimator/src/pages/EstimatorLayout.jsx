import { Outlet, useLocation } from "react-router-dom";
import Stepper from "../components/Stepper.jsx";
import FencePreview from "../components/FencePreview.jsx";
import { useProject } from "../context/ProjectContext.jsx";

export default function EstimatorLayout() {
  const { draft, draftPricing } = useProject();
  const location = useLocation();

  return (
    <div className="container">
      <Stepper current={location.pathname} />
      <div className="estimator-layout">
        <div className="card card-pad">
          <Outlet />
        </div>
        <FencePreview draft={draft} pricing={draftPricing} />
      </div>
    </div>
  );
}
