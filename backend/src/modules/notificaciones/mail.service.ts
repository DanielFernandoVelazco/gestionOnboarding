import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { Notificacion } from './entities/notificacion.entity';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const mailConfig = {
            host: this.configService.get('mail.host'),
            port: this.configService.get('mail.port'),
            auth: {
                user: this.configService.get('mail.user'),
                pass: this.configService.get('mail.pass'),
            },
        };

        this.transporter = nodemailer.createTransport(mailConfig);

        // Verificar conexión
        this.transporter.verify((error) => {
            if (error) {
                this.logger.error('Error al conectar con el servidor de correo:', error);
            } else {
                this.logger.log('Conectado al servidor de correo exitosamente');
            }
        });
    }

    async sendEmail(options: {
        to: string | string[];
        subject: string;
        html: string;
        cc?: string | string[];
        bcc?: string | string[];
    }): Promise<boolean> {
        try {
            const mailOptions: Mail.Options = {
                from: this.configService.get('mail.from'),
                to: options.to,
                subject: options.subject,
                html: options.html,
            };

            if (options.cc) {
                mailOptions.cc = options.cc;
            }

            if (options.bcc) {
                mailOptions.bcc = options.bcc;
            }

            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Correo enviado: ${info.messageId}`);
            return true;
        } catch (error) {
            this.logger.error('Error al enviar correo:', error);
            return false;
        }
    }

    async sendNotificationEmail(notificacion: Notificacion): Promise<boolean> {
        if (!notificacion.destinatario?.email) {
            this.logger.error('No se puede enviar notificación: destinatario sin email');
            return false;
        }

        return await this.sendEmail({
            to: notificacion.destinatario.email,
            subject: notificacion.asunto,
            html: notificacion.contenido,
        });
    }

    async sendBulkNotification(
        notificaciones: Notificacion[],
    ): Promise<{ success: number; failed: number }> {
        const results = await Promise.allSettled(
            notificaciones.map(notif => this.sendNotificationEmail(notif))
        );

        const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const failed = results.length - success;

        return { success, failed };
    }

    generateOnboardingTemplate(data: {
        colaboradorNombre: string;
        sesionTitulo: string;
        fechaInicio: string;
        fechaFin: string;
        ubicacion?: string;
        enlaceVirtual?: string;
        notas?: string;
    }): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #00448D; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .footer { background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666; }
          .info-box { background: white; border-left: 4px solid #00448D; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; padding: 10px 20px; background: #00448D; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Sesión de Onboarding</h1>
          </div>
          
          <div class="content">
            <h2>Hola ${data.colaboradorNombre},</h2>
            <p>Has sido agendado para la siguiente sesión de onboarding:</p>
            
            <div class="info-box">
              <h3>${data.sesionTitulo}</h3>
              <p><strong>📅 Fechas:</strong> ${data.fechaInicio} - ${data.fechaFin}</p>
              ${data.ubicacion ? `<p><strong>📍 Ubicación:</strong> ${data.ubicacion}</p>` : ''}
              ${data.enlaceVirtual ? `<p><strong>🔗 Enlace virtual:</strong> <a href="${data.enlaceVirtual}">${data.enlaceVirtual}</a></p>` : ''}
              ${data.notas ? `<p><strong>📝 Notas:</strong> ${data.notas}</p>` : ''}
            </div>
            
            <p>Por favor, confirma tu asistencia y prepara cualquier material necesario.</p>
            
            ${data.enlaceVirtual ? `<p><a href="${data.enlaceVirtual}" class="button">🔗 Unirse a la sesión</a></p>` : ''}
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático. Por favor, no respondas a este correo.</p>
            <p>© ${new Date().getFullYear()} Sistema de Gestión de Onboarding</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    generateReminderTemplate(data: {
        colaboradorNombre: string;
        sesionTitulo: string;
        fechaInicio: string;
        tiempoRestante: string;
        enlaceVirtual?: string;
    }): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FFD100; color: #333; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 10px 20px; background: #00448D; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Recordatorio de Sesión</h1>
          </div>
          
          <div class="content">
            <h2>Hola ${data.colaboradorNombre},</h2>
            <p>Te recordamos que tienes una sesión de onboarding programada:</p>
            
            <div class="alert">
              <h3>${data.sesionTitulo}</h3>
              <p><strong>📅 Fecha:</strong> ${data.fechaInicio}</p>
              <p><strong>⏱️ Tiempo restante:</strong> ${data.tiempoRestante}</p>
            </div>
            
            <p>Por favor, asegúrate de estar preparado para la sesión.</p>
            
            ${data.enlaceVirtual ? `<p><a href="${data.enlaceVirtual}" class="button">🔗 Acceder a la sesión</a></p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
    }
}