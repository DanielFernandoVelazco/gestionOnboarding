import api from '../api/axios.config';

export interface Colaborador {
    id: string;
    nombreCompleto: string;
    email: string;
    telefono?: string;
    departamento?: string;
    puesto?: string;
    fechaIngreso: string;
    estadoBienvenida: 'pendiente' | 'en_progreso' | 'completado';
    estadoTecnico: 'pendiente' | 'en_progreso' | 'completado';
    fechaOnboardingTecnico?: string;
    tipoOnboardingTecnico?: {
        id: string;
        nombre: string;
        color: string;
    };
    notas?: string;
    activo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateColaboradorDto {
    nombreCompleto: string;
    email: string;
    telefono?: string;
    departamento?: string;
    puesto?: string;
    fechaIngreso: string;
    estadoBienvenida?: 'pendiente' | 'en_progreso' | 'completado';
    estadoTecnico?: 'pendiente' | 'en_progreso' | 'completado';
    fechaOnboardingTecnico?: string;
    tipoOnboardingTecnicoId?: string;
    notas?: string;
    activo?: boolean;
}

export interface FilterColaboradoresDto {
    search?: string;
    estadoBienvenida?: 'pendiente' | 'en_progreso' | 'completado';
    estadoTecnico?: 'pendiente' | 'en_progreso' | 'completado';
    departamento?: string;
    activo?: boolean;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export const colaboradoresService = {
    getAll: async (filters: FilterColaboradoresDto = {}) => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });

        const response = await api.get<PaginatedResponse<Colaborador>>(
            `/colaboradores?${params.toString()}`
        );
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Colaborador>(`/colaboradores/${id}`);
        return response.data;
    },

    getByEmail: async (email: string) => {
        const response = await api.get<Colaborador>(`/colaboradores/email/${email}`);
        return response.data;
    },

    create: async (data: CreateColaboradorDto) => {
        const response = await api.post<Colaborador>('/colaboradores', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateColaboradorDto>) => {
        const response = await api.put<Colaborador>(`/colaboradores/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/colaboradores/${id}`);
    },

    getStats: async () => {
        const response = await api.get('/colaboradores/stats');
        return response.data;
    },

    bulkUpdate: async (ids: string[], data: {
        estadoBienvenida?: 'pendiente' | 'en_progreso' | 'completado';
        estadoTecnico?: 'pendiente' | 'en_progreso' | 'completado';
        activo?: boolean;
    }) => {
        const response = await api.post('/colaboradores/bulk-update', { ids, ...data });
        return response.data;
    },

    updateEstado: async (
        id: string,
        tipo: 'bienvenida' | 'tecnico',
        estado: 'pendiente' | 'en_progreso' | 'completado'
    ) => {
        const response = await api.put(`/colaboradores/${id}/estado/${tipo}`, { estado });
        return response.data;
    },
};