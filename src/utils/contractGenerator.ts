import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

export const generateContract = async (templateUrl: string, data: any, outputName: string, returnBlob: boolean = false) => {
    try {
        const response = await fetch(templateUrl);
        if (!response.ok) {
            throw new Error(`No se pudo cargar la plantilla: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const zip = new PizZip(arrayBuffer);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render(data);

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
    } catch (error) {
        console.error('Error al generar el contrato:', error);
        throw error;
    }
};
