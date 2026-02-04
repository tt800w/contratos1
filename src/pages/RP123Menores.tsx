import { useState } from "react";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import DocumentPreview from "@/components/DocumentPreview";
import { Upload } from "lucide-react";

// Mock users data - replace with real data from your backend
const mockUsers = [
  { id: "1", name: "Juan David Rodríguez (Representante: Ana María Rodríguez)" },
  { id: "2", name: "Sofía Martínez (Representante: Carlos Martínez)" },
  { id: "3", name: "Miguel Ángel López (Representante: Laura López)" },
];

const RP123Menores = () => {
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
                RP 123 Menores de edad
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
              CONTRATO DE RECURSOS PROPIOS
            </h1>
            <div className="w-12 h-0.5 bg-document-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground tracking-wider">
              ESTRATOS 1, 2 Y 3 • CAMPUSLANDS OFICIAL
            </p>
          </div>

          <div className="text-sm leading-relaxed text-document-foreground space-y-6">
            <p className="text-justify">
              El presente documento establece los términos y condiciones de la financiación otorgada bajo el 
              programa de Recursos Propios de Campuslands, orientado a facilitar el acceso a formación de 
              alta calidad para estudiantes pertenecientes a estratos socioeconómicos bajos.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-document-foreground text-white text-xs px-2 py-1 rounded">01</span>
                <h3 className="font-bold text-sm">IDENTIFICACIÓN DE LAS PARTES</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground mb-1">CAMPER</p>
                  <p className="text-primary">{selectedUserData?.name.split(" (")[0] || "Nombre del camper..."}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">REPRESENTANTE LEGAL</p>
                  <p className="text-primary">{selectedUserData?.name.match(/\(Representante: (.+)\)/)?.[1] || "Nombre del representante..."}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-document-foreground text-white text-xs px-2 py-1 rounded">02</span>
                <h3 className="font-bold text-sm">OBJETO Y ALCANCE</h3>
              </div>
              <p className="text-justify">
                Este acuerdo formaliza la vinculación del Camper al programa de formación técnica. El 
                representante legal asume solidariamente las obligaciones contraídas, garantizando el 
                cumplimiento del reglamento interno y el aprovechamiento académico del beneficiario.
              </p>
            </div>

            <div className="flex justify-between pt-12 mt-12 border-t border-gray-300">
              <div className="text-center">
                <div className="w-40 border-t border-gray-400 pt-2">
                  <p className="text-xs font-semibold tracking-wider">DIRECTOR ADMINISTRATIVO</p>
                  <p className="text-xs text-muted-foreground">CAMPUSLANDS SAS</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-40 border-t border-gray-400 pt-2">
                  <p className="text-xs font-semibold tracking-wider italic text-muted-foreground">FIRMA REPRESENTANTE LEGAL</p>
                </div>
              </div>
            </div>
          </div>
        </DocumentPreview>
      </div>
    </div>
  );
};

export default RP123Menores;
