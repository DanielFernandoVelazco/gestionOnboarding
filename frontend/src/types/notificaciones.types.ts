export interface DiaCalendario {
    fecha: Date;
    esMesActual: boolean;
    eventos: Array<{
        id: string;
        titulo: string;
        tipo: string;
        fechaInicio: string;
        color: string;
    }>;
}

export interface MesCalendario {
    año: number;
    mes: number;
    nombreMes: string;
    semanas: DiaCalendario[][];
}

export interface EstadisticasNotificaciones {
    total: number;
    enviadas: number;
    pendientes: number;
    fallidas: number;
    porTipo: Array<{
        tipo: string;
        count: number;
    }>;
}

export interface DetalleParticipante {
    id: string;
    nombreCompleto: string;
    email: string;
    telefono?: string;
    departamento?: string;
    puesto?: string;
    fechaIngreso: string;
    sesionAsignada?: string;
    progresoOnboarding?: number;
}