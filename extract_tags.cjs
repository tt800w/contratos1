const PizZip = require('pizzip');
const fs = require('fs');

const files = [
    'public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx',
    'public/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx'
];

let output = '';

files.forEach(path => {
    output += "-------------------\n";
    output += "Extracting tags from: " + path + "\n";
    const content = fs.readFileSync(path, 'binary');
    const zip = new PizZip(content);
    let xml = zip.file("word/document.xml").asText();
    
    let plainText = xml.replace(/<[^>]+>/g, '');
    
    let tags = new Set();
    let match;
    const regex = /\{([^}]+)\}/g;
    while ((match = regex.exec(plainText)) !== null) {
        tags.add(match[1]);
    }
    
    output += Array.from(tags).join('\n') + '\n';
});

fs.writeFileSync('out.txt', output);
console.log("Done");
