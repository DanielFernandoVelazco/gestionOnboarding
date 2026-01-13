import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { ColaboradoresModule } from './modules/colaboradores/colaboradores.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { CalendarioModule } from './modules/calendario/calendario.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './modules/auth/auth.service';
import { CorreoModule } from './modules/correo/correo.module';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ColaboradoresModule,
    OnboardingModule,
    CalendarioModule,
    NotificacionesModule,
    CorreoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly authService: AuthService) { }

  async onModuleInit() {
    // Crear usuario administrador por defecto si no existe
    await this.authService.seedAdminUser();
  }
}