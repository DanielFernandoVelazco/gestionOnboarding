import {
    IsString,
    IsEmail,
    IsDate,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsUUID,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoOnboarding, LugarAsignacion } from '../entities/colaborador.entity';

export class CreateColaboradorDto {
    @ApiProperty({
        description: 'Nombre completo del colaborador',
        example: 'Ana García Pérez',
    })
    @IsString()
    @MinLength(3)
    @MaxLength(150)
    nombreCompleto: string;

    @ApiProperty({
        description: 'Email del colaborador',
        example: 'ana.garcia@example.com',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Teléfono del colaborador (opcional)',
        example: '+1 234 567 890',
        required: false,
    })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    telefono?: string;

    @ApiProperty({
        description: 'Departamento del colaborador (opcional)',
        example: 'Tecnología',
        required: false,
    })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    departamento?: string;

    @ApiProperty({
        description: 'Puesto del colaborador (opcional)',
        example: 'Desarrollador Frontend',
        required: false,
    })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    puesto?: string;

    @ApiProperty({
        description: 'Fecha de ingreso del colaborador',
        example: '2024-08-15',
    })
    @IsDate()
    @Type(() => Date)
    fechaIngreso: Date;

    @ApiProperty({
        description: 'Estado del onboarding de bienvenida',
        enum: EstadoOnboarding,
        default: EstadoOnboarding.PENDIENTE,
    })
    @IsEnum(EstadoOnboarding)
    @IsOptional()
    estadoBienvenida?: EstadoOnboarding;

    @ApiProperty({
        description: 'Estado del onboarding técnico',
        enum: EstadoOnboarding,
        default: EstadoOnboarding.PENDIENTE,
    })
    @IsEnum(EstadoOnboarding)
    @IsOptional()
    estadoTecnico?: EstadoOnboarding;

    @ApiProperty({
        description: 'Fecha del onboarding técnico (opcional)',
        example: '2024-08-22',
        required: false,
    })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    fechaOnboardingTecnico?: Date;

    @ApiProperty({
        description: 'ID del tipo de onboarding técnico (opcional)',
        example: 'uuid-del-tipo-onboarding',
        required: false,
    })
    @IsUUID()
    @IsOptional()
    tipoOnboardingTecnicoId?: string;

    @ApiProperty({
        description: 'Notas adicionales (opcional)',
        example: 'Colaborador nuevo con experiencia en React',
        required: false,
    })
    @IsString()
    @IsOptional()
    notas?: string;

    @ApiProperty({
        description: 'Estado activo/inactivo',
        example: true,
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    activo?: boolean;

    @ApiProperty({
        description: 'Fecha en que se asignó el onboarding técnico (opcional)',
        example: '2024-08-20',
        required: false,
    })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    fechaAsignacionOnboarding?: Date;

    @ApiProperty({
        description: 'Lugar de asignación del onboarding técnico (opcional)',
        enum: LugarAsignacion,
        required: false,
    })
    @IsOptional()
    @IsEnum(LugarAsignacion)
    lugarAsignacion?: LugarAsignacion;
}