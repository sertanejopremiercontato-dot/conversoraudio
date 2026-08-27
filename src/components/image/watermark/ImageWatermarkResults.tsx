import React, { useState } from "react";
import { ProcessedWatermarkResult } from "../../../services/image/imageWatermarkService";
import { createZipArchive, triggerDownload } from "../../../utils/downloadZip";
import { Download, Archive, RefreshCw, CheckCircle2, FileCheck, ArrowRight } from "lucide-react";

interface ImageWatermarkResultsProps {
  results: ProcessedWatermarkResult[];
  onReset: () => void;
  onNavigate?: (path: string) => void;
  onDownloadSingle?: (result: ProcessedWatermarkResult) => void;
  onDownloadZip?: () => void;
}

export const ImageWatermarkResults: React.FC<ImageWatermarkResultsProps> = ({
  results,
  onReset,
  onNavigate,
  onDownloadSingle,
  onDownloadZip
}) => {
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const handleDownloadSingle = (result: ProcessedWatermarkResult) => {
    triggerDownload(result.blob, result.outputFileName);
    if (onDownloadSingle) {
      onDownloadSingle(result);
    }
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    setIsZipping(true);

    try {
      const zipEntries = await Promise.all(
        results.map(async (r) => {
          const buffer = await r.blob.arrayBuffer();
          return {
            filename: r.outputFileName,
            data: new Uint8Array(buffer)
          };
        })
      );

      const zipBlob = createZipArchive(zipEntries);
      triggerDownload(zipBlob, "imagens-com-marca-dagua.zip");
      if (onDownloadZip) {
        onDownloadZip();
      }
    } catch (err) {
      console.error("Erro ao gerar arquivo ZIP:", err);
      alert("Ocorreu um erro ao gerar o pacote ZIP das imagens.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-green-primary/10 border border-green-primary/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-primary text-bg-main rounded-2xl shadow-md">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-text-main">
              {results.length === 1
                ? "Sua imagem com marca d’água está pronta!"
                : `${results.length} imagens protegidas com sucesso!`}
            </h3>
            <p className="text-xs text-text-sec font-semibold mt-0.5">
              Seus arquivos foram processados diretamente no navegador com total segurança.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {results.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex-1 md:flex-none px-5 py-3 bg-green-primary hover:bg-green-light text-bg-main font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              <span>{isZipping ? "Gerando ZIP..." : "Baixar Todas em ZIP"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="flex-1 md:flex-none px-4 py-3 bg-card-inner border border-border-main hover:border-green-primary rounded-xl text-xs font-bold text-text-main hover:text-green-light transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Processar Novas Imagens</span>
          </button>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((res) => (
          <div
            key={res.id}
            className="bg-card-main border border-border-main rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-green-primary/40 transition-all shadow-sm"
          >
            {/* Thumbnail */}
            <div className="w-full h-40 bg-black/50 rounded-xl border border-border-main/60 overflow-hidden flex items-center justify-center relative p-2">
              <img
                src={res.dataUrl}
                alt={res.outputFileName}
                className="max-w-full max-h-full object-contain rounded"
              />
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 text-green-primary border border-green-primary/30 rounded-full text-[10px] font-bold">
                {res.format}
              </span>
            </div>

            {/* File Info */}
            <div className="space-y-1">
              <span className="font-bold text-xs text-text-main block truncate" title={res.outputFileName}>
                {res.outputFileName}
              </span>
              <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted">
                <span>{res.width} × {res.height} px</span>
                <span>{(res.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <span className="text-[10px] text-green-primary font-bold block pt-1">
                {res.watermarkSummary}
              </span>
            </div>

            {/* Single Download button */}
            <button
              type="button"
              onClick={() => handleDownloadSingle(res)}
              className="w-full py-2.5 bg-card-inner border border-border-main hover:border-green-primary hover:bg-green-primary hover:text-bg-main text-text-main font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Baixar Imagem</span>
            </button>
          </div>
        ))}
      </div>

      {/* Navigation to related image tools */}
      <div className="pt-6 border-t border-border-main/60 space-y-3">
        <h4 className="font-extrabold text-xs text-text-main uppercase tracking-wider">
          Outras Ferramentas de Imagem do Conversor Áudio
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("/imagem/cortar")}
            className="p-3 bg-card-main border border-border-main hover:border-green-primary/50 rounded-xl text-text-sec hover:text-green-light flex items-center justify-between transition-all cursor-pointer"
          >
            <span>Cortar Imagem</span>
            <ArrowRight className="h-4 w-4 text-green-primary" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("/imagem/girar-espelhar")}
            className="p-3 bg-card-main border border-border-main hover:border-green-primary/50 rounded-xl text-text-sec hover:text-green-light flex items-center justify-between transition-all cursor-pointer"
          >
            <span>Girar e Espelhar Imagens</span>
            <ArrowRight className="h-4 w-4 text-green-primary" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("/imagem/redimensionar")}
            className="p-3 bg-card-main border border-border-main hover:border-green-primary/50 rounded-xl text-text-sec hover:text-green-light flex items-center justify-between transition-all cursor-pointer"
          >
            <span>Redimensionar Imagem</span>
            <ArrowRight className="h-4 w-4 text-green-primary" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("/imagem/comprimir")}
            className="p-3 bg-card-main border border-border-main hover:border-green-primary/50 rounded-xl text-text-sec hover:text-green-light flex items-center justify-between transition-all cursor-pointer"
          >
            <span>Compressor de Imagens</span>
            <ArrowRight className="h-4 w-4 text-green-primary" />
          </button>
        </div>
      </div>
    </div>
  );
};
