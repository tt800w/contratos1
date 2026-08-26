/**
 * Utility to convert numbers to Spanish words (Currency focus)
 */

const UNIDADES = ['', 'un ', 'dos ', 'tres ', 'cuatro ', 'cinco ', 'seis ', 'siete ', 'ocho ', 'nueve '];
const DECENAS = ['diez ', 'once ', 'doce ', 'trece ', 'catorce ', 'quince ', 'dieciséis ', 'diecisiete ', 'dieciocho ', 'diecinueve ', 'veinte ', 'treinta ', 'cuarenta ', 'cincuenta ', 'sesenta ', 'setenta ', 'ochenta ', 'noventa '];
const CENTENAS = ['', 'ciento ', 'doscientos ', 'trescientos ', 'cuatrocientos ', 'quinientos ', 'seiscientos ', 'setecientos ', 'ochocientos ', 'novecientos '];

export function numberToSpanishWords(value: number): string {
    let data = {
        numero: value,
        enteros: Math.floor(value),
        letrasMil: '',
        letrasMillones: ''
    };

    if (data.enteros === 0) return 'CERO ';
    if (data.enteros === 1) return 'UN ';
    if (data.enteros > 999999999999) return 'NÚMERO DEMASIADO GRANDE';

    return leerNumero(data.enteros).toUpperCase();
}

function leerNumero(num: number): string {
    if (num < 10) return UNIDADES[num];
    if (num < 20) return DECENAS[num - 10];
    if (num < 30) {
        const unidad = num % 10;
        return unidad === 0 ? 'veinte ' : 'veinti' + UNIDADES[unidad].trim();
    }
    if (num < 100) {
        const decena = Math.floor(num / 10);
        const unidad = num % 10;
        return DECENAS[decena + 8] + (unidad > 0 ? 'y ' + UNIDADES[unidad] : '');
    }
    if (num < 1000) {
        const centena = Math.floor(num / 100);
        const resto = num % 100;
        if (centena === 1 && resto === 0) return 'cien ';
        return CENTENAS[centena] + leerNumero(resto);
    }
    if (num < 1000000) {
        const miles = Math.floor(num / 1000);
        const resto = num % 1000;
        let etiquetaMil = 'mil ';
        let prefijoMil = miles === 1 ? '' : leerNumero(miles);
        return prefijoMil + etiquetaMil + (resto > 0 ? leerNumero(resto) : '');
    }
    if (num < 1000000000) {
        const millones = Math.floor(num / 1000000);
        const resto = num % 1000000;
        let etiquetaMillon = millones === 1 ? 'un millón ' : leerNumero(millones) + 'millones ';
        return etiquetaMillon + (resto > 0 ? leerNumero(resto) : '');
    }
    if (num < 1000000000000) {
        const milesDeMillones = Math.floor(num / 1000000);
        const resto = num % 1000000;
        return leerNumero(milesDeMillones) + 'millones ' + (resto > 0 ? leerNumero(resto) : '');
    }
    return '';
}

export function formatCurrencySpanish(value: number): string {
    const words = numberToSpanishWords(value).trim();
    const formattedNumber = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(value).replace(/\s/g, '');

    return `${words} PESOS (${formattedNumber} COP)`;
}

/**
 * Analiza y convierte cualquier formato de moneda o número (incluyendo formatos con decimales de Excel como "$13,000,000.00" o "$ 13.000.000,00")
 * a un número entero limpio en pesos colombianos.
 */
export function parseCurrency(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : Math.round(value);

    let str = String(value).trim();
    if (!str) return 0;

    // Quitar símbolos de moneda, letras y espacios (ej. "$", "COP", "USD", " ")
    // Dejar solo dígitos, puntos, comas y signo menos
    str = str.replace(/[^0-9.,-]/g, '');
    if (!str) return 0;

    const isNegative = str.startsWith('-');
    if (isNegative) str = str.substring(1);

    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');

    let result = 0;

    // Caso 1: Tiene tanto punto como coma (ej. "13,000,000.00" o "13.000.000,00")
    if (lastDot !== -1 && lastComma !== -1) {
        if (lastDot > lastComma) {
            // Formato US / estándar Excel inglés: comas para miles, punto para decimales (ej. 13,000,000.00)
            const integerPart = str.substring(0, lastDot).replace(/\D/g, '');
            const decimalPart = str.substring(lastDot + 1).replace(/\D/g, '');
            const floatVal = parseFloat(`${integerPart || '0'}.${decimalPart}`);
            result = Math.round(floatVal);
        } else {
            // Formato Español / estándar Excel latino: puntos para miles, coma para decimales (ej. 13.000.000,00)
            const integerPart = str.substring(0, lastComma).replace(/\D/g, '');
            const decimalPart = str.substring(lastComma + 1).replace(/\D/g, '');
            const floatVal = parseFloat(`${integerPart || '0'}.${decimalPart}`);
            result = Math.round(floatVal);
        }
    }
    // Caso 2: Solo tiene punto
    else if (lastDot !== -1) {
        const parts = str.split('.');
        if (parts.length > 2) {
            // Múltiples puntos: separadores de miles (ej. "13.000.000")
            result = parseInt(parts.join(''), 10);
        } else {
            // Solo 1 punto: puede ser decimal (ej. "13000000.00", "13000000.0") o miles ("13.000", "6.500")
            const decimalPart = parts[1];
            if (decimalPart.length <= 2) {
                result = Math.round(parseFloat(str));
            } else {
                result = parseInt(parts.join(''), 10);
            }
        }
    }
    // Caso 3: Solo tiene coma
    else if (lastComma !== -1) {
        const parts = str.split(',');
        if (parts.length > 2) {
            // Múltiples comas: separadores de miles (ej. "13,000,000")
            result = parseInt(parts.join(''), 10);
        } else {
            // Solo 1 coma: puede ser decimal (ej. "13000000,00") o miles ("13,000", "6,500")
            const decimalPart = parts[1];
            if (decimalPart.length <= 2) {
                result = Math.round(parseFloat(`${parts[0] || '0'}.${decimalPart}`));
            } else {
                result = parseInt(parts.join(''), 10);
            }
        }
    }
    // Caso 4: Solo dígitos
    else {
        result = parseInt(str, 10);
    }

    if (isNaN(result)) return 0;
    return isNegative ? -result : result;
}
