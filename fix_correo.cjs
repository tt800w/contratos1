const PizZip = require('pizzip');
const fs = require('fs');

const files = [
    'public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx',
    'public/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx'
];

files.forEach(path => {
    const content = fs.readFileSync(path, 'binary');
    const zip = new PizZip(content);
    const xml = zip.file("word/document.xml").asText();

    // Word sometimes adds xml tags inside brackets, e.g. [<w:t>correo electrónico</w:t>]
    // Using a regex to match [correo electrónico] ignoring intermediate xml tags.
    // Replace: [ (xml tags) correo electrónico (xml tags) ] -> {CORREO}
    // But since it might be split across multiple <w:t>, let's just do a simple replace first.
    let fixedXml = xml.replace(/\[correo electrónico\]/gi, '{CORREO}');
    
    // Also try a regex if it's split
    fixedXml = fixedXml.replace(/\[([^\]]*?)correo([^\]]*?)electrónico([^\]]*?)\]/gi, '{CORREO}');
    // And also just in case there are no accents
    fixedXml = fixedXml.replace(/\[([^\]]*?)correo([^\]]*?)electronico([^\]]*?)\]/gi, '{CORREO}');

    zip.file("word/document.xml", fixedXml);
    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(path, buffer);
    console.log("Fixed", path);
});

console.log("Done.");
