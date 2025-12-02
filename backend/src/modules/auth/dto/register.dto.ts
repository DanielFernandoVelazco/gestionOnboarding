import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        description: 'Nombre completo del usuario',
        example: 'Ana García',
    })
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @ApiProperty({
        description: 'Email del usuario',
        example: 'ana.garcia@empresa.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Contraseña del usuario',
        example: 'Password123',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({
        description: 'URL del avatar del usuario (opcional)',
        example: 'https://example.com/avatar.jpg',
        required: false,
    })
    @IsString()
    @IsOptional()
    avatarUrl?: string;
}