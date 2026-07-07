import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEstimatorStore } from './store/estimatorStore';
import { materialAPI } from './services/api';
import AdminDashboard from './pages/AdminDashboard';
import CustomerPortal from './pages/CustomerPortal';
import ProjectDetail from './pages/ProjectDetail';
import Toaster from 'react-hot-toast';

function App() {
  const setMaterials = useEstimatorStore((state) => state.setMaterials);

  useEffect(() => {
    // Load materials on app start
    materialAPI.getAll().then((res) => {
      setMaterials(res.data);
    });
  }, [setMaterials]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/project/:id" element={<ProjectDetail />} />
        <Route path="/customer/:projectId" element={<CustomerPortal />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
