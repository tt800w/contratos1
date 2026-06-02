const fs = require('fs');
let text = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

// Find the representative data section
const regex = /"CEDULA REPRESENTANTE": raw\.cedulaRepresentante \|\| "",/g;
if (text.match(regex) && !text.includes('TELEFONO REP CAMPER')) {
    text = text.replace(regex, `"CEDULA REPRESENTANTE": raw.cedulaRepresentante || "",\n\n        "TELEFONO REP CAMPER": raw.telefonoRepresentante || "",\n        "TELEFONO REPRESENTANTE": raw.telefonoRepresentante || "",\n        "CELULAR REPRESENTANTE": raw.telefonoRepresentante || "",`);
    fs.writeFileSync('src/utils/contractGenerator.ts', text);
    console.log('Added TELEFONO REP CAMPER');
} else {
    console.log('Already added or regex not matched');
}
