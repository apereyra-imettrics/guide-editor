import React, { useState, useEffect, useCallback } from "react";
import { FileDown, Code, ArrowLeft, PanelRightClose, PanelRightOpen } from "lucide-react";
import { TiptapEditor } from "../components/Editor/TiptapEditor";
import { TableOfContents } from "../components/Editor/TableOfContents";
import type { Guide, ParameterRow } from "../types";
import { storage } from "../services/storage";
import debounce from "lodash.debounce";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() { 
    if (this.state.hasError) return <div className="p-4 bg-red-50 text-red-900"><h3 className="font-bold">Editor Crash</h3><pre className="text-xs whitespace-pre-wrap">{this.state.error?.stack || this.state.error?.message}</pre></div>; 
    return this.props.children; 
  }
}

interface EditorPageProps {
  guideId: string;
  initialMarkdown?: string;
  onBack: () => void;
}

export const EditorPage: React.FC<EditorPageProps> = ({ guideId, initialMarkdown, onBack }) => {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(true);
  const [tocWidth, setTocWidth] = useState(256);

  useEffect(() => {
    const g = storage.getGuide(guideId);
    if (g) {
      setGuide(g);
    }
  }, [guideId]);

  const debouncedSave = useCallback(
    debounce((updatedGuide: Guide) => {
      storage.saveGuide(updatedGuide);
    }, 1000),
    []
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!guide) return;
    const updated = { ...guide, title: e.target.value };
    setGuide(updated);
    debouncedSave(updated);
  };

  const handleContentChange = (blocks: any) => {
    if (!guide) return;
    const updated = { ...guide, content: blocks };
    setGuide(updated);
    debouncedSave(updated);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!guide) return;

    const events: any[] = [];
    let currentEvent: any = null;

    const nodes = guide.content?.content || [];
    nodes.forEach((block: any) => {
      if (block.type === "heading") {
        const text = block.content
          ?.map((c: any) => (c.type === "text" ? c.text : ""))
          .join("");
        currentEvent = {
          name: text,
          dataLayer: "",
          parameters: [],
        };
        events.push(currentEvent);
      } else if (block.type === "codeBlock" && currentEvent) {
        currentEvent.dataLayer = block.content
          ?.map((c: any) => (c.type === "text" ? c.text : ""))
          .join("");
      } else if (block.type === "parameterTable" && currentEvent) {
        const rows: ParameterRow[] = block.attrs?.rows ? JSON.parse(block.attrs.rows as string) : [];
        currentEvent.parameters = rows.map(r => ({
          param: r.parameter,
          value: r.value,
          type: r.type
        }));
      }
    });

    const exportData = {
      guide: guide.title,
      exportedAt: new Date().toISOString(),
      events: events.filter(e => e.dataLayer || e.parameters.length > 0),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${guide.title.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!guide) return null;

  return (
    <div className="h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Top Bar - Sticky */}
      <header className="no-print flex-shrink-0 z-20 flex justify-between items-center px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="h-6 w-[1px] bg-slate-200" />
          <span className="text-sm font-medium text-slate-400 truncate max-w-[200px]">
            {guide.title || "Sin título"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isTocOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
            title={isTocOpen ? "Ocultar índice" : "Mostrar índice"}
          >
            {isTocOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            <span>Índice</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-200 mx-1" />
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FileDown size={18} />
            Exportar PDF
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Code size={18} />
            Exportar JSON
          </button>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden relative">
        {/* Editor Content */}
        <main className="flex-grow p-4 md:p-8 print:p-0 overflow-y-auto">
          <div className="max-w-[1000px] mx-auto bg-white min-h-[11in] shadow-sm rounded-xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:m-0 print:max-w-none">
            <div className="p-8 md:p-12 print:p-0">
              <input
                type="text"
                value={guide.title}
                onChange={handleTitleChange}
                placeholder="Título de la guía..."
                className="w-full text-5xl font-extrabold text-slate-900 border-none outline-none mb-8 placeholder:text-slate-200 bg-transparent"
              />

              <ErrorBoundary>
                <TiptapEditor
                  initialContent={guide.content}
                  initialMarkdown={initialMarkdown}
                  onChange={handleContentChange}
                />
              </ErrorBoundary>
            </div>
          </div>
        </main>

        {/* Resizable Sidebar (TOC) */}
        {isTocOpen && (
          <>
            {/* Resize Handle */}
            <div 
              className="no-print w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize transition-colors z-10"
              onMouseDown={(e) => {
                const startX = e.pageX;
                const startWidth = tocWidth;
                const onMouseMove = (e: MouseEvent) => {
                  const newWidth = startWidth - (e.pageX - startX);
                  if (newWidth > 150 && newWidth < 500) {
                    setTocWidth(newWidth);
                  }
                };
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
            />
            
            <aside 
              className="no-print bg-white border-l border-slate-200 flex flex-col sticky top-0 h-full overflow-hidden"
              style={{ width: `${tocWidth}px` }}
            >
              <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Documento</span>
                <button 
                  onClick={() => setIsTocOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  title="Cerrar índice"
                >
                  <PanelRightClose size={16} />
                </button>
              </div>
              <TableOfContents 
                content={guide.content || {}} 
                onItemClick={() => {}}
              />
            </aside>
          </>
        )}

        {/* Floating Toggle Button (when closed) */}
        {!isTocOpen && (
          <button
            onClick={() => setIsTocOpen(true)}
            className="no-print absolute right-6 bottom-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-30"
            title="Abrir índice"
          >
            <PanelRightOpen size={24} />
          </button>
        )}
      </div>
    </div>
  );
};
