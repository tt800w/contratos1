const PizZip = require('pizzip');
const fs = require('fs');

const path = 'public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx';
const content = fs.readFileSync(path, 'binary');
const zip = new PizZip(content);
const xml = zip.file("word/document.xml").asText();

console.log("Menor de edad matches for CORREO in XML:");
let index = 0;
while ((index = xml.indexOf('CORREO', index)) !== -1) {
    console.log("--- Match ---");
    console.log(xml.substring(Math.max(0, index - 100), Math.min(xml.length, index + 100)));
    index += 6;
}
