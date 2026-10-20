import { parseOfficialDate, toComparableNumber, getDateFormatErrorMessage } from "./dateFormat";

/**
 * Valida que las fechas proporcionadas pertenezcan a meses y años únicos.
 * Usa los componentes de la fecha (AAAA-MM-DD) sin pasar por objetos Date, para evitar
 * desfases de zona horaria. Una fecha que no cumpla el formato oficial invalida el conjunto.
 */
export const validateMonths = (dates: string[]) => {
    const months: string[] = [];
    for (const d of dates.filter(d => d !== "")) {
        const parts = parseOfficialDate(d);
        if (!parts) return false;
        months.push(`${parts.year}-${parts.month}`);
    }
    return new Set(months).size === months.length;
};

/**
 * Valida que las fechas proporcionadas sigan un orden cronológico estricto.
 * Una fecha que no cumpla el formato oficial invalida el conjunto.
 */
export const validateChronology = (dates: string[]) => {
    const validDates: number[] = [];
    for (const d of dates.filter(d => d !== "")) {
        const parts = parseOfficialDate(d);
        if (!parts) return false;
        validDates.push(toComparableNumber(parts));
    }

    for (let i = 1; i < validDates.length; i++) {
        if (validDates[i] <= validDates[i - 1]) return false;
    }
    return true;
};

/**
 * Verifica que la fecha del contrato y las fechas de cuotas (si existen) cumplan
 * estrictamente el formato oficial. Devuelve el primer mensaje de error o null si todo es válido.
 */
export const validateFormDates = (fechaContrato: string, fechasCuotas: string[] = []): string | null => {
    if (fechaContrato && !parseOfficialDate(fechaContrato)) {
        return `Fecha Contrato: ${getDateFormatErrorMessage(fechaContrato)}`;
    }
    for (let i = 0; i < fechasCuotas.length; i++) {
        const fecha = fechasCuotas[i];
        if (fecha && !parseOfficialDate(fecha)) {
            return `Fecha Cuota ${i + 1}: ${getDateFormatErrorMessage(fecha)}`;
        }
    }
    return null;
};
