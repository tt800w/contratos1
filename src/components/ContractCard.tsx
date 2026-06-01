import { FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ContractCardProps {
  title: string;
  route: string;
  isDisabled?: boolean;
}

const ContractCard = ({ title, route, isDisabled = false }: ContractCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => {
        if (!isDisabled) navigate(route);
      }}
      className={`contract-card group animate-fade-in relative ${isDisabled ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
    >
      {isDisabled && (
        <div className="absolute top-4 right-4 bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full">
          Próximamente
        </div>
      )}
      <div className="flex flex-col items-center text-center">
        <div className="icon-circle mb-6">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        
        <h3 className="text-base font-medium text-foreground mb-6 min-h-[48px] flex items-center">
          {title}
        </h3>
        
        <button className={`primary-button ${isDisabled ? 'pointer-events-none' : ''}`} disabled={isDisabled}>
          <span className="tracking-wider text-sm">SELECCIONAR</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ContractCard;
