import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { CalendarioService } from './calendario.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TipoEvento } from './entities/evento-calendario.entity';

@ApiTags('calendario')
@Controller('calendario')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarioController {
    constructor(private readonly calendarioService: CalendarioService) { }

    @Post('eventos')
    @ApiOperation({ summary: 'Crear un nuevo evento en el calendario' })
    @ApiResponse({ status: 201, description: 'Evento creado exitosamente' })
    async create(@Body() createDto: CreateEventoDto, @Request() req) {
        return this.calendarioService.create(createDto, req.user);
    }

    @Get('eventos')
    @ApiOperation({ summary: 'Obtener todos los eventos' })
    @ApiQuery({ name: 'fechaDesde', required: false, type: Date })
    @ApiQuery({ name: 'fechaHasta', required: false, type: Date })
    @ApiQuery({ name: 'tipo', required: false, enum: TipoEvento })
    async findAll(
        @Query('fechaDesde') fechaDesde?: Date,
        @Query('fechaHasta') fechaHasta?: Date,
        @Query('tipo') tipo?: TipoEvento,
    ) {
        return this.calendarioService.findAll(fechaDesde, fechaHasta, tipo);
    }

    @Get('eventos/proximos')
    @ApiOperation({ summary: 'Obtener próximos eventos' })
    @ApiQuery({ name: 'limite', required: false, type: Number, default: 10 })
    async getProximos(@Query('limite') limite: number) {
        return this.calendarioService.getEventosProximos(limite);
    }

    @Get('eventos/tipo/:tipo')
    @ApiOperation({ summary: 'Obtener eventos por tipo' })
    async getPorTipo(@Param('tipo') tipo: TipoEvento) {
        return this.calendarioService.getEventosPorTipo(tipo);
    }

    @Get('mes/:año/:mes')
    @ApiOperation({ summary: 'Obtener calendario mensual con eventos y sesiones' })
    async getMesCalendario(
        @Param('año') año: number,
        @Param('mes') mes: number,
    ) {
        return this.calendarioService.getMesCalendario(año, mes);
    }

    @Get('eventos/:id')
    @ApiOperation({ summary: 'Obtener un evento por ID' })
    @ApiResponse({ status: 200, description: 'Evento encontrado' })
    @ApiResponse({ status: 404, description: 'Evento no encontrado' })
    async findOne(@Param('id') id: string) {
        return this.calendarioService.findOne(id);
    }

    @Put('eventos/:id')
    @ApiOperation({ summary: 'Actualizar un evento' })
    @ApiResponse({ status: 200, description: 'Evento actualizado exitosamente' })
    @ApiResponse({ status: 404, description: 'Evento no encontrado' })
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateEventoDto,
        @Request() req,
    ) {
        return this.calendarioService.update(id, updateDto, req.user);
    }

    @Delete('eventos/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar un evento' })
    @ApiResponse({ status: 204, description: 'Evento eliminado exitosamente' })
    @ApiResponse({ status: 404, description: 'Evento no encontrado' })
    async remove(@Param('id') id: string) {
        return this.calendarioService.remove(id);
    }
}