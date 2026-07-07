import { Entity, PrimaryColumn, Column } from 'typeorm';
import type { PricingBreakdown } from '../../../shared/types';

@Entity('quotes')
export class Quote {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column('jsonb')
  pricing: PricingBreakdown;

  @Column('decimal', { precision: 10, scale: 2 })
  laborRatePerLinearFoot: number;

  @Column({ nullable: true })
  pdfPath: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}
