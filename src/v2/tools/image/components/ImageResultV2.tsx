import React from "react";
import {
  Download,
  Archive,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  TrendingDown,
  ExternalLink
} from "lucide-react";
import { ImageProcessResult } from "../types";
import { downloadImageBlob, downloadImagesZip } from "../services/imageEngineV2";

interface ImageResultV2Props {
  results: ImageProcessResult[];
  title?: string;
  onReset: () => void;
  zipFileName?: string;
  isCompression?: boolean;
}

export const ImageResultV2: React.FC<ImageResultV2Props> = ({
  results,
  title = "Processamento Concluído com Sucesso!",
  onReset,
  zipFileName = "fotos-processadas.zip",
  isCompression = false
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownloadSingle = (item: ImageProcessResult) => {
    downloadImageBlob(item.blob, item.outputName);
  };

  const handleDownloadZip = () => {
    downloadImagesZip(results, zipFileName);
  };

  // Calculate total original and final
  const totalOriginal = results.reduce((acc, r) => acc + r.originalSize, 0);
  const totalFinal = results.reduce((acc, r) => acc + r.finalSize, 0);
  const totalSavings = totalOriginal - totalFinal;
  const totalSavingsPct =
    totalOriginal > 0 ? Math.round((totalSavings / totalOriginal) * 100) : 0;

  const displayTitle = isCompression
    ? totalSavings > 0
      ? "Compressão Concluída com Sucesso!"
      : "Processamento Concluído (Arquivos já Otimizados)"
    : title;

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="image-result-view">
      {/* Top Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-xs">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs ${
            isCompression && totalSavings <= 0
              ? "bg-[#E0F2FE] text-[#0284C7]"
              : "bg-[#DCFCE7] text-[#16A34A]"
          }`}
        >
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl md:text-2xl font-black text-[#0F172A]">{displayTitle}</h2>
          <p className="text-xs md:text-sm text-[#64748B]">
            {isCompression && totalSavings <= 0
              ? "Não foi possível reduzir mais estes arquivos mantendo as configurações selecionadas sem perda de qualidade visual. Os arquivos originais foram preservados sem inflação de tamanho."
              : `${results.length} ${results.length === 1 ? "foto processada" : "fotos processadas"} no seu dispositivo.`}
          </p>
        </div>

        {/* Compression summary if applicable */}
        {isCompression && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 max-w-lg mx-auto grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[11px] font-bold text-[#94A3B8] block">Original</span>
              <span className="text-xs md:text-sm font-bold text-[#334155]">
                {formatFileSize(totalOriginal)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#94A3B8] block">Final</span>
              <span className="text-xs md:text-sm font-bold text-[#0F172A]">
                {formatFileSize(totalFinal)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#94A3B8] block">Economia</span>
              <span
                className={`text-xs md:text-sm font-black flex items-center justify-center gap-1 ${
                  totalSavings > 0 ? "text-[#16A34A]" : "text-[#64748B]"
                }`}
              >
                {totalSavings > 0 ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    {totalSavingsPct}%
                  </>
                ) : (
                  "0% (Máx. Compactado)"
                )}
              </span>
            </div>
          </div>
        )}

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {results.length > 1 && (
            <button
              onClick={handleDownloadZip}
              className="px-6 py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer hover:shadow"
            >
              <Archive className="w-4 h-4" />
              <span>Baixar Todas em ZIP ({results.length})</span>
            </button>
          )}

          {results.length === 1 && (
            <button
              onClick={() => handleDownloadSingle(results[0])}
              className="px-6 py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer hover:shadow"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Imagem ({results[0].format})</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="px-5 py-3 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-bold text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Processar Novas Fotos</span>
          </button>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((item, idx) => {
          return (
            <div
              key={item.id || idx}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-center gap-4 hover:border-[#CBD5E1] transition-all shadow-xs"
            >
              {/* Thumbnail Preview */}
              <div className="w-20 h-20 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden flex items-center justify-center shrink-0 relative group">
                <img
                  src={item.downloadUrl}
                  alt={item.outputName}
                  className="w-full h-full object-cover"
                />
                <a
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                  title="Abrir em tamanho real"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-xs md:text-sm font-bold text-[#0F172A] truncate">
                  {item.outputName}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748B]">
                  <span className="font-semibold">{item.width} × {item.height} px</span>
                  <span>•</span>
                  <span className="font-semibold text-[#0F172A]">
                    {formatFileSize(item.finalSize)}
                  </span>
                  {item.savingsPercent > 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#166534] font-black text-[10px]">
                      -{item.savingsPercent}%
                    </span>
                  ) : isCompression ? (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                      Já otimizado
                    </span>
                  ) : null}
                </div>
                <div className="text-[10px] text-[#94A3B8] truncate">
                  De: {item.originalName} ({formatFileSize(item.originalSize)})
                </div>
              </div>

              {/* Single Download button */}
              <button
                onClick={() => handleDownloadSingle(item)}
                className="w-10 h-10 rounded-xl bg-[#E0F2FE] hover:bg-[#0284C7] text-[#0284C7] hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="Baixar esta imagem"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
