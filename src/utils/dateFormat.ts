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

/**
 * Intenta normalizar o corregir una cadena de fecha que tenga errores comunes
 * de formato (ej: M/D/YY, MM/DD/YYYY, AAAA-MM-DD, D/M/AAAA) convirtiéndola
 * al formato estándar DD/MM/AAAA.
 * Si ya es válida en DD/MM/AAAA, la devuelve formateada (DD/MM/AAAA).
 * Si no se puede interpretar, devuelve la cadena original sin alterar.
 */
export const tryAutoFixDate = (value: string | null | undefined): string => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";

    // 1. Si ya es una fecha oficial válida (DD/MM/AAAA o AAAA-MM-DD)
    const valid = parseOfficialDate(trimmed);
    if (valid) {
        const dd = String(valid.day).padStart(2, "0");
        const mm = String(valid.month).padStart(2, "0");
        const aaaa = String(valid.year).padStart(4, "0");
        return `${dd}/${mm}/${aaaa}`;
    }

    // 2. Patrones con separadores /, - o .
    const parts = trimmed.split(/[\/\-\.]+/).map((p) => p.trim());
    if (parts.length === 3) {
        let p1 = Number(parts[0]);
        let p2 = Number(parts[1]);
        let p3 = Number(parts[2]);

        if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
            // Caso año de 2 dígitos al final (ej. 10/16/26 o 16/10/26)
            if (p3 >= 0 && p3 <= 99 && parts[2].length <= 2) {
                p3 = 2000 + p3;
            }

            let day = 0;
            let month = 0;
            let year = 0;

            if (p1 >= 1900 && p1 <= 2100) {
                // Formato YYYY-MM-DD o YYYY-DD-MM
                year = p1;
                if (p2 > 12 && p3 <= 12) {
                    day = p2;
                    month = p3;
                } else {
                    month = p2;
                    day = p3;
                }
            } else if (p3 >= 1900 && p3 <= 2100) {
                year = p3;
                // Si p1 > 12 y p2 <= 12 -> DD/MM
                if (p1 > 12 && p2 <= 12) {
                    day = p1;
                    month = p2;
                } else if (p2 > 12 && p1 <= 12) {
                    // Formato estadounidense M/D/YY común en Excel (ej 10/16/26 -> mes 10, día 16)
                    day = p2;
                    month = p1;
                } else {
                    // Ambos <= 12: en contexto Excel colombiano suele ser DD/MM
                    day = p1;
                    month = p2;
                }
            }

            if (year >= 1900 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)) {
                const dd = String(day).padStart(2, "0");
                const mm = String(month).padStart(2, "0");
                const aaaa = String(year).padStart(4, "0");
                return `${dd}/${mm}/${aaaa}`;
            }
        }
    }

    return trimmed;
};
