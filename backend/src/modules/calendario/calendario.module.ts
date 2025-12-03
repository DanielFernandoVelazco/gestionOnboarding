import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarioService } from './calendario.service';
import { CalendarioController } from './calendario.controller';
import { EventoCalendario } from './entities/evento-calendario.entity';
import { OnboardingSesion } from '../onboarding/entities/onboarding-sesion.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([EventoCalendario, OnboardingSesion]),
    ],
    controllers: [CalendarioController],
    providers: [CalendarioService],
    exports: [CalendarioService],
})
export class CalendarioModule { }