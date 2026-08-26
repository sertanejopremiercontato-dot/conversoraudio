import React, { useState } from "react";
import {
  ArrowLeft,
  Minimize2,
  AlertCircle,
  FileText,
  CheckCircle2,
  Download,
  RefreshCw,
  Sparkles,
  Info,
  ShieldCheck
} from "lucide-react";
import { PdfDropzoneV2 } from "../components/PdfDropzoneV2";
import { PdfProgressV2 } from "../components/PdfProgressV2";
import { PdfEngineV2 } from "../services/pdfEngineV2";
import { PdfCompressResultV2 } from "../types";
import { trackEventV2 } from "../../../integrations/analytics";

interface PdfCompressV2Props {
  onBack: () => void;
}

export const PdfCompressV2: React.FC<PdfCompressV2Props> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<"standard" | "high">("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState("");
  const [result, setResult] = useState<PdfCompressResultV2 | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Por favor, selecione um arquivo em formato PDF.");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleStartCompress = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    setErrorMessage(null);

    try {
      const compressed = await PdfEngineV2.compressPdf(
        selectedFile,
        compressionLevel,
        (pct, text) => {
          setProgress(pct);
          setStepText(text);
        }
      );

      // GUARANTEE: Never offer a file larger than the original
      if (compressed.finalSize > compressed.originalSize) {
        compressed.finalSize = compressed.originalSize;
        compressed.savedBytes = 0;
        compressed.savingsPercent = 0;
        compressed.status = "NO_GAIN";
        compressed.wasEffective = false;
        compressed.blob = new Blob([await selectedFile.arrayBuffer()], { type: "application/pdf" });
      }

      const url = URL.createObjectURL(compressed.blob);
      setDownloadUrl(url);
      setResult(compressed);

      trackEventV2("pdf_compress_completed", {
        original_size: compressed.originalSize,
        final_size: compressed.finalSize,
        savings_percent: compressed.savingsPercent,
        status: compressed.status,
        app_version: "v2"
      });
    } catch (err: any) {
      console.error("Erro ao comprimir PDF:", err);
      setErrorMessage(err?.message || "Ocorreu um erro ao otimizar o documento PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !downloadUrl || !selectedFile) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    const prefix = result.status === "COMPRESSED" ? "otimizado-" : "original-";
    a.download = `${prefix}${selectedFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl(null);
    setResult(null);
    setSelectedFile(null);
    setProgress(0);
    setStepText("");
    setErrorMessage(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="pdf-compress-v2-container">
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
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Comprimir e Otimizar PDF</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Reduza o tamanho do arquivo preservando a legibilidade</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Flow */}
      {result && selectedFile ? (
        <div className="max-w-xl mx-auto space-y-6">
          {result.status === "COMPRESSED" ? (
            /* ============================================================ */
            /* CASE A: REAL COMPRESSION SUCCESS                             */
            /* ============================================================ */
            <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 rounded-3xl p-8 md:p-10 shadow-sm text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  PDF comprimido com sucesso!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Seu documento foi otimizado com segurança mantendo a legibilidade e integridade original.
                </p>
              </div>

              {/* Comparison Statistics */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 text-left space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {result.pageCount} {result.pageCount === 1 ? "página" : "páginas"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-center">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Original</span>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {formatSize(result.originalSize)}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Comprimido</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {formatSize(result.finalSize)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Economia real de espaço:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {result.savingsPercent}% ({formatSize(result.savedBytes)} economizados)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Baixar PDF Comprimido</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3.5 px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Fazer Outro</span>
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* CASE B: ALREADY OPTIMIZED (NO GAIN)                          */
            /* ============================================================ */
            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-8 md:p-10 shadow-sm text-center space-y-6">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Info className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Este PDF já está altamente otimizado.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                  Não foi encontrada uma redução segura de tamanho mantendo a qualidade selecionada. O arquivo original foi preservado para evitar aumento de tamanho ou perda desnecessária de qualidade.
                </p>
              </div>

              {/* Stats Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 text-left space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatSize(result.originalSize)} • {result.pageCount} {result.pageCount === 1 ? "página" : "páginas"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Status do documento:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    0% de redução (Tamanho original preservado)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Baixar Arquivo Original</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3.5 px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Fazer Outro</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : isProcessing ? (
        <PdfProgressV2 progress={progress} stepText={stepText} />
      ) : (
        <div className="space-y-6">
          {!selectedFile ? (
            <PdfDropzoneV2
              onFilesSelected={handleFileSelected}
              multiple={false}
              title="Selecione o arquivo PDF para comprimir"
              subtitle="Arraste seu PDF ou clique para selecionar"
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{selectedFile.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tamanho atual: {formatSize(selectedFile.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Trocar Arquivo
                </button>
              </div>

              {/* Compression Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Nível de Otimização
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setCompressionLevel("standard")}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      compressionLevel === "standard"
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Otimização Equilibrada</span>
                      {compressionLevel === "standard" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Limpeza estrutural sem perdas + otimização de imagens em alta definição (1080p).
                    </p>
                  </div>

                  <div
                    onClick={() => setCompressionLevel("high")}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      compressionLevel === "high"
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Máxima Compactação</span>
                      {compressionLevel === "high" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Compactação mais intensa de fluxos e imagens para máxima redução de tamanho.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartCompress}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Comprimir Arquivo PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

