
import * as xlsx from 'xlsx';

export interface CamperData {
    nombreRepresentante: string;
    cedulaRepresentante: string;
    nombreCamper: string;
    documentoCamper: string;
    direccionCamper: string;
    emailRepresentante: string;
    emailCamper: string;
    celularCamper: string;
    telefonoRepresentante: string;
}

// Helper to find value from a row checking multiple possible headers
const getValue = (row: any, possibleHeaders: string[], fuzzyKeywords?: { include: string[], exclude?: string[] }): string => {
    // 1. Exact or case-insensitive match
    for (const header of possibleHeaders) {
        if (row[header] !== undefined && String(row[header]).trim() !== "") {
            return String(row[header]).trim();
        }
        const matchedKey = Object.keys(row).find(key => key.trim().toLowerCase() === header.toLowerCase());
        if (matchedKey && row[matchedKey] !== undefined && String(row[matchedKey]).trim() !== "") {
            return String(row[matchedKey]).trim();
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
                return String(row[key]).trim();
            }
        }
    }

    return '';
};

export const parseExcel = async (file: File): Promise<CamperData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = xlsx.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = xlsx.utils.sheet_to_json(sheet);

                console.log("Excel Headers (First Row keys):", Object.keys(jsonData[0] || {}));

                const parsedData: CamperData[] = jsonData.map((row: any) => {
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
                        nombreCamper: getValue(row, ['Nombre completo Camper', 'Nombre Camper (estudiante)', 'Nombre Camper', 'Estudiante', 'Nombre'], { include: ['nombre', 'camper'] }) || getValue(row, [], { include: ['nombre', 'estudiante'] }),
                        documentoCamper: getValue(row, ['Número de documento', 'Número tarjeta identidad Camper', 'Número cédula Camper', 'Tarjeta Identidad', 'TI', 'Cédula', 'Cedula', 'Documento'], { include: ['documento', 'camper'] }) || getValue(row, [], { include: ['cedula', 'camper'] }),
                        direccionCamper: getValue(row, ['Dirección de residencia', 'Dirección física Camper', 'Dirección', 'Direccion'], { include: ['direccion', 'camper'] }) || getValue(row, [], { include: ['dirección', 'camper'] }),
                        emailRepresentante: getValue(row, ['Email representante Camper', 'Email acudiente', 'Correo acudiente', 'EMAIL REP CAMPER', 'Correo del Acudiente', 'Email del Acudiente'], { include: ['correo', 'acudiente'] }) || getValue(row, [], { include: ['email', 'acudiente'] }),
                        emailCamper: getValue(row, ['Email Camper', 'Correo Camper', 'Correo Estudiante', 'Email Estudiante', 'Dirección de correo electrónico', 'Email', 'Correo', 'Correo Electrónico'], { include: ['correo', 'camper'] }) || getValue(row, [], { include: ['email', 'camper'] }),
                        celularCamper: getValue(row, ['Número de celular', 'Celular Camper', 'Celular', 'Teléfono', 'Telefono', 'CELULAR CAMPER'], { include: ['celular', 'camper'] }) || getValue(row, [], { include: ['telefono', 'camper'] }),
                        telefonoRepresentante: getValue(row, ['Número de contacto del acudiente', 'Teléfono Representante', 'Telefono Representante', 'TELEFONO REP CAMPER', 'Celular del acudiente', 'Teléfono del acudiente'], { include: ['celular', 'acudiente'] }) || getValue(row, [], { include: ['telefono', 'acudiente'] }),
                    };
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
