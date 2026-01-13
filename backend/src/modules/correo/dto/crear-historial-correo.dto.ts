import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CrearHistorialCorreoDto {
    @IsEmail()
    destinatario: string;

    @IsString()
    asunto: string;

    @IsOptional()
    @IsString()
    cuerpo?: string;

    @IsOptional()
    @IsBoolean()
    enviado?: boolean = true;

    @IsOptional()
    @IsString()
    error?: string;

    @IsOptional()
    @IsString()
    tipo?: string;

    @IsOptional()
    metadata?: any;
}