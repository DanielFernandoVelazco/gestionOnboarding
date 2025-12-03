import React, { useState, useEffect } from 'react';
import { calendarioService } from '../../services/calendario.service';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface CalendarProps {
    año?: number;
    mes?: number;
    onEventClick?: (evento: any) => void;
    onSesionClick?: (sesion: any) => void;
}

const Calendar: React.FC<CalendarProps> = ({
    año = new Date().getFullYear(),
    mes = new Date().getMonth() + 1,
    onEventClick,
    onSesionClick,
}) => {
    const [calendario, setCalendario] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date(año, mes - 1, 1));

    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    useEffect(() => {
        loadCalendario();
    }, [currentDate]);

    const loadCalendario = async () => {
        setLoading(true);
        setError(null);

        try {
            const año = currentDate.getFullYear();
            const mes = currentDate.getMonth() + 1;
            const data = await calendarioService.getMesCalendario(año, mes);
            setCalendario(data);
        } catch (err: any) {
            console.error('Error al cargar calendario:', err);
            setError(err.message || 'Error al cargar calendario');

            // Datos de ejemplo para desarrollo
            const dataEjemplo = generarCalendarioEjemplo(año, mes);
            setCalendario(dataEjemplo);
        } finally {
            setLoading(false);
        }
    };

    const generarCalendarioEjemplo = (año: number, mes: number) => {
        const primerDia = new Date(año, mes - 1, 1);
        const ultimoDia = new Date(año, mes, 0);

        // Calcular semanas
        const primerDiaSemana = new Date(primerDia);
        const diaSemana = primerDia.getDay();
        primerDiaSemana.setDate(primerDia.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));

        const ultimoDiaSemana = new Date(ultimoDia);
        const diaSemanaUltimo = ultimoDia.getDay();
        if (diaSemanaUltimo !== 0) {
            ultimoDiaSemana.setDate(ultimoDia.getDate() + (7 - diaSemanaUltimo));
        }

        const semanas: any[] = [];
        let fechaActual = new Date(primerDiaSemana);

        while (fechaActual <= ultimoDiaSemana) {
            const semana: any[] = [];

            for (let i = 0; i < 7; i++) {
                const fecha = new Date(fechaActual);
                const esMesActual = fecha.getMonth() === mes - 1;

                // Eventos de ejemplo para días específicos
                const eventosDia = [];
                if (fecha.getDate() === 16 && esMesActual) {
                    eventosDia.push({
                        id: '1',
                        titulo: 'Journey to Cloud',
                        tipo: 'sesion_onboarding',
                        color: '#00448D',
                        todoElDia: true,
                    });
                }

                semana.push({
                    fecha: fecha.toISOString().split('T')[0],
                    esMesActual,
                    eventos: eventosDia,
                    sesiones: [],
                });

                fechaActual.setDate(fechaActual.getDate() + 1);
            }

            semanas.push(semana);
        }

        return {
            año,
            mes,
            nombreMes: nombresMeses[mes - 1],
            semanas,
        };
    };

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getEventColor = (tipo: string, color?: string) => {
        if (color) return color;

        switch (tipo) {
            case 'sesion_onboarding':
                return '#00448D';
            case 'reunion':
                return '#10B981';
            case 'feriado':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error && !calendario) {
        return (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2">error</span>
                <p className="mb-2">{error}</p>
                <p className="text-sm">Mostrando calendario de ejemplo</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header del calendario */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {calendario?.nombreMes || nombresMeses[currentDate.getMonth()]} {calendario?.año || currentDate.getFullYear()}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={goToToday}>
                        Hoy
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                        <span className="material-symbols-outlined">chevron_left</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                        <span className="material-symbols-outlined">chevron_right</span>
                    </Button>
                </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-px mb-2">
                {nombresDias.map((dia) => (
                    <div
                        key={dia}
                        className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
                    >
                        {dia}
                    </div>
                ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                {calendario?.semanas?.map((semana: any[], semanaIndex: number) =>
                    semana.map((dia: any, diaIndex: number) => (
                        <div
                            key={`${semanaIndex}-${diaIndex}`}
                            className={`
                min-h-24 p-2 bg-white dark:bg-gray-900
                ${!dia.esMesActual ? 'bg-gray-50 dark:bg-gray-800 text-gray-400' : ''}
                ${dia.fecha === new Date().toISOString().split('T')[0]
                                    ? 'ring-2 ring-primary'
                                    : ''
                                }
              `}
                        >
                            {/* Número del día */}
                            <div className="flex justify-between items-start mb-1">
                                <span className={`
                  text-sm font-medium
                  ${dia.esMesActual
                                        ? 'text-gray-900 dark:text-gray-100'
                                        : 'text-gray-400'
                                    }
                  ${dia.fecha === new Date().toISOString().split('T')[0]
                                        ? 'text-primary font-bold'
                                        : ''
                                    }
                `}>
                                    {new Date(dia.fecha).getDate()}
                                </span>
                                {dia.eventos?.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                        {dia.eventos.length}
                                    </span>
                                )}
                            </div>

                            {/* Eventos del día */}
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                                {dia.eventos?.slice(0, 3).map((evento: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`
                      text-xs px-2 py-1 rounded truncate cursor-pointer
                      ${evento.todoElDia ? 'font-semibold' : ''}
                    `}
                                        style={{
                                            backgroundColor: `${getEventColor(evento.tipo, evento.color)}20`,
                                            color: getEventColor(evento.tipo, evento.color),
                                        }}
                                        onClick={() => onEventClick?.(evento)}
                                        title={evento.descripcion || evento.titulo}
                                    >
                                        {evento.titulo}
                                    </div>
                                ))}
                                {dia.eventos?.length > 3 && (
                                    <div className="text-xs text-gray-500 px-2">
                                        +{dia.eventos.length - 3} más
                                    </div>
                                )}

                                {/* Sesiones de onboarding */}
                                {dia.sesiones?.map((sesion: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`
                      text-xs px-2 py-1 rounded truncate cursor-pointer
                      font-semibold
                    `}
                                        style={{
                                            backgroundColor: `${sesion.tipo?.color || '#00448D'}20`,
                                            color: sesion.tipo?.color || '#00448D',
                                        }}
                                        onClick={() => onSesionClick?.(sesion)}
                                        title={sesion.descripcion || sesion.titulo}
                                    >
                                        {sesion.titulo}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {error && (
                <div className="mt-4 text-center text-sm text-yellow-600 dark:text-yellow-400">
                    <span className="material-symbols-outlined text-sm mr-1">info</span>
                    {error} (Mostrando datos de ejemplo)
                </div>
            )}

            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#00448D' }}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Onboarding</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Reunión</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Feriado</span>
                </div>
            </div>
        </div>
    );
};

export default Calendar;