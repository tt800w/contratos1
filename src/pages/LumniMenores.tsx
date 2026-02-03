import { useState } from "react";
import Header from "@/components/Header";
import FormInput from "@/components/FormInput";
import FormSection from "@/components/FormSection";
import DocumentPreview from "@/components/DocumentPreview";
import { Save } from "lucide-react";

const LumniMenores = () => {
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
      <Header showBack subtitle="LUMNI MENORES" />

      <div className="flex">
        {/* Form Panel */}
        <div className="w-[400px] form-panel border-r border-border overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Lumni Menores de edad
            </h2>
            <p className="text-sm text-muted-foreground">
              Ingrese los datos para la automatización del documento.
            </p>
          </div>

          <div className="space-y-8">
            <FormSection number="01" title="Representante">
              <FormInput
                label="NOMBRE COMPLETO DEL REPRESENTANTE"
                placeholder="Nombre completo"
                value={formData.nombreRepresentante}
                onChange={updateField("nombreRepresentante")}
              />
              <FormInput
                label="CÉDULA DEL REPRESENTANTE"
                placeholder="Documento de identidad"
                value={formData.cedulaRepresentante}
                onChange={updateField("cedulaRepresentante")}
              />
              <FormInput
                label="CORREO ELECTRÓNICO"
                placeholder="correo@ejemplo.com"
                value={formData.correoRepresentante}
                onChange={updateField("correoRepresentante")}
                type="email"
              />
              <FormInput
                label="CIUDAD DE RESIDENCIA"
                placeholder="Ej. Bucaramanga, Santander"
                value={formData.ciudadRepresentante}
                onChange={updateField("ciudadRepresentante")}
              />
              <FormInput
                label="NÚMERO DE CELULAR"
                placeholder="Ej. 315 876 5432"
                value={formData.celularRepresentante}
                onChange={updateField("celularRepresentante")}
              />
            </FormSection>

            <FormSection number="02" title="Camper">
              <FormInput
                label="NOMBRE COMPLETO DEL CAMPER"
                placeholder="Ej. Juan Andrés Ruiz"
                value={formData.nombreCamper}
                onChange={updateField("nombreCamper")}
              />
              <FormInput
                label="NÚMERO DE DOCUMENTO DEL CAMPER"
                placeholder="Ej. 1.098.765.432"
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
              {formData.nombreCamper && <strong> {formData.nombreCamper}</strong>} y su representante legal 
              {formData.nombreRepresentante && <strong> {formData.nombreRepresentante}</strong>}, bajo los 
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
