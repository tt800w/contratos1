import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

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

import { formatCurrencySpanish, numberToSpanishWords } from "./numberToWords";

const formatCurrencyNumber = (value: number) =>
  `$${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value)}`;

<<<<<<< HEAD
const formatDateDisplay = (value: string) => {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return value;
=======
    const numCuotasTotal = extraData.isPP ? 1 : (parseInt(extraData.cuotas) || 1);
    let planPagos = "";

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
                const label = index === 0 ? "CUOTA 1" : `CUOTA ${index + 1}`;
                const fecha = extraData.fechasCuotas?.[index];
                const fechaTexto = fecha ? `con una fecha limite de pago de ${fecha} ` : "";

                planPagos += `${label}: ${formatCurrencySpanish(valor)} ${fechaTexto}al momento de la firma del presente documento.\n`;
            });
        } else {
            // Modo Automático (Default para RP): Dividir el presupuesto
            const valorCuota = Math.floor(TOTAL_OBJETIVO / numCuotasTotal);
            const ajusteUltimaCuota = TOTAL_OBJETIVO - (valorCuota * (numCuotasTotal - 1));

            planPagos = "";
            for (let i = 1; i <= numCuotasTotal; i++) {
                const label = i === 1 ? "CUOTA 1" : `CUOTA ${i}`;
                const valorAUsar = (i === numCuotasTotal) ? ajusteUltimaCuota : valorCuota;
                const fecha = extraData.fechasCuotas?.[i - 1];
                const fechaTexto = fecha ? `con una fecha limite de pago de ${fecha} ` : "";

                planPagos += `${label}: ${formatCurrencySpanish(valorAUsar)} ${fechaTexto}al momento de la firma del presente documento.\n`;
            }
        }
    }

    return {
        // Camper data with variations
        "NOMBRE DEL CAMPER": raw.nombreCamper,
        "NUMERO DE CEDULA": extraData.isMinor ? raw.cedulaRepresentante : raw.documentoCamper,
        "NUMERO DE TARJETA DE IDENTIDAD": raw.documentoCamper,
        "DOCUMENTO": raw.documentoCamper,
        "NUMERO DE DOCUMENTO": raw.documentoCamper,

        "DIRECCION FISICA CAMPER": raw.direccionCamper,
        "DIRECCION FISICA DEL CAMPER": raw.direccionCamper,
        "DIRECCION": raw.direccionCamper,

        "EMAIL CAMPER": raw.emailCamper || raw.emailRepresentante,
        "EMAIL REP CAMPER": raw.emailRepresentante || raw.emailCamper,
        "CORREO": raw.emailRepresentante || raw.emailCamper,

        "CELULAR CAMPER": raw.celularCamper,
        "CELULAR": raw.celularCamper,
        "TELEFONO": raw.celularCamper,

        // Representative data
        "NOMBRE COMPLETO REP": raw.nombreRepresentante,
        "NOMBRE DEL REPRESENTANTE LEGAL": raw.nombreRepresentante,
        "CEDULA REP DEL CAMPER": raw.cedulaRepresentante,
        "CEDULA REPRESENTANTE": raw.cedulaRepresentante,

        "TELEFONO REP CAMPER": raw.telefonoRepresentante,
        "TELEFONO REPRESENTANTE": raw.telefonoRepresentante,
        "CELULAR REPRESENTANTE": raw.telefonoRepresentante,

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
        "FECHA_PAGO": extraData.fechasCuotas?.[0] || "",
        "FECHA_LIMITE_PAGO": extraData.fechasCuotas?.[0] || "",
        "VALOR_TOTAL_NUMEROS": extraData.isRP || extraData.isPP ? `$ ${new Intl.NumberFormat('es-CO', { style: 'decimal', maximumFractionDigits: 0 }).format(extraData.isPP ? 12000000 : (extraData.totalObjetivo || 13000000))}` : "",
        "VALOR_TOTAL_LETRAS": extraData.isRP || extraData.isPP ? numberToSpanishWords(extraData.isPP ? 12000000 : (extraData.totalObjetivo || 13000000)).trim() : "",
        "VALOR_FORMACION_NUMEROS": extraData.valorFormacion ? `$ ${new Intl.NumberFormat('es-CO', { style: 'decimal', maximumFractionDigits: 0 }).format(parseInt(extraData.valorFormacion))}` : "",
        "VALOR_FORMACION_LETRAS": extraData.valorFormacion ? numberToSpanishWords(parseInt(extraData.valorFormacion)).trim() : "",

        // Include everything from extraData just in case
        ...extraData
    };
>>>>>>> 30b880f045c4ba8f33252de4a1471789a87e82bc
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
//   #      →  700 dxa   (8.4 %)
//   Fecha  → 2200 dxa   (26.5 %)
//   Cuota  → 2700 dxa   (32.5 %)
//   Saldo  → 2700 dxa   (32.5 %)
// ─────────────────────────────────────────────────────────────────────────────
const TABLE_TOTAL_WIDTH = 8300; // dxa — área útil completa

const buildAmortizationTableXml = (
  amortSchedule: { installment: number; amount: number; dueDate: string }[],
) => {
  const columns = [
    { title: "#",      width: 700  },
    { title: "Fecha",  width: 2200 },
    { title: "Cuota",  width: 2700 },
    { title: "Saldo",  width: 2700 },
  ];

  // ── Estilos reutilizables ──────────────────────────────────────────────────
  const headerShading =
    `<w:shd w:val="clear" w:color="auto" w:fill="1F3864"/>`;   // azul oscuro corporativo
  const headerFont =
    `<w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>`;
  const cellFont =
    `<w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>`;

  // ── Celdas de encabezado ───────────────────────────────────────────────────
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

  // ── Filas de datos ─────────────────────────────────────────────────────────
  let remaining = amortSchedule.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const rows = amortSchedule
    .map((item, rowIndex) => {
      const amount = Number(item.amount || 0);
      remaining = Math.max(0, remaining - amount);

      const cells = [
        `${item.installment}`,
        formatDateDisplay(item.dueDate),
        formatCurrencyNumber(amount),
        formatCurrencyNumber(remaining),
      ];

      // Filas alternas: blanco / gris muy claro para legibilidad
      const rowFill = rowIndex % 2 === 0 ? "FFFFFF" : "EEF2F7";
      const rowShading =
        `<w:shd w:val="clear" w:color="auto" w:fill="${rowFill}"/>`;

      return (
        `<w:tr>` +
        cells
          .map((cellText, colIndex) => {
            const align = colIndex === 0 ? "center" : colIndex >= 2 ? "right" : "left";
            return (
              `<w:tc>` +
                `<w:tcPr>` +
                  `<w:tcW w:w="${columns[colIndex].width}" w:type="dxa"/>` +
                  `<w:vAlign w:val="center"/>` +
                  rowShading +
                `</w:tcPr>` +
                `<w:p>` +
                  `<w:pPr><w:jc w:val="${align}"/></w:pPr>` +
                  `<w:r>${cellFont}<w:t xml:space="preserve">${escapeXml(cellText)}</w:t></w:r>` +
                `</w:p>` +
              `</w:tc>`
            );
          })
          .join("") +
        `</w:tr>`
      );
    })
    .join("");

  // ── Ensamblado final ───────────────────────────────────────────────────────
  return `
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="${TABLE_TOTAL_WIDTH}" w:type="dxa"/>
    <w:tblLayout w:type="fixed"/>
    <w:tblBorders>
      <w:top    w:val="single" w:sz="4" w:space="0" w:color="1F3864"/>
      <w:left   w:val="single" w:sz="4" w:space="0" w:color="1F3864"/>
      <w:bottom w:val="single" w:sz="4" w:space="0" w:color="1F3864"/>
      <w:right  w:val="single" w:sz="4" w:space="0" w:color="1F3864"/>
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

const injectAmortizationTableIntoDocument = (
  zip: PizZip,
  amortSchedule: { installment: number; amount: number; dueDate: string }[],
) => {
  if (!amortSchedule || amortSchedule.length === 0) return;

  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) return;

  const tableXml = buildAmortizationTableXml(amortSchedule);
  const updatedXml = documentXml.replace(/<w:p[\s\S]*?<\/w:p>/g, (paragraph) => {
    const paragraphText = Array.from(paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g))
      .map((match) => match[1])
      .join("");

    return hasPaymentPlanTag(paragraphText) ? tableXml : paragraph;
  });

  if (updatedXml !== documentXml) {
    zip.file("word/document.xml", updatedXml);
  }
};

const removePaymentPlanFromDocument = (zip: PizZip) => {
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) return;

  const paragraphs = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g);
  if (!paragraphs) return;

  const updatedParagraphs = [...paragraphs];

  paragraphs.forEach((paragraph, index) => {
    const paragraphText = getWordParagraphText(paragraph);
    if (!hasPaymentPlanTag(paragraphText)) return;

    updatedParagraphs[index] = "";

    const previousIndex = index - 1;
    if (previousIndex < 0) return;

    const previousText = normalizeWordText(getWordParagraphText(updatedParagraphs[previousIndex]));
    if (/^(PLAN DE PAGOS|TABLA DE AMORTIZACION|TABLAS DE AMORTIZACION)$/.test(previousText)) {
      updatedParagraphs[previousIndex] = "";
    }
  });

  let paragraphIndex = 0;
  const updatedXml = documentXml.replace(/<w:p[\s\S]*?<\/w:p>/g, () => {
    const nextParagraph = updatedParagraphs[paragraphIndex] ?? "";
    paragraphIndex += 1;
    return nextParagraph;
  });

  if (updatedXml !== documentXml) {
    zip.file("word/document.xml", updatedXml);
  }
};

const getWordParagraphText = (paragraph: string) =>
  Array.from(paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g))
    .map((match) => match[1])
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

const normalizeTextSpacing = (zip: PizZip) => {
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) return;

  const updatedXml = documentXml.replace(
    /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g,
    (textNode, attributes, value) => {
      const normalizedValue = value.replace(/[ \t]{2,}/g, " ");
      return normalizedValue === value
        ? textNode
        : `<w:t${attributes}>${normalizedValue}</w:t>`;
    },
  );

  if (updatedXml !== documentXml) {
    zip.file("word/document.xml", updatedXml);
  }
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

  let emptyParagraphCount = 0;
  const updatedXml = documentXml.replace(/<w:p[\s\S]*?<\/w:p>/g, (paragraph) => {
    if (!isEmptyWordParagraph(paragraph)) {
      emptyParagraphCount = 0;
      return paragraph;
    }

    emptyParagraphCount += 1;
    return emptyParagraphCount > 1 ? "" : paragraph;
  });

  if (updatedXml !== documentXml) {
    zip.file("word/document.xml", updatedXml);
  }
};

const auditDocumentLayout = (zip: PizZip) => {
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) return;

  const clauseNumbers = Array.from(
    documentXml.matchAll(/<w:p[\s\S]*?<\/w:p>/g),
  )
    .map((match) => normalizeWordText(getWordParagraphText(match[0])))
    .map((text) => text.match(/^(?:CLAUSULA\s+)?(\d+)[\.\)]\s+/)?.[1])
    .filter(Boolean)
    .map(Number);

  const repeatedNumbers = clauseNumbers.filter(
    (number, index) => index > 0 && clauseNumbers[index - 1] === number,
  );

  if (repeatedNumbers.length > 0) {
    console.warn(
      "Control de calidad del contrato: posible numeración repetida",
      repeatedNumbers,
    );
  }
};

const runDocumentQualityPass = (zip: PizZip) => {
  normalizeTextSpacing(zip);
  removeUnnecessaryPaginationBreaks(zip);
  removeExcessEmptyParagraphs(zip);
  auditDocumentLayout(zip);
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

  const updatedParagraphs = [...paragraphs];

  paragraphs.forEach((paragraph, index) => {
    const text = normalizeWordText(getWordParagraphText(paragraph));
    if (!startsFlexibleSection(text)) return;

    updatedParagraphs[index] = removeForcedPagination(paragraph);

    const previousIndex = index - 1;
    if (previousIndex < 0) return;

    const cleanedPrevious = removeForcedPagination(updatedParagraphs[previousIndex]);
    updatedParagraphs[previousIndex] = isEmptyWordParagraph(cleanedPrevious)
      ? ""
      : cleanedPrevious;
  });

  let paragraphIndex = 0;
  const updatedXml = documentXml.replace(/<w:p[\s\S]*?<\/w:p>/g, () => {
    const nextParagraph = updatedParagraphs[paragraphIndex] ?? "";
    paragraphIndex += 1;
    return nextParagraph;
  });

  if (updatedXml !== documentXml) {
    zip.file("word/document.xml", updatedXml);
  }
};

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

  // Lógica específica para Recursos Propios y Pronto Pago
  // If an explicit amortization schedule is provided, use it to build PLAN_PAGOS
  if (
    Array.isArray(extraData.amortSchedule) &&
    extraData.amortSchedule.length > 0
  ) {
    const total = extraData.amortSchedule.reduce(
      (s: number, it: any) => s + Number(it.amount || 0),
      0,
    );
    let acumulado = 0;
    const lines: string[] = [];
    extraData.amortSchedule.forEach((item: any) => {
      const amt = Number(item.amount || 0);
      acumulado += amt;
      const restante = Math.max(0, total - acumulado);
      const cuota = item.installment ?? lines.length + 1;
      const fecha = item.dueDate || "";
      const valorCuotaNum = new Intl.NumberFormat("es-CO", {
        maximumFractionDigits: 0,
      }).format(amt);
      const valorPendienteNum = new Intl.NumberFormat("es-CO", {
        maximumFractionDigits: 0,
      }).format(restante);
      lines.push(
        `Cuota: ${cuota}; Fecha: ${fecha}; Monto: $${valorCuotaNum}; Valor pendiente a pagar: $${valorPendienteNum}`,
      );
    });

    planPagos = lines.join("\n");
  } else if (extraData.isRP || extraData.isPP) {
    const TOTAL_OBJETIVO = extraData.isPP
      ? 12000000
      : extraData.totalObjetivo || 13000000;

    if (extraData.isPP) {
      const fecha = extraData.fechasCuotas?.[0];
      const fechaTexto = fecha
        ? `con una fecha limite de pago de ${fecha} `
        : "";
      planPagos = `${formatCurrencySpanish(TOTAL_OBJETIVO)} ${fechaTexto}al momento de la firma del presente documento.`;
    } else if (
      extraData.modoPago === "manual" &&
      Array.isArray(extraData.manualCuotas)
    ) {
      // Modo Manual (Solo para RP)
      planPagos = "";
      extraData.manualCuotas.forEach((valor: number, index: number) => {
        const label = index === 0 ? "CUOTA 1" : `CUOTA ${index + 1}`;
        const fecha = extraData.fechasCuotas?.[index];
        const fechaTexto = fecha
          ? `con una fecha limite de pago de ${fecha} `
          : "";

        planPagos += `${label}: ${formatCurrencySpanish(valor)} ${fechaTexto}al momento de la firma del presente documento.\n`;
      });
    } else {
      // Modo Automático (Default para RP): Dividir el presupuesto
      const valorCuota = Math.floor(TOTAL_OBJETIVO / numCuotasTotal);
      const ajusteUltimaCuota =
        TOTAL_OBJETIVO - valorCuota * (numCuotasTotal - 1);

      planPagos = "";
      for (let i = 1; i <= numCuotasTotal; i++) {
        const label = i === 1 ? "CUOTA 1" : `CUOTA ${i}`;
        const valorAUsar =
          i === numCuotasTotal ? ajusteUltimaCuota : valorCuota;
        const fecha = extraData.fechasCuotas?.[i - 1];
        const fechaTexto = fecha
          ? `con una fecha limite de pago de ${fecha} `
          : "";

        planPagos += `${label}: ${formatCurrencySpanish(valorAUsar)} ${fechaTexto}al momento de la firma del presente documento.\n`;
      }
    }
  }

  // If user provided amortSchedule but not RP/PP specifics, ensure PLAN_PAGOS is set
  if (
    !planPagos &&
    Array.isArray(extraData.amortSchedule) &&
    extraData.amortSchedule.length > 0
  ) {
    const total = extraData.amortSchedule.reduce(
      (s: number, it: any) => s + Number(it.amount || 0),
      0,
    );
    let acumulado = 0;
    const lines: string[] = [];
    extraData.amortSchedule.forEach((item: any, idx: number) => {
      const amt = Number(item.amount || 0);
      acumulado += amt;
      const restante = Math.max(0, total - acumulado);
      const cuota = item.installment ?? idx + 1;
      const fecha = item.dueDate || "";
      const valorCuotaNum = new Intl.NumberFormat("es-CO", {
        maximumFractionDigits: 0,
      }).format(amt);
      const valorPendienteNum = new Intl.NumberFormat("es-CO", {
        maximumFractionDigits: 0,
      }).format(restante);
      lines.push(
        `Cuota: ${cuota}; Fecha: ${fecha}; Monto: $${valorCuotaNum}; Valor pendiente a pagar: $${valorPendienteNum}`,
      );
    });
    planPagos = lines.join("\n");
  }

  const valorFormacion = Number(extraData.valorFormacion || 0);
  const valorFormacionTexto = valorFormacion
    ? `$ ${new Intl.NumberFormat("es-CO", {
        style: "decimal",
        maximumFractionDigits: 0,
      }).format(valorFormacion)}`
    : "";
  const valorFormacionLetras = valorFormacion
    ? numberToSpanishWords(valorFormacion).trim()
    : "";
  const officialTemplateTags = {
    "NOMBRE DEL REPRESENTANTE LEGAL": raw.nombreRepresentante || "",
    "NOMBRE DEL CAMPER": raw.nombreCamper || "",
    "NUMERO DE CEDULA": raw.cedulaRepresentante || "",
    "NUMERO DE DOCUMENTO": raw.documentoCamper || "",
    "DIRECCION FISICA DEL CAMPER": raw.direccionCamper || "",
    DIA: dia,
    MES: mes,
    ANUAL: ano,
    "EMAIL CAMPER": raw.emailCamper || "",
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
    // Camper data with variations
    "NOMBRE DEL CAMPER": raw.nombreCamper,
    "NUMERO DE CEDULA": raw.documentoCamper,
    "NUMERO DE TARJETA DE IDENTIDAD": raw.documentoCamper,
    DOCUMENTO: raw.documentoCamper,

    "DIRECCION FISICA CAMPER": raw.direccionCamper,
    "DIRECCION FISICA DEL CAMPER": raw.direccionCamper,
    DIRECCION: raw.direccionCamper,

    "EMAIL CAMPER": raw.emailCamper || raw.emailRepresentante,
    "EMAIL REP CAMPER": raw.emailRepresentante,
    CORREO: raw.emailRepresentante,

    "CELULAR CAMPER": raw.celularCamper,
    CELULAR: raw.celularCamper,
    TELEFONO: raw.celularCamper,

    // Representative data
    "NOMBRE COMPLETO REP": raw.nombreRepresentante,
    "CEDULA REP DEL CAMPER": raw.cedulaRepresentante,
    "CEDULA REPRESENTANTE": raw.cedulaRepresentante,

    "TELEFONO REP CAMPER": raw.telefonoRepresentante,
    "TELEFONO REPRESENTANTE": raw.telefonoRepresentante,
    "CELULAR REPRESENTANTE": raw.telefonoRepresentante,

    // Date variations
    dia: dia,
    mes: mes,
    año: ano,
    ano: ano,
    AÑO: ano,
    ANO: ano,

    // Additional fields
    "NUMERO DE PAGARE": extraData.pagare || "____________________",
    PAGARE: extraData.pagare || "____________________",
    numero_cuotas: extraData.isPP ? "1" : extraData.cuotas || "",
    CUOTAS: extraData.isPP ? "1" : extraData.cuotas || "",
    "PLAN DE PAGOS": planPagos,
    FECHA_PAGO: extraData.fechasCuotas?.[0] || "",
    FECHA_LIMITE_PAGO: extraData.fechasCuotas?.[0] || "",
    VALOR_TOTAL_NUMEROS:
      extraData.isRP || extraData.isPP
        ? `$ ${new Intl.NumberFormat("es-CO", { style: "decimal", maximumFractionDigits: 0 }).format(extraData.isPP ? 12000000 : extraData.totalObjetivo || 13000000)}`
        : "",
    VALOR_TOTAL_LETRAS:
      extraData.isRP || extraData.isPP
        ? numberToSpanishWords(
            extraData.isPP ? 12000000 : extraData.totalObjetivo || 13000000,
          ).trim()
        : "",
    VALOR_FORMACION_NUMEROS: extraData.valorFormacion
      ? `$ ${new Intl.NumberFormat("es-CO", { style: "decimal", maximumFractionDigits: 0 }).format(parseInt(extraData.valorFormacion))}`
      : "",
    VALOR_FORMACION_LETRAS: extraData.valorFormacion
      ? numberToSpanishWords(parseInt(extraData.valorFormacion)).trim()
      : "",

    // Tags oficiales de la plantilla. Estos valores prevalecen sobre alias antiguos.
    ...officialTemplateTags,

    // Include everything from extraData just in case
    ...extraData,
  };
};

export const generateContract = async (
  templateUrl: string,
  data: any,
  outputName: string,
  returnBlob: boolean = false,
) => {
  try {
    console.log(
      "Generating contract with data:",
      JSON.stringify(data, null, 2),
    );

    // Ensure URL is encoded to handle spaces and special characters
    let arrayBuffer: ArrayBuffer;

    if (templateUrl.startsWith("data:")) {
      const response = await fetch(templateUrl);
      if (!response.ok) {
        throw new Error(
          "No se pudo cargar la plantilla desde el archivo cargado",
        );
      }
      arrayBuffer = await response.arrayBuffer();
    } else {
      const encodedUrl = encodeURI(templateUrl);
      const response = await fetch(encodedUrl);
      if (!response.ok) {
        throw new Error(
          `No se pudo cargar la plantilla (${response.status}): ${response.statusText}`,
        );
      }
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
      delimiters: {
        start: "{",
        end: "}",
      },
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
              const tag =
                err.properties?.id ||
                err.properties?.name ||
                err.properties?.tagName ||
                "etiqueta desconocida";
              const expl =
                err.properties?.explanation ||
                err.message ||
                "Error de sintaxis";
              // Translate common errors
              const translatedExpl = expl
                .replace(
                  "The tag beginning with",
                  "La etiqueta que empieza por",
                )
                .replace("is unopened", "no está abierta correctamente")
                .replace("is unclosed", "no está cerrada correctamente");
              return `- Error en etiqueta '${tag}': ${translatedExpl}`;
            })
            .join("\n");

          throw new Error(
            `La plantilla tiene errores de formato (MultiError):\n${errorMessages}`,
          );
        }
      }

      // Fallback: Dump properties if they exist but we couldn't parse them smoothly
      if (error.properties) {
        const dump = JSON.stringify(error.properties, null, 2);
        throw new Error(
          `Error de formato en la plantilla (Detalles técnicos): ${dump}`,
        );
      }

      // Standard error
      const suggestion =
        "Verifique que la plantilla .docx no tenga errores de sintaxis en las etiquetas (ej: {{...}} mal cerrados).";
      throw new Error(
        `Error crítico al renderizar: ${error.message || error}. ${suggestion}`,
      );
    }

    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    if (returnBlob) {
      return out;
    }

    saveAs(out, outputName);
    return true;
  } catch (error: any) {
    console.error("Error al generar el contrato:", error);
    // Throw the specific error message so it can be shown to the user
    throw new Error(error.message || "Error desconocido al generar contrato");
  }
};

/**
 * Genera el nombre del archivo del contrato siguiendo el formato estándar:
 * [Pagaré]. Condiciones Especificas - [Tipo] - [Nombre]
 */
const sanitizeFileName = (value: string) => {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\.+|\.+$/g, "");
};

export const getContractFileName = (
  pagare: string,
  tipo: string,
  nombre: string,
  extension: "docx" | "pdf",
  customName?: string,
) => {
  const baseName = customName || nombre;
  const cleanName = sanitizeFileName(baseName);
  return cleanName.toLowerCase().endsWith(`.${extension}`)
    ? cleanName
    : `${cleanName}.${extension}`;
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
  await new Promise((resolve) => setTimeout(resolve, 500));

<<<<<<< HEAD
  // Guardar el transform original para restaurarlo luego
  const originalTransform = element.style.transform;
  const originalTransition = element.style.transition;
  const originalVisibility = element.style.visibility;
=======
    // Guardar el transform original para restaurarlo luego
    const originalTransform = element.style.transform;
    const originalTransition = element.style.transition;
    const originalVisibility = element.style.visibility;
    
    // Inyectar un estilo temporal para la impresión
    const printStyle = document.createElement('style');
    printStyle.innerHTML = `
        #${elementId} {
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        #${elementId} section {
            margin-bottom: 0 !important;
            box-shadow: none !important;
            border: none !important;
        }
    `;
    document.head.appendChild(printStyle);
>>>>>>> 30b880f045c4ba8f33252de4a1471789a87e82bc

  try {
    // Desactivar animaciones y transformaciones para una captura limpia
    element.style.transition = "none";
    element.style.transform = "none";
    element.style.visibility = "visible";
    element.classList.add("exporting-pdf");

    // @ts-ignore
    const html2pdf = (await import("html2pdf.js")).default;

<<<<<<< HEAD
    const opt = {
      margin: 0,
      filename: outputName,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2, // 2 es suficiente y más estable que 3
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
        compress: true,
      },
      pagebreak: { mode: ["css", "legacy"] },
    };
=======
        const opt = {
            margin: 0,
            filename: outputName,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 2, // 2 es suficiente y más estable que 3
                useCORS: true,
                logging: false,
                letterRendering: true,
                allowTaint: false,
                scrollY: 0,
                scrollX: 0
            },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const, compress: true },
            pagebreak: { mode: ['css', 'legacy'], after: 'section:not(:last-child)' }
        };
>>>>>>> 30b880f045c4ba8f33252de4a1471789a87e82bc

    const doc = html2pdf().set(opt).from(element);
    await doc.save();

<<<<<<< HEAD
    // Restaurar estado original
    element.style.transform = originalTransform;
    element.style.transition = originalTransition;
    element.style.visibility = originalVisibility;
    element.classList.remove("exporting-pdf");
    return true;
  } catch (error: any) {
    element.style.transform = originalTransform;
    element.style.transition = originalTransition;
    element.style.visibility = originalVisibility;
    element.classList.remove("exporting-pdf");
    console.error("Error al generar PDF:", error);
    throw new Error("Error al generar PDF. Intente de nuevo.");
  }
=======
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
        if (document.head.contains(printStyle)) {
            document.head.removeChild(printStyle);
        }
        console.error('Error al generar PDF:', error);
        throw new Error("Error al generar PDF. Intente de nuevo.");
    }
>>>>>>> 30b880f045c4ba8f33252de4a1471789a87e82bc
};
