import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parse, isValid, differenceInCalendarDays, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { onboardingService, OnboardingSesion } from '../../../services/onboarding.service';
import { colaboradoresService } from '../../../services/colaboradores.service';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';

// --- UTILIDADES DE FECHA CON DATE-FNS ---

// Parsea un string YYYY-MM-DD a un objeto Date en HORA LOCAL (00:00:00)
// Esto evita el problema de que new Date('2025-12-10') se interprete como UTC y reste 5 horas.
const parseLocalDate = (dateString: string): Date => {
    return parse(dateString, 'yyyy-MM-dd', new Date());
};

const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    // Si viene con hora (ISO), cortamos. Si ya es YYYY-MM-DD, lo dejamos.
    return dateString.includes('T') ? dateString.split('T')[0] : dateString;
};

const isValidDateString = (dateString: string): boolean => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const date = parseLocalDate(dateString);
    return isValid(date);
};

// --- ESQUEMA DE VALIDACIÓN ---

const schema = z.object({
    titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    descripcion: z.string().optional(),
    tipoId: z.string().uuid('Debe seleccionar un tipo de onboarding válido'),
    fechaInicio: z.string().refine(isValidDateString, { message: 'Fecha inválida' }),
    fechaFin: z.string().refine(isValidDateString, { message: 'Fecha inválida' }),
    estado: z.enum(['programada', 'en_curso', 'completada', 'cancelada']),
    capacidadMaxima: z.number()
        .min(1, 'La capacidad mínima es 1')
        .max(100, 'La capacidad máxima es 100'),
    ubicacion: z.string().optional(),
    enlaceVirtual: z.string().optional(),
    notas: z.string().optional(),
    participantesIds: z.array(z.string()).optional(),
    // ... resto del schema
}).refine(
    (data) => {
        // Comparamos los strings directamente. YYYY-MM-DD se puede comparar alfabéticamente.
        // Es la forma más simple y segura.
        return data.fechaInicio <= data.fechaFin;
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
            // Cargar tipos de onboarding y colaboradores en paralelo para optimizar
            const [tiposData, colaboradoresResponse] = await Promise.all([
                onboardingService.getTipos(),
                colaboradoresService.getAll({ limit: 100 })
            ]);

            setTipos(tiposData);
            setColaboradores(colaboradoresResponse.data);

            if (!id) throw new Error('ID de sesión no proporcionado');

            const sesionData = await onboardingService.getSesionById(id);
            setSesion(sesionData);

            // Preparar datos para el formulario
            // IMPORTANTE: formatDateForInput solo limpia el string, no hace new Date()
            const formData = {
                titulo: sesionData.titulo || '',
                descripcion: sesionData.descripcion || '',
                tipoId: sesionData.tipo?.id || '',
                fechaInicio: formatDateForInput(sesionData.fechaInicio),
                fechaFin: formatDateForInput(sesionData.fechaFin),
                estado: sesionData.estado || 'programada',
                capacidadMaxima: sesionData.capacidadMaxima || 1,
                ubicacion: sesionData.ubicacion || '',
                enlaceVirtual: sesionData.enlaceVirtual || '',
                notas: sesionData.notas || '',
                participantesIds: sesionData.participantes?.map(p => p.id) || [],
            };

            console.log('✅ Datos cargados (Raw Backend):', sesionData.fechaInicio);
            console.log('✅ Datos seteados en Form:', formData.fechaInicio);

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
            // Validaciones lógicas extra (aunque Zod ya cubre la mayoría)
            const dInicio = parseLocalDate(data.fechaInicio);
            const dFin = parseLocalDate(data.fechaFin);

            if (isBefore(dFin, dInicio)) {
                throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
            }

            if (data.participantesIds && data.participantesIds.length > data.capacidadMaxima) {
                throw new Error(
                    `La cantidad de participantes (${data.participantesIds.length}) excede la capacidad máxima (${data.capacidadMaxima})`
                );
            }

            // Preparar datos para enviar.
            // No transformamos la fecha, enviamos el string 'YYYY-MM-DD' tal cual salió del input.
            const datosParaEnviar = {
                ...data,
                fechaInicio: data.fechaInicio.split('T')[0], // Usamos split por consistencia
                fechaFin: data.fechaFin.split('T')[0],
            };

            console.log('📤 Enviando actualización (CORREGIDO):', datosParaEnviar);

            await onboardingService.updateSesion(id!, datosParaEnviar);

            setSuccess('Sesión actualizada exitosamente');

            setTimeout(() => {
                navigate('/onboarding/calendario');
            }, 2000);

        } catch (err: any) {
            console.error('Error al actualizar:', err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Error al actualizar la sesión.');
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
            currentIds.splice(index, 1);
        } else {
            if (currentIds.length >= (capacidadMaxima || 1)) {
                setError(`No puedes agregar más participantes. Capacidad máxima: ${capacidadMaxima}`);
                return;
            }
            currentIds.push(colaboradorId);
        }
        setValue('participantesIds', currentIds, { shouldValidate: true });
        setError('');
    };

    // Formateo visual seguro para la UI (Badge o Texto)
    const formatFechaDisplay = (fechaString: string) => {
        if (!isValidDateString(fechaString)) return fechaString;
        // Parsear estrictamente como fecha local YYYY-MM-DD
        const fecha = parseLocalDate(fechaString);
        return format(fecha, "dd 'de' MMMM 'de' yyyy", { locale: es });
    };

    // Calcular duración en días naturales
    const calcularDuracion = (fechaInicioStr: string, fechaFinStr: string): number => {
        if (!isValidDateString(fechaInicioStr) || !isValidDateString(fechaFinStr)) return 0;

        const inicio = parseLocalDate(fechaInicioStr);
        const fin = parseLocalDate(fechaFinStr);

        // differenceInCalendarDays calcula días completos sin importar la hora
        return differenceInCalendarDays(fin, inicio) + 1;
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
                    <Button variant="primary" onClick={() => navigate('/onboarding/calendario')}>
                        Volver al calendario
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Modal de Selección de Participantes (Sin cambios lógicos mayores) */}
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
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <Button variant="secondary" onClick={() => setShowParticipantesModal(false)}>
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
                    {sesion && (
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium">Editando ID:</span> {sesion.id.substring(0, 8)}...
                        </div>
                    )}
                </div>
                <Button variant="secondary" onClick={handleCancel}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    Cancelar
                </Button>
            </div>

            {/* Mensajes de feedback */}
            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-green-600 dark:text-green-400 font-medium">{success}</p>
                </div>
            )}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            <Card>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Información Básica */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
                            Información de la Sesión
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Título de la sesión"
                                {...register('titulo')}
                                error={errors.titulo?.message}
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
                                    Descripción
                                </label>
                                <textarea
                                    {...register('descripcion')}
                                    className="input-field min-h-[100px] resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fechas y Estado */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
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
                                {fechaInicio && isValidDateString(fechaInicio) && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {formatFechaDisplay(fechaInicio)}
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
                                {fechaFin && isValidDateString(fechaFin) && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {formatFechaDisplay(fechaFin)}
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

                        {fechaInicio && fechaFin && !errors.fechaFin?.message && isValidDateString(fechaInicio) && isValidDateString(fechaFin) && (
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

                    {/* Resto del formulario (Capacidad, Ubicación, Botones) */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
                            Detalles Adicionales
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Capacidad máxima"
                                type="number"
                                {...register('capacidadMaxima', { valueAsNumber: true })}
                                error={errors.capacidadMaxima?.message}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Participantes ({participantesIds.length})
                                </label>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowParticipantesModal(true)}
                                    className="w-full justify-center"
                                >
                                    Gestionar Participantes
                                </Button>
                            </div>

                            <Input label="Ubicación" {...register('ubicacion')} />
                            <Input label="Enlace virtual" {...register('enlaceVirtual')} />
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                                <textarea {...register('notas')} className="input-field min-h-[80px]" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-6">
                        <Button type="button" variant="secondary" onClick={handleCancel}>Cancelar</Button>
                        <Button type="submit" variant="primary" loading={loading}>Guardar Cambios</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EditarSesion;