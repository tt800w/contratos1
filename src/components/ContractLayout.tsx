import Header from "./Header";
import UserSelector from "./UserSelector";
import DocxViewer from "./DocxViewer";
import { FileSpreadsheet } from "lucide-react";

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
    return (
        <div className="min-h-screen bg-background">
            <Header showBack />

            <div className="flex h-[calc(100vh-65px)]">
                {/* Form Panel */}
                <div className="w-[400px] form-panel border-r border-border overflow-y-auto flex flex-col">
                    <div className="flex-1">
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                {title}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Excel Upload */}
                            <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors text-center relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={onFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                                    <span className="text-sm font-medium">Cargar Excel de Campers</span>
                                </div>
                            </div>

                            {/* User Selection */}
                            {users.length > 0 && (
                                <UserSelector
                                    users={users}
                                    value={selectedUser}
                                    onChange={onUserSelect}
                                />
                            )}

                            {/* Custom Page Fields */}
                            {children}
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <DocxViewer
                    url={templateUrl}
                    blob={previewBlob}
                    title={`VISTA PREVIA - ${title.toUpperCase()}`}
                />
            </div>
        </div>
    );
};

export default ContractLayout;
