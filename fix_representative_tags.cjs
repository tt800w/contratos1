const PizZip = require('pizzip');
const fs = require('fs');

const path = 'public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx';
const content = fs.readFileSync(path, 'binary');
const zip = new PizZip(content);
let xml = zip.file("word/document.xml").asText();

// Sometimes tags might be split by XML. I'll just try standard replace first.
xml = xml.replace(/\{EMAIL CAMPER\}/g, '{CORREO}');
xml = xml.replace(/\{CELULAR CAMPER\}/g, '{CELULAR REPRESENTANTE}');

// Just in case they are split (e.g. {</w:t>...<w:t>EMAIL CAMPER}):
xml = xml.replace(/\{([^}]*)EMAIL([^}]*)CAMPER([^}]*)\}/g, '{CORREO}');
xml = xml.replace(/\{([^}]*)CELULAR([^}]*)CAMPER([^}]*)\}/g, '{CELULAR REPRESENTANTE}');

zip.file("word/document.xml", xml);
const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(path, buffer);
console.log("Replaced EMAIL CAMPER and CELULAR CAMPER in Menor de Edad.");
