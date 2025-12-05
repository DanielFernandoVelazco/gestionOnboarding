import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { onboardingService } from '../../../services/onboarding.service';
import { colaboradoresService } from '../../../services/colaboradores.service';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../contexts/ToastContext';
import {
    formatDateForInput,
    formatDateForBackend,
    isValidDate,
    parseDateFromBackend,
    dateToBackendFormat,
    addDays,
    differenceInDaysString,
    formatDateForDisplay,
    getTodayForBackend
} from '../../../utils/dateUtils';

// NO usar tipos estáticos - obtener desde API
const estados = [
    { value: 'programada', label: 'Programada' },
    { value: 'en_curso', label: 'En Curso' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' },
];

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

const AgendarOnboarding = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [tipos, setTipos] = useState<any[]>([]);
    const [colaboradores, setColaboradores] = useState<any[]>([]);
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [searchParticipant, setSearchParticipant] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            estado: 'programada',
            capacidadMaxima: 1,
            // Establecer fecha de inicio como hoy (en formato YYYY-MM-DD)
            fechaInicio: getTodayForBackend(),
            // Establecer fecha de fin como mañana (en formato YYYY-MM-DD)
            fechaFin: dateToBackendFormat(addDays(parseDateFromBackend(getTodayForBackend()), 1))
        },
    });

    const fechaInicio = watch('fechaInicio');
    const capacidadMaxima = watch('capacidadMaxima');
    const tipoId = watch('tipoId');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [tiposData, colaboradoresData] = await Promise.all([
                onboardingService.getTipos(),
                colaboradoresService.getAll({ limit: 100 })
            ]);

            setTipos(Array.isArray(tiposData) ? tiposData : []);
            setColaboradores(Array.isArray(colaboradoresData.data) ? colaboradoresData.data : []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            showToast({
                title: 'Error al cargar datos',
                message: 'No se pudieron cargar los tipos de onboarding o colaboradores',
                type: 'error'
            });
        }
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);

        try {
            // Validar que tipoId exista en los tipos disponibles
            const tipoSeleccionado = tipos.find(t => t.id === data.tipoId);
            if (!tipoSeleccionado) {
                throw new Error('Tipo de onboarding seleccionado no es válido');
            }

            const formData = {
                ...data,
                // Usar formatDateForBackend para asegurar el formato correcto
                fechaInicio: formatDateForBackend(data.fechaInicio),
                fechaFin: formatDateForBackend(data.fechaFin),
                participantesIds: selectedParticipants.length > 0 ? selectedParticipants : undefined,
            };

            console.log('Enviando datos:', formData); // Para depuración

            await onboardingService.createSesion(formData);
            showToast({
                title: 'Éxito',
                message: 'Sesión de onboarding creada exitosamente',
                type: 'success'
            });
            navigate('/onboarding/calendario');
        } catch (error: any) {
            console.error('Error al crear sesión:', error);
            showToast({
                title: 'Error',
                message: error.message || error.response?.data?.message || 'Error al crear la sesión',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleParticipantToggle = (colaboradorId: string) => {
        setSelectedParticipants(prev => {
            if (prev.includes(colaboradorId)) {
                return prev.filter(id => id !== colaboradorId);
            } else {
                if (prev.length >= capacidadMaxima) {
                    showToast({
                        title: 'Capacidad máxima alcanzada',
                        message: `Solo se pueden seleccionar ${capacidadMaxima} participantes`,
                        type: 'warning'
                    });
                    return prev;
                }
                return [...prev, colaboradorId];
            }
        });
    };

    const filteredColaboradores = colaboradores.filter(colaborador =>
        colaborador.nombreCompleto.toLowerCase().includes(searchParticipant.toLowerCase()) ||
        colaborador.email.toLowerCase().includes(searchParticipant.toLowerCase())
    );

    // Opciones para el select de tipos - usando UUIDs reales
    const tipoOptions = [
        { value: '', label: 'Seleccionar tipo de onboarding' },
        ...tipos.map(tipo => ({
            value: tipo.id,  // UUID real
            label: tipo.nombre,
            color: tipo.color,
        }))
    ];

    // Tipo seleccionado para mostrar información
    const tipoSeleccionado = tipos.find(t => t.id === tipoId);

    // Calcular min date para fechaFin basado en fechaInicio
    const minDateForFin = fechaInicio;

    return (
        <div className="space-y-6">
            {/* Modal de Selección de Participantes */}
            <Modal
                isOpen={showParticipantsModal}
                onClose={() => setShowParticipantsModal(false)}
                title="Seleccionar Participantes"
                size="lg"
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Buscar por nombre o correo..."
                        value={searchParticipant}
                        onChange={(e) => setSearchParticipant(e.target.value)}
                        icon={<span className="material-symbols-outlined">search</span>}
                    />

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                        {filteredColaboradores.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <span className="material-symbols-outlined text-4xl mb-2">person_search</span>
                                <p>No se encontraron colaboradores</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredColaboradores.map(colaborador => (
                                    <label
                                        key={colaborador.id}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedParticipants.includes(colaborador.id)}
                                            onChange={() => handleParticipantToggle(colaborador.id)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {colaborador.nombreCompleto}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {colaborador.email}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                {colaborador.departamento && (
                                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                                                        {colaborador.departamento}
                                                    </span>
                                                )}
                                                {colaborador.puesto && (
                                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                                                        {colaborador.puesto}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Seleccionados: {selectedParticipants.length} / {capacidadMaxima}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => setSelectedParticipants([])}
                            >
                                Limpiar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => setShowParticipantsModal(false)}
                            >
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Agendar Nueva Sesión de Onboarding
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Programa una nueva sesión de onboarding técnico
                    </p>
                </div>
                <Button
                    variant="secondary"
                    onClick={() => navigate('/onboarding/calendario')}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Volver al Calendario
                </Button>
            </div>

            <Card>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Información Básica */}
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
                            options={tipoOptions}
                            required
                        />
                    </div>

                    {/* Mostrar información del tipo seleccionado */}
                    {tipoSeleccionado && (
                        <div className="p-3 rounded-lg border-l-4" style={{
                            borderColor: tipoSeleccionado.color,
                            backgroundColor: `${tipoSeleccionado.color}10`
                        }}>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tipoSeleccionado.color }}
                                />
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {tipoSeleccionado.nombre}
                                </span>
                                {tipoSeleccionado.descripcion && (
                                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                        - {tipoSeleccionado.descripcion}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

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

                    {/* Fechas y Capacidad */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            label="Fecha de inicio"
                            type="date"
                            {...register('fechaInicio')}
                            error={errors.fechaInicio?.message}
                            required
                            // Asegurar formato correcto para input type="date"
                            value={fechaInicio ? formatDateForInput(fechaInicio) : ''}
                            onChange={(e) => {
                                const formattedDate = formatDateForBackend(e.target.value);
                                setValue('fechaInicio', formattedDate, { shouldValidate: true });
                            }}
                        />

                        <Input
                            label="Fecha de fin"
                            type="date"
                            {...register('fechaFin')}
                            error={errors.fechaFin?.message}
                            min={minDateForFin}
                            required
                            // Asegurar formato correcto para input type="date"
                            value={watch('fechaFin') ? formatDateForInput(watch('fechaFin')) : ''}
                            onChange={(e) => {
                                const formattedDate = formatDateForBackend(e.target.value);
                                setValue('fechaFin', formattedDate, { shouldValidate: true });
                            }}
                        />

                        <Input
                            label="Capacidad máxima"
                            type="number"
                            {...register('capacidadMaxima', { valueAsNumber: true })}
                            error={errors.capacidadMaxima?.message}
                            min={1}
                            required
                        />
                    </div>

                    {/* Estado y Ubicación */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select
                            label="Estado"
                            {...register('estado')}
                            error={errors.estado?.message}
                            options={estados}
                        />

                        <Input
                            label="Ubicación (opcional)"
                            {...register('ubicacion')}
                            error={errors.ubicacion?.message}
                            placeholder="Ej: Sala de Conferencias A"
                            icon={<span className="material-symbols-outlined">location_on</span>}
                        />
                    </div>

                    {/* Enlace y Notas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Enlace virtual (opcional)"
                            type="url"
                            {...register('enlaceVirtual')}
                            error={errors.enlaceVirtual?.message}
                            placeholder="https://meet.google.com/..."
                            icon={<span className="material-symbols-outlined">link</span>}
                        />

                        <Input
                            label="Notas adicionales (opcional)"
                            {...register('notas')}
                            error={errors.notas?.message}
                            placeholder="Información adicional o requisitos..."
                        />
                    </div>

                    {/* Participantes */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Participantes
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                    ({selectedParticipants.length} / {capacidadMaxima} seleccionados)
                                </span>
                            </label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowParticipantsModal(true)}
                            >
                                <span className="material-symbols-outlined">group_add</span>
                                Seleccionar Participantes
                            </Button>
                        </div>

                        {selectedParticipants.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">
                                    person_add
                                </span>
                                <p className="text-gray-500 dark:text-gray-400">
                                    No hay participantes seleccionados
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                    Haz clic en "Seleccionar Participantes" para agregar colaboradores
                                </p>
                            </div>
                        ) : (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {selectedParticipants.map(participantId => {
                                        const colaborador = colaboradores.find(c => c.id === participantId);
                                        return colaborador ? (
                                            <div
                                                key={colaborador.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {colaborador.nombreCompleto.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {colaborador.nombreCompleto}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {colaborador.email}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleParticipantToggle(colaborador.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500"
                                                >
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/onboarding/calendario')}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                        >
                            <span className="material-symbols-outlined">save</span>
                            Agendar Sesión
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AgendarOnboarding;