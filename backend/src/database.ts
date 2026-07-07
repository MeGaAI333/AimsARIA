import { DataSource } from 'typeorm';
import { Material } from './entities/Material';
import { Accessory } from './entities/Accessory';
import { Project } from './entities/Project';
import { Quote } from './entities/Quote';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'fence_estimator',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [Material, Accessory, Project, Quote],
  migrations: ['src/migrations/*.ts'],
  migrationsRun: true,
});
