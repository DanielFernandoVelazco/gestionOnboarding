import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { onboardingService, OnboardingTipo } from '../../../services/onboarding.service';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const schema = z.object({
    titulo: z.string().min(3),
    tipoId: z.string().min(1),
    fechaInicio: z.string(),
    fechaFin: z.string(),

    estado: z.enum([
        'programada',
        'en_curso',
        'completada',
        'cancelada',
    ]),

    capacidadMaxima: z
        .number()
        .min(1, 'La capacidad debe ser al menos 1'),

    descripcion: z.string().optional(),
    ubicacion: z.string().optional(),
    enlaceVirtual: z.string().url().optional().or(z.literal('')),
    notas: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const GestionOnboarding = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [tipos, setTipos] = useState<OnboardingTipo[]>([]);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            estado: 'programada',
            capacidadMaxima: 10,
        },
    });

    useEffect(() => {
        loadTipos();
    }, []);

    const loadTipos = async () => {
        try {
            const tiposData = await onboardingService.getTipos();
            setTipos(tiposData);
        } catch (error) {
            console.error('Error al cargar tipos:', error);
            setError('Error al cargar tipos de onboarding');
        }
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError('');

        try {
            // Validar fechas
            const fechaInicio = new Date(data.fechaInicio);
            const fechaFin = new Date(data.fechaFin);

            if (fechaInicio > fechaFin) {
                throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
            }

            await onboardingService.createSesion(data);
            reset();
            setError('');
            alert('Sesión creada exitosamente!');
            navigate('/onboarding/calendario');
        } catch (err: any) {
            setError(err.message || 'Error al crear la sesión');
        } finally {
            setLoading(false);
        }
    };

    const tipoSeleccionado = watch('tipoId');
    const tipoSeleccionadoInfo = tipos.find(t => t.id === tipoSeleccionado);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Agendar Sesión de Onboarding
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Crea una nueva sesión de onboarding técnico.
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
                                    })),
                                ]}
                                required
                            />

                            <Input
                                label="Fecha de inicio"
                                type="date"
                                {...register('fechaInicio')}
                                error={errors.fechaInicio?.message}
                                required
                            />

                            <Input
                                label="Fecha de fin"
                                type="date"
                                {...register('fechaFin')}
                                error={errors.fechaFin?.message}
                                required
                            />

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
                            />

                            <Input
                                label="Capacidad máxima"
                                type="number"
                                {...register('capacidadMaxima')}
                                error={errors.capacidadMaxima?.message}
                                min="1"
                                max="100"
                            />

                            <Input
                                label="Ubicación (opcional)"
                                {...register('ubicacion')}
                                error={errors.ubicacion?.message}
                                placeholder="Sala de Conferencias A"
                            />

                            <Input
                                label="Enlace virtual (opcional)"
                                type="url"
                                {...register('enlaceVirtual')}
                                error={errors.enlaceVirtual?.message}
                                placeholder="https://meet.google.com/..."
                            />
                        </div>

                        <div className="mt-6">
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

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Notas adicionales (opcional)
                            </label>
                            <textarea
                                {...register('notas')}
                                className="input-field min-h-[80px] resize-none"
                                placeholder="Material necesario, requisitos previos, etc..."
                            />
                        </div>
                    </div>

                    {/* Información del tipo seleccionado */}
                    {tipoSeleccionadoInfo && (
                        <div className="p-4 rounded-lg border"
                            style={{ borderColor: tipoSeleccionadoInfo.color, backgroundColor: `${tipoSeleccionadoInfo.color}10` }}>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tipoSeleccionadoInfo.color }} />
                                <div>
                                    <h4 className="font-semibold">{tipoSeleccionadoInfo.nombre}</h4>
                                    {tipoSeleccionadoInfo.descripcion && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {tipoSeleccionadoInfo.descripcion}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        Duración: {tipoSeleccionadoInfo.duracionDias} día(s)
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

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
                            <span className="material-symbols-outlined">add_circle</span>
                            Agendar Sesión
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Información sobre los tipos disponibles */}
            <Card title="Tipos de Onboarding Disponibles">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tipos.map((tipo) => (
                        <div
                            key={tipo.id}
                            className="p-3 rounded-lg border"
                            style={{ borderColor: tipo.color }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tipo.color }} />
                                <span className="font-medium">{tipo.nombre}</span>
                            </div>
                            {tipo.descripcion && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {tipo.descripcion}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default GestionOnboarding;