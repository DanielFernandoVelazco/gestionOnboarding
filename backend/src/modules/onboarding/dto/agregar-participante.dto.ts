import { IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AgregarParticipanteDto {
    @ApiProperty({
        description: 'IDs de los colaboradores a agregar',
        example: ['uuid-1', 'uuid-2'],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    colaboradoresIds: string[];
}