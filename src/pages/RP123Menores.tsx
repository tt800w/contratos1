import { useState } from "react";
import Header from "@/components/Header";
import FormInput from "@/components/FormInput";
import FormSection from "@/components/FormSection";
import DocumentPreview from "@/components/DocumentPreview";
import { Save } from "lucide-react";

const RP123Menores = () => {
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
      <Header showBack subtitle="RP 123 MENORES" />

      <div className="flex">
        {/* Form Panel */}
        <div className="w-[400px] form-panel border-r border-border overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-2">
              RP 123 Menores
            </h2>
            <p className="text-sm text-muted-foreground">
              EDITOR DE CONTRATO ESTANDARIZADO
            </p>
          </div>

          <div className="space-y-8">
            <FormSection number="01" title="Representante">
              <FormInput
                label="NOMBRE COMPLETO DEL REPRESENTANTE"
                placeholder="Ana María Rodríguez"
                value={formData.nombreRepresentante}
                onChange={updateField("nombreRepresentante")}
              />
              <FormInput
                label="CÉDULA DEL REPRESENTANTE"
                placeholder="1.098.765.432"
                value={formData.cedulaRepresentante}
                onChange={updateField("cedulaRepresentante")}
              />
              <FormInput
                label="CORREO ELECTRÓNICO"
                placeholder="representante@campuslands.com"
                value={formData.correoRepresentante}
                onChange={updateField("correoRepresentante")}
                type="email"
              />
              <FormInput
                label="CIUDAD DE RESIDENCIA"
                placeholder="Bucaramanga"
                value={formData.ciudadRepresentante}
                onChange={updateField("ciudadRepresentante")}
              />
              <FormInput
                label="NÚMERO DE CELULAR"
                placeholder="+57 312 345 6789"
                value={formData.celularRepresentante}
                onChange={updateField("celularRepresentante")}
              />
            </FormSection>

            <FormSection number="02" title="Camper">
              <FormInput
                label="NOMBRE COMPLETO DEL CAMPER"
                placeholder="Juan David Rodríguez"
                value={formData.nombreCamper}
                onChange={updateField("nombreCamper")}
              />
              <FormInput
                label="NÚMERO DE DOCUMENTO"
                placeholder="1.102.345.678"
                value={formData.documentoCamper}
                onChange={updateField("documentoCamper")}
              />
              <FormInput
                label="CORREO ELECTRÓNICO DEL CAMPER"
                placeholder="camper@campuslands.com"
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
                  <p className="text-muted-foreground mb-1">REPRESENTANTE LEGAL</p>
                  <p className="text-primary">{formData.nombreRepresentante || "Nombre del representante..."}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">IDENTIFICACIÓN CAMPER</p>
                  <p className="text-primary">{formData.documentoCamper || "Documento del camper..."}</p>
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

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-document-foreground text-white text-xs px-2 py-1 rounded">03</span>
                <h3 className="font-bold text-sm">COMPROMISOS FINANCIEROS</h3>
              </div>
              <p className="text-justify">
                Se establece un plan de pagos preferencial basado en la clasificación socioeconómica 
                reportada. El incumplimiento en las fechas pactadas podrá acarrear la suspensión temporal 
                del acceso a los recursos educativos de la plataforma.
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
                  <p className="text-xs text-muted-foreground">CÉDULA DE CIUDADANÍA</p>
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
