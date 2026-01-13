import { useState, useEffect } from 'react';
import { format, parse, getDay, getMonth, getYear, endOfMonth } from 'date-fns';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { notificacionesService, ParticipanteSesion, MesCalendario, Notificacion } from '../../../services/notificaciones.service';

const AlertasCorreo = () => {
    const [mesActual, setMesActual] = useState(getMonth(new Date()) + 1);
    const [añoActual, setAñoActual] = useState(getYear(new Date()));
    const [calendario, setCalendario] = useState<MesCalendario | null>(null);
    const [participantes, setParticipantes] = useState<ParticipanteSesion[]>([]);
    const [participanteSeleccionado, setParticipanteSeleccionado] = useState<ParticipanteSesion | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [sesionSeleccionada, setSesionSeleccionada] = useState<string>('');
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [loadingNotificaciones, setLoadingNotificaciones] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // NUEVOS ESTADOS
    const [loadingTodosParticipantes, setLoadingTodosParticipantes] = useState(false);
    const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);

    // NUEVOS ESTADOS PARA ENVÍO DE CORREOS
    const [mostrarModalCorreo, setMostrarModalCorreo] = useState(false);
    const [participantesSeleccionados, setParticipantesSeleccionados] = useState<string[]>([]);
    const [tipoCorreo, setTipoCorreo] = useState<'prueba' | 'notificacion'>('prueba');
    const [enviandoCorreo, setEnviandoCorreo] = useState(false);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);
    const [mensajeError, setMensajeError] = useState<string | null>(null);

    // Nombres de meses en español
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    useEffect(() => {
        cargarCalendario();
    }, [mesActual, añoActual]);

    useEffect(() => {
        cargarNotificaciones();
    }, []);

    const cargarCalendario = async () => {
        setLoading(true);
        setError(null);
        setParticipantes([]);
        setParticipanteSeleccionado(null);
        setDiaSeleccionado(null);

        try {
            const calendarioData = await notificacionesService.getCalendarioMes(añoActual, mesActual);
            setCalendario(calendarioData);
        } catch (error: any) {
            setError(error.message || 'Error al cargar el calendario');
            console.error('Error al cargar calendario:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarParticipantesPorSesion = async (sesionId: string) => {
        try {
            const participantesData = await notificacionesService.getParticipantesSesion(sesionId);
            setParticipantes(participantesData);
            setSesionSeleccionada(sesionId);
            if (participantesData.length > 0) {
                setParticipanteSeleccionado(participantesData[0]);
            } else {
                setParticipanteSeleccionado(null);
            }
        } catch (error: any) {
            console.error('Error al cargar participantes de la sesión:', error);
            setParticipantes([]);
            setParticipanteSeleccionado(null);
        }
    };

    const handleDiaClick = (dia: number) => {
        if (!calendario) return;

        const sesionesDelDia: any[] = [];

        calendario.semanas.forEach(semana => {
            semana.forEach(diaCalendario => {
                if (diaCalendario.esMesActual && diaCalendario.fecha.getDate() === dia) {
                    sesionesDelDia.push(...diaCalendario.sesiones);
                }
            });
        });

        if (sesionesDelDia.length > 0) {
            setDiaSeleccionado(dia);

            if (sesionesDelDia.length === 1) {
                cargarParticipantesPorSesion(sesionesDelDia[0].id);
            } else if (sesionesDelDia.length > 1) {
                const opciones = sesionesDelDia.map((s, i) => `${i + 1}. ${s.titulo}`).join('\n');
                const seleccion = window.prompt(
                    `Hay ${sesionesDelDia.length} sesiones el día ${dia}.\n\nSelecciona una:\n\n${opciones}`
                );

                if (seleccion) {
                    const indice = parseInt(seleccion) - 1;
                    if (indice >= 0 && indice < sesionesDelDia.length) {
                        cargarParticipantesPorSesion(sesionesDelDia[indice].id);
                    }
                }
            }
        } else {
            setDiaSeleccionado(dia);
            setParticipantes([]);
            setParticipanteSeleccionado(null);
        }
    };

    const handleMostrarTodosParticipantesMes = async () => {
        if (!calendario) {
            alert('El calendario no está cargado.');
            return;
        }

        setLoadingTodosParticipantes(true);
        setParticipantes([]);
        setParticipanteSeleccionado(null);
        setDiaSeleccionado(null);

        try {
            const sesionesIds = new Set<string>();
            calendario.semanas.forEach(semana => {
                semana.forEach(dia => {
                    dia.sesiones.forEach(sesion => {
                        sesionesIds.add(sesion.id);
                    });
                });
            });

            if (sesionesIds.size === 0) {
                alert('No hay sesiones este mes.');
                return;
            }

            const promesasParticipantes = Array.from(sesionesIds).map(id =>
                notificacionesService.getParticipantesSesion(id)
            );

            const resultados = await Promise.all(promesasParticipantes);

            const todosParticipantes = resultados.flat();
            const participantesUnicos = todosParticipantes.filter((participante, index, self) =>
                index === self.findIndex((p) => p.id === participante.id)
            );

            setParticipantes(participantesUnicos);
            if (participantesUnicos.length > 0) {
                setParticipanteSeleccionado(participantesUnicos[0]);
            }

        } catch (error: any) {
            console.error('Error al cargar todos los participantes del mes:', error);
            alert('No se pudieron cargar los participantes del mes.');
        } finally {
            setLoadingTodosParticipantes(false);
        }
    };

    const cargarNotificaciones = async () => {
        setLoadingNotificaciones(true);
        try {
            const notificacionesData = await notificacionesService.getNotificaciones();
            setNotificaciones(notificacionesData.data || []);
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        } finally {
            setLoadingNotificaciones(false);
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
        p.nombreCompleto?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.departamento?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.puesto?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const toggleSeleccionParticipante = (participanteId: string) => {
        setParticipantesSeleccionados(prev => {
            if (prev.includes(participanteId)) {
                return prev.filter(id => id !== participanteId);
            } else {
                return [...prev, participanteId];
            }
        });
    };

    const seleccionarTodosFiltrados = () => {
        const idsFiltrados = participantesFiltrados.map(p => p.id);
        setParticipantesSeleccionados(idsFiltrados);
    };

    const deseleccionarTodos = () => {
        setParticipantesSeleccionados([]);
    };

    const enviarCorreoPruebaSeleccionados = async () => {
        if (participantesSeleccionados.length === 0) {
            setMensajeError('Por favor, selecciona al menos un participante.');
            return;
        }

        setEnviandoCorreo(true);
        setMensajeError(null);
        setMensajeExito(null);

        try {
            const participantesParaEnviar = participantes.filter(p =>
                participantesSeleccionados.includes(p.id)
            );

            const emails = participantesParaEnviar.map(p => p.email).filter(Boolean);

            if (emails.length === 0) {
                setMensajeError('No se encontraron emails válidos para los participantes seleccionados.');
                return;
            }

            const promesas = emails.map(email =>
                notificacionesService.enviarCorreoPrueba(email)
            );

            const resultados = await Promise.allSettled(promesas);

            const exitosos = resultados.filter(r => r.status === 'fulfilled').length;
            const fallidos = resultados.filter(r => r.status === 'rejected').length;

            setMensajeExito(
                `Correos enviados exitosamente: ${exitosos} de ${resultados.length}. ` +
                (fallidos > 0 ? `${fallidos} correos fallaron.` : 'Todos los correos fueron enviados correctamente.')
            );

            // Cerrar modal automáticamente y limpiar selección
            if (exitosos > 0) {
                setParticipantesSeleccionados([]);
                setMostrarModalCorreo(false);
                cargarNotificaciones();
            }

        } catch (error: any) {
            setMensajeError(`Error al enviar correos: ${error.message || 'Error desconocido'}`);
            console.error('Error al enviar correos de prueba:', error);
        } finally {
            setEnviandoCorreo(false);
        }
    };

    const notificarParticipantesSesion = async () => {
        if (!sesionSeleccionada) {
            setMensajeError('No hay una sesión seleccionada.');
            return;
        }

        setEnviandoCorreo(true);
        setMensajeError(null);
        setMensajeExito(null);

        try {
            await notificacionesService.notificarParticipantesSesion(sesionSeleccionada);
            setMensajeExito('Notificaciones enviadas a todos los participantes de la sesión exitosamente.');

            cargarNotificaciones();
            setMostrarModalCorreo(false);

        } catch (err: any) {
            setMensajeError(`Error al notificar participantes: ${err.message || 'Error desconocido'}`);
            console.error('Error al notificar participantes:', err);
        } finally {
            setEnviandoCorreo(false);
        }
    };

    const abrirModalSeleccionDestinatarios = (tipo: 'prueba' | 'notificacion') => {
        setTipoCorreo(tipo);
        setMostrarModalCorreo(true);
        setMensajeError(null);
        setMensajeExito(null);

        if (tipo === 'prueba' && participanteSeleccionado) {
            setParticipantesSeleccionados([participanteSeleccionado.id]);
        } else {
            setParticipantesSeleccionados([]);
        }
    };

    const getSessionTypeAndColor = (sesion: any) => {
        if (!sesion) return { type: 'Otro', color: '#9E9E9E' };

        const tipoNombre = sesion.tipo?.nombre?.toLowerCase() ||
            sesion.tipo?.toLowerCase() ||
            sesion.lugarAsignacion?.toLowerCase() ||
            '';

        if (tipoNombre.includes('frontend')) return { type: 'Capítulo Frontend', color: '#00448D' };
        if (tipoNombre.includes('backend')) return { type: 'Capítulo Backend', color: '#FF6B35' };
        if (tipoNombre.includes('data')) return { type: 'Capítulo Data', color: '#FFD100' };
        if (tipoNombre.includes('cloud') || tipoNombre.includes('journey')) return { type: 'Journey to Cloud', color: '#E31937' };
        if (tipoNombre.includes('bienvenida')) return { type: 'Bienvenida', color: '#4CAF50' };

        return { type: 'Otro', color: '#9E9E9E' };
    };

    const getEventTypeAndColor = (evento: any) => {
        if (!evento) return { type: 'Otro', color: '#9E9E9E' };

        const tipo = evento.tipo?.toLowerCase() || '';

        if (tipo.includes('frontend')) return { type: 'Capítulo Frontend', color: '#00448D' };
        if (tipo.includes('backend')) return { type: 'Capítulo Backend', color: '#FF6B35' };
        if (tipo.includes('data')) return { type: 'Capítulo Data', color: '#FFD100' };
        if (tipo.includes('cloud') || tipo.includes('journey')) return { type: 'Journey to Cloud', color: '#E31937' };
        if (tipo.includes('bienvenida')) return { type: 'Bienvenida', color: '#4CAF50' };

        return { type: 'Otro', color: '#9E9E9E' };
    };

    const getTiposEnCalendario = () => {
        if (!calendario) return [];

        const tipos = new Set();

        calendario.semanas.forEach(semana => {
            semana.forEach(dia => {
                dia.sesiones.forEach(sesion => {
                    const { type } = getSessionTypeAndColor(sesion);
                    tipos.add(type);
                });

                dia.eventos.forEach(evento => {
                    const { type } = getEventTypeAndColor(evento);
                    tipos.add(type);
                });
            });
        });

        return Array.from(tipos);
    };

    // NUEVA FUNCIÓN: Renderizar calendario simplificado
    const renderCalendarioCompleto = () => {
        if (!calendario) return null;

        const hoy = new Date();
        const esMesActual = hoy.getMonth() + 1 === mesActual && hoy.getFullYear() === añoActual;

        return (
            <div className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                                    <th
                                        key={dia}
                                        className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                    >
                                        {dia}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {calendario.semanas.map((semana, semanaIndex) => (
                                <tr key={semanaIndex} className="border-b border-gray-200 dark:border-gray-700">
                                    {semana.map((dia, diaIndex) => {
                                        const esDiaActual = esMesActual &&
                                            dia.esMesActual &&
                                            dia.fecha.getDate() === hoy.getDate();

                                        const esDiaSeleccionado = dia.esMesActual &&
                                            dia.fecha.getDate() === diaSeleccionado;

                                        return (
                                            <td
                                                key={diaIndex}
                                                className={`
                                                    p-2 border border-gray-200 dark:border-gray-700 min-h-24
                                                    ${!dia.esMesActual ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                                                    ${esDiaActual ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                                    ${esDiaSeleccionado ? 'ring-2 ring-primary ring-offset-1' : ''}
                                                `}
                                            >
                                                <div className="flex flex-col h-full">
                                                    {/* Número del día */}
                                                    <div className={`
                                                        flex items-center justify-between mb-1
                                                        ${!dia.esMesActual ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}
                                                    `}>
                                                        <span className={`
                                                            text-sm font-medium px-2 py-1 rounded-full
                                                            ${esDiaActual ? 'bg-primary text-white' : ''}
                                                        `}>
                                                            {dia.fecha.getDate()}
                                                        </span>
                                                        {dia.sesiones.length > 0 && (
                                                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                                                                {dia.sesiones.length}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Sesiones */}
                                                    <div className="space-y-1">
                                                        {dia.sesiones.slice(0, 2).map((sesion, idx) => {
                                                            const { color } = getSessionTypeAndColor(sesion);
                                                            return (
                                                                <div
                                                                    key={`sesion-${idx}`}
                                                                    className="text-xs p-1 rounded cursor-pointer hover:opacity-90"
                                                                    style={{ backgroundColor: `${color}20`, borderLeft: `3px solid ${color}` }}
                                                                    title={`${sesion.titulo}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDiaClick(dia.fecha.getDate());
                                                                    }}
                                                                >
                                                                    <div className="font-medium truncate">{sesion.titulo}</div>
                                                                </div>
                                                            );
                                                        })}
                                                        {dia.sesiones.length > 2 && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                                                +{dia.sesiones.length - 2} más
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const getColorPorLugar = (lugar?: string) => {
        switch (lugar) {
            case 'capitulo_frontend': return '#00448D';
            case 'capitulo_backend': return '#FF6B35';
            case 'capitulo_data': return '#FFD100';
            case 'journey_to_cloud': return '#E31937';
            default: return '#9E9E9E';
        }
    };

    const getNombreSesion = (lugar?: string) => {
        switch (lugar) {
            case 'capitulo_frontend': return 'Frontend Masters';
            case 'capitulo_backend': return 'Backend Devs';
            case 'capitulo_data': return 'Capítulo Data';
            case 'journey_to_cloud': return 'Journey to Cloud';
            default: return 'General';
        }
    };

    const getEstadoColor = (estado?: string) => {
        switch (estado) {
            case 'completado': return 'badge-success';
            case 'en_progreso': return 'badge-info';
            case 'pendiente': return 'badge-warning';
            default: return 'badge-warning';
        }
    };

    const calcularEstadisticas = () => {
        const total = notificaciones.length;
        const enviadas = notificaciones.filter(n => n.estado === 'enviada').length;
        const pendientes = notificaciones.filter(n => n.estado === 'pendiente').length;
        const fallidas = notificaciones.filter(n => n.estado === 'fallida').length;

        return { total, enviadas, pendientes, fallidas };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const estadisticas = calcularEstadisticas();
    const tiposEnCalendario = getTiposEnCalendario();

    let tituloParticipantes = `Participantes de sesiones - ${meses[mesActual - 1]} ${añoActual}`;
    if (diaSeleccionado) {
        tituloParticipantes = `Participantes del ${diaSeleccionado} de ${meses[mesActual - 1]} - ${participantes.length} encontrados`;
    } else if (participantes.length > 0 && !diaSeleccionado) {
        tituloParticipantes = `Todos los participantes del mes - ${participantes.length} encontrados`;
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

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <button
                        onClick={cargarCalendario}
                        className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Calendario de Sesiones - SIMPLIFICADO */}
            <Card
                title="Calendario de Sesiones"
                subtitle={`${meses[mesActual - 1]} ${añoActual} - Haz clic en un día para ver participantes`}
            >
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={handleAnteriorMes}
                                className="flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                                Mes anterior
                            </Button>

                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {meses[mesActual - 1]} {añoActual}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {diaSeleccionado ? `Día seleccionado: ${diaSeleccionado}` : 'Selecciona un día'}
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                onClick={handleSiguienteMes}
                                className="flex items-center gap-2"
                            >
                                Mes siguiente
                                <span className="material-symbols-outlined">chevron_right</span>
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            onClick={cargarCalendario}
                            className="flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Calendario simplificado */}
                {renderCalendarioCompleto()}

                {/* Leyenda mínima */}
                <div className="mt-4 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-100 border border-green-500"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Días con sesiones</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Hoy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full ring-2 ring-primary"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Seleccionado</span>
                    </div>
                </div>
            </Card>

            {/* Participantes y Detalles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Lista de Participantes */}
                <div className="lg:col-span-2">
                    <Card
                        title={tituloParticipantes}
                        subtitle={diaSeleccionado || participantes.length > 0 ? `Haz clic en un participante para ver sus detalles. Marca para enviar correo.` : 'Haz clic en un día del calendario con sesiones para ver los participantes.'}
                        actions={
                            <Button variant="outline" onClick={handleMostrarTodosParticipantesMes} disabled={loadingTodosParticipantes}>
                                {loadingTodosParticipantes ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                    <span className="material-symbols-outlined">groups</span>
                                )}
                                Mostrar participantes del mes
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
                                    placeholder="Buscar participante por nombre, email, departamento..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Controles de selección */}
                        {participantesFiltrados.length > 0 && (
                            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {participantesSeleccionados.length} seleccionados
                                    </span>
                                    {participantesSeleccionados.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => abrirModalSeleccionDestinatarios('prueba')}
                                            className="ml-2"
                                        >
                                            <span className="material-symbols-outlined text-sm mr-1">send</span>
                                            Enviar correo
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={seleccionarTodosFiltrados}
                                        disabled={participantesFiltrados.length === 0}
                                    >
                                        <span className="material-symbols-outlined text-sm mr-1">check_box</span>
                                        Todos
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={deseleccionarTodos}
                                        disabled={participantesSeleccionados.length === 0}
                                    >
                                        <span className="material-symbols-outlined text-sm mr-1">check_box_outline_blank</span>
                                        Ninguno
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Tabla de Participantes */}
                        <div className="overflow-x-auto">
                            {participantesFiltrados.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-4 py-3 font-medium w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={participantesFiltrados.length > 0 &&
                                                        participantesSeleccionados.length === participantesFiltrados.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            seleccionarTodosFiltrados();
                                                        } else {
                                                            deseleccionarTodos();
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 dark:border-gray-600"
                                                />
                                            </th>
                                            <th className="px-4 py-3 font-medium">Nombre</th>
                                            <th className="px-4 py-3 font-medium">Email</th>
                                            <th className="px-4 py-3 font-medium">Departamento</th>
                                            <th className="px-4 py-3 font-medium">Sesión</th>
                                            <th className="px-4 py-3 font-medium">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {participantesFiltrados.map((participante) => (
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
                                                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={participantesSeleccionados.includes(participante.id)}
                                                        onChange={() => toggleSeleccionParticipante(participante.id)}
                                                        className="rounded border-gray-300 dark:border-gray-600"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {participante.nombreCompleto}
                                                    </div>
                                                    {participante.puesto && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {participante.puesto}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {participante.email}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {participante.departamento || 'No especificado'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: getColorPorLugar(participante.lugarAsignacion) }}
                                                        />
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {getNombreSesion(participante.lugarAsignacion)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`badge ${getEstadoColor(participante.estadoTecnico)}`}>
                                                        {participante.estadoTecnico || 'pendiente'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">event_available</span>
                                    <p>No hay participantes seleccionados.</p>
                                    <p className="text-sm">Selecciona un día en el calendario o muestra todos los del mes.</p>
                                </div>
                            )}
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
                                    <div
                                        className="rounded-full w-16 h-16 flex items-center justify-center text-white text-2xl font-bold"
                                        style={{ backgroundColor: getColorPorLugar(participanteSeleccionado.lugarAsignacion) }}
                                    >
                                        {participanteSeleccionado.nombreCompleto?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {participanteSeleccionado.nombreCompleto}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {participanteSeleccionado.puesto || 'Sin puesto asignado'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`badge ${getEstadoColor(participanteSeleccionado.estadoTecnico)}`}>
                                                {participanteSeleccionado.estadoTecnico || 'pendiente'}
                                            </span>
                                            {participanteSeleccionado.lugarAsignacion && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                    {getNombreSesion(participanteSeleccionado.lugarAsignacion)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Información detallada */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400">
                                            Correo Electrónico
                                        </label>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 break-all">
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

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                                {participanteSeleccionado.fechaIngreso
                                                    ? format(parse(participanteSeleccionado.fechaIngreso, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')
                                                    : 'No disponible'
                                                }
                                            </p>
                                        </div>
                                        {participanteSeleccionado.fechaOnboardingTecnico && (
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400">
                                                    Fecha Onboarding Técnico
                                                </label>
                                                <p className="text-sm text-gray-800 dark:text-gray-200">
                                                    {format(parse(participanteSeleccionado.fechaOnboardingTecnico, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Botón para enviar correo */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="primary"
                                        onClick={() => abrirModalSeleccionDestinatarios('prueba')}
                                        disabled={!participanteSeleccionado.email}
                                        className="w-full"
                                    >
                                        <span className="material-symbols-outlined">send</span>
                                        Enviar correo de prueba
                                    </Button>
                                    {!participanteSeleccionado.email && (
                                        <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                                            Este participante no tiene email registrado.
                                        </p>
                                    )}
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
                    <div className="flex gap-2">

                    </div>
                }
            >
                {/* Mensajes de éxito/error */}
                {mensajeExito && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-green-700 dark:text-green-300">{mensajeExito}</p>
                    </div>
                )}

                {mensajeError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-700 dark:text-red-400">{mensajeError}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                            Notificar Participantes de Sesión
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                            Envía notificaciones a todos los participantes de la sesión actual.
                        </p>
                        <Button
                            variant="primary"
                            onClick={notificarParticipantesSesion}
                            disabled={!sesionSeleccionada || enviandoCorreo}
                        >
                            {enviandoCorreo ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <span className="material-symbols-outlined">notifications</span>
                            )}
                            Notificar Sesión Actual
                        </Button>
                        {!sesionSeleccionada && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                Selecciona una sesión primero
                            </p>
                        )}
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                            Estadísticas de Envío
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{estadisticas.total}</p>
                                <p className="text-sm text-green-600 dark:text-green-500">Total</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{estadisticas.enviadas}</p>
                                <p className="text-sm text-green-600 dark:text-green-500">Enviadas</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{estadisticas.pendientes}</p>
                                <p className="text-sm text-yellow-600 dark:text-yellow-500">Pendientes</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{estadisticas.fallidas}</p>
                                <p className="text-sm text-red-600 dark:text-red-500">Fallidas</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* MODAL MEJORADO - SIN DOBLE SCROLL */}
            {mostrarModalCorreo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        {/* Encabezado */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {tipoCorreo === 'prueba' ? 'Enviar Correo de Prueba' : 'Notificar Participantes'}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                                        {tipoCorreo === 'prueba'
                                            ? 'Selecciona los participantes a quienes enviar el correo de prueba.'
                                            : 'Selecciona los participantes a quienes enviar notificaciones.'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setMostrarModalCorreo(false)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Contenido principal - SIN SCROLL HORIZONTAL */}
                        <div className="flex-1 overflow-hidden">
                            <div className="h-full overflow-y-auto px-6">
                                {participantesFiltrados.length > 0 ? (
                                    <div className="py-4">
                                        {/* Contadores y controles */}
                                        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {participantesSeleccionados.length} de {participantesFiltrados.length} seleccionados
                                            </span>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={seleccionarTodosFiltrados}
                                                    className="text-xs"
                                                >
                                                    Seleccionar todos
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={deseleccionarTodos}
                                                    className="text-xs"
                                                >
                                                    Deseleccionar
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Lista de participantes - DISEÑO MEJORADO */}
                                        <div className="space-y-2">
                                            {participantesFiltrados.map((participante) => (
                                                <div
                                                    key={participante.id}
                                                    className={`
                                                        flex items-center gap-3 p-3 rounded-lg transition-colors
                                                        ${participantesSeleccionados.includes(participante.id)
                                                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                                                            : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                        }
                                                    `}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={participantesSeleccionados.includes(participante.id)}
                                                        onChange={() => toggleSeleccionParticipante(participante.id)}
                                                        className="rounded border-gray-300 dark:border-gray-600 w-5 h-5"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                                {participante.nombreCompleto}
                                                            </p>
                                                            <span className={`badge ${getEstadoColor(participante.estadoTecnico)} text-xs ml-2`}>
                                                                {participante.estadoTecnico || 'pendiente'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                                                            {participante.email}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {participante.departamento || 'Sin departamento'}
                                                            </span>
                                                            {participante.lugarAsignacion && (
                                                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                                                    {getNombreSesion(participante.lugarAsignacion)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2">people</span>
                                        <p className="text-lg font-medium mb-2">No hay participantes disponibles</p>
                                        <p className="text-sm">Primero carga los participantes desde el calendario.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pie de página */}
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setMostrarModalCorreo(false);
                                        setMensajeError(null);
                                        setMensajeExito(null);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={tipoCorreo === 'prueba' ? enviarCorreoPruebaSeleccionados : notificarParticipantesSesion}
                                    disabled={participantesSeleccionados.length === 0 || enviandoCorreo}
                                    className="min-w-32"
                                >
                                    {enviandoCorreo ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Enviando...
                                        </>
                                    ) : tipoCorreo === 'prueba' ? (
                                        <>
                                            <span className="material-symbols-outlined mr-2">send</span>
                                            Enviar Correo{participantesSeleccionados.length > 1 ? 's' : ''}
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined mr-2">notifications</span>
                                            Enviar Notificaciones
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertasCorreo;