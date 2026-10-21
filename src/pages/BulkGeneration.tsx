import { useState } from "react";
import { Upload, Folder, Play, CheckCircle, AlertCircle, FileSpreadsheet, Download, RefreshCw, ArrowLeft, Wrench, Sparkles, X, Check, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { parseExcel, CamperData } from "@/utils/excelParser";
import { ensureFolder, uploadFileToDrive } from "@/utils/googleDriveService";
import { prepareUnifiedData, generateContract, getContractFileName } from "@/utils/contractGenerator";
import { parseCurrency } from "@/utils/numberToWords";
import { isOfficialDate, getDateFormatErrorMessage, OFFICIAL_DATE_FORMAT, OFFICIAL_DATE_EXAMPLE, tryAutoFixDate } from "@/utils/dateFormat";
import { validateColombianPhone, cleanColombianPhone } from "@/utils/phoneValidation";
import * as xlsx from "xlsx";

interface DateFieldError {
  campo: string;        // Ej: "Fecha Contrato", "Fecha Cuota 2"
  valor: string;        // Valor tal cual se encontró en el Excel
  mensaje: string;      // Mensaje explicativo para el usuario
}

interface ProcessResult {
  camper: CamperData;
  status: 'pending' | 'success' | 'error';
  message: string;
  errors?: string[];
  dateErrors?: DateFieldError[];
}

const DATE_CELL_HINT = ` La celda está guardada como fecha de Excel con un formato distinto: cambie el formato de la columna a "Texto" y escriba la fecha como ${OFFICIAL_DATE_FORMAT}.`;

const buildDateFieldError = (campo: string, valor: string, esCeldaFecha?: boolean): DateFieldError => ({
  campo,
  valor,
  mensaje: getDateFormatErrorMessage(valor) + (esCeldaFecha ? DATE_CELL_HINT : ""),
});

export default function BulkGeneration() {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("Contratos Masivos");
  const [file, setFile] = useState<File | null>(null);
  const [_data, setData] = useState<CamperData[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [_logs, setLogs] = useState<{ type: 'success' | 'error' | 'info'; message: string }[]>([]);
  const [activePopover, setActivePopover] = useState<number | null>(null);

  // Estado para la sección de Corrección de Errores
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [draftCampers, setDraftCampers] = useState<Record<number, CamperData>>({});

  const resetProcess = () => {
    setFile(null);
    setData([]);
    setResults([]);
    setIsProcessing(false);
    setIsFinished(false);
    setProgress(0);
    setLogs([]);
    setActivePopover(null);
    setIsCorrectionOpen(false);
    setDraftCampers({});
  };

  const openCorrectionModal = () => {
    const draft: Record<number, CamperData> = {};
    results.forEach((r, idx) => {
      if (r.status === 'error') {
        draft[idx] = JSON.parse(JSON.stringify(r.camper));
      }
    });
    setDraftCampers(draft);
    setIsCorrectionOpen(true);
  };

  const closeCorrectionModal = () => {
    setIsCorrectionOpen(false);
  };

  const updateDraftField = (recordIdx: number, field: keyof CamperData, value: any) => {
    setDraftCampers(prev => ({
      ...prev,
      [recordIdx]: {
        ...prev[recordIdx],
        [field]: value
      }
    }));
  };

  const updateDraftCuota = (recordIdx: number, cuotaIdx: number, field: 'fecha' | 'valor', value: any) => {
    setDraftCampers(prev => {
      const camper = prev[recordIdx];
      if (!camper) return prev;
      const cuotas = [...(camper.cuotasDetalle || [])];
      while (cuotas.length <= cuotaIdx) {
        cuotas.push({ valor: 0, fecha: "" });
      }
      cuotas[cuotaIdx] = {
        ...cuotas[cuotaIdx],
        [field]: field === 'valor' ? (Number(value) || 0) : value
      };
      return {
        ...prev,
        [recordIdx]: {
          ...camper,
          cuotasDetalle: cuotas
        }
      };
    });
  };

  const autoFixSingleDate = (recordIdx: number, field: 'fechaContrato' | number) => {
    setDraftCampers(prev => {
      const camper = { ...prev[recordIdx] };
      if (!camper) return prev;
      if (field === 'fechaContrato') {
        if (camper.fechaContrato) {
          camper.fechaContrato = tryAutoFixDate(camper.fechaContrato);
        }
      } else {
        const cuotas = [...(camper.cuotasDetalle || [])];
        if (cuotas[field] && cuotas[field].fecha) {
          cuotas[field] = {
            ...cuotas[field],
            fecha: tryAutoFixDate(cuotas[field].fecha)
          };
        }
        camper.cuotasDetalle = cuotas;
      }
      return {
        ...prev,
        [recordIdx]: camper
      };
    });
  };

  const autoFixCamperDates = (recordIdx: number) => {
    setDraftCampers(prev => {
      const camper = { ...prev[recordIdx] };
      if (!camper) return prev;
      if (camper.fechaContrato) {
        camper.fechaContrato = tryAutoFixDate(camper.fechaContrato);
      }
      if (camper.cuotasDetalle) {
        camper.cuotasDetalle = camper.cuotasDetalle.map(cd => ({
          ...cd,
          fecha: cd.fecha ? tryAutoFixDate(cd.fecha) : cd.fecha
        }));
      }
      return {
        ...prev,
        [recordIdx]: camper
      };
    });
    toast.success("Fechas corregidas para este registro.");
  };

  const autoFixAllDates = () => {
    let countFixed = 0;
    setDraftCampers(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        const idx = Number(key);
        const camper = { ...updated[idx] };
        if (camper.fechaContrato) {
          const fixed = tryAutoFixDate(camper.fechaContrato);
          if (fixed !== camper.fechaContrato) {
            camper.fechaContrato = fixed;
            countFixed++;
          }
        }
        if (camper.cuotasDetalle) {
          camper.cuotasDetalle = camper.cuotasDetalle.map(cd => {
            if (cd.fecha) {
              const fixed = tryAutoFixDate(cd.fecha);
              if (fixed !== cd.fecha) {
                countFixed++;
                return { ...cd, fecha: fixed };
              }
            }
            return cd;
          });
        }
        updated[idx] = camper;
      });
      return updated;
    });
    toast.success(`Se auto-corrigieron las fechas detectadas (${countFixed} cambios aplicados).`);
  };

  const handleSaveCorrections = () => {
    const updatedAllCampers: CamperData[] = results.map((r, idx) => {
      return draftCampers[idx] !== undefined ? draftCampers[idx] : r.camper;
    });

    const newResults = validateData(updatedAllCampers);
    setData(updatedAllCampers);
    setResults(newResults);

    const remainingErrors = newResults.filter(r => r.status === 'error').length;
    if (remainingErrors === 0) {
      toast.success("¡Todos los errores fueron corregidos exitosamente! Ya puedes generar los contratos.");
      setIsCorrectionOpen(false);
      setDraftCampers({});
    } else {
      const newDraft: Record<number, CamperData> = {};
      newResults.forEach((r, idx) => {
        if (r.status === 'error') {
          newDraft[idx] = JSON.parse(JSON.stringify(r.camper));
        }
      });
      setDraftCampers(newDraft);
      toast.warning(`Se actualizaron los registros. Aún quedan ${remainingErrors} contrato(s) con errores por subsanar.`);
    }
  };

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      toast.success("Autenticado con Google Drive");
      addLog('info', 'Sesión iniciada con Google Drive exitosamente.');
    },
    onError: () => {
      toast.error("Error al iniciar sesión con Google");
      addLog('error', 'Error al autenticar con Google Drive.');
    },
    scope: "https://www.googleapis.com/auth/drive.file",
  });

  const addLog = (type: 'success' | 'error' | 'info', message: string) => {
    setLogs((prev) => [...prev, { type, message }]);
  };

  const updateResultStatus = (index: number, status: 'success' | 'error', message: string, errors?: string[]) => {
    setResults(prev => {
      const newArr = [...prev];
      if (newArr[index]) {
        newArr[index] = { ...newArr[index], status, message, errors: errors || newArr[index].errors };
      }
      return newArr;
    });
  };

  const downloadTemplate = () => {
    const wsData = [
      [
        "Tipo Documento", "Nombre completo Camper", "Documento", "Dirección", "Correo", "Celular",
        "Nombre Acudiente", "Documento Acudiente", "Correo Acudiente", "Celular Acudiente",
        "Pagaré", "Jornada", "Fecha Contrato", "Valor Formación", "Cuotas", "Valor Total Objetivo",
        "Cuota 1", "Fecha Cuota 1", "Cuota 2", "Fecha Cuota 2", "Cuota 3", "Fecha Cuota 3"
      ],
      [
        "CC", "Juan Perez", "100123456", "Calle 1 # 2-3", "juan@test.com", "3001234567",
        "", "", "", "",
        "123", "diurna", "10/08/2026", "18000000", "2", "13000000",
        "6500000", "01/09/2026", "6500000", "01/10/2026", "", ""
      ],
      [
        "TI", "Ana Gomez", "100987654", "Carrera 4 # 5-6", "ana@test.com", "3101234567",
        "Maria Gomez", "50123456", "maria@test.com", "3151234567",
        "124", "nocturna", "11/08/2026", "18000000", "3", "12000000",
        "4000000", "15/09/2026", "4000000", "15/10/2026", "4000000", "15/11/2026"
      ]
    ];
    const ws = xlsx.utils.aoa_to_sheet(wsData);

    // Formatear columnas de fecha, celular y documento explícitamente como Texto (@) para preservar formato sin alteración
    const textColIndexes = [2, 5, 7, 9, 10, 12, 17, 19, 21]; // Documento, Celular, Doc Acudiente, Cel Acudiente, Pagaré, Fecha Contrato, Cuotas...
    textColIndexes.forEach((c) => {
      for (let r = 1; r < wsData.length; r++) {
        const cellRef = xlsx.utils.encode_cell({ r, c });
        if (ws[cellRef]) {
          ws[cellRef].t = 's';
          ws[cellRef].z = '@';
        }
      }
    });

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Plantilla Masiva");
    xlsx.writeFile(wb, "Plantilla_Contratos_Masivos.xlsx");
    toast.success("Plantilla descargada");
  };

  const validateData = (parsedData: CamperData[]): ProcessResult[] => {
    const initialResults: ProcessResult[] = [];
    const pagaresSet = new Set<string>();

    for (let i = 0; i < parsedData.length; i++) {
      const c = parsedData[i];
      const errors: string[] = [];
      const dateErrors: DateFieldError[] = [];

      const tipo = (c.tipoDocumentoCamper || "TI").toUpperCase();

      // 1. Obligatorios
      if (!c.nombreCamper) errors.push("Nombre del Camper es requerido");
      if (!c.documentoCamper) errors.push("Documento del Camper es requerido");
      if (!c.pagare) errors.push("Número de Pagaré es requerido");
      if (!c.valorFormacion) errors.push("Valor de Formación es requerido");
      if (!c.valorTotalObjetivo) errors.push("Valor Total Objetivo es requerido");
      if (!c.fechaContrato) errors.push("Fecha del Contrato es requerida");
      else if (!isOfficialDate(c.fechaContrato)) {
        // Formato estricto: no se adivina ni se convierte (ej. 10/16/2026 o 16/10/2026 se rechazan)
        dateErrors.push(buildDateFieldError("Fecha Contrato", c.fechaContrato, c.fechaContratoEsCeldaFecha));
      }

      // Validación estricta del número de celular del camper (10 dígitos colombianos iniciando en 3)
      const celCamperValidation = validateColombianPhone(c.celularCamper);
      if (!celCamperValidation.isValid) {
        errors.push(`Celular del Camper: ${celCamperValidation.errorMessage}`);
      }

      // 2. Acudiente obligatorio para TI
      if (tipo === "TI") {
        if (!c.nombreRepresentante) errors.push("Nombre del Acudiente (Requerido por ser TI)");
        if (!c.cedulaRepresentante) errors.push("Documento del Acudiente (Requerido por ser TI)");
        if (c.telefonoRepresentante) {
          const celAcudienteVal = validateColombianPhone(c.telefonoRepresentante);
          if (!celAcudienteVal.isValid) {
            errors.push(`Celular del Acudiente: ${celAcudienteVal.errorMessage}`);
          }
        }
      }

      // 3. Pagarés duplicados en el mismo excel
      if (c.pagare) {
        if (pagaresSet.has(c.pagare)) {
          errors.push(`El pagaré ${c.pagare} está duplicado en el archivo`);
        } else {
          pagaresSet.add(c.pagare);
        }
      }

      // 4. Validaciones financieras
      const valorTotalObjetivoNumerico = parseCurrency(c.valorTotalObjetivo);
      const valorFormacionNumerico = parseCurrency(c.valorFormacion);
      const expectedCuotasCount = parseInt(c.cuotas?.trim() || "0");

      if (valorTotalObjetivoNumerico <= 0) {
        errors.push("Valor Total Objetivo es requerido y debe ser mayor a 0");
      } else if (valorTotalObjetivoNumerico > 100000000) {
        errors.push(`Valor Total Objetivo ($${valorTotalObjetivoNumerico.toLocaleString()}) es excesivamente alto. Verifique que no tenga ceros decimales erróneos.`);
      }

      if (valorFormacionNumerico <= 0) {
        errors.push("Valor de Formación es requerido y debe ser mayor a 0");
      } else if (valorFormacionNumerico > 100000000) {
        errors.push(`Valor de Formación ($${valorFormacionNumerico.toLocaleString()}) es excesivamente alto. Verifique que no tenga ceros decimales erróneos.`);
      }

      if (isNaN(expectedCuotasCount) || expectedCuotasCount <= 0) {
        errors.push("Número de cuotas es requerido y debe ser mayor a 0");
      } else {
        const actualCuotas = c.cuotasDetalle || [];
        if (actualCuotas.length < expectedCuotasCount) {
          errors.push(`Se indicaron ${expectedCuotasCount} cuotas, pero solo se encontraron datos para ${actualCuotas.length}`);
        } else {
          // Priorizamos la cantidad de cuotas que dicta la columna "Cuotas"
          const relevantCuotas = actualCuotas.slice(0, expectedCuotasCount);
          let sumaCuotas = 0;

          relevantCuotas.forEach((cuota, idx) => {
            const cuotaNum = idx + 1;
            if (!cuota.valor || cuota.valor <= 0) {
              errors.push(`Cuota ${cuotaNum}: El valor es requerido y debe ser mayor a $0`);
            } else if (valorTotalObjetivoNumerico > 0 && cuota.valor > valorTotalObjetivoNumerico) {
              errors.push(`Cuota ${cuotaNum}: El valor ($${cuota.valor.toLocaleString()}) es excesivo y supera el Valor Total Objetivo ($${valorTotalObjetivoNumerico.toLocaleString()})`);
            } else {
              sumaCuotas += cuota.valor;
            }

            if (!cuota.fecha || cuota.fecha.trim() === "") {
              errors.push(`Cuota ${cuotaNum}: Fecha de pago es requerida`);
            } else if (!isOfficialDate(cuota.fecha)) {
              dateErrors.push(buildDateFieldError(`Fecha Cuota ${cuotaNum}`, cuota.fecha, cuota.fechaEsCeldaFecha));
            }
          });

          if (valorTotalObjetivoNumerico > 0 && sumaCuotas !== valorTotalObjetivoNumerico) {
            const diferencia = sumaCuotas - valorTotalObjetivoNumerico;
            const diffTexto = diferencia > 0
              ? `la suma de cuotas excede el objetivo por +$${diferencia.toLocaleString()}`
              : `a la suma de cuotas le faltan -$${Math.abs(diferencia).toLocaleString()}`;
            errors.push(`La suma de las ${expectedCuotasCount} cuotas ($${sumaCuotas.toLocaleString()}) no coincide con el Valor Total Objetivo ($${valorTotalObjetivoNumerico.toLocaleString()}) — ${diffTexto}.`);
          }
        }
      }

      // Los errores de fecha también se listan en el detalle del registro, con el campo afectado.
      dateErrors.forEach(de => errors.push(`${de.campo}: ${de.mensaje}`));

      initialResults.push({
        camper: c,
        status: errors.length > 0 ? 'error' : 'pending',
        message: errors.length > 0 ? 'Datos faltantes o inválidos' : 'Listo para generar',
        errors,
        dateErrors
      });
    }

    return initialResults;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsFinished(false);
    setProgress(0);
    setLogs([]);
    setIsCorrectionOpen(false);
    setDraftCampers({});

    try {
      const parsedData = await parseExcel(selectedFile);
      const validationResults = validateData(parsedData);

      setData(parsedData);
      setResults(validationResults);

      const errores = validationResults.filter(r => r.status === 'error').length;
      const filasConFechaInvalida = validationResults.filter(r => (r.dateErrors?.length ?? 0) > 0).length;
      if (filasConFechaInvalida > 0) {
        toast.error(`${filasConFechaInvalida} registro(s) tienen fechas fuera del formato obligatorio ${OFFICIAL_DATE_FORMAT}. No se generarán.`);
      }
      if (errores > 0) {
        toast.warning(`Se encontraron ${errores} registros con errores de validación.`);
        addLog('error', `${errores} registros tienen errores y no serán procesados.`);
      } else {
        toast.success(`Se encontraron ${parsedData.length} registros válidos.`);
        addLog('info', `Excel cargado con ${parsedData.length} registros listos.`);
      }
    } catch (error) {
      toast.error("Error al leer el Excel");
      addLog('error', 'Error parseando el archivo Excel.');
    }
  };

  const handleGenerate = async () => {
    if (!accessToken) {
      toast.error("Debes iniciar sesión con Google primero");
      return;
    }

    const validRecords = results.filter(r => r.status === 'pending');
    if (validRecords.length === 0) {
      toast.error("No hay registros válidos para procesar.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    addLog('info', 'Iniciando proceso de generación masiva...');

    let processedCount = 0;

    try {
      addLog('info', 'Buscando o creando carpeta principal "contratos"...');
      const rootFolder = await ensureFolder(accessToken, "contratos");

      addLog('info', `Buscando o creando subcarpeta "${folderName}"...`);
      const targetFolder = await ensureFolder(accessToken, folderName, rootFolder.id);

      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'error') continue; // Saltar los que tienen error

        const camper = results[i].camper;
        try {
          const isMayor = (camper.tipoDocumentoCamper || "TI").toUpperCase() === 'CC';
          const jornada = (camper.jornada || 'diurna').toLowerCase();

          let templateUrl = "";
          if (isMayor) {
            templateUrl = jornada === 'diurna'
              ? "/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx"
              : "/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad Nocturna.docx";
          } else {
            templateUrl = jornada === 'diurna'
              ? "/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx"
              : "/contratos/Condiciones Específicas-Recursos Propios Menor de Edad Nocturna.docx";
          }

          // Armar finanzas
          let manualCuotas: number[] = [];
          let fechasCuotas: string[] = [];

          let totalObjetivo = parseCurrency(camper.valorTotalObjetivo) || 13000000;
          const expectedCuotasCount = parseInt(camper.cuotas || "0");

          if (camper.cuotasDetalle && camper.cuotasDetalle.length >= expectedCuotasCount && expectedCuotasCount > 0) {
            const relevantCuotas = camper.cuotasDetalle.slice(0, expectedCuotasCount);
            manualCuotas = relevantCuotas.map(c => c.valor);
            fechasCuotas = relevantCuotas.map(c => c.fecha);
          } else {
            // Fallback si solo pusieron el total
            const cN = expectedCuotasCount > 0 ? expectedCuotasCount : 1;
            manualCuotas = Array(cN).fill(Math.floor(totalObjetivo / cN));
            fechasCuotas = Array(cN).fill("");
          }

          const unifiedData = prepareUnifiedData(camper, {
            pagare: camper.pagare || "",
            fechaContrato: camper.fechaContrato || "",
            cuotas: manualCuotas.length.toString(),
            modoPago: "manual",
            manualCuotas,
            fechasCuotas,
            isRP: true,
            totalObjetivo,
            valorFormacion: parseCurrency(camper.valorFormacion) || 18000000,
            isMinor: !isMayor
          });

          addLog('info', `Generando contrato para ${camper.nombreCamper}...`);
          const blob = await generateContract(templateUrl, unifiedData, "temp.docx", true);

          const fileName = getContractFileName(camper.pagare || "", "Recursos Propios", camper.nombreCamper, "docx");

          await uploadFileToDrive(accessToken, blob as Blob, fileName, targetFolder.id);

          updateResultStatus(i, 'success', 'Subido correctamente');
          addLog('success', `Contrato de ${camper.nombreCamper} procesado correctamente.`);
        } catch (error: any) {
          console.error(error);
          updateResultStatus(i, 'error', error.message, [error.message]);
          addLog('error', `Falló contrato de ${camper.nombreCamper}: ${error.message}`);
        }

        processedCount++;
        setProgress(Math.round((processedCount / validRecords.length) * 100));
      }

      setIsFinished(true);
      toast.success("Proceso masivo finalizado");
      addLog('success', '¡Generación masiva completada!');
    } catch (error: any) {
      toast.error(`Error crítico: ${error.message}`);
      addLog('error', `Error en el proceso: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const total = results.length;
  const exitosos = results.filter(r => r.status === 'success').length;
  const conErrores = results.filter(r => r.status === 'error').length;
  const pendientes = results.filter(r => r.status === 'pending').length;
  const filasConErrorDeFecha = results
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => (r.dateErrors?.length ?? 0) > 0);
  const totalErroresDeFecha = filasConErrorDeFecha.reduce((acc, { r }) => acc + (r.dateErrors?.length ?? 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="w-full max-w-[95%] mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-secondary rounded-full transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
              title="Volver al inicio"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><FileSpreadsheet className="text-primary" /> Generación Masiva</h1>
              <p className="text-muted-foreground text-sm">Validación estricta y carga automática a Google Drive.</p>
            </div>
          </div>
          <button onClick={downloadTemplate} className="secondary-button text-xs flex items-center gap-2 px-3 py-2 border border-primary text-primary rounded-md hover:bg-primary/10">
            <Download className="w-4 h-4" /> DESCARGAR PLANTILLA
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Izquierdo: Configuración */}
          <div className="lg:col-span-1 space-y-4 p-5 border border-border rounded-xl bg-card h-fit">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Folder className="w-5 h-5 text-primary" /> Configuración</h2>

            {!accessToken ? (
              <button onClick={() => login()} className="w-full primary-button py-3 text-sm flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                Vincular con Google Drive
              </button>
            ) : (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-md text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Vinculado con Drive
              </div>
            )}

            <div>
              <label className="section-label mb-2 block">Carpeta de Destino</label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                disabled={isProcessing}
                className="w-full p-2.5 text-sm rounded-md border border-input bg-background disabled:opacity-50"
              />
            </div>

            <div>
              <label className="section-label mb-2 block">Archivo Excel (.xlsx)</label>
              <label className={`flex items-center justify-center w-full h-24 px-4 transition bg-background border-2 border-border border-dashed rounded-md appearance-none ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}>
                <span className="flex items-center space-x-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground text-sm">
                    {file ? file.name : "Seleccionar Excel..."}
                  </span>
                </span>
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isProcessing} />
              </label>
            </div>

            <div className="p-3 rounded-md border border-primary/20 bg-primary/5 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-1">Formato de fecha obligatorio: {OFFICIAL_DATE_FORMAT}</p>
              Ej: <span className="font-mono text-foreground">{OFFICIAL_DATE_EXAMPLE}</span>. Aplica a "Fecha Contrato" y a cada "Fecha Cuota N".
              Configure esas columnas como <strong>Texto</strong> en Excel para que no cambie el formato.
              Las filas con fechas en formato de 2 dígitos (ej. 10/16/26) o formato estadounidense (MM/DD/AAAA) serán bloqueadas.
            </div>

            <button
              onClick={handleGenerate}
              disabled={isProcessing || isFinished || !accessToken || pendientes === 0}
              className="w-full primary-button py-3 mt-4 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {isProcessing ? "PROCESANDO..." : isFinished ? "PROCESO FINALIZADO" : "GENERAR CONTRATOS"}
            </button>

            {isFinished && (
              <button
                onClick={resetProcess}
                className="w-full mt-3 py-3 rounded-md border-2 border-primary text-primary hover:bg-primary/10 font-bold flex justify-center items-center gap-2 transition-colors animate-in fade-in"
              >
                <RefreshCw className="w-4 h-4" />
                NUEVA CARGA (REINICIAR)
              </button>
            )}

            {/* Botón de Corrección de Errores (ubicado en el área estratégica señalada por el usuario) */}
            <div className="pt-2">
              <button
                onClick={openCorrectionModal}
                disabled={conErrores === 0 || isProcessing}
                className={`w-full py-3.5 px-4 rounded-lg font-bold text-sm flex justify-center items-center gap-2.5 transition-all shadow-sm ${
                  conErrores > 0
                    ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-2 border-amber-500/50 hover:border-amber-400 cursor-pointer shadow-amber-500/10 hover:shadow-amber-500/20 animate-pulse"
                    : "bg-secondary/40 border border-border/60 text-muted-foreground opacity-40 cursor-not-allowed"
                }`}
                title={conErrores > 0 ? "Corregir errores de validación directamente sin volver a subir el Excel" : "No hay errores para corregir"}
              >
                <Wrench className="w-4 h-4" />
                CORRECCIÓN DE ERRORES {conErrores > 0 && (
                  <span className="bg-amber-500 text-black font-extrabold text-xs px-2 py-0.5 rounded-full ml-1">
                    {conErrores}
                  </span>
                )}
              </button>
              {conErrores > 0 && (
                <p className="text-[11px] text-amber-400/90 text-center mt-1.5">
                  Corrige datos o formatos de fecha directamente aquí.
                </p>
              )}
            </div>
          </div>

          {/* Panel Derecho: Lista de Registros y Progreso */}
          <div className="lg:col-span-2 space-y-4 flex flex-col">

            {/* Resumen */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 rounded-md bg-secondary/50 border border-border text-center">
                <p className="text-xs text-muted-foreground uppercase font-bold">Total</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-xs text-green-600/80 uppercase font-bold">Listos / Exitosos</p>
                <p className="text-2xl font-bold text-green-600">{exitosos + pendientes}</p>
              </div>
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-xs text-red-600/80 uppercase font-bold">Errores</p>
                <p className="text-2xl font-bold text-red-600">{conErrores}</p>
              </div>
              <div className="p-3 rounded-md bg-primary/10 border border-primary/20 text-center">
                <p className="text-xs text-primary/80 uppercase font-bold">Progreso</p>
                <p className="text-2xl font-bold text-primary">{progress}%</p>
              </div>
            </div>

            {/* Alerta Final */}
            {isFinished && (
              <div className={`p-4 rounded-lg border ${conErrores === 0 ? 'bg-green-500/10 border-green-500/30 text-green-600' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600'}`}>
                <h3 className="font-bold flex items-center gap-2">
                  {conErrores === 0 ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  Resumen de la Operación
                </h3>
                <p className="text-sm mt-1">
                  Se generaron {exitosos} contratos correctamente.
                  {conErrores > 0 ? ` Hubo ${conErrores} registros ignorados por errores en los datos que deberás revisar manualmente.` : ` ¡Todos los registros pasaron las validaciones perfectamente!`}
                </p>
              </div>
            )}

            {/* Reporte de errores de formato de fecha */}
            {filasConErrorDeFecha.length > 0 && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-red-500/20 bg-red-500/10 flex items-center justify-between font-bold text-sm text-red-600">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Errores de formato de fecha ({totalErroresDeFecha}) — {filasConErrorDeFecha.length} contrato(s) bloqueado(s)</span>
                  </div>
                  <button
                    onClick={openCorrectionModal}
                    className="text-xs font-semibold px-3 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Corregir ahora
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto relative">
                  <table className="w-full text-xs border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="sticky top-0 z-20 bg-[#1e0e14] text-red-300 font-bold px-3 py-2.5 text-left border-b border-red-500/30 whitespace-nowrap shadow-sm uppercase tracking-wider">Fila</th>
                        <th className="sticky top-0 z-20 bg-[#1e0e14] text-red-300 font-bold px-3 py-2.5 text-left border-b border-red-500/30 whitespace-nowrap shadow-sm uppercase tracking-wider">Camper / Pagaré</th>
                        <th className="sticky top-0 z-20 bg-[#1e0e14] text-red-300 font-bold px-3 py-2.5 text-left border-b border-red-500/30 whitespace-nowrap shadow-sm uppercase tracking-wider">Campo</th>
                        <th className="sticky top-0 z-20 bg-[#1e0e14] text-red-300 font-bold px-3 py-2.5 text-left border-b border-red-500/30 whitespace-nowrap shadow-sm uppercase tracking-wider">Valor encontrado</th>
                        <th className="sticky top-0 z-20 bg-[#1e0e14] text-red-300 font-bold px-3 py-2.5 text-left border-b border-red-500/30 shadow-sm uppercase tracking-wider">Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filasConErrorDeFecha.flatMap(({ r, i }) =>
                        (r.dateErrors ?? []).map((de, j) => (
                          <tr key={`${i}-${j}`} className="hover:bg-red-500/5 transition-colors align-top">
                            <td className="px-3 py-2 font-semibold whitespace-nowrap border-b border-red-500/10">{r.camper.filaExcel ?? "-"}</td>
                            <td className="px-3 py-2 border-b border-red-500/10">
                              <div className="font-medium text-foreground">{r.camper.nombreCamper || "Sin Nombre"}</div>
                              <div className="text-muted-foreground">{r.camper.pagare ? `Pagaré ${r.camper.pagare}` : "Sin Pagaré"}</div>
                            </td>
                            <td className="px-3 py-2 font-medium whitespace-nowrap border-b border-red-500/10">{de.campo}</td>
                            <td className="px-3 py-2 font-mono text-red-400 whitespace-nowrap border-b border-red-500/10">{de.valor}</td>
                            <td className="px-3 py-2 text-foreground/80 border-b border-red-500/10">{de.mensaje}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detalle de Registros */}
            <div className="flex-1 bg-card rounded-xl border border-border flex flex-col min-h-[400px]">
              <div className="p-3 border-b border-border bg-secondary/30 rounded-t-xl font-bold text-sm">
                Detalle de Registros
              </div>
              <div className="overflow-y-auto p-2 space-y-2 flex-1">
                {results.length === 0 && <div className="p-4 text-center text-muted-foreground text-sm">Sube un archivo Excel para ver el desglose.</div>}

                {results.map((r, i) => (
                  <div key={i} className={`p-3 rounded-md border text-sm flex flex-col gap-1
                    ${r.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                      r.status === 'success' ? 'bg-green-500/5 border-green-500/20' :
                        'bg-background border-border'}
                  `}>
                    <div className="flex justify-between items-center font-semibold">
                      <span>Fila {r.camper.filaExcel ?? i + 2}. {r.camper.nombreCamper || "Sin Nombre"} <span className="text-muted-foreground font-normal text-xs ml-2">({r.camper.documentoCamper || "Sin Doc"}) - {r.camper.pagare ? `Pagaré: ${r.camper.pagare}` : "Sin Pagaré"}</span></span>

                      {r.status === 'error' && (
                        <div className="relative">
                          <button
                            onClick={() => setActivePopover(activePopover === i ? null : i)}
                            className="text-red-500 text-xs flex items-center gap-1 hover:bg-red-500/10 px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            <AlertCircle className="w-3 h-3" /> ERROR
                          </button>
                          {activePopover === i && (
                            <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-card text-foreground border border-border shadow-2xl rounded-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex justify-between items-center">
                                <span className="font-bold text-red-600 flex items-center gap-2 text-sm">
                                  <AlertCircle className="w-4 h-4" />
                                  Errores de validación:
                                </span>
                                <button onClick={() => setActivePopover(null)} className="text-red-500/60 hover:text-red-600 transition-colors p-1 hover:bg-red-500/10 rounded-md">✕</button>
                              </div>
                              <div className="p-4 bg-card">
                                <ul className="space-y-3">
                                  {r.errors?.map((err, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-muted-foreground text-xs leading-snug">
                                      <div className="min-w-[6px] min-h-[6px] mt-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                      <span className="font-medium text-foreground/80">{err}</span>
                                    </li>
                                  ))}
                                  {(!r.errors || r.errors.length === 0) && (
                                    <li className="flex items-start gap-3 text-muted-foreground text-xs leading-snug">
                                      <div className="min-w-[6px] min-h-[6px] mt-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                      <span className="font-medium text-foreground/80">{r.message}</span>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {r.status === 'success' && <span className="text-green-500 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> ÉXITO</span>}
                      {r.status === 'pending' && <span className="text-muted-foreground text-xs">Pendiente</span>}
                    </div>

                    {r.status === 'error' && (
                      <p className="text-red-600/80 text-xs font-medium mt-1">
                        {(r.dateErrors?.length ?? 0) > 0
                          ? `Fecha con formato inválido en: ${r.dateErrors!.map(d => d.campo).join(", ")}. Formato obligatorio: ${OFFICIAL_DATE_FORMAT}.`
                          : "Datos faltantes o inválidos"}
                      </p>
                    )}
                    {r.status === 'success' && (
                      <p className="text-green-600/80 text-xs font-medium mt-1">Archivo subido a Google Drive.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modal / Sección de Corrección Manual de Errores */}
      {isCorrectionOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[92vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Cabecera del Modal */}
            <div className="px-6 py-4 border-b border-border bg-secondary/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    Corrección Manual de Errores
                    <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                      {Object.keys(draftCampers).length} registro(s) con novedades
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Modifica los campos erróneos directamente aquí sin necesidad de rehacer ni volver a subir el Excel.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={autoFixAllDates}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Convierte automáticamente formatos como M/D/YY a DD/MM/AAAA en todos los registros"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  Auto-corregir todas las fechas
                </button>
                <button
                  type="button"
                  onClick={closeCorrectionModal}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cuerpo del Modal con scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/50">
              {Object.keys(draftCampers).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-semibold text-foreground">¡No hay registros con errores pendientes!</p>
                  <p className="text-xs">Todos los registros pasaron las validaciones correctamente.</p>
                </div>
              ) : (
                Object.keys(draftCampers).map((key) => {
                  const recordIdx = Number(key);
                  const camper = draftCampers[recordIdx];
                  if (!camper) return null;
                  const originalResult = results[recordIdx];
                  const isFcValid = isOfficialDate(camper.fechaContrato);
                  const sumCuotas = (camper.cuotasDetalle || []).reduce((acc, c) => acc + (c.valor || 0), 0);
                  const targetVal = parseCurrency(camper.valorTotalObjetivo);
                  const cuotasCoinciden = targetVal > 0 && sumCuotas === targetVal;

                  return (
                    <div
                      key={recordIdx}
                      className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 transition-all"
                    >
                      {/* Barra superior de la tarjeta del camper */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              Fila {camper.filaExcel ?? recordIdx + 2}: {camper.nombreCamper || "Sin Nombre"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({camper.tipoDocumentoCamper || "TI"} {camper.documentoCamper || "Sin Doc"})
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Pagaré: <span className="font-mono text-foreground font-semibold">{camper.pagare || "Pendiente"}</span> | Jornada: {camper.jornada || "diurna"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => autoFixCamperDates(recordIdx)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Auto-corregir fechas de este registro"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Auto-corregir fechas de este camper
                          </button>
                        </div>
                      </div>

                      {/* Novedades / Errores reportados originalmente */}
                      {originalResult?.errors && originalResult.errors.length > 0 && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                          <div className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                            <AlertCircle className="w-4 h-4 text-amber-400" /> Novedades detectadas:
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground pl-1">
                            {originalResult.errors.map((err, eIdx) => (
                              <li key={eIdx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Campos editables del Camper */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="font-semibold text-muted-foreground block mb-1">Nombre Completo Camper</label>
                          <input
                            type="text"
                            value={camper.nombreCamper || ""}
                            onChange={e => updateDraftField(recordIdx, 'nombreCamper', e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-muted-foreground block mb-1">Tipo de Documento</label>
                          <select
                            value={camper.tipoDocumentoCamper || "TI"}
                            onChange={e => updateDraftField(recordIdx, 'tipoDocumentoCamper', e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value="CC">Cédula de Ciudadanía (CC)</option>
                            <option value="TI">Tarjeta de Identidad (TI)</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-muted-foreground block mb-1">Documento Camper</label>
                          <input
                            type="text"
                            value={camper.documentoCamper || ""}
                            onChange={e => updateDraftField(recordIdx, 'documentoCamper', e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-muted-foreground block mb-1">Número de Pagaré</label>
                          <input
                            type="text"
                            value={camper.pagare || ""}
                            onChange={e => updateDraftField(recordIdx, 'pagare', e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      {/* Segunda fila: Contacto (Celular 10 dígitos, Correo, Dirección, Jornada) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                        <div>
                          <label className="font-semibold text-muted-foreground block mb-1">
                            Celular Camper <span className="text-primary font-mono">(10 dígitos)</span>
                          </label>
                          {(() => {
                            const celRes = validateColombianPhone(camper.celularCamper);
                            const cleanLen = cleanColombianPhone(camper.celularCamper).length;
                            return (
                              <div>
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="3001234567"
                                    value={camper.celularCamper || ""}
                                    onChange={e => updateDraftField(recordIdx, 'celularCamper', e.target.value)}
                                    className={`w-full p-2 pr-24 rounded-md border bg-background font-mono focus:ring-1 focus:outline-none ${
                                      celRes.isValid
                                        ? "border-green-500/50 focus:ring-primary"
                                        : "border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/20"
                                    }`}
                                  />
                                  <span className="absolute right-2 top-2 text-[10px]">
                                    {celRes.isValid ? (
                                      <span className="text-green-500 font-semibold">✓ 10 DÍGITOS</span>
                                    ) : (
                                      <span className="text-rose-400 font-medium">✕ {cleanLen}/10 DÍG</span>
                                    )}
                                  </span>
                                </div>
                                {!celRes.isValid && (
                                  <p className="text-[11px] text-rose-400/90 mt-1 leading-tight font-medium">
                                    {celRes.errorMessage}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <div>
                          <label className="font-semibold text-muted-foreground block mb-1">Correo Electrónico</label>
                          <input
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={camper.emailCamper || ""}
                            onChange={e => updateDraftField(recordIdx, 'emailCamper', e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-muted-foreground block mb-1">Dirección de Residencia</label>
                          <input
                            type="text"
                            placeholder="Calle / Carrera #..."
                            value={camper.direccionCamper || ""}
                            onChange={e => updateDraftField(recordIdx, 'direccionCamper', e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-muted-foreground block mb-1">Jornada</label>
                          <select
                            value={camper.jornada || "diurna"}
                            onChange={e => updateDraftField(recordIdx, 'jornada', e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value="diurna">Diurna</option>
                            <option value="nocturna">Nocturna</option>
                          </select>
                        </div>
                      </div>

                      {/* Tercera fila: Fecha Contrato y Valores */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                        <div>
                          <label className="font-semibold text-muted-foreground block mb-1">
                            Fecha Contrato <span className="text-primary font-mono">({OFFICIAL_DATE_FORMAT})</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                placeholder={OFFICIAL_DATE_EXAMPLE}
                                value={camper.fechaContrato || ""}
                                onChange={e => updateDraftField(recordIdx, 'fechaContrato', e.target.value)}
                                className={`w-full p-2 pr-16 rounded-md border bg-background font-mono focus:ring-1 focus:outline-none ${
                                  isFcValid
                                    ? "border-green-500/50 focus:ring-primary"
                                    : "border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/20"
                                }`}
                              />
                              <span className="absolute right-2 top-2 text-[10px]">
                                {isFcValid ? (
                                  <span className="text-green-500 font-semibold">✓ VÁLIDA</span>
                                ) : (
                                  <span className="text-rose-400 font-medium">✕ FORMATO</span>
                                )}
                              </span>
                            </div>
                            {!isFcValid && (
                              <button
                                type="button"
                                onClick={() => autoFixSingleDate(recordIdx, 'fechaContrato')}
                                title="Auto-corregir esta fecha"
                                className="p-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 flex items-center gap-1"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="font-semibold text-muted-foreground block mb-1">Valor Total Objetivo ($)</label>
                          <input
                            type="text"
                            value={camper.valorTotalObjetivo || ""}
                            onChange={e => updateDraftField(recordIdx, 'valorTotalObjetivo', e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-muted-foreground block mb-1">Valor Formación ($)</label>
                          <input
                            type="text"
                            value={camper.valorFormacion || ""}
                            onChange={e => updateDraftField(recordIdx, 'valorFormacion', e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Si es TI, campos de acudiente */}
                      {(camper.tipoDocumentoCamper || "TI").toUpperCase() === "TI" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs p-3 rounded-lg bg-secondary/30 border border-border">
                          <div>
                            <label className="font-semibold text-muted-foreground block mb-1">Nombre Acudiente (Requerido para TI)</label>
                            <input
                              type="text"
                              value={camper.nombreRepresentante || ""}
                              onChange={e => updateDraftField(recordIdx, 'nombreRepresentante', e.target.value)}
                              className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-muted-foreground block mb-1">Documento Acudiente (Requerido para TI)</label>
                            <input
                              type="text"
                              value={camper.cedulaRepresentante || ""}
                              onChange={e => updateDraftField(recordIdx, 'cedulaRepresentante', e.target.value)}
                              className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-muted-foreground block mb-1">Celular Acudiente (10 dígitos)</label>
                            {(() => {
                              const telRepRes = validateColombianPhone(camper.telefonoRepresentante);
                              const cleanLen = cleanColombianPhone(camper.telefonoRepresentante).length;
                              return (
                                <div>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      placeholder="3001234567"
                                      value={camper.telefonoRepresentante || ""}
                                      onChange={e => updateDraftField(recordIdx, 'telefonoRepresentante', e.target.value)}
                                      className={`w-full p-2 pr-20 rounded-md border bg-background font-mono focus:ring-1 focus:outline-none ${
                                        !camper.telefonoRepresentante || telRepRes.isValid
                                          ? "border-input focus:ring-primary"
                                          : "border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/20"
                                      }`}
                                    />
                                    {camper.telefonoRepresentante && (
                                      <span className="absolute right-2 top-2 text-[10px]">
                                        {telRepRes.isValid ? (
                                          <span className="text-green-500 font-semibold">✓ VÁLIDO</span>
                                        ) : (
                                          <span className="text-rose-400 font-medium">✕ {cleanLen}/10 DÍG</span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  {camper.telefonoRepresentante && !telRepRes.isValid && (
                                    <p className="text-[11px] text-rose-400/90 mt-1 leading-tight font-medium">
                                      {telRepRes.errorMessage}
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                          <div>
                            <label className="font-semibold text-muted-foreground block mb-1">Correo Acudiente</label>
                            <input
                              type="email"
                              placeholder="acudiente@correo.com"
                              value={camper.emailRepresentante || ""}
                              onChange={e => updateDraftField(recordIdx, 'emailRepresentante', e.target.value)}
                              className="w-full p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Cuotas Detalladas */}
                      <div className="space-y-3 pt-2 border-t border-border">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            Fechas y Valores de Cuotas ({camper.cuotasDetalle?.length || 0})
                          </span>
                          {(() => {
                            const diff = sumCuotas - targetVal;
                            return (
                              <span className={`text-[11px] px-3 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${
                                cuotasCoinciden
                                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                                  : "bg-amber-500/10 text-amber-300 dark:text-amber-400 border-amber-500/30 shadow-sm"
                              }`}>
                                <span>Suma Cuotas: ${sumCuotas.toLocaleString()} / Objetivo: ${targetVal.toLocaleString()}</span>
                                {cuotasCoinciden ? (
                                  <span className="text-green-400 font-bold">✓ Coincide</span>
                                ) : (
                                  <span className="text-amber-300 dark:text-amber-400 font-medium">
                                    ({diff > 0 ? `Excede por +$${diff.toLocaleString()}` : `Faltan -$${Math.abs(diff).toLocaleString()}`})
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(camper.cuotasDetalle || []).map((cuota, cIdx) => {
                            const isCDateValid = isOfficialDate(cuota.fecha);
                            const isValMissing = !cuota.valor || cuota.valor <= 0;
                            const isValExcessive = targetVal > 0 && cuota.valor > targetVal;

                            return (
                              <div
                                key={cIdx}
                                className="p-3 rounded-xl border border-border bg-secondary/20 text-xs space-y-2 transition-all"
                              >
                                <div className="flex justify-between items-center font-semibold">
                                  <span className="text-foreground">Cuota {cIdx + 1}</span>
                                </div>

                                <div>
                                  <label className="text-[10px] text-muted-foreground block mb-0.5">Fecha ({OFFICIAL_DATE_FORMAT})</label>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      placeholder={OFFICIAL_DATE_EXAMPLE}
                                      value={cuota.fecha || ""}
                                      onChange={e => updateDraftCuota(recordIdx, cIdx, 'fecha', e.target.value)}
                                      className={`w-full p-1.5 text-xs rounded border bg-background font-mono focus:outline-none ${
                                        isCDateValid
                                          ? "border-input focus:ring-1 focus:ring-primary"
                                          : "border-rose-400/70 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                                      }`}
                                    />
                                    {!isCDateValid && (
                                      <button
                                        type="button"
                                        onClick={() => autoFixSingleDate(recordIdx, cIdx)}
                                        title="Auto-corregir formato"
                                        className="p-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                  {!isCDateValid && (
                                    <p className="text-[10px] text-rose-400/90 font-medium mt-1 leading-tight">
                                      Formato inválido ({OFFICIAL_DATE_FORMAT})
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className="text-[10px] text-muted-foreground font-semibold block mb-0.5">Valor ($)</label>
                                  <div className="relative">
                                    <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">$</span>
                                    <input
                                      type="number"
                                      value={cuota.valor || ""}
                                      onChange={e => updateDraftCuota(recordIdx, cIdx, 'valor', e.target.value)}
                                      className={`w-full p-1.5 pl-5 text-xs rounded border bg-background font-mono font-semibold focus:outline-none ${
                                        isValExcessive || isValMissing
                                          ? "border-rose-400/70 focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30 text-foreground"
                                          : "border-input text-foreground focus:ring-1 focus:ring-primary"
                                      }`}
                                    />
                                  </div>
                                  {isValExcessive && (
                                    <p className="text-[11px] text-rose-400/90 font-medium mt-1 leading-tight">
                                      Supera el objetivo (${targetVal.toLocaleString()})
                                    </p>
                                  )}
                                  {isValMissing && (
                                    <p className="text-[11px] text-rose-400/90 font-medium mt-1 leading-tight">
                                      Debe ser mayor a $0
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Pie del Modal con Guardar y Cancelar */}
            <div className="px-6 py-4 border-t border-border bg-secondary/40 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Al guardar, los datos se revalidan inmediatamente y los contratos quedarán listos para generar.
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeCorrectionModal}
                  className="px-4 py-2 text-xs font-semibold rounded-md border border-border hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCorrections}
                  className="px-5 py-2 text-xs font-bold rounded-md bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4" />
                  GUARDAR CAMBIOS Y REVALIDAR
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
