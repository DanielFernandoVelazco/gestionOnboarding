import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Colaborador } from '../../colaboradores/entities/colaborador.entity';
import { OnboardingSesion } from '../../onboarding/entities/onboarding-sesion.entity';

export enum TipoNotificacion {
    ONBOARDING_AGENDADO = 'onboarding_agendado',
    RECORDATORIO_SESION = 'recordatorio_sesion',
    CAMBIO_ESTADO = 'cambio_estado',
    NUEVO_COLABORADOR = 'nuevo_colaborador',
    SISTEMA = 'sistema',
}

export enum EstadoNotificacion {
    PENDIENTE = 'pendiente',
    ENVIADA = 'enviada',
    FALLIDA = 'fallida',
}

@Entity('notificaciones')
export class Notificacion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: TipoNotificacion,
    })
    tipo: TipoNotificacion;

    @Column({ type: 'varchar', length: 200 })
    asunto: string;

    @Column({ type: 'text' })
    contenido: string;

    @Column({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @ManyToOne(() => Colaborador, { nullable: true })
    @JoinColumn({ name: 'colaboradorId' })
    destinatario: Colaborador | null;

    @ManyToOne(() => OnboardingSesion, { nullable: true })
    @JoinColumn({ name: 'sesionId' })
    sesion: OnboardingSesion | null;

    @Column({
        type: 'enum',
        enum: EstadoNotificacion,
        default: EstadoNotificacion.PENDIENTE,
    })
    estado: EstadoNotificacion;

    @Column({ type: 'timestamp', nullable: true })
    fechaEnvio?: Date;

    @Column({ type: 'text', nullable: true })
    error?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'creadoPorId' })
    creadoPor: User;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
}