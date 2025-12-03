import {
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notificacion, TipoNotificacion, EstadoNotificacion } from './entities/notificacion.entity';
import { MailService } from './mail.service';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';
import { EstadoSesion, OnboardingSesion } from '../onboarding/entities/onboarding-sesion.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class NotificacionesService {
    private readonly logger = new Logger(NotificacionesService.name);

    constructor(
        @InjectRepository(Notificacion)
        private notificacionesRepository: Repository<Notificacion>,
        @InjectRepository(Colaborador)
        private colaboradoresRepository: Repository<Colaborador>,
        @InjectRepository(OnboardingSesion)
        private sesionesRepository: Repository<OnboardingSesion>,
        private mailService: MailService,
    ) { }

    async createNotificacion(data: {
        tipo: TipoNotificacion;
        asunto: string;
        contenido: string;
        destinatarioId?: string;
        sesionId?: string;
        metadata?: Record<string, any>;
        creadoPor: User;
    }): Promise<Notificacion> {
        let destinatario: Colaborador | null = null;
        let sesion: OnboardingSesion | null = null;

        // Buscar destinatario si se especificó
        if (data.destinatarioId) {
            destinatario = await this.colaboradoresRepository.findOne({
                where: { id: data.destinatarioId },
            });

            if (!destinatario) {
                throw new NotFoundException('Destinatario no encontrado');
            }
        }

        // Buscar sesión si se especificó
        if (data.sesionId) {
            sesion = await this.sesionesRepository.findOne({
                where: { id: data.sesionId },
            });

            if (!sesion) {
                throw new NotFoundException('Sesión no encontrada');
            }
        }

        const notificacion = this.notificacionesRepository.create({
            ...data,
            destinatario,
            sesion,
        });

        return await this.notificacionesRepository.save(notificacion);
    }

    async enviarNotificacion(id: string): Promise<Notificacion> {
        const notificacion = await this.notificacionesRepository.findOne({
            where: { id },
            relations: ['destinatario'],
        });

        if (!notificacion) {
            throw new NotFoundException('Notificación no encontrada');
        }

        if (notificacion.estado === EstadoNotificacion.ENVIADA) {
            return notificacion;
        }

        try {
            const enviado = await this.mailService.sendNotificationEmail(notificacion);

            notificacion.estado = enviado ? EstadoNotificacion.ENVIADA : EstadoNotificacion.FALLIDA;
            notificacion.fechaEnvio = new Date();

            if (!enviado) {
                notificacion.error = 'Error al enviar correo';
            }

            return await this.notificacionesRepository.save(notificacion);
        } catch (error) {
            notificacion.estado = EstadoNotificacion.FALLIDA;
            notificacion.error = error.message;
            await this.notificacionesRepository.save(notificacion);

            throw error;
        }
    }

    async enviarNotificacionesPendientes(): Promise<{ success: number; failed: number }> {
        const notificaciones = await this.notificacionesRepository.find({
            where: {
                estado: EstadoNotificacion.PENDIENTE,
            },
            relations: ['destinatario'],
            take: 50, // Límite para evitar sobrecarga
        });

        if (notificaciones.length === 0) {
            return { success: 0, failed: 0 };
        }

        const results = await Promise.allSettled(
            notificaciones.map(notif => this.enviarNotificacion(notif.id))
        );

        const success = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.length - success;

        this.logger.log(`Notificaciones enviadas: ${success} exitosas, ${failed} fallidas`);

        return { success, failed };
    }

    async notificarOnboardingAgendado(
        sesionId: string,
        creadoPor: User,
    ): Promise<Notificacion[]> {
        const sesion = await this.sesionesRepository.findOne({
            where: { id: sesionId },
            relations: ['participantes', 'tipo'],
        });

        if (!sesion) {
            throw new NotFoundException('Sesión no encontrada');
        }

        const notificaciones: Notificacion[] = [];

        for (const participante of sesion.participantes) {
            const contenido = this.mailService.generateOnboardingTemplate({
                colaboradorNombre: participante.nombreCompleto,
                sesionTitulo: sesion.titulo,
                fechaInicio: sesion.fechaInicio.toLocaleDateString('es-ES'),
                fechaFin: sesion.fechaFin.toLocaleDateString('es-ES'),
                ubicacion: sesion.ubicacion,
                enlaceVirtual: sesion.enlaceVirtual,
                notas: sesion.notas,
            });

            const notificacion = await this.createNotificacion({
                tipo: TipoNotificacion.ONBOARDING_AGENDADO,
                asunto: `🎯 Sesión de Onboarding: ${sesion.titulo}`,
                contenido,
                destinatarioId: participante.id,
                sesionId: sesion.id,
                metadata: {
                    sesionTitulo: sesion.titulo,
                    fechaInicio: sesion.fechaInicio,
                    fechaFin: sesion.fechaFin,
                },
                creadoPor,
            });

            notificaciones.push(notificacion);
        }

        return notificaciones;
    }

    async enviarRecordatorios(): Promise<Notificacion[]> {
        const hoy = new Date();
        const mañana = new Date(hoy);
        mañana.setDate(mañana.getDate() + 1);

        // Buscar sesiones que empiezan mañana
        const sesiones = await this.sesionesRepository.find({
            where: {
                fechaInicio: Between(hoy, mañana),
                estado: EstadoSesion.PROGRAMADA,
                activo: true,
            },

            relations: ['participantes', 'tipo'],
        });

        const notificaciones: Notificacion[] = [];

        for (const sesion of sesiones) {
            for (const participante of sesion.participantes) {
                const contenido = this.mailService.generateReminderTemplate({
                    colaboradorNombre: participante.nombreCompleto,
                    sesionTitulo: sesion.titulo,
                    fechaInicio: sesion.fechaInicio.toLocaleDateString('es-ES'),
                    tiempoRestante: '24 horas',
                    enlaceVirtual: sesion.enlaceVirtual,
                });

                const notificacion = await this.createNotificacion({
                    tipo: TipoNotificacion.RECORDATORIO_SESION,
                    asunto: `⏰ Recordatorio: ${sesion.titulo} mañana`,
                    contenido,
                    destinatarioId: participante.id,
                    sesionId: sesion.id,
                    metadata: {
                        sesionTitulo: sesion.titulo,
                        fechaInicio: sesion.fechaInicio,
                    },
                    creadoPor: { id: 'system' } as User, // Usuario sistema
                });

                notificaciones.push(notificacion);
            }
        }

        return notificaciones;
    }

    async findAll(filterDto: {
        tipo?: TipoNotificacion;
        estado?: EstadoNotificacion;
        destinatarioId?: string;
        sesionId?: string;
        fechaDesde?: Date;
        fechaHasta?: Date;
        page?: number;
        limit?: number;
    }): Promise<{ data: Notificacion[]; total: number }> {
        const {
            tipo,
            estado,
            destinatarioId,
            sesionId,
            fechaDesde,
            fechaHasta,
            page = 1,
            limit = 10,
        } = filterDto;

        const where: FindOptionsWhere<Notificacion> = {};

        if (tipo) where.tipo = tipo;
        if (estado) where.estado = estado;
        if (destinatarioId) where.destinatario = { id: destinatarioId };
        if (sesionId) where.sesion = { id: sesionId };

        if (fechaDesde && fechaHasta) {
            where.createdAt = Between(fechaDesde, fechaHasta);
        }

        const [notificaciones, total] = await this.notificacionesRepository.findAndCount({
            where,
            relations: ['destinatario', 'sesion', 'creadoPor'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data: notificaciones, total };
    }

    async findOne(id: string): Promise<Notificacion> {
        const notificacion = await this.notificacionesRepository.findOne({
            where: { id },
            relations: ['destinatario', 'sesion', 'creadoPor'],
        });

        if (!notificacion) {
            throw new NotFoundException('Notificación no encontrada');
        }

        return notificacion;
    }

    async getStats(): Promise<{
        total: number;
        enviadas: number;
        pendientes: number;
        fallidas: number;
        porTipo: Array<{ tipo: string; count: number }>;
    }> {
        const total = await this.notificacionesRepository.count();

        const enviadas = await this.notificacionesRepository.count({
            where: { estado: EstadoNotificacion.ENVIADA },
        });

        const pendientes = await this.notificacionesRepository.count({
            where: { estado: EstadoNotificacion.PENDIENTE },
        });

        const fallidas = await this.notificacionesRepository.count({
            where: { estado: EstadoNotificacion.FALLIDA },
        });

        const porTipo = await this.notificacionesRepository
            .createQueryBuilder('notificacion')
            .select('notificacion.tipo', 'tipo')
            .addSelect('COUNT(notificacion.id)', 'count')
            .groupBy('notificacion.tipo')
            .getRawMany();

        return {
            total,
            enviadas,
            pendientes,
            fallidas,
            porTipo: porTipo.map(t => ({
                tipo: t.tipo,
                count: parseInt(t.count),
            })),
        };
    }

    // Tarea programada: Enviar notificaciones pendientes cada hora
    @Cron(CronExpression.EVERY_HOUR)
    async handleCron() {
        this.logger.debug('Ejecutando tarea programada: enviar notificaciones pendientes');
        await this.enviarNotificacionesPendientes();
    }

    // Tarea programada: Enviar recordatorios diarios a las 9 AM
    @Cron('0 9 * * *')
    async handleDailyReminders() {
        this.logger.debug('Ejecutando tarea programada: enviar recordatorios diarios');
        await this.enviarRecordatorios();
    }
}