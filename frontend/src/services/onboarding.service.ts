import api from '../api/axios.config';
import { PaginatedResponse } from './colaboradores.service';
// IMPORTANTE: Asegúrate de tener instalada la librería: npm install date-fns
import { format, parseISO, isValid } from 'date-fns';

// Función auxiliar para validar UUID
function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// ==========================================
// CORRECCIÓN CRÍTICA DE FECHAS CON DATE-FNS
// ==========================================
const formatDateForBackend = (date: string | Date | undefined): string => {
    if (!date) return '';

    try {
        // CASO 1: Si es un objeto Date nativo
        // date-fns 'format' usa la hora local del sistema por defecto, 
        // evitando el problema de conversión a UTC que resta 5 horas.
        if (date instanceof Date) {
            return format(date, 'yyyy-MM-dd');
        }

        // CASO 2: Manejo de Strings
        if (typeof date === 'string') {
            // Si ya viene formateado perfecto "2025-12-10", lo devolvemos tal cual.
            // Esto evita que parseISO lo convierta a Date y riesgo de cambio de zona.
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return date;
            }

            // Si viene con hora ISO (ej: "2025-12-10T05:00:00.000Z"), cortamos el string.
            // Es la forma más segura de conservar la fecha visual sin interpretaciones horarias.
            if (date.includes('T')) {
                return date.split('T')[0];
            }

            // Fallback: Intentamos parsear con date-fns para otros formatos extraños
            const parsed = parseISO(date);
            if (isValid(parsed)) {
                return format(parsed, 'yyyy-MM-dd');
            }
        }
    } catch (error) {
        console.error('Error al formatear fecha:', date, error);
    }

    return '';
};

export interface OnboardingTipo {
    id: string;
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
    // Tipos de onboarding
    getTipos: async (): Promise<OnboardingTipo[]> => {
        try {
            const response = await api.get<OnboardingTipo[]>('/onboarding/tipos');
            return response.data;
        } catch (error) {
            console.error('Error al cargar tipos de onboarding:', error);
            return [];
        }
    },

    // Crear sesión
    createSesion: async (data: CreateSesionDto): Promise<OnboardingSesion> => {
        if (!data.tipoId || !isValidUUID(data.tipoId)) {
            throw new Error('El tipoId debe ser un UUID válido');
        }

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
            return [];
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
            // Clonamos filtros para no mutar el objeto original
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
            const params: any = {
                limit: 100,
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
    updateSesion: async (id: string, data: Partial<CreateSesionDto>): Promise<OnboardingSesion> => {
        const datosEnviar = {
            ...data,
            // Aplicamos la corrección segura con date-fns
            fechaInicio: data.fechaInicio ? formatDateForBackend(data.fechaInicio) : undefined,
            fechaFin: data.fechaFin ? formatDateForBackend(data.fechaFin) : undefined,
        };

        // Log limpio para depuración
        console.log('📤 Enviando actualización (Service):', datosEnviar);

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