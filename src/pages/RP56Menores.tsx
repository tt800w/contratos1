import { useState } from "react";
import Header from "@/components/Header";
import FormInput from "@/components/FormInput";
import FormSection from "@/components/FormSection";
import DocumentPreview from "@/components/DocumentPreview";
import { Save } from "lucide-react";

const RP56Menores = () => {
  const [formData, setFormData] = useState({
    // Representante
    nombreRepresentante: "",
    cedulaRepresentante: "",
    correoRepresentante: "",
    ciudadRepresentante: "",
    celularRepresentante: "",
    // Camper
    nombreCamper: "",
    documentoCamper: "",
    correoCamper: "",
  });

  const updateField = (field: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showBack subtitle="RP 56 MENORES" />

      <div className="flex">
        {/* Form Panel */}
        <div className="w-[400px] form-panel border-r border-border overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-2">
              RP 56 Menores
            </h2>
            <p className="text-sm text-muted-foreground">
              Complete la información del representante y del camper para generar el contrato estandarizado.
            </p>
          </div>

          <div className="space-y-8">
            <FormSection number="01" title="Representante">
              <FormInput
                label="NOMBRE COMPLETO DEL REPRESENTANTE"
                placeholder="Ej. Juan Pérez García"
                value={formData.nombreRepresentante}
                onChange={updateField("nombreRepresentante")}
              />
              <FormInput
                label="CÉDULA DEL REPRESENTANTE"
                placeholder="Ej. 1.098.765.432"
                value={formData.cedulaRepresentante}
                onChange={updateField("cedulaRepresentante")}
              />
              <FormInput
                label="CORREO ELECTRÓNICO DEL REPRESENTANTE"
                placeholder="Ej. representante@email.com"
                value={formData.correoRepresentante}
                onChange={updateField("correoRepresentante")}
                type="email"
              />
              <FormInput
                label="CIUDAD DE RESIDENCIA"
                placeholder="Ej. Bucaramanga"
                value={formData.ciudadRepresentante}
                onChange={updateField("ciudadRepresentante")}
              />
              <FormInput
                label="NÚMERO DE CELULAR"
                placeholder="Ej. 312 345 6789"
                value={formData.celularRepresentante}
                onChange={updateField("celularRepresentante")}
              />
            </FormSection>

            <FormSection number="02" title="Camper">
              <FormInput
                label="NOMBRE COMPLETO DEL CAMPER"
                placeholder="Ej. Carlos Ruiz Méndez"
                value={formData.nombreCamper}
                onChange={updateField("nombreCamper")}
              />
              <FormInput
                label="NÚMERO DE DOCUMENTO DEL CAMPER"
                placeholder="Ej. 1.005.123.456"
                value={formData.documentoCamper}
                onChange={updateField("documentoCamper")}
              />
              <FormInput
                label="CORREO ELECTRÓNICO DEL CAMPER"
                placeholder="Ej. camper@email.com"
                value={formData.correoCamper}
                onChange={updateField("correoCamper")}
                type="email"
              />
            </FormSection>
          </div>

          <button className="primary-button mt-8">
            <Save className="w-5 h-5" />
            <span>GUARDAR INFORMACIÓN</span>
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
