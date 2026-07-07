import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './database';
import { Material } from './entities/Material';
import { Accessory } from './entities/Accessory';
import { Project } from './entities/Project';
import { Quote } from './entities/Quote';
import { PricingService } from './services/PricingService';
import { createMaterialRoutes } from './routes/materials';
import { createProjectRoutes } from './routes/projects';
import { createQuoteRoutes } from './routes/quotes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and routes
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');

    // Get repositories
    const materialRepo = AppDataSource.getRepository(Material);
    const accessoryRepo = AppDataSource.getRepository(Accessory);
    const projectRepo = AppDataSource.getRepository(Project);
    const quoteRepo = AppDataSource.getRepository(Quote);

    // Initialize services
    const pricingService = new PricingService(materialRepo, accessoryRepo, {
      laborRatePerLinearFoot: parseFloat(process.env.LABOR_RATE || '15'),
      taxRate: parseFloat(process.env.TAX_RATE || '0.08'),
    });

    // Routes
    app.use('/api/materials', createMaterialRoutes(materialRepo));
    app.use('/api/projects', createProjectRoutes(projectRepo, materialRepo));
    app.use('/api/quotes', createQuoteRoutes(quoteRepo, projectRepo, materialRepo, pricingService));

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Error handling
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
