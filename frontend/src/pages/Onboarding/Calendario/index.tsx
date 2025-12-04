import { useState, useEffect } from 'react';
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
    const [sesiones, setSesiones] = useState<OnboardingSesion[]>([]);
    const [filteredSesiones, setFilteredSesiones] = useState<OnboardingSesion[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    // Aplicar filtro cuando cambia el filter o las sesiones
    useEffect(() => {
        applyFilter();
    }, [filter, sesiones]);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
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
            setFilteredSesiones(Array.isArray(sesionesData?.data) ? sesionesData.data : []);
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
            setSesiones([]);
            setFilteredSesiones([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        if (!filter) {
            setFilteredSesiones(sesiones);
            return;
        }

        const filtered = sesiones.filter(sesion =>
            sesion.tipo && sesion.tipo.id === filter
        );
        setFilteredSesiones(filtered);

        // También filtrar próximas sesiones para mostrar en la sección correspondiente
        if (filter) {
            const proximasFiltradas = proximasSesiones.filter(sesion =>
                sesion.tipo && sesion.tipo.id === filter
            );
            setProximasSesiones(proximasFiltradas);
        }
    };

    const handleFilterClick = (tipoId: string) => {
        if (filter === tipoId) {
            setFilter(''); // Quitar filtro
            loadData(); // Recargar datos completos
        } else {
            setFilter(tipoId);
        }
    };

    const handleEventClick = (evento: any) => {
        console.log('Evento clickeado:', evento);
        // Encontrar la sesión correspondiente
        const sesionEncontrada = sesiones.find(s => s.id === evento.id);
        if (sesionEncontrada) {
            handleSesionClick(sesionEncontrada);
        }
    };

    const handleSesionClick = (sesion: OnboardingSesion) => {
        setSelectedSesion(sesion);
        setShowSesionModal(true);
    };

    const handleDayClick = (date: Date) => {
        console.log('Día clickeado:', date);
        // Mostrar sesiones para ese día
        const sesionesDelDia = sesiones.filter(sesion => {
            const fechaSesion = new Date(sesion.fechaInicio);
            return fechaSesion.toDateString() === date.toDateString();
        });

        if (sesionesDelDia.length > 0) {
            // Si hay sesiones, mostrar la primera
            handleSesionClick(sesionesDelDia[0]);
        } else {
            // Si no hay sesiones, sugerir crear una
            showToast({
                title: 'No hay sesiones programadas',
                message: `¿Deseas crear una sesión para el ${date.toLocaleDateString('es-ES')}?`,
                type: 'info',
                action: {
                    label: 'Crear sesión',
                    onClick: () => navigate('/onboarding/agendar', {
                        state: { fechaInicio: date.toISOString().split('T')[0] }
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

    // Calcular estadísticas del filtro actual
    const getFilteredStats = () => {
        if (!filter) return stats;

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
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {new Date(selectedSesion.fechaInicio).toLocaleDateString('es-ES', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Fin:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {new Date(selectedSesion.fechaFin).toLocaleDateString('es-ES', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Duración:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {(() => {
                                                    const inicio = new Date(selectedSesion.fechaInicio);
                                                    const fin = new Date(selectedSesion.fechaFin);
                                                    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
                                    navigate(`/onboarding/editar/${selectedSesion.id}`);
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