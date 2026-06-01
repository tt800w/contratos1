import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Trash2, Upload, FilePlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContractAgeCategory,
  ContractFilter,
  StoredContract,
} from "@/types/contracts";

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

interface ContractManagementPanelProps {
  contracts: StoredContract[];
  onContractsChange: (contracts: StoredContract[]) => void;
}

const defaultFormState = {
  file: null as File | null,
  paymentPlan: false,
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("No se pudo leer el archivo"));
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const generateId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const ContractManagementPanel = ({
  contracts,
  onContractsChange,
}: ContractManagementPanelProps) => {
  const [filter, setFilter] = useState<ContractFilter>("all");
  const [form, setForm] = useState(defaultFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const isFileReady = Boolean(form.file);

  const filteredContracts = useMemo(() => {
    if (filter === "all") return contracts;
    return contracts.filter((contract) => contract.ageCategory === filter);
  }, [contracts, filter]);

  const handleFormChange = (
    field: keyof typeof defaultFormState,
    value: string | File | null | boolean,
  ) => {
    if (field === "file") {
      setUploadSuccess(null);
    }

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const detectAgeCategoryFromFileName = (
    fileName: string,
  ): ContractAgeCategory => {
    const lowerName = fileName.toLowerCase();
    if (
      lowerName.includes("mayor") ||
      lowerName.includes("18+") ||
      lowerName.includes("+18")
    ) {
      return "mayor";
    }
    if (
      lowerName.includes("menor") ||
      lowerName.includes("-18") ||
      lowerName.includes("18-")
    ) {
      return "menor";
    }
    return "menor"; // Default fallback
  };

  const handleAddContract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.file) {
      toast.error("Seleccione un archivo de contrato");
      return;
    }
    if (!ACCEPTED_FILE_TYPES.includes(form.file.type)) {
      toast.error("Tipo de archivo no compatible. Use PDF o Word.");
      return;
    }

    setIsSaving(true);
    try {
      const dataUrl = await readFileAsDataUrl(form.file);
      const detectedCategory = detectAgeCategoryFromFileName(form.file.name);
      const inferredTitle = form.file.name
        .replace(/\.(docx|doc|pdf)$/i, "")
        .replace(/[_-]+/g, " ")
        .trim();
      const nextContract: StoredContract = {
        id: generateId(),
        title: inferredTitle || form.file.name,
        ageCategory: detectedCategory,
        paymentPlan: Boolean((form as any).paymentPlan),
        fileName: form.file.name,
        fileType: form.file.type || "application/octet-stream",
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };

      onContractsChange([nextContract, ...contracts]);
      setForm(defaultFormState);
      setUploadSuccess(null);
      setFileInputKey((current) => current + 1);
      toast.success("Contrato cargado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el archivo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveContract = (id: string) => {
    onContractsChange(contracts.filter((item) => item.id !== id));
    toast.success("Contrato eliminado");
  };

  const handleReplaceFile = async (id: string, file?: File | null) => {
    if (!file) return;
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error("Tipo de archivo no compatible. Use PDF o Word.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const detectedCategory = detectAgeCategoryFromFileName(file.name);
      const inferredTitle = file.name
        .replace(/\.(docx|doc|pdf)$/i, "")
        .replace(/[_-]+/g, " ")
        .trim();
      onContractsChange(
        contracts.map((contract) =>
          contract.id === id
            ? {
                ...contract,
                title: inferredTitle || file.name,
                ageCategory: detectedCategory,
                fileName: file.name,
                fileType: file.type || "application/octet-stream",
                dataUrl,
                uploadedAt: new Date().toISOString(),
              }
            : contract,
        ),
      );
      toast.success("Contrato actualizado");
    } catch (error) {
      console.error(error);
      toast.error("Error al reemplazar el archivo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
        <form onSubmit={handleAddContract} className="grid gap-4">
          <div className="mt-3 grid gap-3">
            <label className="block text-xs text-slate-400">
              Seleccionar plantilla .docx o .pdf
            </label>
            <div
              className={`relative rounded-xl border-2 p-6 text-center transition-all duration-300 ${
                isFileReady
                  ? "border-green-500 bg-green-500/15 shadow-lg shadow-green-500/20"
                  : "border-slate-800 bg-slate-900 hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                {form.file ? (
                  <>
                    <div className="relative">
                      <CheckCircle2 className="w-8 h-8 text-green-400 animate-pulse" />
                      <div className="absolute inset-0 w-8 h-8 border border-green-400 rounded-full animate-ping opacity-75" />
                    </div>
                    <div className="text-sm font-semibold text-green-400">
                      ✓ Documento listo
                    </div>
                    <div className="text-xs text-green-400/70">
                      {form.file.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      Haga clic para cambiar la plantilla antes de guardar.
                    </div>
                  </>
                ) : (
                  <>
                    <FilePlus className="w-6 h-6 text-slate-400" />
                    <div className="text-sm text-slate-300">
                      Seleccionar plantilla .docx
                    </div>
                    <div className="text-xs text-slate-500">
                      Sube la plantilla para guardarla.
                    </div>
                    {uploadSuccess && (
                      <div className="text-xs text-green-400/70">
                        Ultimo archivo guardado: {uploadSuccess}
                      </div>
                    )}
                  </>
                )}
              </div>

              <input
                key={fileInputKey}
                id="contract-file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) =>
                  handleFormChange("file", event.target.files?.[0] ?? null)
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
              <input
                id="payment-plan"
                type="checkbox"
                checked={(form as any).paymentPlan}
                onChange={(event) =>
                  handleFormChange("paymentPlan", event.target.checked)
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label
                htmlFor="payment-plan"
                className="text-sm text-slate-300 cursor-pointer flex-1"
              >
                Este contrato incluye plan de pagos
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#2f5aa3] hover:bg-[#244b8a] text-white"
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar plantilla"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Contratos almacenados
            </h3>
            <p className="text-sm text-muted-foreground">
              Usa los filtros para ver solo menores, mayores o todos los
              contratos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "menor", "mayor"] as ContractFilter[]).map((value) => (
              <Button
                key={value}
                variant={filter === value ? "secondary" : "outline"}
                size="sm"
                onClick={() => setFilter(value)}
              >
                {value === "all"
                  ? "Todos"
                  : value === "menor"
                    ? "Menores"
                    : "Mayores"}
              </Button>
            ))}
          </div>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border/50 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            No hay contratos almacenados para este filtro.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="rounded-2xl border border-border p-4 bg-card"
              >
                <div className="flex flex-col gap-3">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {contract.ageCategory === "menor"
                        ? "Menor de edad"
                        : "Mayor de edad"}
                    </div>
                    <h4 className="text-base font-semibold text-foreground">
                      {contract.title}
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      Archivo: {contract.fileName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Subido: {new Date(contract.uploadedAt).toLocaleString()}
                    </div>
                    {contract.paymentPlan && (
                      <div className="text-sm text-slate-400">
                        Con plan de pagos
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-slate-800 flex items-center justify-center">
                        <FilePlus className="w-5 h-5 text-slate-300" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {contract.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          {contract.ageCategory === "menor" ? "Menor" : "Mayor"}
                          {contract.paymentPlan ? " - Con plan de pagos" : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={contract.dataUrl}
                        download={contract.fileName}
                        className="text-sm text-slate-300 hover:text-white"
                      >
                        <Download className="w-4 h-4 inline-block mr-1" />{" "}
                        Descargar
                      </a>

                      <label
                        htmlFor={`replace-${contract.id}`}
                        className="text-sm text-slate-300 hover:text-white cursor-pointer"
                      >
                        <Upload className="w-4 h-4 inline-block mr-1" />{" "}
                        Reemplazar
                      </label>

                      <input
                        id={`replace-${contract.id}`}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(event) =>
                          handleReplaceFile(
                            contract.id,
                            event.target.files?.[0] ?? null,
                          )
                        }
                      />

                      <button
                        onClick={() => handleRemoveContract(contract.id)}
                        className="text-slate-300 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractManagementPanel;
