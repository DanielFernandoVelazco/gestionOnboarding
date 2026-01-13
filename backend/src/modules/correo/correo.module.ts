import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorreoService } from './correo.service';
import { CorreoController } from './correo.controller';
import { HistorialCorreo } from './entities/historial-correo.entity';

@Module({
    imports: [TypeOrmModule.forFeature([HistorialCorreo])],
    controllers: [CorreoController],
    providers: [CorreoService],
    exports: [CorreoService],
})
export class CorreoModule { }