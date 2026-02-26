import { useState } from "react";
import { FileDown, Mail, FileText } from "lucide-react";
import { generateContract, prepareUnifiedData, downloadAsPDF } from "@/utils/contractGenerator";
import { uploadToZapSign } from "@/utils/zapSignService";
import { toast } from "sonner";
import { CamperData } from "@/utils/excelParser";
import { useCamperData } from "@/hooks/useCamperData";
import { validateMonths, validateChronology } from "@/utils/validation";
import ContractLayout from "@/components/ContractLayout";
import { ContractField, FileNameField } from "@/components/CommonFields";

const RPMenores = () => {
    const { users, selectedUser, setSelectedUser, selectedUserData, handleFileUpload } = useCamperData();

    // Campos específicos
    const [pagare, setPagare] = useState("");
    const [fechaContrato, setFechaContrato] = useState("");
    const [cuotas, setCuotas] = useState("1");
    const [modoPago, setModoPago] = useState<'auto' | 'manual'>('auto');
    const [manualCuotas, setManualCuotas] = useState<number[]>([13000000]);
    const [fechasCuotas, setFechasCuotas] = useState<string[]>([""]);
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
    const [customFileName, setCustomFileName] = useState("");

    const TOTAL_OBJETIVO = 13000000;
    const sumaManual = manualCuotas.reduce((acc, val) => acc + (val || 0), 0);

    const handleNumCuotasChange = (val: string) => {
        setCuotas(val);
        const n = parseInt(val) || 1;
        const newFechas = [...fechasCuotas];
        while (newFechas.length < n) newFechas.push("");
        if (newFechas.length > n) newFechas.length = n;
        setFechasCuotas(newFechas);

        if (modoPago === 'manual') {
            const newCuotas = [...manualCuotas];
            while (newCuotas.length < n) newCuotas.push(0);
            if (newCuotas.length > n) newCuotas.length = n;
            setManualCuotas(newCuotas);
        }
    };

    const validateAndPrepare = () => {
        if (!selectedUser || !selectedUserData) {
            toast.error("Por favor seleccione un camper");
            return null;
        }
        if (modoPago === 'manual' && sumaManual !== TOTAL_OBJETIVO) {
            toast.error(`La suma total de las cuotas debe ser ${TOTAL_OBJETIVO.toLocaleString()}`);
            return null;
        }
        if (!validateMonths(fechasCuotas) || !validateChronology(fechasCuotas)) {
            toast.error("Verifique que las fechas sean de meses distintos y sigan un orden cronológico");
            return null;
        }
        return prepareUnifiedData(selectedUserData.raw as CamperData, {
            pagare, fechaContrato, cuotas, modoPago, manualCuotas, fechasCuotas, isRP: true
        });
    };

    const handlePreview = async () => {
        const data = validateAndPrepare();
        if (!data) return;

        try {
            const blob = await generateContract(
                "/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx",
                data, "preview.docx", true
            );
            if (blob instanceof Blob) setPreviewBlob(blob);
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        }
    };

    return (
        <ContractLayout
            title="Recursos Propios Menores"
            description="Cargue el Excel y genere el contrato de recursos propios para menores."
            users={users}
            selectedUser={selectedUser}
            onUserSelect={setSelectedUser}
            onFileUpload={handleFileUpload}
            previewBlob={previewBlob}
            templateUrl="/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx"
        >
            <div className="grid grid-cols-2 gap-3">
                <ContractField label="Pagaré" value={pagare} onChange={setPagare} placeholder="#" />
                <ContractField label="Fecha" value={fechaContrato} onChange={setFechaContrato} type="date" />
            </div>

            {/* Plan de Pagos */}
            <div className="p-3 bg-secondary/20 rounded-lg border border-border">
                <label className="section-label mb-2 block">PLAN DE PAGOS (Total 13M)</label>
                <div className="flex gap-2 p-1 bg-background/50 rounded-md mb-3">
                    <button
                        className={`flex-1 py-1 px-3 rounded-md text-[10px] font-bold transition-all ${modoPago === 'auto' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                        onClick={() => setModoPago('auto')}
                    >AUTOMÁTICO</button>
                    <button
                        className={`flex-1 py-1 px-3 rounded-md text-[10px] font-bold transition-all ${modoPago === 'manual' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                        onClick={() => setModoPago('manual')}
                    >MANUAL</button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="section-label mb-1 block">Número de Cuotas</label>
                        <select
                            value={cuotas}
                            onChange={(e) => handleNumCuotasChange(e.target.value)}
                            className="w-full p-2 text-sm rounded-md border border-input bg-background"
                        >
                            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n.toString()}>{n} {n === 1 ? 'Cuota' : 'Cuotas'}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {Array.from({ length: parseInt(cuotas) || 1 }).map((_, i) => (
                            <div key={i} className="flex gap-2 items-end bg-background/40 p-2 rounded border border-border/50">
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold uppercase text-muted-foreground mb-1 block">Cuota {i + 1}</label>
                                    <input
                                        type="number"
                                        value={modoPago === 'manual' ? manualCuotas[i] : ""}
                                        disabled={modoPago === 'auto'}
                                        onChange={(e) => {
                                            const newC = [...manualCuotas];
                                            newC[i] = parseInt(e.target.value) || 0;
                                            setManualCuotas(newC);
                                        }}
                                        className="w-full p-1.5 text-xs rounded border border-input bg-background/50 disabled:opacity-50"
                                        placeholder={modoPago === 'auto' ? "Automático" : "0"}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold uppercase text-muted-foreground mb-1 block">Vencimiento</label>
                                    <input
                                        type="date"
                                        value={fechasCuotas[i] || ""}
                                        onChange={(e) => {
                                            const newF = [...fechasCuotas];
                                            newF[i] = e.target.value;
                                            setFechasCuotas(newF);
                                        }}
                                        className="w-full p-1.5 text-xs rounded border border-input bg-background/50"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
                        const nameToUse = customFileName ? (customFileName.toLowerCase().endsWith('.docx') ? customFileName : `${customFileName}.docx`) : `Contrato_RP_Menores_${selectedUserData.name.replace(/\s+/g, '_')}.docx`;
                        await generateContract("/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx", data, nameToUse);
                        toast.success("Archivo Word generado");
                    }} disabled={!selectedUser}>
                    <FileDown className="w-4 h-4" /> WORD
                </button>
                <button className="primary-button flex items-center justify-center gap-2 p-2.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 text-xs font-bold"
                    onClick={() => {
                        const data = validateAndPrepare();
                        if (!data) return;
                        const nameToUse = customFileName ? (customFileName.toLowerCase().endsWith('.pdf') ? customFileName : `${customFileName}.pdf`) : `Contrato_RP_Menores_${selectedUserData.name.replace(/\s+/g, '_')}.pdf`;
                        toast.promise(downloadAsPDF("docx-reader-container", nameToUse), { loading: 'Generando PDF...', success: 'PDF descargado', error: 'Error al generar PDF' });
                    }} disabled={!selectedUser}>
                    <FileDown className="w-4 h-4" /> PDF
                </button>
            </div>

            <button className="secondary-button mt-2 flex items-center justify-center gap-2 w-full p-2.5 rounded-md border border-primary text-primary hover:bg-primary/10 text-sm font-bold"
                onClick={async () => {
                    const data = validateAndPrepare();
                    if (!data) return;
                    const nameToUse = customFileName ? (customFileName.toLowerCase().endsWith('.docx') ? customFileName : `${customFileName}.docx`) : `Contrato_RP_Menor_${selectedUserData.name}.docx`;
                    toast.promise(async () => {
                        const blob = await generateContract("/contratos/Condiciones Específicas-Recursos Propios Menor de Edad.docx", data, "contrato.docx", true);
                        const url = await uploadToZapSign(blob as Blob, nameToUse);
                        window.open(url, '_blank');
                    }, { loading: 'Enviando a ZapSign...', success: 'Enlace de firma abierto', error: 'Error al subir a ZapSign' });
                }} disabled={!selectedUser}>
                <Mail className="w-4 h-4" /> ENVIAR A ZAPSIGN
            </button>
        </ContractLayout>
    );
};

export default RPMenores;
