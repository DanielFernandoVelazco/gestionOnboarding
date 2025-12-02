import {
    IsString,
    IsDate,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsUUID,
    IsInt,
    Min,
    Max,
    IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoSesion } from '../entities/onboarding-sesion.entity';

export class CreateSesionDto {
    @ApiProperty({ description: 'Título de la sesión', example: 'Journey to Cloud - Cohort 1' })
    @IsString()
    titulo: string;

    @ApiProperty({
        description: 'Descripción de la sesión (opcional)',
        example: 'Sesión de onboarding para desarrolladores Cloud',
        required: false,
    })
    @IsString()
    @IsOptional()
    descripcion?: string;

    @ApiProperty({
        description: 'ID del tipo de onboarding',
        example: 'uuid-del-tipo-onboarding',
    })
    @IsUUID()
    tipoId: string;

    @ApiProperty({ description: 'Fecha de inicio', example: '2024-07-16' })
    @IsDate()
    @Type(() => Date)
    fechaInicio: Date;

    @ApiProperty({
        description: 'Fecha de fin',
        example: '2024-07-18',
        required: false,
    })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    fechaFin?: Date;

    @ApiProperty({
        description: 'Estado de la sesión',
        enum: EstadoSesion,
        default: EstadoSesion.PROGRAMADA,
    })
    @IsEnum(EstadoSesion)
    @IsOptional()
    estado?: EstadoSesion = EstadoSesion.PROGRAMADA;

    @ApiProperty({
        description: 'Capacidad máxima de participantes',
        example: 20,
        default: 1,
    })
    @IsInt()
    @Min(1)
    @Max(100)
    capacidadMaxima: number = 1;

    @ApiProperty({
        description: 'Ubicación física (opcional)',
        example: 'Sala de Conferencias A',
        required: false,
    })
    @IsString()
    @IsOptional()
    ubicacion?: string;

    @ApiProperty({
        description: 'Enlace virtual (opcional)',
        example: 'https://meet.google.com/abc-defg-hij',
        required: false,
    })
    @IsString()
    @IsOptional()
    enlaceVirtual?: string;

    @ApiProperty({
        description: 'Notas adicionales (opcional)',
        example: 'Traer laptop con Docker instalado',
        required: false,
    })
    @IsString()
    @IsOptional()
    notas?: string;

    @ApiProperty({
        description: 'IDs de participantes (opcional)',
        example: ['uuid-1', 'uuid-2'],
        required: false,
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    participantesIds?: string[];
}
