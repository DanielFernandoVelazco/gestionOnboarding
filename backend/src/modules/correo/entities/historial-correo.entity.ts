import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('historial_correos')
export class HistorialCorreo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 500 })
    destinatario: string;

    @Column({ type: 'varchar', length: 500 })
    asunto: string;

    @Column({ type: 'text', nullable: true })
    cuerpo: string;

    @Column({ type: 'boolean', default: false })
    enviado: boolean;

    @Column({ type: 'text', nullable: true })
    error: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    tipo: string; // ej: 'registro', 'recordatorio', 'notificacion', etc.

    @Column({ type: 'json', nullable: true })
    metadata: any; // Datos adicionales en formato JSON

    @CreateDateColumn()
    fecha_envio: Date;

    @Column({ type: 'timestamp', nullable: true })
    fecha_lectura: Date;
}