import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

export const generateContract = async (templateUrl: string, data: any, outputName: string, returnBlob: boolean = false) => {
    try {
        console.log("Generating contract with data:", JSON.stringify(data, null, 2));

        // Ensure URL is encoded to handle spaces and special characters
        const encodedUrl = encodeURI(templateUrl);
        const response = await fetch(encodedUrl);

        if (!response.ok) {
            throw new Error(`No se pudo cargar la plantilla (${response.status}): ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const zip = new PizZip(arrayBuffer);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: {
                start: "{",
                end: "}"
            }
        });

        // Add a check for valid data
        if (!data || Object.keys(data).length === 0) {
            console.warn("Contract data is empty!");
        }

        try {
            doc.render(data);
        } catch (error: any) {
            console.error("Docxtemplater Render Error Object:", error);

            // Check for MultiError from docxtemplater with explicit properties check
            if (error.properties && Array.isArray(error.properties.errors)) {
                if (error.properties.errors.length > 0) {
                    const errorMessages = error.properties.errors
                        .map((err: any) => {
                            // Try various properties where the tag name might be
                            const tag = err.properties?.id || err.properties?.name || err.properties?.tagName || "etiqueta desconocida";
                            const expl = err.properties?.explanation || err.message || "Error de sintaxis";
                            // Translate common errors
                            const translatedExpl = expl.replace("The tag beginning with", "La etiqueta que empieza por")
                                .replace("is unopened", "no está abierta correctamente")
                                .replace("is unclosed", "no está cerrada correctamente");
                            return `- Error en etiqueta '${tag}': ${translatedExpl}`;
                        })
                        .join("\n");

                    throw new Error(`La plantilla tiene errores de formato (MultiError):\n${errorMessages}`);
                }
            }

            // Fallback: Dump properties if they exist but we couldn't parse them smoothly
            if (error.properties) {
                const dump = JSON.stringify(error.properties, null, 2);
                throw new Error(`Error de formato en la plantilla (Detalles técnicos): ${dump}`);
            }

            // Standard error
            const suggestion = "Verifique que la plantilla .docx no tenga errores de sintaxis en las etiquetas (ej: {{...}} mal cerrados).";
            throw new Error(`Error crítico al renderizar: ${error.message || error}. ${suggestion}`);
        }

        const out = doc.getZip().generate({
            type: 'blob',
            mimeType:
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        if (returnBlob) {
            return out;
        }

        saveAs(out, outputName);
        return true;
    } catch (error: any) {
        console.error('Error al generar el contrato:', error);
        // Throw the specific error message so it can be shown to the user
        throw new Error(error.message || "Error desconocido al generar contrato");
    }
};
