import { Router } from 'express';
import { Repository } from 'typeorm';
import { Material } from '../entities/Material';
import { v4 as uuidv4 } from 'uuid';

export function createMaterialRoutes(materialRepository: Repository<Material>) {
  const router = Router();

  // Get all materials
  router.get('/', async (req, res) => {
    try {
      const materials = await materialRepository.find();
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch materials' });
    }
  });

  // Get material by ID
  router.get('/:id', async (req, res) => {
    try {
      const material = await materialRepository.findOneBy({ id: req.params.id });
      if (!material) return res.status(404).json({ error: 'Material not found' });
      res.json(material);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch material' });
    }
  });

  // Create material (admin only)
  router.post('/', async (req, res) => {
    try {
      const { name, type, costPerLinearFoot, description, colors, image } = req.body;

      if (!name || !type || costPerLinearFoot === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const material = new Material();
      material.id = uuidv4();
      material.name = name;
      material.type = type;
      material.costPerLinearFoot = parseFloat(costPerLinearFoot);
      material.description = description;
      material.colors = colors || ['Standard'];
      material.image = image;

      const saved = await materialRepository.save(material);
      res.status(201).json(saved);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create material' });
    }
  });

  // Update material
  router.put('/:id', async (req, res) => {
    try {
      const material = await materialRepository.findOneBy({ id: req.params.id });
      if (!material) return res.status(404).json({ error: 'Material not found' });

      Object.assign(material, req.body);
      const updated = await materialRepository.save(material);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update material' });
    }
  });

  // Delete material
  router.delete('/:id', async (req, res) => {
    try {
      const result = await materialRepository.delete(req.params.id);
      if (result.affected === 0) return res.status(404).json({ error: 'Material not found' });
      res.json({ message: 'Material deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete material' });
    }
  });

  return router;
}
