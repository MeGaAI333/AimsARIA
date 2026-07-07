import { Router } from 'express';
import { Repository } from 'typeorm';
import { Project } from '../entities/Project';
import { Material } from '../entities/Material';
import { v4 as uuidv4 } from 'uuid';
import type { FenceSpecification } from '../../../shared/types';

export function createProjectRoutes(
  projectRepository: Repository<Project>,
  materialRepository: Repository<Material>
) {
  const router = Router();

  // Get all projects
  router.get('/', async (req, res) => {
    try {
      const projects = await projectRepository.find();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  // Get project by ID
  router.get('/:id', async (req, res) => {
    try {
      const project = await projectRepository.findOneBy({ id: req.params.id });
      if (!project) return res.status(404).json({ error: 'Project not found' });
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });

  // Create project
  router.post('/', async (req, res) => {
    try {
      const { clientName, clientEmail, clientPhone, address, specification } = req.body;

      if (!clientName || !clientEmail || !specification) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify material exists
      const material = await materialRepository.findOneBy({ id: specification.materialId });
      if (!material) return res.status(400).json({ error: 'Invalid material ID' });

      const project = new Project();
      project.id = uuidv4();
      project.clientName = clientName;
      project.clientEmail = clientEmail;
      project.clientPhone = clientPhone;
      project.address = address;
      project.specification = specification;
      project.status = 'draft';

      const saved = await projectRepository.save(project);
      res.status(201).json(saved);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  // Update project
  router.put('/:id', async (req, res) => {
    try {
      const project = await projectRepository.findOneBy({ id: req.params.id });
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const { clientName, clientEmail, clientPhone, address, specification, status } = req.body;

      if (clientName) project.clientName = clientName;
      if (clientEmail) project.clientEmail = clientEmail;
      if (clientPhone) project.clientPhone = clientPhone;
      if (address) project.address = address;
      if (specification) project.specification = specification;
      if (status) project.status = status;

      const updated = await projectRepository.save(project);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update project' });
    }
  });

  // Delete project
  router.delete('/:id', async (req, res) => {
    try {
      const result = await projectRepository.delete(req.params.id);
      if (result.affected === 0) return res.status(404).json({ error: 'Project not found' });
      res.json({ message: 'Project deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  return router;
}
