const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');

const path = 'public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx';
const content = fs.readFileSync(path, 'binary');

try {
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{", end: "}" }
    });
    
    doc.render({});
    console.log("No parsing errors found.");
} catch (error) {
    if (error.properties && error.properties.errors) {
        console.error("MULTI ERROR DETAILS:");
        error.properties.errors.forEach(function(e) {
            console.error("-", e.message, "||", e.properties);
        });
    } else {
        console.error("OTHER ERROR:", error);
    }
}
