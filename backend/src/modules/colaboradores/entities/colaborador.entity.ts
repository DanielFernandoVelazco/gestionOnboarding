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
import { OnboardingTipo } from '../../onboarding/entities/onboarding-tipo.entity';

export enum EstadoOnboarding {
    PENDIENTE = 'pendiente',
    EN_PROGRESO = 'en_progreso',
    COMPLETADO = 'completado',
    CANCELADO = 'cancelado',
}

export enum LugarAsignacion {
    JOURNEY_TO_CLOUD = 'journey_to_cloud',
    CAPITULO_DATA = 'capitulo_data',
    CAPITULO_FRONTEND = 'capitulo_frontend',
    CAPITULO_BACKEND = 'capitulo_backend',
    OTRO = 'otro',
}

@Entity('colaboradores')
export class Colaborador {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 150 })
    nombreCompleto: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telefono?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    departamento?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    puesto?: string;

    @Column({ type: 'date' })
    fechaIngreso: Date;

    @Column({
        type: 'enum',
        enum: EstadoOnboarding,
        default: EstadoOnboarding.PENDIENTE,
    })
    estadoBienvenida: EstadoOnboarding;

    @Column({
        type: 'enum',
        enum: EstadoOnboarding,
        default: EstadoOnboarding.PENDIENTE,
    })
    estadoTecnico: EstadoOnboarding;

    @Column({ type: 'date', nullable: true })
    fechaOnboardingTecnico?: Date;

    @Column({ type: 'date', nullable: true })
    fechaAsignacionOnboarding?: Date;

    @Column({
        type: 'enum',
        enum: LugarAsignacion,
        nullable: true,
    })
    lugarAsignacion?: LugarAsignacion;

    @ManyToOne(() => OnboardingTipo, { nullable: true })
    @JoinColumn({ name: 'tipoOnboardingTecnicoId' })
    tipoOnboardingTecnico?: OnboardingTipo;

    @Column({ type: 'text', nullable: true })
    notas?: string;

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    // Relación con el usuario que creó/modificó
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'creadoPorId' })
    creadoPor?: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'actualizadoPorId' })
    actualizadoPor?: User;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}