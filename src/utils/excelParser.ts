
import * as xlsx from 'xlsx';

export interface CamperData {
    nombreRepresentante: string;
    cedulaRepresentante: string;
    nombreCamper: string;
    documentoCamper: string;
    direccionCamper: string;
    emailRepresentante: string;
    celularCamper: string;
}

// Helper to find value from a row checking multiple possible headers
const getValue = (row: any, possibleHeaders: string[]): string => {
    for (const header of possibleHeaders) {
        if (row[header] !== undefined) {
            return String(row[header]).trim();
        }
        // Try trimming the header in the row object keys roughly
        const trimmedRow = Object.keys(row).find(key => key.trim() === header);
        if (trimmedRow && row[trimmedRow] !== undefined) {
            return String(row[trimmedRow]).trim();
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

                const parsedData: CamperData[] = jsonData.map((row: any) => ({
                    nombreRepresentante: getValue(row, ['Nombre completo representante', 'Nombre Representante', 'Acudiente']),
                    cedulaRepresentante: getValue(row, ['Número cédula representante', 'Cédula Representante', 'Cedula Representante', 'CC Representante']),
                    nombreCamper: getValue(row, ['Nombre Camper (estudiante)', 'Nombre Camper', 'Estudiante', 'Nombre']),
                    documentoCamper: getValue(row, ['Número tarjeta identidad Camper', 'Número cédula Camper', 'Tarjeta Identidad', 'TI', 'Cédula', 'Cedula', 'Documento']),
                    direccionCamper: getValue(row, ['Dirección física Camper', 'Dirección', 'Direccion']),
                    emailRepresentante: getValue(row, ['Email representante Camper', 'Email', 'Correo', 'Correo Electrónico']),
                    celularCamper: getValue(row, ['Celular Camper', 'Celular', 'Teléfono', 'Telefono']),
                }));

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
