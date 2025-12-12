import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import {
    format,
    addDays,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    differenceInCalendarDays,
    isWithinInterval,
    parseISO,
    addMonths,
    subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import { OnboardingSesion } from 'src/services/onboarding.service';

interface CalendarProps {
    onEventClick?: (evento: any) => void;
    onSesionClick?: (sesion: OnboardingSesion) => void;
    onDayClick?: (date: Date) => void;
    sesiones: OnboardingSesion[];
    initialDate?: Date;
}

// --- UTILIDAD CRÍTICA PARA CORREGIR EL ERROR DE ZONA HORARIA ---
const parseBackendDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes('T')) {
        return parseISO(dateStr);
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const Calendar: React.FC<CalendarProps> = ({
    onEventClick,
    onSesionClick,
    onDayClick,
    sesiones = [],
    initialDate = new Date(),
}) => {
    const [currentDate, setCurrentDate] = useState<Date>(initialDate);

    // Convertir sesiones en eventos para el calendario usando date-fns
    const events = useMemo(() => {
        return sesiones.map(sesion => {
            const startDate = parseBackendDate(sesion.fechaInicio);
            const endDate = parseBackendDate(sesion.fechaFin);
            const duracion = differenceInCalendarDays(endDate, startDate) + 1;

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
    const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
    const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Cálculos del grid del calendario
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
    });

    // --- LÓGICA CLAVE PARA APILAR EVENTOS (SOLUCIÓN AL PROBLEMA #3) ---
    const { eventRows } = useMemo(() => {
        const eventRows: Record<string, number> = {};
        const dayRows: Record<string, number[]> = {};

        // Inicializar arrays de filas para cada día visible
        days.forEach((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            dayRows[dateKey] = [];
        });

        // Asignar una fila a cada evento para evitar superposiciones
        events.forEach(event => {
            const effectiveStart = event.startDate < calendarStart ? calendarStart : event.startDate;
            const effectiveEnd = event.endDate > calendarEnd ? calendarEnd : event.endDate;

            if (effectiveStart > effectiveEnd) return;

            let rowIndex = 0;
            let foundRow = false;

            while (!foundRow) {
                let conflict = false;
                const rangeDays = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });

                // Verificar si esta fila ya está ocupada en alguno de los días del evento
                for (const day of rangeDays) {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    if (dayRows[dateKey]?.includes(rowIndex)) {
                        conflict = true;
                        break;
                    }
                }

                if (!conflict) {
                    foundRow = true;
                    // Reservar esta fila para todos los días del evento
                    rangeDays.forEach(day => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        dayRows[dateKey].push(rowIndex);
                        eventRows[`${event.id}-${dateKey}`] = rowIndex;
                    });
                } else {
                    rowIndex++;
                }
            }
        });

        return { eventRows };
    }, [events, days, calendarStart, calendarEnd]);
    // --- FIN DE LA LÓGICA DE APILAMIENTO ---

    // Determinar la posición visual del evento para un día dado
    const getEventPositionForDay = (event: any, day: Date): 'start' | 'middle' | 'end' | 'single' => {
        if (!isWithinInterval(day, { start: event.startDate, end: event.endDate })) {
            return 'middle'; // No debería pasar, pero es un fallback
        }

        const isStart = isSameDay(day, event.startDate);
        const isEnd = isSameDay(day, event.endDate);

        if (isStart && isEnd) return 'single';
        if (isStart) return 'start';
        if (isEnd) return 'end';
        return 'middle';
    };

    // Renderizar un solo evento para un día específico
    const renderEventForDay = (event: any, day: Date) => {
        const position = getEventPositionForDay(event, day);
        const dateKey = format(day, 'yyyy-MM-dd');
        const rowIndex = eventRows[`${event.id}-${dateKey}`] || 0; // <-- OBTENER LA FILA

        // Determinar el ancho de la barra solo para el día de inicio
        let widthPercentage = 100;
        if (position === 'start' || position === 'single') {
            let visibleDuration = 1;
            let currentDay = new Date(day);
            while (isSameMonth(currentDay, currentDate) && currentDay <= event.endDate) {
                visibleDuration++;
                currentDay = addDays(currentDay, 1);
            }
            widthPercentage = visibleDuration * 100;
        }

        return (
            <div
                key={`${event.id}-${dateKey}`}
                // ... dentro de renderEventForDay
                className={clsx(
                    'absolute h-5 cursor-pointer transition-all hover:opacity-90 truncate shadow-sm',
                    // Aplicamos estilos de borde según la posición
                    position === 'start' && !position.includes('end') && 'rounded-l-lg',
                    position === 'end' && !position.includes('start') && 'rounded-r-lg',
                    position === 'single' && 'rounded-lg',
                    // Color de fondo
                    'bg-opacity-20',
                    // <-- CAMBIO CLAVE: La barra vertical solo aparece al inicio o en eventos de un solo día
                    (position === 'start' || position === 'single') && 'border-l-4',
                )}
                style={{
                    top: `${28 + rowIndex * 24}px`, // <-- USAR LA FILA PARA LA POSICIÓN VERTICAL
                    left: '2px',
                    width: `calc(${widthPercentage}% - 4px)`,
                    zIndex: 10 + rowIndex, // Asegurar que eventos de filas superiores estén encima
                    backgroundColor: `${event.color}20`,
                    borderColor: event.color,
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onEventClick) onEventClick(event);
                    if (onSesionClick) onSesionClick(event.sesion);
                }}
                title={`${event.title}\n📅 ${format(event.startDate, 'dd/MM/yyyy')} - ${format(event.endDate, 'dd/MM/yyyy')}`}
            >
                <div className="flex items-center h-full px-2">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                        <span className="text-xs font-medium truncate" style={{ color: event.color }}>
                            {event.title}
                        </span>
                    </div>
                    {position === 'end' && (
                        <span className="material-symbols-outlined text-xs ml-1 flex-shrink-0" style={{ color: event.color }}>
                            {event.estado === 'programada' ? 'schedule' :
                                event.estado === 'en_curso' ? 'play_circle' :
                                    event.estado === 'completada' ? 'check_circle' : 'cancel'}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    // Generar nombres de días usando locale
    const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const monthName = format(currentDate, 'MMMM', { locale: es });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return (
        <div className="w-full">
            {/* Encabezado */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={goToPreviousMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {capitalizedMonth} {currentDate.getFullYear()}
                    </h2>
                    <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{events.length} sesiones</span>
                    <button onClick={goToToday} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm font-medium transition-colors">
                        Hoy
                    </button>
                </div>
            </div>

            {/* Días semana */}
            <div className="grid grid-cols-7 gap-px mb-2 bg-gray-200 dark:bg-gray-800 rounded-t-lg">
                {dayNames.map((day, index) => (
                    <div key={index} className="text-center py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid del mes */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 rounded-b-lg overflow-hidden">
                {days.map((day, dayIndex) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isCurrentDay = isSameDay(day, new Date());

                    // --- LÓGICA: Encontrar eventos para ESTE día específico ---
                    const eventsForDay = events.filter(event =>
                        isWithinInterval(day, { start: event.startDate, end: event.endDate })
                    );

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
                            onClick={() => onDayClick && onDayClick(day)}
                        >
                            <div className="flex items-center justify-between p-2">
                                <span className={clsx(
                                    'text-sm font-medium transition-colors',
                                    isCurrentDay ? 'flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white' :
                                        !isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {eventsForDay.length > 0 && (
                                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                                        {eventsForDay.length}
                                    </span>
                                )}
                            </div>

                            <div className="relative px-2">
                                {eventsForDay.map((event) => renderEventForDay(event, day))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Leyenda (simplificada visualmente) */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipos</h3>
                        <div className="flex flex-wrap gap-3">
                            {Array.from(new Set(events.map(e => e.tipo))).map((tipo, index) => {
                                const event = events.find(e => e.tipo === tipo);
                                return event ? (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color }} />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{tipo}</span>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;