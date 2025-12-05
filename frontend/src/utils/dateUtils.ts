/**
 * Convierte una fecha de input type="date" (YYYY-MM-DD) a formato ISO para el backend
 * sin cambiar la zona horaria.
 *
 * El backend recibirá exactamente "YYYY-MM-DD" sin desfases.
 */
export function formatDateForBackend(dateString: string): string {
    if (!dateString) return '';

    // Validación mínima
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return '';

    // Simplemente retornamos el mismo valor
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Convierte una fecha ISO del backend a un formato válido para input type="date"
 * sin permitir que JS aplique conversiones por zona horaria.
 */
export function formatDateForInput(isoDate: string): string {
    if (!isoDate) return '';

    // Acepta "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ssZ"
    const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return '';

    const [, year, month, day] = match;
    return `${year}-${month}-${day}`;
}

/**
 * Convierte una fecha del backend a Date object sin problemas de timezone.
 * Útil para el calendario y otras visualizaciones.
 */
export function parseDateFromBackend(isoDate: string): Date {
    if (!isoDate) return new Date();

    const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return new Date();

    const [, year, month, day] = match;
    // Crear fecha en UTC para evitar desfases de zona horaria
    return new Date(Date.UTC(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10)
    ));
}

/**
 * Convierte un objeto Date a string YYYY-MM-DD para el backend.
 */
export function dateToBackendFormat(date: Date): string {
    if (!date) return '';

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Convierte un objeto Date a string YYYY-MM-DD para input type="date".
 */
export function dateToInputFormat(date: Date): string {
    if (!date) return '';

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha para mostrar al usuario (DD/MM/YYYY)
 */
export function formatDateForDisplay(isoDate: string): string {
    if (!isoDate) return '';

    const date = parseDateFromBackend(isoDate);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha para mostrar al usuario con formato largo
 */
export function formatDateLong(isoDate: string): string {
    if (!isoDate) return '';

    const date = parseDateFromBackend(isoDate);
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    return date.toLocaleDateString('es-ES', options);
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD para el backend
 */
export function getTodayForBackend(): string {
    const today = new Date();
    return dateToBackendFormat(today);
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD para inputs
 */
export function getTodayForInput(): string {
    const today = new Date();
    return dateToInputFormat(today);
}

/**
 * Valida que una fecha YYYY-MM-DD sea válida (sin timezone).
 */
export function isValidDate(dateString: string): boolean {
    if (!dateString) return false;

    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;

    const [, yearStr, monthStr, dayStr] = match;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

    // Crear fecha en UTC para validar
    const date = new Date(Date.UTC(year, month, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month &&
        date.getUTCDate() === day
    );
}

/**
 * Compara dos fechas YYYY-MM-DD ignorando la hora.
 */
export function isSameDate(date1: Date, date2: Date): boolean {
    if (!date1 || !date2) return false;

    return (
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate()
    );
}

/**
 * Compara dos strings de fecha YYYY-MM-DD.
 */
export function isSameDateString(dateStr1: string, dateStr2: string): boolean {
    if (!dateStr1 || !dateStr2) return false;

    const date1 = parseDateFromBackend(dateStr1);
    const date2 = parseDateFromBackend(dateStr2);

    return isSameDate(date1, date2);
}

/**
 * Verifica si una fecha es hoy.
 */
export function isToday(isoDate: string): boolean {
    if (!isoDate) return false;

    const date = parseDateFromBackend(isoDate);
    const today = new Date();

    return isSameDate(date, today);
}

/**
 * Verifica si una fecha es anterior a hoy.
 */
export function isPastDate(isoDate: string): boolean {
    if (!isoDate) return false;

    const date = parseDateFromBackend(isoDate);
    const today = new Date();

    // Comparar solo fecha, no hora
    const dateUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    return dateUTC < todayUTC;
}

/**
 * Verifica si una fecha es futura (después de hoy).
 */
export function isFutureDate(isoDate: string): boolean {
    if (!isoDate) return false;

    const date = parseDateFromBackend(isoDate);
    const today = new Date();

    // Comparar solo fecha, no hora
    const dateUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    return dateUTC > todayUTC;
}

/**
 * Agrega días a una fecha sin problemas de timezone.
 */
export function addDays(date: Date, days: number): Date {
    if (!date) return new Date();

    const result = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));

    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

/**
 * Agrega días a una fecha string YYYY-MM-DD.
 */
export function addDaysToDateString(isoDate: string, days: number): string {
    if (!isoDate) return '';

    const date = parseDateFromBackend(isoDate);
    const newDate = addDays(date, days);

    return dateToBackendFormat(newDate);
}

/**
 * Calcula la diferencia en días exactos entre dos fechas sin saltos de timezone.
 */
export function differenceInDays(date1: Date, date2: Date): number {
    if (!date1 || !date2) return 0;

    const utc1 = Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
    const utc2 = Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate());

    return Math.floor(Math.abs(utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Calcula la diferencia en días entre dos fechas string YYYY-MM-DD.
 */
export function differenceInDaysString(dateStr1: string, dateStr2: string): number {
    if (!dateStr1 || !dateStr2) return 0;

    const date1 = parseDateFromBackend(dateStr1);
    const date2 = parseDateFromBackend(dateStr2);

    return differenceInDays(date1, date2);
}

/**
 * Obtiene el primer día del mes de una fecha.
 */
export function getFirstDayOfMonth(date: Date): Date {
    if (!date) return new Date();

    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * Obtiene el último día del mes de una fecha.
 */
export function getLastDayOfMonth(date: Date): Date {
    if (!date) return new Date();

    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

/**
 * Valida que un rango de fechas sea válido (fecha inicio <= fecha fin).
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
    if (!startDate || !endDate) return false;

    const start = parseDateFromBackend(startDate);
    const end = parseDateFromBackend(endDate);

    return start <= end;
}

/**
 * Obtiene el mes y año en formato "Mes Año" (ej: "Diciembre 2024")
 */
export function getMonthYearString(date: Date): string {
    if (!date) return '';

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();

    return `${month} ${year}`;
}

/**
 * Obtiene los días de la semana abreviados en español.
 */
export function getShortDayNames(): string[] {
    return ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
}

/**
 * Obtiene los nombres completos de los meses en español.
 */
export function getMonthNames(): string[] {
    return [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
}