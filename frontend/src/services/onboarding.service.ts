import {
    formatDateForBackend,
    parseDateFromBackend,
    dateToBackendFormat,
    getTodayForBackend,
    addDays,
    addDaysToDateString
} from '../utils/dateUtils';
import api from '../api/axios.config';
import { PaginatedResponse } from './colaboradores.service';

// Función auxiliar para validar UUID
function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

export interface OnboardingTipo {
    id: string;  // UUID real
    nombre: string;
    color: string;
    descripcion?: string;
    duracionDias: number;
    activo: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface OnboardingParticipante {
    id: string;
    nombreCompleto: string;
    email: string;
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
    participantes?: OnboardingParticipante[];
    activo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSesionDto {
    titulo: string;
    descripcion?: string;
    tipoId: string;  // UUID del tipo
    fechaInicio: string;
    fechaFin: string;
    estado?: 'programada' | 'en_curso' | 'completada' | 'cancelada';
    capacidadMaxima?: number;
    ubicacion?: string;
    enlaceVirtual?: string;
    notas?: string;
    participantesIds?: string[];
}

export interface SesionStats {
    total: number;
    programadas: number;
    enCurso: number;
    completadas: number;
    canceladas: number;
    capacidadDisponible: number;
    participantesTotales: number;
    porTipo: Array<{ tipoNombre: string; cantidad: number }>;
}

export const onboardingService = {
    // Tipos de onboarding - desde API real
    getTipos: async (): Promise<OnboardingTipo[]> => {
        try {
            const response = await api.get<OnboardingTipo[]>('/onboarding/tipos');
            return response.data;
        } catch (error) {
            console.error('Error al cargar tipos de onboarding:', error);
            // NO retornar datos falsos - mejor retornar array vacío
            return [];
        }
    },

    // Crear sesión - DEBE usar UUID real
    createSesion: async (data: {
        titulo: string;
        descripcion?: string;
        tipoId: string;  // DEBE ser UUID real
        fechaInicio: string;
        fechaFin: string;
        estado?: 'programada' | 'en_curso' | 'completada' | 'cancelada';
        capacidadMaxima?: number;
        ubicacion?: string;
        enlaceVirtual?: string;
        notas?: string;
        participantesIds?: string[];
    }): Promise<OnboardingSesion> => {
        // Validar que tipoId sea un UUID
        if (!data.tipoId || !isValidUUID(data.tipoId)) {
            throw new Error('El tipoId debe ser un UUID válido');
        }

        // Asegurar que las fechas estén en formato correcto
        const datosEnviar = {
            ...data,
            fechaInicio: formatDateForBackend(data.fechaInicio),
            fechaFin: formatDateForBackend(data.fechaFin),
        };

        const response = await api.post('/onboarding/sesiones', datosEnviar);
        return response.data;
    },

    // Estadísticas
    getStats: async (): Promise<SesionStats> => {
        try {
            const response = await api.get('/onboarding/sesiones/stats');
            return response.data;
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            // Datos de respaldo
            return {
                total: 0,
                programadas: 0,
                enCurso: 0,
                completadas: 0,
                canceladas: 0,
                capacidadDisponible: 0,
                participantesTotales: 0,
                porTipo: [],
            };
        }
    },

    // Sesiones próximas
    getProximasSesiones: async (limite: number = 5): Promise<OnboardingSesion[]> => {
        try {
            const response = await api.get(`/onboarding/sesiones/proximas?limite=${limite}`);
            return response.data;
        } catch (error) {
            console.error('Error al cargar próximas sesiones:', error);

            // Datos de ejemplo para desarrollo - usando dateUtil
            const tipos = await onboardingService.getTipos();

            // Obtener fecha actual en formato UTC
            const hoy = getTodayForBackend();

            // Crear fechas usando dateUtil
            const fechaInicio1 = addDaysToDateString(hoy, 2);
            const fechaFin1 = addDaysToDateString(hoy, 5);
            const fechaInicio2 = addDaysToDateString(hoy, 5);
            const fechaFin2 = addDaysToDateString(hoy, 7);

            // Crear objetos Date para createdAt/updatedAt usando parseDateFromBackend
            const fechaCreacion = parseDateFromBackend(hoy);

            return [
                {
                    id: '1',
                    titulo: 'Journey to Cloud - Cohort 1',
                    descripcion: 'Sesión intensiva de onboarding para desarrolladores Cloud',
                    tipo: tipos.find(t => t.nombre === 'Journey to Cloud') || tipos[0],
                    fechaInicio: `${fechaInicio1}T09:00:00.000Z`,
                    fechaFin: `${fechaFin1}T17:00:00.000Z`,
                    estado: 'programada',
                    capacidadMaxima: 20,
                    ubicacion: 'Sala de Conferencias A',
                    enlaceVirtual: 'https://meet.google.com/abc-defg-hij',
                    notas: 'Traer laptop con Docker instalado',
                    participantes: [
                        { id: 'p1', nombreCompleto: 'Carlos Martínez', email: 'carlos@example.com' },
                        { id: 'p2', nombreCompleto: 'Ana García', email: 'ana@example.com' },
                    ],
                    activo: true,
                    createdAt: fechaCreacion.toISOString(),
                    updatedAt: fechaCreacion.toISOString(),
                },
                {
                    id: '2',
                    titulo: 'Capítulo Frontend - Introducción a React',
                    descripcion: 'Sesión de onboarding para desarrolladores Frontend',
                    tipo: tipos.find(t => t.nombre === 'Capítulo Frontend') || tipos[0],
                    fechaInicio: `${fechaInicio2}T10:00:00.000Z`,
                    fechaFin: `${fechaFin2}T18:00:00.000Z`,
                    estado: 'programada',
                    capacidadMaxima: 15,
                    ubicacion: 'Sala de Capacitación B',
                    enlaceVirtual: 'https://meet.google.com/xyz-uvw-rst',
                    notas: 'Conocimientos básicos de JavaScript requeridos',
                    participantes: [
                        { id: 'p3', nombreCompleto: 'Laura Rodríguez', email: 'laura@example.com' },
                    ],
                    activo: true,
                    createdAt: fechaCreacion.toISOString(),
                    updatedAt: fechaCreacion.toISOString(),
                },
            ];
        }
    },

    // Todas las sesiones con filtros
    getSesiones: async (filters?: {
        tipoId?: string;
        estado?: string;
        fechaDesde?: string;
        fechaHasta?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<OnboardingSesion>> => {
        try {
            // Formatear fechas para el backend si existen
            const params: any = { ...filters };

            if (params.fechaDesde) {
                params.fechaDesde = formatDateForBackend(params.fechaDesde);
            }

            if (params.fechaHasta) {
                params.fechaHasta = formatDateForBackend(params.fechaHasta);
            }

            const response = await api.get('/onboarding/sesiones', { params });
            return response.data;
        } catch (error) {
            console.error('Error al cargar sesiones:', error);
            return {
                data: [],
                meta: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };
        }
    },

    getAllSesiones: async (filters?: any) => {
        try {
            // Formatear fechas para el backend si existen
            const params: any = {
                limit: 100, // Obtener todas las sesiones
                ...filters
            };

            if (params.fechaDesde) {
                params.fechaDesde = formatDateForBackend(params.fechaDesde);
            }

            if (params.fechaHasta) {
                params.fechaHasta = formatDateForBackend(params.fechaHasta);
            }

            const response = await api.get('/onboarding/sesiones', { params });
            return response.data;
        } catch (error) {
            console.error('Error al cargar todas las sesiones:', error);
            return { data: [], meta: { total: 0 } };
        }
    },

    // Sesiones por mes
    getSesionesPorMes: async (año: number, mes: number, tipoId?: string) => {
        try {
            let url = `/onboarding/sesiones/mes/${año}/${mes}`;
            if (tipoId) {
                url += `?tipoId=${tipoId}`;
            }

            const response = await api.get(url);
            return response.data || [];
        } catch (error) {
            console.error('Error al cargar sesiones por mes:', error);
            return [];
        }
    },

    // Obtener sesión por ID
    getSesionById: async (id: string): Promise<OnboardingSesion> => {
        try {
            const response = await api.get(`/onboarding/sesiones/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al cargar sesión:', error);
            throw error;
        }
    },

    // Actualizar sesión
    updateSesion: async (id: string, data: Partial<{
        titulo: string;
        descripcion?: string;
        tipoId: string;
        fechaInicio: string;
        fechaFin: string;
        estado: 'programada' | 'en_curso' | 'completada' | 'cancelada';
        capacidadMaxima: number;
        ubicacion?: string;
        enlaceVirtual?: string;
        notas?: string;
    }>): Promise<OnboardingSesion> => {
        // Asegurarse de que las fechas estén en formato correcto usando dateUtil
        const datosEnviar = {
            ...data,
            fechaInicio: formatDateForBackend(data.fechaInicio || ''),
            fechaFin: formatDateForBackend(data.fechaFin || ''),
        };

        console.log('Enviando al backend:', datosEnviar);

        const response = await api.put(`/onboarding/sesiones/${id}`, datosEnviar);
        return response.data;
    },

    // Eliminar sesión
    deleteSesion: async (id: string): Promise<void> => {
        await api.delete(`/onboarding/sesiones/${id}`);
    },

    // Agregar participantes
    agregarParticipantes: async (sesionId: string, colaboradoresIds: string[]): Promise<OnboardingSesion> => {
        const response = await api.post(`/onboarding/sesiones/${sesionId}/participantes`, {
            colaboradoresIds,
        });
        return response.data;
    },

    // Cambiar estado
    cambiarEstado: async (sesionId: string, estado: 'programada' | 'en_curso' | 'completada' | 'cancelada'): Promise<OnboardingSesion> => {
        const response = await api.put(`/onboarding/sesiones/${sesionId}/estado`, { estado });
        return response.data;
    },
};