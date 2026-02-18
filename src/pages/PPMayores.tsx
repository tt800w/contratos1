import { useState } from "react";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import { FileDown, Mail, FileText, FileSpreadsheet } from "lucide-react";
import DocxViewer from "@/components/DocxViewer";
import { generateContract, prepareUnifiedData, downloadAsPDF } from "@/utils/contractGenerator";
import { uploadToZapSign } from "@/utils/zapSignService";
import { toast } from "sonner";
import { parseExcel, CamperData } from "@/utils/excelParser";

const PPMayores = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState("");
    // Campos del contrato
    const [pagare, setPagare] = useState("");
    const [fechaContrato, setFechaContrato] = useState("");

    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

    const selectedUserData = users.find((u) => u.id === selectedUser);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await parseExcel(file);
            const mappedUsers = data.map((item, index) => ({
                id: index.toString(),
                name: item.nombreCamper,
                representative: {
                    name: item.nombreRepresentante,
                    cedula: item.cedulaRepresentante,
                    email: item.emailRepresentante,
                    phone: "N/A"
                },
                raw: item
            }));

            setUsers(mappedUsers);
            toast.success(`Se cargaron ${mappedUsers.length} campers correctamente`);
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar el archivo Excel");
        }
    };

    const handePreview = async () => {
        if (!selectedUser || !selectedUserData) {
            toast.error("Por favor seleccione un camper");
            return;
        }

        try {
            const raw = selectedUserData.raw as CamperData;

            const data = prepareUnifiedData(raw, {
                pagare,
                fechaContrato,
                isPP: true
            });

            const blob = await generateContract(
                "/contratos/Condiciones Específicas-Pronto Pago Mayor de Edad.docx",
                data,
                "preview.docx",
                true
            );
            if (blob instanceof Blob) {
                setPreviewBlob(blob);
                toast.success("Vista previa actualizada");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(`Error al generar vista previa: ${error.message || "Error desconocido"}`);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header showBack />

            <div className="flex h-[calc(100vh-65px)]">
                <div className="w-[400px] form-panel border-r border-border overflow-y-auto flex flex-col">
                    <div className="flex-1">
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Pronto Pago Mayores
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Cargue el archivo Excel y seleccione el perfil para generar el contrato.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors text-center">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="excel-upload"
                                />
                                <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                                    <span className="text-sm font-medium">Cargar Excel de Campers</span>
                                </label>
                            </div>

                            {users.length > 0 && (
                                <div>
                                    <label className="block text-[10px] font-bold text-foreground mb-1 tracking-wider uppercase">
                                        Camper ({users.length})
                                    </label>
                                    <UserSelector
                                        value={selectedUser}
                                        onChange={setSelectedUser}
                                        users={users}
                                    />
                                    {selectedUserData && (
                                        <div className="mt-1 text-[10px] text-muted-foreground bg-secondary/30 p-2 rounded">
                                            <p><strong>Cédula:</strong> {selectedUserData.raw.documentoCamper}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-foreground mb-1 tracking-wider uppercase">
                                        Pagaré
                                    </label>
                                    <input
                                        type="text"
                                        value={pagare}
                                        onChange={(e) => setPagare(e.target.value)}
                                        className="w-full p-2 text-sm rounded-md border border-input bg-background"
                                        placeholder="#"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-foreground mb-1 tracking-wider uppercase">
                                        Fecha
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaContrato}
                                        onChange={(e) => setFechaContrato(e.target.value)}
                                        className="w-full p-2 text-sm rounded-md border border-input bg-background"
                                    />
                                </div>
                            </div>

                        </div>

                        <button
                            className="secondary-button mt-6 w-full p-2.5 rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
                            onClick={handePreview}
                            disabled={!selectedUser}
                        >
                            <FileText className="w-4 h-4" />
                            <span>ACTUALIZAR VISTA PREVIA</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                                className="primary-button flex items-center justify-center gap-2 p-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs font-bold"
                                onClick={async () => {
                                    if (!selectedUser || !selectedUserData) {
                                        toast.error("Seleccione un usuario");
                                        return;
                                    }
                                    try {
                                        const raw = selectedUserData.raw as CamperData;
                                        const data = prepareUnifiedData(raw, { pagare, fechaContrato, isPP: true });

                                        await generateContract(
                                            "/contratos/Condiciones Específicas-Pronto Pago Mayor de Edad.docx",
                                            data,
                                            `Contrato_PP_Mayores_${raw.nombreCamper.replace(/\s+/g, '_')}.docx`
                                        );

                                        toast.success("Archivo Word generado");
                                    } catch (error: any) {
                                        toast.error(`Error: ${error.message}`);
                                    }
                                }}
                                disabled={!selectedUser}
                            >
                                <FileDown className="w-4 h-4" />
                                <span>WORD</span>
                            </button>

                            <button
                                className="primary-button flex items-center justify-center gap-2 p-2.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 text-xs font-bold"
                                onClick={async () => {
                                    if (!selectedUser || !selectedUserData) {
                                        toast.error("Seleccione un usuario");
                                        return;
                                    }
                                    const raw = selectedUserData.raw as CamperData;
                                    const fileName = `Contrato_PP_Mayores_${raw.nombreCamper.replace(/\s+/g, '_')}.pdf`;

                                    toast.promise(downloadAsPDF("docx-reader-container", fileName), {
                                        loading: 'Generando PDF...',
                                        success: 'PDF descargado correctamente',
                                        error: (err) => `Error al generar PDF: ${err.message}`
                                    });
                                }}
                                disabled={!selectedUser}
                            >
                                <FileDown className="w-4 h-4" />
                                <span>PDF</span>
                            </button>
                        </div>

                        <div className="mt-2">
                            <button
                                className="secondary-button flex items-center justify-center gap-2 w-full p-2.5 rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 text-sm font-bold"
                                disabled={!selectedUser}
                                onClick={async () => {
                                    const raw = selectedUserData.raw as CamperData;
                                    const data = prepareUnifiedData(raw, { pagare, fechaContrato, isPP: true });

                                    toast.promise(async () => {
                                        const blob = await generateContract(
                                            "/contratos/Condiciones Específicas-Pronto Pago Mayor de Edad.docx",
                                            data,
                                            "contrato.docx",
                                            true
                                        );

                                        const url = await uploadToZapSign(blob as Blob, `Contrato_PP_Mayor_${raw.nombreCamper}.docx`);
                                        window.open(url, '_blank');
                                    }, {
                                        loading: 'Subiendo...',
                                        success: 'Enviado a ZapSign',
                                        error: (err) => `Error: ${err.message}`
                                    });
                                }}
                            >
                                <Mail className="w-4 h-4" />
                                <span>ZAPSIGN</span>
                            </button>
                        </div>
                    </div>
                </div>

                <DocxViewer
                    url="/contratos/Condiciones Específicas-Pronto Pago Mayor de Edad.docx"
                    blob={previewBlob}
                />
            </div>
        </div>
    );
};

export default PPMayores;
