import { useState, useEffect } from 'react';
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
    const [lugarFilter, setLugarFilter] = useState('');
    const [departamentoFilter, setDepartamentoFilter] = useState('');
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);

    const estados = [
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'en_progreso', label: 'En Progreso' },
        { value: 'completado', label: 'Completado' },
    ];

    const lugaresAsignacion = [
        { value: 'journey_to_cloud', label: 'Journey to Cloud' },
        { value: 'capitulo_data', label: 'Capítulo Data' },
        { value: 'capitulo_frontend', label: 'Capítulo Frontend' },
        { value: 'capitulo_backend', label: 'Capítulo Backend' },
        { value: 'otro', label: 'Otro' },
    ];

    const departamento = [
        { value: 'tecnologia', label: 'Tecnología' },
        { value: 'recursos_humanos', label: 'Recursos Humanos' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'ventas', label: 'Ventas' },
        { value: 'finanzas', label: 'Finanzas' },
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
                    {item.lugarAsignacion && (
                        <div className="text-xs mt-1">
                            <span className={`px-2 py-0.5 rounded-full ${item.lugarAsignacion === 'journey_to_cloud' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                item.lugarAsignacion === 'capitulo_data' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    item.lugarAsignacion === 'capitulo_frontend' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                        item.lugarAsignacion === 'capitulo_backend' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                }`}>
                                {item.lugarAsignacion === 'journey_to_cloud' ? 'Journey to Cloud' :
                                    item.lugarAsignacion === 'capitulo_data' ? 'Capítulo Data' :
                                        item.lugarAsignacion === 'capitulo_frontend' ? 'Capítulo Frontend' :
                                            item.lugarAsignacion === 'capitulo_backend' ? 'Capítulo Backend' : 'Otro'}
                            </span>
                        </div>
                    )}
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
                    {item.fechaAsignacionOnboarding && (
                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                            Asignado: {new Date(item.fechaAsignacionOnboarding).toLocaleDateString('es-ES')}
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
    }, [search, estadoFilter, lugarFilter, departamentoFilter]);

    const loadColaboradores = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (search) filters.search = search;
            if (estadoFilter) filters.estadoTecnico = estadoFilter;
            if (lugarFilter) filters.lugarAsignacion = lugarFilter;
            if (departamentoFilter) filters.departamento = departamentoFilter;

            const response = await colaboradoresService.getAll(filters);
            setColaboradores(response.data);
        } catch (error) {
            console.error('Error al cargar colaboradores:', error);
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
            await loadColaboradores();
        } catch (error: any) {
            console.error('Error al eliminar colaborador:', error);
        } finally {
            setDeleteLoading(null);
            setShowDeleteModal(false);
            setSelectedColaborador(null);
        }
    };

    const handleRowClick = (colaborador: Colaborador) => {
        console.log('Ver detalles de:', colaborador);
    };

    // Función para limpiar filtros
    const clearFilters = () => {
        setSearch('');
        setEstadoFilter('');
        setLugarFilter('');
        setDepartamentoFilter('');
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
                        variant="primary"
                        onClick={() => navigate('/colaboradores/registro')}
                    >
                        <span className="material-symbols-outlined">add</span>
                        Agregar Colaborador
                    </Button>
                </div>
            </div>

            <Card>
                {/* Filtros y Búsqueda - VERSIÓN MEJORADA */}
                <div className="space-y-4 mb-6">
                    {/* Barra de búsqueda */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            search
                        </span>
                        <Input
                            placeholder="Buscar por nombre"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filtros en línea */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Filtro de estados */}
                        <div className="flex-1 min-w-[200px]">
                            <Select
                                value={estadoFilter}
                                onChange={(e) => setEstadoFilter(e.target.value)}
                                options={estados}
                                helperText="Filtro de Estado"
                            />
                        </div>

                        {/* Filtro de lugar de asignación */}
                        <div className="flex-1 min-w-[200px]">
                            <Select
                                value={lugarFilter}
                                onChange={(e) => setLugarFilter(e.target.value)}
                                options={lugaresAsignacion}
                                helperText="Filtro de Lugar"
                            />
                        </div>

                        {/* Filtro por departamento */}
                        <div className="flex-1 min-w-[200px]">
                            <Select
                                value={departamentoFilter}
                                onChange={(e) => setDepartamentoFilter(e.target.value)}
                                options={departamento}
                                helperText="Filtro de Departamento"
                            />
                        </div>

                        {/* Botón para limpiar filtros */}
                        {(search || estadoFilter || lugarFilter) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined mr-1">filter_alt_off</span>
                                Limpiar Filtros
                            </Button>
                        )}

                        <Button
                            variant="secondary"
                            onClick={loadColaboradores}
                            loading={loading}
                            className="whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                            Actualizar
                        </Button>
                    </div>

                    {/* Contador de resultados y filtros activos */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {colaboradores.length} colaboradores encontrados
                        </p>

                        {/* Mostrar filtros activos */}
                        <div className="flex flex-wrap gap-2">
                            {search && (
                                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                    Buscando: "{search}"
                                    <button onClick={() => setSearch('')} className="hover:text-primary-dark">
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                </span>
                            )}
                            {estadoFilter && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                                    Estado: {estados.find(e => e.value === estadoFilter)?.label}
                                    <button onClick={() => setEstadoFilter('')} className="hover:text-blue-600">
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                </span>
                            )}
                            {lugarFilter && (
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs px-2 py-1 rounded-full">
                                    Lugar: {lugaresAsignacion.find(l => l.value === lugarFilter)?.label}
                                    <button onClick={() => setLugarFilter('')} className="hover:text-purple-600">
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                </span>
                            )}
                            {departamentoFilter && (
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs px-2 py-1 rounded-full">
                                    Departamento: {departamento.find(l => l.value === departamentoFilter)?.label}
                                    <button onClick={() => setDepartamentoFilter('')} className="hover:text-purple-600">
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <Table
                    columns={columns}
                    data={colaboradores}
                    loading={loading}
                    onRowClick={handleRowClick}
                    emptyMessage="No hay colaboradores registrados. ¡Agrega el primero!"
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
                                disabled={true}
                                title="Página anterior"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={true}
                                title="Página siguiente"
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