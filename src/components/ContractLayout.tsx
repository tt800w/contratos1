import { useState, useEffect } from "react";
import { FileSpreadsheet } from "lucide-react";
import Header from "./Header";
import UserSelector from "./UserSelector";
import DocxViewer from "./DocxViewer";
import { generateContract } from "@/utils/contractGenerator";

interface ContractLayoutProps {
    title: string;
    description: string;
    users: any[];
    selectedUser: string;
    onUserSelect: (id: string) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    previewBlob: Blob | null;
    templateUrl?: string;
    children: React.ReactNode;
}

const ContractLayout = ({
    title,
    description,
    users,
    selectedUser,
    onUserSelect,
    onFileUpload,
    previewBlob,
    templateUrl = "",
    children
}: ContractLayoutProps) => {
    const [initialBlob, setInitialBlob] = useState<Blob | null>(null);

    // Cargar una versión "limpia" de la plantilla al inicio (sin tags visibles)
    useEffect(() => {
        if (!previewBlob && templateUrl) {
            // Generar una vista previa con datos vacíos para ocultar los brackets {TAGS}
            generateContract(templateUrl, {}, "preview.docx", true)
                .then(blob => {
                    if (blob instanceof Blob) setInitialBlob(blob);
                })
                .catch(err => console.error("Error al generar vista previa inicial:", err));
        }
    }, [templateUrl, previewBlob]);

    return (
        <div className="min-h-screen bg-background">
            <Header showBack />

            <div className="flex h-[calc(100vh-65px)]">
                {/* Form Panel */}
                <div className="w-[400px] form-panel border-r border-border overflow-y-auto flex flex-col">
                    <div className="flex-1 p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                {title}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Excel Upload */}
                            <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all text-center relative group cursor-pointer">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={onFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                                        <FileSpreadsheet className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-foreground">Cargar Excel de Campers</p>
                                        <p className="text-xs text-muted-foreground">Arrastre o haga clic para subir</p>
                                    </div>
                                </div>
                            </div>

                            {/* User Selection */}
                            {users.length > 0 && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                                        Seleccionar Camper ({users.length})
                                    </label>
                                    <UserSelector
                                        users={users}
                                        value={selectedUser}
                                        onChange={onUserSelect}
                                    />
                                </div>
                            )}

                            {/* Custom Page Fields */}
                            <div className="space-y-6 animate-in fade-in duration-500 delay-150">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <DocxViewer
                    url=""
                    blob={previewBlob || initialBlob}
                    title={`VISTA PREVIA - ${title.toUpperCase()}`}
                />
            </div>
        </div>
    );
};

export default ContractLayout;
