import React, { useState, useEffect, useMemo } from 'react';
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
    differenceInDays,
    addDays
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

    // Convertir sesiones en eventos para el calendario
    const events = useMemo(() => {
        return sesiones.map(sesion => {
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

    // Calcular los días del calendario
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Organizar eventos por día y fila
    const { eventsByDay, eventRows } = useMemo(() => {
        const eventsByDay: Record<string, CalendarEvent[]> = {};
        const eventRows: Record<string, number> = {};
        const dayRows: Record<string, number[]> = {};
        const eventStartDays: Record<string, number> = {};

        // Inicializar arrays para cada día
        days.forEach((day, dayIndex) => {
            const dateKey = day.toDateString();
            eventsByDay[dateKey] = [];
            dayRows[dateKey] = [];
        });

        // Procesar cada evento
        events.forEach(event => {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);

            // Asegurarse de que las fechas estén dentro del rango visible
            const startDate = eventStart < calendarStart ? calendarStart : eventStart;
            const endDate = eventEnd > calendarEnd ? calendarEnd : eventEnd;

            let current = new Date(startDate);
            while (current <= endDate) {
                const dateKey = current.toDateString();
                if (eventsByDay[dateKey]) {
                    eventsByDay[dateKey].push(event);
                }
                current.setDate(current.getDate() + 1);
            }
        });

        // Asignar filas para evitar superposiciones
        events.forEach(event => {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            const startDate = eventStart < calendarStart ? calendarStart : eventStart;
            const endDate = eventEnd > calendarEnd ? calendarEnd : eventEnd;

            let foundRow = false;
            let rowIndex = 0;

            while (!foundRow) {
                let conflict = false;
                let current = new Date(startDate);

                // Verificar si hay conflicto en esta fila
                while (current <= endDate && !conflict) {
                    const dateKey = current.toDateString();
                    if (dayRows[dateKey]?.includes(rowIndex)) {
                        conflict = true;
                    }
                    current.setDate(current.getDate() + 1);
                }

                if (!conflict) {
                    foundRow = true;
                    // Asignar la fila a todos los días del evento
                    let current = new Date(startDate);
                    while (current <= endDate) {
                        const dateKey = current.toDateString();
                        if (!dayRows[dateKey]) dayRows[dateKey] = [];
                        dayRows[dateKey].push(rowIndex);
                        eventRows[`${event.id}-${dateKey}`] = rowIndex;
                        current.setDate(current.getDate() + 1);
                    }
                } else {
                    rowIndex++;
                }
            }
        });

        return { eventsByDay, eventRows };
    }, [events, days, calendarStart, calendarEnd]);

    // Determinar posición del evento en un día específico - VERSIÓN CORREGIDA
    const getEventPosition = (event: CalendarEvent, date: Date): 'start' | 'middle' | 'end' | 'single' | 'none' => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);

        // Normalizar fechas (solo fecha, sin hora)
        const normalizedStart = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
        const normalizedEnd = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // Verificar si la fecha está dentro del intervalo
        if (normalizedDate < normalizedStart || normalizedDate > normalizedEnd) {
            return 'none';
        }

        const isStart = isSameDay(normalizedDate, normalizedStart);
        const isEnd = isSameDay(normalizedDate, normalizedEnd);

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

    // Calcular el margen superior para cada fila de eventos
    const getEventTopPosition = (rowIndex: number): number => {
        return 28 + (rowIndex * 24); // 28px para el número del día + n*24px para cada fila
    };

    // Renderizar barras de eventos continuas - VERSIÓN CORREGIDA
    const renderEventBar = (event: CalendarEvent, day: Date, dayIndex: number) => {
        const position = getEventPosition(event, day);
        if (position === 'none') return null;

        const rowIndex = eventRows[`${event.id}-${day.toDateString()}`] || 0;
        const topPosition = getEventTopPosition(rowIndex);
        const estadoStyles = getEstadoStyles(event.estado);
        const isStart = position === 'start' || position === 'single';
        const isEnd = position === 'end' || position === 'single';
        const isMiddle = position === 'middle';

        // Solo renderizar la barra completa en el primer día o en días únicos
        if (isStart) {
            // Calcular cuántos días abarca el evento visible en el calendario
            let visibleDuration = 1;
            let currentIndex = dayIndex;
            let currentDate = new Date(day);

            // Buscar hasta dónde llega el evento en el calendario visible
            while (currentIndex < days.length - 1) {
                const nextDate = days[currentIndex + 1];
                const nextPosition = getEventPosition(event, nextDate);

                if (nextPosition === 'none' || nextDate > event.endDate || nextDate > calendarEnd) {
                    break;
                }

                visibleDuration++;
                currentIndex++;
                currentDate = nextDate;
            }

            // Asegurar que la duración sea al menos 1
            const displayDuration = Math.max(1, visibleDuration);

            // Calcular ancho basado en la duración visible
            const widthPercentage = displayDuration * 100;

            return (
                <div
                    key={`${event.id}-bar-${dayIndex}`}
                    className={clsx(
                        'absolute h-5 cursor-pointer transition-all hover:opacity-90',
                        'truncate shadow-sm',
                        estadoStyles.bg,
                        estadoStyles.border,
                        isStart && !isEnd && 'rounded-l-lg',
                        isEnd && !isStart && 'rounded-r-lg',
                        isStart && isEnd && 'rounded-lg', // single day
                        !isStart && !isEnd && 'rounded-none' // middle days (no debería ocurrir aquí)
                    )}
                    style={{
                        top: `${topPosition}px`,
                        left: '2px',
                        width: `calc(${widthPercentage}% - 4px)`,
                        zIndex: 10 + rowIndex,
                        borderLeft: `4px solid ${event.color}`,
                        borderRight: isEnd ? `2px solid ${event.color}` : 'none',
                        backgroundColor: `${event.color}20`,
                        borderColor: event.color,
                    }}
                    onClick={(e) => handleEventClick(event, e)}
                    title={`${event.title}\n📅 ${format(event.startDate, 'dd/MM/yyyy')} - ${format(event.endDate, 'dd/MM/yyyy')} (${event.duracion} día${event.duracion !== 1 ? 's' : ''})\n🎯 ${event.tipo}\n📊 ${event.estado.toUpperCase()}`}
                >
                    <div className="flex items-center h-full px-2">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                            </div>
                            <span className="text-xs font-medium truncate ml-1" style={{ color: event.color }}>
                                {event.title}
                            </span>
                        </div>
                        {isEnd && (
                            <div className="flex-shrink-0 ml-1">
                                <span className="material-symbols-outlined text-xs">
                                    {event.estado === 'programada' ? 'schedule' :
                                        event.estado === 'en_curso' ? 'play_circle' :
                                            event.estado === 'completada' ? 'check_circle' :
                                                'cancel'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Para días intermedios y finales que no son el inicio,
        if (isMiddle || isEnd) {
            // Verificar si ya hay una barra de inicio en este día
            const hasStartBar = eventsByDay[day.toDateString()]?.some(e =>
                e.id === event.id && (getEventPosition(e, day) === 'start' || getEventPosition(e, day) === 'single')
            );

            if (!hasStartBar) {
                return (
                    <div
                        key={`${event.id}-bg-${dayIndex}`}
                        className={clsx(
                            'absolute cursor-pointer',
                            position === 'end' ? 'border-r' : ''
                        )}
                        style={{
                            top: `${topPosition}px`,
                            left: '0',
                            right: '0',
                            height: '20px',
                            zIndex: 9 + rowIndex,
                            backgroundColor: `${event.color}15`,
                            borderTop: `1px solid ${event.color}30`,
                            borderBottom: `1px solid ${event.color}30`,
                            borderLeft: 'none',
                            borderRight: position === 'end' ? `2px solid ${event.color}` : 'none',
                            borderRadius: position === 'end' ? '0 4px 4px 0' : '0',
                        }}
                        onClick={(e) => handleEventClick(event, e)}
                        title={`${event.title} (Continuación)`}
                    />
                );
            }
        }

        return null;
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
            <div className="grid grid-cols-7 gap-px mb-2 bg-gray-200 dark:bg-gray-800 rounded-t-lg">
                {dayNames.map((day, index) => (
                    <div
                        key={index}
                        className="text-center py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 rounded-b-lg overflow-hidden">
                {days.map((day, dayIndex) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isCurrentDay = isToday(day);
                    const dayEvents = eventsByDay[day.toDateString()] || [];

                    return (
                        <div
                            key={dayIndex}
                            className={clsx(
                                'min-h-[140px] bg-white dark:bg-gray-900 relative transition-colors',
                                !isCurrentMonth && 'bg-gray-50 dark:bg-gray-900/30',
                                isCurrentDay && 'bg-blue-50 dark:bg-blue-900/20',
                                'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer',
                                'border-r border-b border-gray-200 dark:border-gray-800 last:border-r-0'
                            )}
                            onClick={() => handleDayClick(day, dayEvents)}
                        >
                            {/* Número del día */}
                            <div className="flex items-center justify-between p-2">
                                <span
                                    className={clsx(
                                        'text-sm font-medium transition-colors',
                                        isCurrentDay
                                            ? 'flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white'
                                            : !isCurrentMonth
                                                ? 'text-gray-400 dark:text-gray-600'
                                                : 'text-gray-700 dark:text-gray-300'
                                    )}
                                >
                                    {format(day, 'd')}
                                </span>

                                {dayEvents.length > 0 && (
                                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                                        {dayEvents.length}
                                    </span>
                                )}
                            </div>

                            {/* Eventos para este día */}
                            <div className="relative px-2">
                                {dayEvents.map((event) =>
                                    renderEventBar(event, day, dayIndex)
                                )}

                                {/* Mostrar mini indicadores para días con muchos eventos */}
                                {dayEvents.length > 2 && (
                                    <div className="absolute bottom-1 right-1 flex gap-1">
                                        {[...new Set(dayEvents.slice(2, 5).map(e => e.color))].map((color, idx) => (
                                            <div
                                                key={idx}
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
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