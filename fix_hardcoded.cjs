const PizZip = require('pizzip');
const fs = require('fs');

const path = 'public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx';
const content = fs.readFileSync(path, 'binary');
const zip = new PizZip(content);
const xml = zip.file("word/document.xml").asText();

// Replace kamiloj73@gmail.com with {CORREO}
// We have to be careful about XML tags splitting it. But in docx, often email addresses are split into multiple tags due to spellcheck or links.
// Let's just do a plain string replace for kamiloj73@gmail.com if it's contiguous, and also try stripping xml to find it.
// Wait, I can just use a regex that ignores XML tags between characters:
const regex = /k(?:<[^>]+>)*a(?:<[^>]+>)*m(?:<[^>]+>)*i(?:<[^>]+>)*l(?:<[^>]+>)*o(?:<[^>]+>)*j(?:<[^>]+>)*7(?:<[^>]+>)*3(?:<[^>]+>)*@(?:<[^>]+>)*g(?:<[^>]+>)*m(?:<[^>]+>)*a(?:<[^>]+>)*i(?:<[^>]+>)*l(?:<[^>]+>)*\.(?:<[^>]+>)*c(?:<[^>]+>)*o(?:<[^>]+>)*m/gi;

let fixedXml = xml.replace(regex, '{CORREO}');

zip.file("word/document.xml", fixedXml);
const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(path, buffer);
console.log("Replaced kamiloj73@gmail.com in Menor de Edad.");

// Do the same for Mayor de Edad just in case it's there
const path2 = 'public/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx';
const content2 = fs.readFileSync(path2, 'binary');
const zip2 = new PizZip(content2);
const xml2 = zip2.file("word/document.xml").asText();
let fixedXml2 = xml2.replace(regex, '{EMAIL CAMPER}'); // In Mayor de edad it's EMAIL CAMPER
zip2.file("word/document.xml", fixedXml2);
const buffer2 = zip2.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(path2, buffer2);
console.log("Checked Mayor de Edad.");
