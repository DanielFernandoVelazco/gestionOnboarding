import React, { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { notificacionesService, ParticipanteSesion } from '../../../services/notificaciones.service';

const AlertasCorreo = () => {
    const [mesActual, setMesActual] = useState(7); // Julio
    const [añoActual, setAñoActual] = useState(2024);
    const [participantes, setParticipantes] = useState<ParticipanteSesion[]>([]);
    const [participanteSeleccionado, setParticipanteSeleccionado] = useState<ParticipanteSesion | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);

    // Nombres de meses en español
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const participantesData = await notificacionesService.getParticipantesSesion('sesion-1');
            setParticipantes(participantesData);
            if (participantesData.length > 0) {
                setParticipanteSeleccionado(participantesData[1]); // Elena Rodriguez como seleccionado por defecto
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnteriorMes = () => {
        if (mesActual === 1) {
            setMesActual(12);
            setAñoActual(añoActual - 1);
        } else {
            setMesActual(mesActual - 1);
        }
    };

    const handleSiguienteMes = () => {
        if (mesActual === 12) {
            setMesActual(1);
            setAñoActual(añoActual + 1);
        } else {
            setMesActual(mesActual + 1);
        }
    };

    const participantesFiltrados = participantes.filter(p =>
        p.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.email.toLowerCase().includes(busqueda.toLowerCase())
    );

    const eliminarParticipante = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este participante?')) {
            try {
                await notificacionesService.eliminarParticipanteSesion('sesion-1', id);
                setParticipantes(participantes.filter(p => p.id !== id));
                if (participanteSeleccionado?.id === id) {
                    setParticipanteSeleccionado(participantesFiltrados[0] || null);
                }
            } catch (error) {
                console.error('Error al eliminar participante:', error);
            }
        }
    };

    const agregarParticipante = () => {
        // Implementar modal para agregar participante
        alert('Funcionalidad para agregar participante - En construcción');
    };

    const enviarCorreoPrueba = async () => {
        try {
            await notificacionesService.enviarCorreoPrueba('test@example.com');
            alert('Correo de prueba enviado exitosamente');
        } catch (error) {
            console.error('Error al enviar correo de prueba:', error);
            alert('Error al enviar correo de prueba');
        }
    };

    const notificarParticipantes = async () => {
        try {
            await notificacionesService.notificarParticipantesSesion('sesion-1');
            alert('Notificaciones enviadas a los participantes');
        } catch (error) {
            console.error('Error al notificar participantes:', error);
            alert('Error al enviar notificaciones');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Alertas de Correo
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-base">
                    Calendario de sesiones de onboarding y gestión de notificaciones.
                </p>
            </div>

            {/* Calendario de Sesiones */}
            <Card title="Calendario de Sesiones">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAnteriorMes}
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </Button>
                        <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                            {meses[mesActual - 1]} - {meses[(mesActual + 1) % 12]} {añoActual}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSiguienteMes}
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Julio */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-center font-semibold text-gray-800 dark:text-gray-200 text-base">
                            Julio 2024
                        </h3>
                        <div className="grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400">
                            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((dia, i) => (
                                <span key={i}>{dia}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 text-center text-sm">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                                <div key={dia} className="font-medium text-gray-800 dark:text-gray-200 relative">
                                    {dia === 16 ? (
                                        <>
                                            <span className="absolute -top-1 -left-1 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
                                                {dia}
                                            </span>
                                            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full"></div>
                                        </>
                                    ) : (
                                        <span className={`p-1 ${dia === new Date().getDate() && mesActual === new Date().getMonth() + 1 ? 'text-primary font-bold' : ''}`}>
                                            {dia}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Agosto */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-center font-semibold text-gray-800 dark:text-gray-200 text-base">
                            Agosto 2024
                        </h3>
                        <div className="grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400">
                            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((dia, i) => (
                                <span key={i}>{dia}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 text-center text-sm">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                                <div key={dia} className="font-medium text-gray-800 dark:text-gray-200 relative">
                                    {dia === 13 ? (
                                        <>
                                            <span className="absolute -top-1 -left-1 flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary-dark dark:text-white dark:bg-primary/40">
                                                {dia}
                                            </span>
                                            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary/40 rounded-full"></div>
                                        </>
                                    ) : (
                                        <span className={`p-1 ${dia <= 3 ? 'text-gray-400 dark:text-gray-600' : ''}`}>
                                            {dia}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Septiembre */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-center font-semibold text-gray-800 dark:text-gray-200 text-base">
                            Septiembre 2024
                        </h3>
                        <div className="grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400">
                            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((dia, i) => (
                                <span key={i}>{dia}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 text-center text-sm">
                            {Array.from({ length: 30 }, (_, i) => i + 1).map((dia) => (
                                <div key={dia} className="font-medium text-gray-800 dark:text-gray-200 relative">
                                    {dia === 10 ? (
                                        <>
                                            <span className="absolute -top-1 -left-1 flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary-dark dark:text-white dark:bg-primary/40">
                                                {dia}
                                            </span>
                                            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary/40 rounded-full"></div>
                                        </>
                                    ) : (
                                        <span className={`p-1 ${dia <= 6 ? 'text-gray-400 dark:text-gray-600' : ''}`}>
                                            {dia}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Participantes y Detalles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Lista de Participantes */}
                <div className="lg:col-span-2">
                    <Card
                        title="Participantes de la sesión del 16 de Julio"
                        subtitle="Lista de colaboradores programados para esta fecha."
                        actions={
                            <Button variant="primary" onClick={agregarParticipante}>
                                <span className="material-symbols-outlined">add_circle</span>
                                Añadir Participante
                            </Button>
                        }
                    >
                        {/* Búsqueda */}
                        <div className="mb-6">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    search
                                </span>
                                <Input
                                    placeholder="Buscar participante por nombre..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Tabla de Participantes */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Nombre</th>
                                        <th className="px-6 py-3 font-medium">Fechas</th>
                                        <th className="px-6 py-3 font-medium">Correo Electrónico</th>
                                        <th className="px-6 py-3 font-medium">Sesión</th>
                                        <th className="px-6 py-3 font-medium text-center">Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participantesFiltrados.map((participante, index) => (
                                        <tr
                                            key={participante.id}
                                            onClick={() => setParticipanteSeleccionado(participante)}
                                            className={`
                        cursor-pointer border-b dark:border-gray-700 
                        ${participanteSeleccionado?.id === participante.id
                                                    ? 'bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30'
                                                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                }
                      `}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                    {participante.nombreCompleto}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                16 Jul - 18 Jul
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {participante.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {participante.lugarAsignacion === 'capitulo_backend' ? 'Backend Devs' :
                                                    participante.lugarAsignacion === 'capitulo_frontend' ? 'Frontend Masters' : 'General'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        eliminarParticipante(participante.id);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Detalles del Participante */}
                <div className="lg:col-span-1">
                    <Card
                        title="Detalles del Participante"
                        className="sticky top-8"
                    >
                        {participanteSeleccionado ? (
                            <div className="space-y-6">
                                {/* Información del participante */}
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center">
                                        <span className="text-2xl text-gray-500 dark:text-gray-400">
                                            {participanteSeleccionado.nombreCompleto.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {participanteSeleccionado.nombreCompleto}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {participanteSeleccionado.puesto}
                                        </p>
                                    </div>
                                </div>

                                {/* Información detallada */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400">
                                            Correo Electrónico
                                        </label>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                            {participanteSeleccionado.email}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400">
                                            Teléfono
                                        </label>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                            {participanteSeleccionado.telefono || 'No disponible'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400">
                                            Departamento
                                        </label>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                            {participanteSeleccionado.departamento || 'No especificado'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400">
                                            Fecha de Ingreso
                                        </label>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                            {new Date(participanteSeleccionado.fechaIngreso).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>

                                {/* Sesión Asignada */}
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                        Sesión Asignada
                                    </label>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                        {participanteSeleccionado.lugarAsignacion === 'capitulo_frontend' ? 'Frontend Masters' :
                                            participanteSeleccionado.lugarAsignacion === 'capitulo_backend' ? 'Backend Devs' :
                                                'General'}
                                    </p>
                                </div>

                                {/* Progreso del Onboarding */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs text-gray-500 dark:text-gray-400">
                                            Progreso del Onboarding
                                        </label>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">75%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                        <div
                                            className="bg-yellow-500 h-2.5 rounded-full"
                                            style={{ width: '75%' }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">
                                        75% completado
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <span className="material-symbols-outlined text-4xl mb-2">person_search</span>
                                <p>Selecciona un participante para ver sus detalles</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Probar Notificaciones */}
            <Card
                title="Probar Notificaciones"
                subtitle="Verifica la entrega de alertas por correo."
                actions={
                    <Button variant="outline" onClick={enviarCorreoPrueba}>
                        <span className="material-symbols-outlined">send</span>
                        Enviar Correo de Prueba
                    </Button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                            Notificar Participantes
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                            Envía notificaciones a todos los participantes de la sesión.
                        </p>
                        <Button variant="primary" onClick={notificarParticipantes}>
                            <span className="material-symbols-outlined">notifications</span>
                            Notificar Todos
                        </Button>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                            Estadísticas de Envío
                        </h4>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">24</p>
                                <p className="text-sm text-green-600 dark:text-green-500">Total Notificaciones</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">18</p>
                                <p className="text-sm text-green-600 dark:text-green-500">Enviadas</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">4</p>
                                <p className="text-sm text-yellow-600 dark:text-yellow-500">Pendientes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AlertasCorreo;