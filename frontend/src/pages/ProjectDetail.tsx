import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectAPI, quoteAPI, materialAPI } from '../services/api';
import { useEstimatorStore } from '../store/estimatorStore';
import { FenceVisualizer } from '../components/FenceVisualizer';
import type { Project, Material } from '../../../shared/types';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const res = await projectAPI.getById(id!);
      setProject(res.data);

      // Load material
      const materialRes = await materialAPI.getById(res.data.specification.materialId);
      setMaterial(materialRes.data);

      // Load quote if exists
      try {
        const quoteRes = await quoteAPI.getByProjectId(id!);
        setQuote(quoteRes.data);
      } catch {
        // Quote doesn't exist yet
      }
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/admin');
    }
  };

  const handleGenerateQuote = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const res = await quoteAPI.generate(id);
      setQuote(res.data);
      toast.success('Quote generated successfully!');
    } catch (error) {
      toast.error('Failed to generate quote');
    } finally {
      setLoading(false);
    }
  };

  if (!project || !material) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const perimeter = (project.specification.length + project.specification.width) * 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Back to Projects
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Project: {project.clientName}</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">3D Preview</h2>
              <FenceVisualizer
                specification={project.specification}
                material={material}
                height={400}
              />
              <p className="text-xs text-gray-500 mt-2">
                Drag to rotate • Scroll to zoom • Not to scale
              </p>
            </div>
          </div>

          {/* Project Details & Quote */}
          <div className="space-y-6">
            {/* Project Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Project Details</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Client Name</p>
                  <p className="font-semibold text-gray-800">{project.clientName}</p>
                </div>

                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-semibold text-gray-800">{project.clientEmail}</p>
                </div>

                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-800">{project.clientPhone}</p>
                </div>

                <div>
                  <p className="text-gray-600">Address</p>
                  <p className="font-semibold text-gray-800">{project.address}</p>
                </div>

                <hr />

                <div>
                  <p className="text-gray-600">Material</p>
                  <p className="font-semibold text-gray-800">{material.name}</p>
                  <p className="text-xs text-gray-600">
                    ${material.costPerLinearFoot.toFixed(2)}/ft
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Color</p>
                  <p className="font-semibold text-gray-800">{project.specification.color}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-600 text-xs">Height</p>
                    <p className="font-semibold">{project.specification.height}'</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Length</p>
                    <p className="font-semibold">{project.specification.length}'</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Width</p>
                    <p className="font-semibold">{project.specification.width}'</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Perimeter</p>
                    <p className="font-semibold">{perimeter}'</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600">Gates</p>
                  <p className="font-semibold text-gray-800">
                    {project.specification.gateCount} x {project.specification.gateWidth}'
                  </p>
                </div>
              </div>
            </div>

            {/* Quote Section */}
            {quote ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Quote</h3>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Material Cost:</span>
                    <span className="font-semibold">${quote.pricing.materialCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor Cost:</span>
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
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-800">Total:</span>
                    <span className="font-bold text-green-600">
                      ${quote.pricing.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  Quote expires: {new Date(quote.expiresAt).toLocaleDateString()}
                </p>

                {quote.pdfPath && (
                  <a
                    href={`/api/${quote.pdfPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Download PDF
                  </a>
                )}

                <button
                  onClick={() => {
                    // Copy share link to clipboard
                    const shareLink = `${window.location.origin}/customer/${project.id}`;
                    navigator.clipboard.writeText(shareLink);
                    toast.success('Share link copied!');
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition mt-2"
                >
                  Share with Customer
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Generate Quote</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Click below to calculate the pricing for this project and generate a professional
                  quote PDF.
                </p>
                <button
                  onClick={handleGenerateQuote}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition"
                >
                  {loading ? 'Generating...' : 'Generate Quote'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
