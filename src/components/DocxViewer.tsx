import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { FileText, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

interface DocxViewerProps {
  url: string;
  blob?: Blob | null;
  title?: string;
}

const DocxViewer = ({
  url,
  blob,
  title = "VISTA PREVIA DEL DOCUMENTO",
}: DocxViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);

  const reloadDocument = () => {
    setKey((prev) => prev + 1);
  };

  useEffect(() => {
    const loadDocx = async () => {
      if (!containerRef.current) return;

      if (!blob && !url) {
        containerRef.current.innerHTML =
          '<div class="p-8 text-muted-foreground text-center">Seleccione un camper y actualice la vista previa para ver el documento.</div>';
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        let docData: Blob;

        if (blob) {
          docData = blob;
        } else if (url) {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Error loading document");
          docData = await response.blob();
        } else {
          return;
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
          containerRef.current.innerHTML =
            '<div class="p-8 text-red-500 text-center">Error al cargar el documento.</div>';
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDocx();
  }, [url, blob, key]);

  return (
    <div className="flex-1 bg-muted/30 p-2 md:p-4 h-[calc(100vh-65px)] overflow-hidden flex flex-col">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span className="text-xs font-medium tracking-wider uppercase">
            {title}
          </span>
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
            transition: "transform 0.2s ease-out",
            width: "210mm",
            margin: "0 auto",
          }}
        >
          <div ref={containerRef} className="docx-render-content" />
        </div>
      </div>

<<<<<<< HEAD
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

                // Inyectar el overlay real en cada sección (página)
                const sections = containerRef.current.querySelectorAll('section');
                sections.forEach(section => {
                    section.classList.add('relative');
                    section.style.position = 'relative';

                    // 1. Inyectar Encabezado Real
                    const headerContainer = document.createElement('div');
                    headerContainer.className = 'brand-header-overlay';

                    const navyCorner = document.createElement('div');
                    navyCorner.className = 'brand-header-navy';
                    headerContainer.appendChild(navyCorner);

                    const logoImg = document.createElement('img');
                    logoImg.src = '/Logocamp.png';
                    logoImg.className = 'brand-header-logo';
                    headerContainer.appendChild(logoImg);

                    const headerLine = document.createElement('div');
                    headerLine.className = 'brand-header-line';
                    headerContainer.appendChild(headerLine);

                    // Insertar al inicio de la sección para estar detrás del texto si es necesario pero z-indexed
                    section.insertBefore(headerContainer, section.firstChild);

                    // 2. Inyectar Pie de Página Real
                    const footerContainer = document.createElement('div');
                    footerContainer.className = 'brand-footer-overlay';

                    const footerNavy = document.createElement('div');
                    footerNavy.className = 'brand-footer-navy';
                    footerContainer.appendChild(footerNavy);

                    const footerText = document.createElement('div');
                    footerText.className = 'brand-footer-text';
                    footerText.innerText = 'Km.4, Anillo Vial, Bucaramanga, Santander';
                    footerContainer.appendChild(footerText);

                    section.appendChild(footerContainer);
                });

            } catch (error) {
                console.error("Error displaying document:", error);
                if (containerRef.current) {
                    containerRef.current.innerHTML = `<div class="p-8 text-red-500 text-center">Error al cargar el documento: ${error.message || error}</div>`;
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
=======
      <style>{`
>>>>>>> f8e3dc4cd7a30f5d8fe817c1084cfa134aa9fb45
        .docx-render-content {
          width: 100% !important;
          background-color: transparent !important;
        }

        .docx-render-content section {
<<<<<<< HEAD
          width: 210mm !important;
          min-height: 297mm !important;
          padding: 1.5cm 2cm 1.5cm 2cm !important; /* Margen estándar y ceñido para plataformas PDF, eliminando espacios vacíos */
          margin-bottom: 20px !important;
=======
>>>>>>> f8e3dc4cd7a30f5d8fe817c1084cfa134aa9fb45
          background: white !important;
          box-shadow: 0 0 10px rgba(0,0,0,0.2) !important;
          margin-bottom: 20px !important;
        }

<<<<<<< HEAD
        /* Real Header Overlay Styles */
        .brand-header-overlay {
            position: relative;
            width: calc(100% + 4cm);
            margin-left: -2cm;
            margin-top: -1.5cm;
            height: 56px;
            pointer-events: none;
            z-index: 10;
            margin-bottom: 20px;
        }

        .brand-header-navy {
            position: absolute;
            top: 0;
            right: 0;
            width: 110px;
            height: 50px;
            background: #0d1b2a; /* Navy */
            border-bottom-left-radius: 20px;
            z-index: 11;
        }

        .brand-header-logo {
            position: absolute;
            top: 10px;
            left: 20px;
            width: 30px;
            height: auto;
            z-index: 12;
        }

        .brand-header-line {
            position: absolute;
            top: 50px;
            left: 5%;
            width: 90%;
            height: 2px;
            background-color: #82c91e; /* Green line */
            z-index: 11;
        }

        /* Real Footer Overlay Styles */
        .brand-footer-overlay {
            position: relative;
            width: calc(100% + 4cm);
            margin-left: -2cm;
            margin-bottom: -1.5cm;
            height: 56px;
            pointer-events: none;
            z-index: 10;
            margin-top: 20px;
        }

        .brand-footer-navy {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100px;
            height: 45px;
            background: #0d1b2a;
            border-top-right-radius: 20px;
            z-index: 11;
        }
            border-top-right-radius: 20px;
            z-index: 11;
        }

        .brand-footer-text {
            position: absolute;
            bottom: 10px;
            left: 10%;
            width: 80%;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 0.5px solid #82c91e;
            padding-top: 6px;
            box-sizing: border-box;
            z-index: 11;
        }

        /* Respetar saltos de página de la librería */
        .docx_page_break, .docx-render-content .break-after {
=======
        .docx_page_break,
        .docx-render-content .break-after {
>>>>>>> f8e3dc4cd7a30f5d8fe817c1084cfa134aa9fb45
          display: block !important;
          page-break-after: always !important;
          height: 0 !important;
          margin: 0 !important;
        }
<<<<<<< HEAD
        /* Tablas */
        .docx-render-content table {
          width: 100% !important;
          border-collapse: collapse !important;
=======

        #docx-reader-container.exporting-pdf .docx-render-content section {
          box-shadow: none !important;
          margin-bottom: 0 !important;
>>>>>>> f8e3dc4cd7a30f5d8fe817c1084cfa134aa9fb45
        }
      `}</style>
    </div>
  );
};

export default DocxViewer;
