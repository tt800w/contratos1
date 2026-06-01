const fs = require('fs');
const PizZip = require('pizzip');

function updateDocx(path) {
    const zip = new PizZip(fs.readFileSync(path, 'binary'));
    let xml = zip.file('word/document.xml').asText();

    xml = xml.replace(/PAGAR[ÉE](<[^>]+>)*\s+(<[^>]+>)*No\.\s+(<[^>]+>)*251/g, 'PAGARÉ$1 $2No. $3{PAGARE}');

    const loopXML = `
    <w:p>
      <w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr>
      <w:r><w:t>{#CUOTAS_LIST}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>- {titulo} {valor}</w:t></w:r>
      <w:r><w:t xml:space="preserve"> {fecha_texto} al momento de la firma del presente documento.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr>
      <w:r><w:t>{/CUOTAS_LIST}</w:t></w:r>
    </w:p>
    `;

    const paragraphs = xml.split('</w:p>');
    for (let i = 0; i < paragraphs.length; i++) {
        if (paragraphs[i].includes('{PLAN_PAGOS}')) {
            paragraphs[i] = loopXML;
        }
    }
    xml = paragraphs.join('</w:p>');

    zip.file('word/document.xml', xml);
    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(path, buffer);
    console.log('Successfully updated', path);
}

updateDocx('public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx');
updateDocx('public/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx');
