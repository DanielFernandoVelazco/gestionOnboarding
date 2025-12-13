import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, In, MoreThanOrEqual } from 'typeorm';
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
import { parse } from 'date-fns'; // <-- CAMBIO: Importar la función parse de date-fns

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
        // <-- CAMBIO: Validar que fechaFin exista
        if (!createDto.fechaFin) {
            throw new BadRequestException('La fecha de fin es requerida');
        }

        // <-- CAMBIO: Parsear las fechas de string a Date (hora local)
        const fechaInicioDate = parse(createDto.fechaInicio, 'yyyy-MM-dd', new Date());
        const fechaFinDate = parse(createDto.fechaFin, 'yyyy-MM-dd', new Date());

        // Validar fechas usando los objetos Date ya parseados
        if (fechaFinDate && fechaInicioDate > fechaFinDate) {
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
            // <-- CAMBIO: Usar los objetos Date parseados
            fechaInicio: fechaInicioDate,
            fechaFin: fechaFinDate,
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

        // <-- CAMBIO: Parsear las fechas del filtro si existen
        let fechaDesdeDate: Date | undefined;
        let fechaHastaDate: Date | undefined;

        if (fechaDesde) {
            fechaDesdeDate = parse(fechaDesde, 'yyyy-MM-dd', new Date());
        }
        if (fechaHasta) {
            fechaHastaDate = parse(fechaHasta, 'yyyy-MM-dd', new Date());
        }

        // Filtro por rango de fechas usando los objetos Date parseados
        if (fechaDesdeDate && fechaHastaDate) {
            where.fechaInicio = Between(fechaDesdeDate, fechaHastaDate);
        } else if (fechaDesdeDate) {
            where.fechaInicio = Between(fechaDesdeDate, new Date());
        } else if (fechaHastaDate) {
            where.fechaInicio = Between(new Date('2000-01-01'), fechaHastaDate);
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

        // <-- CAMBIO: Crear un objeto de actualización separado y con tipos correctos
        const datosParaActualizar: Partial<OnboardingSesion> = {};

        // Parsear y añadir fechas si se proporcionan
        if (updateDto.fechaInicio) {
            datosParaActualizar.fechaInicio = parse(updateDto.fechaInicio, 'yyyy-MM-dd', new Date());
        }
        if (updateDto.fechaFin) {
            datosParaActualizar.fechaFin = parse(updateDto.fechaFin, 'yyyy-MM-dd', new Date());
        }

        // Validar fechas si ambas se actualizan
        if (datosParaActualizar.fechaInicio && datosParaActualizar.fechaFin) {
            if (datosParaActualizar.fechaInicio > datosParaActualizar.fechaFin) {
                throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
            }
        }

        // Añadir otros campos simples
        if (updateDto.titulo) datosParaActualizar.titulo = updateDto.titulo;
        if (updateDto.descripcion !== undefined) datosParaActualizar.descripcion = updateDto.descripcion;
        if (updateDto.estado) datosParaActualizar.estado = updateDto.estado;
        if (updateDto.capacidadMaxima) datosParaActualizar.capacidadMaxima = updateDto.capacidadMaxima;
        if (updateDto.ubicacion !== undefined) datosParaActualizar.ubicacion = updateDto.ubicacion;
        if (updateDto.enlaceVirtual !== undefined) datosParaActualizar.enlaceVirtual = updateDto.enlaceVirtual;
        if (updateDto.notas !== undefined) datosParaActualizar.notas = updateDto.notas;

        // Actualizar tipo si se especifica
        if (updateDto.tipoId) {
            const tipo = await this.tiposRepository.findOne({
                where: { id: updateDto.tipoId, activo: true },
            });

            if (!tipo) {
                throw new NotFoundException('Tipo de onboarding no encontrado');
            }
            sesion.tipo = tipo;
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
        }

        // Actualizar sesión con el payload modificado
        Object.assign(sesion, datosParaActualizar);
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
        // Estos métodos crean fechas desde números, no desde strings, por lo que no necesitan parseo.
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

        const whereClause = {
            fechaInicio: MoreThanOrEqual(hoy),
            activo: true,
            estado: EstadoSesion.PROGRAMADA,
        };

        const sesiones = await this.sesionesRepository.find({
            where: whereClause,
            relations: ['tipo'],
            order: { fechaInicio: 'ASC' },
            take: limite,
        });

        return sesiones;
    }
}