const fs = require('fs');
let text = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

// Replace all instances of `raw.fieldName` with `raw.fieldName || ""` to prevent 'undefined'
text = text.replace(/:\s*raw\.([a-zA-Z0-9_]+),/g, ': raw.$1 || "",');
text = text.replace(/:\s*raw\.([a-zA-Z0-9_]+)\s*\|\|\s*raw\.([a-zA-Z0-9_]+),/g, ': raw.$1 || raw.$2 || "",');

// Specific fix for TELEFONO which was added manually:
text = text.replace(/"TELEFONO":\s*raw\.telefonoCamper,/g, '"TELEFONO": raw.telefonoCamper || "",');
text = text.replace(/"DIRECCION":\s*raw\.direccionCamper,/g, '"DIRECCION": raw.direccionCamper || "",');

fs.writeFileSync('src/utils/contractGenerator.ts', text);
console.log('Fixed undefineds in contractGenerator.ts');
