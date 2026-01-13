import { Injectable } from '@nestjs/common';
import { CorreoService } from '../correo.service';

@Injectable()
export class CorreoHelper {
    constructor(private readonly correoService: CorreoService) { }

    async enviarYRegistrar(
        enviarCorreoFn: () => Promise<any>,
        datosRegistro: {
            destinatario: string;
            asunto: string;
            cuerpo?: string;
            tipo?: string;
            metadata?: any;
        },
    ): Promise<boolean> {
        try {
            // Intentar enviar el correo
            await enviarCorreoFn();

            // Registrar éxito
            await this.correoService.registrarEnvio({
                ...datosRegistro,
                enviado: true,
            });

            return true;
        } catch (error) {
            // Registrar error
            await this.correoService.registrarError(
                datosRegistro.destinatario,
                datosRegistro.asunto,
                error.message,
            );

            return false;
        }
    }
}