import { PartialType } from '@nestjs/mapped-types';
import { CreateSesionDto } from './create-sesion.dto';

export class UpdateSesionDto extends PartialType(CreateSesionDto) { }