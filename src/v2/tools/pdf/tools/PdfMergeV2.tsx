import React, { useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { PdfDropzoneV2 } from "../components/PdfDropzoneV2";
import { PdfProgressV2 } from "../components/PdfProgressV2";
import { PdfResultV2 } from "../components/PdfResultV2";
import { PdfEngineV2 } from "../services/pdfEngineV2";
import { PdfFileItemV2, PdfResultDataV2 } from "../types";
import { trackEventV2 } from "../../../integrations/analytics";

interface PdfMergeV2Props {
  onBack: () => void;
}

export const PdfMergeV2: React.FC<PdfMergeV2Props> = ({ onBack }) => {
  const [files, setFiles] = useState<PdfFileItemV2[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState("");
  const [result, setResult] = useState<PdfResultDataV2 | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesAdded = (newFiles: File[]) => {
    const validFiles = newFiles.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (validFiles.length === 0) {
      setErrorMessage("Por favor, selecione apenas arquivos em formato PDF.");
      return;
    }

    const items: PdfFileItemV2[] = validFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size
    }));

    setFiles((prev) => [...prev, ...items]);
    setErrorMessage(null);
  };

  const handleMoveFile = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= files.length) return;
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFiles(updated);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleStartMerge = async () => {
    if (files.length < 2) {
      setErrorMessage("Adicione pelo menos 2 arquivos PDF para mesclar.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setErrorMessage(null);

    try {
      const merged = await PdfEngineV2.mergePdfs(
        files.map((f) => f.file),
        (pct, text) => {
          setProgress(pct);
          setStepText(text);
        }
      );

      const downloadUrl = URL.createObjectURL(merged.blob);
      setResult({
        blob: merged.blob,
        fileName: `documentos-mesclados-${Date.now()}.pdf`,
        finalSize: merged.size,
        pageCount: merged.pageCount,
        downloadUrl
      });

      trackEventV2("pdf_merge_completed", {
        file_count: files.length,
        total_pages: merged.pageCount,
        app_version: "v2"
      });
    } catch (err: any) {
      console.error("Erro ao mesclar PDFs:", err);
      setErrorMessage(err?.message || "Ocorreu um erro ao tentar juntar os arquivos PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
    setResult(null);
    setFiles([]);
    setProgress(0);
    setStepText("");
    setErrorMessage(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Juntar Arquivos PDF</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Combine múltiplos PDFs em um único documento</p>
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
          title="PDFs mesclados com sucesso!"
          subtitle="Seu novo arquivo com todos os documentos reunidos está pronto para download."
        />
      ) : isProcessing ? (
        <PdfProgressV2 progress={progress} stepText={stepText} />
      ) : (
        <div className="space-y-6">
          {files.length === 0 ? (
            <PdfDropzoneV2
              onFilesSelected={handleFilesAdded}
              title="Selecione os PDFs que deseja juntar"
              subtitle="Arraste múltiplos arquivos PDF ou clique para selecionar"
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Fila de Arquivos ({files.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Organize a sequência desejada usando as setas antes de mesclar.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all">
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Mais</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      onChange={(e) => e.target.files && handleFilesAdded(Array.from(e.target.files))}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                  >
                    Limpar Todos
                  </button>
                </div>
              </div>

              {/* Files List */}
              <div className="space-y-2.5">
                {files.map((fileItem, index) => (
                  <div
                    key={fileItem.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center font-mono">
                        {index + 1}
                      </span>
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {fileItem.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatSize(fileItem.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveFile(index, index - 1)}
                        disabled={index === 0}
                        title="Mover para cima"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 transition-all"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveFile(index, index + 1)}
                        disabled={index === files.length - 1}
                        title="Mover para baixo"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 transition-all"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(fileItem.id)}
                        title="Remover arquivo"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartMerge}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Juntar {files.length} Arquivos PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
