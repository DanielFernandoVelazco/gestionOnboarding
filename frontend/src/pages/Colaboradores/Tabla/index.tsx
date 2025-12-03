import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colaboradoresService, Colaborador } from '../../../services/colaboradores.service';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';

const TablaColaboradores = () => {
    const navigate = useNavigate();
    const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);

    const estados = [
        { value: '', label: 'Todos los estados' },
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'en_progreso', label: 'En Progreso' },
        { value: 'completado', label: 'Completado' },
    ];

    const columns = [
        {
            key: 'nombreCompleto',
            header: 'Nombre',
            render: (item: Colaborador) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {item.nombreCompleto}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">{item.email}</div>
                </div>
            ),
        },
        {
            key: 'departamento',
            header: 'Departamento',
            render: (item: Colaborador) => (
                <div>
                    <div className="text-gray-900 dark:text-white">{item.departamento || '-'}</div>
                    <div className="text-gray-500 dark:text-gray-400">{item.puesto || '-'}</div>
                </div>
            ),
        },
        {
            key: 'estadoBienvenida',
            header: 'Onboarding Bienvenida',
            render: (item: Colaborador) => (
                <div>
                    <span className={`badge ${item.estadoBienvenida === 'completado' ? 'badge-success' :
                        item.estadoBienvenida === 'en_progreso' ? 'badge-info' :
                            'badge-warning'
                        }`}>
                        {item.estadoBienvenida}
                    </span>
                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        Ingreso: {new Date(item.fechaIngreso).toLocaleDateString('es-ES')}
                    </div>
                </div>
            ),
        },
        {
            key: 'estadoTecnico',
            header: 'Onboarding Técnico',
            render: (item: Colaborador) => (
                <div>
                    <span className={`badge ${item.estadoTecnico === 'completado' ? 'badge-success' :
                        item.estadoTecnico === 'en_progreso' ? 'badge-info' :
                            'badge-warning'
                        }`}>
                        {item.estadoTecnico}
                    </span>
                    {item.fechaOnboardingTecnico && (
                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                            Asignado: {new Date(item.fechaOnboardingTecnico).toLocaleDateString('es-ES')}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (item: Colaborador) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                        }}
                        className="p-1 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                        title="Editar"
                    >
                        <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(item);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Eliminar"
                        disabled={deleteLoading === item.id}
                    >
                        {deleteLoading === item.id ? (
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined">delete</span>
                        )}
                    </button>
                </div>
            ),
        },
    ];

    useEffect(() => {
        loadColaboradores();
    }, [search, estadoFilter]);

    const loadColaboradores = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (search) filters.search = search;
            if (estadoFilter) filters.estadoTecnico = estadoFilter;

            const response = await colaboradoresService.getAll(filters);
            setColaboradores(response.data);
        } catch (error) {
            console.error('Error al cargar colaboradores:', error);
            // Aquí podrías mostrar un toast de error
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (colaborador: Colaborador) => {
        navigate(`/colaboradores/registro?edit=${colaborador.id}`);
    };

    const handleDeleteClick = (colaborador: Colaborador) => {
        setSelectedColaborador(colaborador);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedColaborador) return;

        setDeleteLoading(selectedColaborador.id);
        try {
            await colaboradoresService.delete(selectedColaborador.id);
            // Recargar la lista
            await loadColaboradores();
            // Mostrar mensaje de éxito
            // Aquí podrías mostrar un toast: "Colaborador eliminado exitosamente"
        } catch (error: any) {
            console.error('Error al eliminar colaborador:', error);
            // Mostrar mensaje de error
            // Aquí podrías mostrar un toast de error
        } finally {
            setDeleteLoading(null);
            setShowDeleteModal(false);
            setSelectedColaborador(null);
        }
    };

    const handleRowClick = (colaborador: Colaborador) => {
        // Podrías mostrar un modal con detalles o redirigir a una página de detalle
        console.log('Ver detalles de:', colaborador);
    };

    return (
        <div className="space-y-6">
            {/* Modal de confirmación de eliminación */}
            {showDeleteModal && selectedColaborador && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            ¿Eliminar colaborador?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            ¿Estás seguro de que deseas eliminar a <strong>{selectedColaborador.nombreCompleto}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedColaborador(null);
                                }}
                                disabled={deleteLoading === selectedColaborador.id}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleDeleteConfirm}
                                loading={deleteLoading === selectedColaborador.id}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                <span className="material-symbols-outlined">delete</span>
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Tabla de Colaboradores
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gestiona el onboarding de todos los nuevos colaboradores.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/colaboradores/registro')}
                    >
                        <span className="material-symbols-outlined">add</span>
                        Agregar Colaborador
                    </Button>
                    <Button
                        variant="primary"
                        onClick={loadColaboradores}
                        loading={loading}
                    >
                        <span className="material-symbols-outlined">refresh</span>
                        Actualizar
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
                                placeholder="Buscar por nombre o correo..."
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
                            options={[
                                { value: '', label: 'Tipo de Onboarding' },
                                { value: 'journey', label: 'Journey to Cloud' },
                                { value: 'data', label: 'Capítulo Data' },
                                { value: 'frontend', label: 'Capítulo Frontend' },
                                { value: 'backend', label: 'Capítulo Backend' },
                            ]}
                            className="w-48"
                        />
                    </div>
                </div>

                {/* Tabla */}
                <Table
                    columns={columns}
                    data={colaboradores}
                    loading={loading}
                    onRowClick={handleRowClick}
                    emptyMessage="No hay colaboradores registrados"
                />

                {/* Información de paginación */}
                {colaboradores.length > 0 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Mostrando {colaboradores.length} colaboradores
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={true} // Implementar paginación real
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={true} // Implementar paginación real
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TablaColaboradores;