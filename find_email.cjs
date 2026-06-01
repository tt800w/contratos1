const PizZip = require('pizzip');
const fs = require('fs');

const path = 'public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx';
const content = fs.readFileSync(path, 'binary');
const zip = new PizZip(content);
const xml = zip.file("word/document.xml").asText();
const textOnly = xml.replace(/<[^>]+>/g, '');

let index = 0;
while ((index = textOnly.indexOf('EMAIL CAMPER', index)) !== -1) {
    console.log("--- Match ---");
    console.log(textOnly.substring(Math.max(0, index - 50), Math.min(textOnly.length, index + 50)));
    index += 6;
}
