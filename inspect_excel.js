
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const require = createRequire(import.meta.url);
const xlsx = require('xlsx');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'public/contratos/datos_prueba_contratos.xlsx');
console.log("Reading file from:", filePath);

if (!fs.existsSync(filePath)) {
    console.error("File not found!");
    process.exit(1);
}

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Get first row as headers
    const headers = [];
    const range = xlsx.utils.decode_range(sheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = sheet[xlsx.utils.encode_cell({ r: 0, c: C })];
        headers.push(cell ? cell.v : undefined);
    }
    console.log("Headers detected:", JSON.stringify(headers));
} catch (error) {
    console.error("Error reading excel:", error);
}
