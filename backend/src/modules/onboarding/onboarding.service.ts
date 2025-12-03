import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, In } from 'typeorm';
import { OnboardingSesion, EstadoSesion } from './entities/onboarding-sesion.entity';
import { OnboardingTipo } from './entities/onboarding-tipo.entity';
import { CreateSesionDto } from './dto/create-sesion.dto';
import { UpdateSesionDto } from './dto/update-sesion.dto';
import { FilterSesionDto } from './dto/filter-sesion.dto';
import { AgregarParticipanteDto } from './dto/agregar-participante.dto';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';
import { User } from '../auth/entities/user.entity';
import {
    SesionWithRelations,
    PaginatedSesionesResponse,
    SesionStats,
} from './interfaces/sesion-response.interface';

@Injectable()
export class OnboardingService {
    constructor(
        @InjectRepository(OnboardingSesion)
        private sesionesRepository: Repository<OnboardingSesion>,
        @InjectRepository(OnboardingTipo)
        private tiposRepository: Repository<OnboardingTipo>,
        @InjectRepository(Colaborador)
        private colaboradoresRepository: Repository<Colaborador>,
    ) { }

    async create(createDto: CreateSesionDto, user: User): Promise<OnboardingSesion> {
        // Validar fechas
        if (createDto.fechaFin && createDto.fechaInicio > createDto.fechaFin) {
            throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
        }

        // Verificar que el tipo existe
        const tipo = await this.tiposRepository.findOne({
            where: { id: createDto.tipoId, activo: true },
        });

        if (!tipo) {
            throw new NotFoundException('Tipo de onboarding no encontrado');
        }

        // Verificar capacidad
        if (createDto.capacidadMaxima < 1) {
            throw new BadRequestException('La capacidad máxima debe ser al menos 1');
        }

        // Buscar participantes si se especificaron
        let participantes: Colaborador[] = [];
        if (createDto.participantesIds && createDto.participantesIds.length > 0) {
            participantes = await this.colaboradoresRepository.find({
                where: { id: In(createDto.participantesIds) },
            });

            if (participantes.length !== createDto.participantesIds.length) {
                throw new NotFoundException('Algunos colaboradores no fueron encontrados');
            }

            // Verificar capacidad
            if (participantes.length > createDto.capacidadMaxima) {
                throw new BadRequestException(
                    `La cantidad de participantes (${participantes.length}) excede la capacidad máxima (${createDto.capacidadMaxima})`,
                );
            }
        }

        // Crear sesión
        const sesion = this.sesionesRepository.create({
            ...createDto,
            tipo,
            participantes,
            creadoPor: user,
            actualizadoPor: user,
        });

        return await this.sesionesRepository.save(sesion);
    }

    async getTipos(): Promise<OnboardingTipo[]> {
        return await this.tiposRepository.find({
            where: { activo: true },
            order: { nombre: 'ASC' },
        });
    }

    async findAll(filterDto: FilterSesionDto): Promise<PaginatedSesionesResponse> {
        const {
            tipoId,
            estado,
            fechaDesde,
            fechaHasta,
            activo,
            page,
            limit,
        } = filterDto;

        const where: FindOptionsWhere<OnboardingSesion> = {};

        // Filtros
        if (tipoId) where.tipo = { id: tipoId };
        if (estado) where.estado = estado;
        if (activo !== undefined) where.activo = activo;

        // Filtro por rango de fechas
        if (fechaDesde && fechaHasta) {
            where.fechaInicio = Between(fechaDesde, fechaHasta);
        } else if (fechaDesde) {
            where.fechaInicio = Between(fechaDesde, new Date());
        } else if (fechaHasta) {
            where.fechaInicio = Between(new Date('2000-01-01'), fechaHasta);
        }

        // Calcular skip para paginación
        const skip = (page - 1) * limit;

        // Ejecutar query
        const [sesiones, total] = await this.sesionesRepository.findAndCount({
            where,
            relations: [
                'tipo',
                'participantes',
                'creadoPor',
                'actualizadoPor',
            ],
            order: { fechaInicio: 'ASC' },
            skip,
            take: limit,
        });

        const totalPages = Math.ceil(total / limit);

        return {
            data: sesiones as SesionWithRelations[],
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    async findOne(id: string): Promise<SesionWithRelations> {
        const sesion = await this.sesionesRepository.findOne({
            where: { id },
            relations: [
                'tipo',
                'participantes',
                'creadoPor',
                'actualizadoPor',
            ],
        });

        if (!sesion) {
            throw new NotFoundException(`Sesión con ID ${id} no encontrada`);
        }

        return sesion as SesionWithRelations;
    }

    async update(
        id: string,
        updateDto: UpdateSesionDto,
        user: User,
    ): Promise<OnboardingSesion> {
        const sesion = await this.sesionesRepository.findOne({
            where: { id },
            relations: ['participantes'],
        });

        if (!sesion) {
            throw new NotFoundException(`Sesión con ID ${id} no encontrada`);
        }

        // Validar fechas si se actualizan
        if (updateDto.fechaInicio && updateDto.fechaFin) {
            if (updateDto.fechaInicio > updateDto.fechaFin) {
                throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
            }
        }

        // Actualizar tipo si se especifica
        if (updateDto.tipoId) {
            const tipo = await this.tiposRepository.findOne({
                where: { id: updateDto.tipoId, activo: true },
            });

            if (!tipo) {
                throw new NotFoundException('Tipo de onboarding no encontrado');
            }

            sesion.tipo = tipo;
            delete updateDto.tipoId;
        }

        // Actualizar participantes si se especifican
        if (updateDto.participantesIds) {
            const participantes = await this.colaboradoresRepository.find({
                where: { id: In(updateDto.participantesIds) },
            });

            if (participantes.length !== updateDto.participantesIds.length) {
                throw new NotFoundException('Algunos colaboradores no fueron encontrados');
            }

            // Verificar capacidad
            const capacidad = updateDto.capacidadMaxima || sesion.capacidadMaxima;
            if (participantes.length > capacidad) {
                throw new BadRequestException(
                    `La cantidad de participantes (${participantes.length}) excede la capacidad máxima (${capacidad})`,
                );
            }

            sesion.participantes = participantes;
            delete updateDto.participantesIds;
        }

        // Actualizar sesión
        Object.assign(sesion, updateDto);
        sesion.actualizadoPor = user;

        return await this.sesionesRepository.save(sesion);
    }

    async remove(id: string): Promise<void> {
        const result = await this.sesionesRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Sesión con ID ${id} no encontrada`);
        }
    }

    async agregarParticipantes(
        id: string,
        agregarDto: AgregarParticipanteDto,
        user: User,
    ): Promise<OnboardingSesion> {
        const sesion = await this.sesionesRepository.findOne({
            where: { id },
            relations: ['participantes'],
        });

        if (!sesion) {
            throw new NotFoundException(`Sesión con ID ${id} no encontrada`);
        }

        // Buscar colaboradores
        const nuevosParticipantes = await this.colaboradoresRepository.find({
            where: { id: In(agregarDto.colaboradoresIds) },
        });

        if (nuevosParticipantes.length !== agregarDto.colaboradoresIds.length) {
            throw new NotFoundException('Algunos colaboradores no fueron encontrados');
        }

        // Verificar que no estén ya inscritos
        const participantesActuales = sesion.participantes.map(p => p.id);
        const duplicados = nuevosParticipantes.filter(p =>
            participantesActuales.includes(p.id)
        );

        if (duplicados.length > 0) {
            throw new ConflictException(
                `Algunos colaboradores ya están inscritos: ${duplicados.map(p => p.nombreCompleto).join(', ')}`,
            );
        }

        // Verificar capacidad
        const totalParticipantes = sesion.participantes.length + nuevosParticipantes.length;
        if (totalParticipantes > sesion.capacidadMaxima) {
            throw new BadRequestException(
                `No hay suficiente capacidad. Capacidad máxima: ${sesion.capacidadMaxima}, Actual: ${sesion.participantes.length}, Nuevos: ${nuevosParticipantes.length}`,
            );
        }

        // Agregar participantes
        sesion.participantes = [...sesion.participantes, ...nuevosParticipantes];
        sesion.actualizadoPor = user;

        return await this.sesionesRepository.save(sesion);
    }

    async removerParticipante(
        sesionId: string,
        colaboradorId: string,
        user: User,
    ): Promise<OnboardingSesion> {
        const sesion = await this.sesionesRepository.findOne({
            where: { id: sesionId },
            relations: ['participantes'],
        });

        if (!sesion) {
            throw new NotFoundException(`Sesión con ID ${sesionId} no encontrada`);
        }

        // Filtrar el participante
        const participantesActualizados = sesion.participantes.filter(
            p => p.id !== colaboradorId,
        );

        if (participantesActualizados.length === sesion.participantes.length) {
            throw new NotFoundException(`Colaborador no encontrado en la sesión`);
        }

        sesion.participantes = participantesActualizados;
        sesion.actualizadoPor = user;

        return await this.sesionesRepository.save(sesion);
    }

    async cambiarEstado(
        id: string,
        estado: EstadoSesion,
        user: User,
    ): Promise<OnboardingSesion> {
        const sesion = await this.sesionesRepository.findOne({
            where: { id },
        });

        if (!sesion) {
            throw new NotFoundException(`Sesión con ID ${id} no encontrada`);
        }

        sesion.estado = estado;
        sesion.actualizadoPor = user;

        return await this.sesionesRepository.save(sesion);
    }

    async getStats(): Promise<SesionStats> {
        const queryBuilder = this.sesionesRepository.createQueryBuilder('sesion');

        // Estadísticas generales
        const total = await queryBuilder.getCount();

        // Estadísticas por estado
        const programadas = await queryBuilder
            .where('sesion.estado = :estado', { estado: EstadoSesion.PROGRAMADA })
            .getCount();

        const enCurso = await queryBuilder
            .where('sesion.estado = :estado', { estado: EstadoSesion.EN_CURSO })
            .getCount();

        const completadas = await queryBuilder
            .where('sesion.estado = :estado', { estado: EstadoSesion.COMPLETADA })
            .getCount();

        const canceladas = await queryBuilder
            .where('sesion.estado = :estado', { estado: EstadoSesion.CANCELADA })
            .getCount();

        // Capacidad y participantes
        const capacidadResult = await queryBuilder
            .select('SUM(sesion.capacidadMaxima)', 'capacidadTotal')
            .getRawOne();

        const participantesQuery = this.sesionesRepository
            .createQueryBuilder('sesion')
            .leftJoin('sesion.participantes', 'participante')
            .select('COUNT(participante.id)', 'participantesTotales')
            .getRawOne();

        const [participantesResult] = await Promise.all([participantesQuery]);

        // Estadísticas por tipo
        const tiposStats = await this.sesionesRepository
            .createQueryBuilder('sesion')
            .leftJoin('sesion.tipo', 'tipo')
            .select('tipo.nombre', 'tipo')
            .addSelect('tipo.color', 'color')
            .addSelect('COUNT(sesion.id)', 'count')
            .groupBy('tipo.id')
            .getRawMany();

        return {
            total,
            programadas,
            enCurso,
            completadas,
            canceladas,
            capacidadDisponible: parseInt(capacidadResult?.capacidadTotal || '0'),
            participantesTotales: parseInt(participantesResult?.participantesTotales || '0'),
            porTipo: tiposStats.map(t => ({
                tipo: t.tipo,
                count: parseInt(t.count),
                color: t.color,
            })),
        };
    }

    async getSesionesPorMes(año: number, mes: number): Promise<OnboardingSesion[]> {
        const fechaInicio = new Date(año, mes - 1, 1);
        const fechaFin = new Date(año, mes, 0); // Último día del mes

        return await this.sesionesRepository.find({
            where: {
                fechaInicio: Between(fechaInicio, fechaFin),
                activo: true,
            },
            relations: ['tipo', 'participantes'],
            order: { fechaInicio: 'ASC' },
        });
    }

    async getProximasSesiones(limite: number = 5): Promise<OnboardingSesion[]> {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        return await this.sesionesRepository.find({
            where: {
                fechaInicio: Between(hoy, new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)), // Próximos 30 días
                activo: true,
                estado: EstadoSesion.PROGRAMADA,
            },
            relations: ['tipo'],
            order: { fechaInicio: 'ASC' },
            take: limite,
        });
    }
}