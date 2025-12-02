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
import { OnboardingService } from './onboarding.service';
import { CreateSesionDto } from './dto/create-sesion.dto';
import { UpdateSesionDto } from './dto/update-sesion.dto';
import { FilterSesionDto } from './dto/filter-sesion.dto';
import { AgregarParticipanteDto } from './dto/agregar-participante.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { EstadoSesion } from './entities/onboarding-sesion.entity';

@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnboardingController {
    constructor(private readonly onboardingService: OnboardingService) { }

    @Post('sesiones')
    @ApiOperation({ summary: 'Crear una nueva sesión de onboarding' })
    @ApiResponse({ status: 201, description: 'Sesión creada exitosamente' })
    async create(@Body() createDto: CreateSesionDto, @Request() req) {
        return this.onboardingService.create(createDto, req.user);
    }

    @Get('sesiones')
    @ApiOperation({ summary: 'Obtener todas las sesiones con filtros' })
    @ApiQuery({ name: 'tipoId', required: false, type: String })
    @ApiQuery({ name: 'estado', required: false, enum: EstadoSesion })
    async findAll(@Query() filterDto: FilterSesionDto) {
        return this.onboardingService.findAll(filterDto);
    }

    @Get('sesiones/stats')
    @ApiOperation({ summary: 'Obtener estadísticas de sesiones' })
    async getStats() {
        return this.onboardingService.getStats();
    }

    @Get('sesiones/proximas')
    @ApiOperation({ summary: 'Obtener próximas sesiones' })
    @ApiQuery({ name: 'limite', required: false, type: Number, default: 5 })
    async getProximas(@Query('limite') limite: number) {
        return this.onboardingService.getProximasSesiones(limite);
    }

    @Get('sesiones/mes/:año/:mes')
    @ApiOperation({ summary: 'Obtener sesiones por mes' })
    async getPorMes(
        @Param('año') año: number,
        @Param('mes') mes: number,
    ) {
        return this.onboardingService.getSesionesPorMes(año, mes);
    }

    @Get('sesiones/:id')
    @ApiOperation({ summary: 'Obtener una sesión por ID' })
    @ApiResponse({ status: 200, description: 'Sesión encontrada' })
    @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
    async findOne(@Param('id') id: string) {
        return this.onboardingService.findOne(id);
    }

    @Put('sesiones/:id')
    @ApiOperation({ summary: 'Actualizar una sesión' })
    @ApiResponse({ status: 200, description: 'Sesión actualizada exitosamente' })
    @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateSesionDto,
        @Request() req,
    ) {
        return this.onboardingService.update(id, updateDto, req.user);
    }

    @Put('sesiones/:id/estado')
    @ApiOperation({ summary: 'Cambiar estado de una sesión' })
    @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
    @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
    async cambiarEstado(
        @Param('id') id: string,
        @Body('estado') estado: EstadoSesion,
        @Request() req,
    ) {
        return this.onboardingService.cambiarEstado(id, estado, req.user);
    }

    @Post('sesiones/:id/participantes')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Agregar participantes a una sesión' })
    @ApiResponse({ status: 200, description: 'Participantes agregados exitosamente' })
    @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
    async agregarParticipantes(
        @Param('id') id: string,
        @Body() agregarDto: AgregarParticipanteDto,
        @Request() req,
    ) {
        return this.onboardingService.agregarParticipantes(id, agregarDto, req.user);
    }

    @Delete('sesiones/:sesionId/participantes/:colaboradorId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remover participante de una sesión' })
    @ApiResponse({ status: 204, description: 'Participante removido exitosamente' })
    @ApiResponse({ status: 404, description: 'Sesión o participante no encontrado' })
    async removerParticipante(
        @Param('sesionId') sesionId: string,
        @Param('colaboradorId') colaboradorId: string,
        @Request() req,
    ) {
        return this.onboardingService.removerParticipante(sesionId, colaboradorId, req.user);
    }

    @Delete('sesiones/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar una sesión' })
    @ApiResponse({ status: 204, description: 'Sesión eliminada exitosamente' })
    @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
    async remove(@Param('id') id: string) {
        return this.onboardingService.remove(id);
    }
}