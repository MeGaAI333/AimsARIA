import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectAPI, materialAPI, quoteAPI } from '../services/api';
import { FenceVisualizer } from '../components/FenceVisualizer';
import type { Project, Material, FenceSpecification, Quote } from '../../../shared/types';

const CustomerPortal: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [specification, setSpecification] = useState<FenceSpecification | null>(null);
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      const [projectRes, materialsRes, quoteRes] = await Promise.all([
        projectAPI.getById(projectId!),
        materialAPI.getAll(),
        quoteAPI.getByProjectId(projectId!).catch(() => null),
      ]);

      const proj = projectRes.data;
      setProject(proj);
      setMaterials(materialsRes.data);
      setSpecification(proj.specification);

      const mat = materialsRes.data.find((m) => m.id === proj.specification.materialId);
      if (mat) {
        setMaterial(mat);
      }

      if (quoteRes?.data) {
        setQuote(quoteRes.data);
      }
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/');
    }
  };

  const handleMaterialChange = (materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    if (mat) {
      setMaterial(mat);
      setSpecification((prev) =>
        prev ? { ...prev, materialId, color: mat.colors[0] || '' } : null
      );
    }
  };

  const handleColorChange = (color: string) => {
    setSpecification((prev) => (prev ? { ...prev, color } : null));
  };

  const handleDimensionChange = (field: keyof FenceSpecification, value: any) => {
    setSpecification((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  if (!project || !specification) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  const perimeter = (specification.length + specification.width) * 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Your Fence Design Preview</h1>
          <p className="text-sm text-gray-600">Customize your project and see it in real-time</p>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">3D Design Preview</h2>
              {material && (
                <FenceVisualizer
                  specification={specification}
                  material={material}
                  height={500}
                />
              )}
              <p className="text-xs text-gray-500 mt-2">
                Drag to rotate • Scroll to zoom
              </p>
            </div>
          </div>

          {/* Customization Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Customize Your Design</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Material Type
                  </label>
                  <select
                    value={specification.materialId}
                    onChange={(e) => handleMaterialChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (${m.costPerLinearFoot.toFixed(2)}/ft)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{material?.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Color
                  </label>
                  <select
                    value={specification.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {material?.colors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>

                <hr className="my-4" />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Height (ft)
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="8"
                      step="0.5"
                      value={specification.height}
                      onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Length (ft)
                    </label>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={specification.length}
                      onChange={(e) =>
                        handleDimensionChange('length', parseFloat(e.target.value))
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Width (ft)
                    </label>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={specification.width}
                      onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Perimeter
                    </label>
                    <input
                      type="number"
                      disabled
                      value={perimeter}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm bg-gray-50"
                    />
                  </div>
                </div>

                <hr className="my-4" />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Gates
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={specification.gateCount}
                    onChange={(e) =>
                      handleDimensionChange('gateCount', parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {specification.gateCount > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gate Width (ft)
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      step="0.5"
                      value={specification.gateWidth}
                      onChange={(e) =>
                        handleDimensionChange('gateWidth', parseFloat(e.target.value))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Quote Info */}
            {quote && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-lg p-6 border border-green-200">
                <h3 className="text-lg font-bold mb-3 text-gray-800">Current Estimate</h3>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Material:</span>
                    <span className="font-semibold">
                      ${quote.pricing.materialCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor:</span>
                    <span className="font-semibold">${quote.pricing.laborCost.toFixed(2)}</span>
                  </div>
                  {quote.pricing.accessoriesCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accessories:</span>
                      <span className="font-semibold">
                        ${quote.pricing.accessoriesCost.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">${quote.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-semibold">${quote.pricing.tax.toFixed(2)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-800">Total:</span>
                    <span className="text-green-600">${quote.pricing.total.toFixed(2)}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-600">
                  Quote valid until: {new Date(quote.expiresAt).toLocaleDateString()}
                </p>

                {quote.pdfPath && (
                  <a
                    href={`/api/${quote.pdfPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-lg font-semibold transition mt-3"
                  >
                    Download Quote
                  </a>
                )}
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Contact Information</h4>
              <p className="text-sm text-blue-800">
                <strong>Name:</strong> {project.clientName}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> {project.clientEmail}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Phone:</strong> {project.clientPhone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
