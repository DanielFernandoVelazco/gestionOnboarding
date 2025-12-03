import api from '../api/axios.config';

export interface Notificacion {
    id: string;
    tipo: 'onboarding_agendado' | 'recordatorio_sesion' | 'cambio_estado' | 'nuevo_colaborador' | 'sistema';
    asunto: string;
    contenido: string;
    destinatario?: {
        id: string;
        nombreCompleto: string;
        email: string;
    };
    sesion?: {
        id: string;
        titulo: string;
    };
    estado: 'pendiente' | 'enviada' | 'fallida';
    fechaEnvio?: string;
    error?: string;
    creadoPor: {
        id: string;
        nombre: string;
        email: string;
    };
    createdAt: string;
}

export interface FilterNotificacionesDto {
    tipo?: string;
    estado?: string;
    destinatarioId?: string;
    sesionId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
}

export const notificacionesService = {
    getNotificaciones: async (filters: FilterNotificacionesDto = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });

        const response = await api.get(`/notificaciones?${params.toString()}`);
        return response.data;
    },

    getNotificacionById: async (id: string) => {
        const response = await api.get<Notificacion>(`/notificaciones/${id}`);
        return response.data;
    },

    enviarNotificacion: async (id: string) => {
        const response = await api.post(`/notificaciones/${id}/enviar`);
        return response.data;
    },

    notificarParticipantesSesion: async (sesionId: string) => {
        const response = await api.post(`/notificaciones/sesiones/${sesionId}/notificar-participantes`);
        return response.data;
    },

    enviarCorreoPrueba: async (email: string) => {
        const response = await api.post('/notificaciones/test', { email });
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/notificaciones/stats');
        return response.data;
    },
};