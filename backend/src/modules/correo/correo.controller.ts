import { Controller, Post, Body, Get, Query, Param, Patch } from '@nestjs/common';
import { CorreoService } from './correo.service';
import { CrearHistorialCorreoDto } from './dto/crear-historial-correo.dto';

@Controller('correo')
export class CorreoController {
    constructor(private readonly correoService: CorreoService) { }

    @Post('registrar')
    registrarEnvio(@Body() crearHistorialCorreoDto: CrearHistorialCorreoDto) {
        return this.correoService.registrarEnvio(crearHistorialCorreoDto);
    }

    @Get('historial')
    obtenerHistorial(
        @Query('limit') limit: number = 50,
        @Query('offset') offset: number = 0,
    ) {
        return this.correoService.obtenerHistorial(limit, offset);
    }

    @Get('destinatario/:email')
    buscarPorDestinatario(@Param('email') email: string) {
        return this.correoService.buscarPorDestinatario(email);
    }

    @Patch('marcar-leido/:id')
    marcarComoLeido(@Param('id') id: number) {
        return this.correoService.marcarComoLeido(id);
    }
}