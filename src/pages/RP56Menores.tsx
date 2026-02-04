import { useState } from "react";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import DocumentPreview from "@/components/DocumentPreview";
import { Upload } from "lucide-react";

// Mock users data - replace with real data from your backend
const mockUsers = [
  { id: "1", name: "Carlos Ruiz Méndez (Representante: Juan Pérez García)" },
  { id: "2", name: "Isabella Torres (Representante: María Torres)" },
  { id: "3", name: "Santiago Gómez (Representante: Pedro Gómez)" },
];

const RP56Menores = () => {
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
                RP 56 Menores de edad
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
              CONTRATO RECURSOS PROPIOS ESTRATOS 5-6 (MENORES)
            </h1>
            <div className="w-12 h-0.5 bg-document-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground tracking-wider">
              DOCUMENTO OFICIAL CAMPUSLANDS
            </p>
          </div>

          <div className="text-sm leading-relaxed text-document-foreground space-y-6">
            <p className="text-justify">
              El presente documento formaliza la vinculación del estudiante menor de edad bajo la modalidad 
              de recursos propios para estratos 5 y 6. El representante legal asume la responsabilidad total 
              de las obligaciones aquí descritas para el beneficio del Camper vinculado al programa.
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
              <h3 className="font-bold text-sm mb-2">I. OBJETO DEL ACUERDO</h3>
              <p className="text-justify">
                Definir las condiciones de prestación de servicios educativos y el compromiso financiero 
                por parte del representante para garantizar la formación técnica y profesional del 
                beneficiario (Camper).
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-2">II. RESPONSABILIDAD DEL REPRESENTANTE</h3>
              <p className="text-justify">
                El representante legal se compromete a velar por el cumplimiento del reglamento interno 
                por parte del menor y a cubrir los costos asociados al programa en los tiempos estipulados 
                por la institución.
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

export default RP56Menores;
