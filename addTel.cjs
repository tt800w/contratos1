const fs = require('fs');
let text = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

if (!text.includes('"TELEFONO REP CAMPER":')) {
    text = text.replace(/"EMAIL REP CAMPER":/g, '"TELEFONO REP CAMPER": raw.telefonoRepresentante || "",\n        "EMAIL REP CAMPER":');
    fs.writeFileSync('src/utils/contractGenerator.ts', text);
    console.log('Added TELEFONO REP CAMPER');
}
