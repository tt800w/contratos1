const fs = require('fs');
let text = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');
text = text.replace('"EMAIL REP CAMPER": raw.emailRepresentante || raw.emailCamper,', '"EMAIL REP CAMPER": raw.emailRepresentante || "",');
fs.writeFileSync('src/utils/contractGenerator.ts', text);
