const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'contratos', 'Excel prueba de contrato.xlsx');
try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet to JSON with header: 1 to get array of arrays
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (data.length > 0) {
        console.log("Headers:", JSON.stringify(data[0], null, 2));
        // Print first row of data to see values
        if (data.length > 1) {
            console.log("First Row Data:", JSON.stringify(data[1], null, 2));
        }
    } else {
        console.log("Empty Excel file");
    }
} catch (error) {
    console.error("Error reading file:", error.message);
}
