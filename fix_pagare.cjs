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

    // Replace all occurrences of 251 with {NUMERO DE PAGARE}
    // This is the most reliable way since Word XML can split strings arbitrarily.
    let fixedXml = xml.replace(/251/g, '{NUMERO DE PAGARE}');
    
    zip.file("word/document.xml", fixedXml);
    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(path, buffer);
    console.log("Fixed", path);
});

console.log("Done.");
