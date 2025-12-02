import { EventoCalendario } from '../entities/evento-calendario.entity';

export interface EventoWithRelations
    extends Omit<EventoCalendario, 'sesion' | 'creadoPor'> {
    sesion?: {
        id: string;
        titulo: string;
        tipo: {
            nombre: string;
            color: string;
        };
    };

    creadoPor: {
        id: string;
        nombre: string;
        email: string;
    };
}
