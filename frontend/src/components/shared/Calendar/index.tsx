import React, { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    startOfWeek,
    endOfWeek,
    isSameDay,
    differenceInDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import { OnboardingSesion } from 'src/services/onboarding.service';
import { clsx } from 'clsx';

interface CalendarProps {
    onEventClick?: (evento: any) => void;
    onSesionClick?: (sesion: OnboardingSesion) => void;
    onDayClick?: (date: Date) => void;
    sesiones: OnboardingSesion[];
    initialDate?: Date;
}

interface CalendarEvent {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    color: string;
    sesion: OnboardingSesion;
    tipo: string;
    estado: string;
    duracion: number;
}

const Calendar: React.FC<CalendarProps> = ({
    onEventClick,
    onSesionClick,
    onDayClick,
    sesiones = [],
    initialDate = new Date(),
}) => {
    const [currentDate, setCurrentDate] = useState<Date>(initialDate);
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    // Convertir sesiones en eventos para el calendario
    useEffect(() => {
        const calendarEvents: CalendarEvent[] = sesiones.map(sesion => {
            const startDate = new Date(sesion.fechaInicio);
            const endDate = new Date(sesion.fechaFin);
            const duracion = differenceInDays(endDate, startDate) + 1;

            return {
                id: sesion.id,
                title: sesion.titulo,
                startDate,
                endDate,
                color: sesion.tipo?.color || '#00448D',
                sesion,
                tipo: sesion.tipo?.nombre || 'Sesión',
                estado: sesion.estado || 'programada',
                duracion,
            };
        });
        setEvents(calendarEvents);
    }, [sesiones]);

    // Navegación
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Obtener días del mes actual
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Agrupar eventos por día para mostrar
    const groupEventsByDay = () => {
        const grouped: Record<string, CalendarEvent[]> = {};

        events.forEach(event => {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            const current = new Date(eventStart);

            while (current <= eventEnd) {
                const dateKey = current.toDateString();
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                // Solo agregar el evento una vez por día
                if (current.getTime() === eventStart.getTime() ||
                    !grouped[dateKey].some(e => e.id === event.id)) {
                    grouped[dateKey].push(event);
                }
                current.setDate(current.getDate() + 1);
            }
        });

        return grouped;
    };

    const eventsByDay = groupEventsByDay();

    // Determinar posición del evento en el rango de fechas
    const getEventPosition = (event: CalendarEvent, date: Date): 'start' | 'middle' | 'end' | 'single' => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);

        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(23, 59, 59, 999);
        date.setHours(0, 0, 0, 0);

        const isStart = isSameDay(date, eventStart);
        const isEnd = isSameDay(date, eventEnd);

        if (isStart && isEnd) return 'single';
        if (isStart) return 'start';
        if (isEnd) return 'end';
        return 'middle';
    };

    // Obtener estilos para el estado
    const getEstadoStyles = (estado: string) => {
        switch (estado) {
            case 'programada':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    text: 'text-blue-700 dark:text-blue-300',
                    border: 'border-blue-200 dark:border-blue-800',
                };
            case 'en_curso':
                return {
                    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                    text: 'text-yellow-700 dark:text-yellow-300',
                    border: 'border-yellow-200 dark:border-yellow-800',
                };
            case 'completada':
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    text: 'text-green-700 dark:text-green-300',
                    border: 'border-green-200 dark:border-green-800',
                };
            case 'cancelada':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    text: 'text-red-700 dark:text-red-300',
                    border: 'border-red-200 dark:border-red-800',
                };
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-gray-900/20',
                    text: 'text-gray-700 dark:text-gray-300',
                    border: 'border-gray-200 dark:border-gray-800',
                };
        }
    };

    const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEventClick) {
            onEventClick(event);
        }
        if (onSesionClick) {
            onSesionClick(event.sesion);
        }
    };

    const handleDayClick = (date: Date, eventsForDay: CalendarEvent[]) => {
        if (onDayClick) {
            onDayClick(date);
        }

        if (eventsForDay.length > 0 && onSesionClick && !onEventClick) {
            onSesionClick(eventsForDay[0].sesion);
        }
    };

    // Nombres de los días
    const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return (
        <div className="w-full">
            {/* Encabezado del calendario */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Mes anterior"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>

                    <button
                        onClick={goToNextMonth}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Mes siguiente"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {events.length} sesiones
                    </span>
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm font-medium transition-colors"
                    >
                        Hoy
                    </button>
                </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-px mb-2">
                {dayNames.map((day, index) => (
                    <div
                        key={index}
                        className="text-center py-2 text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                {days.map((day, index) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isCurrentDay = isToday(day);
                    const dayEvents = eventsByDay[day.toDateString()] || [];

                    return (
                        <div
                            key={index}
                            className={clsx(
                                'min-h-[120px] bg-white dark:bg-gray-900/50 p-2 relative transition-colors',
                                !isCurrentMonth && 'bg-gray-50 dark:bg-gray-900/30',
                                isCurrentDay && 'bg-blue-50 dark:bg-blue-900/20',
                                'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                            )}
                            onClick={() => handleDayClick(day, dayEvents)}
                        >
                            {/* Número del día */}
                            <div className="flex items-center justify-between mb-1">
                                <span
                                    className={clsx(
                                        'text-sm font-medium transition-colors',
                                        isCurrentDay
                                            ? 'flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white'
                                            : !isCurrentMonth
                                                ? 'text-gray-400 dark:text-gray-600'
                                                : 'text-gray-700 dark:text-gray-300'
                                    )}
                                >
                                    {format(day, 'd')}
                                </span>

                                {dayEvents.length > 0 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {dayEvents.length}
                                    </span>
                                )}
                            </div>

                            {/* Eventos para este día */}
                            <div className="space-y-1 max-h-[80px] overflow-y-auto scrollbar-thin">
                                {dayEvents.slice(0, 3).map((event) => {
                                    const position = getEventPosition(event, day);
                                    const isStart = position === 'start' || position === 'single';
                                    const isEnd = position === 'end' || position === 'single';
                                    const isMiddle = position === 'middle';
                                    const estadoStyles = getEstadoStyles(event.estado);

                                    return (
                                        <div
                                            key={`${event.id}-${day.getDate()}`}
                                            className={clsx(
                                                'text-xs px-2 py-1 cursor-pointer transition-all hover:scale-[1.02]',
                                                'truncate border',
                                                position === 'single' && 'rounded-lg',
                                                position === 'start' && 'rounded-l-lg rounded-r',
                                                position === 'end' && 'rounded-r-lg rounded-l',
                                                position === 'middle' && 'rounded-none',
                                                estadoStyles.bg,
                                                estadoStyles.text,
                                                estadoStyles.border
                                            )}
                                            style={{
                                                borderLeft: isStart ? `3px solid ${event.color}` : 'none',
                                                borderRight: isEnd ? `3px solid ${event.color}` : 'none',
                                                marginLeft: isStart ? '0' : '-1px',
                                                marginRight: isEnd ? '0' : '-1px',
                                            }}
                                            onClick={(e) => handleEventClick(event, e)}
                                            title={`${event.title}\n📅 ${format(event.startDate, 'dd/MM/yyyy')} - ${format(event.endDate, 'dd/MM/yyyy')} (${event.duracion} día${event.duracion !== 1 ? 's' : ''})\n🎯 ${event.tipo}\n📊 ${event.estado.toUpperCase()}`}
                                        >
                                            {isStart && (
                                                <div className="flex items-center gap-1">
                                                    <div
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: event.color }}
                                                    />
                                                    <span className="font-medium truncate">{event.title}</span>
                                                </div>
                                            )}

                                            {isMiddle && !isStart && !isEnd && (
                                                <div className="flex items-center">
                                                    <div
                                                        className="h-full w-full opacity-50"
                                                        style={{ backgroundColor: event.color }}
                                                    />
                                                </div>
                                            )}

                                            {isEnd && !isStart && (
                                                <div className="flex items-center justify-end">
                                                    <span className="truncate text-right">{event.title}</span>
                                                    <div
                                                        className="w-2 h-2 rounded-full ml-1 flex-shrink-0"
                                                        style={{ backgroundColor: event.color }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {dayEvents.length > 3 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                                        +{dayEvents.length - 3} más...
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Leyenda de colores y estados */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipos de Sesiones
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {Array.from(new Set(events.map(e => e.tipo))).map((tipo, index) => {
                                const event = events.find(e => e.tipo === tipo);
                                return event ? (
                                    <div key={index} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: event.color }}
                                        />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{tipo}</span>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Estados
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {['programada', 'en_curso', 'completada', 'cancelada'].map((estado) => {
                                const styles = getEstadoStyles(estado);
                                return (
                                    <div key={estado} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${styles.bg} ${styles.border}`} />
                                        <span className={`text-xs ${styles.text}`}>
                                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;