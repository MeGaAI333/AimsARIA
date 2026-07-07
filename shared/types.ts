export type MaterialType = 'chainlink' | 'vinyl' | 'wood' | 'aluminum' | 'composite';

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  costPerLinearFoot: number;
  description: string;
  colors: string[];
  image?: string;
}

export interface Accessory {
  id: string;
  name: string;
  type: 'gate' | 'post' | 'cap' | 'latch' | 'hinge' | 'other';
  cost: number;
  description: string;
}

export interface FenceSpecification {
  materialId: string;
  color: string;
  height: number; // in feet
  length: number; // in linear feet
  width: number; // in linear feet (for gates)
  accessories: string[]; // accessory IDs
  gateCount: number;
  gateWidth: number; // in feet
  customNotes?: string;
}

export interface Project {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  address: string;
  specification: FenceSpecification;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'quoted' | 'accepted' | 'rejected';
}

export interface PricingBreakdown {
  materialCost: number;
  laborCost: number;
  accessoriesCost: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface Quote {
  id: string;
  projectId: string;
  pricing: PricingBreakdown;
  laborRatePerLinearFoot: number;
  createdAt: Date;
  expiresAt: Date;
  pdfPath?: string;
}

export interface EstimatorConfig {
  laborRatePerLinearFoot: number;
  taxRate: number; // 0.08 for 8%
}
