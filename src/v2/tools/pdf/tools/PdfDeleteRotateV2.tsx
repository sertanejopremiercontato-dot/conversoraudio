import React, { useState } from "react";
import { ArrowLeft, RotateCw, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { PdfDropzoneV2 } from "../components/PdfDropzoneV2";
import { PdfProgressV2 } from "../components/PdfProgressV2";
import { PdfResultV2 } from "../components/PdfResultV2";
import { PdfPageGridV2 } from "../components/PdfPageGridV2";
import { PdfEngineV2 } from "../services/pdfEngineV2";
import { PdfRenderV2 } from "../services/pdfRenderV2";
import { PdfPageItemV2, PdfResultDataV2 } from "../types";
import { trackEventV2 } from "../../../integrations/analytics";

interface PdfDeleteRotateV2Props {
  onBack: () => void;
}

export const PdfDeleteRotateV2: React.FC<PdfDeleteRotateV2Props> = ({ onBack }) => {
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

      PdfRenderV2.renderThumbnails(doc, 220).then((thumbs) => {
        setPages((prev) =>
          prev.map((p, idx) => ({
            ...p,
            thumbnailUrl: thumbs[idx] || ""
          }))
        );
      });
    } catch (err: any) {
      console.error("Erro ao carregar páginas do PDF:", err);
      setErrorMessage("Não foi possível carregar as páginas do arquivo PDF.");
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

  const handleRotateAll = (angleDelta: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + angleDelta + 360) % 360
      }))
    );
  };

  const handleStartSave = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    setErrorMessage(null);

    try {
      const output = await PdfEngineV2.deleteAndRotatePages(
        selectedFile,
        pages,
        (pct, text) => {
          setProgress(pct);
          setStepText(text);
        }
      );

      const downloadUrl = URL.createObjectURL(output.blob);
      setResult({
        blob: output.blob,
        fileName: `ajustado-${selectedFile.name}`,
        finalSize: output.size,
        pageCount: output.pageCount,
        downloadUrl
      });

      trackEventV2("pdf_delete_rotate_completed", {
        original_pages: pages.length,
        final_pages: output.pageCount,
        app_version: "v2"
      });
    } catch (err: any) {
      console.error("Erro ao processar PDF:", err);
      setErrorMessage(err?.message || "Ocorreu um erro ao excluir ou girar páginas do PDF.");
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
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Excluir e Girar Páginas</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gire páginas invertidas ou remova páginas indesejadas</p>
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
          title="PDF ajustado com sucesso!"
          subtitle="Suas alterações de rotação e exclusão foram salvas com perfeição."
        />
      ) : isProcessing ? (
        <PdfProgressV2 progress={progress} stepText={stepText} />
      ) : (
        <div className="space-y-6">
          {!selectedFile ? (
            <PdfDropzoneV2
              onFilesSelected={handleFileSelected}
              multiple={false}
              title="Selecione o PDF para girar ou excluir páginas"
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
                    Clique nas ações individuais de cada página ou utilize os botões rápidos.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleRotateAll(90)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Girar Todas 90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Trocar Arquivo
                  </button>
                </div>
              </div>

              {/* Grid of Pages */}
              {isLoadingPages ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  <span>Carregando páginas...</span>
                </div>
              ) : (
                <PdfPageGridV2
                  pages={pages}
                  onRotatePage={handleRotatePage}
                  onToggleDelete={handleToggleDelete}
                  allowReorder={false}
                />
              )}

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartSave}
                  disabled={pages.filter((p) => !p.deleted).length === 0}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Alterações ({pages.filter((p) => !p.deleted).length} páginas)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
