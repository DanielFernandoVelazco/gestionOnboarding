import api from '../api/axios.config';

// Interfaces del calendario
export interface EventoCalendario {
    id: string;
    titulo: string;
    descripcion?: string;
    tipo: string;
    fechaInicio: string;
    fechaFin?: string;
    todoElDia: boolean;
    color: string;
    sesion?: {
        id: string;
        titulo: string;
        tipo?: {
            nombre: string;
            color: string;
        };
    };
    creadoPor?: {
        id: string;
        nombre: string;
        email: string;
    };
    activo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SesionCalendario {
    id: string;
    titulo: string;
    descripcion?: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
    tipo?: {
        id: string;
        nombre: string;
        color: string;
    };
    participantes?: any[];
}

export interface DiaCalendario {
    fecha: Date;
    esMesActual: boolean;
    eventos: EventoCalendario[];
    sesiones: SesionCalendario[];
}

export interface MesCalendario {
    año: number;
    mes: number;
    nombreMes: string;
    semanas: DiaCalendario[][];
}

// Interfaces de notificaciones
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

// Definición de Colaborador (necesario para la función getParticipantesSesion)
export interface Colaborador {
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
    // Calendario - Obtener eventos del mes
    getCalendarioMes: async (año: number, mes: number): Promise<MesCalendario> => {
        try {
            // Obtener eventos del calendario
            const fechaDesde = new Date(año, mes - 1, 1);
            const fechaHasta = new Date(año, mes, 0);

            const [eventosResponse, sesionesResponse] = await Promise.all([
                api.get('/calendario/eventos', {
                    params: {
                        fechaDesde: fechaDesde.toISOString().split('T')[0],
                        fechaHasta: fechaHasta.toISOString().split('T')[0],
                    },
                }),
                api.get('/onboarding/sesiones/mes/' + año + '/' + mes),
            ]);

            const eventos: EventoCalendario[] = eventosResponse.data || [];
            const sesiones: SesionCalendario[] = sesionesResponse.data || [];

            // Generar semanas del mes
            const semanas = generarSemanas(año, mes - 1, eventos, sesiones);

            // Nombres de meses en español
            const nombresMeses = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];

            return {
                año,
                mes,
                nombreMes: nombresMeses[mes - 1],
                semanas,
            };
        } catch (error) {
            console.error('Error al cargar calendario:', error);
            // Retornar calendario vacío en caso de error
            return {
                año,
                mes,
                nombreMes: new Date(año, mes - 1, 1).toLocaleDateString('es-ES', { month: 'long' }),
                semanas: [],
            };
        }
    },

    // Obtener próximos eventos
    getEventosProximos: async (limite: number = 10) => {
        try {
            const response = await api.get('/calendario/eventos/proximos', {
                params: { limite },
            });
            return response.data;
        } catch (error) {
            console.error('Error al cargar eventos próximos:', error);
            return [];
        }
    },

    // MODIFICADO: Obtener participantes de una sesión específica
    getParticipantesSesion: async (sesionId: string): Promise<ParticipanteSesion[]> => {
        try {
            // Hacer una llamada a la API para obtener los detalles de la sesión específica
            const response = await api.get(`/onboarding/sesiones/${sesionId}`);

            // Extraer los participantes de la respuesta
            const participantes = response.data.participantes || [];

            // Mapear los datos al formato esperado
            return participantes.map((participante: { id: any; nombreCompleto: any; email: any; telefono: any; departamento: any; puesto: any; fechaIngreso: any; fechaOnboardingTecnico: any; lugarAsignacion: any; estadoTecnico: any; tipoOnboardingTecnico: any; }) => ({
                id: participante.id,
                nombreCompleto: participante.nombreCompleto,
                email: participante.email,
                telefono: participante.telefono,
                departamento: participante.departamento,
                puesto: participante.puesto,
                fechaIngreso: participante.fechaIngreso,
                fechaOnboardingTecnico: participante.fechaOnboardingTecnico,
                lugarAsignacion: participante.lugarAsignacion,
                estadoTecnico: participante.estadoTecnico,
                tipoOnboardingTecnico: participante.tipoOnboardingTecnico,
            }));
        } catch (error) {
            console.error('Error al cargar participantes de la sesión:', error);

            // En caso de error, devolver un array vacío
            return [];
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

    // Obtener sesiones próximas
    getSesionesProximas: async () => {
        try {
            const response = await api.get('/onboarding/sesiones/proximas');
            return response.data;
        } catch (error) {
            console.error('Error al cargar sesiones próximas:', error);
            return [];
        }
    },

    // Métodos de notificaciones
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

// Función auxiliar para generar semanas
function generarSemanas(
    año: number,
    mes: number,
    eventos: EventoCalendario[],
    sesiones: SesionCalendario[],
): DiaCalendario[][] {
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);

    // Ajustar primer día a lunes
    const primerDiaSemana = new Date(primerDia);
    const diaSemana = primerDia.getDay();
    primerDiaSemana.setDate(primerDia.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));

    // Ajustar último día a domingo
    const ultimoDiaSemana = new Date(ultimoDia);
    const diaSemanaUltimo = ultimoDia.getDay();
    if (diaSemanaUltimo !== 0) {
        ultimoDiaSemana.setDate(ultimoDia.getDate() + (7 - diaSemanaUltimo));
    }

    const semanas: DiaCalendario[][] = [];
    let fechaActual = new Date(primerDiaSemana);

    while (fechaActual <= ultimoDiaSemana) {
        const semana: DiaCalendario[] = [];

        for (let i = 0; i < 7; i++) {
            const fecha = new Date(fechaActual);
            const esMesActual = fecha.getMonth() === mes;

            // Filtrar eventos para este día
            const eventosDia = eventos.filter(evento => {
                const eventoFecha = new Date(evento.fechaInicio);
                return eventoFecha.getDate() === fecha.getDate() &&
                    eventoFecha.getMonth() === fecha.getMonth() &&
                    eventoFecha.getFullYear() === fecha.getFullYear();
            });

            // Filtrar sesiones para este día
            const sesionesDia = sesiones.filter(sesion => {
                const sesionFecha = new Date(sesion.fechaInicio);
                return sesionFecha.getDate() === fecha.getDate() &&
                    sesionFecha.getMonth() === fecha.getMonth() &&
                    sesionFecha.getFullYear() === fecha.getFullYear();
            });

            semana.push({
                fecha,
                esMesActual,
                eventos: eventosDia,
                sesiones: sesionesDia,
            });

            fechaActual.setDate(fechaActual.getDate() + 1);
        }

        semanas.push(semana);
    }

    return semanas;
}