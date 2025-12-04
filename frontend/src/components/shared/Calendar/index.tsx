import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { onboardingService } from '../../../services/onboarding.service';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    color: string;
    type: 'sesion' | 'evento';
    data?: any;
}

interface CalendarProps {
    onEventClick?: (event: CalendarEvent) => void;
    onSesionClick?: (sesion: any) => void;
    onDayClick?: (date: Date) => void;
    filterTipoId?: string;
}

const Calendar: React.FC<CalendarProps> = ({
    onEventClick,
    onSesionClick,
    onDayClick,
    filterTipoId,
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [sesiones, setSesiones] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    useEffect(() => {
        loadSesiones();
    }, [currentDate, filterTipoId]);

    const loadSesiones = async () => {
        setLoading(true);
        try {
            const año = currentDate.getFullYear();
            const mes = currentDate.getMonth() + 1;
            const sesionesData = await onboardingService.getSesionesPorMes(año, mes);

            const eventosCalendario: CalendarEvent[] = sesionesData.map(sesion => ({
                id: sesion.id,
                title: sesion.titulo,
                date: new Date(sesion.fechaInicio),
                color: sesion.tipo?.color || '#00448D',
                type: 'sesion',
                data: sesion,
            }));

            setSesiones(sesionesData);
            setEvents(eventosCalendario);
        } catch (error) {
            console.error('Error al cargar sesiones:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const prevMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={prevMonth}
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentDate(new Date())}
                        >
                            Hoy
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={nextMonth}
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];

        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;

                const dayEvents = events.filter(event =>
                    isSameDay(new Date(event.date), cloneDay)
                );

                days.push(
                    <div
                        key={day.toString()}
                        className={`
              min-h-24 p-2 border border-gray-200 dark:border-gray-800
              ${!isSameMonth(day, monthStart) ? 'bg-gray-50 dark:bg-gray-900/50' : ''}
              ${isSameDay(day, new Date()) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer
            `}
                        onClick={() => onDayClick?.(cloneDay)}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className={`
                text-sm font-medium
                ${!isSameMonth(day, monthStart) ? 'text-gray-400 dark:text-gray-600' :
                                    isSameDay(day, new Date()) ? 'text-blue-600 dark:text-blue-400' :
                                        'text-gray-700 dark:text-gray-300'}
              `}>
                                {formattedDate}
                            </span>
                        </div>

                        <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((event, index) => (
                                <div
                                    key={index}
                                    className="text-xs p-1 rounded truncate"
                                    style={{
                                        backgroundColor: `${event.color}20`,
                                        color: event.color,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (event.type === 'sesion') {
                                            onSesionClick?.(event.data);
                                        } else {
                                            onEventClick?.(event);
                                        }
                                    }}
                                >
                                    {event.title}
                                </div>
                            ))}
                            {dayEvents.length > 3 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                                    +{dayEvents.length - 3} más
                                </div>
                            )}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day.toString()} className="grid grid-cols-7">
                    {days}
                </div>
            );
            days = [];
        }
        return rows;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            {renderHeader()}

            <div className="grid grid-cols-7 text-center mb-2">
                {diasSemana.map((day, index) => (
                    <div
                        key={index}
                        className="text-xs font-semibold text-gray-500 dark:text-gray-400 py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                {renderDays()}
            </div>

            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Hoy</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sesión de Onboarding</span>
                </div>
            </div>
        </div>
    );
};

export default Calendar;