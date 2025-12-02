import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { OnboardingTipo } from './onboarding-tipo.entity';
import { Colaborador } from '../../colaboradores/entities/colaborador.entity';

export enum EstadoSesion {
    PROGRAMADA = 'programada',
    EN_CURSO = 'en_curso',
    COMPLETADA = 'completada',
    CANCELADA = 'cancelada',
}

@Entity('onboarding_sesiones')
export class OnboardingSesion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 150 })
    titulo: string;

    @Column({ type: 'text', nullable: true })
    descripcion?: string;

    @ManyToOne(() => OnboardingTipo)
    @JoinColumn({ name: 'tipoId' })
    tipo: OnboardingTipo;

    @Column({ type: 'date' })
    fechaInicio: Date;

    @Column({ type: 'date' })
    fechaFin: Date;

    @Column({
        type: 'enum',
        enum: EstadoSesion,
        default: EstadoSesion.PROGRAMADA,
    })
    estado: EstadoSesion;

    @Column({ type: 'int', default: 1 })
    capacidadMaxima: number;

    @Column({ type: 'varchar', length: 200, nullable: true })
    ubicacion?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    enlaceVirtual?: string;

    @Column({ type: 'text', nullable: true })
    notas?: string;

    @ManyToMany(() => Colaborador)
    @JoinTable({
        name: 'sesiones_colaboradores',
        joinColumn: {
            name: 'sesionId',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'colaboradorId',
            referencedColumnName: 'id',
        },
    })
    participantes: Colaborador[];

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'creadoPorId' })
    creadoPor?: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'actualizadoPorId' })
    actualizadoPor?: User;

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}