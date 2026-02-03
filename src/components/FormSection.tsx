import { ReactNode } from "react";

interface FormSectionProps {
  number?: string;
  title: string;
  children: ReactNode;
}

const FormSection = ({ number, title, children }: FormSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-border pb-2">
        {number && (
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
            {number}
          </span>
        )}
        <span className="text-sm font-semibold text-primary tracking-wider uppercase">
          {title}
        </span>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default FormSection;
