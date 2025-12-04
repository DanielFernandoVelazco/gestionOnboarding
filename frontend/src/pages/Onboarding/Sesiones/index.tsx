import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingService, OnboardingSesion } from '../../../services/onboarding.service';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import { useToast } from '../../../contexts/ToastContext';

const SesionesOnboarding = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [sesiones, setSesiones] = useState<OnboardingSesion[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');
    const [tipoFilter, setTipoFilter] = useState('');
    const [tipos, setTipos] = useState<any[]>([]);

    const estados = [
        { value: '', label: 'Todos los estados' },
        { value: 'programada', label: 'Programada' },
        { value: 'en_curso', label: 'En Curso' },
        { value: 'completada', label: 'Completada' },
        { value: 'cancelada', label: 'Cancelada' },
    ];

    const columns = [
        {
            key: 'titulo',
            header: 'Sesión',
            render: (sesion: OnboardingSesion) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {sesion.titulo}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                        {sesion.tipo.nombre}
                    </div>
                </div>
            ),
        },
        {
            key: 'fechas',
            header: 'Fechas',
            render: (sesion: OnboardingSesion) => (
                <div>
                    <div className="text-gray-900 dark:text-white">
                        {new Date(sesion.fechaInicio).toLocaleDateString('es-ES')}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                        al {new Date(sesion.fechaFin).toLocaleDateString('es-ES')}
                    </div>
                </div>
            ),
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (sesion: OnboardingSesion) => {
                const estadoColors: Record<string, string> = {
                    programada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                    en_curso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                    completada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                    cancelada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                };

                const estadoText: Record<string, string> = {
                    programada: 'Programada',
                    en_curso: 'En Curso',
                    completada: 'Completada',
                    cancelada: 'Cancelada',
                };

                return (
                    <span className={`badge ${estadoColors[sesion.estado] || 'bg-gray-100 text-gray-800'}`}>
                        {estadoText[sesion.estado] || sesion.estado}
                    </span>
                );
            },
        },
        {
            key: 'participantes',
            header: 'Participantes',
            render: (sesion: OnboardingSesion) => (
                <div>
                    <div className="text-gray-900 dark:text-white">
                        {sesion.participantes.length} / {sesion.capacidadMaxima}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                        {sesion.ubicacion || 'Virtual'}
                    </div>
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (sesion: OnboardingSesion) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/onboarding/sesiones/${sesion.id}`);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Ver detalles"
                    >
                        <span className="material-symbols-outlined">visibility</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/onboarding/editar/${sesion.id}`);
                        }}
                        className="p-1 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                        title="Editar"
                    >
                        <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSesion(sesion.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Eliminar"
                    >
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                </div>
            ),
        },
    ];

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadSesiones();
    }, [search, estadoFilter, tipoFilter]);

    const loadData = async () => {
        try {
            const tiposData = await onboardingService.getTipos();
            setTipos(tiposData);
        } catch (error) {
            console.error('Error al cargar tipos:', error);
        }
    };

    const loadSesiones = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (search) filters.search = search;
            if (estadoFilter) filters.estado = estadoFilter;
            if (tipoFilter) filters.tipoId = tipoFilter;

            const response = await onboardingService.getAllSesiones(filters);
            setSesiones(response.data || []);
        } catch (error) {
            console.error('Error al cargar sesiones:', error);
            showToast('Error al cargar sesiones', 'error');
            setSesiones([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSesion = async (sesionId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta sesión?')) {
            return;
        }

        try {
            await onboardingService.deleteSesion(sesionId);
            showToast('Sesión eliminada exitosamente', 'success');
            loadSesiones();
        } catch (error: any) {
            console.error('Error al eliminar sesión:', error);
            showToast(error.response?.data?.message || 'Error al eliminar sesión', 'error');
        }
    };

    const handleRowClick = (sesion: OnboardingSesion) => {
        navigate(`/onboarding/sesiones/${sesion.id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Sesiones de Onboarding
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gestiona todas las sesiones de onboarding programadas.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/onboarding/calendario')}
                    >
                        <span className="material-symbols-outlined">calendar_month</span>
                        Ver Calendario
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/onboarding/agendar')}
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        Nueva Sesión
                    </Button>
                </div>
            </div>

            <Card>
                {/* Filtros y Búsqueda */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex-grow">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                search
                            </span>
                            <Input
                                placeholder="Buscar por título o descripción..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Select
                            value={estadoFilter}
                            onChange={(e) => setEstadoFilter(e.target.value)}
                            options={estados}
                            className="w-48"
                        />
                        <Select
                            value={tipoFilter}
                            onChange={(e) => setTipoFilter(e.target.value)}
                            options={[
                                { value: '', label: 'Todos los tipos' },
                                ...tipos.map(tipo => ({
                                    value: tipo.id,
                                    label: tipo.nombre,
                                })),
                            ]}
                            className="w-48"
                        />
                        <Button
                            variant="secondary"
                            onClick={loadSesiones}
                            loading={loading}
                        >
                            <span className="material-symbols-outlined">refresh</span>
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Tabla */}
                <Table
                    columns={columns}
                    data={sesiones}
                    loading={loading}
                    onRowClick={handleRowClick}
                    emptyMessage="No hay sesiones programadas"
                />
            </Card>
        </div>
    );
};

export default SesionesOnboarding;