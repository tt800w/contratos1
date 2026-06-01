const PizZip = require('pizzip');
const fs = require('fs');

const path = 'public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx';
const content = fs.readFileSync(path, 'binary');

const zip = new PizZip(content);
const xml = zip.file("word/document.xml").asText();

// The text could have XML tags inside the curly braces if Word split it, but docxtemplater says the tag starts with "{CORREO]Se".
// If there are XML tags between CORREO and ], a simple string replace might fail. 
// However, since docxtemplater saw "{CORREO]Se", it means they are adjacent in the stripped text. 
// Let's use a regex to replace `{CORREO]` even if there are XML tags in between.
// Docxtemplater strips XML tags when parsing, but they exist in the raw XML.
// Actually, it's safer to just replace '{CORREO]' if it exists, or handle it carefully.
// Let's do a simple replace first.
let fixedXml = xml.replace(/{CORREO]/g, '{CORREO}');
if (fixedXml === xml) {
    // try with regex to account for possible XML tags in between
    fixedXml = xml.replace(/{([^}]*?)CORREO([^}]*?)]/g, '{$1CORREO$2}');
}

zip.file("word/document.xml", fixedXml);
const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(path, buffer);

console.log("Document fixed.");
