import api from '../api/axios.config';

export interface Notificacion {
    id: string;
    tipo: 'onboarding_agendado' | 'recordatorio_sesion' | 'cambio_estado' | 'nuevo_colaborador' | 'sistema';
    asunto: string;
    contenido: string;
    metadata?: Record<string, any>;
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
    creadoPor?: {
        id: string;
        nombre: string;
        email: string;
    };
    createdAt: string;
}

export interface ParticipanteSesion {
    id: string;
    nombreCompleto: string;
    email: string;
    telefono?: string;
    departamento?: string;
    puesto?: string;
    fechaIngreso: string;
    fechaOnboardingTecnico?: string;
    lugarAsignacion?: string;
}

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
}

export const notificacionesService = {
    // Notificaciones
    getNotificaciones: async (filters?: {
        tipo?: string;
        estado?: string;
        destinatarioId?: string;
        sesionId?: string;
        page?: number;
        limit?: number;
    }) => {
        const params = new URLSearchParams();

        Object.entries(filters || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });

        const response = await api.get('/notificaciones', { params });
        return response.data;
    },

    getNotificacionById: async (id: string) => {
        const response = await api.get(`/notificaciones/${id}`);
        return response.data;
    },

    enviarNotificacion: async (id: string) => {
        const response = await api.post(`/notificaciones/${id}/enviar`);
        return response.data;
    },

    enviarCorreoPrueba: async (email: string) => {
        const response = await api.post('/notificaciones/test', { email });
        return response.data;
    },

    // Sesiones
    getParticipantesSesion: async (sesionId: string) => {
        // Por ahora simulamos datos, más adelante conectaremos con la API real
        return [
            {
                id: '1',
                nombreCompleto: 'Carlos Santana',
                email: 'c.santana@empresa.com',
                telefono: '+1 234 567 890',
                departamento: 'Tecnología',
                puesto: 'Desarrollador Backend',
                fechaIngreso: '2024-07-01',
                fechaOnboardingTecnico: '2024-07-16',
                lugarAsignacion: 'capitulo_backend',
            },
            {
                id: '2',
                nombreCompleto: 'Elena Rodriguez',
                email: 'e.rodriguez@empresa.com',
                telefono: '+1 234 567 891',
                departamento: 'Tecnología',
                puesto: 'Desarrolladora Frontend',
                fechaIngreso: '2024-07-01',
                fechaOnboardingTecnico: '2024-07-16',
                lugarAsignacion: 'capitulo_frontend',
            },
            {
                id: '3',
                nombreCompleto: 'Juan Pérez',
                email: 'j.perez@empresa.com',
                telefono: '+1 234 567 892',
                departamento: 'Tecnología',
                puesto: 'Desarrollador Backend',
                fechaIngreso: '2024-07-01',
                fechaOnboardingTecnico: '2024-07-16',
                lugarAsignacion: 'capitulo_backend',
            },
        ];
    },

    agregarParticipanteSesion: async (sesionId: string, colaboradorId: string) => {
        // Implementar cuando la API esté disponible
        console.log('Agregar participante:', sesionId, colaboradorId);
        return { success: true };
    },

    eliminarParticipanteSesion: async (sesionId: string, colaboradorId: string) => {
        // Implementar cuando la API esté disponible
        console.log('Eliminar participante:', sesionId, colaboradorId);
        return { success: true };
    },

    // Calendario
    getCalendarioMes: async (año: number, mes: number) => {
        // Por ahora simulamos datos
        const hoy = new Date();
        const eventos: EventoCalendario[] = [
            {
                id: '1',
                titulo: 'Journey to Cloud',
                tipo: 'sesion_onboarding',
                fechaInicio: `${año}-${String(mes).padStart(2, '0')}-16`,
                color: '#E31937',
                todoElDia: true,
                sesion: {
                    id: 'sesion-1',
                    titulo: 'Journey to Cloud - Cohort 1',
                    tipo: { nombre: 'Journey to Cloud', color: '#E31937' },
                },
            },
            {
                id: '2',
                titulo: 'Capítulo Data',
                tipo: 'sesion_onboarding',
                fechaInicio: `${año}-${String(mes + 1).padStart(2, '0')}-13`,
                color: '#FFD100',
                todoElDia: true,
                sesion: {
                    id: 'sesion-2',
                    titulo: 'Capítulo Data - Cohort 1',
                    tipo: { nombre: 'Capítulo Data', color: '#FFD100' },
                },
            },
            {
                id: '3',
                titulo: 'Capítulo Frontend',
                tipo: 'sesion_onboarding',
                fechaInicio: `${año}-${String(mes + 2).padStart(2, '0')}-10`,
                color: '#00448D',
                todoElDia: true,
                sesion: {
                    id: 'sesion-3',
                    titulo: 'Capítulo Frontend - Cohort 1',
                    tipo: { nombre: 'Capítulo Frontend', color: '#00448D' },
                },
            },
        ];

        return {
            año,
            mes,
            nombreMes: new Date(año, mes - 1, 1).toLocaleDateString('es-ES', { month: 'long' }),
            semanas: [],
        };
    },

    // Estadísticas
    getStatsNotificaciones: async () => {
        try {
            const response = await api.get('/notificaciones/stats');
            return response.data;
        } catch (error) {
            // Si la API no está disponible, retornamos datos simulados
            return {
                total: 24,
                enviadas: 18,
                pendientes: 4,
                fallidas: 2,
                porTipo: [
                    { tipo: 'onboarding_agendado', count: 12 },
                    { tipo: 'recordatorio_sesion', count: 8 },
                    { tipo: 'cambio_estado', count: 3 },
                    { tipo: 'nuevo_colaborador', count: 1 },
                ],
            };
        }
    },

    notificarParticipantesSesion: async (sesionId: string) => {
        const response = await api.post(`/notificaciones/sesiones/${sesionId}/notificar-participantes`);
        return response.data;
    },
};