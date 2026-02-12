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
    if (data.enteros > 999999999) return 'NÚMERO DEMASIADO GRANDE';

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
        return prefijoMil + etiquetaMil + leerNumero(resto);
    }
    if (num < 1000000000) {
        const millones = Math.floor(num / 1000000);
        const resto = num % 1000000;
        let etiquetaMillon = millones === 1 ? 'millón ' : 'millones ';
        return leerNumero(millones) + etiquetaMillon + leerNumero(resto);
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
