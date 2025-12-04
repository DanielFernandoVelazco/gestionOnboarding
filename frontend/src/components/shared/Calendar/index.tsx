import React, { useState, useEffect } from 'react';
import { OnboardingSesion } from '../../../services/onboarding.service';

interface CalendarProps {
    onEventClick?: (evento: any) => void;
    onSesionClick?: (sesion: OnboardingSesion) => void;
    onDayClick?: (date: Date) => void;
    sesiones?: OnboardingSesion[];
}

const Calendar: React.FC<CalendarProps> = ({
    onEventClick,
    onSesionClick,
    onDayClick,
    sesiones = [],
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        // Convertir sesiones a eventos del calendario
        const calendarEvents = sesiones.map(sesion => ({
            id: sesion.id,
            title: sesion.titulo,
            start: new Date(sesion.fechaInicio),
            end: new Date(sesion.fechaFin),
            color: sesion.tipo?.color || '#00448D',
            tipo: sesion.tipo?.nombre,
            estado: sesion.estado,
            sesionData: sesion,
        }));
        setEvents(calendarEvents);
    }, [sesiones]);

    const handlePrevMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const handleDayClick = (date: Date) => {
        if (onDayClick) {
            onDayClick(date);
        }
    };

    const handleEventClick = (event: any) => {
        if (onEventClick) {
            onEventClick(event);
        }
        if (onSesionClick && event.sesionData) {
            onSesionClick(event.sesionData);
        }
    };

    // Renderizar el calendario (simplificado para ejemplo)
    return (
        <div className="calendar-container">
            {/* Header del calendario */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {events.length} sesiones
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Calendario */}
            <div className="grid grid-cols-7 gap-1">
                {/* Días de la semana */}
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                        {day}
                    </div>
                ))}

                {/* Días del mes */}
                {Array.from({ length: 35 }).map((_, index) => {
                    const date = new Date(currentDate);
                    date.setDate(1);
                    date.setDate(date.getDate() - date.getDay() + index);

                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dayEvents = events.filter(event =>
                        event.start.toDateString() === date.toDateString()
                    );

                    return (
                        <div
                            key={index}
                            className={`min-h-[100px] border border-gray-200 dark:border-gray-700 p-2 ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'
                                } ${isToday ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => handleDayClick(date)}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-sm ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                                    {date.getDate()}
                                </span>
                                {dayEvents.length > 0 && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        {dayEvents.length}
                                    </span>
                                )}
                            </div>

                            {/* Eventos del día */}
                            <div className="space-y-1">
                                {dayEvents.slice(0, 2).map((event, idx) => (
                                    <div
                                        key={idx}
                                        className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-90"
                                        style={{ backgroundColor: event.color + '20', color: event.color }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEventClick(event);
                                        }}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                                {dayEvents.length > 2 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        +{dayEvents.length - 2} más
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {sesiones.reduce((acc: any[], sesion) => {
                    if (!acc.find(item => item.tipo === sesion.tipo?.nombre)) {
                        acc.push({
                            tipo: sesion.tipo?.nombre,
                            color: sesion.tipo?.color,
                        });
                    }
                    return acc;
                }, []).map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.tipo}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Calendar;