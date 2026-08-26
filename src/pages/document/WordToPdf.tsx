import React, { useState, useRef } from "react";
import { renderAsync } from "docx-preview";
import { useSeoHead } from "../../lib/useSeoHead";
import { trackEvent } from "../../lib/gtag";
import {
  isRemoteConverterConfigured,
  convertWordToPdfRemote,
} from "../../services/document/documentConverterApiService";
import {
  FileText,
  Upload,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Printer,
  Loader2,
  CheckCircle2,
  FileCheck,
  Eye,
  Info,
  Download,
  Server,
} from "lucide-react";

interface WordToPdfProps {
  onNavigate?: (path: string) => void;
}

type Step = "upload" | "ready" | "processing" | "result";

export default function WordToPdf({ onNavigate }: WordToPdfProps) {
  useSeoHead("wordToPdf");

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);

  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Progress state
  const [progressStage, setProgressStage] = useState("Iniciando...");
  const [progressPercent, setProgressPercent] = useState(0);

  // Result state
  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(null);
  const [convertedPdfBlob, setConvertedPdfBlob] = useState<Blob | null>(null);

  // Print container ref for local preview
  const printContainerRef = useRef<HTMLDivElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  const isRemoteConfigured = isRemoteConverterConfigured();

  const handleFileSelect = (selectedFile: File) => {
    setUploadError(null);

    const fileName = selectedFile.name.toLowerCase();

    if (!fileName.endsWith(".docx") && !fileName.endsWith(".doc")) {
      setUploadError("Por favor, selecione um arquivo de documento Word válido (.docx ou .doc).");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setUploadError("O arquivo excede o tamanho máximo permitido de 20MB.");
      return;
    }

    setFile(selectedFile);
    setStep("ready");
    trackEvent("word_to_pdf_file_selected", { tool: "word_to_pdf", name: selectedFile.name });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setStep("processing");
    setUploadError(null);

    // 1. Primary path: Remote LibreOffice Service
    if (isRemoteConfigured) {
      try {
        const pdfBlob = await convertWordToPdfRemote(file, {
          onProgress: (stage, percent) => {
            setProgressStage(stage);
            setProgressPercent(percent);
          },
        });

        const url = URL.createObjectURL(pdfBlob);
        setConvertedPdfBlob(pdfBlob);
        setConvertedPdfUrl(url);
        setIsRendered(true);
        setStep("result");
        trackEvent("word_to_pdf_converted_remote", { tool: "word_to_pdf", name: file.name });
      } catch (err: any) {
        console.error("[WordToPdf] Erro na conversão remota:", err);
        setUploadError(err?.message || "Falha na conversão remota de alta fidelidade.");
        setStep("ready");
      }
      return;
    }

    // 2. Fallback path when API URL is missing: Display clear notice message
    setUploadError("Serviço de conversão de documentos ainda não configurado.");
    setStep("ready");
  };

  const handleDownloadPdf = () => {
    if (!convertedPdfUrl || !file) return;

    const pdfName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
    const link = document.createElement("a");
    link.href = convertedPdfUrl;
    link.download = pdfName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    trackEvent("word_to_pdf_downloaded", { tool: "word_to_pdf", filename: pdfName });
  };

  const handleReset = () => {
    if (convertedPdfUrl) {
      URL.revokeObjectURL(convertedPdfUrl);
    }
    setStep("upload");
    setFile(null);
    setUploadError(null);
    setProgressPercent(0);
    setProgressStage("");
    setIsRendered(false);
    setConvertedPdfBlob(null);
    setConvertedPdfUrl(null);
    if (printContainerRef.current) {
      printContainerRef.current.innerHTML = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-[#E0F2FE] border border-[#BAE6FD] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0284C7]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Conversor LibreOffice de Alta Fidelidade</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A]" id="word-to-pdf-title">
          Converter Word para PDF Grátis
        </h1>

        <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-xl mx-auto">
          Converta seus documentos Word (.DOC e .DOCX) mantendo cabeçalhos, rodapés, tabelas e formatação perfeita.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-8 shadow-sm space-y-6">
        {/* Step 1: Upload Zone */}
        {step === "upload" && (
          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                isLoadingFile
                  ? "border-[#0284C7]/50 bg-[#E0F2FE] cursor-wait"
                  : "border-[#CBD5E1] hover:border-[#0284C7] bg-[#F8FAFC] hover:bg-white"
              }`}
              onClick={() => {
                if (!isLoadingFile) {
                  document.getElementById("word-file-input")?.click();
                }
              }}
            >
              <input
                id="word-file-input"
                type="file"
                accept=".docx,.doc"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-inner">
                  {isLoadingFile ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <FileText className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-[#0F172A]">
                    Arraste e solte seu arquivo Word (.DOCX ou .DOC) aqui
                  </p>
                  <p className="text-xs text-[#475569]">
                    ou clique para selecionar do seu computador (Arquivos até 20MB)
                  </p>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center space-x-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>Selecionar Documento Word</span>
                  </span>
                </div>
              </div>
            </div>

            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-600 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-red-700">Erro na seleção do arquivo</p>
                  <p className="leading-relaxed">{uploadError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: File Selected & Ready */}
        {step === "ready" && file && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8FAFC] p-5 rounded-2xl border border-[#E2E8F0]">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#E0F2FE] rounded-xl border border-[#BAE6FD] text-[#0284C7]">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </h3>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Tamanho: {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="self-start sm:self-auto text-xs text-[#475569] hover:text-[#0F172A] flex items-center space-x-1 border border-[#E2E8F0] bg-white rounded-lg px-3 py-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Escolher outro arquivo</span>
              </button>
            </div>

            {uploadError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-900">Aviso do Serviço de Conversão</p>
                  <p className="leading-relaxed">{uploadError}</p>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleConvert}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-sm px-8 py-3.5 rounded-xl shadow-md transition active:scale-95"
              >
                <span>Converter para PDF</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === "processing" && (
          <div className="py-12 px-4 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-[#0F172A]">
                Convertendo Documento Word...
              </h3>
              <p className="text-xs text-[#475569]">{progressStage}</p>
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden border border-[#CBD5E1]">
                <div
                  className="bg-[#0284C7] h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(8, progressPercent)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-[#0284C7]">
                {progressPercent}%
              </span>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === "result" && file && convertedPdfUrl && (
          <div className="space-y-6">
            <div className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#D1FAE5] border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#0F172A]">
                  Documento Convertido em Alta Fidelidade!
                </h3>
                <p className="text-xs text-[#475569]">
                  Seu PDF está pronto. Clique no botão abaixo para baixar o arquivo gerado pelo motor LibreOffice.
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center space-x-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-md transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF Gerado</span>
                </button>
              </div>
            </div>

            {/* Action Buttons & Preview */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={handleReset}
                className="w-full sm:w-auto text-xs font-semibold text-[#475569] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] px-5 py-3 rounded-xl border border-[#E2E8F0] transition flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Escolher outro documento</span>
              </button>
            </div>

            {/* Embedded PDF Viewer */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-[#0284C7]" />
                  <span>Pré-visualização do PDF</span>
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {file.name.replace(/\.[^/.]+$/, "")}.pdf
                </span>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl overflow-hidden h-[600px]">
                <iframe
                  src={convertedPdfUrl}
                  className="w-full h-full border-0"
                  title="PDF Convertido"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security & Privacy Disclaimer */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center justify-center space-x-3 max-w-3xl mx-auto text-center shadow-xs">
        <ShieldCheck className="h-5 w-5 text-[#0284C7] shrink-0" />
        <p className="text-xs text-[#475569] font-medium leading-relaxed">
          🔒 Seu documento é enviado de forma segura apenas durante a conversão e é apagado automaticamente após o PDF ser gerado.
        </p>
      </div>
    </div>
  );
}


