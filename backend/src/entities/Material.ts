import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('materials')
export class Material {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: 'chainlink' | 'vinyl' | 'wood' | 'aluminum' | 'composite';

  @Column('decimal', { precision: 10, scale: 2 })
  costPerLinearFoot: number;

  @Column()
  description: string;

  @Column('simple-array')
  colors: string[];

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
