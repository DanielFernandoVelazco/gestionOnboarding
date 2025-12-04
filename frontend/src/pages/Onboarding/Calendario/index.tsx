import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [showAgendarModal, setShowAgendarModal] = useState(false);
    const [selectedSesion, setSelectedSesion] = useState<OnboardingSesion | null>(null);
    const [showSesionModal, setShowSesionModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [tiposData, statsData, proximasData] = await Promise.all([
                onboardingService.getTipos(),
                onboardingService.getStats(),
                onboardingService.getProximasSesiones(5)
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
        } catch (err: any) {
            console.error('Error al cargar datos:', err);
            setError(err.message || 'Error al cargar datos');
            setTipos([]);
            setStats({
                total: 0,
                programadas: 0,
                enCurso: 0,
                completadas: 0,
                canceladas: 0,
            });
            setProximasSesiones([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (evento: any) => {
        console.log('Evento clickeado:', evento);
    };

    const handleSesionClick = (sesion: OnboardingSesion) => {
        setSelectedSesion(sesion);
        setShowSesionModal(true);
    };

    const handleDayClick = (date: Date) => {
        console.log('Día clickeado:', date);
        // Podrías mostrar un modal para crear sesión en esta fecha
    };

    const handleAgendarClick = () => {
        // Navegar a página de creación de sesión o mostrar modal
        navigate('/onboarding/agendar'); // Necesitarías crear esta página
        // O mostrar modal:
        // setShowAgendarModal(true);
    };

    const handleVerDetalles = (sesionId: string) => {
        // Navegar a página de detalles de sesión
        navigate(`/onboarding/sesiones/${sesionId}`);
    };

    const handleEditarSesion = (sesionId: string) => {
        // Navegar a página de edición de sesión
        navigate(`/onboarding/editar/${sesionId}`);
    };

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
                    title={selectedSesion.titulo}
                    size="lg"
                >
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Tipo de Onboarding
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: selectedSesion.tipo.color }}
                                ></div>
                                <p className="text-gray-900 dark:text-white">
                                    {selectedSesion.tipo.nombre}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Fecha Inicio
                                </h4>
                                <p className="text-gray-900 dark:text-white">
                                    {new Date(selectedSesion.fechaInicio).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Fecha Fin
                                </h4>
                                <p className="text-gray-900 dark:text-white">
                                    {new Date(selectedSesion.fechaFin).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Estado
                            </h4>
                            <span className={`badge ${getEstadoColor(selectedSesion.estado)}`}>
                                {getEstadoTexto(selectedSesion.estado)}
                            </span>
                        </div>

                        {selectedSesion.ubicacion && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Ubicación
                                </h4>
                                <p className="text-gray-900 dark:text-white">{selectedSesion.ubicacion}</p>
                            </div>
                        )}

                        {selectedSesion.enlaceVirtual && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Enlace Virtual
                                </h4>
                                <a
                                    href={selectedSesion.enlaceVirtual}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary-hover underline"
                                >
                                    {selectedSesion.enlaceVirtual}
                                </a>
                            </div>
                        )}

                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Participantes
                            </h4>
                            <p className="text-gray-900 dark:text-white">
                                {selectedSesion.participantes?.length || 0} / {selectedSesion.capacidadMaxima}
                            </p>
                            {selectedSesion.participantes && selectedSesion.participantes.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {selectedSesion.participantes.slice(0, 3).map((participante: any) => (
                                        <div key={participante.id} className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {participante.nombreCompleto || participante.email}
                                            </span>
                                        </div>
                                    ))}
                                    {selectedSesion.participantes.length > 3 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            +{selectedSesion.participantes.length - 3} más
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedSesion.notas && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Notas
                                </h4>
                                <p className="text-gray-900 dark:text-white">{selectedSesion.notas}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                    onClick={() => setFilter('')}
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
                        onClick={() => setFilter(tipo.id)}
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
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Sesiones Totales
                        </h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.total || 0}
                        </p>
                    </Card>
                    <Card>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Programadas
                        </h3>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.programadas || 0}
                        </p>
                    </Card>
                    <Card>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            En Curso
                        </h3>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {stats.enCurso || 0}
                        </p>
                    </Card>
                    <Card>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Completadas
                        </h3>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.completadas || 0}
                        </p>
                    </Card>
                    <Card>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Canceladas
                        </h3>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {stats.canceladas || 0}
                        </p>
                    </Card>
                </div>
            )}

            {/* Calendario Principal */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <Calendar
                    onEventClick={handleEventClick}
                    onSesionClick={handleSesionClick}
                />
            </div>

            {/* Próximas sesiones */}
            <Card
                title="Próximas Sesiones"
                subtitle="Sesiones programadas para las próximas semanas"
                actions={
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/onboarding/sesiones')}
                    >
                        Ver todas
                        <span className="material-symbols-outlined">chevron_right</span>
                    </Button>
                }
            >
                {proximasSesiones.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2">calendar_month</span>
                        <p>No hay sesiones programadas</p>
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
                                                {new Date(sesion.fechaInicio).toLocaleDateString('es-ES')} -
                                                {new Date(sesion.fechaFin).toLocaleDateString('es-ES')}
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