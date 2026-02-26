import { useState } from "react";
import { FileDown, Mail, FileText } from "lucide-react";
import { generateContract, prepareUnifiedData, downloadAsPDF } from "@/utils/contractGenerator";
import { uploadToZapSign } from "@/utils/zapSignService";
import { toast } from "sonner";
import { CamperData } from "@/utils/excelParser";
import { useCamperData } from "@/hooks/useCamperData";
import ContractLayout from "@/components/ContractLayout";
import { ContractField, FileNameField } from "@/components/CommonFields";

const LumniMayores = () => {
  const { users, selectedUser, setSelectedUser, selectedUserData, handleFileUpload } = useCamperData();

  // Campos específicos
  const [pagare, setPagare] = useState("");
  const [fechaContrato, setFechaContrato] = useState("");
  const [customFileName, setCustomFileName] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const validateAndPrepare = () => {
    if (!selectedUser || !selectedUserData) {
      toast.error("Por favor seleccione un camper");
      return null;
    }
    return prepareUnifiedData(selectedUserData.raw as CamperData, { pagare, fechaContrato });
  };

  const handlePreview = async () => {
    const data = validateAndPrepare();
    if (!data) return;

    try {
      const blob = await generateContract(
        "/contratos/Condiciones Específicas-Financiación Lumni- Mayor de Edad.docx",
        data, "preview.docx", true
      );
      if (blob instanceof Blob) setPreviewBlob(blob);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <ContractLayout
      title="Lumni Mayores de edad"
      description="Cargue el Excel y genere el contrato de financiación Lumni para mayores."
      users={users}
      selectedUser={selectedUser}
      onUserSelect={setSelectedUser}
      onFileUpload={handleFileUpload}
      previewBlob={previewBlob}
      templateUrl="/contratos/Condiciones Específicas-Financiación Lumni- Mayor de Edad.docx"
    >
      <div className="grid grid-cols-2 gap-3">
        <ContractField label="Pagaré" value={pagare} onChange={setPagare} placeholder="#" />
        <ContractField label="Fecha" value={fechaContrato} onChange={setFechaContrato} type="date" />
      </div>

      <FileNameField value={customFileName} onChange={setCustomFileName} />

      <button className="secondary-button mt-4 w-full p-2.5 rounded-md border border-primary text-primary hover:bg-primary/10 flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
        onClick={handlePreview} disabled={!selectedUser}>
        <FileText className="w-4 h-4" /> ACTUALIZAR VISTA PREVIA
      </button>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button className="primary-button flex items-center justify-center gap-2 p-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs font-bold"
          onClick={async () => {
            const data = validateAndPrepare();
            if (!data) return;
            const nameToUse = customFileName ? (customFileName.toLowerCase().endsWith('.docx') ? customFileName : `${customFileName}.docx`) : `Contrato_Lumni_Mayores_${selectedUserData.name.replace(/\s+/g, '_')}.docx`;
            await generateContract("/contratos/Condiciones Específicas-Financiación Lumni- Mayor de Edad.docx", data, nameToUse);
            toast.success("Archivo Word generado");
          }} disabled={!selectedUser}>
          <FileDown className="w-4 h-4" /> WORD
        </button>
        <button className="primary-button flex items-center justify-center gap-2 p-2.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 text-xs font-bold"
          onClick={() => {
            const data = validateAndPrepare();
            if (!data) return;
            const nameToUse = customFileName ? (customFileName.toLowerCase().endsWith('.pdf') ? customFileName : `${customFileName}.pdf`) : `Contrato_Lumni_Mayores_${selectedUserData.name.replace(/\s+/g, '_')}.pdf`;
            toast.promise(downloadAsPDF("docx-reader-container", nameToUse), { loading: 'Generando PDF...', success: 'PDF descargado', error: 'Error al generar PDF' });
          }} disabled={!selectedUser}>
          <FileDown className="w-4 h-4" /> PDF
        </button>
      </div>

      <button className="secondary-button mt-2 flex items-center justify-center gap-2 w-full p-2.5 rounded-md border border-primary text-primary hover:bg-primary/10 text-sm font-bold"
        onClick={async () => {
          const data = validateAndPrepare();
          if (!data) return;
          const nameToUse = customFileName ? (customFileName.toLowerCase().endsWith('.docx') ? customFileName : `${customFileName}.docx`) : `Contrato_Lumni_Mayor_${selectedUserData.name}.docx`;
          toast.promise(async () => {
            const blob = await generateContract("/contratos/Condiciones Específicas-Financiación Lumni- Mayor de Edad.docx", data, "contrato.docx", true);
            const url = await uploadToZapSign(blob as Blob, nameToUse);
            window.open(url, '_blank');
          }, { loading: 'Enviando a ZapSign...', success: 'Enlace de firma abierto', error: 'Error al subir a ZapSign' });
        }} disabled={!selectedUser}>
        <Mail className="w-4 h-4" /> ENVIAR A ZAPSIGN
      </button>
    </ContractLayout>
  );
};

export default LumniMayores;
