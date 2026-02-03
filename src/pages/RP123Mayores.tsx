import { useState } from "react";
import Header from "@/components/Header";
import FormInput from "@/components/FormInput";
import DocumentPreview from "@/components/DocumentPreview";
import { Save } from "lucide-react";

const RP123Mayores = () => {
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
      <Header showBack subtitle="RP 123 MAYORES" />

      <div className="flex">
        {/* Form Panel */}
        <div className="w-[400px] form-panel border-r border-border overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-2">
              RECURSOS PROPIOS ESTRATOS 1,2,3 MAYORES DE EDAD
            </h2>
          </div>

          <div className="space-y-4">
            <FormInput
              label="NOMBRE COMPLETO DEL CAMPER"
              placeholder="Daniel Alejandro Rodríguez"
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
              placeholder="Calle 200 # 12-34"
              value={formData.direccion}
              onChange={updateField("direccion")}
            />
            <FormInput
              label="CORREO ELECTRÓNICO"
              placeholder="daniel.rodriguez@gmail.com"
              value={formData.correo}
              onChange={updateField("correo")}
              type="email"
            />
            <FormInput
              label="NÚMERO DE CELULAR"
              placeholder="315 123 4567"
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
        <DocumentPreview title="VISTA PREVIA EN TIEMPO REAL">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-document-foreground mb-2">
              RECURSOS PROPIOS ESTRATOS 1,2,3 MAYORES DE EDAD
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
              <strong>{formData.nombreCamper || "[Nombre del estudiante]"}</strong>, identificado con 
              cédula de ciudadanía <strong>{formData.cedula || "[Número de documento]"}</strong>.
            </p>

            <p className="text-justify">
              El beneficiario declara bajo la gravedad de juramento que reside en la ciudad de{" "}
              <strong>{formData.ciudad || "[Ciudad]"}</strong>, en la dirección{" "}
              <strong>{formData.direccion || "[Dirección]"}</strong>, y que pertenece a los estratos 
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

            <div>
              <h3 className="font-bold text-sm mb-2">CLÁUSULA TERCERA - COMUNICACIÓN:</h3>
              <p className="text-justify">
                Para efectos de notificaciones, el beneficiario autoriza el uso de su correo electrónico{" "}
                <strong>{formData.correo || "[correo@ejemplo.com]"}</strong> y su número de contacto{" "}
                <strong>{formData.celular || "[Número celular]"}</strong>.
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
                  <p className="text-xs text-muted-foreground">C.C. {formData.cedula || "_____________"}</p>
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
