import { Colaborador } from '../entities/colaborador.entity';

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

export interface ColaboradorWithRelations extends Omit<Colaborador, 'tipoOnboardingTecnico' | 'creadoPor' | 'actualizadoPor'> {
    tipoOnboardingTecnico?: {
        id: string;
        nombre: string;
        color: string;
    };
    creadoPor?: {
        id: string;
        nombre: string;
        email: string;
    };
    actualizadoPor?: {
        id: string;
        nombre: string;
        email: string;
    };
}

export interface StatsResponse {
    total: number;
    activos: number;
    completadosBienvenida: number;
    completadosTecnico: number;
    pendientesBienvenida: number;
    pendientesTecnico: number;
    porDepartamento: Array<{
        departamento: string;
        count: number;
    }>;
}