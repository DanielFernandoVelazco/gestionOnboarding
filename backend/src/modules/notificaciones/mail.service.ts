import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailtrapClient } from 'mailtrap';
import { Notificacion } from './entities/notificacion.entity';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  category?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private client: MailtrapClient | null = null;
  private mailEnabled: boolean;
  private sender: {
    email: string;
    name: string;
  };

  constructor(private configService: ConfigService) {
    this.mailEnabled = this.configService.get<boolean>('mail.enabled') ?? false;

    this.sender = {
      email: this.configService.get<string>('mail.fromEmail') ?? 'hello@demomailtrap.co',
      name: this.configService.get<string>('mail.fromName') ?? 'Sistema de Onboarding',
    };

    if (this.mailEnabled) {
      this.initializeClient();
    } else {
      this.logger.warn('Mail service está deshabilitado. Las notificaciones se registrarán pero no se enviarán por correo.');
    }
  }

  private initializeClient() {
    try {
      const token = this.configService.get<string>('mail.token') ?? '';

      if (!token || token === '' || token === '<YOUR_API_TOKEN>') {
        this.logger.warn('Token de Mailtrap no configurado. Mail service deshabilitado.');
        this.mailEnabled = false;
        return;
      }

      this.client = new MailtrapClient({
        token: token,
      });

      this.logger.log('✅ Cliente Mailtrap inicializado exitosamente');
    } catch (error) {
      this.logger.error('❌ Error al inicializar cliente Mailtrap:', error);
      this.mailEnabled = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.mailEnabled || !this.client) {
      this.logger.log(`[SIMULADO] Correo NO enviado - Destinatario: ${options.to}, Asunto: ${options.subject}`);
      this.logger.log(`[SIMULADO] Contenido: ${options.html.substring(0, 100)}...`);
      return true;
    }

    try {
      const recipients = Array.isArray(options.to)
        ? options.to.map(email => ({ email }))
        : [{ email: options.to }];

      const cc = options.cc
        ? (Array.isArray(options.cc)
          ? options.cc.map(email => ({ email }))
          : [{ email: options.cc }])
        : undefined;

      const bcc = options.bcc
        ? (Array.isArray(options.bcc)
          ? options.bcc.map(email => ({ email }))
          : [{ email: options.bcc }])
        : undefined;

      const response = await this.client.send({
        from: this.sender,
        to: recipients,
        cc,
        bcc,
        subject: options.subject,
        text: this.extractTextFromHtml(options.html),
        html: options.html,
        category: options.category || 'onboarding',
      });

      this.logger.log(`Correo enviado exitosamente. ID: ${response.message_ids?.join(', ')}`);
      return true;
    } catch (error) {
      this.logger.error('Error al enviar correo con Mailtrap:', error);

      if (error.response?.data) {
        this.logger.error('Detalles del error:', error.response.data);
      }

      return false;
    }
  }

  private extractTextFromHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async sendNotificationEmail(notificacion: Notificacion): Promise<boolean> {
    if (!notificacion.destinatario?.email) {
      this.logger.error('No se puede enviar notificación: destinatario sin email');
      return false;
    }

    this.logger.log(`Enviando notificación a: ${notificacion.destinatario.email}, Tipo: ${notificacion.tipo}`);

    let category = 'onboarding';
    switch (notificacion.tipo) {
      case 'onboarding_agendado':
        category = 'onboarding_scheduled';
        break;
      case 'recordatorio_sesion':
        category = 'reminder';
        break;
      case 'cambio_estado':
        category = 'status_change';
        break;
      case 'nuevo_colaborador':
        category = 'new_employee';
        break;
      case 'sistema':
        category = 'system';
        break;
    }

    return await this.sendEmail({
      to: notificacion.destinatario.email,
      subject: notificacion.asunto,
      html: notificacion.contenido,
      category,
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

    this.logger.log(`Notificaciones por lotes: ${success} exitosas, ${failed} fallidas`);

    return { success, failed };
  }

  async sendTestEmail(to: string): Promise<boolean> {
    const htmlPath = path.join(__dirname, 'modeloMail', 'sendTestEmail.html');
    const cssPath = path.join(__dirname, 'modeloMail', 'sendTestEmail.css');

    try {
      let html = fs.readFileSync(htmlPath, 'utf8');
      const css = fs.readFileSync(cssPath, 'utf8');

      html = html.replace('<style>', `<style>\n${css}\n`);
      html = html.replace('${new Date().toLocaleString(\'es-ES\')}', new Date().toLocaleString('es-ES'));
      html = html.replace('${new Date().getFullYear()}', new Date().getFullYear().toString());

      const success = await this.sendEmail({
        to,
        subject: '✅ Correo de prueba - Sistema de Onboarding',
        html,
        category: 'test',
      });

      if (success) {
        this.logger.log(`Correo de prueba enviado exitosamente a: ${to}`);
      } else {
        this.logger.error(`Error al enviar correo de prueba a: ${to}`);
      }

      return success;
    } catch (error) {
      this.logger.error('Error al cargar plantilla de correo de prueba:', error);
      return false;
    }
  }

  generateOnboardingTemplate(data: {
    colaboradorNombre: string;
    sesionTitulo: string;
    fechaInicio: string;
    fechaFin: string;
    ubicacion?: string;
    enlaceVirtual?: string;
    notas?: string;
    instructor?: string;
  }): string {
    const htmlPath = path.join(__dirname, 'modeloMail', 'generateOnboardingTemplate.html');
    const cssPath = path.join(__dirname, 'modeloMail', 'generateOnboardingTemplate.css');

    try {
      let html = fs.readFileSync(htmlPath, 'utf8');
      const css = fs.readFileSync(cssPath, 'utf8');

      html = html.replace('<style>', `<style>\n${css}\n`);

      // Reemplazar marcadores de posición
      html = html.replace('${data.colaboradorNombre}', data.colaboradorNombre);
      html = html.replace('${data.sesionTitulo}', data.sesionTitulo);
      html = html.replace('${data.fechaInicio}', data.fechaInicio);
      html = html.replace('${data.fechaFin}', data.fechaFin);
      html = html.replace('${data.ubicacion}', data.ubicacion || '');
      html = html.replace('${data.enlaceVirtual}', data.enlaceVirtual || '');
      html = html.replace('${data.instructor}', data.instructor || '');
      html = html.replace('${data.notas}', data.notas || '');
      html = html.replace('${new Date().getFullYear()}', new Date().getFullYear().toString());

      // Eliminar bloques condicionales si los datos no existen
      if (!data.ubicacion) {
        html = html.replace(/<!-- UBICACION_BLOCK -->([\s\S]*?)<!-- \/UBICACION_BLOCK -->/, '');
      }
      if (!data.enlaceVirtual) {
        html = html.replace(/<!-- ENLACE_BLOCK -->([\s\S]*?)<!-- \/ENLACE_BLOCK -->/, '');
        html = html.replace(/<!-- BOTON_BLOCK -->([\s\S]*?)<!-- \/BOTON_BLOCK -->/, '');
      }
      if (!data.instructor) {
        html = html.replace(/<!-- INSTRUCTOR_BLOCK -->([\s\S]*?)<!-- \/INSTRUCTOR_BLOCK -->/, '');
      }
      if (!data.notas) {
        html = html.replace(/<!-- NOTAS_BLOCK -->([\s\S]*?)<!-- \/NOTAS_BLOCK -->/, '');
      }

      return html;
    } catch (error) {
      this.logger.error('Error al cargar plantilla de onboarding:', error);
      return '<p>Error al cargar la plantilla de correo</p>';
    }
  }

  generateReminderTemplate(data: {
    colaboradorNombre: string;
    sesionTitulo: string;
    fechaInicio: string;
    horaInicio: string;
    tiempoRestante: string;
    enlaceVirtual?: string;
    ubicacion?: string;
  }): string {
    const htmlPath = path.join(__dirname, 'modeloMail', 'generateReminderTemplate.html');
    const cssPath = path.join(__dirname, 'modeloMail', 'generateReminderTemplate.css');

    try {
      let html = fs.readFileSync(htmlPath, 'utf8');
      const css = fs.readFileSync(cssPath, 'utf8');

      html = html.replace('<style>', `<style>\n${css}\n`);

      // Reemplazar marcadores de posición
      html = html.replace('${data.sesionTitulo}', data.sesionTitulo);
      html = html.replace('${data.fechaInicio}', data.fechaInicio);
      html = html.replace('${data.horaInicio}', data.horaInicio);
      html = html.replace('${data.tiempoRestante}', data.tiempoRestante);
      html = html.replace('${data.enlaceVirtual}', data.enlaceVirtual || '');
      html = html.replace('${data.ubicacion}', data.ubicacion || '');

      // Eliminar bloques condicionales si los datos no existen
      if (!data.enlaceVirtual) {
        html = html.replace(/<!-- BOTON_UNIRSE_BLOCK -->([\s\S]*?)<!-- \/BOTON_UNIRSE_BLOCK -->/, '');
      }
      if (!data.ubicacion) {
        html = html.replace(/<!-- UBICACION_RECORDATORIO_BLOCK -->([\s\S]*?)<!-- \/UBICACION_RECORDATORIO_BLOCK -->/, '');
      }

      return html;
    } catch (error) {
      this.logger.error('Error al cargar plantilla de recordatorio:', error);
      return '<p>Error al cargar la plantilla de correo</p>';
    }
  }
}