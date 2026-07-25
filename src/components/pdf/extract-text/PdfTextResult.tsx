import React, { useState, useMemo } from "react";
import {
  FileText,
  Copy,
  Check,
  Download,
  Archive,
  Search,
  RotateCcw,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCode
} from "lucide-react";
import { PdfExtractTextResult } from "../../../services/pdf/pdfExtractTextService";
import { downloadTextFile, downloadPagesAsZip } from "../../../utils/pdfTextExporter";

interface PdfTextResultProps {
  result: PdfExtractTextResult;
  onReset: () => void;
  onCopyClick?: () => void;
  onTxtDownloadClick?: () => void;
  onZipDownloadClick?: () => void;
}

export const PdfTextResult: React.FC<PdfTextResultProps> = ({
  result,
  onReset,
  onCopyClick,
  onTxtDownloadClick,
  onZipDownloadClick
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const {
    originalFileName,
    totalPages,
    processedPagesCount,
    hasSelectableText,
    combinedText,
    pages,
    charCount,
    wordCount
  } = result;

  // Derive output text filename
  const baseName = originalFileName.replace(/\.pdf$/i, "");
  const txtFilename = `${baseName}-texto.txt`;
  const zipFilename = `${baseName}-texto-por-pagina.zip`;

  // Search matches inside extracted text
  const matchCount = useMemo(() => {
    if (!searchQuery.trim() || !combinedText) return 0;
    try {
      const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = combinedText.match(regex);
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }, [combinedText, searchQuery]);

  const handleCopyText = async () => {
    if (!combinedText) return;
    try {
      await navigator.clipboard.writeText(combinedText);
      setCopied(true);
      if (onCopyClick) onCopyClick();
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Erro ao copiar texto:", err);
    }
  };

  const handleDownloadTxt = () => {
    downloadTextFile(combinedText, txtFilename);
    if (onTxtDownloadClick) onTxtDownloadClick();
  };

  const handleDownloadZip = () => {
    downloadPagesAsZip(pages, zipFilename);
    if (onZipDownloadClick) onZipDownloadClick();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-card-main border border-border-main rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-main pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-card-inner border border-border-main rounded-2xl text-green-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-text-main line-clamp-1">
                {originalFileName}
              </h3>
              <p className="text-xs text-text-sec flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-primary" />
                <span>Extração concluída com sucesso</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 bg-card-inner hover:bg-card-inner/80 border border-border-main text-text-sec hover:text-text-main font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer w-fit"
          >
            <RotateCcw className="h-4 w-4" />
            <span>NOVA EXTRAÇÃO</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-card-inner border border-border-main rounded-2xl text-center">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Páginas Processadas
            </p>
            <p className="font-display font-extrabold text-lg md:text-xl text-green-primary mt-1">
              {processedPagesCount} / {totalPages}
            </p>
          </div>

          <div className="p-4 bg-card-inner border border-border-main rounded-2xl text-center">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Total de Caracteres
            </p>
            <p className="font-display font-extrabold text-lg md:text-xl text-text-main mt-1">
              {charCount.toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="p-4 bg-card-inner border border-border-main rounded-2xl text-center">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Total de Palavras
            </p>
            <p className="font-display font-extrabold text-lg md:text-xl text-text-main mt-1">
              {wordCount.toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="p-4 bg-card-inner border border-border-main rounded-2xl text-center">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Status do Texto
            </p>
            <p className="font-bold text-xs md:text-sm text-green-light mt-1.5">
              {hasSelectableText ? "Texto Selecionável" : "Sem Texto"}
            </p>
          </div>
        </div>

        {/* Scanned PDF Warning if no selectable text */}
        {!hasSelectableText && (
          <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-amber-300 text-xs md:text-sm font-medium">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Não encontramos texto selecionável neste PDF.</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed pl-7">
              Este arquivo parece ser uma imagem ou documento escaneado. A extração de texto de PDFs escaneados exige tecnologia OCR (Reconhecimento Óptico de Caracteres), que será oferecida em uma ferramenta separada.
            </p>
          </div>
        )}

        {/* Primary Action Buttons */}
        {hasSelectableText && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex-1 px-6 py-3.5 bg-green-primary hover:bg-green-light text-bg-main font-bold text-xs md:text-sm rounded-2xl transition-all shadow-md hover:shadow-green-primary/20 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wide"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-bg-main" />
                  <span>COPIADO PARA A ÁREA DE TRANSFERÊNCIA!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>COPIAR TODO O TEXTO</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="px-6 py-3.5 bg-card-inner hover:bg-card-inner/80 border border-border-main hover:border-green-primary/50 text-green-primary font-bold text-xs md:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>BAIXAR EM TXT</span>
            </button>

            {pages.length > 1 && (
              <button
                type="button"
                onClick={handleDownloadZip}
                title="Baixar cada página como um arquivo TXT individual compactado em ZIP"
                className="px-6 py-3.5 bg-card-inner hover:bg-card-inner/80 border border-border-main hover:border-green-primary/50 text-text-sec hover:text-text-main font-bold text-xs md:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Archive className="h-4 w-4 text-green-primary" />
                <span>ZIP (1 TXT POR PÁG)</span>
              </button>
            )}
          </div>
        )}

        {/* DOCX Version Notice */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-text-muted pt-1">
          <Info className="h-3.5 w-3.5 text-green-primary shrink-0" />
          <span>Formato TXT disponível nesta versão para garantir máxima compatibilidade e rapidez.</span>
        </div>
      </div>

      {/* Extracted Text Content Box */}
      {hasSelectableText && (
        <div className="bg-card-main border border-border-main rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
          {/* Internal Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border-main pb-4">
            <h4 className="font-bold text-sm text-text-main flex items-center gap-2">
              <FileCode className="h-4 w-4 text-green-primary" />
              <span>Conteúdo Extraído</span>
            </h4>

            {/* Search input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="h-4 w-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar no texto..."
                className="w-full pl-9 pr-8 py-2 bg-card-inner border border-border-main focus:border-green-primary focus:outline-none rounded-xl text-xs text-text-main"
              />
              {searchQuery && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-primary">
                  {matchCount}
                </span>
              )}
            </div>
          </div>

          {/* Textarea View */}
          <div className="relative">
            <textarea
              readOnly
              value={combinedText}
              rows={16}
              className="w-full p-4 md:p-6 bg-card-inner border border-border-main rounded-2xl text-xs md:text-sm font-mono text-text-main leading-relaxed focus:outline-none resize-y selection:bg-green-primary selection:text-bg-main"
            />
          </div>
        </div>
      )}
    </div>
  );
};
