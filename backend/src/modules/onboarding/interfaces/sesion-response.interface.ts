import { OnboardingSesion } from '../entities/onboarding-sesion.entity';
import { Colaborador } from '../../colaboradores/entities/colaborador.entity';

export interface SesionWithRelations
    extends Omit<OnboardingSesion, 'tipo' | 'creadoPor' | 'actualizadoPor'> {
    tipo: {
        id: string;
        nombre: string;
        color: string;
        duracionDias: number;
    };

    participantes: Colaborador[];

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

export interface PaginatedSesionesResponse {
    data: SesionWithRelations[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface SesionStats {
    total: number;
    programadas: number;
    enCurso: number;
    completadas: number;
    canceladas: number;
    capacidadDisponible: number;
    participantesTotales: number;
    porTipo: Array<{
        tipo: string;
        count: number;
        color: string;
    }>;
}
