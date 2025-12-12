import { IsOptional, IsEnum, IsDate, IsUUID, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoSesion } from '../entities/onboarding-sesion.entity';

export class FilterSesionDto {
    @ApiProperty({
        description: 'Filtrar por tipo de onboarding',
        example: 'uuid-del-tipo',
        required: false,
    })
    @IsUUID()
    @IsOptional()
    tipoId?: string;

    @ApiProperty({
        description: 'Filtrar por estado',
        enum: EstadoSesion,
        required: false,
    })
    @IsEnum(EstadoSesion)
    @IsOptional()
    estado?: EstadoSesion;

    @ApiProperty({
        description: 'Filtrar por fecha desde',
        example: '2024-01-01',
        required: false,
    })
    @IsDate()
    @Type(() => String)
    @IsOptional()
    fechaDesde?: string;

    @ApiProperty({
        description: 'Filtrar por fecha hasta',
        example: '2024-12-31',
        required: false,
    })
    @IsDate()
    @Type(() => String)
    @IsOptional()
    fechaHasta?: string;

    @ApiProperty({
        description: 'Filtrar por sesiones activas',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    activo?: boolean;

    @ApiProperty({
        description: 'Página para paginación',
        example: 1,
        default: 1,
    })
    @IsInt()
    @Type(() => Number)
    page: number = 1;

    @ApiProperty({
        description: 'Límite de resultados por página',
        example: 10,
        default: 10,
    })
    @IsInt()
    @Type(() => Number)
    limit: number = 10;
}
