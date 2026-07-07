import axios from 'axios';
import type { Material, Project, Quote, FenceSpecification } from '../../../shared/types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const materialAPI = {
  getAll: () => api.get<Material[]>('/materials'),
  getById: (id: string) => api.get<Material>(`/materials/${id}`),
  create: (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Material>('/materials', material),
  update: (id: string, material: Partial<Material>) =>
    api.put<Material>(`/materials/${id}`, material),
  delete: (id: string) => api.delete(`/materials/${id}`),
};

export const projectAPI = {
  getAll: () => api.get<Project[]>('/projects'),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Project>('/projects', project),
  update: (id: string, project: Partial<Project>) =>
    api.put<Project>(`/projects/${id}`, project),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const quoteAPI = {
  getAll: () => api.get<Quote[]>('/quotes'),
  getById: (id: string) => api.get<Quote>(`/quotes/${id}`),
  getByProjectId: (projectId: string) => api.get<Quote>(`/quotes/project/${projectId}`),
  generate: (projectId: string) => api.post<Quote>(`/quotes/generate/${projectId}`, {}),
};

export default api;
