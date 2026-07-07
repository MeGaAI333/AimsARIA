import { Router } from 'express';
import { Repository } from 'typeorm';
import { Quote } from '../entities/Quote';
import { Project } from '../entities/Project';
import { Material } from '../entities/Material';
import { PricingService } from '../services/PricingService';
import { PDFService } from '../services/PDFService';
import { v4 as uuidv4 } from 'uuid';
import type { EstimatorConfig } from '../../../shared/types';

export function createQuoteRoutes(
  quoteRepository: Repository<Quote>,
  projectRepository: Repository<Project>,
  materialRepository: Repository<Material>,
  pricingService: PricingService
) {
  const router = Router();
  const pdfService = new PDFService();

  // Get all quotes
  router.get('/', async (req, res) => {
    try {
      const quotes = await quoteRepository.find();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  });

  // Get quote by ID
  router.get('/:id', async (req, res) => {
    try {
      const quote = await quoteRepository.findOneBy({ id: req.params.id });
      if (!quote) return res.status(404).json({ error: 'Quote not found' });
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quote' });
    }
  });

  // Generate quote for a project
  router.post('/generate/:projectId', async (req, res) => {
    try {
      const project = await projectRepository.findOneBy({ id: req.params.projectId });
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const material = await materialRepository.findOneBy({ id: project.specification.materialId });
      if (!material) return res.status(404).json({ error: 'Material not found' });

      // Calculate pricing
      const pricing = await pricingService.calculateQuote(project.specification);

      // Create quote
      const quote = new Quote();
      quote.id = uuidv4();
      quote.projectId = project.id;
      quote.pricing = pricing;
      quote.laborRatePerLinearFoot = 15; // Default rate, should be configurable
      quote.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const saved = await quoteRepository.save(quote);

      // Generate PDF
      try {
        const pdfPath = await pdfService.generateQuotePDF(
          project as any,
          saved as any,
          material as any
        );
        saved.pdfPath = pdfPath;
        await quoteRepository.save(saved);
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError);
        // Continue without PDF
      }

      // Update project status
      project.status = 'quoted';
      await projectRepository.save(project);

      res.status(201).json(saved);
    } catch (error) {
      console.error('Quote generation failed:', error);
      res.status(500).json({ error: 'Failed to generate quote' });
    }
  });

  // Get quote by project ID
  router.get('/project/:projectId', async (req, res) => {
    try {
      const quote = await quoteRepository.findOneBy({ projectId: req.params.projectId });
      if (!quote) return res.status(404).json({ error: 'Quote not found' });
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quote' });
    }
  });

  // Update pricing config
  router.post('/config', async (req, res) => {
    try {
      const config: EstimatorConfig = req.body;
      pricingService.setConfig(config);
      res.json({ message: 'Config updated', config });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update config' });
    }
  });

  return router;
}
