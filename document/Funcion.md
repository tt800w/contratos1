# 🧠 Cómo funciona el Gestor de Contratos

Este documento explica en detalle qué hace el programa, paso a paso, desde que el usuario abre la aplicación hasta que descarga el contrato firmado.

---

## 🗺️ Visión general

El programa es una herramienta web interna de **Campuslands** que automatiza la creación de contratos legales para los estudiantes (llamados *campers*). En lugar de llenar contratos a mano, el equipo administrativo sube un archivo Excel con los datos de los campers, selecciona la plantilla correcta, y el sistema genera el contrato completo en Word o PDF con todos los datos ya insertados.

```
Excel con datos        Plantilla Word        Contrato listo
del camper      +      (.docx)          →    (.docx / .pdf)
```

---

## 1️⃣ Carga del Excel de campers

**Archivo:** `src/utils/excelParser.ts` · `src/hooks/useCamperData.ts`

El primer paso es subir un archivo Excel (`.xlsx` o `.xls`) con la lista de campers.

### ¿Qué hace el sistema con el Excel?

1. Lee el archivo usando la librería **SheetJS (xlsx)**.
2. Convierte cada fila en un objeto con los datos del camper.
3. Para encontrar los datos, el parser busca los encabezados de columna con nombres flexibles. Por ejemplo, para el correo del camper acepta cualquiera de estas variantes:
   - `"Dirección electrónica del estudiante"`
   - `"Email Camper"`
   - `"Correo"`
   - `"Email"`
   - (y varios más...)

   Esto hace que el sistema funcione aunque el Excel tenga encabezados ligeramente distintos entre archivos.

4. Una vez procesado, la lista de campers aparece en el selectorVde la pantalla principal.

### Datos que extrae por camper

| Dato | Para qué se usa |
|---|---|
| Nombre del camper | Cuerpo del contrato |
| Documento del camper | Cuerpo del contrato |
| Tipo de identificación (CC/TI) | Determina si es mayor o menor de edad |
| Dirección del camper | Cuerpo del contrato |
| Email del camper | Cuerpo del contrato |
| Celular del camper | Cuerpo del contrato |
| Nombre del representante | Contratos de menores de edad |
| Cédula del representante | Contratos de menores de edad |
| Email del representante | Contratos de menores de edad |
| Teléfono del representante | Contratos de menores de edad |
| Fecha de nacimiento / Edad | Categorización por edad |

---

## 2️⃣ Clasificación por edad (menor / mayor)

**Archivo:** `src/utils/studentUtils.ts`

Cuando se selecciona un camper, el sistema determina automáticamente si es **menor de edad** o **mayor de edad**. Esto es importante porque Campuslands tiene plantillas de contrato diferentes para cada caso (el contrato de un menor lo firma el representante legal).

### ¿Cómo lo determina?

El sistema revisa los datos en este orden de prioridad:

```
1. Tipo de identificación (más confiable)
   ├── CC o "Cédula"  →  Mayor de edad
   └── TI o "Tarjeta de Identidad"  →  Menor de edad

2. Campo "Edad" (si existe en el Excel)
   ├── < 18  →  Menor
   └── ≥ 18  →  Mayor

3. Fecha de nacimiento (cálculo automático)
   └── Calcula la edad actual y decide
```

Con la categoría definida, la interfaz filtra las plantillas disponibles y solo muestra las que corresponden a esa categoría.

---

## 3️⃣ Gestión de plantillas

**Archivo:** `src/components/ContractManagementPanel.tsx` · `src/hooks/useStoredContracts.ts`

Las plantillas de contrato son archivos `.docx` o `.pdf` que el equipo administrativo sube desde el panel de configuración (ícono ⚙️ en la cabecera).

### ¿Qué pasa cuando se sube una plantilla?

1. El sistema lee el archivo y lo convierte a **Base64** (cadena de texto que representa el archivo binario).
2. Detecta automáticamente si la plantilla es para menor o mayor de edad leyendo el nombre del archivo:
   - Si contiene `"mayor"`, `"18+"` → categoría `mayor`
   - Si contiene `"menor"`, `"-18"` → categoría `menor`
3. Guarda la plantilla en el **localStorage** del navegador bajo la clave `campuslands_contracts_v1`.

> ⚠️ Las plantillas se guardan **en el navegador**. Si se borra la caché o se usa otro equipo, hay que volver a subirlas.

### Acciones disponibles sobre plantillas

- **Guardar** nueva plantilla
- **Reemplazar** una plantilla existente con un archivo nuevo
- **Descargar** la plantilla original almacenada
- **Eliminar** una plantilla

---

## 4️⃣ Configuración del contrato

Antes de generar el documento, el usuario completa estos campos en el panel izquierdo:

| Campo | Descripción |
|---|---|
| **Número de pagaré** | Identificador del pagaré, se inserta en la plantilla como `{NUMERO DE PAGARE}` |
| **Fecha del contrato** | Fecha de firma. Se divide en día, mes y año para insertarse por separado |
| **Monto de formación** | Valor en pesos. Se formatea en números (`$13.000.000`) y en letras (`"trece millones de pesos"`) |
| **Plan de pagos** | Checkbox que activa la tabla de amortización |

---

## 5️⃣ Generación del plan de pagos (tabla de amortización)

**Archivo:** `src/utils/contractGenerator.ts` · `src/pages/Index.tsx`

Cuando el checkbox **"Plan de pagos"** está activado, aparece el módulo de amortización.

### ¿Cómo funciona el cálculo?

El usuario ingresa:
- **Monto total a pagar** (ej: `$5.000.000`)
- **Número de cuotas** (ej: `10`)
- **Fecha de la primera cuota** (ej: `2024-03-01`)

El sistema calcula:

```
Cuota base = FLOOR(total / número_de_cuotas)
Última cuota = total − (cuota_base × (n−1))   ← absorbe el residuo del redondeo
```

Cada cuota tiene una fecha que avanza mes a mes desde la fecha inicial.

El resultado es una lista de cuotas con:
- Número de cuota
- Fecha de vencimiento
- Monto de la cuota
- Saldo restante (decrece hasta llegar a `$0`)

Esta lista se puede **descargar como Excel** (`.xls`) para uso administrativo, e **inyectarse dentro del contrato Word** como tabla profesional.

### La tabla dentro del contrato Word

La tabla de amortización se inserta en el lugar donde la plantilla tenga la etiqueta `{PLAN DE PAGOS}`. El sistema reemplaza esa etiqueta con una tabla Word real (XML nativo de `.docx`) con estas características:

- **Ancho completo de la página** (8300 unidades = área útil en A4 con márgenes estándar)
- Encabezado con fondo **azul corporativo** (`#1F3864`) y texto blanco en negrita
- Filas alternas **blanco / gris claro** para facilitar la lectura
- Columnas: `#` | `Fecha` | `Cuota` | `Saldo`
- Valores monetarios **alineados a la derecha** (estilo financiero)
- Si hay muchas cuotas, la tabla **continúa en la siguiente página** de forma natural sin romperse

---

## 6️⃣ Generación del contrato Word

**Archivo:** `src/utils/contractGenerator.ts`

Este es el proceso central del programa.

### Paso a paso

```
1. Cargar la plantilla .docx como binario (ArrayBuffer)
         ↓
2. Abrir el binario con PizZip
   (el .docx es un ZIP que contiene archivos XML internos)
         ↓
3. Si hay plan de pagos → inyectar la tabla de amortización en word/document.xml
   Si no hay plan de pagos → eliminar del documento la etiqueta {PLAN DE PAGOS}
         ↓
4. Preparar los datos del camper (prepareUnifiedData)
   → Formatear fechas, montos, convertir números a letras
         ↓
5. Renderizar con docxtemplater
   → Cada {ETIQUETA} en la plantilla se reemplaza con el valor real
         ↓
6. Pasar el documento por el control de calidad (runDocumentQualityPass):
   → Normalizar espacios dobles
   → Eliminar saltos de página innecesarios
   → Eliminar párrafos vacíos redundantes
   → Auditar numeración de cláusulas
         ↓
7. Generar el archivo .docx final y descargarlo
```

### Conversión de números a letras

El campo `{VALOR LETRAS}` y `{VALOR FORMACION LETRAS}` se generan con el módulo `numberToWords.ts`, que convierte cualquier número entero a su equivalente en español colombiano.

Ejemplo:
```
13000000  →  "trece millones de pesos"
```

### Control de calidad automático

Antes de entregar el documento, el sistema ejecuta estas limpiezas:

| Proceso | Qué hace |
|---|---|
| `normalizeTextSpacing` | Elimina espacios dobles dentro del texto |
| `removeUnnecessaryPaginationBreaks` | Quita saltos de página forzados antes de secciones como el pagaré o los anexos |
| `removeExcessEmptyParagraphs` | Elimina párrafos vacíos consecutivos (deja máximo uno) |
| `auditDocumentLayout` | Detecta en consola si hay cláusulas con numeración repetida |

---

## 7️⃣ Generación del contrato PDF

El PDF no se genera desde el servidor. El proceso es:

1. Se genera el `.docx` internamente (sin descargarlo).
2. Se renderiza visualmente en el visor de documentos de la pantalla derecha.
3. Se captura ese visor con **html2pdf.js** (que usa html2canvas internamente).
4. Se exporta la captura como PDF en formato A4.

> ℹ️ La calidad del PDF depende del renderizado visual del navegador, no de la conversión nativa del `.docx`.

---

## 8️⃣ Vista previa

El botón **"Actualizar vista previa"** genera el contrato en memoria y lo muestra en el panel derecho de la pantalla usando el componente `DocxViewer`, que renderiza el `.docx` directamente en el navegador con la librería **docx-preview**.

Esto permite revisar el documento antes de descargarlo.

> ⚠️ La vista previa no está disponible para plantillas PDF.

---

## 9️⃣ Envío a ZapSign (firma digital)

**Archivo:** `src/utils/zapSignService.ts`

ZapSign es la plataforma de firma digital que usa Campuslands. Cuando el usuario hace clic en **"Enviar a ZapSign"**:

1. Se genera el contrato `.docx` en memoria.
2. Se convierte a **Base64**.
3. Se envía a la API de ZapSign (`POST /v1/docs/`) con el nombre del archivo y los firmantes.
4. ZapSign responde con un `token` que identifica el documento.
5. La aplicación abre automáticamente en una nueva pestaña la URL `https://app.zapsign.com.br/documento/{token}`, donde el equipo puede gestionar las firmas.

El token de autenticación de ZapSign se configura en la variable de entorno `VITE_ZAPSIGN_API_TOKEN`.

> ⚠️ Solo funciona con contratos `.docx`. Las plantillas PDF se descargan directamente sin pasar por ZapSign.

---

## 🔢 Nombre del archivo generado

El nombre del archivo descargado se construye a partir del nombre del camper y el tipo de extensión:

```
Ejemplos:
  Juan Perez Martinez.docx
  Maria Lopez.pdf
```

Se limpia automáticamente de caracteres especiales (`\ / : * ? " < > |`) que no son válidos en nombres de archivo.

---

## 💾 Persistencia de datos

| Qué | Dónde se guarda | Cuándo se pierde |
|---|---|---|
| Plantillas de contratos | `localStorage` del navegador | Si se borra la caché o se cambia de navegador/equipo |
| Lista de campers del Excel | Memoria RAM (estado de React) | Al recargar la página |
| Amortización calculada | Memoria RAM (estado de React) | Al recargar la página |

---

## 🔁 Resumen del flujo completo

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO ABRE LA APP                   │
└────────────────────────┬────────────────────────────────┘
                         │
               ┌─────────▼──────────┐
               │  Sube Excel        │   → El sistema parsea y carga
               │  de campers        │     la lista de campers
               └─────────┬──────────┘
                         │
               ┌─────────▼──────────┐
               │  Selecciona camper │   → El sistema detecta si es
               │                    │     menor o mayor de edad
               └─────────┬──────────┘
                         │
               ┌─────────▼──────────┐
               │  Selecciona        │   → Se filtran automáticamente
               │  plantilla         │     las plantillas disponibles
               └─────────┬──────────┘
                         │
               ┌─────────▼──────────┐
               │  Completa campos   │   → Pagaré, fecha, monto,
               │  del formulario    │     plan de pagos (opcional)
               └─────────┬──────────┘
                         │
               ┌─────────▼──────────┐
               │  Genera contrato   │   → docxtemplater reemplaza
               │  Word / PDF        │     etiquetas y construye
               └─────────┬──────────┘     el documento final
                         │
          ┌──────────────┼──────────────┐
          │              │              │
   ┌──────▼──────┐ ┌─────▼─────┐ ┌────▼────────────┐
   │ Descarga    │ │ Descarga  │ │ Envía a ZapSign │
   │ .docx       │ │ .pdf      │ │ para firma      │
   └─────────────┘ └───────────┘ └─────────────────┘
```

---

*Documento de referencia interna — Campuslands.*
