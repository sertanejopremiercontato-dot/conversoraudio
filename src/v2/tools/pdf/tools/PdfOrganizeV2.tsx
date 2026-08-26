import React, { useState } from "react";
import { ArrowLeft, Layers, AlertCircle, FileText, CheckCircle2, RefreshCw } from "lucide-react";
import { PdfDropzoneV2 } from "../components/PdfDropzoneV2";
import { PdfProgressV2 } from "../components/PdfProgressV2";
import { PdfResultV2 } from "../components/PdfResultV2";
import { PdfPageGridV2 } from "../components/PdfPageGridV2";
import { PdfEngineV2 } from "../services/pdfEngineV2";
import { PdfRenderV2 } from "../services/pdfRenderV2";
import { PdfPageItemV2, PdfResultDataV2 } from "../types";
import { trackEventV2 } from "../../../integrations/analytics";

interface PdfOrganizeV2Props {
  onBack: () => void;
}

export const PdfOrganizeV2: React.FC<PdfOrganizeV2Props> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPageItemV2[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState("");
  const [result, setResult] = useState<PdfResultDataV2 | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Por favor, selecione um arquivo em formato PDF.");
      return;
    }

    setSelectedFile(file);
    setIsLoadingPages(true);
    setErrorMessage(null);
    setPages([]);

    try {
      const doc = await PdfRenderV2.loadDocument(file);
      const numPages = doc.numPages;

      const initialPages: PdfPageItemV2[] = Array.from({ length: numPages }, (_, i) => ({
        id: `page-${i + 1}`,
        originalIndex: i,
        pageNumber: i + 1,
        rotation: 0,
        deleted: false
      }));

      setPages(initialPages);

      // Render thumbnails in background
      PdfRenderV2.renderThumbnails(doc, 220, (current, total) => {
        // Thumbnail progress
      }).then((thumbs) => {
        setPages((prev) =>
          prev.map((p, idx) => ({
            ...p,
            thumbnailUrl: thumbs[idx] || ""
          }))
        );
      });
    } catch (err: any) {
      console.error("Erro ao carregar páginas do PDF:", err);
      setErrorMessage("Não foi possível carregar as páginas do arquivo PDF selecionado.");
      setSelectedFile(null);
    } finally {
      setIsLoadingPages(false);
    }
  };

  const handleRotatePage = (id: string, angleDelta: number) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newRot = (p.rotation + angleDelta + 360) % 360;
        return { ...p, rotation: newRot };
      })
    );
  };

  const handleToggleDelete = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, deleted: !p.deleted } : p))
    );
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    const updated = [...pages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setPages(updated);
  };

  const handleStartOrganize = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    setErrorMessage(null);

    try {
      const organized = await PdfEngineV2.organizePages(
        selectedFile,
        pages,
        (pct, text) => {
          setProgress(pct);
          setStepText(text);
        }
      );

      const downloadUrl = URL.createObjectURL(organized.blob);
      setResult({
        blob: organized.blob,
        fileName: `organizado-${selectedFile.name}`,
        finalSize: organized.size,
        pageCount: organized.pageCount,
        downloadUrl
      });

      trackEventV2("pdf_organize_completed", {
        original_pages: pages.length,
        final_pages: organized.pageCount,
        app_version: "v2"
      });
    } catch (err: any) {
      console.error("Erro ao salvar PDF organizado:", err);
      setErrorMessage(err?.message || "Ocorreu um erro ao reorganizar as páginas do PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
    setResult(null);
    setSelectedFile(null);
    setPages([]);
    setProgress(0);
    setStepText("");
    setErrorMessage(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Hub PDF</span>
        </button>

        <div className="text-right">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Organizar Páginas do PDF</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Reordene, gire ou exclua páginas visualmente</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Flow */}
      {result ? (
        <PdfResultV2
          result={result}
          onReset={handleReset}
          title="Páginas reorganizadas com sucesso!"
          subtitle="Seu novo PDF com a ordem escolhida está pronto para download."
        />
      ) : isProcessing ? (
        <PdfProgressV2 progress={progress} stepText={stepText} />
      ) : (
        <div className="space-y-6">
          {!selectedFile ? (
            <PdfDropzoneV2
              onFilesSelected={handleFileSelected}
              multiple={false}
              title="Selecione o PDF para organizar as páginas"
              subtitle="Arraste o arquivo ou clique para selecionar"
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {selectedFile.name} ({pages.length} páginas)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Use as setas para mover a ordem das páginas e os botões para girar ou descartar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all self-start sm:self-auto"
                >
                  Trocar Arquivo
                </button>
              </div>

              {/* Grid of Pages */}
              {isLoadingPages ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  <span>Carregando visualização das páginas...</span>
                </div>
              ) : (
                <PdfPageGridV2
                  pages={pages}
                  onRotatePage={handleRotatePage}
                  onToggleDelete={handleToggleDelete}
                  onMovePage={handleMovePage}
                  allowReorder={true}
                />
              )}

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartOrganize}
                  disabled={pages.filter((p) => !p.deleted).length === 0}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Novo PDF ({pages.filter((p) => !p.deleted).length} páginas)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
