import { Routes, Route } from "react-router-dom";
import { ProjectProvider } from "./context/ProjectContext.jsx";
import NavBar from "./components/NavBar.jsx";
import Landing from "./pages/Landing.jsx";
import EstimatorLayout from "./pages/EstimatorLayout.jsx";
import StepMeasurements from "./pages/StepMeasurements.jsx";
import StepStyle from "./pages/StepStyle.jsx";
import StepGates from "./pages/StepGates.jsx";
import StepAccessories from "./pages/StepAccessories.jsx";
import StepReview from "./pages/StepReview.jsx";
import Proposal from "./pages/Proposal.jsx";
import QuoteAccept from "./pages/QuoteAccept.jsx";
import Invoice from "./pages/Invoice.jsx";
import Payments from "./pages/Payments.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {
  return (
    <ProjectProvider>
      <div className="app-shell">
        <NavBar />
        <div className="main">
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/estimate" element={<EstimatorLayout />}>
              <Route path="measurements" element={<StepMeasurements />} />
              <Route path="style" element={<StepStyle />} />
              <Route path="gates" element={<StepGates />} />
              <Route path="accessories" element={<StepAccessories />} />
              <Route path="review" element={<StepReview />} />
            </Route>

            <Route path="/proposal/:id" element={<Proposal />} />
            <Route path="/quote/:id" element={<QuoteAccept />} />
            <Route path="/invoice/:id" element={<Invoice />} />
            <Route path="/payments/:id" element={<Payments />} />

            <Route path="/admin" element={<AdminDashboard />} />

            <Route path="*" element={<Landing />} />
          </Routes>
        </div>
      </div>
    </ProjectProvider>
  );
}
