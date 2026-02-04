import { useState } from "react";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import DocumentPreview from "@/components/DocumentPreview";
import { Upload } from "lucide-react";

// Mock users data - replace with real data from your backend
const mockUsers = [
  { id: "1", name: "Daniel Alejandro Rodríguez" },
  { id: "2", name: "Laura Patricia Gómez" },
  { id: "3", name: "Sebastián Ruiz Méndez" },
];

const RP123Mayores = () => {
  const [selectedUser, setSelectedUser] = useState("");

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
            </div>
          </div>

          <button className="primary-button mt-8">
            <Upload className="w-5 h-5" />
            <span>SUBIR INFORMACIÓN</span>
          </button>
        </div>

        {/* Document Preview */}
        <DocumentPreview>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-document-foreground mb-2">
              RECURSOS PROPIOS ESTRATOS 1, 2, 3 MAYORES DE EDAD
            </h1>
            <div className="w-12 h-0.5 bg-document-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground tracking-wider">
              DOCUMENTO OFICIAL CAMPUSLANDS
            </p>
          </div>

          <div className="text-sm leading-relaxed text-document-foreground space-y-6">
            <p className="text-justify">
              Por medio del presente documento, se formaliza el acuerdo de formación educativa entre{" "}
              <strong>CAMPUSLANDS</strong> y el beneficiario{" "}
              <strong>{selectedUserData?.name || "[Nombre del estudiante]"}</strong>.
            </p>

            <p className="text-justify">
              El beneficiario declara bajo la gravedad de juramento que pertenece a los estratos 
              socioeconómicos 1, 2 o 3, requisito indispensable para el acceso al programa de 
              formación financiado con recursos propios de la institución.
            </p>

            <div>
              <h3 className="font-bold text-sm mb-2">CLÁUSULA PRIMERA - OBJETO:</h3>
              <p className="text-justify">
                Campuslands se compromete a brindar formación técnica especializada en desarrollo de 
                software, cubriendo el 100% de los costos educativos. El beneficiario se compromete a 
                cumplir con la intensidad horaria y los estándares de calidad académica establecidos.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-2">CLÁUSULA SEGUNDA - COMPROMISOS:</h3>
              <p className="text-justify">
                El estudiante debe mantener una asistencia mínima del 95% y cumplir con todos los retos 
                y evaluaciones del programa. Cualquier incumplimiento injustificado podrá ser causal de 
                retiro inmediato del programa de becas.
              </p>
            </div>

            <div className="flex justify-between pt-12 mt-12 border-t border-gray-300">
              <div className="text-center">
                <div className="w-40 border-t border-gray-400 pt-2">
                  <p className="text-xs font-semibold">FIRMA CAMPUSLANDS</p>
                  <p className="text-xs text-muted-foreground">Representante Legal</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-40 border-t border-gray-400 pt-2">
                  <p className="text-xs font-semibold">FIRMA DEL CAMPER</p>
                </div>
              </div>
            </div>
          </div>
        </DocumentPreview>
      </div>
    </div>
  );
};

export default RP123Mayores;
