import {
    IsString,
    IsDate,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TipoEvento } from '../entities/evento-calendario.entity';

export class CreateEventoDto {
    @ApiProperty({
        description: 'Título del evento',
        example: 'Reunión de planificación',
    })
    @IsString()
    titulo: string;

    @ApiProperty({
        description: 'Descripción del evento (opcional)',
        example: 'Reunión para planificar próximos onboardings',
        required: false,
    })
    @IsString()
    @IsOptional()
    descripcion?: string;

    @ApiProperty({
        description: 'Tipo de evento',
        enum: TipoEvento,
        default: TipoEvento.OTRO,
    })
    @IsEnum(TipoEvento)
    @IsOptional()
    tipo?: TipoEvento;

    @ApiProperty({
        description: 'Fecha de inicio',
        example: '2024-07-16',
    })
    @IsDate()
    @Type(() => Date)
    fechaInicio: Date;

    @ApiProperty({
        description: 'Fecha de fin (opcional)',
        example: '2024-07-16',
        required: false,
    })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    fechaFin?: Date;

    @ApiProperty({
        description: 'Evento de todo el día',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    todoElDia?: boolean = false;

    @ApiProperty({
        description: 'Color del evento en formato hexadecimal',
        example: '#00448D',
    })
    @IsString()
    color: string;

    @ApiProperty({
        description: 'ID de la sesión relacionada (opcional)',
        example: 'uuid-de-la-sesion',
        required: false,
    })
    @IsUUID()
    @IsOptional()
    sesionId?: string;
}