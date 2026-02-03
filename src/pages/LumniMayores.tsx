import { useState } from "react";
import Header from "@/components/Header";
import FormInput from "@/components/FormInput";
import DocumentPreview from "@/components/DocumentPreview";
import { Save } from "lucide-react";

const LumniMayores = () => {
  const [formData, setFormData] = useState({
    nombreCamper: "",
    cedula: "",
    direccion: "",
    correo: "",
    celular: "",
    ciudad: "",
  });

  const updateField = (field: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showBack subtitle="LUMNI MAYORES" />

      <div className="flex">
        {/* Form Panel */}
        <div className="w-[400px] form-panel border-r border-border overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Lumni Mayores de edad
            </h2>
            <p className="text-sm text-muted-foreground">
              Complete los campos para actualizar el documento en tiempo real.
            </p>
          </div>

          <div className="space-y-4">
            <FormInput
              label="NOMBRE COMPLETO DEL CAMPER"
              placeholder="Ej. Juan Pérez García"
              value={formData.nombreCamper}
              onChange={updateField("nombreCamper")}
            />
            <FormInput
              label="NÚMERO DE CÉDULA"
              placeholder="Ej. 1.098.765.432"
              value={formData.cedula}
              onChange={updateField("cedula")}
            />
            <FormInput
              label="DIRECCIÓN DE RESIDENCIA"
              placeholder="Ej. Calle 200 # 12-34"
              value={formData.direccion}
              onChange={updateField("direccion")}
            />
            <FormInput
              label="CORREO ELECTRÓNICO"
              placeholder="Ej. camper@campuslands.com"
              value={formData.correo}
              onChange={updateField("correo")}
              type="email"
            />
            <FormInput
              label="NÚMERO DE CELULAR"
              placeholder="Ej. 312 345 6789"
              value={formData.celular}
              onChange={updateField("celular")}
            />
            <FormInput
              label="CIUDAD DE RESIDENCIA"
              placeholder="Ej. Bucaramanga"
              value={formData.ciudad}
              onChange={updateField("ciudad")}
            />
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
              LUMNI MAYORES DE EDAD
            </h1>
            <div className="w-12 h-0.5 bg-document-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground tracking-wider">
              DOCUMENTO OFICIAL CAMPUSLANDS X LUMNI
            </p>
          </div>

          <div className="text-sm leading-relaxed text-document-foreground space-y-6">
            <p className="text-justify">
              El presente acuerdo se celebra entre la institución educativa y el estudiante 
              {formData.nombreCamper && <strong> {formData.nombreCamper}</strong>} arriba mencionado, 
              bajo los términos del programa de financiación Lumni para mayores de edad. El Camper acepta 
              irrevocablemente las condiciones establecidas para su formación técnica y profesional.
            </p>

            <div>
              <h3 className="font-bold text-sm mb-2">I. OBJETO DEL CONTRATO</h3>
              <p className="text-justify">
                El presente documento tiene como finalidad formalizar la vinculación del Camper al programa de 
                formación avanzada, garantizando el cumplimiento de los estándares de calidad y compromiso 
                exigidos por ambas partes en el marco del desarrollo de talento tecnológico.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-2">II. OBLIGACIONES Y COMPROMISOS</h3>
              <p className="text-justify">
                El estudiante se compromete a asistir al 100% de las sesiones programadas, cumplir con los 
                retos técnicos asignados y mantener un promedio de desempeño óptimo. Lumni proveerá el 
                soporte financiero detallado en los anexos técnicos adjuntos a este contrato.
              </p>
            </div>

            <div className="flex justify-between pt-12 mt-12 border-t border-gray-300">
              <div className="text-center">
                <div className="w-40 border-t border-gray-400 pt-2">
                  <p className="text-xs font-semibold tracking-wider">REPRESENTANTE LEGAL</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-40 border-t border-gray-400 pt-2">
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">FIRMA DEL CAMPER</p>
                </div>
              </div>
            </div>
          </div>
        </DocumentPreview>
      </div>
    </div>
  );
};

export default LumniMayores;
