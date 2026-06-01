import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { formatCurrencySpanish, numberToSpanishWords } from "./numberToWords";

export interface UnifiedContractData {
  raw: any;
  extraData?: {
    pagare?: string;
    fechaContrato?: string;
    cuotas?: string;
    includePaymentPlan?: boolean;
    amortSchedule?: { installment: number; amount: number; dueDate: string }[];
    [key: string]: any;
  };
}

// ─── Helpers de formato ───────────────────────────────────────────────────────

const formatCurrencyNumber = (value: number) =>
  `$${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value)}`;

const formatDateDisplay = (value: string) => {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return value;
};

const escapeXml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const hasPaymentPlanTag = (text: string) =>
  text.includes("{PLAN_PAGOS}") || text.includes("{PLAN DE PAGOS}");

// ─────────────────────────────────────────────────────────────────────────────
// TABLA DE AMORTIZACIÓN — ancho completo de página A4 con márgenes estándar
//
// Página A4 = 11906 dxa de ancho total.
// Márgenes Word estándar: izquierdo 1800 dxa + derecho 1800 dxa = 3600 dxa.
// Área útil disponible: 11906 − 3600 = 8306 dxa  → usamos 8300 dxa.
//
// Distribución de columnas (suma = 8300 dxa):
//   #      →  700 dxa   ( 8.4 %)
//   Fecha  → 2200 dxa   (26.5 %)
//   Cuota  → 2700 dxa   (32.5 %)
//   Saldo  → 2700 dxa   (32.5 %)
// ─────────────────────────────────────────────────────────────────────────────
const TABLE_TOTAL_WIDTH = 8300; // dxa — área útil completa

type AmortizationRow = {
  installment: number;
  amount: number;
  dueDate: string;
};

const normalizeAmortizationSchedule = (
  amortSchedule: AmortizationRow[],
): AmortizationRow[] => {
  const ordered = [...amortSchedule].sort(
    (a, b) => Number(a.installment || 0) - Number(b.installment || 0),
  );
  const total = Math.round(
    ordered.reduce((sum, item) => sum + Number(item.amount || 0), 0),
  );
  let accumulated = 0;

  return ordered.map((item, index) => {
    const isLast = index === ordered.length - 1;
    const amount = isLast
      ? Math.max(0, total - accumulated)
      : Math.max(0, Math.round(Number(item.amount || 0)));

    accumulated += amount;

    return {
      installment: index + 1,
      amount,
      dueDate: item.dueDate,
    };
  });
};

const buildAmortizationTableXml = (
  amortSchedule: AmortizationRow[],
) => {
  const normalizedSchedule = normalizeAmortizationSchedule(amortSchedule);
  const columns = [
    { title: "#", width: 700 },
    { title: "Fecha", width: 2200 },
    { title: "Cuota", width: 2700 },
    { title: "Saldo", width: 2700 },
  ];

  const headerShading = `<w:shd w:val="clear" w:color="auto" w:fill="1F3864"/>`;
  const headerFont = `<w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>`;
  const dataFont = `<w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>`;

  const headerCells = columns
    .map(
      (col) =>
        `<w:tc>` +
        `<w:tcPr>` +
        `<w:tcW w:w="${col.width}" w:type="dxa"/>` +
        `<w:vAlign w:val="center"/>` +
        headerShading +
        `</w:tcPr>` +
        `<w:p>` +
        `<w:pPr><w:jc w:val="center"/></w:pPr>` +
        `<w:r>${headerFont}<w:t>${escapeXml(col.title)}</w:t></w:r>` +
        `</w:p>` +
        `</w:tc>`,
    )
    .join("");

  let remaining = normalizedSchedule.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const rows = normalizedSchedule
    .map((item, rowIndex) => {
      const amount = Number(item.amount || 0);
      remaining = Math.max(0, remaining - amount);

      const cells = [
        `${item.installment}`,
        formatDateDisplay(item.dueDate),
        formatCurrencyNumber(amount),
        formatCurrencyNumber(remaining),
      ];

      const rowFill = rowIndex % 2 === 0 ? "FFFFFF" : "EEF2F7";
      const rowShading = `<w:shd w:val="clear" w:color="auto" w:fill="${rowFill}"/>`;

      return (
        `<w:tr><w:trPr><w:cantSplit/></w:trPr>` +
        cells
          .map((cellText, colIndex) => {
            const align =
              colIndex === 0 ? "center" : colIndex >= 2 ? "right" : "left";
            return (
              `<w:tc>` +
              `<w:tcPr>` +
              `<w:tcW w:w="${columns[colIndex].width}" w:type="dxa"/>` +
              `<w:vAlign w:val="center"/>` +
              rowShading +
              `</w:tcPr>` +
              `<w:p>` +
              `<w:pPr><w:jc w:val="${align}"/></w:pPr>` +
              `<w:r>${dataFont}<w:t xml:space="preserve">${escapeXml(cellText)}</w:t></w:r>` +
              `</w:p>` +
              `</w:tc>`
            );
          })
          .join("") +
        `</w:tr>`
      );
    })
    .join("");

  return `
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="${TABLE_TOTAL_WIDTH}" w:type="dxa"/>
    <w:tblLayout w:type="autofit"/>
    <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
    <w:tblBorders>
      <w:top     w:val="single" w:sz="4" w:space="0" w:color="1F3864"/>
      <w:left    w:val="single" w:sz="4" w:space="0" w:color="1F3864"/>
      <w:bottom  w:val="single" w:sz="4" w:space="0" w:color="1F3864"/>
      <w:right   w:val="single" w:sz="4" w:space="0" w:color="1F3864"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="BDC9D7"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="BDC9D7"/>
    </w:tblBorders>
    <w:tblCellMar>
      <w:top    w:w="80"  w:type="dxa"/>
      <w:left   w:w="120" w:type="dxa"/>
      <w:bottom w:w="80"  w:type="dxa"/>
      <w:right  w:w="120" w:type="dxa"/>
    </w:tblCellMar>
  </w:tblPr>
  <w:tblGrid>
    ${columns.map((col) => `<w:gridCol w:w="${col.width}"/>`).join("")}
  </w:tblGrid>
  <w:tr>${headerCells}</w:tr>
  ${rows}
</w:tbl>
`;
};

// ─── Inyección / eliminación de la tabla en el XML del documento ──────────────

const injectAmortizationTableIntoDocument = (
  zip: PizZip,
  amortSchedule: AmortizationRow[],
) => {
  if (!amortSchedule || amortSchedule.length === 0) return;

  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) return;

  const tableXml = buildAmortizationTableXml(amortSchedule);
  const updatedXml = documentXml.replace(
    /<w:p[\s\S]*?<\/w:p>/g,
    (paragraph) => {
      const paragraphText = Array.from(
        paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g),
      )
        .map((match) => match[1])
        .join("");
      return hasPaymentPlanTag(paragraphText) ? tableXml : paragraph;
    },
  );

  if (updatedXml !== documentXml) zip.file("word/document.xml", updatedXml);
};

const removePaymentPlanFromDocument = (zip: PizZip) => {
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) return;

  const paragraphs = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g);
  if (!paragraphs) return;

  const updatedParagraphs = [...paragraphs];

  paragraphs.forEach((paragraph, index) => {
    if (!hasPaymentPlanTag(getWordParagraphText(paragraph))) return;

    updatedParagraphs[index] = "";

    const prev = index - 1;
    if (prev < 0) return;

    const prevText = normalizeWordText(
      getWordParagraphText(updatedParagraphs[prev]),
    );
    if (
      /^(PLAN DE PAGOS|TABLA DE AMORTIZACION|TABLAS DE AMORTIZACION)$/.test(
        prevText,
      )
    ) {
      updatedParagraphs[prev] = "";
    }
  });

  let pi = 0;
  const updatedXml = documentXml.replace(/<w:p[\s\S]*?<\/w:p>/g, () => {
    return updatedParagraphs[pi++] ?? "";
  });

  if (updatedXml !== documentXml) zip.file("word/document.xml", updatedXml);
};

// ─── Helpers de texto Word ────────────────────────────────────────────────────

const getWordParagraphText = (paragraph: string) =>
  Array.from(paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g))
    .map((m) => m[1])
    .join("")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

const normalizeWordText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

// ─── Pasadas de calidad sobre el documento ────────────────────────────────────

const normalizeTextSpacing = (zip: PizZip) => {
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) return;

  const updatedXml = documentXml.replace(
    /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g,
    (textNode, attributes, value) => {
      const norm = (value as string).replace(/[ \t]{2,}/g, " ");
      return norm === value ? textNode : `<w:t${attributes}>${norm}</w:t>`;
    },
  );

  if (updatedXml !== documentXml) zip.file("word/document.xml", updatedXml);
};

const removeForcedPagination = (paragraph: string) =>
  paragraph
    .replace(/<w:pageBreakBefore\b[^>]*\/>/g, "")
    .replace(/<w:br\b[^>]*w:type="page"[^>]*\/>/g, "")
    .replace(/<w:lastRenderedPageBreak\/>/g, "");

const isEmptyWordParagraph = (paragraph: string) =>
  !normalizeWordText(getWordParagraphText(paragraph)) &&
  !/<w:(?:drawing|pict|tbl|object|sectPr|br)\b/.test(paragraph);

const removeExcessEmptyParagraphs = (zip: PizZip) => {
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) return;

  let count = 0;
  const updatedXml = documentXml.replace(/<w:p[\s\S]*?<\/w:p>/g, (p) => {
    if (!isEmptyWordParagraph(p)) {
      count = 0;
      return p;
    }
    count++;
    return count > 1 ? "" : p;
  });

  if (updatedXml !== documentXml) zip.file("word/document.xml", updatedXml);
};

const auditDocumentLayout = (zip: PizZip) => {
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) return;

  const clauseNumbers = Array.from(documentXml.matchAll(/<w:p[\s\S]*?<\/w:p>/g))
    .map((m) => normalizeWordText(getWordParagraphText(m[0])))
    .map((text) => text.match(/^(?:CLAUSULA\s+)?(\d+)[\.\)]\s+/)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number);

  const repeated = clauseNumbers.filter(
    (n, i) => i > 0 && clauseNumbers[i - 1] === n,
  );

  if (repeated.length > 0) {
    console.warn(
      "Control de calidad del contrato: posible numeración repetida",
      repeated,
    );
  }
};

const startsFlexibleSection = (text: string) =>
  /^(PAGARE\s*(NO\.?|N\.?|#)?|CARTA DE INSTRUCCIONES|ANEXOS?|FIRMAS?|CONDICIONES ESPECIFICAS|TABLAS? DE AMORTIZACION)\b/.test(
    text,
  );

const removeUnnecessaryPaginationBreaks = (zip: PizZip) => {
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) return;

  const paragraphs = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g);
  if (!paragraphs) return;

  const updated = [...paragraphs];

  paragraphs.forEach((p, i) => {
    if (!startsFlexibleSection(normalizeWordText(getWordParagraphText(p))))
      return;

    updated[i] = removeForcedPagination(p);

    const prev = i - 1;
    if (prev < 0) return;

    const cleanPrev = removeForcedPagination(updated[prev]);
    updated[prev] = isEmptyWordParagraph(cleanPrev) ? "" : cleanPrev;
  });

  let pi = 0;
  const updatedXml = documentXml.replace(
    /<w:p[\s\S]*?<\/w:p>/g,
    () => updated[pi++] ?? "",
  );

  if (updatedXml !== documentXml) zip.file("word/document.xml", updatedXml);
};

const runDocumentQualityPass = (zip: PizZip) => {
  normalizeTextSpacing(zip);
  removeUnnecessaryPaginationBreaks(zip);
  removeExcessEmptyParagraphs(zip);
  auditDocumentLayout(zip);
};

// ─── Preparación de datos para la plantilla ───────────────────────────────────

export const prepareUnifiedData = (raw: any, extraData: any = {}) => {
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const fechaObj = extraData.fechaContrato
    ? new Date(extraData.fechaContrato)
    : new Date();

  const dia = fechaObj.getDate().toString();
  const mes = meses[fechaObj.getMonth()];
  const ano = fechaObj.getFullYear().toString();

  const numCuotasTotal = extraData.isPP ? 1 : parseInt(extraData.cuotas) || 1;
  let planPagos = "";

  // Helper: construye el texto del plan de pagos a partir de un schedule
  const buildPlanPagosLines = (
    schedule: { installment: number; amount: number; dueDate: string }[],
  ): string => {
    const total = schedule.reduce((s, it) => s + Number(it.amount || 0), 0);
    let acumulado = 0;
    return schedule
      .map((item, idx) => {
        const amt = Number(item.amount || 0);
        acumulado += amt;
        const restante = Math.max(0, total - acumulado);
        const cuota = item.installment ?? idx + 1;
        const fmtCuota = new Intl.NumberFormat("es-CO", {
          maximumFractionDigits: 0,
        }).format(amt);
        const fmtRestante = new Intl.NumberFormat("es-CO", {
          maximumFractionDigits: 0,
        }).format(restante);
        return `Cuota: ${cuota}; Fecha: ${item.dueDate || ""}; Monto: $${fmtCuota}; Valor pendiente a pagar: $${fmtRestante}`;
      })
      .join("\n");
  };

  if (
    Array.isArray(extraData.amortSchedule) &&
    extraData.amortSchedule.length > 0
  ) {
    planPagos = buildPlanPagosLines(extraData.amortSchedule);
  } else if (extraData.isRP || extraData.isPP) {
    const TOTAL = extraData.isPP
      ? 12000000
      : extraData.totalObjetivo || 13000000;

    if (extraData.isPP) {
      const fecha = extraData.fechasCuotas?.[0];
      const fechaTxt = fecha ? `con una fecha limite de pago de ${fecha} ` : "";
      planPagos = `${formatCurrencySpanish(TOTAL)} ${fechaTxt}al momento de la firma del presente documento.`;
    } else if (
      extraData.modoPago === "manual" &&
      Array.isArray(extraData.manualCuotas)
    ) {
      planPagos = (extraData.manualCuotas as number[])
        .map((valor, i) => {
          const fecha = extraData.fechasCuotas?.[i];
          const fechaTxt = fecha
            ? `con una fecha limite de pago de ${fecha} `
            : "";
          return `CUOTA ${i + 1}: ${formatCurrencySpanish(valor)} ${fechaTxt}al momento de la firma del presente documento.`;
        })
        .join("\n");
    } else {
      const valorCuota = Math.floor(TOTAL / numCuotasTotal);
      const ajusteUltimaCuota = TOTAL - valorCuota * (numCuotasTotal - 1);

      planPagos = Array.from({ length: numCuotasTotal }, (_, i) => {
        const valorAUsar =
          i === numCuotasTotal - 1 ? ajusteUltimaCuota : valorCuota;
        const fecha = extraData.fechasCuotas?.[i];
        const fechaTxt = fecha
          ? `con una fecha limite de pago de ${fecha} `
          : "";
        return `CUOTA ${i + 1}: ${formatCurrencySpanish(valorAUsar)} ${fechaTxt}al momento de la firma del presente documento.`;
      }).join("\n");
    }
  }

  const valorFormacion = Number(extraData.valorFormacion || 0);
  const valorFormacionTexto = valorFormacion
    ? `$ ${new Intl.NumberFormat("es-CO", { style: "decimal", maximumFractionDigits: 0 }).format(valorFormacion)}`
    : "";
  const valorFormacionLetras = valorFormacion
    ? numberToSpanishWords(valorFormacion).trim()
    : "";

  // ── Tags oficiales (fuente de verdad — prevalecen sobre cualquier alias) ──
  // NOTA: VALOR_TOTAL_NUMEROS, VALOR_TOTAL_LETRAS, VALOR_FORMACION_NUMEROS y
  //       VALOR_FORMACION_LETRAS se definen SOLO aquí para evitar duplicados.
  const officialTemplateTags = {
    "NOMBRE DEL REPRESENTANTE LEGAL": raw.nombreRepresentante || "",
    "NOMBRE DEL CAMPER": raw.nombreCamper || "",
    "NUMERO DE CEDULA": raw.cedulaRepresentante || "",
    "NUMERO DE DOCUMENTO": raw.documentoCamper || "",
    "DIRECCION FISICA DEL CAMPER": raw.direccionCamper || "",
    DIA: dia,
    MES: mes,
    ANUAL: ano,
    "EMAIL CAMPER": raw.emailCamper || raw.emailRepresentante || "",
    EMAIL_CAMPER: raw.emailCamper || raw.emailRepresentante || "",
    "EMAIL REPRESENTANTE": raw.emailRepresentante || "",
    "CELULAR CAMPER": raw.celularCamper || "",
    "CELULAR REPRESENTANTE": raw.telefonoRepresentante || "",
    "VALOR LETRAS": valorFormacionLetras,
    "VALOR FORMACION": valorFormacionTexto,
    "NUMERO DE PAGARE": extraData.pagare || "",
    VALOR_TOTAL_NUMEROS: valorFormacionTexto,
    VALOR_TOTAL_LETRAS: valorFormacionLetras,
    VALOR_FORMACION_NUMEROS: valorFormacionTexto,
    VALOR_FORMACION_LETRAS: valorFormacionLetras,
  };

  return {
    // ── Camper (variantes de etiqueta) ───────────────────────────────────────
    "NUMERO DE TARJETA DE IDENTIDAD": raw.documentoCamper,
    DOCUMENTO: raw.documentoCamper,

    "DIRECCION FISICA CAMPER": raw.direccionCamper,
    DIRECCION: raw.direccionCamper,

    "EMAIL REP CAMPER": raw.emailRepresentante,
    CORREO: raw.emailRepresentante,

    CELULAR: raw.celularCamper,
    TELEFONO: raw.celularCamper,

    // ── Representante ────────────────────────────────────────────────────────
    "NOMBRE COMPLETO REP": raw.nombreRepresentante,
    "CEDULA REP DEL CAMPER": raw.cedulaRepresentante,
    "CEDULA REPRESENTANTE": raw.cedulaRepresentante,
    "TELEFONO REP CAMPER": raw.telefonoRepresentante,
    "TELEFONO REPRESENTANTE": raw.telefonoRepresentante,

    // ── Fecha (sin tilde para evitar problemas de encoding) ──────────────────
    dia,
    mes,
    ano,
    ANO: ano,

    // ── Campos del formulario ────────────────────────────────────────────────
    PAGARE: extraData.pagare || "____________________",
    numero_cuotas: extraData.isPP ? "1" : extraData.cuotas || "",
    CUOTAS: extraData.isPP ? "1" : extraData.cuotas || "",
    "PLAN DE PAGOS": planPagos,
    FECHA_PAGO: extraData.fechasCuotas?.[0] || "",
    FECHA_LIMITE_PAGO: extraData.fechasCuotas?.[0] || "",

    // ── Resto de extraData para compatibilidad ───────────────────────────────
    ...extraData,

    // ── Tags oficiales (prevalecen sobre aliases y sobre extraData) ──────────
    // Incluyen VALOR_TOTAL_NUMEROS, VALOR_TOTAL_LETRAS, VALOR_FORMACION_NUMEROS
    // y VALOR_FORMACION_LETRAS. No deben declararse antes de este spread.
    ...officialTemplateTags,
  };
};

// ─── Generación del contrato Word ─────────────────────────────────────────────

export const generateContract = async (
  templateUrl: string,
  data: any,
  outputName: string,
  returnBlob: boolean = false,
): Promise<Blob | boolean> => {
  try {
    console.log(
      "Generating contract with data:",
      JSON.stringify(data, null, 2),
    );

    let arrayBuffer: ArrayBuffer;

    if (templateUrl.startsWith("data:")) {
      const response = await fetch(templateUrl);
      if (!response.ok)
        throw new Error(
          "No se pudo cargar la plantilla desde el archivo cargado",
        );
      arrayBuffer = await response.arrayBuffer();
    } else {
      const response = await fetch(encodeURI(templateUrl));
      if (!response.ok)
        throw new Error(
          `No se pudo cargar la plantilla (${response.status}): ${response.statusText}`,
        );
      arrayBuffer = await response.arrayBuffer();
    }

    const zip = new PizZip(arrayBuffer);

    if (data?.includePaymentPlan) {
      injectAmortizationTableIntoDocument(zip, data?.amortSchedule || []);
    } else {
      removePaymentPlanFromDocument(zip);
    }

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{", end: "}" },
    });

    if (!data || Object.keys(data).length === 0) {
      console.warn("Contract data is empty!");
    }

    try {
      doc.render(data);
      runDocumentQualityPass(doc.getZip());
    } catch (error: any) {
      console.error("Docxtemplater Render Error Object:", error);

      if (error.properties && Array.isArray(error.properties.errors)) {
        if (error.properties.errors.length > 0) {
          const msgs = error.properties.errors
            .map((err: any) => {
              const tag =
                err.properties?.id ||
                err.properties?.name ||
                err.properties?.tagName ||
                "etiqueta desconocida";
              const expl = (
                err.properties?.explanation ||
                err.message ||
                "Error de sintaxis"
              )
                .replace(
                  "The tag beginning with",
                  "La etiqueta que empieza por",
                )
                .replace("is unopened", "no está abierta correctamente")
                .replace("is unclosed", "no está cerrada correctamente");
              return `- Error en etiqueta '${tag}': ${expl}`;
            })
            .join("\n");
          throw new Error(
            `La plantilla tiene errores de formato (MultiError):\n${msgs}`,
          );
        }
      }

      if (error.properties) {
        throw new Error(
          `Error de formato en la plantilla (Detalles técnicos): ${JSON.stringify(error.properties, null, 2)}`,
        );
      }

      throw new Error(
        `Error crítico al renderizar: ${error.message || error}. ` +
          "Verifique que la plantilla .docx no tenga errores de sintaxis en las etiquetas.",
      );
    }

    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    if (returnBlob) return out;
    saveAs(out, outputName);
    return true;
  } catch (error: any) {
    console.error("Error al generar el contrato:", error);
    throw new Error(error.message || "Error desconocido al generar contrato");
  }
};

// ─── Nombre del archivo generado ──────────────────────────────────────────────

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\.+|\.+$/g, "");

/**
 * Devuelve el nombre de archivo con la extensión correcta.
 * _pagare y _tipo se conservan en la firma por compatibilidad con llamadas existentes.
 */
export const getContractFileName = (
  _pagare: string,
  _tipo: string,
  nombre: string,
  extension: "docx" | "pdf",
  customName?: string,
): string => {
  const cleanName = sanitizeFileName(customName || nombre);
  return cleanName.toLowerCase().endsWith(`.${extension}`)
    ? cleanName
    : `${cleanName}.${extension}`;
};

// ─── Exportación como PDF desde el DOM ───────────────────────────────────────

export const downloadAsPDF = async (
  elementId: string,
  outputName: string,
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element)
    throw new Error("No se encontró el elemento para generar el PDF");

  await new Promise((resolve) => setTimeout(resolve, 500));

  const origTransform = element.style.transform;
  const origTransition = element.style.transition;
  const origVisibility = element.style.visibility;

  const restore = () => {
    element.style.transform = origTransform;
    element.style.transition = origTransition;
    element.style.visibility = origVisibility;
    element.classList.remove("exporting-pdf");
  };

  try {
    element.style.transition = "none";
    element.style.transform = "none";
    element.style.visibility = "visible";
    element.classList.add("exporting-pdf");

    // @ts-ignore
    const html2pdf = (await import("html2pdf.js")).default;

    await html2pdf()
      .set({
        margin: 0,
        filename: outputName,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: false,
          scrollY: 0,
          scrollX: 0,
        },
        jsPDF: {
          unit: "mm" as const,
          format: "a4" as const,
          orientation: "portrait" as const,
        },
        pagebreak: { mode: ["css", "legacy"] },
      } as any)
      .from(element)
      .save();

    restore();
    return true;
  } catch (error: any) {
    restore();
    console.error("Error al generar PDF:", error);
    throw new Error("Error al generar PDF. Intente de nuevo.");
  }
};
