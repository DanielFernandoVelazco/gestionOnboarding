import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { EventoCalendario, TipoEvento } from './entities/evento-calendario.entity';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { User } from '../auth/entities/user.entity';
import { OnboardingSesion } from '../onboarding/entities/onboarding-sesion.entity';
import { EventoWithRelations, MesCalendario, DiaCalendario } from './interfaces/calendario-response.interface';

@Injectable()
export class CalendarioService {
    constructor(
        @InjectRepository(EventoCalendario)
        private eventosRepository: Repository<EventoCalendario>,
        @InjectRepository(OnboardingSesion)
        private sesionesRepository: Repository<OnboardingSesion>,
    ) { }

    async create(createDto: CreateEventoDto, user: User): Promise<EventoCalendario> {
        // Validar fechas
        if (createDto.fechaFin && createDto.fechaInicio > createDto.fechaFin) {
            throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
        }

        // Buscar sesión si se especificó
        let sesion: OnboardingSesion | null = null;
        if (createDto.sesionId) {
            sesion = await this.sesionesRepository.findOne({
                where: { id: createDto.sesionId },
            });

            if (!sesion) {
                throw new NotFoundException('Sesión de onboarding no encontrada');
            }
        }

        // Crear evento
        const evento = this.eventosRepository.create({
            ...createDto,
            sesion,
            creadoPor: user,
        });

        return await this.eventosRepository.save(evento);
    }

    async findAll(
        fechaDesde?: Date,
        fechaHasta?: Date,
        tipo?: TipoEvento,
    ): Promise<EventoWithRelations[]> {
        const where: FindOptionsWhere<EventoCalendario> = {
            activo: true,
        };

        // Filtro por tipo
        if (tipo) where.tipo = tipo;

        // Filtro por rango de fechas
        if (fechaDesde && fechaHasta) {
            where.fechaInicio = Between(fechaDesde, fechaHasta);
        } else if (fechaDesde) {
            where.fechaInicio = Between(fechaDesde, new Date());
        } else if (fechaHasta) {
            where.fechaInicio = Between(new Date('2000-01-01'), fechaHasta);
        }

        return await this.eventosRepository.find({
            where,
            relations: ['sesion', 'creadoPor'],
            order: { fechaInicio: 'ASC' },
        }) as EventoWithRelations[];
    }

    async findOne(id: string): Promise<EventoWithRelations> {
        const evento = await this.eventosRepository.findOne({
            where: { id, activo: true },
            relations: ['sesion', 'creadoPor'],
        });

        if (!evento) {
            throw new NotFoundException(`Evento con ID ${id} no encontrado`);
        }

        return evento as EventoWithRelations;
    }

    async update(
        id: string,
        updateDto: UpdateEventoDto,
        user: User,
    ): Promise<EventoCalendario> {
        const evento = await this.eventosRepository.findOne({
            where: { id },
        });

        if (!evento) {
            throw new NotFoundException(`Evento con ID ${id} no encontrado`);
        }

        // Validar fechas
        if (updateDto.fechaFin && updateDto.fechaInicio && updateDto.fechaInicio > updateDto.fechaFin) {
            throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
        }

        // Actualizar evento
        Object.assign(evento, updateDto);

        return await this.eventosRepository.save(evento);
    }

    async remove(id: string): Promise<void> {
        const evento = await this.eventosRepository.findOne({
            where: { id },
        });

        if (!evento) {
            throw new NotFoundException(`Evento con ID ${id} no encontrado`);
        }

        // Soft delete (marcar como inactivo)
        evento.activo = false;
        await this.eventosRepository.save(evento);
    }

    async getMesCalendario(año: number, mes: number): Promise<MesCalendario> {
        // Calcular primer y último día del mes
        const primerDia = new Date(año, mes - 1, 1);
        const ultimoDia = new Date(año, mes, 0);

        // Obtener eventos del mes
        const eventos = await this.eventosRepository.find({
            where: {
                fechaInicio: Between(primerDia, ultimoDia),
                activo: true,
            },
            relations: ['sesion'],
        });

        // Obtener sesiones del mes
        const sesiones = await this.sesionesRepository.find({
            where: {
                fechaInicio: Between(primerDia, ultimoDia),
                activo: true,
            },
            relations: ['tipo'],
        });

        // Generar semanas del mes
        const semanas = this.generarSemanas(año, mes - 1, eventos, sesiones);

        // Nombres de meses en español
        const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        return {
            año,
            mes,
            nombreMes: nombresMeses[mes - 1],
            semanas,
        };
    }

    private generarSemanas(
        año: number,
        mes: number,
        eventos: EventoCalendario[],
        sesiones: OnboardingSesion[],
    ): Array<Array<DiaCalendario>> {
        const primerDia = new Date(año, mes, 1);
        const ultimoDia = new Date(año, mes + 1, 0);

        // Ajustar primer día a lunes si es necesario
        const primerDiaSemana = new Date(primerDia);
        const diaSemana = primerDia.getDay();
        primerDiaSemana.setDate(primerDia.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));

        // Ajustar último día a domingo si es necesario
        const ultimoDiaSemana = new Date(ultimoDia);
        const diaSemanaUltimo = ultimoDia.getDay();
        if (diaSemanaUltimo !== 0) {
            ultimoDiaSemana.setDate(ultimoDia.getDate() + (7 - diaSemanaUltimo));
        }

        const semanas: Array<Array<DiaCalendario>> = [];
        let fechaActual = new Date(primerDiaSemana);

        while (fechaActual <= ultimoDiaSemana) {
            const semana: DiaCalendario[] = [];

            for (let i = 0; i < 7; i++) {
                const fecha = new Date(fechaActual);
                const esMesActual = fecha.getMonth() === mes;

                // Filtrar eventos para este día
                const eventosDia = eventos.filter(evento => {
                    const eventoFecha = new Date(evento.fechaInicio);
                    return eventoFecha.getDate() === fecha.getDate() &&
                        eventoFecha.getMonth() === fecha.getMonth() &&
                        eventoFecha.getFullYear() === fecha.getFullYear();
                });

                // Filtrar sesiones para este día
                const sesionesDia = sesiones.filter(sesion => {
                    const sesionFecha = new Date(sesion.fechaInicio);
                    return sesionFecha.getDate() === fecha.getDate() &&
                        sesionFecha.getMonth() === fecha.getMonth() &&
                        sesionFecha.getFullYear() === fecha.getFullYear();
                });

                semana.push({
                    fecha,
                    esMesActual,
                    eventos: eventosDia,
                    sesiones: sesionesDia.map(s => ({
                        id: s.id,
                        titulo: s.titulo,
                        tipo: s.tipo,
                        estado: s.estado,
                    })),
                });

                fechaActual.setDate(fechaActual.getDate() + 1);
            }

            semanas.push(semana);
        }

        return semanas;
    }

    async getEventosProximos(limite: number = 10): Promise<EventoCalendario[]> {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaLimite = new Date(hoy);
        fechaLimite.setDate(fechaLimite.getDate() + 30); // Próximos 30 días

        return await this.eventosRepository.find({
            where: {
                fechaInicio: Between(hoy, fechaLimite),
                activo: true,
            },
            relations: ['sesion'],
            order: { fechaInicio: 'ASC' },
            take: limite,
        });
    }

    async getEventosPorTipo(tipo: TipoEvento): Promise<EventoCalendario[]> {
        return await this.eventosRepository.find({
            where: {
                tipo,
                activo: true,
            },
            relations: ['sesion'],
            order: { fechaInicio: 'ASC' },
        });
    }
}