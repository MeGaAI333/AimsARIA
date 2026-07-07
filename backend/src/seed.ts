import { AppDataSource } from './database';
import { Material } from './entities/Material';
import { Accessory } from './entities/Accessory';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  await AppDataSource.initialize();

  const materialRepository = AppDataSource.getRepository(Material);
  const accessoryRepository = AppDataSource.getRepository(Accessory);

  // Clear existing data
  await materialRepository.delete({});
  await accessoryRepository.delete({});

  // Sample materials
  const materials = [
    {
      id: uuidv4(),
      name: 'Chain Link',
      type: 'chainlink' as const,
      costPerLinearFoot: 8,
      description: 'Durable and affordable chain link fencing',
      colors: ['Silver', 'Galvanized', 'Black', 'Green', 'Brown'],
      image: null,
    },
    {
      id: uuidv4(),
      name: 'Vinyl',
      type: 'vinyl' as const,
      costPerLinearFoot: 18,
      description: 'Low-maintenance vinyl fencing with classic appeal',
      colors: ['White', 'Cream', 'Light Gray', 'Dark Gray', 'Tan', 'Khaki'],
      image: null,
    },
    {
      id: uuidv4(),
      name: 'Wood Pressure Treated',
      type: 'wood' as const,
      costPerLinearFoot: 12,
      description: 'Traditional wood fencing treated to resist rot',
      colors: ['Natural', 'Golden Brown', 'Dark Brown', 'Cedar Stain'],
      image: null,
    },
    {
      id: uuidv4(),
      name: 'Wood Cedar',
      type: 'wood' as const,
      costPerLinearFoot: 16,
      description: 'Premium cedar wood with natural beauty',
      colors: ['Natural Cedar', 'Honey', 'Light Brown', 'Dark Walnut'],
      image: null,
    },
    {
      id: uuidv4(),
      name: 'Aluminum',
      type: 'aluminum' as const,
      costPerLinearFoot: 20,
      description: 'Lightweight and corrosion-resistant aluminum',
      colors: ['Anodized Black', 'Bronze', 'Silver', 'White'],
      image: null,
    },
    {
      id: uuidv4(),
      name: 'Composite',
      type: 'composite' as const,
      costPerLinearFoot: 22,
      description: 'Eco-friendly composite material with durability',
      colors: ['Weathered Gray', 'Dark Walnut', 'Cedar', 'Charcoal'],
      image: null,
    },
  ];

  // Sample accessories
  const accessories = [
    {
      id: uuidv4(),
      name: 'Single Gate 4ft',
      type: 'gate' as const,
      cost: 150,
      description: 'Standard single hinged gate',
    },
    {
      id: uuidv4(),
      name: 'Double Gate 8ft',
      type: 'gate' as const,
      cost: 350,
      description: 'Double driveway gate',
    },
    {
      id: uuidv4(),
      name: 'Post Cap',
      type: 'cap' as const,
      cost: 8,
      description: 'Decorative post cap',
    },
    {
      id: uuidv4(),
      name: 'Gate Latch',
      type: 'latch' as const,
      cost: 25,
      description: 'Heavy duty gate latch',
    },
    {
      id: uuidv4(),
      name: 'Hinge Set',
      type: 'hinge' as const,
      cost: 40,
      description: 'Professional grade hinges per gate',
    },
  ];

  // Save to database
  await materialRepository.save(materials);
  await accessoryRepository.save(accessories);

  console.log('✅ Database seeded with sample data');
  console.log(`📊 Created ${materials.length} materials and ${accessories.length} accessories`);

  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
