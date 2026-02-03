import { useState } from "react";
import Header from "@/components/Header";
import FormInput from "@/components/FormInput";
import DocumentPreview from "@/components/DocumentPreview";
import { Save } from "lucide-react";

const RP56Mayores = () => {
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
      <Header showBack subtitle="RP 56 MAYORES" />

      <div className="flex">
        {/* Form Panel */}
        <div className="w-[400px] form-panel border-r border-border overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-2">
              RECURSOS PROPIOS 56 MAYORES
            </h2>
            <p className="text-sm text-muted-foreground">
              Ingrese la información requerida para el contrato.
            </p>
          </div>

          <div className="space-y-4">
            <FormInput
              label="NOMBRE COMPLETO DEL CAMPER"
              placeholder="Juan Sebastián Rodríguez"
              value={formData.nombreCamper}
              onChange={updateField("nombreCamper")}
            />
            <FormInput
              label="NÚMERO DE CÉDULA"
              placeholder="1.098.765.432"
              value={formData.cedula}
              onChange={updateField("cedula")}
            />
            <FormInput
              label="DIRECCIÓN DE RESIDENCIA"
              placeholder="Calle 45 # 12-34, Bucaramanga"
              value={formData.direccion}
              onChange={updateField("direccion")}
            />
            <FormInput
              label="CORREO ELECTRÓNICO"
              placeholder="juan.rodriguez@example.com"
              value={formData.correo}
              onChange={updateField("correo")}
              type="email"
            />
            <FormInput
              label="NÚMERO DE CELULAR"
              placeholder="315 789 4562"
              value={formData.celular}
              onChange={updateField("celular")}
            />
            <FormInput
              label="CIUDAD DE RESIDENCIA"
              placeholder="Bucaramanga"
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
        <DocumentPreview title="VISTA PREVIA">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-document-foreground mb-2">
              RECURSOS PROPIOS ESTRATOS 5 Y 6 MAYORES DE EDAD
            </h1>
            <div className="w-16 h-0.5 bg-document-foreground mx-auto mb-3" />
          </div>

          <div className="text-sm leading-relaxed text-document-foreground space-y-6">
            <p className="text-justify">
              En la ciudad de <strong>{formData.ciudad || "Bucaramanga"}</strong>, se celebra el presente 
              contrato de servicios educativos entre <strong>CAMPUSLANDS</strong> y el camper{" "}
              <strong>{formData.nombreCamper || "JUAN SEBASTIÁN RODRÍGUEZ"}</strong> identificado con cédula 
              de ciudadanía No. <strong>{formData.cedula || "1.098.765.432"}</strong>, residente en la 
              dirección <strong>{formData.direccion || "CALLE 45 # 12-34"}</strong>,{" "}
              <strong>{formData.ciudad?.toUpperCase() || "BUCARAMANGA"}</strong>.
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
                estándares de excelencia exigidos por la institución. El correo electrónico{" "}
                <strong>{formData.correo || "juan.rodriguez@example.com"}</strong> y el celular{" "}
                <strong>{formData.celular || "315 789 4562"}</strong> serán los medios oficiales de comunicación.
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
                  <p className="text-xs text-muted-foreground">C.C. {formData.cedula || "1.098.765.432"}</p>
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
