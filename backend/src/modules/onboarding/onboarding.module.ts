import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingSesion } from './entities/onboarding-sesion.entity';
import { OnboardingTipo } from './entities/onboarding-tipo.entity';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([OnboardingSesion, OnboardingTipo, Colaborador]),
    ],
    controllers: [OnboardingController],
    providers: [OnboardingService],
    exports: [OnboardingService],
})
export class OnboardingModule { }