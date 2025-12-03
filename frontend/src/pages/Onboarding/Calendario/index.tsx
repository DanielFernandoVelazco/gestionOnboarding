import React, { useState, useEffect } from 'react';
import Calendar from '../../../components/shared/Calendar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { onboardingService } from '../../../services/onboarding.service';

const CalendarioOnboardings = () => {
    const [filter, setFilter] = useState('');
    const [tipos, setTipos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [tiposData, statsData] = await Promise.all([
                onboardingService.getTipos(),
                onboardingService.getStats()
            ]);

            // Asegurar que tiposData es un array
            setTipos(Array.isArray(tiposData) ? tiposData : []);
            setStats(statsData || {
                total: 0,
                programadas: 0,
                enCurso: 0,
                completadas: 0,
                canceladas: 0,
            });
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
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (evento: any) => {
        console.log('Evento clickeado:', evento);
        // Aquí podrías mostrar un modal con detalles
    };

    const handleSesionClick = (sesion: any) => {
        console.log('Sesión clickeada:', sesion);
        // Aquí podrías mostrar un modal con detalles de la sesión
    };

    const handleAgendarClick = () => {
        // Implementar lógica para agendar nuevo onboarding
        console.log('Agendar nuevo onboarding');
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Card title="Próximas Sesiones" subtitle="Sesiones programadas para las próximas semanas">
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: '#00448D' }}
                                ></div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                        Journey to Cloud - Cohort {i}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        15-18 Julio 2024 • 10 participantes
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="badge badge-info">Programada</span>
                                <button className="p-1 text-gray-400 hover:text-gray-600">
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default CalendarioOnboardings;