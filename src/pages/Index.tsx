import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  FileDown,
  FileSpreadsheet,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import DocxViewer from "@/components/DocxViewer";
import ContractManagementPanel from "@/components/ContractManagementPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ContractField } from "@/components/CommonFields";
import { useCamperData } from "@/hooks/useCamperData";
import { useStoredContracts } from "@/hooks/useStoredContracts";
import {
  downloadAsPDF,
  generateContract,
  getContractFileName,
  prepareUnifiedData,
} from "@/utils/contractGenerator";
import { uploadToZapSign } from "@/utils/zapSignService";
import { CamperData } from "@/utils/excelParser";
import { getStudentAgeCategory } from "@/utils/studentUtils";

const Index = () => {
  const {
    users,
    selectedUser,
    setSelectedUser,
    selectedUserData,
    handleFileUpload,
  } = useCamperData();
  const { contracts, setContracts } = useStoredContracts();
  const [selectedContractId, setSelectedContractId] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const [pagare, setPagare] = useState("");
  const [fechaContrato, setFechaContrato] = useState("");
  const [isSendingZapSign, setIsSendingZapSign] = useState(false);
  const [valorFormacion, setValorFormacion] = useState("");
  const [includePaymentPlan, setIncludePaymentPlan] = useState(false);
  // Amortization state
  const [amortValorPagar, setAmortValorPagar] = useState("");
  const [amortCuotas, setAmortCuotas] = useState("");
  const [amortStartDate, setAmortStartDate] = useState("");
  const [amortSchedule, setAmortSchedule] = useState<
    { installment: number; amount: number; dueDate: string }[]
  >([]);

  const studentAgeCategory = getStudentAgeCategory(
    selectedUserData?.raw as CamperData | undefined,
  );

  const availableContracts = useMemo(() => {
    if (studentAgeCategory === "unknown") return [];
    return contracts.filter(
      (contract) => contract.ageCategory === studentAgeCategory,
    );
  }, [contracts, studentAgeCategory]);

  const formatDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatAmount = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value);

  const parseIntegerValue = (value: string) => {
    const clean = value.replace(/[^0-9]/g, "");
    return clean ? parseInt(clean, 10) : 0;
  };

  const handleGenerateAmortization = () => {
    const total = parseIntegerValue(amortValorPagar);
    const cuotas = amortCuotas ? Number(amortCuotas) : 0;
    const start = amortStartDate;

    if (!total || total <= 0) {
      toast.error("Ingrese un monto total válido");
      return;
    }
    if (!cuotas || cuotas < 1) {
      toast.error("Ingrese un número de cuotas válido (mínimo 1)");
      return;
    }
    if (!start) {
      toast.error("Ingrese la fecha de la primera cuota");
      return;
    }

    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      toast.error("Fecha inválida");
      return;
    }

    const base = Math.floor(total / cuotas);
    const remainder = total - base * cuotas;

    const schedule: { installment: number; amount: number; dueDate: string }[] =
      [];

    for (let i = 0; i < cuotas; i++) {
      const due = new Date(startDate);
      due.setMonth(due.getMonth() + i);
      const amount = i === cuotas - 1 ? base + remainder : base;
      schedule.push({ installment: i + 1, amount, dueDate: formatDate(due) });
    }

    setAmortSchedule(schedule);
    toast.success("Amortización generada");
  };

  const handleDownloadAmortCSV = () => {
    if (amortSchedule.length === 0) {
      toast.error("No hay amortización para descargar");
      return;
    }
    const escapeHtmlValue = (value: string | number) =>
      String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const sanitizeFileName = (value: string) =>
      value
        .trim()
        .replace(/[\\/:*?"<>|]+/g, "")
        .replace(/\s+/g, "_")
        .replace(/^\.+|\.+$/g, "");

    const total = amortSchedule.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
    let paidToDate = 0;

    const tableRows = amortSchedule.map((r) => {
      const amount = Number(r.amount || 0);
      paidToDate += amount;
      const pendingAmount = Math.max(0, total - paidToDate);

      return `
        <tr>
          <td>${escapeHtmlValue(r.installment)}</td>
          <td>${escapeHtmlValue(r.dueDate)}</td>
          <td>${escapeHtmlValue(r.dueDate)}</td>
          <td>${escapeHtmlValue(formatAmount(amount))}</td>
          <td>${escapeHtmlValue(formatAmount(pendingAmount))}</td>
          <td>${escapeHtmlValue(formatAmount(paidToDate))}</td>
        </tr>
      `;
    });

    const camperName = sanitizeFileName(selectedUserData?.name || "CAMPER");
    const title = `Amortización - ${selectedUserData?.name || "Camper"}`;
    const excelHtml = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #000000; text-align: center; font-size: 18px; }
            table { border-collapse: collapse; width: 100%; }
            th {
              background-color: #111827;
              color: #ffffff;
              font-weight: bold;
              text-align: center;
              border: 1px solid #000000;
              padding: 8px;
            }
            td {
              border: 1px solid #000000;
              padding: 8px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <h1>${escapeHtmlValue(title)}</h1>
          <table>
            <thead>
              <tr>
                <th>Cuota</th>
                <th>Fecha</th>
                <th>Vencimiento</th>
                <th>Monto</th>
                <th>Valor pendiente a pagar</th>
                <th>Valor pagado hasta esa fecha</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows.join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([excelHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    saveAs(blob, `CSV_${camperName}.xls`);
  };

  useEffect(() => {
    if (
      selectedContractId &&
      availableContracts.some((contract) => contract.id === selectedContractId)
    ) {
      return;
    }

    setSelectedContractId(availableContracts[0]?.id || "");
  }, [availableContracts, selectedContractId]);

  const selectedContract =
    availableContracts.find((contract) => contract.id === selectedContractId) ||
    availableContracts[0];

  const settingsDialog = (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted/80"
          aria-label="Abrir configuracion"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-[#071226] rounded-2xl border border-slate-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar plantillas</DialogTitle>
          <DialogDescription>
            Suba sus contratos y administre las plantillas por categoria de edad.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6 px-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 mb-4">
              Agregar nueva plantilla
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Complete el formulario para registrar una nueva plantilla.
            </p>
          </div>

          <ContractManagementPanel
            contracts={contracts}
            onContractsChange={setContracts}
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  const getExtraData = () => {
    return {
      pagare,
      fechaContrato,
      valorFormacion: valorFormacion ? parseInt(valorFormacion) : 0,
      includePaymentPlan,
      amortSchedule: includePaymentPlan ? amortSchedule : [],
    };
  };

  const validateBase = () => {
    if (!selectedUser || !selectedUserData) {
      toast.error("Por favor seleccione un camper");
      return false;
    }
    if (!selectedContract) {
      toast.error("Seleccione un contrato válido para el estudiante");
      return false;
    }
    if (!selectedContract.fileName) {
      toast.error("El contrato seleccionado no tiene un archivo válido");
      return false;
    }
    if (includePaymentPlan && amortSchedule.length === 0) {
      toast.error("Genere el plan de pagos antes de crear el contrato");
      return false;
    }
    return true;
  };

  const prepareData = () => {
    if (!selectedUserData) return null;
    return prepareUnifiedData(
      selectedUserData.raw as CamperData,
      getExtraData(),
    );
  };

  const handlePreview = async () => {
    if (!validateBase() || !selectedContract) return;

    if (selectedContract.fileType === "application/pdf") {
      toast.error(
        "No se puede previsualizar un template PDF. Use la descarga PDF.",
      );
      return;
    }

    try {
      const data = prepareData();
      const blob = await generateContract(
        selectedContract.dataUrl,
        data,
        "preview.docx",
        true,
      );
      if (blob instanceof Blob) setPreviewBlob(blob);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleSendToZapSign = async () => {
    if (!validateBase() || !selectedContract || !selectedUserData) return;
    if (
      selectedContract.fileType !==
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      toast.error("Solo se puede enviar a ZapSign un contrato .docx.");
      return;
    }

    setIsSendingZapSign(true);
    try {
      const data = prepareData();
      const blob = await generateContract(
        selectedContract.dataUrl,
        data,
        "preview.docx",
        true,
      );
      if (!(blob instanceof Blob)) {
        throw new Error("No se pudo generar el documento para ZapSign");
      }

      const fileName = getContractFileName(
        pagare,
        selectedContract.title,
        selectedUserData.name,
        "docx",
      );
      const url = await uploadToZapSign(blob, fileName);
      window.open(url, "_blank");
      toast.success("Contrato enviado a ZapSign");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar a ZapSign");
    } finally {
      setIsSendingZapSign(false);
    }
  };

  const handleGenerateWord = async () => {
    if (!validateBase() || !selectedContract || !selectedUserData) return;
    if (
      selectedContract.fileType !==
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      toast.error("Solo se puede generar Word desde contratos .docx.");
      return;
    }

    try {
      const data = prepareData();
      const nameToUse = getContractFileName(
        pagare,
        selectedContract.title,
        selectedUserData.name,
        "docx",
      );

      await generateContract(selectedContract.dataUrl, data, nameToUse);
      toast.success("Contrato Word generado correctamente");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleGeneratePDF = async () => {
    if (!validateBase() || !selectedContract || !selectedUserData) return;
    const nameToUse = getContractFileName(
      pagare,
      selectedContract.title,
      selectedUserData.name,
      "pdf",
    );

    try {
      if (selectedContract.fileType === "application/pdf") {
        const response = await fetch(selectedContract.dataUrl);
        const blob = await response.blob();
        saveAs(blob, nameToUse);
        toast.success("Contrato PDF descargado correctamente");
        return;
      }

      const data = prepareData();
      const blob = await generateContract(
        selectedContract.dataUrl,
        data,
        "preview.docx",
        true,
      );
      if (!(blob instanceof Blob)) {
        throw new Error("No se pudo generar el documento PDF");
      }
      setPreviewBlob(blob);
      await new Promise((resolve) => setTimeout(resolve, 700));
      await downloadAsPDF("docx-reader-container", nameToUse);
      toast.success("Contrato PDF generado correctamente");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="GENERADOR DE CONTRATOS" action={settingsDialog} />

      <main className="flex h-[calc(100vh-65px)]">
        <section className="w-[430px] form-panel border-r border-border overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  Gestor de Contratos
                </h1>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Campuslands
                </p>
                <p className="text-sm text-muted-foreground">
                  Cargue el Excel, seleccione un camper y genere contratos según
                  la edad.
                </p>
              </div>

            </div>

            <div
              className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all text-center relative group cursor-pointer"
              style={
                users.length > 0
                  ? {
                      borderColor: "hsl(var(--primary))",
                      backgroundColor: "rgba(47, 90, 163, 0.1)",
                    }
                  : undefined
              }
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`p-3 rounded-full group-hover:scale-110 transition-transform ${
                    users.length > 0 ? "bg-green-500/10" : "bg-primary/10"
                  }`}
                >
                  {users.length > 0 ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {users.length > 0
                      ? `Excel cargado (${users.length} campers)`
                      : "Cargar Excel de Campers"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {users.length > 0
                      ? "Haga clic para cambiar"
                      : "Arrastre o haga clic para subir"}
                  </p>
                </div>
              </div>
            </div>

            {users.length > 0 && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Seleccionar Camper ({users.length})
                </label>
                <UserSelector
                  users={users}
                  value={selectedUser}
                  onChange={setSelectedUser}
                />
              </div>
            )}

            <div>
              <label className="section-label mb-2 block">
                Contratos disponibles
              </label>
              {availableContracts.length > 0 ? (
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground"
                >
                  <option value="" disabled>
                    Seleccione un contrato...
                  </option>
                  {availableContracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.fileName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  {selectedUser
                    ? "No hay contratos disponibles para la categoría de edad del estudiante seleccionado. Verifique que cargó el contrato en la categoría correcta (menor/mayor)."
                    : "Cargue contratos y seleccione un estudiante para ver los contratos disponibles."}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ContractField
                label="Pagare"
                value={pagare}
                onChange={setPagare}
                placeholder="#"
              />
              <ContractField
                label="Fecha contrato"
                value={fechaContrato}
                onChange={setFechaContrato}
                type="date"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="section-label mb-2 block">
                  Monto de Formación
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={valorFormacion.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, "");
                      const numValue = rawValue ? parseInt(rawValue) : 0;
                      if (numValue >= 0) {
                        setValorFormacion(rawValue);
                      }
                    }}
                    className="w-full p-2 text-sm rounded-md border border-input bg-background pl-7"
                    placeholder="Ej: 13000000"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={includePaymentPlan}
                onChange={(event) => setIncludePaymentPlan(event.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span>Plan pagos</span>
            </label>

            <div className="mt-4 rounded-2xl border border-border bg-background p-4">
              <div className="text-sm font-semibold text-foreground mb-2">
                Generar amortización
              </div>

              <div className="mb-3">
                <label className="section-label mb-2 block">
                  Valor a pagar
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amortValorPagar.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, "");
                      const numValue = rawValue ? parseInt(rawValue) : 0;
                      if (numValue >= 0) {
                        setAmortValorPagar(rawValue);
                      }
                    }}
                    className="w-full p-2 text-sm rounded-md border border-input bg-background pl-7"
                    placeholder="Ej: 5000000"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="N° cuotas"
                  value={amortCuotas}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (
                      val === "" ||
                      (parseInt(val) > 0 && !isNaN(parseInt(val)))
                    ) {
                      setAmortCuotas(val);
                    }
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <input
                  type="date"
                  value={amortStartDate}
                  onChange={(e) => setAmortStartDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleGenerateAmortization}
                  className="primary-button flex-1 flex items-center justify-center gap-2 p-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-bold"
                >
                  Generar amortización
                </button>
                <button
                  onClick={handleDownloadAmortCSV}
                  disabled={amortSchedule.length === 0}
                  className="secondary-button flex-1 p-2.5 rounded-md border border-primary text-primary hover:bg-primary/10 text-sm font-bold disabled:opacity-50"
                >
                  Descargar Excel
                </button>
              </div>

              {amortSchedule.length > 0 && (
                <div className="mt-3 overflow-auto">
                  <table className="w-full text-sm table-fixed">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2">#</th>
                        <th className="py-2">Fecha</th>
                        <th className="py-2">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {amortSchedule.map((r) => (
                        <tr
                          key={r.installment}
                          className="border-t border-border"
                        >
                          <td className="py-2">{r.installment}</td>
                          <td className="py-2">{r.dueDate}</td>
                          <td className="py-2">{formatAmount(r.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {false && (
              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <div className="text-sm font-semibold text-foreground mb-2">
                  Generar amortización
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="N° cuotas"
                    value={amortCuotas}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (
                        val === "" ||
                        (parseInt(val) > 0 && !isNaN(parseInt(val)))
                      ) {
                        setAmortCuotas(val);
                      }
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />

                  <input
                    type="date"
                    value={amortStartDate}
                    onChange={(e) => setAmortStartDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleGenerateAmortization}
                    className="primary-button flex-1 flex items-center justify-center gap-2 p-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-bold"
                  >
                    Generar amortización
                  </button>
                  <button
                    onClick={handleDownloadAmortCSV}
                    disabled={amortSchedule.length === 0}
                    className="secondary-button flex-1 p-2.5 rounded-md border border-primary text-primary hover:bg-primary/10 text-sm font-bold disabled:opacity-50"
                  >
                    Descargar Excel
                  </button>
                </div>

                {amortSchedule.length > 0 && (
                  <div className="mt-3 overflow-auto">
                    <table className="w-full text-sm table-fixed">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2">#</th>
                          <th className="py-2">Fecha</th>
                          <th className="py-2">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {amortSchedule.map((r) => (
                          <tr
                            key={r.installment}
                            className="border-t border-border"
                          >
                            <td className="py-2">{r.installment}</td>
                            <td className="py-2">{r.dueDate}</td>
                            <td className="py-2">{formatAmount(r.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <button
                className="secondary-button w-full p-2.5 rounded-md border border-primary text-primary hover:bg-primary/10 flex items-center justify-center gap-2 text-sm font-bold shadow-sm disabled:opacity-50"
                onClick={handlePreview}
                disabled={
                  !selectedUser ||
                  !selectedContract ||
                  selectedContract.fileType === "application/pdf"
                }
              >
                <Eye className="w-4 h-4" /> ACTUALIZAR VISTA PREVIA
              </button>

              <button
                className="primary-button w-full flex items-center justify-center gap-2 p-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-bold"
                onClick={handleGenerateWord}
                disabled={!selectedUser || !selectedContract}
              >
                <FileDown className="w-4 h-4" /> GENERAR CONTRATO WORD
              </button>

              <button
                className="secondary-button w-full p-2.5 rounded-md border border-primary text-primary hover:bg-primary/10 flex items-center justify-center gap-2 text-sm font-bold shadow-sm disabled:opacity-50"
                onClick={handleGeneratePDF}
                disabled={!selectedUser || !selectedContract}
              >
                <FileDown className="w-4 h-4" /> GENERAR CONTRATO PDF
              </button>

              <button
                className="secondary-button w-full p-2.5 rounded-md border border-primary text-primary hover:bg-primary/10 flex items-center justify-center gap-2 text-sm font-bold shadow-sm disabled:opacity-50"
                onClick={handleSendToZapSign}
                disabled={
                  !selectedUser ||
                  !selectedContract ||
                  selectedContract.fileType !==
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                  isSendingZapSign
                }
              >
                <FileDown className="w-4 h-4" />{" "}
                {isSendingZapSign
                  ? "Enviando a ZapSign..."
                  : "Enviar a ZapSign"}
              </button>
            </div>
          </div>
        </section>

        <DocxViewer
          url=""
          blob={previewBlob}
          title={`VISTA PREVIA${selectedContract ? ` - ${selectedContract.fileName.toUpperCase()}` : ""}`}
        />
      </main>
    </div>
  );
};

export default Index;
