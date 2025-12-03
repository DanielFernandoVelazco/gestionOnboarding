import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { colaboradoresService } from '../../../services/colaboradores.service';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_progreso', label: 'En Progreso' },
    { value: 'completado', label: 'Completado' },
];

const schema = z.object({
    nombreCompleto: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    telefono: z.string().optional(),
    departamento: z.string().optional(),
    puesto: z.string().optional(),
    fechaIngreso: z.string().min(1, 'La fecha de ingreso es requerida'),
    estadoBienvenida: z.enum(['pendiente', 'en_progreso', 'completado']),
    estadoTecnico: z.enum(['pendiente', 'en_progreso', 'completado']),
    fechaOnboardingTecnico: z.string().optional(),
    notas: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const RegistroColaboradores = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            estadoBienvenida: 'pendiente',
            estadoTecnico: 'pendiente',
        },
    });

    // Cargar datos del colaborador si está en modo edición
    useEffect(() => {
        if (editId) {
            loadColaboradorData(editId);
            setIsEditMode(true);
        }
    }, [editId]);

    const loadColaboradorData = async (id: string) => {
        setLoadingData(true);
        try {
            const colaborador = await colaboradoresService.getById(id);

            // Formatear fechas para input type="date"
            const fechaIngreso = colaborador.fechaIngreso.split('T')[0];
            const fechaOnboardingTecnico = colaborador.fechaOnboardingTecnico
                ? colaborador.fechaOnboardingTecnico.split('T')[0]
                : undefined;

            // Establecer valores en el formulario
            setValue('nombreCompleto', colaborador.nombreCompleto);
            setValue('email', colaborador.email);
            setValue('telefono', colaborador.telefono || '');
            setValue('departamento', colaborador.departamento || '');
            setValue('puesto', colaborador.puesto || '');
            setValue('fechaIngreso', fechaIngreso);
            setValue('estadoBienvenida', colaborador.estadoBienvenida);
            setValue('estadoTecnico', colaborador.estadoTecnico);
            setValue('fechaOnboardingTecnico', fechaOnboardingTecnico || '');
            setValue('notas', colaborador.notas || '');

        } catch (err: any) {
            setError('Error al cargar los datos del colaborador');
            console.error('Error:', err);
        } finally {
            setLoadingData(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError('');

        try {
            if (isEditMode && editId) {
                // Modo edición
                await colaboradoresService.update(editId, data);
                // Mostrar mensaje de éxito
                alert('Colaborador actualizado exitosamente');
            } else {
                // Modo creación
                await colaboradoresService.create(data);
                reset();
                // Mostrar mensaje de éxito
                alert('Colaborador creado exitosamente');
            }

            // Redirigir a la tabla
            navigate('/colaboradores/tabla');

        } catch (err: any) {
            const errorMessage = err.response?.data?.message ||
                (isEditMode ? 'Error al actualizar el colaborador' : 'Error al crear el colaborador');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('¿Seguro que deseas cancelar? Los cambios no guardados se perderán.')) {
            navigate('/colaboradores/tabla');
        }
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Cargando datos del colaborador...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isEditMode ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isEditMode
                            ? 'Modifica la información del colaborador seleccionado.'
                            : 'Completa los siguientes campos para añadir un nuevo miembro al equipo.'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Volver
                    </Button>
                    {isEditMode && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (window.confirm('¿Restablecer todos los cambios?')) {
                                    if (editId) {
                                        loadColaboradorData(editId);
                                    }
                                }
                            }}
                        >
                            <span className="material-symbols-outlined">restart_alt</span>
                            Restablecer
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Información Personal */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                            Información Personal
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Nombre completo"
                                {...register('nombreCompleto')}
                                error={errors.nombreCompleto?.message}
                                placeholder="Ingrese el nombre completo"
                                required
                                disabled={loadingData}
                            />

                            <Input
                                label="Correo electrónico"
                                type="email"
                                {...register('email')}
                                error={errors.email?.message}
                                placeholder="ejemplo@empresa.com"
                                required
                                icon={<span className="material-symbols-outlined">mail</span>}
                                disabled={loadingData || isEditMode} // Email no editable en modo edición
                            />

                            <Input
                                label="Teléfono"
                                {...register('telefono')}
                                error={errors.telefono?.message}
                                placeholder="+1 234 567 890"
                                disabled={loadingData}
                            />

                            <Input
                                label="Departamento"
                                {...register('departamento')}
                                error={errors.departamento?.message}
                                placeholder="Tecnología"
                                disabled={loadingData}
                            />

                            <Input
                                label="Puesto"
                                {...register('puesto')}
                                error={errors.puesto?.message}
                                placeholder="Desarrollador Frontend"
                                disabled={loadingData}
                            />

                            <Input
                                label="Fecha de ingreso"
                                type="date"
                                {...register('fechaIngreso')}
                                error={errors.fechaIngreso?.message}
                                required
                                icon={<span className="material-symbols-outlined">calendar_today</span>}
                                disabled={loadingData}
                            />
                        </div>
                    </div>

                    {/* Detalles de Incorporación */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                            Detalles de Incorporación
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="Estado del Onboarding de Bienvenida"
                                {...register('estadoBienvenida')}
                                error={errors.estadoBienvenida?.message}
                                options={estados}
                                disabled={loadingData}
                            />

                            <Select
                                label="Estado del Onboarding Técnico"
                                {...register('estadoTecnico')}
                                error={errors.estadoTecnico?.message}
                                options={estados}
                                disabled={loadingData}
                            />

                            <div className="md:col-span-2">
                                <Input
                                    label="Fecha de onboarding técnico (Opcional)"
                                    type="date"
                                    {...register('fechaOnboardingTecnico')}
                                    error={errors.fechaOnboardingTecnico?.message}
                                    helperText="Solo si ya está programado"
                                    icon={<span className="material-symbols-outlined">event</span>}
                                    disabled={loadingData}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notas adicionales
                                </label>
                                <textarea
                                    {...register('notas')}
                                    className="input-field min-h-[100px] resize-none"
                                    placeholder="Información adicional sobre el colaborador..."
                                    disabled={loadingData}
                                />
                                {errors.notas?.message && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.notas.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            disabled={loadingData}
                        >
                            <span className="material-symbols-outlined">
                                {isEditMode ? 'save' : 'add'}
                            </span>
                            {isEditMode ? 'Actualizar Colaborador' : 'Guardar Colaborador'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default RegistroColaboradores;