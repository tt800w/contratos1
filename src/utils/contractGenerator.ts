import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

export interface UnifiedContractData {
    raw: any;
    extraData?: {
        pagare?: string;
        fechaContrato?: string;
        cuotas?: string;
        [key: string]: any;
    };
}

import { formatCurrencySpanish, numberToSpanishWords } from './numberToWords';

const runDocumentQualityPass = (zip: PizZip) => {
    const documentXml = zip.file("word/document.xml")?.asText();
    if (!documentXml) return;

    const getWordParagraphText = (paragraph: string) =>
        Array.from(paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g))
            .map((m) => m[1]).join('').replace(/&[a-z]+;/gi, '');

    const isEmptyWordParagraph = (paragraph: string) =>
        !getWordParagraphText(paragraph).trim() &&
        !/<w:(?:drawing|pict|tbl|object|sectPr|br)\b/.test(paragraph);

    let count = 0;
    let xml = documentXml.replace(/<w:p[\s\S]*?<\/w:p>/g, (p) => {
        if (!isEmptyWordParagraph(p)) {
            count = 0;
            return p;
        }
        count++;
        return count > 1 ? '' : p;
    });

    const startsFlexibleSection = (text: string) =>
        /^(PAGARÉ\s*(NO\.?|N\.?|#)?|Señores(?:,|\s|$)|ANEXOS?\b|FIRMAS?\b|CONDICIONES ESPECIFICAS\b)/i.test(text.trim());

    let lastWasPageBreak = false;
    xml = xml.replace(/<w:p[\s\S]*?<\/w:p>/g, (p) => {
        const text = getWordParagraphText(p);
        const hasNativePageBreak = /<w:br\b[^>]*w:type="page"[^>]*\/>/g.test(p) || /<w:pageBreakBefore\b/.test(p);

        let result = p;
        if (startsFlexibleSection(text)) {
            if (!hasNativePageBreak && !lastWasPageBreak) {
                result = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' + p;
                lastWasPageBreak = true;
            }
        }

        if (hasNativePageBreak || result !== p) {
            lastWasPageBreak = true;
        } else if (text.trim() !== "") {
            lastWasPageBreak = false;
        }

        return result;
    });

    if (xml !== documentXml) zip.file("word/document.xml", xml);
};

export const prepareUnifiedData = (raw: any, extraData: any = {}) => {
    const fechaObj = extraData.fechaContrato ? new Date(extraData.fechaContrato + 'T00:00:00') : new Date();
    const dia = fechaObj.getDate().toString();
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mes = meses[fechaObj.getMonth()];
    const ano = fechaObj.getFullYear().toString();

    const numCuotasTotal = extraData.isPP ? 1 : (parseInt(extraData.cuotas) || 1);
    let planPagos = "";
    let cuotasList: any[] = [];

    // Lógica específica para Recursos Propios y Pronto Pago
    if (extraData.isRP || extraData.isPP) {
        const TOTAL_OBJETIVO = extraData.isPP ? 12000000 : (extraData.totalObjetivo || 13000000);

        if (extraData.isPP) {
            const fecha = extraData.fechasCuotas?.[0];
            const fechaTexto = fecha ? `con una fecha limite de pago de ${fecha} ` : "";
            planPagos = `${formatCurrencySpanish(TOTAL_OBJETIVO)} ${fechaTexto}al momento de la firma del presente documento.`;
        } else if (extraData.modoPago === 'manual' && Array.isArray(extraData.manualCuotas)) {
            // Modo Manual (Solo para RP)
            planPagos = "";
            extraData.manualCuotas.forEach((valor: number, index: number) => {
                const label = `CUOTA ${index + 1}:`;
                const fecha = extraData.fechasCuotas?.[index];
                const fechaTexto = fecha ? `con una fecha limite de pago de ${fecha} ` : "";

                cuotasList.push({
                    titulo: label,
                    valor: `${formatCurrencySpanish(valor).toUpperCase()}`,
                    fecha_prefijo: fecha ? " con una fecha límite de pago de " : "",
                    fecha_bold: fecha || "",
                    fecha_sufijo: fecha ? " al momento de la firma del presente documento." : " al momento de la firma del presente documento."
                });
            });
        } else {
            const TOTAL_OBJETIVO = extraData.isPP ? 12000000 : (extraData.totalObjetivo || 13000000);
            const numCuotasTotal = extraData.isPP ? 1 : (parseInt(extraData.cuotas) || 1);
            const valorCuota = Math.floor(TOTAL_OBJETIVO / numCuotasTotal);
            const ajusteUltimaCuota = TOTAL_OBJETIVO - (valorCuota * (numCuotasTotal - 1));

            for (let i = 1; i <= numCuotasTotal; i++) {
                const label = `CUOTA ${i}:`;
                const valorAUsar = (i === numCuotasTotal) ? ajusteUltimaCuota : valorCuota;
                const fecha = extraData.fechasCuotas?.[i - 1];
                const fechaTexto = fecha ? `con una fecha limite de pago de ${fecha} ` : "";

                cuotasList.push({
                    titulo: label,
                    valor: `${formatCurrencySpanish(valorAUsar).toUpperCase()}`,
                    fecha_prefijo: fecha ? " con una fecha límite de pago de " : "",
                    fecha_bold: fecha || "",
                    fecha_sufijo: fecha ? " al momento de la firma del presente documento." : " al momento de la firma del presente documento."
                });
            }
        }
    }

    return {
        // Camper data with variations
        "NOMBRE DEL CAMPER": raw.nombreCamper || "",
        "NUMERO DE CEDULA": extraData.isMinor ? raw.cedulaRepresentante : raw.documentoCamper || "",
        "NUMERO DE TARJETA DE IDENTIDAD": raw.documentoCamper || "",
        "DOCUMENTO": raw.documentoCamper || "",
        "NUMERO DE DOCUMENTO": raw.documentoCamper || "",

        "DIRECCION FISICA CAMPER": raw.direccionCamper || "",
        "DIRECCION FISICA DEL CAMPER": raw.direccionCamper || "",
        "DIRECCION": raw.direccionCamper || "",
        "CIUDAD": "Bucaramanga",
        "CIUDAD DE RESIDENCIA": "Bucaramanga",
        "TELEFONO CAMPER": raw.celularCamper || raw.telefonoCamper || "",
        "CELULAR CAMPER": raw.celularCamper || raw.telefonoCamper || "",
        "CELULAR": raw.celularCamper || raw.telefonoCamper || "",
        "TELEFONO": raw.celularCamper || raw.telefonoCamper || "",

        "EMAIL CAMPER": raw.emailCamper || raw.emailRepresentante || "",
        "EMAIL REP CAMPER": raw.emailRepresentante || "",
        "CORREO": raw.emailRepresentante || raw.emailCamper || "",

        // Representative data
        "NOMBRE COMPLETO REP": raw.nombreRepresentante || "",
        "NOMBRE DEL REPRESENTANTE LEGAL": raw.nombreRepresentante || "",
        "NOMBRE REPRESENTANTE": raw.nombreRepresentante || "",
        "CEDULA REP DEL CAMPER": raw.cedulaRepresentante || "",
        "CEDULA REPRESENTANTE": raw.cedulaRepresentante || "",

        "TELEFONO REP CAMPER": raw.telefonoRepresentante || "",
        "TELEFONO REPRESENTANTE": raw.telefonoRepresentante || "",
        "CELULAR REPRESENTANTE": raw.telefonoRepresentante || "",

        // Date variations
        "dia": dia,
        "mes": mes,
        "año": ano,
        "ano": ano,
        "AÑO": ano,
        "ANO": ano,

        // Additional fields
        "NUMERO DE PAGARE": extraData.pagare || '____________________',
        "PAGARE": extraData.pagare || '____________________',
        "numero_cuotas": extraData.isPP ? "1" : (extraData.cuotas || ''),
        "CUOTAS": extraData.isPP ? "1" : (extraData.cuotas || ''),
        "PLAN_PAGOS": planPagos,
        "CUOTAS_LIST": cuotasList,
        "FECHA_PAGO": extraData.fechasCuotas?.[0] || "",
        "FECHA_LIMITE_PAGO": extraData.fechasCuotas?.[0] || "",
        "VALOR_TOTAL_NUMEROS": extraData.isRP || extraData.isPP ? `$ ${new Intl.NumberFormat('es-CO', { style: 'decimal', maximumFractionDigits: 0 }).format(extraData.isPP ? 12000000 : (extraData.totalObjetivo || 13000000))}` : "",
        "VALOR_TOTAL_LETRAS": extraData.isRP || extraData.isPP ? numberToSpanishWords(extraData.isPP ? 12000000 : (extraData.totalObjetivo || 13000000)).trim() : "",
        "VALOR_TOTAL_LETRAS_UPPER": extraData.isRP || extraData.isPP ? numberToSpanishWords(extraData.isPP ? 12000000 : (extraData.totalObjetivo || 13000000)).trim().toUpperCase() : "",
        "VALOR_FORMACION_NUMEROS": extraData.valorFormacion ? `$ ${new Intl.NumberFormat('es-CO', { style: 'decimal', maximumFractionDigits: 0 }).format(parseInt(extraData.valorFormacion))}` : "",
        "VALOR_FORMACION_LETRAS": extraData.valorFormacion ? numberToSpanishWords(parseInt(extraData.valorFormacion)).trim() : "",

        // Include everything from extraData just in case
        ...extraData
    };
};

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
            nullGetter: () => ""
        });

        // Add a check for valid data
        if (!data || Object.keys(data).length === 0) {
            console.warn("Contract data is empty!");
        }

        try {
            doc.render(data);
            runDocumentQualityPass(doc.getZip());
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

/**
 * Genera el nombre del archivo del contrato siguiendo el formato estándar:
 * [Pagaré]. Condiciones Especificas - [Tipo] - [Nombre]
 */
export const getContractFileName = (
    pagare: string,
    tipo: string,
    nombre: string,
    extension: 'docx' | 'pdf',
    customName?: string
) => {
    if (customName) {
        return customName.toLowerCase().endsWith(`.${extension}`)
            ? customName
            : `${customName}.${extension}`;
    }

    const pagarePath = pagare ? `${pagare}. ` : "";
    const cleanNombre = nombre.trim();
    return `${pagarePath}Condiciones Especificas - ${tipo} - ${cleanNombre}.${extension}`;
};

/**
 * Genera un PDF a partir del contenido renderizado en el DOM.
 * Requiere que la librería html2pdf.js esté instalada/disponible.
 */
export const downloadAsPDF = async (elementId: string, outputName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error("No se encontró el elemento para generar el PDF");
    }

    // Wait a bit for any pending renders
    await new Promise(resolve => setTimeout(resolve, 500));

    // Guardar el transform original para restaurarlo luego
    const originalTransform = element.style.transform;
    const originalTransition = element.style.transition;
    const originalVisibility = element.style.visibility;
    
    // Inyectar un estilo temporal para la impresión
    const printStyle = document.createElement('style');
    printStyle.innerHTML = `
        #${elementId} {
            transform: none !important;
            width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
        }
        #${elementId} section {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 0 !important;
            margin-bottom: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            box-sizing: border-box !important;
        }
    `;
    document.head.appendChild(printStyle);

    try {
        // Desactivar animaciones y transformaciones para una captura limpia
        element.style.transition = 'none';
        element.style.transform = 'none';
        element.style.visibility = 'visible';

        // @ts-ignore
        const html2pdf = (await import('html2pdf.js')).default;

        const opt = {
            margin: 15,
            filename: outputName,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 2, // 2 es suficiente y más estable que 3
                useCORS: true,
                logging: false,
                allowTaint: false,
                scrollY: 0,
                scrollX: 0
            },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const, compress: true },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        const doc = html2pdf().set(opt).from(element);
        await doc.save();

        // Restaurar estado original
        element.style.transform = originalTransform;
        element.style.transition = originalTransition;
        element.style.visibility = originalVisibility;
        document.head.removeChild(printStyle);
        return true;
    } catch (error: any) {
        element.style.transform = originalTransform;
        element.style.transition = originalTransition;
        element.style.visibility = originalVisibility;
        document.head.removeChild(printStyle);
        console.error('Error generando PDF con html2pdf:', error);
        throw new Error(error.message || "Error desconocido al generar PDF");
    }
};

/**
 * Convierte un Blob de DOCX a PDF usando ConvertAPI (Backend-based conversion).
 * Garantiza 100% de retención del formato nativo de Word.
 */
export const downloadAsNativePDF = async (docxBlob: Blob, outputName: string) => {
    const convertApiSecret = import.meta.env.VITE_CONVERTAPI_SECRET;
    
    if (!convertApiSecret) {
        throw new Error("Falta la clave VITE_CONVERTAPI_SECRET en el archivo .env. Regístrate en convertapi.com y añádela.");
    }

    const formData = new FormData();
    formData.append('File', docxBlob, outputName.replace('.pdf', '.docx'));

    try {
        const response = await fetch(`https://v2.convertapi.com/convert/docx/to/pdf?Secret=${convertApiSecret}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error en el servidor de conversión: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data && data.Files && data.Files.length > 0) {
            const base64Data = data.Files[0].FileData;
            
            // Decodificar Base64 a Blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
            
            saveAs(pdfBlob, outputName);
            return true;
        } else {
             throw new Error("El servicio no retornó el archivo PDF.");
        }
    } catch (error: any) {
        console.error("Error en conversión nativa a PDF:", error);
        throw new Error(error.message || "Error al contactar el servicio de conversión");
    }
};
