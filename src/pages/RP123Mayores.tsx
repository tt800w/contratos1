import { useState } from "react";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import { Upload, FileDown, Mail } from "lucide-react";
import DocxViewer from "@/components/DocxViewer";
import { generateContract } from "@/utils/contractGenerator";
import { toast } from "sonner";

// Mock users data - replace with real data from your backend
const mockUsers = [
  { id: "1", name: "Daniel Alejandro Rodríguez" },
  { id: "2", name: "Laura Patricia Gómez" },
  { id: "3", name: "Sebastián Ruiz Méndez" },
];

const RP123Mayores = () => {
  const [selectedUser, setSelectedUser] = useState("");
  // Campos del contrato
  const [pagare, setPagare] = useState("");
  const [fechaContrato, setFechaContrato] = useState("");
  const [cuotas, setCuotas] = useState("");

  // Datos personales adicionales
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");

  const selectedUserData = mockUsers.find((u) => u.id === selectedUser);

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
                Seleccione el perfil para cargar la información en el documento.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-2 tracking-wider">
                  SELECCIONE LOS DATOS DE QUIEN REQUIERA LLENAR LOS DATOS PARA EL CONTRATO
                </label>
                <UserSelector
                  value={selectedUser}
                  onChange={setSelectedUser}
                  users={mockUsers}
                />
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
                  <h3 className="text-sm font-semibold mb-3">Datos Personales</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-2 tracking-wider">
                        CÉDULA DE CIUDADANÍA
                      </label>
                      <input
                        type="text"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
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
                        EMAIL
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 rounded-md border border-input bg-background"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-2 tracking-wider">
                        CELULAR
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

            <button className="primary-button mt-8">
              <Upload className="w-5 h-5" />
              <span>SUBIR INFORMACIÓN</span>
            </button>

            <button
              className="secondary-button mt-4 flex items-center justify-center gap-2 w-full p-3 rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors"
              onClick={async () => {
                if (!selectedUser || !selectedUserData) {
                  toast.error("Por favor seleccione un usuario primero");
                  return;
                }

                try {
                  const camperName = selectedUserData.name;

                  // Procesar fecha
                  const fechaObj = fechaContrato ? new Date(fechaContrato + 'T00:00:00') : new Date();
                  const dia = fechaObj.getDate().toString();
                  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                  const mes = meses[fechaObj.getMonth()];
                  const ano = fechaObj.getFullYear().toString();

                  const data = {
                    "NOMBRE DEL CAMPER": camperName,
                    "NUMERO DE CEDULA": cedula,
                    "DIRECCION FISICA CAMPER": direccion,
                    "EMAIL CAMPER": email,
                    "CELULAR CAMPER": celular,
                    "dia": dia,
                    "mes": mes,
                    "año": ano,
                    "NUMERO DE PAGARE": pagare,
                    "numero_cuotas": cuotas,
                  };

                  await generateContract(
                    "/contratos/Condiciones Específicas- Estrato 1, 2 y 3 - Mayor de Edad.docx",
                    data,
                    `Contrato_RP123_Mayores_${camperName.replace(/\s+/g, '_')}.docx`
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
        <DocxViewer url="/contratos/Condiciones Específicas- Estrato 1, 2 y 3 - Mayor de Edad.docx" />
      </div>
    </div>
  );
};

export default RP123Mayores;
