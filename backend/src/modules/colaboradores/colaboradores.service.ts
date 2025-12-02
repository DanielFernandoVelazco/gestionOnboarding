import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere, In } from 'typeorm';
import { Colaborador, EstadoOnboarding } from './entities/colaborador.entity';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { UpdateColaboradorDto } from './dto/update-colaborador.dto';
import { FilterColaboradorDto } from './dto/filter-colaborador.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { User } from '../auth/entities/user.entity';
import { OnboardingTipo } from 'src/modules/onboarding/entities/onboarding-tipo.entity';
import {
    PaginatedResponse,
    ColaboradorWithRelations,
    StatsResponse,
} from './interfaces/colaborador-response.interface';

@Injectable()
export class ColaboradoresService {
    constructor(
        @InjectRepository(Colaborador)
        private colaboradoresRepository: Repository<Colaborador>,
        @InjectRepository(OnboardingTipo)
        private onboardingTipoRepository: Repository<OnboardingTipo>,
    ) { }

    async create(
        createDto: CreateColaboradorDto,
        user: User,
    ): Promise<Colaborador> {
        // Verificar si el email ya existe
        const existingColaborador = await this.colaboradoresRepository.findOne({
            where: { email: createDto.email },
        });

        if (existingColaborador) {
            throw new ConflictException('El email ya está registrado');
        }

        // Buscar tipo de onboarding si se especificó
        let tipoOnboardingTecnico: OnboardingTipo | null = null;
        if (createDto.tipoOnboardingTecnicoId) {
            tipoOnboardingTecnico = await this.onboardingTipoRepository.findOne({
                where: { id: createDto.tipoOnboardingTecnicoId },
            });

            if (!tipoOnboardingTecnico) {
                throw new NotFoundException('Tipo de onboarding no encontrado');
            }
        }

        // Crear nuevo colaborador
        const colaborador = this.colaboradoresRepository.create({
            ...createDto,
            ...(tipoOnboardingTecnico && { tipoOnboardingTecnico }),
            creadoPor: user,
            actualizadoPor: user,
        });

        return await this.colaboradoresRepository.save(colaborador);
    }

    async findAll(
        filterDto: FilterColaboradorDto,
    ): Promise<PaginatedResponse<ColaboradorWithRelations>> {
        const {
            search,
            estadoBienvenida,
            estadoTecnico,
            departamento,
            activo,
            fechaDesde,
            fechaHasta,
            // CORRECCIÓN: Asignamos valores por defecto para evitar 'undefined'
            page = 1,
            limit = 10,
            sortBy = 'createdAt', // Asegúrate de que este campo exista en tu entidad, o usa 'fechaIngreso'
            sortOrder = 'DESC',
        } = filterDto;

        const where: FindOptionsWhere<Colaborador> = {};

        // Filtros básicos
        if (estadoBienvenida) where.estadoBienvenida = estadoBienvenida;
        if (estadoTecnico) where.estadoTecnico = estadoTecnico;
        if (departamento) where.departamento = departamento;
        if (activo !== undefined) where.activo = activo;

        // Filtro por rango de fechas
        if (fechaDesde && fechaHasta) {
            where.fechaIngreso = Between(fechaDesde, fechaHasta);
        } else if (fechaDesde) {
            where.fechaIngreso = Between(fechaDesde, new Date());
        } else if (fechaHasta) {
            where.fechaIngreso = Between(new Date('2000-01-01'), fechaHasta);
        }

        // Búsqueda por nombre o email
        if (search) {
            where.nombreCompleto = Like(`%${search}%`);
        }

        // Calcular skip para paginación
        // Al tener valores por defecto arriba, page y limit ya son números garantizados
        const skip = (page - 1) * limit;

        // Ejecutar query con relaciones
        const [colaboradores, total] = await this.colaboradoresRepository.findAndCount({
            where,
            relations: [
                'tipoOnboardingTecnico',
                'creadoPor',
                'actualizadoPor',
            ],
            order: { [sortBy]: sortOrder },
            skip,
            take: limit,
        });

        const totalPages = Math.ceil(total / limit);

        return {
            data: colaboradores as ColaboradorWithRelations[],
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

    async findOne(id: string): Promise<ColaboradorWithRelations> {
        const colaborador = await this.colaboradoresRepository.findOne({
            where: { id },
            relations: [
                'tipoOnboardingTecnico',
                'creadoPor',
                'actualizadoPor',
            ],
        });

        if (!colaborador) {
            throw new NotFoundException(`Colaborador con ID ${id} no encontrado`);
        }

        return colaborador as ColaboradorWithRelations;
    }

    async update(
        id: string,
        updateDto: UpdateColaboradorDto,
        user: User,
    ): Promise<Colaborador> {
        const colaborador = await this.colaboradoresRepository.findOne({
            where: { id },
        });

        if (!colaborador) {
            throw new NotFoundException(`Colaborador con ID ${id} no encontrado`);
        }

        // Verificar si se cambió el email y ya existe
        if (updateDto.email && updateDto.email !== colaborador.email) {
            const existingColaborador = await this.colaboradoresRepository.findOne({
                where: { email: updateDto.email },
            });

            if (existingColaborador) {
                throw new ConflictException('El email ya está registrado');
            }
        }

        // Buscar tipo de onboarding si se especificó
        if (updateDto.tipoOnboardingTecnicoId) {
            const tipoOnboardingTecnico = await this.onboardingTipoRepository.findOne({
                where: { id: updateDto.tipoOnboardingTecnicoId },
            });

            if (!tipoOnboardingTecnico) {
                throw new NotFoundException('Tipo de onboarding no encontrado');
            }

            colaborador.tipoOnboardingTecnico = tipoOnboardingTecnico;
            delete updateDto.tipoOnboardingTecnicoId;
        }

        // Actualizar colaborador
        Object.assign(colaborador, updateDto);
        colaborador.actualizadoPor = user;

        return await this.colaboradoresRepository.save(colaborador);
    }

    async remove(id: string): Promise<void> {
        const result = await this.colaboradoresRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Colaborador con ID ${id} no encontrado`);
        }
    }

    async bulkUpdate(bulkUpdateDto: BulkUpdateDto, user: User): Promise<void> {
        const { ids, estadoBienvenida, estadoTecnico, activo } = bulkUpdateDto;

        if (ids.length === 0) {
            throw new BadRequestException('Debe proporcionar al menos un ID');
        }

        const updateData: any = { actualizadoPor: user };

        if (estadoBienvenida !== undefined) updateData.estadoBienvenida = estadoBienvenida;
        if (estadoTecnico !== undefined) updateData.estadoTecnico = estadoTecnico;
        if (activo !== undefined) updateData.activo = activo;

        await this.colaboradoresRepository.update(
            { id: In(ids) },
            updateData,
        );
    }

    async getStats(): Promise<StatsResponse> {
        const queryBuilder = this.colaboradoresRepository.createQueryBuilder('colaborador');

        // Estadísticas generales
        const total = await queryBuilder.getCount();
        const activos = await queryBuilder
            .where('colaborador.activo = :activo', { activo: true })
            .getCount();

        // Estadísticas por estado
        const completadosBienvenida = await queryBuilder
            .where('colaborador.estadoBienvenida = :estado', {
                estado: EstadoOnboarding.COMPLETADO,
            })
            .getCount();

        const completadosTecnico = await queryBuilder
            .where('colaborador.estadoTecnico = :estado', {
                estado: EstadoOnboarding.COMPLETADO,
            })
            .getCount();

        const pendientesBienvenida = await queryBuilder
            .where('colaborador.estadoBienvenida = :estado', {
                estado: EstadoOnboarding.PENDIENTE,
            })
            .getCount();

        const pendientesTecnico = await queryBuilder
            .where('colaborador.estadoTecnico = :estado', {
                estado: EstadoOnboarding.PENDIENTE,
            })
            .getCount();

        // Estadísticas por departamento
        const departamentos = await queryBuilder
            .select('colaborador.departamento', 'departamento')
            .addSelect('COUNT(colaborador.id)', 'count')
            .where('colaborador.departamento IS NOT NULL')
            .groupBy('colaborador.departamento')
            .orderBy('count', 'DESC')
            .getRawMany();

        return {
            total,
            activos,
            completadosBienvenida,
            completadosTecnico,
            pendientesBienvenida,
            pendientesTecnico,
            porDepartamento: departamentos.map((d) => ({
                departamento: d.departamento,
                count: parseInt(d.count),
            })),
        };
    }

    async getByEmail(email: string): Promise<Colaborador> {
        const colaborador = await this.colaboradoresRepository.findOne({
            where: { email },
        });

        if (!colaborador) {
            throw new NotFoundException(`Colaborador con email ${email} no encontrado`);
        }

        return colaborador;
    }

    async updateEstado(
        id: string,
        tipo: 'bienvenida' | 'tecnico',
        estado: EstadoOnboarding,
        user: User,
    ): Promise<Colaborador> {
        const colaborador = await this.colaboradoresRepository.findOne({
            where: { id },
        });

        if (!colaborador) {
            throw new NotFoundException(`Colaborador con ID ${id} no encontrado`);
        }

        if (tipo === 'bienvenida') {
            colaborador.estadoBienvenida = estado;
        } else if (tipo === 'tecnico') {
            colaborador.estadoTecnico = estado;
        }

        colaborador.actualizadoPor = user;

        return await this.colaboradoresRepository.save(colaborador);
    }
}