import { FileText } from "lucide-react";

interface FieldProps {
    label?: string;
    value: string;
    onChange: (val: string) => void;
    type?: string;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
}

export const ContractField = ({ label, value, onChange, type = "text", placeholder }: FieldProps) => (
    <div>
        <label className="section-label mb-2 block">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
            placeholder={placeholder}
        />
    </div>
);

export const CurrencyField = ({ label, value, onChange, placeholder, className, inputClassName }: FieldProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, ""); // Keep only digits
        onChange(rawValue);
    };

    const formattedValue = value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

    return (
        <div className={className}>
            {label && <label className="section-label mb-2 block">{label}</label>}
            <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                <input
                    type="text"
                    value={formattedValue}
                    onChange={handleChange}
                    className={inputClassName || "form-input pl-6"}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
};


export const FileNameField = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <label className="text-xs font-bold text-primary mb-2 flex items-center gap-2 uppercase tracking-wider">
            <FileText className="w-3 h-3" />
            Nombre Personalizado del Documento
        </label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-background border border-primary/30 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Ej: Contrato_Juan_Perez"
        />
        <p className="text-[10px] text-muted-foreground mt-1 italic">
            * Opcional. Se usará este nombre para la descarga y ZapSign.
        </p>
    </div>
);
