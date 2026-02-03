import { FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ContractCardProps {
  title: string;
  route: string;
}

const ContractCard = ({ title, route }: ContractCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(route)}
      className="contract-card group animate-fade-in"
    >
      <div className="flex flex-col items-center text-center">
        <div className="icon-circle mb-6">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        
        <h3 className="text-base font-medium text-foreground mb-6 min-h-[48px] flex items-center">
          {title}
        </h3>
        
        <button className="primary-button">
          <span className="tracking-wider text-sm">SELECCIONAR</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ContractCard;
