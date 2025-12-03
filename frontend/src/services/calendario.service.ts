import api from '../api/axios.config';

export interface EventoCalendario {
    id: string;
    titulo: string;
    descripcion?: string;
    tipo: 'sesion_onboarding' | 'reunion' | 'feriado' | 'otro';
    fechaInicio: string;
    fechaFin?: string;
    todoElDia: boolean;
    color: string;
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
    activo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEventoDto {
    titulo: string;
    descripcion?: string;
    tipo?: 'sesion_onboarding' | 'reunion' | 'feriado' | 'otro';
    fechaInicio: string;
    fechaFin?: string;
    todoElDia?: boolean;
    color: string;
    sesionId?: string;
}

export interface MesCalendario {
    año: number;
    mes: number;
    nombreMes: string;
    semanas: Array<Array<{
        fecha: string;
        esMesActual: boolean;
        eventos: EventoCalendario[];
        sesiones: any[];
    }>>;
}

export const calendarioService = {
    getEventos: async (fechaDesde?: string, fechaHasta?: string, tipo?: string) => {
        const params = new URLSearchParams();
        if (fechaDesde) params.append('fechaDesde', fechaDesde);
        if (fechaHasta) params.append('fechaHasta', fechaHasta);
        if (tipo) params.append('tipo', tipo);

        const response = await api.get<EventoCalendario[]>(
            `/calendario/eventos?${params.toString()}`
        );
        return response.data;
    },

    getEventoById: async (id: string) => {
        const response = await api.get<EventoCalendario>(`/calendario/eventos/${id}`);
        return response.data;
    },

    createEvento: async (data: CreateEventoDto) => {
        const response = await api.post<EventoCalendario>('/calendario/eventos', data);
        return response.data;
    },

    updateEvento: async (id: string, data: Partial<CreateEventoDto>) => {
        const response = await api.put<EventoCalendario>(`/calendario/eventos/${id}`, data);
        return response.data;
    },

    deleteEvento: async (id: string) => {
        await api.delete(`/calendario/eventos/${id}`);
    },

    getMesCalendario: async (año: number, mes: number) => {
        const response = await api.get<MesCalendario>(`/calendario/mes/${año}/${mes}`);
        return response.data;
    },

    getEventosProximos: async (limite: number = 10) => {
        const response = await api.get<EventoCalendario[]>(`/calendario/eventos/proximos?limite=${limite}`);
        return response.data;
    },

    getEventosPorTipo: async (tipo: string) => {
        const response = await api.get<EventoCalendario[]>(`/calendario/eventos/tipo/${tipo}`);
        return response.data;
    },
};