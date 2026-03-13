const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

try {
    const content = fs.readFileSync('public/contratos/Condiciones Específicas-Pronto Pago Mayor de Edad.docx', 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    const text = doc.getFullText();
    const tags = text.match(/\{[^}]+\}/g) || [];
    console.log("Tags Pronto Pago Mayores:", [...new Set(tags)]);
    
    // Also check RPMayores just in case it has PLAN_PAGOS
    const contentRP = fs.readFileSync('public/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx', 'binary');
    const zipRP = new PizZip(contentRP);
    const docRP = new Docxtemplater(zipRP, { paragraphLoop: true, linebreaks: true });
    const textRP = docRP.getFullText();
    const tagsRP = textRP.match(/\{[^}]+\}/g) || [];
    console.log("Tags RP Mayores:", [...new Set(tagsRP)]);
} catch (e) {
    console.error(e);
}
