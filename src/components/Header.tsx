import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  showBack?: boolean;
  title?: string;
}

const Header = ({ showBack = false, title }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        {showBack ? (
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">REGRESAR</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-primary">
              <img src="/Logocamp.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-lg font-bold tracking-wide">CAMPUSLANDS</span>
          </div>
        )}

        {/* Center spacing or empty div if needed */}
        <div></div>

        <div className="text-xs font-medium tracking-wider text-muted-foreground">
          {title || "AUTOMATIZACIÓN DE CONTRATOS"}
        </div>
      </div>
    </header>
  );
};

export default Header;
