const fs = require('fs');
let text = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');
text = text.replace('"DIRECCION FISICA DEL CAMPER": raw.direccionCamper,', '"DIRECCION FISICA DEL CAMPER": raw.direccionCamper,\n        "DIRECCION": raw.direccionCamper,');
text = text.replace('"CELULAR": raw.telefonoCamper,', '"CELULAR": raw.telefonoCamper,\n        "TELEFONO": raw.telefonoCamper,');
if (!text.includes('"CUOTAS_LIST": cuotasList')) {
    text = text.replace('"PLAN_PAGOS": planPagos,', '"PLAN_PAGOS": planPagos,\n        "CUOTAS_LIST": cuotasList,');
}
fs.writeFileSync('src/utils/contractGenerator.ts', text);
console.log('Fixed file');
