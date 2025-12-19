import {
    Controller,
    Get,
    Post,
    Body,
    Param,
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
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TipoNotificacion, EstadoNotificacion } from './entities/notificacion.entity';
import { MailService } from 'src/modules/notificaciones/mail.service';

@ApiTags('notificaciones')
@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificacionesController {
    constructor(
        private readonly notificacionesService: NotificacionesService,
        private readonly mailService: MailService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Obtener todas las notificaciones con filtros' })
    @ApiQuery({ name: 'tipo', required: false, enum: TipoNotificacion })
    @ApiQuery({ name: 'estado', required: false, enum: EstadoNotificacion })
    @ApiQuery({ name: 'destinatarioId', required: false, type: String })
    @ApiQuery({ name: 'sesionId', required: false, type: String })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findAll(
        @Query('tipo') tipo?: TipoNotificacion,
        @Query('estado') estado?: EstadoNotificacion,
        @Query('destinatarioId') destinatarioId?: string,
        @Query('sesionId') sesionId?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.notificacionesService.findAll({
            tipo,
            estado,
            destinatarioId,
            sesionId,
            page,
            limit,
        });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Obtener estadísticas de notificaciones' })
    async getStats() {
        return this.notificacionesService.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una notificación por ID' })
    @ApiResponse({ status: 200, description: 'Notificación encontrada' })
    @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
    async findOne(@Param('id') id: string) {
        return this.notificacionesService.findOne(id);
    }

    @Post(':id/enviar')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Enviar una notificación pendiente' })
    @ApiResponse({ status: 200, description: 'Notificación enviada exitosamente' })
    @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
    async enviarNotificacion(@Param('id') id: string) {
        return this.notificacionesService.enviarNotificacion(id);
    }

    @Post('sesiones/:sesionId/notificar-participantes')
    @ApiOperation({ summary: 'Notificar a todos los participantes de una sesión' })
    @ApiResponse({ status: 201, description: 'Notificaciones creadas exitosamente' })
    @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
    async notificarParticipantesSesion(
        @Param('sesionId') sesionId: string,
        @Request() req,
    ) {
        return this.notificacionesService.notificarOnboardingAgendado(sesionId, req.user);
    }

    // En el controlador, modifica el endpoint de prueba:
    @Post('test')
    @ApiOperation({ summary: 'Enviar correo de prueba' })
    @ApiResponse({ status: 200, description: 'Correo de prueba enviado' })
    async testEmail(@Body() body: { email: string }, @Request() req) {
        const success = await this.mailService.sendTestEmail(body.email);

        const notificacion = await this.notificacionesService.createNotificacion({
            tipo: TipoNotificacion.SISTEMA,
            asunto: '✅ Correo de prueba enviado',
            contenido: 'Correo de prueba del sistema de notificaciones',
            destinatarioId: req.user.id,
            metadata: {
                testEmail: body.email,
                timestamp: new Date().toISOString(),
            },
            creadoPor: req.user,
        });

        return {
            success,
            messageId: notificacion.id,
            message: success
                ? `Correo de prueba enviado a ${body.email}`
                : `Error al enviar correo de prueba a ${body.email}`,
        };
    }
}