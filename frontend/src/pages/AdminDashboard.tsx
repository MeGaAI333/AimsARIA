import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectAPI, materialAPI } from '../services/api';
import { useEstimatorStore } from '../store/estimatorStore';
import type { Project, FenceSpecification } from '../../../shared/types';

const AdminDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const materials = useEstimatorStore((state) => state.materials);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    address: '',
    materialId: '',
    color: '',
    height: '4',
    length: '50',
    width: '50',
    gateCount: '1',
    gateWidth: '4',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data);
    } catch (error) {
      toast.error('Failed to load projects');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.materialId || !formData.color) {
        toast.error('Please select material and color');
        return;
      }

      const specification: FenceSpecification = {
        materialId: formData.materialId,
        color: formData.color,
        height: parseFloat(formData.height),
        length: parseFloat(formData.length),
        width: parseFloat(formData.width),
        accessories: [],
        gateCount: parseInt(formData.gateCount),
        gateWidth: parseFloat(formData.gateWidth),
      };

      const newProject = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        address: formData.address,
        specification,
        status: 'draft' as const,
      };

      const res = await projectAPI.create(newProject as any);
      setProjects([...projects, res.data]);
      setFormData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        address: '',
        materialId: '',
        color: '',
        height: '4',
        length: '50',
        width: '50',
        gateCount: '1',
        gateWidth: '4',
      });
      setShowNewProjectForm(false);
      toast.success('Project created successfully');
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedMaterial = () => {
    return materials.find((m) => m.id === formData.materialId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Fence & Gate Estimator</h1>
          <p className="text-sm text-gray-600">Admin Dashboard</p>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Projects</h2>
          <button
            onClick={() => setShowNewProjectForm(!showNewProjectForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            {showNewProjectForm ? 'Cancel' : '+ New Project'}
          </button>
        </div>

        {showNewProjectForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Create New Project</h3>

            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <hr className="my-6" />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Material Type *
                  </label>
                  <select
                    required
                    value={formData.materialId}
                    onChange={(e) =>
                      setFormData({ ...formData, materialId: e.target.value, color: '' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select material...</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color *</label>
                  <select
                    required
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    disabled={!formData.materialId}
                  >
                    <option value="">Select color...</option>
                    {getSelectedMaterial()?.colors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Height (feet) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Length (linear feet) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Width (linear feet) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gate Count
                  </label>
                  <input
                    type="number"
                    value={formData.gateCount}
                    onChange={(e) => setFormData({ ...formData, gateCount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {parseInt(formData.gateCount) > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gate Width (feet)
                  </label>
                  <input
                    type="number"
                    value={formData.gateWidth}
                    onChange={(e) => setFormData({ ...formData, gateWidth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProjectForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No projects yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} to={`/admin/project/${project.id}`}>
                <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition p-6 cursor-pointer h-full">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{project.clientName}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Email:</strong> {project.clientEmail}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Phone:</strong> {project.clientPhone}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Address:</strong> {project.address}
                  </p>
                  <div className="text-sm text-gray-700 mb-3">
                    <p>
                      <strong>Material:</strong> {materials.find((m) => m.id === project.specification.materialId)?.name}
                    </p>
                    <p>
                      <strong>Dimensions:</strong> {project.specification.length}' x{' '}
                      {project.specification.width}' x {project.specification.height}H
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.status === 'quoted'
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {project.status}
                    </span>
                    <span className="text-blue-600 font-semibold">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
