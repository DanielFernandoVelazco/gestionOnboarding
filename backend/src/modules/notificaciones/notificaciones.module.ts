import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesController } from './notificaciones.controller';
import { MailService } from './mail.service';
import { Notificacion } from './entities/notificacion.entity';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';
import { OnboardingSesion } from '../onboarding/entities/onboarding-sesion.entity';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([Notificacion, Colaborador, OnboardingSesion]),
    ],
    controllers: [NotificacionesController],
    providers: [NotificacionesService, MailService],
    exports: [NotificacionesService, MailService],
})
export class NotificacionesModule { }