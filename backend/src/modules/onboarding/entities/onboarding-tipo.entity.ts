import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Colaborador } from '../../colaboradores/entities/colaborador.entity';
import { OnboardingSesion } from './onboarding-sesion.entity';

@Entity('onboarding_tipos')
export class OnboardingTipo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    nombre: string;

    @Column({ type: 'varchar', length: 50 })
    color: string;

    @Column({ type: 'text', nullable: true })
    descripcion?: string;

    @Column({ type: 'int', default: 1 })
    duracionDias: number;

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @OneToMany(() => Colaborador, (colaborador) => colaborador.tipoOnboardingTecnico)
    colaboradores: Colaborador[];

    @OneToMany(() => OnboardingSesion, (sesion) => sesion.tipo)
    sesiones: OnboardingSesion[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}