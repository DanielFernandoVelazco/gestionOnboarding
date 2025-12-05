import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { colaboradoresService } from '../../services/colaboradores.service';
import { onboardingService } from '../../services/onboarding.service';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Dashboard = () => {
    const [stats, setStats] = useState({
        colaboradores: { total: 0, activos: 0 },
        onboarding: { total: 0, programadas: 0 },
        notificaciones: { total: 0, pendientes: 0 },
    });
    const [proximasSesiones, setProximasSesiones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Cargar estadísticas de colaboradores
            const colaboradoresStats = await colaboradoresService.getStats();

            // Cargar estadísticas de onboarding
            const onboardingStats = await onboardingService.getStats();

            // Cargar sesiones próximas
            const sesiones = await onboardingService.getProximasSesiones(3);

            setStats({
                colaboradores: {
                    total: colaboradoresStats.total || 0,
                    activos: colaboradoresStats.activos || 0,
                },
                onboarding: {
                    total: onboardingStats.total || 0,
                    programadas: onboardingStats.programadas || 0,
                },
                notificaciones: {
                    total: 0, // Implementar cuando haya endpoint
                    pendientes: 0,
                },
            });

            setProximasSesiones(sesiones || []);
        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Resumen general del sistema de gestión de onboarding
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="primary"
                        onClick={() => window.location.reload()}
                    >
                        <span className="material-symbols-outlined">refresh</span>
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Cards de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Colaboradores Totales
                            </h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats.colaboradores.total}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-primary/10">
                            <span className="material-symbols-outlined text-primary">people</span>
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                            {stats.colaboradores.activos} activos
                        </span>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Onboardings Activos
                            </h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats.onboarding.total}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10">
                            <span className="material-symbols-outlined text-blue-500">school</span>
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {stats.onboarding.programadas} programadas
                        </span>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Sesiones Programadas
                            </h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {proximasSesiones.length}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10">
                            <span className="material-symbols-outlined text-green-500">calendar_month</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link
                            to="/onboarding/calendario"
                            className="text-sm text-primary hover:text-primary-hover font-medium"
                        >
                            Ver calendario →
                        </Link>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Notificaciones Pendientes
                            </h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats.notificaciones.pendientes}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-yellow-500/10">
                            <span className="material-symbols-outlined text-yellow-500">mark_email_unread</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link
                            to="/notificaciones/alertas"
                            className="text-sm text-primary hover:text-primary-hover font-medium"
                        >
                            Gestionar alertas →
                        </Link>
                    </div>
                </Card>
            </div>

            {/* Contenido principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Próximos Onboardings */}
                <Card
                    title="Próximos Onboardings"
                    actions={
                        <Link to="/onboarding/calendario">
                            <Button variant="ghost" size="sm">
                                Ver todos
                            </Button>
                        </Link>
                    }
                >
                    {proximasSesiones.length > 0 ? (
                        <div className="space-y-3">
                            {proximasSesiones.map((sesion) => (
                                <div
                                    key={sesion.id}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border border-gray-100 dark:border-gray-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: sesion.tipo?.color || '#00448D' }}
                                        ></div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {sesion.titulo}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(sesion.fechaInicio).toLocaleDateString('es-ES')} • {sesion.participantes?.length || 0} participantes
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`badge ${sesion.estado === 'completada' ? 'badge-success' :
                                        sesion.estado === 'en_curso' ? 'badge-info' :
                                            'badge-warning'
                                        }`}>
                                        {sesion.estado}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <span className="material-symbols-outlined text-4xl mb-2">calendar_month</span>
                            <p>No hay sesiones programadas</p>
                            <Link to="/onboarding/calendario">
                                <Button variant="primary" className="mt-4">
                                    <span className="material-symbols-outlined">add_circle</span>
                                    Agendar nueva sesión
                                </Button>
                            </Link>
                        </div>
                    )}
                </Card>

                {/* Acciones rápidas */}
                <Card title="Acciones Rápidas">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Link to="/colaboradores/registro">
                            <Button variant="secondary" className="w-full justify-start h-auto py-3">
                                <span className="material-symbols-outlined mr-2">person_add</span>
                                <div className="text-left">
                                    <div className="font-medium">Registrar Colaborador</div>
                                    <div className="text-xs text-gray-500">Agregar nuevo miembro</div>
                                </div>
                            </Button>
                        </Link>

                        <Link to="/colaboradores/tabla">
                            <Button variant="secondary" className="w-full justify-start h-auto py-3">
                                <span className="material-symbols-outlined mr-2">table_view</span>
                                <div className="text-left">
                                    <div className="font-medium">Ver Colaboradores</div>
                                    <div className="text-xs text-gray-500">Lista completa</div>
                                </div>
                            </Button>
                        </Link>

                        <Link to="/onboarding/calendario">
                            <Button variant="secondary" className="w-full justify-start h-auto py-3">
                                <span className="material-symbols-outlined mr-2">calendar_month</span>
                                <div className="text-left">
                                    <div className="font-medium">Calendario</div>
                                    <div className="text-xs text-gray-500">Ver sesiones</div>
                                </div>
                            </Button>
                        </Link>

                        <Link to="/notificaciones/alertas">
                            <Button variant="secondary" className="w-full justify-start h-auto py-3">
                                <span className="material-symbols-outlined mr-2">mark_email_unread</span>
                                <div className="text-left">
                                    <div className="font-medium">Alertas</div>
                                    <div className="text-xs text-gray-500">Gestionar correos</div>
                                </div>
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;