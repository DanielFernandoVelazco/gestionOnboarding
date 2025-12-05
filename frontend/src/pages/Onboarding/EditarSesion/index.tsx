import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { onboardingService, OnboardingSesion } from '../../../services/onboarding.service';
import { colaboradoresService } from '../../../services/colaboradores.service';
import {
    formatDateForInput,
    formatDateForBackend,
    isValidDate,
    parseDateFromBackend,
    dateToBackendFormat,
    addDays,
    differenceInDaysString,
    formatDateForDisplay
} from '../../../utils/dateUtils';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';

// Esquema de validación mejorado
const schema = z.object({
    titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    descripcion: z.string().optional(),
    tipoId: z.string().uuid('Debe seleccionar un tipo de onboarding válido'),
    fechaInicio: z.string().min(1).refine(isValidDate, { message: 'Fecha inválida' }),
    fechaFin: z.string().min(1).refine(isValidDate, { message: 'Fecha inválida' }),
    estado: z.enum(['programada', 'en_curso', 'completada', 'cancelada']),
    capacidadMaxima: z.number()
        .min(1, 'La capacidad mínima es 1')
        .max(100, 'La capacidad máxima es 100'),
    ubicacion: z.string().optional(),
    enlaceVirtual: z.string().optional(),
    notas: z.string().optional(),
    participantesIds: z.array(z.string()).optional(),
}).refine(
    (data) => {
        // Usar parseDateFromBackend para evitar problemas de timezone
        const inicio = parseDateFromBackend(data.fechaInicio);
        const fin = parseDateFromBackend(data.fechaFin);
        return inicio <= fin;
    },
    {
        message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio',
        path: ['fechaFin'],
    }
);

type FormData = z.infer<typeof schema>;

const EditarSesion = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    const [cargandoSesion, setCargandoSesion] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tipos, setTipos] = useState<any[]>([]);
    const [colaboradores, setColaboradores] = useState<any[]>([]);
    const [sesion, setSesion] = useState<OnboardingSesion | null>(null);
    const [showParticipantesModal, setShowParticipantesModal] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
        trigger,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            estado: 'programada',
            capacidadMaxima: 1,
            participantesIds: [],
        },
    });

    // Observar valores del formulario
    const participantesIds = watch('participantesIds') || [];
    const fechaInicio = watch('fechaInicio');
    const fechaFin = watch('fechaFin');
    const capacidadMaxima = watch('capacidadMaxima');

    // Cargar datos iniciales
    useEffect(() => {
        if (id) {
            cargarDatos();
        }
    }, [id]);

    // Validar fechas cuando cambian
    useEffect(() => {
        if (fechaInicio && fechaFin) {
            trigger('fechaFin');
        }
    }, [fechaInicio, fechaFin, trigger]);

    // Validar capacidad vs participantes
    useEffect(() => {
        if (capacidadMaxima && participantesIds.length > capacidadMaxima) {
            setError(`La cantidad de participantes (${participantesIds.length}) excede la capacidad máxima (${capacidadMaxima})`);
        } else {
            setError('');
        }
    }, [capacidadMaxima, participantesIds]);

    const cargarDatos = async () => {
        setCargandoSesion(true);
        setError('');

        try {
            // Cargar tipos de onboarding desde API
            const tiposData = await onboardingService.getTipos();
            setTipos(tiposData);

            // Cargar colaboradores
            const colaboradoresResponse = await colaboradoresService.getAll({ limit: 100 });
            setColaboradores(colaboradoresResponse.data);

            // Cargar sesión a editar
            if (!id) {
                throw new Error('ID de sesión no proporcionado');
            }

            const sesionData = await onboardingService.getSesionById(id);
            setSesion(sesionData);

            // Preparar datos para el formulario usando las nuevas funciones
            const formData = {
                titulo: sesionData.titulo || '',
                descripcion: sesionData.descripcion || '',
                tipoId: sesionData.tipo?.id || '',
                fechaInicio: formatDateForInput(sesionData.fechaInicio), // Usar la nueva función
                fechaFin: formatDateForInput(sesionData.fechaFin), // Usar la nueva función
                estado: sesionData.estado || 'programada',
                capacidadMaxima: sesionData.capacidadMaxima || 1,
                ubicacion: sesionData.ubicacion || '',
                enlaceVirtual: sesionData.enlaceVirtual || '',
                notas: sesionData.notas || '',
                participantesIds: sesionData.participantes?.map(p => p.id) || [],
            };

            console.log('Datos cargados para edición:', formData);
            console.log('Fecha original del backend:', sesionData.fechaInicio);
            console.log('Fecha formateada para input:', formData.fechaInicio);

            reset(formData);

        } catch (err: any) {
            console.error('Error al cargar datos:', err);
            setError(err.message || 'Error al cargar datos de la sesión');
        } finally {
            setCargandoSesion(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validación adicional de fechas usando las nuevas funciones
            if (!isValidDate(data.fechaInicio) || !isValidDate(data.fechaFin)) {
                throw new Error('Fechas inválidas');
            }

            // Usar parseDateFromBackend para evitar problemas de timezone
            const fechaInicioDate = parseDateFromBackend(data.fechaInicio);
            const fechaFinDate = parseDateFromBackend(data.fechaFin);

            if (fechaInicioDate > fechaFinDate) {
                throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
            }

            // Validar capacidad vs participantes
            if (data.participantesIds && data.participantesIds.length > data.capacidadMaxima) {
                throw new Error(
                    `La cantidad de participantes (${data.participantesIds.length}) excede la capacidad máxima (${data.capacidadMaxima})`
                );
            }

            // Preparar datos para enviar con fechas formateadas correctamente
            const datosParaEnviar = {
                ...data,
                fechaInicio: formatDateForBackend(data.fechaInicio), // Formatear para backend
                fechaFin: formatDateForBackend(data.fechaFin), // Formatear para backend
            };

            console.log('Datos a enviar:', datosParaEnviar);
            console.log('Fecha inicio (input):', data.fechaInicio);
            console.log('Fecha inicio (para backend):', datosParaEnviar.fechaInicio);

            // Actualizar sesión
            await onboardingService.updateSesion(id!, datosParaEnviar);

            setSuccess('Sesión actualizada exitosamente');

            // Redirigir después de 2 segundos
            setTimeout(() => {
                navigate('/onboarding/calendario');
            }, 2000);

        } catch (err: any) {
            console.error('Error al actualizar:', err);

            // Mejor manejo de errores
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Error al actualizar la sesión. Verifica los datos e intenta nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán.')) {
            navigate('/onboarding/calendario');
        }
    };

    const toggleParticipante = (colaboradorId: string) => {
        const currentIds = [...participantesIds];
        const index = currentIds.indexOf(colaboradorId);

        if (index > -1) {
            // Remover
            currentIds.splice(index, 1);
        } else {
            // Validar capacidad máxima
            if (currentIds.length >= (capacidadMaxima || 1)) {
                setError(`No puedes agregar más participantes. Capacidad máxima: ${capacidadMaxima}`);
                return;
            }
            // Agregar
            currentIds.push(colaboradorId);
        }

        setValue('participantesIds', currentIds, { shouldValidate: true });
        setError(''); // Limpiar error si se resolvió
    };

    const getTipoColor = (tipoId: string) => {
        const tipo = tipos.find(t => t.id === tipoId);
        return tipo?.color || '#00448D';
    };

    const formatFecha = (fechaString: string) => {
        try {
            // Usar parseDateFromBackend para obtener una fecha UTC
            const fechaUTC = parseDateFromBackend(fechaString);

            // Convertir a fecha local para mostrar al usuario
            const fechaLocal = new Date(
                fechaUTC.getUTCFullYear(),
                fechaUTC.getUTCMonth(),
                fechaUTC.getUTCDate()
            );

            return format(fechaLocal, "dd 'de' MMMM 'de' yyyy", { locale: es });
        } catch {
            // Si hay error, usar la función formatDateForDisplay
            return formatDateForDisplay(fechaString);
        }
    };

    // Función para calcular duración en días
    const calcularDuracion = (fechaInicioStr: string, fechaFinStr: string): number => {
        if (!fechaInicioStr || !fechaFinStr) return 0;

        try {
            // Calcular diferencia en días y sumar 1 para incluir ambos días
            return differenceInDaysString(fechaInicioStr, fechaFinStr) + 1;
        } catch {
            // Fallback: cálculo simple
            const inicio = parseDateFromBackend(fechaInicioStr);
            const fin = parseDateFromBackend(fechaFinStr);
            const diffTime = Math.abs(fin.getTime() - inicio.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
    };

    if (cargandoSesion) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!sesion) {
        return (
            <Card>
                <div className="text-center py-8">
                    <span className="material-symbols-outlined text-4xl text-red-500 mb-2">
                        error
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Sesión no encontrada
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        La sesión que intentas editar no existe o fue eliminada.
                    </p>
                    <Button variant="primary" onClick={() => navigate('/onboarding/calendario')}>
                        Volver al calendario
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Modal de Selección de Participantes */}
            {showParticipantesModal && (
                <Modal
                    isOpen={showParticipantesModal}
                    onClose={() => setShowParticipantesModal(false)}
                    title="Seleccionar Participantes"
                    size="lg"
                >
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Capacidad máxima: {capacidadMaxima} participantes
                            </div>
                            <div className="text-sm font-medium">
                                Seleccionados: {participantesIds.length}
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                            {colaboradores.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">group</span>
                                    <p>No hay colaboradores disponibles</p>
                                </div>
                            ) : (
                                colaboradores.map(colaborador => {
                                    const isSelected = participantesIds.includes(colaborador.id);
                                    const isDisabled = !isSelected && participantesIds.length >= capacidadMaxima;

                                    return (
                                        <div
                                            key={colaborador.id}
                                            className={`flex items-center justify-between p-3 border-b last:border-b-0 ${isDisabled
                                                ? 'bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-primary/5 border-l-4 border-primary'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                                                }`}
                                            onClick={() => !isDisabled && toggleParticipante(colaborador.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => !isDisabled && toggleParticipante(colaborador.id)}
                                                    disabled={isDisabled}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                                                />
                                                <div>
                                                    <div className={`font-medium ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                                        {colaborador.nombreCompleto}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {colaborador.email}
                                                    </div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                                        {colaborador.departamento || 'Sin departamento'} • {colaborador.puesto || 'Sin puesto'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {colaborador.estadoTecnico === 'completado' ? (
                                                        <span className="badge badge-success">Completado</span>
                                                    ) : colaborador.estadoTecnico === 'en_progreso' ? (
                                                        <span className="badge badge-info">En Progreso</span>
                                                    ) : (
                                                        <span className="badge badge-warning">Pendiente</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {participantesIds.length >= capacidadMaxima && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">info</span>
                                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                        Has alcanzado la capacidad máxima de {capacidadMaxima} participantes.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <Button
                                variant="secondary"
                                onClick={() => setShowParticipantesModal(false)}
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Editar Sesión de Onboarding
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Modifica los detalles de la sesión programada.
                    </p>
                    {sesion && (
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium">ID:</span> {sesion.id.substring(0, 8)}... •
                            <span className="ml-2">Creada:</span> {formatFecha(sesion.createdAt)}
                        </div>
                    )}
                </div>
                <Button variant="secondary" onClick={handleCancel}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    Cancelar
                </Button>
            </div>

            {/* Mensajes de éxito/error */}
            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                        <div>
                            <p className="text-green-600 dark:text-green-400 font-medium">{success}</p>
                            <p className="text-green-500 dark:text-green-300 text-sm mt-1">
                                Redirigiendo al calendario...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                </div>
            )}

            <Card>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Información Básica */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                            Información de la Sesión
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Título de la sesión"
                                {...register('titulo')}
                                error={errors.titulo?.message}
                                placeholder="Ej: Journey to Cloud - Cohort 1"
                                required
                            />

                            <Select
                                label="Tipo de Onboarding"
                                {...register('tipoId')}
                                error={errors.tipoId?.message}
                                options={[
                                    { value: '', label: 'Seleccionar tipo' },
                                    ...tipos.map(tipo => ({
                                        value: tipo.id,
                                        label: tipo.nombre,
                                        style: { color: tipo.color },
                                    })),
                                ]}
                                required
                            />

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descripción (opcional)
                                </label>
                                <textarea
                                    {...register('descripcion')}
                                    className="input-field min-h-[100px] resize-none"
                                    placeholder="Describe los objetivos y contenido de la sesión..."
                                />
                                {errors.descripcion?.message && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.descripcion.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fechas y Estado */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                            Fechas y Estado
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Input
                                    label="Fecha de inicio"
                                    type="date"
                                    {...register('fechaInicio')}
                                    error={errors.fechaInicio?.message}
                                    required
                                />
                                {fechaInicio && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {formatFecha(fechaInicio)}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Input
                                    label="Fecha de fin"
                                    type="date"
                                    {...register('fechaFin')}
                                    error={errors.fechaFin?.message}
                                    required
                                />
                                {fechaFin && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {formatFecha(fechaFin)}
                                    </p>
                                )}
                            </div>

                            <Select
                                label="Estado"
                                {...register('estado')}
                                error={errors.estado?.message}
                                options={[
                                    { value: 'programada', label: 'Programada' },
                                    { value: 'en_curso', label: 'En Curso' },
                                    { value: 'completada', label: 'Completada' },
                                    { value: 'cancelada', label: 'Cancelada' },
                                ]}
                                required
                            />
                        </div>

                        {fechaInicio && fechaFin && !errors.fechaFin?.message && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">calendar_today</span>
                                    <span className="text-blue-600 dark:text-blue-400">
                                        Duración: {calcularDuracion(fechaInicio, fechaFin)} días
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Capacidad y Participantes */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                            Capacidad y Participantes
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Capacidad máxima"
                                type="number"
                                min="1"
                                max="100"
                                {...register('capacidadMaxima', {
                                    valueAsNumber: true,
                                    onChange: (e) => {
                                        const value = parseInt(e.target.value);
                                        if (value < 1) setValue('capacidadMaxima', 1);
                                        if (value > 100) setValue('capacidadMaxima', 100);
                                    }
                                })}
                                error={errors.capacidadMaxima?.message}
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Participantes seleccionados
                                </label>
                                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {participantesIds.length} participantes
                                        </span>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Capacidad: {capacidadMaxima} personas •
                                            <span className={`ml-2 ${participantesIds.length > capacidadMaxima ? 'text-red-600' : 'text-green-600'}`}>
                                                {participantesIds.length > capacidadMaxima ? 'Excede capacidad' : 'Dentro de capacidad'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setShowParticipantesModal(true)}
                                        >
                                            <span className="material-symbols-outlined">group</span>
                                            {participantesIds.length > 0 ? 'Editar' : 'Seleccionar'}
                                        </Button>
                                        {participantesIds.length > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setValue('participantesIds', [])}
                                            >
                                                <span className="material-symbols-outlined">clear_all</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {participantesIds.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            Participantes seleccionados:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {colaboradores
                                                .filter(c => participantesIds.includes(c.id))
                                                .map(colaborador => (
                                                    <span
                                                        key={colaborador.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs"
                                                    >
                                                        {colaborador.nombreCompleto.split(' ')[0]}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleParticipante(colaborador.id)}
                                                            className="text-gray-400 hover:text-red-500"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ubicación y Notas */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                            Ubicación y Notas
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Ubicación (opcional)"
                                {...register('ubicacion')}
                                error={errors.ubicacion?.message}
                                placeholder="Ej: Sala de Conferencias A"
                            />

                            <Input
                                label="Enlace virtual (opcional)"
                                type="url"
                                {...register('enlaceVirtual')}
                                error={errors.enlaceVirtual?.message}
                                placeholder="https://meet.google.com/abc-defg-hij"
                            />

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notas adicionales (opcional)
                                </label>
                                <textarea
                                    {...register('notas')}
                                    className="input-field min-h-[100px] resize-none"
                                    placeholder="Información adicional para los participantes..."
                                />
                                {errors.notas?.message && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.notas.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancel}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            disabled={loading || !!error}
                        >
                            <span className="material-symbols-outlined">save</span>
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EditarSesion;