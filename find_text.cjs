const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');

const path = 'public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx';
const content = fs.readFileSync(path, 'binary');
const zip = new PizZip(content);
const xml = zip.file("word/document.xml").asText();

// A rough regex to match xml text content without tags
const textOnly = xml.replace(/<[^>]+>/g, '');
console.log("Menor de edad matches for NUMERO DE CEDULA:");
let index = 0;
while ((index = textOnly.indexOf('NUMERO DE CEDULA', index)) !== -1) {
    console.log("--- Match ---");
    console.log(textOnly.substring(Math.max(0, index - 50), Math.min(textOnly.length, index + 50)));
    index += 16;
}

const path2 = 'public/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx';
const content2 = fs.readFileSync(path2, 'binary');
const zip2 = new PizZip(content2);
const xml2 = zip2.file("word/document.xml").asText();

const textOnly2 = xml2.replace(/<[^>]+>/g, '');
console.log("\nMayor de edad matches for NUMERO DE CEDULA:");
let index2 = 0;
while ((index2 = textOnly2.indexOf('NUMERO DE CEDULA', index2)) !== -1) {
    console.log("--- Match ---");
    console.log(textOnly2.substring(Math.max(0, index2 - 50), Math.min(textOnly2.length, index2 + 50)));
    index2 += 16;
}
