import React from 'react';

interface CalendarioMiniProps {
    año: number;
    mes: number;
    eventos: Array<{
        dia: number;
        color: string;
        titulo: string;
    }>;
    onDiaClick?: (dia: number) => void;
}

const CalendarioMini: React.FC<CalendarioMiniProps> = ({ año, mes, eventos, onDiaClick }) => {
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

    // Obtener primer día del mes
    const primerDia = new Date(año, mes - 1, 1);
    const primerDiaSemana = primerDia.getDay(); // 0 = Domingo, 1 = Lunes, etc.

    // Ajustar para que Lunes sea el primer día (1)
    const primerDiaAjustado = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    // Obtener último día del mes
    const ultimoDia = new Date(año, mes, 0);
    const totalDias = ultimoDia.getDate();

    // Generar array de días
    const dias = [];

    // Días vacíos al inicio
    for (let i = 0; i < primerDiaAjustado; i++) {
        dias.push(null);
    }

    // Días del mes
    for (let i = 1; i <= totalDias; i++) {
        dias.push(i);
    }

    const getEventoDelDia = (dia: number | null) => {
        if (!dia) return null;
        return eventos.find(evento => evento.dia === dia);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-center mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    {nombresMeses[mes - 1]} {año}
                </h3>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {diasSemana.map((dia, i) => (
                    <div key={i} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                        {dia}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {dias.map((dia, i) => {
                    const evento = getEventoDelDia(dia);
                    const esHoy = dia === new Date().getDate() &&
                        mes === new Date().getMonth() + 1 &&
                        año === new Date().getFullYear();

                    return (
                        <div
                            key={i}
                            onClick={() => dia && onDiaClick?.(dia)}
                            className={`
                aspect-square flex items-center justify-center text-sm
                ${dia ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                ${esHoy ? 'bg-primary/10 text-primary dark:text-primary font-bold' : ''}
                rounded relative
              `}
                        >
                            {dia && (
                                <>
                                    <span className={`${evento ? 'font-semibold' : ''}`}>
                                        {dia}
                                    </span>
                                    {evento && (
                                        <div
                                            className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                                            style={{ backgroundColor: evento.color }}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Leyenda */}
            {eventos.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Eventos programados:
                    </div>
                    <div className="space-y-1">
                        {eventos.map((evento, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: evento.color }}
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                    {evento.titulo} (día {evento.dia})
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarioMini;