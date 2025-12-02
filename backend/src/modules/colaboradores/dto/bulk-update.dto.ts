import { IsArray, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoOnboarding } from '../entities/colaborador.entity';

export class BulkUpdateDto {
    @ApiProperty({
        description: 'IDs de los colaboradores a actualizar',
        example: ['uuid-1', 'uuid-2'],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    ids: string[];

    @ApiProperty({
        description: 'Nuevo estado de bienvenida (opcional)',
        enum: EstadoOnboarding,
        required: false,
    })
    @IsEnum(EstadoOnboarding)
    @IsOptional()
    estadoBienvenida?: EstadoOnboarding;

    @ApiProperty({
        description: 'Nuevo estado técnico (opcional)',
        enum: EstadoOnboarding,
        required: false,
    })
    @IsEnum(EstadoOnboarding)
    @IsOptional()
    estadoTecnico?: EstadoOnboarding;

    @ApiProperty({
        description: 'Estado activo/inactivo (opcional)',
        example: true,
        required: false,
    })
    @IsOptional()
    activo?: boolean;
}