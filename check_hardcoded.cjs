const PizZip = require('pizzip');
const fs = require('fs');

const path = 'public/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx';
const content = fs.readFileSync(path, 'binary');
const zip = new PizZip(content);
const xml = zip.file("word/document.xml").asText();
const textOnly = xml.replace(/<[^>]+>/g, '');

// Check for the name "kamiloj" just in case
if (textOnly.toLowerCase().includes('kamilo')) {
    console.log("Found kamilo in text:", textOnly.substring(textOnly.toLowerCase().indexOf('kamilo')-50, textOnly.toLowerCase().indexOf('kamilo')+50));
} else {
    console.log("No kamilo found.");
}

// Check for any 10-digit number starting with 3 that might be a hardcoded Colombian phone number
const phoneMatches = textOnly.match(/3\d{9}/g);
if (phoneMatches) {
    console.log("Found potential hardcoded phone numbers:", phoneMatches);
} else {
    console.log("No hardcoded 10-digit phone numbers found.");
}
