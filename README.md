# 📄 Gestor de Contratos — Campuslands

Aplicación web interna para la generación automática de contratos legales en formato **Word (.docx)** y **PDF**, con soporte de planes de pago, tablas de amortización y envío a firma digital vía **ZapSign**.

---

## 🚀 Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Estilos | Tailwind CSS + shadcn/ui + Radix UI |
| Formularios | React Hook Form + Zod |
| Generación Word | docxtemplater + PizZip |
| Generación PDF | html2pdf.js |
| Lectura Excel | xlsx (SheetJS) |
| Firma digital | ZapSign API |
| Estado global | TanStack Query |
| Routing | React Router DOM v6 |

---

## 📁 Estructura del proyecto

```
contratos1/
├── document/
│   └── Tags.md                  # Referencia de etiquetas disponibles para plantillas
├── public/                      # Archivos estáticos
├── src/
│   ├── components/
│   │   ├── CommonFields.tsx      # Campos reutilizables del formulario
│   │   ├── ContractCard.tsx      # Tarjeta visual de contrato
│   │   ├── ContractLayout.tsx    # Layout general del contrato
│   │   ├── ContractManagementPanel.tsx  # Panel de gestión de plantillas
│   │   ├── DocxViewer.tsx        # Vista previa del documento generado
│   │   ├── FormInput.tsx         # Input genérico del formulario
│   │   ├── FormSection.tsx       # Sección agrupadora de formulario
│   │   ├── Header.tsx            # Cabecera de la aplicación
│   │   ├── NavLink.tsx           # Enlace de navegación
│   │   ├── PaymentPlanFields.tsx # Campos del plan de pagos
│   │   ├── UserSelector.tsx      # Selector de camper
│   │   └── ui/                  # Componentes base shadcn/ui
│   ├── hooks/
│   │   ├── useCamperData.ts      # Carga y parseo del Excel de campers
│   │   └── useStoredContracts.ts # Persistencia de plantillas en localStorage
│   ├── pages/
│   │   ├── Index.tsx             # Página principal
│   │   └── NotFound.tsx          # Página 404
│   ├── types/
│   │   └── contracts.ts          # Tipos TypeScript del dominio
│   ├── utils/
│   │   ├── contractGenerator.ts  # Motor de generación de contratos Word/PDF
│   │   ├── excelParser.ts        # Parser del Excel de campers
│   │   ├── numberToWords.ts      # Conversión de números a texto en español
│   │   ├── studentUtils.ts       # Utilidades de categoría por edad
│   │   ├── validation.ts         # Esquemas de validación Zod
│   │   └── zapSignService.ts     # Integración con ZapSign API
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env                          # Variables de entorno (no se sube al repo)
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

---

## ⚙️ Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd contratos1
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
VITE_ZAPSIGN_API_TOKEN=tu_token_de_zapsign_aqui
```

> ⚠️ **Nunca subas el archivo `.env` al repositorio.** Ya está incluido en `.gitignore`.

### 4. Iniciar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:8080`.

---

## 🏗️ Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción optimizado |
| `npm run build:dev` | Build en modo desarrollo |
| `npm run preview` | Previsualizar el build de producción |
| `npm run lint` | Análisis estático de código con ESLint |
| `npm run test` | Ejecutar tests con Vitest |
| `npm run test:watch` | Tests en modo watch |

---

## 🔄 Flujo de uso

```
1. Cargar Excel de campers
        ↓
2. Seleccionar camper de la lista
        ↓
3. Seleccionar plantilla de contrato
   (filtrada automáticamente por edad: menor / mayor)
        ↓
4. Completar campos: pagaré, fecha, monto de formación
        ↓
5. (Opcional) Activar plan de pagos
   → Ingresar monto, número de cuotas y fecha inicial
   → Generar tabla de amortización
   → Descargar Excel de amortización
        ↓
6. Generar contrato:
   • Word (.docx)
   • PDF
   • Vista previa
   • Enviar a ZapSign para firma digital
```

---

## 📋 Plantillas de contratos

Las plantillas se cargan desde el panel de configuración (ícono ⚙️ en la cabecera). Cada plantilla se asigna a una categoría de edad:

- **Menor de edad** — el representante legal firma el contrato
- **Mayor de edad** — el camper firma directamente

Las plantillas se almacenan en `localStorage` del navegador en la clave `campuslands_contracts_v1`.

### Etiquetas disponibles en las plantillas

Las plantillas `.docx` usan llaves simples `{ETIQUETA}` para los campos dinámicos:

| Etiqueta | Descripción |
|---|---|
| `{NOMBRE DEL CAMPER}` | Nombre completo del camper |
| `{NOMBRE DEL REPRESENTANTE LEGAL}` | Nombre del representante o acudiente |
| `{NUMERO DE CEDULA}` | Cédula del representante |
| `{NUMERO DE DOCUMENTO}` | Documento del camper |
| `{DIRECCION FISICA DEL CAMPER}` | Dirección de residencia |
| `{DIA}` | Día de firma del contrato |
| `{MES}` | Mes de firma del contrato |
| `{ANUAL}` | Año de firma del contrato |
| `{EMAIL CAMPER}` | Correo del camper |
| `{EMAIL REPRESENTANTE}` | Correo del representante |
| `{CELULAR CAMPER}` | Teléfono del camper |
| `{CELULAR REPRESENTANTE}` | Teléfono del representante |
| `{VALOR LETRAS}` | Valor de formación en letras |
| `{VALOR FORMACION}` | Valor de formación en números |
| `{NUMERO DE PAGARE}` | Número del pagaré |
| `{PLAN DE PAGOS}` | Tabla de amortización (se reemplaza con la tabla Word) |

> 📖 Consulta el archivo completo de etiquetas en [`document/Tags.md`](./document/Tags.md).

---

## 📊 Tabla de amortización (Plan de pagos)

Cuando se activa el plan de pagos, el sistema genera una tabla financiera profesional dentro del documento Word con las siguientes características:

- **Ancho completo de página A4** (8300 dxa — área útil sin márgenes)
- Encabezado con fondo azul corporativo (`#1F3864`) y texto blanco
- Filas alternas blanco / gris claro para facilitar la lectura
- Columnas: `#` | `Fecha` | `Cuota` | `Saldo`
- Valores monetarios alineados a la derecha (estilo financiero)
- Continuación natural en la siguiente página si hay muchas cuotas
- Saldo final exactamente en `$0`

La tabla se inyecta reemplazando la etiqueta `{PLAN DE PAGOS}` en la plantilla.

---

## ✍️ Integración con ZapSign

El botón **"Enviar a ZapSign"** sube el contrato generado directamente a la plataforma de firma digital y abre el enlace de administración del documento en una nueva pestaña.

**Requisitos:**
- El contrato debe ser de tipo `.docx` (no PDF)
- La variable `VITE_ZAPSIGN_API_TOKEN` debe estar configurada en `.env`
- El proxy de Vite redirige las llamadas a `/zapsign-api` para evitar errores CORS en desarrollo

---

## 📥 Formato del Excel de campers

El archivo Excel debe tener las siguientes columnas (el parser es flexible con los nombres exactos):

| Campo requerido | Descripción |
|---|---|
| Nombre completo del camper | Nombre del estudiante |
| Tipo de identificación | CC, TI, CE, Pasaporte, etc. |
| Número del documento | Documento del camper |
| Contacto del camper | Teléfono del camper |
| Dirección electrónica del estudiante | Correo del camper |
| Dirección de residencia | Dirección del camper |
| Nombre del representante completo | Nombre del acudiente |
| Número del documento del acudiente | Cédula del representante |
| Contacto del acudiente | Teléfono del representante |
| Dirección electrónica del acudiente | Correo del representante |
| Tipo financiación | Tipo de pago del camper |

---

## 🧪 Tests

El proyecto usa **Vitest** con **Testing Library** para pruebas unitarias y de componentes.

```bash
# Ejecutar todos los tests
npm run test

# Modo watch (útil en desarrollo)
npm run test:watch
```

---

## 🤝 Contribución

1. Crea una rama desde `main`: `git checkout -b feature/nombre-de-la-feature`
2. Realiza tus cambios y commitea: `git commit -m "feat: descripción"`
3. Abre un Pull Request hacia `main`

---

## 📌 Notas importantes

- Las plantillas se guardan en `localStorage` y **no se sincronizan entre equipos**. Cada usuario debe cargar sus plantillas manualmente.
- Para ambientes de producción, configura correctamente el proxy de ZapSign en el servidor web (Nginx / Apache) equivalente a la configuración del proxy de Vite.
- El PDF se genera capturando la vista previa renderizada en el DOM, por lo que la calidad depende del renderizado del visor `.docx`.

---

*Desarrollado para uso interno de **Campuslands**.*
