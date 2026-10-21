/**
 * Utilidades para validación y formato de números de celular en Colombia.
 * En Colombia los números de telefonía móvil constan siempre de exactamente 10 dígitos
 * y comienzan por el dígito 3 (ej. 3001234567).
 */

/**
 * Limpia cualquier caracter no numérico y normaliza prefijos internacionales (+57 o 57).
 */
export const cleanColombianPhone = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    let digits = String(value).replace(/\D/g, "").trim();
    // Si viene con prefijo de Colombia (57) y 12 dígitos en total, se remueve el 57
    if (digits.startsWith("57") && digits.length === 12) {
        digits = digits.slice(2);
    }
    return digits;
};

export interface PhoneValidationResult {
    isValid: boolean;
    cleanDigits: string;
    errorMessage?: string;
}

/**
 * Valida si un número celular cumple estrictamente con el estándar colombiano:
 * 10 dígitos numéricos e inicio con el dígito 3.
 */
export const validateColombianPhone = (value: string | number | null | undefined): PhoneValidationResult => {
    const cleanDigits = cleanColombianPhone(value);

    if (!cleanDigits) {
        return {
            isValid: false,
            cleanDigits: "",
            errorMessage: "El número de celular es requerido."
        };
    }

    if (cleanDigits.length < 10) {
        return {
            isValid: false,
            cleanDigits,
            errorMessage: "Debe contener exactamente 10 dígitos."
        };
    }

    if (cleanDigits.length > 10) {
        return {
            isValid: false,
            cleanDigits,
            errorMessage: "Debe contener exactamente 10 dígitos."
        };
    }

    if (!cleanDigits.startsWith("3")) {
        return {
            isValid: false,
            cleanDigits,
            errorMessage: "Debe iniciar con el dígito 3."
        };
    }

    return {
        isValid: true,
        cleanDigits
    };
};

export const isValidColombianPhone = (value: string | number | null | undefined): boolean =>
    validateColombianPhone(value).isValid;

/**
 * Formatea un número de 10 dígitos con el patrón legible "3XX XXX XXXX".
 */
export const formatColombianPhone = (value: string | number | null | undefined): string => {
    const digits = cleanColombianPhone(value);
    if (digits.length !== 10) return String(value || "");
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
};
