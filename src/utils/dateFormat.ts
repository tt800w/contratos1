/**
 * Formato de fecha oficial y ÚNICO del sistema: AAAA-MM-DD (ISO 8601, ej. 2026-10-16).
 *
 * Es el mismo formato que producen los <input type="date"> de los formularios individuales
 * y el que usa la plantilla de carga masiva. No es ambiguo (no se confunde DD/MM con MM/DD).
 *
 * POLÍTICA: no se adivinan ni se convierten formatos alternativos. Cualquier valor que no
 * cumpla exactamente este formato (o que no sea una fecha de calendario válida) se rechaza.
 *
 * Todas las operaciones trabajan con los componentes numéricos (año/mes/día) y NO con objetos
 * Date, para evitar desfases por zona horaria y la conversión de años de 2 dígitos a 19XX.
 */

export const OFFICIAL_DATE_FORMAT = "AAAA-MM-DD";
export const OFFICIAL_DATE_EXAMPLE = "2026-10-16";

const OFFICIAL_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface DateParts {
    year: number;
    month: number; // 1-12
    day: number;   // 1-31
}

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = (year: number, month: number) =>
    [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];

/**
 * Interpreta una fecha en el formato oficial AAAA-MM-DD.
 * Devuelve null si el texto no cumple exactamente el formato o si la fecha no existe
 * en el calendario (ej. 2026-02-30). No recorta ni corrige el valor.
 */
export const parseOfficialDate = (value: string | null | undefined): DateParts | null => {
    if (typeof value !== "string") return null;
    const match = OFFICIAL_DATE_REGEX.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

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
