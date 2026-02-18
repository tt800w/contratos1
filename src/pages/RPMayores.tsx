import { useState } from "react";
import Header from "@/components/Header";
import UserSelector from "@/components/UserSelector";
import { FileDown, Mail, FileText, FileSpreadsheet } from "lucide-react";
import DocxViewer from "@/components/DocxViewer";
import { generateContract, prepareUnifiedData, downloadAsPDF } from "@/utils/contractGenerator";
import { uploadToZapSign } from "@/utils/zapSignService";
import { toast } from "sonner";
import { parseExcel, CamperData } from "@/utils/excelParser";

const RPMayores = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState("");
    // Campos del contrato
    const [pagare, setPagare] = useState("");
    const [fechaContrato, setFechaContrato] = useState("");
    const [cuotas, setCuotas] = useState("1");
    const [modoPago, setModoPago] = useState<'auto' | 'manual'>('auto');
    const [manualCuotas, setManualCuotas] = useState<number[]>([13000000]);
    const [fechasCuotas, setFechasCuotas] = useState<string[]>([""]);

    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

    const selectedUserData = users.find((u) => u.id === selectedUser);

    const TOTAL_OBJETIVO = 13000000;
    const sumaManual = manualCuotas.reduce((acc, val) => acc + (val || 0), 0);

    const handleNumCuotasChange = (val: string) => {
        setCuotas(val);
        const n = parseInt(val) || 1;

        // Sincronizar fechasCuotas
        const newFechas = [...fechasCuotas];
        if (n > newFechas.length) {
            for (let i = newFechas.length; i < n; i++) newFechas.push("");
        } else if (n < newFechas.length) {
            newFechas.length = n;
        }
        setFechasCuotas(newFechas);

        if (modoPago === 'manual') {
            const newCuotas = [...manualCuotas];
            if (n > newCuotas.length) {
                // Agregar nuevas cuotas (valor 0 por defecto)
                for (let i = newCuotas.length; i < n; i++) {
                    newCuotas.push(0);
                }
            } else if (n < newCuotas.length) {
                // Eliminar cuotas sobrantes
                newCuotas.length = n;
            }
            setManualCuotas(newCuotas);
        }
    };

    const handleManualValueChange = (index: number, value: string) => {
        const newCuotas = [...manualCuotas];
        newCuotas[index] = parseInt(value) || 0;
        setManualCuotas(newCuotas);
    };

    const handleFechaChange = (index: number, value: string) => {
        const newFechas = [...fechasCuotas];
        newFechas[index] = value;
        setFechasCuotas(newFechas);
    };

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

        if (modoPago === 'manual' && sumaManual !== TOTAL_OBJETIVO) {
            toast.error(`La suma total de las cuotas debe ser exactamente ${TOTAL_OBJETIVO.toLocaleString()}. Actualmente: ${sumaManual.toLocaleString()}`);
            return;
        }

        try {
            const raw = selectedUserData.raw as CamperData;

            const data = prepareUnifiedData(raw, {
                pagare,
                fechaContrato,
                cuotas,
                modoPago,
                manualCuotas,
                fechasCuotas,
                isRP: true
            });

            const blob = await generateContract(
                "/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx",
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
                {/* Form Panel */}
                <div className="w-[400px] form-panel border-r border-border overflow-y-auto flex flex-col">
                    <div className="flex-1">
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Recursos Propios Mayores
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Cargue el archivo Excel y seleccione el perfil para generar el contrato.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Excel Upload */}
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
                                            <p><strong>Email:</strong> {selectedUserData.raw.emailRepresentante}</p>
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

                            {/* Plan de Pagos */}
                            <div className="p-3 bg-secondary/20 rounded-lg border border-border">
                                <label className="block text-[10px] font-bold text-foreground mb-2 tracking-wider uppercase">
                                    PLAN DE PAGOS (Total 13M)
                                </label>

                                <div className="flex gap-2 mb-3">
                                    <button
                                        className={`flex-1 py-1.5 text-xs rounded border ${modoPago === 'auto' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input'}`}
                                        onClick={() => setModoPago('auto')}
                                    >
                                        Automático
                                    </button>
                                    <button
                                        className={`flex-1 py-1.5 text-xs rounded border ${modoPago === 'manual' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input'}`}
                                        onClick={() => {
                                            setModoPago('manual');
                                            if (manualCuotas.length !== parseInt(cuotas)) {
                                                const n = parseInt(cuotas) || 1;
                                                const v = Math.floor(TOTAL_OBJETIVO / n);
                                                const arr = Array(n).fill(v);
                                                arr[n - 1] = TOTAL_OBJETIVO - (v * (n - 1));
                                                setManualCuotas(arr);
                                            }
                                        }}
                                    >
                                        Manual
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] text-muted-foreground mb-1 uppercase">Cant. Cuotas</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={cuotas}
                                            onChange={(e) => handleNumCuotasChange(e.target.value)}
                                            className="w-full p-2 text-sm rounded-md border border-input bg-background"
                                        />
                                    </div>

                                    {modoPago === 'auto' && (
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                            <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold text-center">Definir fechas de cuotas</p>
                                            {fechasCuotas.map((fecha, idx) => (
                                                <div key={idx} className="flex flex-col gap-1 p-2 border border-border rounded bg-muted/10">
                                                    <label className="text-[8px] text-muted-foreground uppercase">{idx === 0 ? 'CUOTA 1 (Firma)' : `CUOTA ${idx + 1}`}</label>
                                                    <input
                                                        type="date"
                                                        value={fecha}
                                                        onChange={(e) => handleFechaChange(idx, e.target.value)}
                                                        className="w-full p-1.5 text-xs rounded border border-input bg-background"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {modoPago === 'manual' && (
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                            {manualCuotas.map((valor, idx) => (
                                                <div key={idx} className="p-2 border border-border rounded bg-muted/30 space-y-2">
                                                    <label className="text-[9px] font-bold text-muted-foreground uppercase">{idx === 0 ? 'CUOTA 1 (Firma)' : `CUOTA ${idx + 1}`}</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[8px] text-muted-foreground uppercase">Valor</label>
                                                            <input
                                                                type="number"
                                                                value={valor}
                                                                onChange={(e) => handleManualValueChange(idx, e.target.value)}
                                                                className="w-full p-1.5 text-xs rounded border border-input bg-background"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] text-muted-foreground uppercase">Fecha</label>
                                                            <input
                                                                type="date"
                                                                value={fechasCuotas[idx] || ""}
                                                                onChange={(e) => handleFechaChange(idx, e.target.value)}
                                                                className="w-full p-1.5 text-xs rounded border border-input bg-background"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {modoPago === 'manual' && (
                                        <div className={`text-center p-2 rounded text-xs font-bold ${sumaManual === TOTAL_OBJETIVO ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            Total: ${sumaManual.toLocaleString()} / 13,000,000
                                            {sumaManual !== TOTAL_OBJETIVO && (
                                                <p className="font-normal text-[10px] mt-1">
                                                    {sumaManual > TOTAL_OBJETIVO ? `Excede por: $${(sumaManual - TOTAL_OBJETIVO).toLocaleString()}` : `Falta: $${(TOTAL_OBJETIVO - sumaManual).toLocaleString()}`}
                                                </p>
                                            )}
                                        </div>
                                    )}
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
                                    if (modoPago === 'manual' && sumaManual !== TOTAL_OBJETIVO) {
                                        toast.error("La suma debe ser 13M");
                                        return;
                                    }

                                    try {
                                        const raw = selectedUserData.raw as CamperData;
                                        const data = prepareUnifiedData(raw, { pagare, fechaContrato, cuotas, modoPago, manualCuotas, fechasCuotas, isRP: true });

                                        await generateContract(
                                            "/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx",
                                            data,
                                            `Contrato_RP_Mayores_${raw.nombreCamper.replace(/\s+/g, '_')}.docx`
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
                                    const fileName = `Contrato_RP_Mayores_${raw.nombreCamper.replace(/\s+/g, '_')}.pdf`;

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
                                    if (modoPago === 'manual' && sumaManual !== TOTAL_OBJETIVO) {
                                        toast.error("La suma debe ser 13M");
                                        return;
                                    }
                                    const raw = selectedUserData.raw as CamperData;
                                    const data = prepareUnifiedData(raw, { pagare, fechaContrato, cuotas, modoPago, manualCuotas, fechasCuotas, isRP: true });

                                    toast.promise(async () => {
                                        const blob = await generateContract(
                                            "/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx",
                                            data,
                                            "contrato.docx",
                                            true
                                        );

                                        const url = await uploadToZapSign(blob as Blob, `Contrato_RP_${raw.nombreCamper}.docx`);
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

                {/* Document Viewer */}
                <DocxViewer url="/contratos/Condiciones Específicas-Recursos Propios Mayor de Edad.docx" blob={previewBlob} />
            </div>
        </div>
    );
};

export default RPMayores;
