
import * as xlsx from 'xlsx';
import { parseCurrency } from './numberToWords';

export interface CamperData {
    nombreRepresentante: string;
    cedulaRepresentante: string;
    nombreCamper: string;
    tipoDocumentoCamper: string; // "CC" o "TI"
    documentoCamper: string;
    direccionCamper: string;
    emailRepresentante: string;
    emailCamper: string;
    celularCamper: string;
    telefonoRepresentante: string;

    // Campos extra para generación masiva
    pagare?: string;
    jornada?: string;
    // Las fechas se guardan EXACTAMENTE como aparecen en el Excel (sin convertir ni adivinar).
    // Se validan contra el formato oficial (ver utils/dateFormat.ts) antes de generar.
    fechaContrato?: string;
    /** true si la celda de origen es una fecha nativa de Excel (no texto). Solo informativo. */
    fechaContratoEsCeldaFecha?: boolean;
    valorFormacion?: string;
    cuotas?: string;
    valorTotalObjetivo?: string;
    cuotasDetalle?: { valor: number; fecha: string; fechaEsCeldaFecha?: boolean }[];
    /** Número de fila real en la hoja de Excel (1 = encabezados). */
    filaExcel?: number;
}

// Helper to find value (and the header it came from) checking multiple possible headers
const findEntry = (row: any, possibleHeaders: string[], fuzzyKeywords?: { include: string[], exclude?: string[] }): { key: string; value: string } | null => {
    // 1. Exact or case-insensitive match
    for (const header of possibleHeaders) {
        if (row[header] !== undefined && String(row[header]).trim() !== "") {
            return { key: header, value: String(row[header]).trim() };
        }
        const matchedKey = Object.keys(row).find(key => key.trim().toLowerCase() === header.toLowerCase());
        if (matchedKey && row[matchedKey] !== undefined && String(row[matchedKey]).trim() !== "") {
            return { key: matchedKey, value: String(row[matchedKey]).trim() };
        }
    }

    // 2. Fuzzy match based on keywords if provided
    if (fuzzyKeywords) {
        const keys = Object.keys(row);
        for (const key of keys) {
            const lowerKey = key.toLowerCase();
            const matchesAll = fuzzyKeywords.include.every(kw => lowerKey.includes(kw.toLowerCase()));
            const hasExclusion = fuzzyKeywords.exclude ? fuzzyKeywords.exclude.some(kw => lowerKey.includes(kw.toLowerCase())) : false;

            if (matchesAll && !hasExclusion && row[key] !== undefined && String(row[key]).trim() !== "") {
                return { key, value: String(row[key]).trim() };
            }
        }
    }

    return null;
};

// Helper to find value from a row checking multiple possible headers
const getValue = (row: any, possibleHeaders: string[], fuzzyKeywords?: { include: string[], exclude?: string[] }): string =>
    findEntry(row, possibleHeaders, fuzzyKeywords)?.value ?? '';

/**
 * Devuelve una función que indica si la celda (fila, encabezado) es una fecha nativa de Excel.
 * Solo se usa para dar una pista en el mensaje de error; NUNCA para convertir el valor.
 */
const buildDateCellChecker = (sheet: xlsx.WorkSheet) => {
    const ref = sheet['!ref'];
    if (!ref) return () => false;
    const range = xlsx.utils.decode_range(ref);
    const headerColumns: Record<string, number> = {};
    for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[xlsx.utils.encode_cell({ r: range.s.r, c })];
        if (!cell) continue;
        const header = xlsx.utils.format_cell(cell);
        if (!(header in headerColumns)) headerColumns[header] = c;
    }
    return (rowIndex: number, header: string | undefined): boolean => {
        if (header === undefined || headerColumns[header] === undefined) return false;
        const cell = sheet[xlsx.utils.encode_cell({ r: rowIndex, c: headerColumns[header] })];
        return cell?.t === 'd';
    };
};

export const parseExcel = async (file: File): Promise<CamperData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                // cellDates: true solo sirve para identificar qué celdas son fechas nativas de Excel
                // (para orientar al usuario). El valor que se usa es siempre el TEXTO visible de la celda.
                const workbook = xlsx.read(data, { type: 'binary', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const isDateCell = buildDateCellChecker(sheet);
                const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

                console.log("Excel Headers (First Row keys):", Object.keys(jsonData[0] || {}));

                const parsedData: CamperData[] = jsonData.map((row: any) => {
                    // __rowNum__ lo agrega SheetJS (0-based) y respeta filas vacías intermedias.
                    const rowIndex: number = row.__rowNum__;
                    const fechaContratoEntry = findEntry(row, ['Fecha', 'Fecha Contrato', 'Fecha de Contrato']);
                    const res = {
                        nombreRepresentante: getValue(row, ['Nombre y apellido del acudiente', 'Nombre completo representante', 'Nombre Representante', 'Acudiente', 'Nombre del acudiente', 'Nombres y apellidos del acudiente', 'Nombre Acudiente', 'Nombre del Representante', 'Nombres y Apellidos Representante Legal', 'Nombre Completo del Acudiente', 'Nombre de acudiente', 'Representante legal', 'Representante', 'Nombre Padre/Madre/Acudiente'], { include: ['nombre'], exclude: ['camper', 'estudiante'] }),
                        cedulaRepresentante: getValue(row, [
                            'Número de documento del acudiente', 'Número de documento del representante',
                            'Número de documento acudiente', 'Número de documento representante',
                            'Número cédula representante', 'Cédula Representante', 'Cedula Representante',
                            'CC Representante', 'Cédula de ciudadanía acudiente', 'Cédula del acudiente',
                            'Documento del acudiente', 'No. Documento Acudiente', 'No. Documento Representante',
                            'Documento Representante', 'Número de documento Padre/Madre/Acudiente',
                            'No. Documento Padre/Madre/Acudiente', 'Cédula Padre/Madre/Acudiente'
                        ]) ||
                            getValue(row, [], { include: ['cedula', 'acudiente'] }) ||
                            getValue(row, [], { include: ['documento', 'acudiente'] }) ||
                            getValue(row, [], { include: ['cedula', 'representante'] }) ||
                            getValue(row, [], { include: ['documento', 'representante'] }),
                        tipoDocumentoCamper: getValue(row, ['Tipo de Documento Camper', 'Tipo Documento Camper', 'Tipo Documento', 'Tipo Doc', 'Tipo Doc Camper', 'TD', 'T.D.'], { include: ['tipo', 'documento'] }) || 'TI', // Por defecto TI si no se especifica
                        nombreCamper: getValue(row, ['Nombre completo Camper', 'Nombre Camper (estudiante)', 'Nombre Camper', 'Estudiante', 'Nombre', 'Nombres', 'Nombres y Apellidos', 'Nombre completo'], { include: ['nombre', 'camper'] }) ||
                            getValue(row, [], { include: ['nombre', 'estudiante'] }) ||
                            getValue(row, [], { include: ['nombre'], exclude: ['acudiente', 'representante', 'padre', 'madre'] }),
                        documentoCamper: getValue(row, ['Número de documento', 'Número tarjeta identidad Camper', 'Número cédula Camper', 'Tarjeta Identidad', 'TI', 'Cédula', 'Cedula', 'Documento', 'Cédula de ciudadanía', 'CC'], { include: ['documento', 'camper'] }) ||
                            getValue(row, [], { include: ['cedula', 'camper'] }) ||
                            getValue(row, [], { include: ['documento'], exclude: ['acudiente', 'representante', 'padre', 'madre'] }) ||
                            getValue(row, [], { include: ['cedula'], exclude: ['acudiente', 'representante', 'padre', 'madre'] }),
                        direccionCamper: getValue(row, ['Dirección de residencia', 'Dirección física Camper', 'Dirección', 'Direccion'], { include: ['direccion', 'camper'] }) ||
                            getValue(row, [], { include: ['dirección', 'camper'] }) ||
                            getValue(row, [], { include: ['direccion'], exclude: ['acudiente', 'representante'] }) ||
                            getValue(row, [], { include: ['dirección'], exclude: ['acudiente', 'representante'] }),
                        emailRepresentante: getValue(row, ['Email representante Camper', 'Email acudiente', 'Correo acudiente', 'EMAIL REP CAMPER', 'Correo del Acudiente', 'Email del Acudiente'], { include: ['correo', 'acudiente'] }) || getValue(row, [], { include: ['email', 'acudiente'] }),
                        emailCamper: getValue(row, ['Email Camper', 'Correo Camper', 'Correo Estudiante', 'Email Estudiante', 'Dirección de correo electrónico', 'Email', 'Correo', 'Correo Electrónico'], { include: ['correo', 'camper'] }) ||
                            getValue(row, [], { include: ['email', 'camper'] }) ||
                            getValue(row, [], { include: ['correo'], exclude: ['acudiente', 'representante'] }) ||
                            getValue(row, [], { include: ['email'], exclude: ['acudiente', 'representante'] }),
                        celularCamper: getValue(row, ['Número de celular', 'Celular Camper', 'Celular', 'Teléfono', 'Telefono', 'CELULAR CAMPER'], { include: ['celular', 'camper'] }) ||
                            getValue(row, [], { include: ['telefono', 'camper'] }) ||
                            getValue(row, [], { include: ['celular'], exclude: ['acudiente', 'representante'] }) ||
                            getValue(row, [], { include: ['telefono'], exclude: ['acudiente', 'representante'] }),
                        telefonoRepresentante: getValue(row, ['Número de contacto del acudiente', '# contacto del acudiente', 'Teléfono Representante', 'Telefono Representante', 'TELEFONO REP CAMPER', 'Celular del acudiente', 'Teléfono del acudiente'], { include: ['celular', 'acudiente'] }) ||
                            getValue(row, [], { include: ['telefono', 'acudiente'] }) ||
                            getValue(row, [], { include: ['contacto', 'acudiente'] }) ||
                            getValue(row, [], { include: ['celular', 'representante'] }) ||
                            getValue(row, [], { include: ['telefono', 'representante'] }) ||
                            getValue(row, [], { include: ['contacto', 'representante'] }),
                        // Campos Masivos
                        pagare: getValue(row, ['Pagaré', 'Pagare', '# Pagare', 'Numero Pagare']),
                        jornada: getValue(row, ['Jornada', 'Jornada de Estudio', 'Jornada Estudio'], { include: ['jornada'] }) || 'diurna',
                        fechaContrato: fechaContratoEntry?.value ?? '',
                        fechaContratoEsCeldaFecha: isDateCell(rowIndex, fechaContratoEntry?.key),
                        valorFormacion: getValue(row, ['Valor Formación', 'Valor Formacion', 'Valor Total de Formación', 'Valor Total']),
                        cuotas: getValue(row, ['Cuotas', 'Número de Cuotas', 'Numero Cuotas', 'N Cuotas']),
                        valorTotalObjetivo: getValue(row, ['Valor Total Objetivo', 'Valor Objetivo', 'Total Objetivo']),
                        filaExcel: typeof rowIndex === 'number' ? rowIndex + 1 : undefined,
                    } as CamperData;

                    // Extraer detalle de cuotas (hasta 20)
                    const cuotasDetalle: { valor: number; fecha: string; fechaEsCeldaFecha?: boolean }[] = [];
                    for (let i = 1; i <= 20; i++) {
                        const valorCuotaStr = getValue(row, [`Cuota ${i}`, `Valor Cuota ${i}`]);
                        const fechaCuotaEntry = findEntry(row, [`Fecha Cuota ${i}`, `Vencimiento Cuota ${i}`]);

                        if (valorCuotaStr) {
                            const valorParsed = parseCurrency(valorCuotaStr);
                            if (!isNaN(valorParsed) && valorParsed > 0) {
                                cuotasDetalle.push({
                                    valor: valorParsed,
                                    fecha: fechaCuotaEntry?.value ?? '',
                                    fechaEsCeldaFecha: isDateCell(rowIndex, fechaCuotaEntry?.key)
                                });
                            }
                        }
                    }
                    if (cuotasDetalle.length > 0) {
                        res.cuotasDetalle = cuotasDetalle;
                    }

                    console.log("Fila mapeada:", res);
                    return res;
                });

                resolve(parsedData);
            } catch (error) {
                console.error("Excel Parsing Error:", error);
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsBinaryString(file);
    });
};
