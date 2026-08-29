import React, { useState } from "react";
import {
  Download,
  FileArchive,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Loader2,
  Split,
  ShieldCheck,
  Sparkles,
  Info
} from "lucide-react";
import { CompressedImageItem } from "../../../services/image/imageCompressorService";
import { formatBytes } from "../ImageFileList";
import { createZipArchive, triggerDownload } from "../../../utils/downloadZip";
import ImageCompressorCompareModal from "./ImageCompressorCompareModal";

interface ImageCompressorResultsProps {
  items: CompressedImageItem[];
  onDownloadSingle: (item: CompressedImageItem) => void;
  onZipDownload: () => void;
  onReset: () => void;
}

export default function ImageCompressorResults({
  items,
  onDownloadSingle,
  onZipDownload,
  onReset
}: ImageCompressorResultsProps) {
  const completedItems = items.filter((item) => item.status === "concluida" && item.compressedBlob);
  const failedItems = items.filter((item) => item.status === "falhou");
  const [isZipping, setIsZipping] = useState(false);
  const [comparingItem, setComparingItem] = useState<CompressedImageItem | null>(null);

  if (completedItems.length === 0 && failedItems.length === 0) return null;

  const totalOriginalBytes = completedItems.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalCompressedBytes = completedItems.reduce((acc, curr) => acc + (curr.compressedSize || curr.originalSize), 0);
  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes);
  const totalSavedPercentage = totalOriginalBytes > 0 ? Math.round((totalSavedBytes / totalOriginalBytes) * 100) : 0;

  const handleDownloadZipAll = async () => {
    if (completedItems.length === 0) return;
    setIsZipping(true);
    try {
      onZipDownload();

      const zipFiles = await Promise.all(
        completedItems.map(async (item) => {
          const blobToUse = item.compressedBlob || item.file;
          const arrayBuffer = await blobToUse.arrayBuffer();
          const cleanExt = (item.outputFormat || item.originalFormat || "jpg").toLowerCase();
          return {
            filename: item.compressedFileName || `${item.name}-comprimido.${cleanExt}`,
            data: new Uint8Array(arrayBuffer)
          };
        })
      );

      const zipBlob = createZipArchive(zipFiles);
      triggerDownload(zipBlob, "imagens-comprimidas.zip");
    } catch (err) {
      console.error("Erro ao gerar arquivo ZIP:", err);
      alert("Falha ao criar o arquivo ZIP. Tente baixar as imagens individualmente.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-card-inner rounded-3xl border border-emerald-500/30 p-6 md:p-8 space-y-6 animate-fadeIn">
      {/* Banner Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border-main/60 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-950/50 rounded-2xl border border-emerald-800/50 text-emerald-400 shrink-0">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base md:text-lg text-text-main flex items-center gap-2">
              <span>Compressão Inteligente Concluída!</span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                100% Bytes Reais
              </span>
            </h3>
            <p className="text-xs text-text-muted font-semibold">
              {completedItems.length} {completedItems.length === 1 ? "imagem processada" : "imagens processadas"}
              {failedItems.length > 0 && ` (${failedItems.length} falhas)`}
            </p>

            {totalSavedBytes > 0 && (
              <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5 pt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Economia Total: {formatBytes(totalSavedBytes)} ({totalSavedPercentage}% de redução física)</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {completedItems.length > 1 && (
            <button
              type="button"
              disabled={isZipping}
              onClick={handleDownloadZipAll}
              className="w-full sm:w-auto py-3 px-5 bg-green-primary hover:bg-green-dark text-white rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20 active:scale-[0.98]"
            >
              {isZipping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Gerando ZIP…</span>
                </>
              ) : (
                <>
                  <FileArchive className="h-4 w-4" />
                  <span>BAIXAR TODAS EM ZIP</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto py-3 px-4 bg-bg-sec hover:bg-bg-main text-text-sec hover:text-text-main border border-border-main rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 text-green-primary" />
            <span>Comprimir Mais Imagens</span>
          </button>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {completedItems.map((item) => (
          <div
            key={item.id}
            className="bg-bg-sec rounded-3xl border border-border-main p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all shadow-sm"
          >
            <div className="space-y-3.5">
              {/* Header card with Thumbnail */}
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-card-inner rounded-2xl border border-border-main overflow-hidden shrink-0 flex items-center justify-center p-0.5 relative group">
                  {item.compressedBlobUrl ? (
                    <img
                      src={item.compressedBlobUrl}
                      alt={item.compressedFileName}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      {item.outputFormat || item.originalFormat}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h5 className="font-bold text-xs md:text-sm text-text-main truncate" title={item.compressedFileName}>
                    {item.compressedFileName}
                  </h5>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-card-inner px-2 py-0.5 rounded-md border border-border-main/60 uppercase font-extrabold text-[10px] text-emerald-400">
                      {item.outputFormat || item.originalFormat}
                    </span>

                    <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      {item.width} × {item.height} px
                    </span>
                  </div>
                </div>
              </div>

              {/* Photographic PNG Advice Notice if applicable */}
              {item.isPhotographicPng && item.outputFormat === "PNG" && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-[11px] text-amber-300 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>PNG fotográfico mantido. Desative &quot;Manter formato&quot; para economia máxima em WebP.</span>
                </div>
              )}

              {/* Before / After Detailed Metrics */}
              <div className="bg-card-inner p-3.5 rounded-2xl border border-border-main text-[11px] space-y-2 font-semibold">
                <div className="flex justify-between items-center text-text-muted">
                  <span>ORIGINAL:</span>
                  <span className="text-text-sec font-bold">
                    {formatBytes(item.originalSize)} ({item.originalFormat})
                  </span>
                </div>

                <div className="flex justify-between items-center text-text-muted">
                  <span>FINAL REAL:</span>
                  <span className="text-emerald-400 font-extrabold">
                    {formatBytes(item.compressedSize || item.originalSize)} ({item.outputFormat || item.originalFormat})
                  </span>
                </div>

                {item.visualQualityLabel && (
                  <div className="flex justify-between items-center text-text-muted pt-1 border-t border-border-main/40">
                    <span>FIDELIDADE VISUAL:</span>
                    <span className="text-emerald-400 font-bold">
                      {item.visualQualityLabel} ({item.visualQualityScore}%)
                    </span>
                  </div>
                )}

                {item.savedBytes && item.savedBytes > 0 ? (
                  <div className="flex justify-between items-center pt-1.5 border-t border-border-main/50 text-emerald-400 font-black text-xs">
                    <span>Economia Real:</span>
                    <span>-{formatBytes(item.savedBytes)} ({item.savedPercentage}%)</span>
                  </div>
                ) : (
                  <div className="pt-1.5 border-t border-border-main/50 text-text-muted text-[10px] font-bold">
                    Resolução e qualidade máxima preservadas.
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Compare and Download */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setComparingItem(item)}
                className="w-full py-2 px-3 bg-bg-main hover:bg-card-inner text-text-sec hover:text-text-main border border-border-main rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Split className="h-3.5 w-3.5 text-emerald-400" />
                <span>Comparar Antes / Depois</span>
              </button>

              <button
                type="button"
                onClick={() => onDownloadSingle(item)}
                className="w-full py-2.5 px-3 bg-green-primary hover:bg-green-dark text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/20 active:scale-[0.98]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Baixar Imagem Comprimida</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Compare Modal */}
      {comparingItem && (
        <ImageCompressorCompareModal
          item={comparingItem}
          onClose={() => setComparingItem(null)}
        />
      )}
    </div>
  );
}
