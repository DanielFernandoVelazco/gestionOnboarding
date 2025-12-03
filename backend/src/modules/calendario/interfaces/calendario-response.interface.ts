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
        estado?: string;
    };

    creadoPor: {
        id: string;
        nombre: string;
        email: string;
    };
}

export interface DiaCalendario {
    fecha: Date;
    esMesActual: boolean;
    eventos: EventoCalendario[];
    sesiones: Array<{
        id: string;
        titulo: string;
        tipo: any;
        estado: string;
    }>;
}

export interface MesCalendario {
    año: number;
    mes: number;
    nombreMes: string;
    semanas: DiaCalendario[][];
}
