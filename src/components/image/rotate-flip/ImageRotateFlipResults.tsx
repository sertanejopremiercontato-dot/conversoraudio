import React from "react";
import { Download, Archive, RefreshCw, CheckCircle2, FileText, ExternalLink } from "lucide-react";
import { ProcessedRotateFlipResult } from "../../../services/image/imageRotateFlipService";
import { triggerDownload } from "../../../utils/downloadZip";

interface ImageRotateFlipResultsProps {
  results: ProcessedRotateFlipResult[];
  onDownloadZip: () => void;
  onResetAll: () => void;
  zipDownloading?: boolean;
}

export default function ImageRotateFlipResults({
  results,
  onDownloadZip,
  onResetAll,
  zipDownloading = false
}: ImageRotateFlipResultsProps) {
  if (results.length === 0) return null;

  const handleDownloadSingle = (res: ProcessedRotateFlipResult) => {
    triggerDownload(res.blob, res.outputFileName);
  };

  const totalSizeMB = (
    results.reduce((acc, r) => acc + r.sizeBytes, 0) /
    (1024 * 1024)
  ).toFixed(2);

  return (
    <div className="bg-card-main border border-border-main rounded-2xl p-6 md:p-8 space-y-6 shadow-md text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-main pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-primary/10 text-green-primary rounded-xl border border-green-primary/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-text-main">
              {results.length} {results.length === 1 ? "imagem ajustada com sucesso" : "imagens ajustadas com sucesso!"}
            </h3>
            <p className="text-xs text-text-sec font-semibold mt-0.5">
              Tamanho total processado: {totalSizeMB} MB
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {results.length > 1 && (
            <button
              type="button"
              onClick={onDownloadZip}
              disabled={zipDownloading}
              className="flex items-center gap-2 px-5 py-3 bg-green-primary hover:bg-green-dark disabled:bg-green-primary/50 text-white rounded-xl font-extrabold text-xs transition-colors shadow-md uppercase tracking-wider cursor-pointer"
            >
              <Archive className="h-4 w-4" />
              <span>{zipDownloading ? "Gerando ZIP..." : "BAIXAR TODAS EM ZIP"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetAll}
            className="flex items-center gap-2 px-4 py-3 bg-card-inner border border-border-main hover:border-green-primary text-text-sec hover:text-green-light rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Novo lote</span>
          </button>
        </div>
      </div>

      {/* Grid of Processed Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((res) => (
          <div
            key={res.id}
            className="bg-card-inner border border-border-main rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-green-primary/50 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-[#181d22] border border-border-main rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={res.dataUrl}
                  alt={res.outputFileName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="font-bold text-xs text-text-main truncate" title={res.outputFileName}>
                  {res.outputFileName}
                </h4>
                <div className="text-[10px] font-mono text-text-muted flex items-center gap-2">
                  <span className="bg-card-main px-1.5 py-0.5 rounded border border-border-main/50 text-green-primary font-bold">
                    {res.format}
                  </span>
                  <span>{res.width} × {res.height} px</span>
                </div>
                <div className="text-[10px] text-text-sec font-semibold truncate">
                  {(res.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {res.transformSummary}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownloadSingle(res)}
              className="w-full py-2 bg-card-main hover:bg-green-primary/10 border border-border-main hover:border-green-primary text-green-light rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-green-primary" />
              <span>Baixar imagem</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
