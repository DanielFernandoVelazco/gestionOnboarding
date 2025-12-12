import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Importaciones de date-fns
import { format, parse, differenceInDays, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

import Calendar from '../../../components/shared/Calendar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { onboardingService, OnboardingSesion } from '../../../services/onboarding.service';
import { useToast } from '../../../contexts/ToastContext';

const CalendarioOnboardings = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [filter, setFilter] = useState('');
    const [tipos, setTipos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [proximasSesiones, setProximasSesiones] = useState<OnboardingSesion[]>([]);
    const [showAgendarModal, setShowAgendarModal] = useState(false); // Nota: Esta variable no se estaba usando en el render, pero la mantengo
    const [selectedSesion, setSelectedSesion] = useState<OnboardingSesion | null>(null);
    const [showSesionModal, setShowSesionModal] = useState(false);
    const [sesiones, setSesiones] = useState<OnboardingSesion[]>([]);
    const [filteredSesiones, setFilteredSesiones] = useState<OnboardingSesion[]>([]);

    // ----------------------------------------------------------------------
    // HELPERS DE FECHAS CON DATE-FNS (Solución al desfase horario)
    // ----------------------------------------------------------------------

    /**
     * Parsea una fecha string 'YYYY-MM-DD' asegurando que se interprete
     * como hora LOCAL (00:00:00) y no como UTC.
     * Esto corrige el error donde las fechas salían un día antes.
     */
    const parseLocalDate = (dateString: string): Date => {
        if (!dateString) return new Date();
        // 'yyyy-MM-dd' es el formato estándar que viene del backend o inputs date
        return parse(dateString, 'yyyy-MM-dd', new Date());
    };

    /**
     * Formatea para mostrar al usuario: "10/12/2025"
     */
    const formatDateForDisplay = (dateString: string): string => {
        if (!dateString) return '';
        const date = parseLocalDate(dateString);
        return format(date, 'dd/MM/yyyy');
    };

    /**
     * Formatea fecha larga: "miércoles, 10 de diciembre de 2025"
     */
    const formatDateLong = (dateString: string): string => {
        if (!dateString) return '';
        const date = parseLocalDate(dateString);
        // PPPP da el formato largo localizado (ej: Wednesday, December 10th, 2025)
        return format(date, 'PPPP', { locale: es });
    };

    /**
     * Formatea para el input HTML type="date": "2025-12-10"
     */
    const formatDateForInput = (date: Date): string => {
        return format(date, 'yyyy-MM-dd');
    };

    // ----------------------------------------------------------------------
    // LÓGICA DE CARGA DE DATOS
    // ----------------------------------------------------------------------

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('🔄 Cargando datos del calendario...');
            const [tiposData, statsData, proximasData, sesionesData] = await Promise.all([
                onboardingService.getTipos(),
                onboardingService.getStats(),
                onboardingService.getProximasSesiones(5),
                onboardingService.getAllSesiones()
            ]);

            setTipos(Array.isArray(tiposData) ? tiposData : []);
            setStats(statsData || {
                total: 0,
                programadas: 0,
                enCurso: 0,
                completadas: 0,
                canceladas: 0,
            });
            setProximasSesiones(Array.isArray(proximasData) ? proximasData : []);
            setSesiones(Array.isArray(sesionesData?.data) ? sesionesData.data : []);
            // Inicialmente las filtradas son todas
            // Nota: El useEffect de 'filter' se encargará de refiltrar si hay un filtro activo
            setFilteredSesiones(Array.isArray(sesionesData?.data) ? sesionesData.data : []);

        } catch (err: any) {
            console.error('Error al cargar datos:', err);
            setError(err.message || 'Error al cargar datos');
            // Resetear estados en caso de error para evitar UI rota
            setTipos([]);
            setStats({ total: 0, programadas: 0, enCurso: 0, completadas: 0, canceladas: 0 });
            setProximasSesiones([]);
            setSesiones([]);
            setFilteredSesiones([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Carga inicial
    useEffect(() => {
        loadData();

        // OPCIONAL: Recargar datos cuando la ventana recupera el foco
        // (Útil si el usuario editó en otra pestaña o volvió de una navegación externa)
        const onFocus = () => loadData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [loadData]);

    // Aplicar filtro cuando cambia el filter o las sesiones cargadas
    useEffect(() => {
        if (!filter) {
            setFilteredSesiones(sesiones);
        } else {
            const filtered = sesiones.filter(sesion =>
                sesion.tipo && sesion.tipo.id === filter
            );
            setFilteredSesiones(filtered);

            // Opcional: Filtrar también las próximas sesiones si se desea consistencia visual
            /* 
            const proximasFiltradas = proximasSesiones.filter(sesion =>
                 sesion.tipo && sesion.tipo.id === filter
            );
            setProximasSesiones(proximasFiltradas);
            */
        }
    }, [filter, sesiones]); // proximasSesiones removido para evitar bucles si se descomenta lógica

    const handleFilterClick = (tipoId: string) => {
        if (filter === tipoId) {
            setFilter('');
            // No es necesario llamar loadData() aquí porque el useEffect de arriba
            // ya reseteará filteredSesiones a 'sesiones' (que tiene todos los datos)
        } else {
            setFilter(tipoId);
        }
    };

    // ----------------------------------------------------------------------
    // MANEJO DE EVENTOS
    // ----------------------------------------------------------------------

    const handleEventClick = (evento: any) => {
        console.log('Evento clickeado (Calendario):', evento);
        // Buscar por ID para asegurar tener la data más fresca del estado 'sesiones'
        const sesionEncontrada = sesiones.find(s => s.id === evento.id);

        if (sesionEncontrada) {
            handleSesionClick(sesionEncontrada);
        } else {
            // Fallback si viene directo del componente calendario con toda la data
            console.warn('Sesión no encontrada en estado local, usando datos del evento');
            // Aquí podrías decidir si usar 'evento.sesion' si tu componente Calendar lo devuelve
        }
    };

    const handleSesionClick = (sesion: OnboardingSesion) => {
        setSelectedSesion(sesion);
        setShowSesionModal(true);
    };

    const handleDayClick = (date: Date) => {
        // date viene del componente Calendar, usualmente es un objeto Date
        console.log('Día clickeado:', date);

        // Normalizamos la fecha clickeada al inicio del día para comparar correctamente
        const clickDateStart = startOfDay(date);

        // Filtrar sesiones usando date-fns isSameDay
        // Esto es mucho más seguro que comparar milisegundos manualmente
        const sesionesDelDia = sesiones.filter(sesion => {
            const fechaSesionLocal = parseLocalDate(sesion.fechaInicio);
            return isSameDay(fechaSesionLocal, clickDateStart);
        });

        if (sesionesDelDia.length > 0) {
            handleSesionClick(sesionesDelDia[0]);
        } else {
            // Formatear fecha para el mensaje
            const formattedDate = format(date, 'PPPP', { locale: es });

            showToast({
                title: 'No hay sesiones programadas',
                message: `¿Deseas crear una sesión para el ${formattedDate}?`,
                type: 'info',
                action: {
                    label: 'Crear sesión',
                    onClick: () => navigate('/onboarding/agendar', {
                        // Enviamos la fecha en formato YYYY-MM-DD
                        state: { fechaInicio: formatDateForInput(date) }
                    })
                }
            });
        }
    };

    const handleAgendarClick = () => {
        navigate('/onboarding/agendar');
    };

    const handleVerDetalles = (sesionId: string) => {
        navigate(`/onboarding/sesiones/${sesionId}`);
    };

    const handleEditarSesion = (sesionId: string) => {
        // Al navegar fuera, cuando el usuario regrese, esperamos que el hook de useEffect
        // o el evento de foco recargue los datos.
        navigate(`/onboarding/editar/${sesionId}`);
    };

    // ----------------------------------------------------------------------
    // UI HELPERS
    // ----------------------------------------------------------------------

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'programada':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'en_curso':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'completada':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'cancelada':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    const getEstadoTexto = (estado: string) => {
        const estadosMap: Record<string, string> = {
            'programada': 'Programada',
            'en_curso': 'En Curso',
            'completada': 'Completada',
            'cancelada': 'Cancelada',
        };
        return estadosMap[estado] || estado;
    };

    const getFilteredStats = () => {
        if (!filter) return stats;

        // Recalcular estadísticas en el frontend basadas en el filtro actual
        // (Esto evita tener que llamar al backend solo para stats filtrados)
        const filtered = sesiones.filter(s => s.tipo && s.tipo.id === filter);
        return {
            total: filtered.length,
            programadas: filtered.filter(s => s.estado === 'programada').length,
            enCurso: filtered.filter(s => s.estado === 'en_curso').length,
            completadas: filtered.filter(s => s.estado === 'completada').length,
            canceladas: filtered.filter(s => s.estado === 'cancelada').length,
        };
    };

    const currentStats = getFilteredStats();

    // ----------------------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------------------

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <div className="text-center py-8">
                    <span className="material-symbols-outlined text-4xl text-red-500 mb-2">
                        error
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Error al cargar datos
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <Button variant="primary" onClick={loadData}>
                        <span className="material-symbols-outlined">refresh</span>
                        Reintentar
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Modal de Detalles de Sesión */}
            {showSesionModal && selectedSesion && (
                <Modal
                    isOpen={showSesionModal}
                    onClose={() => setShowSesionModal(false)}
                    title="Detalles de la Sesión"
                    size="lg"
                >
                    <div className="space-y-6">
                        {/* Información principal */}
                        <div className="flex items-start gap-4">
                            <div
                                className="w-4 h-full rounded"
                                style={{ backgroundColor: selectedSesion.tipo?.color || '#00448D' }}
                            />
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {selectedSesion.titulo}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {selectedSesion.descripcion || 'Sin descripción'}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`badge ${getEstadoColor(selectedSesion.estado)} px-3 py-1`}>
                                    {getEstadoTexto(selectedSesion.estado)}
                                </span>
                                {selectedSesion.tipo && (
                                    <span className="text-xs font-medium px-2 py-1 rounded-full text-white"
                                        style={{ backgroundColor: selectedSesion.tipo.color }}>
                                        {selectedSesion.tipo.nombre}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Grid de información */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Fechas */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        📅 Fechas
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Inicio:</span>
                                            <span className="font-medium text-gray-900 dark:text-white capitalize">
                                                {formatDateLong(selectedSesion.fechaInicio)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Fin:</span>
                                            <span className="font-medium text-gray-900 dark:text-white capitalize">
                                                {formatDateLong(selectedSesion.fechaFin)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Duración:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {(() => {
                                                    const inicio = parseLocalDate(selectedSesion.fechaInicio);
                                                    const fin = parseLocalDate(selectedSesion.fechaFin);
                                                    // differenceInDays devuelve entero absoluto
                                                    const diffDays = Math.abs(differenceInDays(fin, inicio)) + 1;
                                                    return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ubicación y enlace */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        📍 Ubicación
                                    </h4>
                                    <p className="text-gray-900 dark:text-white">
                                        {selectedSesion.ubicacion || 'No especificada'}
                                    </p>
                                    {selectedSesion.enlaceVirtual && (
                                        <a
                                            href={selectedSesion.enlaceVirtual}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-primary hover:text-primary-hover text-sm mt-1"
                                        >
                                            <span className="material-symbols-outlined text-base">link</span>
                                            Enlace virtual
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Capacidad y participantes */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        👥 Participantes
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Capacidad:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {selectedSesion.capacidadMaxima} personas
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Inscritos:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {selectedSesion.participantes?.length || 0} personas
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Disponibles:</span>
                                            <span className="font-medium text-green-600 dark:text-green-400">
                                                {selectedSesion.capacidadMaxima - (selectedSesion.participantes?.length || 0)} cupos
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notas */}
                                {selectedSesion.notas && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            📝 Notas
                                        </h4>
                                        <p className="text-gray-900 dark:text-white text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                            {selectedSesion.notas}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lista de participantes */}
                        {selectedSesion.participantes && selectedSesion.participantes.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                    👤 Lista de Participantes ({selectedSesion.participantes.length})
                                </h4>
                                <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Nombre
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Email
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Departamento
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900/50">
                                            {selectedSesion.participantes.map((participante: any, index: number) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                        {participante.nombreCompleto}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        {participante.email}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        {participante.departamento || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <Button
                                variant="secondary"
                                onClick={() => setShowSesionModal(false)}
                            >
                                Cerrar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowSesionModal(false);
                                    handleEditarSesion(selectedSesion.id);
                                }}
                            >
                                <span className="material-symbols-outlined">edit</span>
                                Editar Sesión
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Calendario de Onboardings Técnicos
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualiza y gestiona todas las sesiones programadas para el año.
                    </p>
                    {filter && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-primary font-medium">
                                Filtrado por: {tipos.find(t => t.id === filter)?.nombre}
                            </span>
                            <button
                                onClick={() => setFilter('')}
                                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                (Quitar filtro)
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="primary" onClick={handleAgendarClick}>
                        <span className="material-symbols-outlined">add_circle</span>
                        Agendar Onboarding
                    </Button>
                    <Button variant="secondary" onClick={loadData}>
                        <span className="material-symbols-outlined">refresh</span>
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                <button
                    className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 ${filter === ''
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary ring-2 ring-primary'
                        : 'bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    onClick={() => handleFilterClick('')}
                >
                    <span className="material-symbols-outlined text-base">done</span>
                    <span className="text-sm font-medium">Todos</span>
                </button>

                {tipos.map((tipo) => (
                    <button
                        key={tipo.id}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 ${filter === tipo.id
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary ring-2 ring-primary'
                            : 'bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        onClick={() => handleFilterClick(tipo.id)}
                    >
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: tipo.color }}
                        ></span>
                        <span className="text-sm font-medium">{tipo.nombre}</span>
                    </button>
                ))}
            </div>

            {/* Estadísticas */}
            {currentStats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Sesiones Totales
                        </h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {currentStats.total || 0}
                        </p>
                        {filter && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Filtradas: {sesiones.length} → {filteredSesiones.length}
                            </p>
                        )}
                    </Card>
                    <Card>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Programadas
                        </h3>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {currentStats.programadas || 0}
                        </p>
                    </Card>
                    <Card>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            En Curso
                        </h3>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {currentStats.enCurso || 0}
                        </p>
                    </Card>
                    <Card>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Completadas
                        </h3>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {currentStats.completadas || 0}
                        </p>
                    </Card>
                    <Card>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Canceladas
                        </h3>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {currentStats.canceladas || 0}
                        </p>
                    </Card>
                </div>
            )}

            {/* Calendario Principal */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <Calendar
                    onEventClick={handleEventClick}
                    onSesionClick={handleSesionClick}
                    onDayClick={handleDayClick}
                    sesiones={filteredSesiones}
                />
            </div>

            {/* Próximas sesiones */}
            <Card
                title={`Próximas Sesiones ${filter ? `(${tipos.find(t => t.id === filter)?.nombre})` : ''}`}
                subtitle="Sesiones programadas para las próximas semanas"
                actions={
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/onboarding/sesiones', {
                            state: { filter: filter }
                        })}
                    >
                        Ver todas
                        <span className="material-symbols-outlined">chevron_right</span>
                    </Button>
                }
            >
                {proximasSesiones.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2">calendar_month</span>
                        <p>{filter ? 'No hay sesiones programadas para este tipo' : 'No hay sesiones programadas'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {proximasSesiones.map((sesion) => (
                            <div
                                key={sesion.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group"
                                onClick={() => handleSesionClick(sesion)}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: sesion.tipo.color }}
                                    ></div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary">
                                            {sesion.titulo}
                                        </h4>
                                        <div className="flex items-center gap-4 mt-1">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatDateForDisplay(sesion.fechaInicio)} -
                                                {formatDateForDisplay(sesion.fechaFin)}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                • {sesion.participantes?.length || 0} participantes
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`badge ${getEstadoColor(sesion.estado)}`}>
                                        {getEstadoTexto(sesion.estado)}
                                    </span>
                                    <button
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleVerDetalles(sesion.id);
                                        }}
                                    >
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default CalendarioOnboardings;