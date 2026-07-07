import { Entity, PrimaryColumn, Column } from 'typeorm';
import type { FenceSpecification } from '../../../shared/types';

@Entity('projects')
export class Project {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  clientName: string;

  @Column()
  clientEmail: string;

  @Column()
  clientPhone: string;

  @Column()
  address: string;

  @Column('jsonb')
  specification: FenceSpecification;

  @Column()
  status: 'draft' | 'quoted' | 'accepted' | 'rejected';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
