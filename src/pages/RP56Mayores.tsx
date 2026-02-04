import { useState } from "react";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import DocumentPreview from "@/components/DocumentPreview";
import { Upload } from "lucide-react";

// Mock users data - replace with real data from your backend
const mockUsers = [
  { id: "1", name: "Juan Sebastián Rodríguez" },
  { id: "2", name: "Valentina García Pérez" },
  { id: "3", name: "Andrés Felipe Martínez" },
];

const RP56Mayores = () => {
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
                RP 56 Mayores de edad
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
              RECURSOS PROPIOS ESTRATOS 5 Y 6 MAYORES DE EDAD
            </h1>
            <div className="w-16 h-0.5 bg-document-foreground mx-auto mb-3" />
          </div>

          <div className="text-sm leading-relaxed text-document-foreground space-y-6">
            <p className="text-justify">
              Se celebra el presente contrato de servicios educativos entre <strong>CAMPUSLANDS</strong> y el camper{" "}
              <strong>{selectedUserData?.name || "[Nombre del camper]"}</strong>.
            </p>

            <div>
              <h3 className="font-bold text-sm mb-2">CLÁUSULA PRIMERA: OBJETO</h3>
              <p className="text-justify">
                El presente contrato tiene por objeto la prestación de servicios de formación avanzada en 
                desarrollo de software y tecnologías de la información bajo la modalidad de recursos propios 
                para estratos 5 y 6.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-2">CLÁUSULA SEGUNDA: OBLIGACIONES</h3>
              <p className="text-justify">
                El camper se compromete a cumplir con la totalidad del programa académico y mantener los 
                estándares de excelencia exigidos por la institución.
              </p>
            </div>

            <div className="flex justify-between pt-12 mt-12 border-t border-gray-300">
              <div className="text-center">
                <div className="w-40 border-t border-gray-400 pt-2">
                  <p className="text-xs font-bold">FIRMA CAMPUSLANDS</p>
                  <p className="text-xs text-muted-foreground">Representante Legal</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-40 border-t border-gray-400 pt-2">
                  <p className="text-xs font-bold">FIRMA DEL CAMPER</p>
                </div>
              </div>
            </div>
          </div>
        </DocumentPreview>
      </div>
    </div>
  );
};

export default RP56Mayores;
