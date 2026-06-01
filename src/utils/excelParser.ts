import * as xlsx from "xlsx";

export interface CamperData {
  nombreRepresentante: string;
  cedulaRepresentante: string;
  nombreCamper: string;
  documentoCamper: string;
  tipoIdentificacion?: string;
  direccionCamper: string;
  emailRepresentante: string;
  emailCamper: string;
  celularCamper: string;
  telefonoRepresentante: string;
  fechaNacimiento?: string;
  edad?: string;
}

// Helper to find value from a row checking multiple possible headers
const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const getValue = (row: any, possibleHeaders: string[]): string => {
  const normalizedHeaders = possibleHeaders.map(normalizeHeader);

  for (const header of possibleHeaders) {
    if (row[header] !== undefined) {
      return String(row[header]).trim();
    }
    // Try trimming the header in the row object keys roughly
    const trimmedRow = Object.keys(row).find((key) => key.trim() === header);
    if (trimmedRow && row[trimmedRow] !== undefined) {
      return String(row[trimmedRow]).trim();
    }
  }

  const normalizedRowKey = Object.keys(row).find((key) =>
    normalizedHeaders.includes(normalizeHeader(key)),
  );
  if (normalizedRowKey && row[normalizedRowKey] !== undefined) {
    return String(row[normalizedRowKey]).trim();
  }

  return "";
};

export const parseExcel = async (file: File): Promise<CamperData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = xlsx.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);

        console.log(
          "Excel Headers (First Row keys):",
          Object.keys(jsonData[0] || {}),
        );

        const parsedData: CamperData[] = jsonData.map((row: any) => {
          const res = {
            nombreRepresentante: getValue(row, [
              "Nombre del representante completo",
              "NOMBRE DEL REPRESENTANTE LEGAL",
              "Nombre y apellido del acudiente",
              "Nombre completo representante",
              "Nombre Representante",
              "Acudiente",
            ]),
            cedulaRepresentante: getValue(row, [
              "Número del documento del acudiente",
              "Numero del documento del acudiente",
              "NUMERO DE CEDULA",
              "Número de documento del acudiente",
              "Número cédula representante",
              "Cédula Representante",
              "Cedula Representante",
              "CC Representante",
            ]),
            nombreCamper: getValue(row, [
              "Nombre completo del estudiante",
              "NOMBRE DEL CAMPER",
              "Nombre completo Camper",
              "Nombre Camper (estudiante)",
              "Nombre Camper",
              "Estudiante",
              "Nombre",
            ]),
            documentoCamper: getValue(row, [
              "Número del documento estudiante",
              "Numero del documento estudiante",
              "Número de documento estudiante",
              "Numero de documento estudiante",
              "NUMERO DE DOCUMENTO",
              "Número de documento",
              "Número tarjeta identidad Camper",
              "Número cédula Camper",
              "Tarjeta Identidad",
              "TI",
              "Cédula",
              "Cedula",
              "Documento",
            ]),
            tipoIdentificacion: getValue(row, [
              "Tipo de identificación",
              "Tipo Identificacion",
              "Tipo de Identificacion",
              "Tipo ID",
              "Tipo_ID",
            ]),
            direccionCamper: getValue(row, [
              "Dirección de residencia",
              "Direccion de residencia",
              "DIRECCION FISICA DEL CAMPER",
              "Dirección de residencia",
              "Dirección física Camper",
              "Dirección",
              "Direccion",
            ]),
            emailRepresentante: getValue(row, [
              "Dirección electrónica del acudiente",
              "Direccion electronica del acudiente",
              "Dirección electrónica del representante",
              "Direccion electronica del representante",
              "Correo electrónico del representante",
              "Correo electronico del representante",
              "EMAIL REPRESENTANTE",
              "Email representante Camper",
              "Email acudiente",
              "Correo acudiente",
              "EMAIL REP CAMPER",
              "Correo Electrónico",
            ]),
            emailCamper: getValue(row, [
              "Dirección electrónica del estudiante",
              "Direccion electronica del estudiante",
              "Dirección electrónica del estudiante",
              "Dirección electrónica del camper",
              "Direccion electronica del camper",
              "Correo electrónico del estudiante",
              "Correo electronico del estudiante",
              "Correo electrónico del camper",
              "Correo electronico del camper",
              "Dirección de correo electrónico del camper",
              "Direccion de correo electronico del camper",
              "Dirección de correo electrónico",
              "Direccion de correo electronico",
              "EMAIL CAMPER",
              "Email Camper",
              "Correo Camper",
              "Correo Estudiante",
              "Email Estudiante",
              "Email",
              "Correo",
            ]),
            celularCamper: getValue(row, [
              "Contacto del estudiante",
              "CELULAR CAMPER",
              "Número de celular",
              "Celular Camper",
              "Celular",
              "Teléfono",
              "Telefono",
              "CELULAR CAMPER",
            ]),
            telefonoRepresentante: getValue(row, [
              "Contacto del acudiente",
              "CELULAR REPRESENTANTE",
              "Número de contacto del acudiente",
              "Teléfono Representante",
              "Telefono Representante",
              "TELEFONO REP CAMPER",
            ]),
            fechaNacimiento: getValue(row, [
              "Fecha de nacimiento",
              "Nacimiento",
              "Fecha nacimiento",
              "Fecha Nacimiento",
              "DOB",
            ]),
            edad: getValue(row, ["Edad", "Age"]),
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
