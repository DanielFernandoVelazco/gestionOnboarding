import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColaboradoresService } from './colaboradores.service';
import { ColaboradoresController } from './colaboradores.controller';
import { Colaborador } from './entities/colaborador.entity';
import { OnboardingTipo } from 'src/modules/onboarding/entities/onboarding-tipo.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Colaborador, OnboardingTipo]),
        forwardRef(() => AuthModule),
    ],
    controllers: [ColaboradoresController],
    providers: [ColaboradoresService],
    exports: [ColaboradoresService],
})
export class ColaboradoresModule { }