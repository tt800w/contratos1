import { useState } from "react";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import DocumentPreview from "@/components/DocumentPreview";
import { Upload } from "lucide-react";

// Mock users data - replace with real data from your backend
const mockUsers = [
  { id: "1", name: "Juan Pérez García (Representante: María García)" },
  { id: "2", name: "Carlos López (Representante: Pedro López)" },
  { id: "3", name: "Ana Martínez (Representante: Rosa Martínez)" },
];

const LumniMenores = () => {
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
                Lumni Menores de edad
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
            <h1 className="text-3xl font-bold text-document-foreground mb-2">
              LUMNI MENORES DE EDAD
            </h1>
            <div className="w-12 h-0.5 bg-document-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground tracking-wider">
              DOCUMENTO OFICIAL CAMPUSLANDS X LUMNI
            </p>
          </div>

          <div className="text-sm leading-relaxed text-document-foreground space-y-6">
            <p className="text-justify">
              El presente acuerdo se celebra entre la institución educativa, el estudiante menor de edad 
              {selectedUserData && <strong> {selectedUserData.name.split(" (")[0]}</strong>} y su representante legal, bajo los 
              términos del programa de financiación Lumni para menores de edad.
            </p>

            <div>
              <h3 className="font-bold text-sm mb-2">I. OBJETO DEL CONTRATO</h3>
              <p className="text-justify">
                El presente documento tiene como finalidad formalizar la vinculación del Camper menor de edad 
                al programa de formación avanzada, con el respaldo y autorización expresa de su representante legal.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-2">II. RESPONSABILIDAD DEL REPRESENTANTE</h3>
              <p className="text-justify">
                El representante legal asume la responsabilidad solidaria por el cumplimiento de las obligaciones 
                académicas y financieras derivadas de este contrato, actuando en nombre del estudiante menor de edad.
              </p>
            </div>

            <div className="flex justify-between pt-12 mt-12 border-t border-gray-300">
              <div className="text-center">
                <div className="w-40 border-t border-gray-400 pt-2">
                  <p className="text-xs font-semibold tracking-wider">REPRESENTANTE CAMPUSLANDS</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-40 border-t border-gray-400 pt-2">
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">FIRMA DEL REPRESENTANTE LEGAL</p>
                </div>
              </div>
            </div>
          </div>
        </DocumentPreview>
      </div>
    </div>
  );
};

export default LumniMenores;
