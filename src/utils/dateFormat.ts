/**
 * Formato de fecha oficial del sistema: DD/MM/AAAA (ej. 16/10/2026).
 *
 * También se acepta el formato ISO AAAA-MM-DD (2026-10-16) producido por los
 * inputs type="date" de los formularios individuales.
 *
 * No se aceptan años de dos dígitos (ej. 10/16/26) ni formatos estadounidenses (MM/DD/AAAA).
 * Cualquier formato ambiguo o inválido se rechaza estrictamente.
 */

export const OFFICIAL_DATE_FORMAT = "DD/MM/AAAA";
export const OFFICIAL_DATE_EXAMPLE = "16/10/2026";

const DDMMAAAA_REGEX = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
const AAAAMMDD_REGEX = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;

export interface DateParts {
    year: number;
    month: number; // 1-12
    day: number;   // 1-31
}

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = (year: number, month: number) =>
    [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];

/**
 * Interpreta una fecha en el formato oficial DD/MM/AAAA o ISO AAAA-MM-DD.
 * Devuelve null si no cumple el formato, si el año no tiene 4 dígitos,
 * o si la fecha es inexistente en el calendario (ej. 30/02/2026).
 */
export const parseOfficialDate = (value: string | null | undefined): DateParts | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    let year: number;
    let month: number;
    let day: number;

    const matchDD = DDMMAAAA_REGEX.exec(trimmed);
    if (matchDD) {
        day = Number(matchDD[1]);
        month = Number(matchDD[2]);
        year = Number(matchDD[3]);
    } else {
        const matchISO = AAAAMMDD_REGEX.exec(trimmed);
        if (!matchISO) return null;
        year = Number(matchISO[1]);
        month = Number(matchISO[2]);
        day = Number(matchISO[3]);
    }

    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
    return { year, month, day };
};

export const isOfficialDate = (value: string | null | undefined): boolean => parseOfficialDate(value) !== null;

/** Número comparable (AAAAMMDD) para ordenar fechas sin usar Date. */
export const toComparableNumber = ({ year, month, day }: DateParts): number => year * 10000 + month * 100 + day;

/** Fecha de hoy según el reloj local del equipo, en componentes (sin pasar por UTC). */
export const getTodayDateParts = (): DateParts => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
};

/** Mensaje estándar para una fecha que no cumple el formato oficial. */
export const getDateFormatErrorMessage = (foundValue: string): string =>
    `Error en el formato de fecha: "${foundValue}". El formato obligatorio y establecido es ${OFFICIAL_DATE_FORMAT} (ej: ${OFFICIAL_DATE_EXAMPLE}).`;
