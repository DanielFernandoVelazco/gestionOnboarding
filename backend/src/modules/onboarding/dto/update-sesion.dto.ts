import { PartialType } from '@nestjs/mapped-types';
import { CreateSesionDto } from './create-sesion.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSesionDto extends PartialType(CreateSesionDto) { }