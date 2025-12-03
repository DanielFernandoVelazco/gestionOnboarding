import { PartialType } from '@nestjs/mapped-types';
import { CreateEventoDto } from './create-evento.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEventoDto extends PartialType(CreateEventoDto) { }