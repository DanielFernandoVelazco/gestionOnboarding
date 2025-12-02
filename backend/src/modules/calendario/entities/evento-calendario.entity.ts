import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { OnboardingSesion } from '../../onboarding/entities/onboarding-sesion.entity';

export enum TipoEvento {
    SESION_ONBOARDING = 'sesion_onboarding',
    REUNION = 'reunion',
    FERIADO = 'feriado',
    OTRO = 'otro',
}

@Entity('eventos_calendario')
export class EventoCalendario {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 150 })
    titulo: string;

    @Column({ type: 'text', nullable: true })
    descripcion?: string;

    @Column({
        type: 'enum',
        enum: TipoEvento,
        default: TipoEvento.SESION_ONBOARDING,
    })
    tipo: TipoEvento;

    @Column({ type: 'date' })
    fechaInicio: Date;

    @Column({ type: 'date', nullable: true })
    fechaFin?: Date;

    @Column({ type: 'boolean', default: false })
    todoElDia: boolean;

    @Column({ type: 'varchar', length: 50 })
    color: string;

    @ManyToOne(() => OnboardingSesion, { nullable: true })
    @JoinColumn({ name: 'sesionId' })
    sesion?: OnboardingSesion;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'creadoPorId' })
    creadoPor: User;

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}