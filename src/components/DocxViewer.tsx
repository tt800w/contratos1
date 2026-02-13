import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { FileText, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface DocxViewerProps {
    url: string;
    blob?: Blob | null;
    title?: string;
}

const DocxViewer = ({ url, blob, title = "VISTA PREVIA DEL DOCUMENTO" }: DocxViewerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(100);
    const [isLoading, setIsLoading] = useState(true);
    const [key, setKey] = useState(0);

    const reloadDocument = () => {
        setKey(prev => prev + 1);
    };

    useEffect(() => {
        const loadDocx = async () => {
            if (!containerRef.current) return;
            setIsLoading(true);

            try {
                let docData: Blob;

                if (blob) {
                    docData = blob;
                } else {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error("Error loading document");
                    docData = await response.blob();
                }

                containerRef.current.innerHTML = "";

                await renderAsync(docData, containerRef.current, undefined, {
                    inWrapper: false,
                    ignoreWidth: false,
                    ignoreHeight: false,
                    experimental: true,
                    useBase64URL: true,
                    breakPages: true,
                    renderHeaders: true,
                    renderFooters: true,
                });
            } catch (error) {
                console.error("Error displaying document:", error);
                if (containerRef.current) {
                    containerRef.current.innerHTML = `<div class="p-8 text-red-500 text-center">Error al cargar el documento.</div>`;
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadDocx();
    }, [url, blob, key]);

    return (
        <div className="flex-1 bg-muted/30 p-2 md:p-4 h-[calc(100vh-65px)] overflow-hidden flex flex-col">
            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 bg-card p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-medium tracking-wider uppercase">{title}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoom(Math.max(50, zoom - 10))}
                        className="p-1.5 bg-background rounded-md hover:bg-secondary transition-colors border shadow-sm"
                        title="Reducir Zoom"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono w-12 text-center">{zoom}%</span>
                    <button
                        onClick={() => setZoom(Math.min(200, zoom + 10))}
                        className="p-1.5 bg-background rounded-md hover:bg-secondary transition-colors border shadow-sm"
                        title="Aumentar Zoom"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        onClick={reloadDocument}
                        className="p-1.5 bg-background rounded-md hover:bg-secondary transition-colors border shadow-sm ml-2"
                        title="Recargar Documento"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Document Container */}
            <div className="flex-1 overflow-auto bg-gray-400/50 rounded-xl border border-border flex justify-center items-start p-4">
                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground mt-20 absolute z-10">
                        <RotateCw className="w-5 h-5 animate-spin" />
                        <span>Cargando documento...</span>
                    </div>
                )}

                <div
                    id="docx-reader-container"
                    className="origin-top bg-transparent mb-8"
                    style={{
                        transform: `scale(${zoom / 100})`,
                        transition: 'transform 0.2s ease-out',
                        width: "210mm",
                        margin: "0 auto",
                    }}
                >
                    <div ref={containerRef} className="docx-render-content" />
                </div>
            </div>

            <style>{`
        .docx-render-content {
          width: 100% !important;
          background-color: transparent !important;
        }
        /* Estilo de página individual */
        .docx-render-content section {
          width: 210mm !important;
          min-height: 297mm !important;
          padding: 2.5cm !important;
          margin-bottom: 20px !important;
          background: white !important;
          box-shadow: 0 0 10px rgba(0,0,0,0.2) !important;
          position: relative !important;
          display: block !important;
          box-sizing: border-box !important;
        }
        /* Respetar saltos de página de la librería */
        .docx_page_break {
          display: block !important;
          page-break-after: always !important;
          height: 0 !important;
          margin: 0 !important;
        }
        /* Tablas */
        .docx-render-content table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        .docx-render-content p {
          margin-bottom: 8pt !important;
          line-height: 1.2 !important;
        }
      `}</style>
        </div>
    );
};

export default DocxViewer;
