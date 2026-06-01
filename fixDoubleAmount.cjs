const fs = require('fs');
let text = fs.readFileSync('src/utils/contractGenerator.ts', 'utf8');

// Fix double amount issue
text = text.replace(/valor: `\$\{formatCurrencySpanish\(valor\)\.toUpperCase\(\)\} \(\$\$\{new Intl\.NumberFormat\('es-CO', \{ style: 'decimal', maximumFractionDigits: 0 \}\)\.format\(valor\)\} COP\)`/g, 'valor: `${formatCurrencySpanish(valor).toUpperCase()}`');
text = text.replace(/valor: `\$\{formatCurrencySpanish\(valorAUsar\)\.toUpperCase\(\)\} \(\$\$\{new Intl\.NumberFormat\('es-CO', \{ style: 'decimal', maximumFractionDigits: 0 \}\)\.format\(valorAUsar\)\} COP\)`/g, 'valor: `${formatCurrencySpanish(valorAUsar).toUpperCase()}`');

// Make fecha properties more granular so we can bold the date in docx
text = text.replace(/fecha_texto: fechaTexto/g, 'fecha_prefijo: fecha ? " con una fecha límite de pago de " : "",\n                    fecha_bold: fecha || "",\n                    fecha_sufijo: fecha ? " al momento de la firma del presente documento." : " al momento de la firma del presente documento."');

fs.writeFileSync('src/utils/contractGenerator.ts', text);
console.log('Fixed double amount and added fecha fields');
