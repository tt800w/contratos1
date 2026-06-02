const fs = require('fs');
const PizZip = require('pizzip');

function buildFinalDoc(sourcePath, destPath) {
    const zip = new PizZip(fs.readFileSync(sourcePath, 'binary'));
    let xml = zip.file('word/document.xml').asText();

    // 1. Fix kamiloj73
    xml = xml.replace(/kamiloj73@gmail\.com/g, '{EMAIL REP CAMPER}');
    
    // 2. Fix [correo electrónico]
    xml = xml.replace(/\[correo.*?electr.*?nico\]/gi, '{CORREO}');

    // 3. Replace {CORREO] with {CORREO}
    xml = xml.replace(/\{CORREO\]/g, '{CORREO}');
    xml = xml.replace(/\{([^}]*?)CORREO([^}]*?)\]/g, '{$1CORREO$2}');

    // 4. Fix Representative Section Tags
    let paragraphs = xml.split('</w:p>');
    let inRepSection = false;
    for (let i = 0; i < paragraphs.length; i++) {
        const text = paragraphs[i].replace(/<[^>]+>/g, '');
        if (text.includes('EL REPRESENTANTE DEL CAMPER')) {
            inRepSection = true;
        }
        
        if (inRepSection) {
            if (text.includes('DIRECCIÓN ELECTRÓNICA')) {
                paragraphs[i] = paragraphs[i].replace(/\{CORREO\}/g, '{EMAIL REP CAMPER}');
                paragraphs[i] = paragraphs[i].replace(/\{EMAIL CAMPER\}/g, '{EMAIL REP CAMPER}');
            }
            if (text.includes('TELÉFONO')) {
                paragraphs[i] = paragraphs[i].replace(/\{CELULAR CAMPER\}/g, '{TELEFONO REP CAMPER}');
                inRepSection = false;
            }
        }
        
        if (text.includes('Representante Legal')) {
            paragraphs[i] = paragraphs[i].replace(/\{CORREO\}/g, '{EMAIL REP CAMPER}');
            paragraphs[i] = paragraphs[i].replace(/\{EMAIL CAMPER\}/g, '{EMAIL REP CAMPER}');
        }
    }
    xml = paragraphs.join('</w:p>');

    // 5. Replace hardcoded 13 million sum
    xml = xml.replace(
        /TRECE MILLONES.*?COP\)/g,
        '{VALOR_TOTAL_LETRAS_UPPER} DE PESOS M/CTE ({VALOR_TOTAL_NUMEROS} COP)'
    );

    // 6. Replace Pagaré No. 251 cleanly
    xml = xml.replace(/>251</g, '>{NUMERO DE PAGARE}<');

    // 7. Inject {#CUOTAS_LIST} loop with new date tags (bolding the date)
    const loopXML = `<w:p><w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr><w:r><w:t>{#CUOTAS_LIST}</w:t></w:r></w:p><w:p><w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>- {titulo} {valor}</w:t></w:r><w:r><w:t xml:space="preserve">{fecha_prefijo}</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>{fecha_bold}</w:t></w:r><w:r><w:t xml:space="preserve">{fecha_sufijo}</w:t></w:r></w:p><w:p><w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr><w:r><w:t>{/CUOTAS_LIST}</w:t></w:r>`;

    paragraphs = xml.split('</w:p>');
    for (let i = 0; i < paragraphs.length; i++) {
        const text = paragraphs[i].replace(/<[^>]+>/g, '');
        if (text.includes('CUOTA 1:')) {
            paragraphs[i] = loopXML;
        }
    }
    xml = paragraphs.join('</w:p>');

    // 8. Visual Cleanup: Remove excessive empty paragraphs
    const getWordParagraphText = (paragraph) =>
        Array.from(paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g))
            .map((m) => m[1]).join('').replace(/&[a-z]+;/gi, '');

    const isEmptyWordParagraph = (paragraph) =>
        !getWordParagraphText(paragraph).trim() &&
        !/<w:(?:drawing|pict|tbl|object|sectPr|br)\b/.test(paragraph);

    let count = 0;
    xml = xml.replace(/<w:p[\s\S]*?<\/w:p>/g, (p) => {
        if (!isEmptyWordParagraph(p)) {
            count = 0;
            return p;
        }
        count++;
        return count > 1 ? '' : p;
    });

    // 9. Visual Cleanup: Force Page Breaks before specific sections
    const startsFlexibleSection = (text) =>
        /^(PAGARÉ\s*(NO\.?|N\.?|#)?|CARTA DE INSTRUCCIONES|ANEXOS?|FIRMAS?|CONDICIONES ESPECIFICAS)\b/i.test(text.trim());

    xml = xml.replace(/<w:p[\s\S]*?<\/w:p>/g, (p) => {
        const text = getWordParagraphText(p);
        if (startsFlexibleSection(text)) {
            if (!/<w:br\b[^>]*w:type="page"[^>]*\/>/g.test(p) && !/<w:pageBreakBefore\b/.test(p)) {
                return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' + p;
            }
        }
        return p;
    });

    zip.file('word/document.xml', xml);
    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(destPath, buffer);
    console.log('Successfully built final', destPath.split('/').pop());
}

const sourceMayores = 'C:/Users/Juan_Gualdron_G/Downloads/Modelo 2026 Contrato Campers Recursos Propios y Plan Ingreso Diferido - Mayores de Edad Actualizado.docx';
const destMayores = 'public/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx';

const sourceMenores = 'C:/Users/Juan_Gualdron_G/Downloads/Modelo 2026 Contrato Campers Recursos Propios y Plan Ingreso Diferido - Menores de Edad Actualizado.docx';
const destMenores = 'public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx';

buildFinalDoc(sourceMayores, destMayores);
buildFinalDoc(sourceMenores, destMenores);
