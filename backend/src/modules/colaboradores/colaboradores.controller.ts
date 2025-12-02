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
import { ColaboradoresService } from './colaboradores.service';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { UpdateColaboradorDto } from './dto/update-colaborador.dto';
import { FilterColaboradorDto } from './dto/filter-colaborador.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { EstadoOnboarding } from './entities/colaborador.entity';

@ApiTags('colaboradores')
@Controller('colaboradores')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ColaboradoresController {
    constructor(private readonly colaboradoresService: ColaboradoresService) { }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo colaborador' })
    @ApiResponse({ status: 201, description: 'Colaborador creado exitosamente' })
    @ApiResponse({ status: 409, description: 'El email ya está registrado' })
    async create(@Body() createDto: CreateColaboradorDto, @Request() req) {
        return this.colaboradoresService.create(createDto, req.user);
    }

    @Get()
    @ApiOperation({ summary: 'Obtener todos los colaboradores con filtros' })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'estadoBienvenida', required: false, enum: EstadoOnboarding })
    @ApiQuery({ name: 'estadoTecnico', required: false, enum: EstadoOnboarding })
    @ApiQuery({ name: 'departamento', required: false, type: String })
    @ApiQuery({ name: 'activo', required: false, type: Boolean })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findAll(@Query() filterDto: FilterColaboradorDto) {
        return this.colaboradoresService.findAll(filterDto);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas de colaboradores' })
    async getStats() {
        return this.colaboradoresService.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un colaborador por ID' })
    @ApiResponse({ status: 200, description: 'Colaborador encontrado' })
    @ApiResponse({ status: 404, description: 'Colaborador no encontrado' })
    async findOne(@Param('id') id: string) {
        return this.colaboradoresService.findOne(id);
    }

    @Get('email/:email')
    @ApiOperation({ summary: 'Obtener un colaborador por email' })
    @ApiResponse({ status: 200, description: 'Colaborador encontrado' })
    @ApiResponse({ status: 404, description: 'Colaborador no encontrado' })
    async findByEmail(@Param('email') email: string) {
        return this.colaboradoresService.getByEmail(email);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar un colaborador' })
    @ApiResponse({ status: 200, description: 'Colaborador actualizado exitosamente' })
    @ApiResponse({ status: 404, description: 'Colaborador no encontrado' })
    @ApiResponse({ status: 409, description: 'El email ya está registrado' })
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateColaboradorDto,
        @Request() req,
    ) {
        return this.colaboradoresService.update(id, updateDto, req.user);
    }

    @Put(':id/estado/:tipo')
    @ApiOperation({ summary: 'Actualizar estado de onboarding' })
    @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
    @ApiResponse({ status: 404, description: 'Colaborador no encontrado' })
    async updateEstado(
        @Param('id') id: string,
        @Param('tipo') tipo: 'bienvenida' | 'tecnico',
        @Body('estado') estado: EstadoOnboarding,
        @Request() req,
    ) {
        return this.colaboradoresService.updateEstado(id, tipo, estado, req.user);
    }

    @Post('bulk-update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Actualizar múltiples colaboradores' })
    @ApiResponse({ status: 200, description: 'Colaboradores actualizados exitosamente' })
    async bulkUpdate(@Body() bulkUpdateDto: BulkUpdateDto, @Request() req) {
        return this.colaboradoresService.bulkUpdate(bulkUpdateDto, req.user);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar un colaborador' })
    @ApiResponse({ status: 204, description: 'Colaborador eliminado exitosamente' })
    @ApiResponse({ status: 404, description: 'Colaborador no encontrado' })
    async remove(@Param('id') id: string) {
        return this.colaboradoresService.remove(id);
    }
}