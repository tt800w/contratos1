import { useState } from "react";
import { Upload, Folder, Play, CheckCircle, AlertCircle, FileSpreadsheet, Download, RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { parseExcel, CamperData } from "@/utils/excelParser";
import { ensureFolder, uploadFileToDrive } from "@/utils/googleDriveService";
import { prepareUnifiedData, generateContract, getContractFileName } from "@/utils/contractGenerator";
import * as xlsx from "xlsx";

interface ProcessResult {
  camper: CamperData;
  status: 'pending' | 'success' | 'error';
  message: string;
  errors?: string[];
}

export default function BulkGeneration() {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("Contratos Masivos");
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<CamperData[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [logs, setLogs] = useState<{ type: 'success' | 'error' | 'info'; message: string }[]>([]);
  const [activePopover, setActivePopover] = useState<number | null>(null);

  const resetProcess = () => {
    setFile(null);
    setData([]);
    setResults([]);
    setIsProcessing(false);
    setIsFinished(false);
    setProgress(0);
    setLogs([]);
    setActivePopover(null);
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

  const updateResultStatus = (index: number, status: 'success'|'error', message: string, errors?: string[]) => {
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
        "123", "diurna", "2026-08-10", "18000000", "2", "13000000",
        "6500000", "2026-09-01", "6500000", "2026-10-01", "", ""
      ],
      [
        "TI", "Ana Gomez", "100987654", "Carrera 4 # 5-6", "ana@test.com", "3101234567",
        "Maria Gomez", "50123456", "maria@test.com", "3151234567",
        "124", "nocturna", "2026-08-11", "18000000", "3", "12000000",
        "4000000", "2026-09-15", "4000000", "2026-10-15", "4000000", "2026-11-15"
      ]
    ];
    const ws = xlsx.utils.aoa_to_sheet(wsData);
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
      
      const tipo = (c.tipoDocumentoCamper || "TI").toUpperCase();
      
      // 1. Obligatorios
      if (!c.nombreCamper) errors.push("Nombre del Camper");
      if (!c.documentoCamper) errors.push("Documento del Camper");
      if (!c.pagare) errors.push("Número de Pagaré");
      if (!c.valorFormacion) errors.push("Valor de Formación");
      if (!c.valorTotalObjetivo) errors.push("Valor Total Objetivo");
      if (!c.fechaContrato) errors.push("Fecha del Contrato");

      // 2. Acudiente obligatorio para TI
      if (tipo === "TI") {
        if (!c.nombreRepresentante) errors.push("Nombre del Acudiente (Requerido por ser TI)");
        if (!c.cedulaRepresentante) errors.push("Documento del Acudiente (Requerido por ser TI)");
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
      const valorTotalObjetivoNumerico = parseInt(c.valorTotalObjetivo?.replace(/\D/g, '') || "0");
      const expectedCuotasCount = parseInt(c.cuotas?.trim() || "0");
      
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
            if (!cuota.valor || cuota.valor <= 0) {
              errors.push(`Valor de la cuota ${idx + 1} faltante o inválido`);
            } else {
              sumaCuotas += cuota.valor;
            }
            if (!cuota.fecha || cuota.fecha.trim() === "") {
              errors.push(`Fecha de la cuota ${idx + 1} es requerida`);
            }
          });

          if (valorTotalObjetivoNumerico > 0 && sumaCuotas !== valorTotalObjetivoNumerico) {
            errors.push(`La suma de las ${expectedCuotasCount} cuotas ($${sumaCuotas.toLocaleString()}) no coincide con el Valor Total Objetivo ($${valorTotalObjetivoNumerico.toLocaleString()})`);
          }
        }
      }

      initialResults.push({
        camper: c,
        status: errors.length > 0 ? 'error' : 'pending',
        message: errors.length > 0 ? 'Datos faltantes o inválidos' : 'Listo para generar',
        errors
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
    
    try {
      const parsedData = await parseExcel(selectedFile);
      const validationResults = validateData(parsedData);
      
      setData(parsedData);
      setResults(validationResults);
      
      const errores = validationResults.filter(r => r.status === 'error').length;
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
          
          let totalObjetivo = parseInt(camper.valorTotalObjetivo?.replace(/\D/g, '') || "0");
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
            valorFormacion: camper.valorFormacion || "18000000",
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
              <h1 className="text-2xl font-bold flex items-center gap-2"><FileSpreadsheet className="text-primary"/> Generación Masiva</h1>
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
                  {conErrores === 0 ? <CheckCircle className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
                  Resumen de la Operación
                </h3>
                <p className="text-sm mt-1">
                  Se generaron {exitosos} contratos correctamente. 
                  {conErrores > 0 ? ` Hubo ${conErrores} registros ignorados por errores en los datos que deberás revisar manualmente.` : ` ¡Todos los registros pasaron las validaciones perfectamente!`}
                </p>
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
                      <span>{i+1}. {r.camper.nombreCamper || "Sin Nombre"} <span className="text-muted-foreground font-normal text-xs ml-2">({r.camper.documentoCamper || "Sin Doc"}) - {r.camper.pagare ? `Pagaré: ${r.camper.pagare}` : "Sin Pagaré"}</span></span>
                      
                      {r.status === 'error' && (
                        <div className="relative">
                          <button 
                            onClick={() => setActivePopover(activePopover === i ? null : i)}
                            className="text-red-500 text-xs flex items-center gap-1 hover:bg-red-500/10 px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            <AlertCircle className="w-3 h-3"/> ERROR
                          </button>
                          {activePopover === i && (
                            <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-card text-foreground border border-border shadow-2xl rounded-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex justify-between items-center">
                                <span className="font-bold text-red-600 flex items-center gap-2 text-sm">
                                  <AlertCircle className="w-4 h-4" /> 
                                  Datos requeridos:
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
                      {r.status === 'success' && <span className="text-green-500 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/> ÉXITO</span>}
                      {r.status === 'pending' && <span className="text-muted-foreground text-xs">Pendiente</span>}
                    </div>
                    
                    {r.status === 'error' && (
                      <p className="text-red-600/80 text-xs font-medium mt-1">Datos faltantes</p>
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
    </div>
  );
}
