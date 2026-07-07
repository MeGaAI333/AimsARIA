import { Repository } from 'typeorm';
import { Material } from '../entities/Material';
import { Accessory } from '../entities/Accessory';
import type { FenceSpecification, PricingBreakdown, EstimatorConfig } from '../../../shared/types';

export class PricingService {
  private materialRepository: Repository<Material>;
  private accessoryRepository: Repository<Accessory>;
  private config: EstimatorConfig;

  constructor(
    materialRepo: Repository<Material>,
    accessoryRepo: Repository<Accessory>,
    config: EstimatorConfig
  ) {
    this.materialRepository = materialRepo;
    this.accessoryRepository = accessoryRepo;
    this.config = config;
  }

  async calculateQuote(specification: FenceSpecification): Promise<PricingBreakdown> {
    const material = await this.materialRepository.findOneBy({ id: specification.materialId });
    if (!material) throw new Error('Material not found');

    // Material cost calculation: linear feet * cost per linear foot * number of sides
    // For a fence, we calculate for the perimeter
    const fencePerimeter = (specification.length + specification.width) * 2;
    const materialCost = fencePerimeter * material.costPerLinearFoot;

    // Labor cost: linear feet * labor rate
    const laborCost = fencePerimeter * this.config.laborRatePerLinearFoot;

    // Accessories cost
    let accessoriesCost = 0;
    if (specification.accessories && specification.accessories.length > 0) {
      const accessories = await this.accessoryRepository.find({
        where: { id: specification.accessories },
      });
      accessoriesCost = accessories.reduce((sum, acc) => sum + Number(acc.cost), 0);

      // Gate-specific costs
      if (specification.gateCount > 0) {
        const gateCost = specification.gateCount * specification.gateWidth * material.costPerLinearFoot;
        accessoriesCost += gateCost;
      }
    }

    const subtotal = materialCost + laborCost + accessoriesCost;
    const tax = subtotal * this.config.taxRate;
    const total = subtotal + tax;

    return {
      materialCost: Math.round(materialCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      accessoriesCost: Math.round(accessoriesCost * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  setConfig(config: EstimatorConfig) {
    this.config = config;
  }
}
