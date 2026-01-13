import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialCorreo } from './entities/historial-correo.entity';
import { CrearHistorialCorreoDto } from './dto/crear-historial-correo.dto';

@Injectable()
export class CorreoService {
    private readonly logger = new Logger(CorreoService.name);

    constructor(
        @InjectRepository(HistorialCorreo)
        private readonly historialCorreoRepository: Repository<HistorialCorreo>,
    ) { }

    async registrarEnvio(datos: CrearHistorialCorreoDto): Promise<HistorialCorreo> {
        try {
            const historial = this.historialCorreoRepository.create(datos);
            return await this.historialCorreoRepository.save(historial);
        } catch (error) {
            this.logger.error(`Error al registrar envío de correo: ${error.message}`);
            throw error;
        }
    }

    async registrarError(destinatario: string, asunto: string, error: string): Promise<HistorialCorreo> {
        return this.registrarEnvio({
            destinatario,
            asunto,
            enviado: false,
            error,
        });
    }

    async marcarComoLeido(id: number): Promise<HistorialCorreo> {
        await this.historialCorreoRepository.update(id, {
            fecha_lectura: new Date(),
        });

        const historial = await this.historialCorreoRepository.findOne({ where: { id } });

        if (!historial) {
            throw new Error(`No se encontró el historial de correo con ID: ${id}`);
        }

        return historial;
    }

    async obtenerHistorial(limit: number = 50, offset: number = 0): Promise<HistorialCorreo[]> {
        return this.historialCorreoRepository.find({
            order: { fecha_envio: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async buscarPorDestinatario(destinatario: string): Promise<HistorialCorreo[]> {
        return this.historialCorreoRepository.find({
            where: { destinatario },
            order: { fecha_envio: 'DESC' },
        });
    }
}