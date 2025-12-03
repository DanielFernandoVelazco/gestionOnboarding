import { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import { notificacionesService, Notificacion } from '../../../services/notificaciones.service';
import { onboardingService } from '../../../services/onboarding.service';

const AlertasCorreo = () => {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tipoFilter, setTipoFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');
    const [sesiones, setSesiones] = useState<any[]>([]);
    const [emailPrueba, setEmailPrueba] = useState('');

    const tipos = [
        { value: '', label: 'Todos los tipos' },
        { value: 'onboarding_agendado', label: 'Onboarding Agendado' },
        { value: 'recordatorio_sesion', label: 'Recordatorio de Sesión' },
        { value: 'cambio_estado', label: 'Cambio de Estado' },
        { value: 'nuevo_colaborador', label: 'Nuevo Colaborador' },
        { value: 'sistema', label: 'Sistema' },
    ];

    const estados = [
        { value: '', label: 'Todos los estados' },
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'enviada', label: 'Enviada' },
        { value: 'fallida', label: 'Fallida' },
    ];

    const columns = [
        {
            key: 'asunto',
            header: 'Asunto',
            render: (item: Notificacion) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {item.asunto}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(item.createdAt).toLocaleString('es-ES')}
                    </div>
                </div>
            ),
        },
        {
            key: 'destinatario',
            header: 'Destinatario',
            render: (item: Notificacion) => (
                <div className="text-gray-900 dark:text-white">
                    {item.destinatario?.nombreCompleto || 'Sistema'}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.destinatario?.email || '-'}
                    </div>
                </div>
            ),
        },
        {
            key: 'tipo',
            header: 'Tipo',
            render: (item: Notificacion) => (
                <span className={`badge ${item.tipo === 'onboarding_agendado' ? 'badge-info' :
                    item.tipo === 'recordatorio_sesion' ? 'badge-warning' :
                        item.tipo === 'cambio_estado' ? 'badge-success' :
                            'badge-error'
                    }`}>
                    {item.tipo.replace('_', ' ')}
                </span>
            ),
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (item: Notificacion) => (
                <span className={`badge ${item.estado === 'enviada' ? 'badge-success' :
                    item.estado === 'pendiente' ? 'badge-warning' :
                        'badge-error'
                    }`}>
                    {item.estado}
                    {item.fechaEnvio && (
                        <div className="text-xs mt-1">
                            {new Date(item.fechaEnvio).toLocaleDateString('es-ES')}
                        </div>
                    )}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (item: Notificacion) => (
                <div className="flex gap-2">
                    {item.estado === 'pendiente' && (
                        <button
                            onClick={() => handleEnviarNotificacion(item.id)}
                            className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-hover"
                        >
                            Enviar
                        </button>
                    )}
                    <button
                        onClick={() => console.log('Ver detalles:', item.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                    >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                    </button>
                </div>
            ),
        },
    ];

    useEffect(() => {
        loadNotificaciones();
        loadSesiones();
    }, [tipoFilter, estadoFilter]);

    const loadNotificaciones = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (tipoFilter) filters.tipo = tipoFilter;
            if (estadoFilter) filters.estado = estadoFilter;

            const response = await notificacionesService.getNotificaciones(filters);
            setNotificaciones(response.data);
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSesiones = async () => {
        try {
            const data = await onboardingService.getSesionesProximas(10);
            setSesiones(data);
        } catch (error) {
            console.error('Error al cargar sesiones:', error);
        }
    };

    const handleEnviarNotificacion = async (id: string) => {
        try {
            await notificacionesService.enviarNotificacion(id);
            loadNotificaciones();
        } catch (error) {
            console.error('Error al enviar notificación:', error);
        }
    };

    const handleEnviarCorreoPrueba = async () => {
        if (!emailPrueba) return;

        try {
            await notificacionesService.enviarCorreoPrueba(emailPrueba);
            alert('Correo de prueba enviado');
            setEmailPrueba('');
        } catch (error) {
            console.error('Error al enviar correo de prueba:', error);
        }
    };

    const handleNotificarSesion = async (sesionId: string) => {
        try {
            await notificacionesService.notificarParticipantesSesion(sesionId);
            alert('Notificaciones enviadas a participantes');
            loadNotificaciones();
        } catch (error) {
            console.error('Error al notificar sesión:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Alertas de Correo
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gestiona las notificaciones por correo electrónico.
                    </p>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Notificaciones Totales
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {notificaciones.length}
                    </p>
                </Card>
                <Card>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Pendientes
                    </h3>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {notificaciones.filter(n => n.estado === 'pendiente').length}
                    </p>
                </Card>
                <Card>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Enviadas
                    </h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {notificaciones.filter(n => n.estado === 'enviada').length}
                    </p>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex-grow">
                        <Input
                            placeholder="Buscar notificaciones..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={<span className="material-symbols-outlined">search</span>}
                        />
                    </div>
                    <Select
                        value={tipoFilter}
                        onChange={(e) => setTipoFilter(e.target.value)}
                        options={tipos}
                        className="w-48"
                    />
                    <Select
                        value={estadoFilter}
                        onChange={(e) => setEstadoFilter(e.target.value)}
                        options={estados}
                        className="w-48"
                    />
                </div>

                {/* Tabla de notificaciones */}
                <Table
                    columns={columns}
                    data={notificaciones.filter(n =>
                        n.asunto.toLowerCase().includes(search.toLowerCase()) ||
                        n.destinatario?.nombreCompleto.toLowerCase().includes(search.toLowerCase())
                    )}
                    loading={loading}
                    emptyMessage="No hay notificaciones"
                />
            </Card>

            {/* Prueba de notificaciones */}
            <Card title="Probar Notificaciones" subtitle="Verifica la entrega de alertas por correo">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Correo de prueba"
                                type="email"
                                value={emailPrueba}
                                onChange={(e) => setEmailPrueba(e.target.value)}
                                placeholder="ejemplo@empresa.com"
                            />
                            <Button
                                variant="primary"
                                onClick={handleEnviarCorreoPrueba}
                                className="mt-2"
                                disabled={!emailPrueba}
                            >
                                <span className="material-symbols-outlined">send</span>
                                Enviar Correo de Prueba
                            </Button>
                        </div>
                        <div>
                            <Select
                                label="Seleccionar sesión"
                                options={[
                                    { value: '', label: 'Seleccionar sesión...' },
                                    ...sesiones.map(s => ({
                                        value: s.id,
                                        label: s.titulo,
                                    }))
                                ]}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleNotificarSesion(e.target.value);
                                    }
                                }}
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Notificar a todos los participantes de la sesión seleccionada
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Calendario de sesiones */}
            <Card title="Calendario de Sesiones" subtitle="Sesiones programadas para los próximos meses">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </Button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Julio - Septiembre 2024
                        </span>
                        <Button variant="ghost" size="sm">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </Button>
                    </div>
                    <Button variant="primary" size="sm">
                        <span className="material-symbols-outlined">add_circle</span>
                        Añadir Participante
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Meses del calendario - versión simplificada */}
                    {['Julio', 'Agosto', 'Septiembre'].map((mes) => (
                        <div key={mes} className="space-y-2">
                            <h4 className="text-center font-semibold text-gray-800 dark:text-gray-200">
                                {mes} 2024
                            </h4>
                            <div className="grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400">
                                {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((dia) => (
                                    <span key={dia}>{dia}</span>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 text-center text-sm">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                                    <div
                                        key={dia}
                                        className={`p-1 ${dia === 16 ? 'bg-primary text-white rounded-full' : ''
                                            }`}
                                    >
                                        {dia}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default AlertasCorreo;