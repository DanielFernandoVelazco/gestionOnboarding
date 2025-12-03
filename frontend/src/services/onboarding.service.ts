import api from '../api/axios.config';

export interface OnboardingTipo {
    id: string;
    nombre: string;
    color: string;
    descripcion?: string;
    duracionDias: number;
    activo: boolean;
}

export interface OnboardingSesion {
    id: string;
    titulo: string;
    descripcion?: string;
    tipo: OnboardingTipo;
    fechaInicio: string;
    fechaFin: string;
    estado: 'programada' | 'en_curso' | 'completada' | 'cancelada';
    capacidadMaxima: number;
    ubicacion?: string;
    enlaceVirtual?: string;
    notas?: string;
    participantes: Array<{
        id: string;
        nombreCompleto: string;
        email: string;
    }>;
    creadoPor?: {
        id: string;
        nombre: string;
        email: string;
    };
    activo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSesionDto {
    titulo: string;
    descripcion?: string;
    tipoId: string;
    fechaInicio: string;
    fechaFin: string;
    estado?: 'programada' | 'en_curso' | 'completada' | 'cancelada';
    capacidadMaxima?: number;
    ubicacion?: string;
    enlaceVirtual?: string;
    notas?: string;
    participantesIds?: string[];
}

export interface FilterSesionesDto {
    tipoId?: string;
    estado?: 'programada' | 'en_curso' | 'completada' | 'cancelada';
    fechaDesde?: string;
    fechaHasta?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
}

export const onboardingService = {
    // Tipos de onboarding - CORREGIDO: Endpoint separado para tipos
    getTipos: async () => {
        try {
            // Usamos un endpoint temporal o creamos uno específico
            // Por ahora, simulamos datos de tipos
            const tiposHardcoded: OnboardingTipo[] = [
                {
                    id: '1',
                    nombre: 'Journey to Cloud',
                    color: '#E31937',
                    descripcion: 'Onboarding para desarrolladores Cloud',
                    duracionDias: 3,
                    activo: true,
                },
                {
                    id: '2',
                    nombre: 'Capítulo Data',
                    color: '#FFD100',
                    descripcion: 'Onboarding para analistas de datos',
                    duracionDias: 2,
                    activo: true,
                },
                {
                    id: '3',
                    nombre: 'Capítulo Frontend',
                    color: '#00448D',
                    descripcion: 'Onboarding para desarrolladores Frontend',
                    duracionDias: 2,
                    activo: true,
                },
                {
                    id: '4',
                    nombre: 'Capítulo Backend',
                    color: '#FF6B35',
                    descripcion: 'Onboarding para desarrolladores Backend',
                    duracionDias: 2,
                    activo: true,
                },
            ];
            return tiposHardcoded;
        } catch (error) {
            console.error('Error al cargar tipos de onboarding:', error);
            return [];
        }
    },

    // Sesiones
    getSesiones: async (filters: FilterSesionesDto = {}) => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value));
                }
            });

            const response = await api.get(`/onboarding/sesiones?${params.toString()}`);
            return response.data?.data || []; // Asegurar que devolvemos array
        } catch (error) {
            console.error('Error al cargar sesiones:', error);
            return { data: [], meta: { total: 0 } };
        }
    },

    getSesionById: async (id: string) => {
        try {
            const response = await api.get<OnboardingSesion>(`/onboarding/sesiones/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al cargar sesión:', error);
            return null;
        }
    },

    createSesion: async (data: CreateSesionDto) => {
        try {
            const response = await api.post<OnboardingSesion>('/onboarding/sesiones', data);
            return response.data;
        } catch (error) {
            console.error('Error al crear sesión:', error);
            throw error;
        }
    },

    updateSesion: async (id: string, data: Partial<CreateSesionDto>) => {
        try {
            const response = await api.put<OnboardingSesion>(`/onboarding/sesiones/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar sesión:', error);
            throw error;
        }
    },

    deleteSesion: async (id: string) => {
        try {
            await api.delete(`/onboarding/sesiones/${id}`);
        } catch (error) {
            console.error('Error al eliminar sesión:', error);
            throw error;
        }
    },

    agregarParticipantes: async (sesionId: string, colaboradoresIds: string[]) => {
        try {
            const response = await api.post(`/onboarding/sesiones/${sesionId}/participantes`, {
                colaboradoresIds,
            });
            return response.data;
        } catch (error) {
            console.error('Error al agregar participantes:', error);
            throw error;
        }
    },

    removerParticipante: async (sesionId: string, colaboradorId: string) => {
        try {
            await api.delete(`/onboarding/sesiones/${sesionId}/participantes/${colaboradorId}`);
        } catch (error) {
            console.error('Error al remover participante:', error);
            throw error;
        }
    },

    cambiarEstadoSesion: async (id: string, estado: 'programada' | 'en_curso' | 'completada' | 'cancelada') => {
        try {
            const response = await api.put(`/onboarding/sesiones/${id}/estado`, { estado });
            return response.data;
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            throw error;
        }
    },

    getSesionesPorMes: async (año: number, mes: number) => {
        try {
            const response = await api.get(`/onboarding/sesiones/mes/${año}/${mes}`);
            return response.data;
        } catch (error) {
            console.error('Error al cargar sesiones por mes:', error);
            return [];
        }
    },

    getSesionesProximas: async (limite: number = 5) => {
        try {
            const response = await api.get(`/onboarding/sesiones/proximas?limite=${limite}`);
            return response.data;
        } catch (error) {
            console.error('Error al cargar sesiones próximas:', error);
            return [];
        }
    },

    getStats: async () => {
        try {
            const response = await api.get('/onboarding/sesiones/stats');
            return response.data;
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            return {
                total: 0,
                programadas: 0,
                enCurso: 0,
                completadas: 0,
                canceladas: 0,
            };
        }
    },
};