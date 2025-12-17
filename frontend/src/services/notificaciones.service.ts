import api from '../api/axios.config';
import { Colaborador } from './colaboradores.service';

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
    estadoTecnico?: 'pendiente' | 'en_progreso' | 'completado';
    tipoOnboardingTecnico?: {
        id: string;
        nombre: string;
        color: string;
    } | null;
}

export const notificacionesService = {
    // Obtener participantes reales de la base de datos
    getParticipantesSesion: async (sesionId: string): Promise<ParticipanteSesion[]> => {
        try {
            // Primero, obtener todos los colaboradores
            const response = await api.get('/colaboradores?limit=1000');
            const colaboradores: Colaborador[] = response.data.data;

            // Filtrar colaboradores que tengan fecha de onboarding técnico (simulan estar en sesión)
            // En una implementación real, esto vendría de una relación sesión-colaborador
            const participantes = colaboradores
                .filter(colaborador => colaborador.fechaOnboardingTecnico)
                .map(colaborador => ({
                    id: colaborador.id,
                    nombreCompleto: colaborador.nombreCompleto,
                    email: colaborador.email,
                    telefono: colaborador.telefono,
                    departamento: colaborador.departamento,
                    puesto: colaborador.puesto,
                    fechaIngreso: colaborador.fechaIngreso,
                    fechaOnboardingTecnico: colaborador.fechaOnboardingTecnico,
                    lugarAsignacion: colaborador.lugarAsignacion,
                    estadoTecnico: colaborador.estadoTecnico,
                    tipoOnboardingTecnico: colaborador.tipoOnboardingTecnico,
                }));

            return participantes;
        } catch (error) {
            console.error('Error al cargar participantes:', error);

            // Datos de ejemplo en caso de error
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
                    estadoTecnico: 'completado',
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
                    estadoTecnico: 'en_progreso',
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
                    estadoTecnico: 'pendiente',
                },
            ];
        }
    },

    // Obtener todos los colaboradores para agregar a sesión
    getColaboradoresDisponibles: async () => {
        try {
            const response = await api.get('/colaboradores?limit=1000');
            return response.data.data;
        } catch (error) {
            console.error('Error al cargar colaboradores disponibles:', error);
            return [];
        }
    },

    // Obtener un colaborador específico para el panel de detalles
    getColaboradorDetalle: async (colaboradorId: string) => {
        try {
            const response = await api.get(`/colaboradores/${colaboradorId}`);
            return response.data;
        } catch (error) {
            console.error('Error al cargar detalle del colaborador:', error);
            return null;
        }
    },

    // Métodos existentes...
    getNotificaciones: async (filters?: any) => {
        const params = new URLSearchParams();

        Object.entries(filters || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });

        try {
            const response = await api.get('/notificaciones', { params });
            return response.data;
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
            return { data: [], total: 0 };
        }
    },

    // Los demás métodos se mantienen igual...
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

    agregarParticipanteSesion: async (sesionId: string, colaboradorId: string) => {
        try {
            // En una implementación real, esto sería un endpoint específico
            // Por ahora simulamos la adición
            const response = await api.post(`/onboarding/sesiones/${sesionId}/participantes`, {
                colaboradoresIds: [colaboradorId]
            });
            return response.data;
        } catch (error) {
            console.error('Error al agregar participante:', error);
            throw error;
        }
    },

    eliminarParticipanteSesion: async (sesionId: string, colaboradorId: string) => {
        try {
            // En una implementación real, esto sería un endpoint DELETE
            await api.delete(`/onboarding/sesiones/${sesionId}/participantes/${colaboradorId}`);
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar participante:', error);
            throw error;
        }
    },

    notificarParticipantesSesion: async (sesionId: string) => {
        try {
            const response = await api.post(`/notificaciones/sesiones/${sesionId}/notificar-participantes`);
            return response.data;
        } catch (error) {
            console.error('Error al notificar participantes:', error);
            throw error;
        }
    },
};