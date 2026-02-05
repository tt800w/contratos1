import { useState } from "react";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import { Upload, FileDown, Mail, FileText } from "lucide-react";
import DocxViewer from "@/components/DocxViewer";
import { generateContract } from "@/utils/contractGenerator";
import { toast } from "sonner";

// Mock users data - replace with real data from your backend
const mockUsers = [
  {
    id: "1",
    name: "Carlos Ruiz Méndez",
    representative: {
      name: "Juan Pérez García",
      cedula: "12345678",
      email: "juan.perez@email.com",
      phone: "3000000000"
    }
  },
  {
    id: "2",
    name: "Isabella Torres",
    representative: {
      name: "María Torres",
      cedula: "87654321",
      email: "maria.torres@email.com",
      phone: "3111111111"
    }
  },
  {
    id: "3",
    name: "Santiago Gómez",
    representative: {
      name: "Pedro Gómez",
      cedula: "56789012",
      email: "pedro.gomez@email.com",
      phone: "3222222222"
    }
  },
];

const RP56Menores = () => {
  const [selectedUser, setSelectedUser] = useState("");
  // Campos del contrato
  const [pagare, setPagare] = useState("");
  const [fechaContrato, setFechaContrato] = useState("");
  const [cuotas, setCuotas] = useState("");

  // Datos personales adicionales
  const [tarjetaIdentidad, setTarjetaIdentidad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [celular, setCelular] = useState("");

  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const selectedUserData = mockUsers.find((u) => u.id === selectedUser);

  // Función auxiliar para preparar los datos
  const prepareContractData = () => {
    if (!selectedUser || !selectedUserData) return null;

    const camperName = selectedUserData.name;
    const repData = selectedUserData.representative;

    // Procesar fecha
    const fechaObj = fechaContrato ? new Date(fechaContrato + 'T00:00:00') : new Date();
    const dia = fechaObj.getDate().toString();
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mes = meses[fechaObj.getMonth()];
    const ano = fechaObj.getFullYear().toString();

    return {
      "NOMBRE COMPLETO REP": repData.name,
      "CEDULA REP DEL CAMPER": repData.cedula,
      "NOMBRE DEL CAMPER": camperName,
      "NUMERO DE TARJETA DE IDENTIDAD": tarjetaIdentidad,
      "DIRECCION FISICA DEL CAMPER": direccion,
      "EMAIL REP CAMPER": repData.email,
      "CELULAR CAMPER": celular,
      "dia": dia,
      "mes": mes,
      "ano": ano,
      "NUMERO DE PAGARE": pagare,
      "numero_cuotas": cuotas
    };
  };

  const handePreview = async () => {
    const data = prepareContractData();
    if (!data) {
      toast.error("Por favor complete los datos requeridos");
      return;
    }

    try {
      const blob = await generateContract(
        "/contratos/Condiciones Específicas- Estratos 5 y 6 - Menor de Edad.docx",
        data,
        "preview.docx",
        true
      );
      if (blob instanceof Blob) {
        setPreviewBlob(blob);
        toast.success("Vista previa actualizada");
      }
    } catch (error) {
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
                RP 56 Menores de edad
              </h2>
              <p className="text-sm text-muted-foreground">
                Seleccione el perfil para cargar la información en el documento.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-2 tracking-wider">
                  SELECCIONE EL CAMPER
                </label>
                <UserSelector
                  value={selectedUser}
                  onChange={setSelectedUser}
                  users={mockUsers}
                />
                {selectedUserData && (
                  <div className="mt-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                    <p><strong>Representante:</strong> {selectedUserData.representative.name}</p>
                    <p><strong>Cédula:</strong> {selectedUserData.representative.cedula}</p>
                    <p><strong>Email:</strong> {selectedUserData.representative.email}</p>
                  </div>
                )}
              </div>

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
                <div className="border-t border-border my-4 pt-4">
                  <h3 className="text-sm font-semibold mb-3">Datos del Camper</h3>

                  <div className="space-y-4">
                    {/* Campos de Representante ELIMINADOS por solicitud del usuario */}

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-2 tracking-wider">
                        TARJETA DE IDENTIDAD (CAMPER)
                      </label>
                      <input
                        type="text"
                        value={tarjetaIdentidad}
                        onChange={(e) => setTarjetaIdentidad(e.target.value)}
                        className="w-full p-2 rounded-md border border-input bg-background"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-2 tracking-wider">
                        DIRECCIÓN FÍSICA
                      </label>
                      <input
                        type="text"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        className="w-full p-2 rounded-md border border-input bg-background"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-2 tracking-wider">
                        CELULAR CAMPER
                      </label>
                      <input
                        type="text"
                        value={celular}
                        onChange={(e) => setCelular(e.target.value)}
                        className="w-full p-2 rounded-md border border-input bg-background"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="secondary-button mt-8 w-full p-3 rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
              onClick={handePreview}
            >
              <FileText className="w-5 h-5" />
              <span>ACTUALIZAR VISTA PREVIA</span>
            </button>

            <button
              className="primary-button mt-4 flex items-center justify-center gap-2 w-full p-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={async () => {
                const data = prepareContractData();
                if (!data) {
                  toast.error("Por favor seleccione un usuario primero");
                  return;
                }

                try {
                  await generateContract(
                    "/contratos/Condiciones Específicas- Estratos 5 y 6 - Menor de Edad.docx",
                    data,
                    `Contrato_RP56_Menores_${data["NOMBRE DEL CAMPER"].replace(/\s+/g, '_')}.docx`
                  );

                  toast.success("Contrato generado exitosamente");
                } catch (error) {
                  toast.error("Error al generar el contrato");
                }
              }}
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
        <DocxViewer
          url="/contratos/Condiciones Específicas- Estratos 5 y 6 - Menor de Edad.docx"
          blob={previewBlob}
        />
      </div>
    </div>
  );
};

export default RP56Menores;
