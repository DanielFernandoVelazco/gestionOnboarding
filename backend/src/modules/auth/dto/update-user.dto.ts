import { PartialType } from '@nestjs/mapped-types';
import { RegisterDto } from './register.dto';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(RegisterDto) {
    @ApiProperty({
        description: 'Estado activo/inactivo del usuario',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({
        description: 'Rol del usuario',
        example: 'admin',
        required: false,
    })
    @IsString()
    @IsOptional()
    rol?: string;
}