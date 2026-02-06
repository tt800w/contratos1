import { useState } from "react";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import { Upload, FileDown, Mail, FileText, FileSpreadsheet } from "lucide-react";
import DocxViewer from "@/components/DocxViewer";
import { generateContract } from "@/utils/contractGenerator";
import { toast } from "sonner";
import { parseExcel, CamperData } from "@/utils/excelParser";

const RP123Mayores = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  // Campos del contrato
  const [pagare, setPagare] = useState("");
  const [fechaContrato, setFechaContrato] = useState("");
  const [cuotas, setCuotas] = useState("");

  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const selectedUserData = users.find((u) => u.id === selectedUser);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcel(file);
      const mappedUsers = data.map((item, index) => ({
        id: index.toString(),
        name: item.nombreCamper,
        representative: {
          name: item.nombreRepresentante,
          cedula: item.cedulaRepresentante,
          email: item.emailRepresentante, // Used for camper in adults
        },
        raw: item
      }));

      setUsers(mappedUsers);
      toast.success(`Se cargaron ${mappedUsers.length} campers correctamente`);
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar el archivo Excel");
    }
  };

  const handePreview = async () => {
    if (!selectedUser || !selectedUserData) {
      toast.error("Por favor seleccione un camper");
      return;
    }

    try {
      const raw = selectedUserData.raw as CamperData;

      // Procesar fecha
      const fechaObj = fechaContrato ? new Date(fechaContrato + 'T00:00:00') : new Date();
      const dia = fechaObj.getDate().toString();
      const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const mes = meses[fechaObj.getMonth()];
      const ano = fechaObj.getFullYear().toString();

      const data = {
        "NOMBRE DEL CAMPER": raw.nombreCamper,
        "NUMERO DE CEDULA": raw.documentoCamper,
        "DIRECCION FISICA CAMPER": raw.direccionCamper,
        "EMAIL CAMPER": raw.emailRepresentante,
        "CELULAR CAMPER": raw.celularCamper,
        "dia": dia,
        "mes": mes,
        "año": ano,
        "NUMERO DE PAGARE": pagare,
        "numero_cuotas": cuotas,
      };

      const blob = await generateContract(
        "/contratos/Condiciones Específicas- Estrato 1, 2 y 3 - Mayor de Edad.docx",
        data,
        "preview.docx",
        true
      );
      if (blob instanceof Blob) {
        setPreviewBlob(blob);
        toast.success("Vista previa actualizada");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al generar vista previa");
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
                RP 123 Mayores de edad
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
                      <p><strong>Cédula:</strong> {selectedUserData.raw.documentoCamper}</p>
                      <p><strong>Email:</strong> {selectedUserData.raw.emailRepresentante}</p>
                      <p><strong>Dirección:</strong> {selectedUserData.raw.direccionCamper}</p>
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

              <div>
                <label className="block text-xs font-bold text-foreground mb-2 tracking-wider">
                  NÚMERO DE CUOTAS
                </label>
                <input
                  type="number"
                  value={cuotas}
                  onChange={(e) => setCuotas(e.target.value)}
                  className="w-full p-2 rounded-md border border-input bg-background"
                  placeholder="Ej: 12"
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

            <button
              className="primary-button mt-4 flex items-center justify-center gap-2 w-full p-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                if (!selectedUser || !selectedUserData) {
                  toast.error("Por favor seleccione un usuario primero");
                  return;
                }

                try {
                  const raw = selectedUserData.raw as CamperData;
                  const fechaObj = fechaContrato ? new Date(fechaContrato + 'T00:00:00') : new Date();
                  const dia = fechaObj.getDate().toString();
                  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                  const mes = meses[fechaObj.getMonth()];
                  const ano = fechaObj.getFullYear().toString();

                  const data = {
                    "NOMBRE DEL CAMPER": raw.nombreCamper,
                    "NUMERO DE CEDULA": raw.documentoCamper,
                    "DIRECCION FISICA CAMPER": raw.direccionCamper,
                    "EMAIL CAMPER": raw.emailRepresentante,
                    "CELULAR CAMPER": raw.celularCamper,
                    "dia": dia,
                    "mes": mes,
                    "año": ano,
                    "NUMERO DE PAGARE": pagare,
                    "numero_cuotas": cuotas,
                  };

                  await generateContract(
                    "/contratos/Condiciones Específicas- Estrato 1, 2 y 3 - Mayor de Edad.docx",
                    data,
                    `Contrato_RP123_Mayores_${raw.nombreCamper.replace(/\s+/g, '_')}.docx`
                  );

                  toast.success("Contrato generado exitosamente");
                } catch (error) {
                  toast.error("Error al generar el contrato");
                }
              }}
              disabled={!selectedUser}
            >
              <FileDown className="w-5 h-5" />
              <span>DESCARGAR EN PDF</span>
            </button>

            <button
              className="secondary-button mt-4 flex items-center justify-center gap-2 w-full p-3 rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors"
              onClick={() => toast.info("Funcionalidad de correo próximamente")}
            >
              <Mail className="w-5 h-5" />
              <span>ENVIAR CORREO</span>
            </button>
          </div>
        </div>

        {/* Document Viewer */}
        <DocxViewer url="/contratos/Condiciones Específicas- Estrato 1, 2 y 3 - Mayor de Edad.docx" blob={previewBlob} />
      </div>
    </div>
  );
};

export default RP123Mayores;
