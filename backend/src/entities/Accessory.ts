import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('accessories')
export class Accessory {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: 'gate' | 'post' | 'cap' | 'latch' | 'hinge' | 'other';

  @Column('decimal', { precision: 10, scale: 2 })
  cost: number;

  @Column()
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
