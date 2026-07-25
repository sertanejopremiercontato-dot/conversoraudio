import React, { useState, useRef } from "react";
import { ArrowLeft, FileText, Sparkles, AlertCircle, FileType, Combine, Minimize2, Layers, Images, Image as ImageIcon } from "lucide-react";
import useSeoHead from "../../lib/useSeoHead";
import AdBanner from "../../components/AdBanner";
import { trackEvent } from "../../lib/gtag";
import { PdfTextUpload } from "../../components/pdf/extract-text/PdfTextUpload";
import { PdfTextPageSelector } from "../../components/pdf/extract-text/PdfTextPageSelector";
import { PdfTextSettings } from "../../components/pdf/extract-text/PdfTextSettings";
import { PdfTextProgress } from "../../components/pdf/extract-text/PdfTextProgress";
import { PdfTextResult } from "../../components/pdf/extract-text/PdfTextResult";
import {
  PdfExtractTextService,
  PdfExtractTextResult
} from "../../services/pdf/pdfExtractTextService";
import { ExtractionMode } from "../../utils/pdfTextLayout";
import {
  TextCleaningOptions,
  DEFAULT_CLEANING_OPTIONS
} from "../../utils/pdfTextCleaner";

interface PdfExtractTextProps {
  onNavigate?: (path: string) => void;
}

export default function PdfExtractText({ onNavigate }: PdfExtractTextProps) {
  useSeoHead("pdf_extract_text");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ numPages: number } | null>(null);
  const [pageRangeStr, setPageRangeStr] = useState<string>("");
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>("perPage");
  const [cleaningOptions, setCleaningOptions] = useState<TextCleaningOptions>(DEFAULT_CLEANING_OPTIONS);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [extractionResult, setExtractionResult] = useState<PdfExtractTextResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileSelected = async (file: File) => {
    setErrorMsg(null);
    setSelectedFile(file);
    setExtractionResult(null);

    try {
      const { numPages } = await PdfExtractTextService.getPdfInfo(file);
      setFileInfo({ numPages });
      setPageRangeStr("");
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao carregar informações do PDF.");
      setSelectedFile(null);
      setFileInfo(null);
    }
  };

  const handleStartExtraction = async () => {
    if (!selectedFile || !fileInfo) return;

    setErrorMsg(null);
    setIsProcessing(true);
    setProgress({ current: 0, total: fileInfo.numPages });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    trackEvent("pdf_extract_text_started", {
      tool_name: "Extrair Texto de PDF",
      page_count_range: fileInfo.numPages <= 5 ? "1-5" : fileInfo.numPages <= 20 ? "6-20" : "20+",
      extraction_mode: extractionMode
    });

    try {
      const result = await PdfExtractTextService.extractText(
        selectedFile,
        {
          pageRangeStr,
          mode: extractionMode,
          cleaningOptions
        },
        (current, total) => {
          setProgress({ current, total });
        },
        controller.signal
      );

      setExtractionResult(result);
      setIsProcessing(false);

      trackEvent("pdf_extract_text_completed", {
        tool_name: "Extrair Texto de PDF",
        text_found: result.hasSelectableText,
        processed_pages: result.processedPagesCount,
        char_count: result.charCount,
        word_count: result.wordCount,
        success: true
      });
    } catch (err: any) {
      setIsProcessing(false);
      const isCancel = err?.message?.includes("cancelado");
      if (!isCancel) {
        setErrorMsg(err?.message || "Ocorreu um erro durante a extração do texto.");
        trackEvent("pdf_extract_text_failed", {
          tool_name: "Extrair Texto de PDF",
          error_message: err?.message || "Erro desconhecido",
          success: false
        });
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileInfo(null);
    setExtractionResult(null);
    setErrorMsg(null);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Back Link */}
      {onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate("/pdf")}
          className="inline-flex items-center gap-2 text-xs font-bold text-text-sec hover:text-green-light transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Ferramentas de PDF</span>
        </button>
      )}

      {/* Main Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-2xl md:text-4xl font-extrabold text-text-main tracking-tight">
          Extrair Texto de PDF Grátis
        </h1>
        <p className="text-xs md:text-sm text-text-sec max-w-xl mx-auto font-medium leading-relaxed">
          Extraia o texto selecionável de arquivos PDF, copie o conteúdo diretamente ou baixe em formato TXT com segurança e rapidez.
        </p>
      </div>

      <AdBanner positionId="below_pdf_extract_text_top" toolName="Extrair Texto de PDF" />

      {/* View State Handling */}
      {isProcessing ? (
        <PdfTextProgress
          current={progress.current}
          total={progress.total}
          onCancel={handleCancelExtraction}
        />
      ) : extractionResult ? (
        <PdfTextResult
          result={extractionResult}
          onReset={handleReset}
          onCopyClick={() => {
            trackEvent("pdf_extract_text_copy_clicked", {
              tool_name: "Extrair Texto de PDF"
            });
          }}
          onTxtDownloadClick={() => {
            trackEvent("pdf_extract_text_download_clicked", {
              tool_name: "Extrair Texto de PDF",
              output_type: "txt"
            });
          }}
          onZipDownloadClick={() => {
            trackEvent("pdf_extract_text_zip_download_clicked", {
              tool_name: "Extrair Texto de PDF",
              output_type: "zip"
            });
          }}
        />
      ) : (
        <div className="space-y-6">
          {!selectedFile ? (
            <PdfTextUpload onFileSelected={handleFileSelected} />
          ) : (
            <div className="space-y-6">
              {/* Selected File Card */}
              <div className="bg-card-main border border-border-main rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-card-inner border border-border-main rounded-2xl text-green-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-text-main line-clamp-1">
                      {selectedFile.name}
                    </h3>
                    <p className="text-xs text-text-sec mt-0.5 font-medium">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {fileInfo?.numPages} {fileInfo?.numPages === 1 ? "página" : "páginas"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-card-inner hover:bg-card-inner/80 border border-border-main text-text-sec hover:text-red-400 font-bold text-xs rounded-xl transition-all cursor-pointer w-fit"
                >
                  Trocar Arquivo
                </button>
              </div>

              {/* Options & Settings */}
              {fileInfo && (
                <>
                  <PdfTextPageSelector
                    totalPages={fileInfo.numPages}
                    selectedRangeStr={pageRangeStr}
                    onRangeChange={setPageRangeStr}
                  />

                  <PdfTextSettings
                    mode={extractionMode}
                    onModeChange={setExtractionMode}
                    cleaningOptions={cleaningOptions}
                    onCleaningOptionChange={setCleaningOptions}
                  />

                  {/* Primary Extract Trigger */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleStartExtraction}
                      className="w-full sm:w-auto px-10 py-4 bg-green-primary hover:bg-green-light text-bg-main font-bold text-sm md:text-base rounded-2xl transition-all shadow-md hover:shadow-green-primary/20 inline-flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wide"
                    >
                      <Sparkles className="h-5 w-5" />
                      <span>EXTRAIR TEXTO DO PDF</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs md:text-sm font-semibold max-w-2xl mx-auto">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Internal Links to Related Tools */}
      <div className="pt-8 border-t border-border-main/60 space-y-4">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider text-center">
          Ferramentas de PDF Relacionadas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate("/pdf/juntar")}
                className="p-3.5 bg-card-main border border-border-main hover:border-green-primary/50 rounded-2xl transition-all text-center group cursor-pointer"
              >
                <Combine className="h-5 w-5 text-green-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-text-main group-hover:text-green-light block">
                  Juntar PDF
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("/pdf/comprimir")}
                className="p-3.5 bg-card-main border border-border-main hover:border-green-primary/50 rounded-2xl transition-all text-center group cursor-pointer"
              >
                <Minimize2 className="h-5 w-5 text-green-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-text-main group-hover:text-green-light block">
                  Comprimir PDF
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("/pdf/organizar")}
                className="p-3.5 bg-card-main border border-border-main hover:border-green-primary/50 rounded-2xl transition-all text-center group cursor-pointer"
              >
                <Layers className="h-5 w-5 text-green-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-text-main group-hover:text-green-light block">
                  Organizar PDF
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("/pdf/pdf-para-imagens")}
                className="p-3.5 bg-card-main border border-border-main hover:border-green-primary/50 rounded-2xl transition-all text-center group cursor-pointer"
              >
                <ImageIcon className="h-5 w-5 text-green-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-text-main group-hover:text-green-light block">
                  PDF para Imagens
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("/pdf/imagens-para-pdf")}
                className="p-3.5 bg-card-main border border-border-main hover:border-green-primary/50 rounded-2xl transition-all text-center group cursor-pointer"
              >
                <Images className="h-5 w-5 text-green-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-text-main group-hover:text-green-light block">
                  Imagens para PDF
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      <AdBanner positionId="page_bottom" toolName="Extrair Texto de PDF" />
    </div>
  );
}
