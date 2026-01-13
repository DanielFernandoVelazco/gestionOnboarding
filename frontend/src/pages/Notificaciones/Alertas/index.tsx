import { useState, useEffect } from 'react';
import { format, parse, getDay, getMonth, getYear, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
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

    // NUEVO ESTADO PARA DETALLES DEL DÍA
    const [detalleDia, setDetalleDia] = useState<{
        dia: number;
        sesiones: any[];
        eventos: any[];
    } | null>(null);

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
        // Limpiamos los estados relacionados con participantes al cambiar de mes
        setParticipantes([]);
        setParticipanteSeleccionado(null);
        setDiaSeleccionado(null);
        setDetalleDia(null);

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
        const eventosDelDia: any[] = [];

        // Buscar sesiones y eventos del día
        calendario.semanas.forEach(semana => {
            semana.forEach(diaCalendario => {
                if (diaCalendario.esMesActual && diaCalendario.fecha.getDate() === dia) {
                    sesionesDelDia.push(...diaCalendario.sesiones);
                    eventosDelDia.push(...diaCalendario.eventos);
                }
            });
        });

        // Guardar detalles del día para mostrar
        setDetalleDia({
            dia,
            sesiones: sesionesDelDia,
            eventos: eventosDelDia
        });

        if (sesionesDelDia.length > 0) {
            setDiaSeleccionado(dia);

            // Si solo hay una sesión, cargar participantes automáticamente
            if (sesionesDelDia.length === 1) {
                cargarParticipantesPorSesion(sesionesDelDia[0].id);
            } else if (sesionesDelDia.length > 1) {
                // Mostrar modal para seleccionar sesión
                mostrarModalSeleccionSesion(sesionesDelDia, dia);
            }
        } else {
            // Si no hay sesiones, mostrar solo eventos del día
            setDiaSeleccionado(dia);
            setParticipantes([]);
            setParticipanteSeleccionado(null);
        }
    };

    // NUEVA FUNCIÓN: Mostrar modal para seleccionar sesión
    const mostrarModalSeleccionSesion = (sesiones: any[], dia: number) => {
        const opciones = sesiones.map((s, i) => `${i + 1}. ${s.titulo} (${getSessionTypeAndColor(s).type})`).join('\n');
        const seleccion = window.prompt(
            `Hay ${sesiones.length} sesiones el día ${dia}.\n\nSelecciona una:\n\n${opciones}`
        );

        if (seleccion) {
            const indice = parseInt(seleccion) - 1;
            if (indice >= 0 && indice < sesiones.length) {
                cargarParticipantesPorSesion(sesiones[indice].id);
            }
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
        setDetalleDia(null);

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

    // NUEVA FUNCIÓN: Seleccionar/deseleccionar participante para correo
    const toggleSeleccionParticipante = (participanteId: string) => {
        setParticipantesSeleccionados(prev => {
            if (prev.includes(participanteId)) {
                return prev.filter(id => id !== participanteId);
            } else {
                return [...prev, participanteId];
            }
        });
    };

    // NUEVA FUNCIÓN: Seleccionar todos los participantes filtrados
    const seleccionarTodosFiltrados = () => {
        const idsFiltrados = participantesFiltrados.map(p => p.id);
        setParticipantesSeleccionados(idsFiltrados);
    };

    // NUEVA FUNCIÓN: Deseleccionar todos
    const deseleccionarTodos = () => {
        setParticipantesSeleccionados([]);
    };

    // NUEVA FUNCIÓN: Enviar correo de prueba a participantes seleccionados
    const enviarCorreoPruebaSeleccionados = async () => {
        if (participantesSeleccionados.length === 0) {
            setMensajeError('Por favor, selecciona al menos un participante.');
            return;
        }

        setEnviandoCorreo(true);
        setMensajeError(null);
        setMensajeExito(null);

        try {
            // Obtener emails de los participantes seleccionados
            const participantesParaEnviar = participantes.filter(p =>
                participantesSeleccionados.includes(p.id)
            );

            const emails = participantesParaEnviar.map(p => p.email).filter(Boolean);

            if (emails.length === 0) {
                setMensajeError('No se encontraron emails válidos para los participantes seleccionados.');
                return;
            }

            // Enviar correo de prueba a cada participante
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

            // Limpiar selección después del envío exitoso
            if (exitosos > 0) {
                setParticipantesSeleccionados([]);
                setMostrarModalCorreo(false);
                // Recargar notificaciones para actualizar estadísticas
                cargarNotificaciones();
            }

        } catch (error: any) {
            setMensajeError(`Error al enviar correos: ${error.message || 'Error desconocido'}`);
            console.error('Error al enviar correos de prueba:', error);
        } finally {
            setEnviandoCorreo(false);
        }
    };

    // NUEVA FUNCIÓN: Notificar a todos los participantes de la sesión
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

            // Recargar notificaciones para actualizar estadísticas
            cargarNotificaciones();
            setMostrarModalCorreo(false);

        } catch (err: any) {
            setMensajeError(`Error al notificar participantes: ${err.message || 'Error desconocido'}`);
            console.error('Error al notificar participantes:', err);
        } finally {
            setEnviandoCorreo(false);
        }
    };

    // NUEVA FUNCIÓN: Verificar email del participante seleccionado
    const enviarCorreoParticipanteSeleccionado = async () => {
        if (!participanteSeleccionado || !participanteSeleccionado.email) {
            setMensajeError('Por favor, selecciona un participante con email válido.');
            return;
        }

        setEnviandoCorreo(true);
        setMensajeError(null);
        setMensajeExito(null);

        try {
            await notificacionesService.enviarCorreoPrueba(participanteSeleccionado.email);
            setMensajeExito(`Correo de prueba enviado exitosamente a ${participanteSeleccionado.email}`);

            // Recargar notificaciones para actualizar estadísticas
            cargarNotificaciones();

        } catch (err: any) {
            setMensajeError(`Error al enviar correo: ${err.message || 'Error desconocido'}`);
            console.error('Error al enviar correo de prueba:', err);
        } finally {
            setEnviandoCorreo(false);
        }
    };

    // NUEVA FUNCIÓN: Abrir modal para seleccionar destinatarios
    const abrirModalSeleccionDestinatarios = (tipo: 'prueba' | 'notificacion') => {
        setTipoCorreo(tipo);
        setMostrarModalCorreo(true);
        setMensajeError(null);
        setMensajeExito(null);

        // Si es para un solo participante seleccionado, pre-seleccionarlo
        if (tipo === 'prueba' && participanteSeleccionado) {
            setParticipantesSeleccionados([participanteSeleccionado.id]);
        } else {
            setParticipantesSeleccionados([]);
        }
    };

    // FUNCIONES PARA CALENDARIO
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

    // NUEVA FUNCIÓN: Renderizar calendario completo
    const renderCalendarioCompleto = () => {
        if (!calendario) return null;

        const hoy = new Date();
        const esMesActual = hoy.getMonth() + 1 === mesActual && hoy.getFullYear() === añoActual;

        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
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
                                                            {dia.sesiones.length} sesión{dia.sesiones.length !== 1 ? 'es' : ''}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Sesiones y Eventos */}
                                                <div className="flex-1 overflow-y-auto max-h-32 space-y-1">
                                                    {/* Sesiones */}
                                                    {dia.sesiones.map((sesion, idx) => {
                                                        const { type, color } = getSessionTypeAndColor(sesion);
                                                        return (
                                                            <div
                                                                key={`sesion-${idx}`}
                                                                className="text-xs p-1 rounded cursor-pointer hover:opacity-90"
                                                                style={{ backgroundColor: `${color}20`, borderLeft: `3px solid ${color}` }}
                                                                title={`${sesion.titulo}\n${type}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDiaClick(dia.fecha.getDate());
                                                                }}
                                                            >
                                                                <div className="font-medium truncate">{sesion.titulo}</div>
                                                                <div className="flex justify-between">
                                                                    <span className="truncate">{type}</span>
                                                                    {sesion.hora && (
                                                                        <span className="text-xs opacity-75">{sesion.hora}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Eventos */}
                                                    {dia.eventos.map((evento, idx) => {
                                                        const { type, color } = getEventTypeAndColor(evento);
                                                        return (
                                                            <div
                                                                key={`evento-${idx}`}
                                                                className="text-xs p-1 rounded cursor-pointer hover:opacity-90"
                                                                style={{
                                                                    backgroundColor: `${color}15`,
                                                                    borderLeft: `3px solid ${color}`,
                                                                    borderStyle: 'dashed'
                                                                }}
                                                                title={`${evento.titulo}\n${type}`}
                                                            >
                                                                <div className="font-medium truncate">{evento.titulo}</div>
                                                                <div className="flex justify-between">
                                                                    <span className="truncate">{type}</span>
                                                                    {evento.hora && (
                                                                        <span className="text-xs opacity-75">{evento.hora}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Indicador de click */}
                                                {(dia.sesiones.length > 0 || dia.eventos.length > 0) && (
                                                    <div className="text-center mt-1">
                                                        <button
                                                            onClick={() => handleDiaClick(dia.fecha.getDate())}
                                                            className="text-xs text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
                                                        >
                                                            Ver detalles →
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
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

            {/* Calendario de Sesiones - MEJORADO */}
            <Card
                title="Calendario de Sesiones y Eventos"
                subtitle={`${meses[mesActual - 1]} ${añoActual} - Haz clic en un día para ver detalles`}
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

                {/* Calendario */}
                {renderCalendarioCompleto()}

                {/* Detalles del día seleccionado */}
                {detalleDia && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                            Detalles del {detalleDia.dia} de {meses[mesActual - 1]}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Sesiones */}
                            <div>
                                <h5 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
                                    Sesiones ({detalleDia.sesiones.length})
                                </h5>
                                {detalleDia.sesiones.length > 0 ? (
                                    <div className="space-y-2">
                                        {detalleDia.sesiones.map((sesion, idx) => {
                                            const { type, color } = getSessionTypeAndColor(sesion);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
                                                    onClick={() => cargarParticipantesPorSesion(sesion.id)}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">
                                                                {sesion.titulo}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: color }}
                                                                />
                                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="sm">
                                                            Ver participantes
                                                        </Button>
                                                    </div>
                                                    {sesion.descripcion && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                            {sesion.descripcion}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 italic">
                                        No hay sesiones programadas para este día.
                                    </p>
                                )}
                            </div>

                            {/* Eventos */}
                            <div>
                                <h5 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
                                    Eventos ({detalleDia.eventos.length})
                                </h5>
                                {detalleDia.eventos.length > 0 ? (
                                    <div className="space-y-2">
                                        {detalleDia.eventos.map((evento, idx) => {
                                            const { type, color } = getEventTypeAndColor(evento);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                                    style={{ borderLeft: `4px solid ${color}` }}
                                                >
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {evento.titulo}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {type}
                                                        </span>
                                                        {evento.hora && (
                                                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                                                                {evento.hora}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 italic">
                                        No hay eventos programados para este día.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Leyenda */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Leyenda</h5>
                    <div className="flex flex-wrap gap-4">
                        {tiposEnCalendario.map((tipo: any, index) => {
                            let color = '#9E9E9E';
                            if (tipo === 'Capítulo Frontend') color = '#00448D';
                            else if (tipo === 'Capítulo Backend') color = '#FF6B35';
                            else if (tipo === 'Capítulo Data') color = '#FFD100';
                            else if (tipo === 'Journey to Cloud') color = '#E31937';
                            else if (tipo === 'Bienvenida') color = '#4CAF50';

                            return (
                                <div key={index} className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{tipo}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Participantes y Detalles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Lista de Participantes - MODIFICADO CON CHECKBOXES */}
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
                            <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {participantesSeleccionados.length} seleccionados
                                    </span>
                                    {participantesSeleccionados.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => abrirModalSeleccionDestinatarios('prueba')}
                                        >
                                            <span className="material-symbols-outlined text-sm">send</span>
                                            Enviar correo a seleccionados
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
                                        <span className="material-symbols-outlined text-sm">check_box</span>
                                        Seleccionar todos
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={deseleccionarTodos}
                                        disabled={participantesSeleccionados.length === 0}
                                    >
                                        <span className="material-symbols-outlined text-sm">check_box_outline_blank</span>
                                        Deseleccionar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Tabla de Participantes MODIFICADA */}
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

                                {/* Sesión Asignada */}
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                        Sesión Asignada
                                    </label>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                        {participanteSeleccionado.lugarAsignacion || 'No asignada'}
                                    </p>
                                </div>

                                {/* Progreso del Onboarding */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs text-gray-500 dark:text-gray-400">
                                            Progreso del Onboarding
                                        </label>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {participanteSeleccionado.estadoTecnico === 'completado' ? '100%' :
                                                participanteSeleccionado.estadoTecnico === 'en_progreso' ? '50%' : '0%'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                        <div
                                            className="bg-yellow-500 h-2.5 rounded-full"
                                            style={{
                                                width: participanteSeleccionado.estadoTecnico === 'completado' ? '100%' :
                                                    participanteSeleccionado.estadoTecnico === 'en_progreso' ? '50%' : '0%'
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">
                                        {participanteSeleccionado.estadoTecnico === 'completado' ? 'Completado' :
                                            participanteSeleccionado.estadoTecnico === 'en_progreso' ? 'En progreso' : 'Pendiente'}
                                    </p>
                                </div>

                                {/* Botón para enviar correo al participante seleccionado */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="primary"
                                        onClick={() => abrirModalSeleccionDestinatarios('prueba')}
                                        disabled={!participanteSeleccionado.email}
                                        fullWidth
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

            {/* Probar Notificaciones - MODIFICADO */}
            <Card
                title="Probar Notificaciones"
                subtitle="Verifica la entrega de alertas por correo."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => abrirModalSeleccionDestinatarios('prueba')}>
                            <span className="material-symbols-outlined">send</span>
                            Enviar Correo de Prueba
                        </Button>
                        <Button variant="outline" onClick={() => abrirModalSeleccionDestinatarios('notificacion')}>
                            <span className="material-symbols-outlined">notifications</span>
                            Notificar Participantes
                        </Button>
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
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{estadisticas.total}</p>
                                <p className="text-sm text-green-600 dark:text-green-500">Total Notificaciones</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{estadisticas.enviadas}</p>
                                <p className="text-sm text-green-600 dark:text-green-500">Enviadas</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{estadisticas.pendientes}</p>
                                <p className="text-sm text-yellow-600 dark:text-yellow-500">Pendientes</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{estadisticas.fallidas}</p>
                                <p className="text-sm text-red-600 dark:text-red-500">Fallidas</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* MODAL PARA SELECCIONAR DESTINATARIOS */}
            {mostrarModalCorreo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {tipoCorreo === 'prueba' ? 'Enviar Correo de Prueba' : 'Notificar Participantes'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                {tipoCorreo === 'prueba'
                                    ? 'Selecciona los participantes a quienes enviar el correo de prueba.'
                                    : 'Selecciona los participantes a quienes enviar notificaciones.'}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {participantesFiltrados.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            {participantesSeleccionados.length} de {participantesFiltrados.length} seleccionados
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={seleccionarTodosFiltrados}
                                            >
                                                Seleccionar todos
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={deseleccionarTodos}
                                            >
                                                Deseleccionar
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {participantesFiltrados.map((participante) => (
                                            <div
                                                key={participante.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border ${participantesSeleccionados.includes(participante.id)
                                                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={participantesSeleccionados.includes(participante.id)}
                                                    onChange={() => toggleSeleccionParticipante(participante.id)}
                                                    className="rounded border-gray-300 dark:border-gray-600"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                                        {participante.nombreCompleto}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {participante.email}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                            {participante.departamento || 'Sin departamento'}
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(participante.estadoTecnico)}`}>
                                                            {participante.estadoTecnico || 'pendiente'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">people</span>
                                    <p>No hay participantes disponibles.</p>
                                    <p className="text-sm mt-2">Primero carga los participantes desde el calendario.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
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