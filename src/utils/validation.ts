/**
 * Valida que las fechas proporcionadas pertenezcan a meses y años únicos.
 */
export const validateMonths = (dates: string[]) => {
    const months = dates
        .filter(d => d !== "")
        .map(d => {
            const date = new Date(d + 'T00:00:00');
            return `${date.getFullYear()}-${date.getMonth()}`;
        });
    return new Set(months).size === months.length;
};

/**
 * Valida que las fechas proporcionadas sigan un orden cronológico estricto.
 */
export const validateChronology = (dates: string[]) => {
    const validDates = dates
        .filter(d => d !== "")
        .map(d => new Date(d + 'T00:00:00').getTime());

    for (let i = 1; i < validDates.length; i++) {
        if (validDates[i] <= validDates[i - 1]) return false;
    }
    return true;
};
