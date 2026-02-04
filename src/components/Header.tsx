import { ArrowLeft, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  showBack?: boolean;
  title?: string;
  subtitle?: string;
}

const Header = ({ showBack = false, title, subtitle }: HeaderProps) => {
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
              <Rocket className="w-6 h-6" />
            </div>
            <span className="text-lg font-bold tracking-wide">CAMPUSLANDS</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Rocket className="w-5 h-5 text-primary" />
        </div>

        <div className="text-xs font-medium tracking-wider text-muted-foreground">
          {title || "AUTOMATIZACIÓN DE CONTRATOS"}
        </div>
      </div>
    </header>
  );
};

export default Header;
