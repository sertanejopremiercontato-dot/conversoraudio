import React, { useState } from "react";
import { ArrowLeft, FileText, Copy, Download, Check, AlertCircle, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { PdfDropzoneV2 } from "../components/PdfDropzoneV2";
import { PdfProgressV2 } from "../components/PdfProgressV2";
import { PdfExtractV2 } from "../services/pdfExtractV2";
import { PdfExtractResultV2 } from "../types";
import { trackEventV2 } from "../../../integrations/analytics";

interface PdfExtractTextV2Props {
  onBack: () => void;
}

export const PdfExtractTextV2: React.FC<PdfExtractTextV2Props> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState("");
  const [extractResult, setExtractResult] = useState<PdfExtractResultV2 | null>(null);
  const [copied, setCopied] = useState(false);
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
    setExtractResult(null);
  };

  const handleStartExtract = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    setErrorMessage(null);

    try {
      setStepText("Lendo estrutura de texto digital...");
      const result = await PdfExtractV2.extractText(selectedFile, (current, total) => {
        setProgress(Math.round((current / total) * 100));
        setStepText(`Extraindo texto da página ${current} de ${total}...`);
      });

      setExtractResult(result);

      trackEventV2("pdf_extract_text_completed", {
        total_pages: result.totalPages,
        total_characters: result.totalCharacters,
        is_scanned: result.isScannedOnly,
        app_version: "v2"
      });
    } catch (err: any) {
      console.error("Erro ao extrair texto do PDF:", err);
      setErrorMessage(err?.message || "Ocorreu um erro ao extrair o texto do PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = () => {
    if (!extractResult) return;
    navigator.clipboard.writeText(extractResult.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!extractResult || !selectedFile) return;
    const blob = new Blob([extractResult.fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}-texto-extraido.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractResult(null);
    setProgress(0);
    setStepText("");
    setErrorMessage(null);
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
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Extrair Texto de PDF</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Copie ou baixe o conteúdo textual de arquivos PDF</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Flow */}
      {extractResult ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Texto Extraído ({extractResult.totalCharacters.toLocaleString()} caracteres)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {extractResult.pagesWithText} de {extractResult.totalPages} páginas continham texto digital indexável.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copiado!" : "Copiar Tudo"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar .TXT</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {extractResult.isScannedOnly && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>
                Pouco ou nenhum texto digital foi encontrado. Se este documento for um arquivo escaneado ou foto, utilize o conversor de PDF para Imagens.
              </span>
            </div>
          )}

          {/* Text Area Viewer */}
          <div className="relative">
            <textarea
              readOnly
              value={extractResult.fullText}
              rows={16}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      ) : isProcessing ? (
        <PdfProgressV2 progress={progress} stepText={stepText} />
      ) : (
        <div className="space-y-6">
          {!selectedFile ? (
            <PdfDropzoneV2
              onFilesSelected={handleFileSelected}
              multiple={false}
              title="Selecione o PDF para extrair o texto"
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pronto para extração de texto digital</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Trocar Arquivo
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartExtract}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Extrair Texto do PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
