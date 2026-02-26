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
                    renderHeaders: false, // Desactivamos los de docx para usar nuestro overlay
                    renderFooters: false,
                });

                // Inyectar el overlay en cada sección (página)
                const sections = containerRef.current.querySelectorAll('section');
                sections.forEach(section => {
                    section.classList.add('relative');
                    section.style.position = 'relative';

                    const overlayContainer = document.createElement('div');
                    overlayContainer.className = 'brand-overlay-wrapper';
                    section.appendChild(overlayContainer);

                    // Renderizar el BrandOverlay manualmente o vía portal si fuera React puro, 
                    // pero como docx-preview inyecta HTML crudo, usaremos un truco de CSS 
                    // para posicionar un elemento inyectado.
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
          padding: 4.5cm 2cm 3.5cm 2cm !important; /* Más margen para el overlay superior e inferior */
          margin-bottom: 20px !important;
          background: white !important;
          box-shadow: 0 0 10px rgba(0,0,0,0.2) !important;
          position: relative !important;
          display: block !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }

        /* Overlay Styles */
        .docx-render-content section::before {
            content: "";
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            background-image: 
                url('/Logocamp.png'),
                linear-gradient(to right, #82c91e, #82c91e);
            background-repeat: no-repeat;
            background-size: 40px auto, 80% 1px;
            background-position: 40px 40px, center 100px;
            z-index: 10;
        }

        /* Header Navy Decoration */
        .docx-render-content section::after {
            content: "";
            position: absolute;
            top: 0; right: 0; 
            width: 120px; height: 60px;
            background: #0d1b2a; /* Navy */
            border-bottom-left-radius: 40px;
            z-index: 11;
        }

        /* Footer Decoration Logic (Custom pseudo-elements) */
        .brand-overlay-wrapper {
            position: absolute;
            bottom: 0; left: 0; width: 100%; height: 80px;
            pointer-events: none;
            z-index: 10;
        }

        .brand-overlay-wrapper::before {
            content: "";
            position: absolute;
            bottom: 0; left: 0; 
            width: 100px; height: 50px;
            background: #0d1b2a;
            border-top-right-radius: 40px;
        }

        .brand-overlay-wrapper::after {
            content: "Km.4, Anillo Vial, Bucaramanga, Santander";
            position: absolute;
            bottom: 20px; left: 0; width: 100%;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 0.5px solid #82c91e;
            padding-top: 10px;
            margin: 0 40px;
            width: calc(100% - 80px);
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
