import { IsOptional, IsString, IsEnum, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoOnboarding, LugarAsignacion } from '../entities/colaborador.entity';

export class FilterColaboradorDto {
    @ApiProperty({
        description: 'Buscar por nombre o email',
        example: 'Ana',
        required: false,
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({
        description: 'Filtrar por estado de bienvenida',
        enum: EstadoOnboarding,
        required: false,
    })
    @IsEnum(EstadoOnboarding)
    @IsOptional()
    estadoBienvenida?: EstadoOnboarding;

    @ApiProperty({
        description: 'Filtrar por estado técnico',
        enum: EstadoOnboarding,
        required: false,
    })
    @IsEnum(EstadoOnboarding)
    @IsOptional()
    estadoTecnico?: EstadoOnboarding;

    @ApiProperty({
        description: 'Filtrar por lugar de asignación',
        enum: LugarAsignacion,
        required: false,
    })
    @IsEnum(LugarAsignacion)
    @IsOptional()
    lugarAsignacion?: LugarAsignacion;

    @ApiProperty({
        description: 'Filtrar por departamento',
        example: 'Tecnología',
        required: false,
    })
    @IsString()
    @IsOptional()
    departamento?: string;

    @ApiProperty({
        description: 'Filtrar por colaboradores activos/inactivos',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    activo?: boolean;

    @ApiProperty({
        description: 'Filtrar por fecha de ingreso desde',
        example: '2024-01-01',
        required: false,
    })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    fechaDesde?: Date;

    @ApiProperty({
        description: 'Filtrar por fecha de ingreso hasta',
        example: '2024-12-31',
        required: false,
    })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    fechaHasta?: Date;

    @ApiProperty({
        description: 'Página para paginación',
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @ApiProperty({
        description: 'Límite de resultados por página',
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @ApiProperty({
        description: 'Campo para ordenar',
        example: 'nombreCompleto',
        required: false,
    })
    @IsString()
    @IsOptional()
    sortBy?: string = 'createdAt';

    @ApiProperty({
        description: 'Dirección del orden (ASC o DESC)',
        example: 'DESC',
        required: false,
    })
    @IsString()
    @IsOptional()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}