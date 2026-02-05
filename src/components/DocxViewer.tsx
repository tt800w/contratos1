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
                    ignoreWidth: false, // CRÍTICO: Respetar el ancho del documento Word
                    experimental: true,
                    useBase64URL: true,
                    breakPages: true
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
        <div className="flex-1 bg-muted/30 p-4 md:p-8 min-h-screen overflow-hidden flex flex-col">
            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-medium tracking-wider uppercase">{title}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoom(Math.max(50, zoom - 10))}
                        className="p-2 bg-card rounded-lg hover:bg-secondary transition-colors border shadow-sm"
                        title="Reducir Zoom"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono w-12 text-center">{zoom}%</span>
                    <button
                        onClick={() => setZoom(Math.min(200, zoom + 10))}
                        className="p-2 bg-card rounded-lg hover:bg-secondary transition-colors border shadow-sm"
                        title="Aumentar Zoom"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        onClick={reloadDocument}
                        className="p-2 bg-card rounded-lg hover:bg-secondary transition-colors border shadow-sm ml-2"
                        title="Recargar Documento"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Document Container */}
            <div className="flex-1 overflow-auto bg-gray-100/50 rounded-xl border border-border p-4 flex justify-center items-start">
                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground mt-20">
                        <RotateCw className="w-5 h-5 animate-spin" />
                        <span>Cargando documento...</span>
                    </div>
                )}

                <div
                    className="transition-transform origin-top duration-200 ease-out bg-white shadow-lg mx-auto"
                    style={{
                        transform: `scale(${zoom / 100})`,
                        // Aseguramos que el contenedor tenga el tamaño adecuado
                        // Un documento Word A4 estándar suele tener 21cm de ancho
                        // Usamos width fijo para evitar que flexbox lo aplaste (distorsión)
                        width: "21cm",
                        minHeight: "29.7cm",
                        marginBottom: `${(zoom - 100) * 0.5}%`
                    }}
                >
                    <div ref={containerRef} className="docx-render-content" />
                </div>
            </div>

            {/* Estilos para forzar un buen comportamiento del renderizador */}
            <style>{`
        .docx-render-content section {
          box-shadow: none !important;
          margin-bottom: 0 !important;
        }
        .docx_wrapper {
          background: transparent !important;
          padding: 0 !important;
        }
      `}</style>
        </div>
    );
};

export default DocxViewer;
