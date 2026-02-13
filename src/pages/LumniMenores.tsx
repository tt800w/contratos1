import { useState } from "react";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import { FileDown, Mail, FileText, FileSpreadsheet } from "lucide-react";
import DocxViewer from "@/components/DocxViewer";
import { generateContract, prepareUnifiedData, downloadAsPDF } from "@/utils/contractGenerator";
import { uploadToZapSign } from "@/utils/zapSignService";
import { toast } from "sonner";
import { parseExcel, CamperData } from "@/utils/excelParser";

const LumniMenores = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  // Campos del contrato
  const [pagare, setPagare] = useState("");
  const [fechaContrato, setFechaContrato] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const selectedUserData = users.find((u) => u.id === selectedUser);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcel(file);
      // Map parsed data to the structure expected by UserSelector and the app
      const mappedUsers = data.map((item, index) => ({
        id: index.toString(),
        name: item.nombreCamper,
        representative: {
          name: item.nombreRepresentante,
          cedula: item.cedulaRepresentante,
          email: item.emailRepresentante,
          phone: "N/A" // Not in Excel headers, can be ignored or added if available later
        },
        // Store raw item for full access
        raw: item
      }));

      setUsers(mappedUsers);
      toast.success(`Se cargaron ${mappedUsers.length} campers correctamente`);
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar el archivo Excel");
    }
  };

  // Función auxiliar para preparar los datos
  const prepareContractData = () => {
    if (!selectedUser || !selectedUserData) return null;
    const raw = selectedUserData.raw as CamperData;
    return prepareUnifiedData(raw, { pagare, fechaContrato });
  };

  const handePreview = async () => {
    const data = prepareContractData();
    if (!data) {
      toast.error("Por favor seleccione un camper y complete los datos requeridos");
      return;
    }

    try {
      const blob = await generateContract(
        "/contratos/Condiciones Específicas-Financiación Lumni- Menor de Edad.docx",
        data,
        "preview.docx",
        true
      );
      if (blob instanceof Blob) {
        setPreviewBlob(blob);
        toast.success("Vista previa actualizada");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Error al generar vista previa: ${error.message || "Error desconocido"}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showBack />

      <div className="flex h-[calc(100vh-65px)]">
        {/* Form Panel */}
        <div className="w-[400px] form-panel border-r border-border overflow-y-auto flex flex-col">
          <div className="flex-1">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Lumni Menores de edad
              </h2>
              <p className="text-sm text-muted-foreground">
                Cargue el archivo Excel y seleccione el perfil para generar el contrato.
              </p>
            </div>

            <div className="space-y-6">
              {/* Excel Upload */}
              <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors text-center">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <span className="text-sm font-medium">Cargar Excel de Campers</span>
                  <span className="text-xs text-muted-foreground">(.xlsx, .xls)</span>
                </label>
              </div>

              {users.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 tracking-wider">
                    SELECCIONE EL CAMPER ({users.length} disponibles)
                  </label>
                  <UserSelector
                    value={selectedUser}
                    onChange={setSelectedUser}
                    users={users}
                  />
                  {selectedUserData && (
                    <div className="mt-2 text-xs text-muted-foreground bg-secondary/50 p-3 rounded space-y-1">
                      <p><strong>Representante:</strong> {selectedUserData.raw.nombreRepresentante}</p>
                      <p><strong>Cédula Rep:</strong> {selectedUserData.raw.cedulaRepresentante}</p>
                      <p><strong>Email Rep:</strong> {selectedUserData.raw.emailRepresentante}</p>
                      <p><strong>Documento Camper:</strong> {selectedUserData.raw.documentoCamper}</p>
                      <p><strong>Celular Camper:</strong> {selectedUserData.raw.celularCamper}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-foreground mb-2 tracking-wider">
                  NÚMERO DE PAGARÉ
                </label>
                <input
                  type="text"
                  value={pagare}
                  onChange={(e) => setPagare(e.target.value)}
                  className="w-full p-2 rounded-md border border-input bg-background"
                  placeholder="Ingrese número de pagaré"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-2 tracking-wider">
                  FECHA DEL CONTRATO
                </label>
                <input
                  type="date"
                  value={fechaContrato}
                  onChange={(e) => setFechaContrato(e.target.value)}
                  className="w-full p-2 rounded-md border border-input bg-background"
                />
              </div>
            </div>

            <button
              className="secondary-button mt-8 w-full p-3 rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
              onClick={handePreview}
              disabled={!selectedUser}
            >
              <FileText className="w-5 h-5" />
              <span>ACTUALIZAR VISTA PREVIA</span>
            </button>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                className="primary-button flex items-center justify-center gap-2 p-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs font-bold"
                onClick={async () => {
                  const data = prepareContractData();
                  if (!data) {
                    toast.error("Complete los datos requeridos");
                    return;
                  }

                  try {
                    await generateContract(
                      "/contratos/Condiciones Específicas-Financiación Lumni- Menor de Edad.docx",
                      data,
                      `Contrato_Lumni_Menores_${data["NOMBRE DEL CAMPER"].replace(/\s+/g, '_')}.docx`
                    );

                    toast.success("Archivo Word generado");
                  } catch (error: any) {
                    toast.error(`Error: ${error.message}`);
                  }
                }}
                disabled={!selectedUser}
              >
                <FileDown className="w-4 h-4" />
                <span>WORD</span>
              </button>

              <button
                className="primary-button flex items-center justify-center gap-2 p-2.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 text-xs font-bold"
                onClick={async () => {
                  const data = prepareContractData();
                  if (!data) {
                    toast.error("Complete el previo primero");
                    return;
                  }
                  const fileName = `Contrato_Lumni_Menores_${data["NOMBRE DEL CAMPER"].replace(/\s+/g, '_')}.pdf`;

                  toast.promise(downloadAsPDF("docx-reader-container", fileName), {
                    loading: 'Generando PDF...',
                    success: 'PDF descargado',
                    error: (err) => `Error: ${err.message}`
                  });
                }}
                disabled={!selectedUser}
              >
                <FileDown className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>

            <button
              className="secondary-button mt-4 flex items-center justify-center gap-2 w-full p-3 rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              disabled={!selectedUser}
              onClick={async () => {
                const data = prepareContractData();
                const raw = selectedUserData.raw as CamperData;

                toast.promise(async () => {
                  const blob = await generateContract(
                    "/contratos/Condiciones Específicas-Financiación Lumni- Menor de Edad.docx",
                    data,
                    "contrato.docx",
                    true
                  );

                  const url = await uploadToZapSign(blob as Blob, `Contrato_Lumni_Menor_${raw.nombreCamper}.docx`);
                  window.open(url, '_blank');
                }, {
                  loading: 'Subiendo contrato a ZapSign...',
                  success: 'Contrato subido. Se abrirá ZapSign para finalizar.',
                  error: (err) => `No se pudo enviar a ZapSign: ${err.message}`
                });
              }}
            >
              <Mail className="w-5 h-5" />
              <span>ENVIAR CORREO</span>
            </button>
          </div>
        </div>

        {/* Document Viewer */}
        <DocxViewer
          url="/contratos/Condiciones Específicas-Financiación Lumni- Menor de Edad.docx"
          blob={previewBlob}
        />
      </div>
    </div>
  );
};

export default LumniMenores;
