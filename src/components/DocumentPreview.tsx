import { Eye, ZoomIn, ZoomOut, Download } from "lucide-react";
import { ReactNode, useState } from "react";

interface DocumentPreviewProps {
  children: ReactNode;
  title?: string;
}

const DocumentPreview = ({ children, title = "VISTA PREVIA DEL DOCUMENTO" }: DocumentPreviewProps) => {
  const [zoom, setZoom] = useState(100);

  const handleDownload = () => {
    // Placeholder for PDF download functionality
    alert("Funcionalidad de descarga PDF - próximamente");
  };

  return (
    <div className="flex-1 bg-muted/30 p-8 min-h-screen overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Eye className="w-4 h-4" />
          <span className="text-xs font-medium tracking-wider uppercase">{title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="p-2 bg-card rounded-lg hover:bg-secondary transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setZoom(Math.min(150, zoom + 10))}
            className="p-2 bg-card rounded-lg hover:bg-secondary transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>DESCARGAR PDF</span>
          </button>
        </div>
      </div>

      <div 
        className="document-preview max-w-2xl mx-auto transform origin-top transition-transform"
        style={{ transform: `scale(${zoom / 100})` }}
      >
        {children}
      </div>
    </div>
  );
};

export default DocumentPreview;
