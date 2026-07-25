import React from "react";
import { Download, RefreshCw, CheckCircle2 } from "lucide-react";
import { triggerDownload } from "../../../utils/downloadZip";

interface BackgroundRemovalResultProps {
  cutoutBlob: Blob;
  cutoutUrl: string;
  originalFileName: string;
  width: number;
  height: number;
  onReset: () => void;
  onDownloadClicked?: () => void;
}

export const BackgroundRemovalResult: React.FC<BackgroundRemovalResultProps> = ({
  cutoutBlob,
  cutoutUrl,
  originalFileName,
  width,
  height,
  onReset,
  onDownloadClicked
}) => {
  // Generate file name: nome-original-sem-fundo.png
  const getOutputFileName = () => {
    const lastDotIndex = originalFileName.lastIndexOf(".");
    const baseName = lastDotIndex > 0 ? originalFileName.substring(0, lastDotIndex) : originalFileName;
    return `${baseName}-sem-fundo.png`;
  };

  const handleDownload = () => {
    const outputName = getOutputFileName();
    triggerDownload(cutoutBlob, outputName);
    if (onDownloadClicked) {
      onDownloadClicked();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success Notification */}
      <div className="p-4 bg-green-primary/10 border border-green-primary/30 rounded-2xl flex items-center justify-center gap-2 text-green-primary text-sm font-bold text-center">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <span>Fundo removido com sucesso.</span>
      </div>

      {/* Result Card */}
      <div className="bg-card-main border border-border-main rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        {/* Transparent image centered over checkered background */}
        <div className="w-full h-80 sm:h-96 md:h-[420px] bg-[radial-gradient(#ffffff25_1px,transparent_1px)] [background-size:16px_16px] bg-black/80 rounded-2xl border border-border-main overflow-hidden flex items-center justify-center p-4 relative">
          <img
            src={cutoutUrl}
            alt="Fundo removido"
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-2">
          {/* Main green download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-4 bg-green-primary hover:bg-green-light text-bg-main font-bold text-base md:text-lg rounded-2xl transition-all shadow-lg hover:shadow-green-primary/20 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wide"
          >
            <Download className="h-5 w-5" />
            <span>Baixar PNG</span>
          </button>

          {/* Secondary button */}
          <button
            type="button"
            onClick={onReset}
            className="w-full py-3 bg-card-inner border border-border-main hover:border-green-primary/50 rounded-2xl text-xs md:text-sm font-bold text-text-main hover:text-green-light transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Remover fundo de outra imagem</span>
          </button>
        </div>

        {/* Image specs note */}
        <p className="text-center text-xs text-text-sec font-semibold">
          Resolução original: {width} × {height} px • Formato PNG Transparente
        </p>
      </div>
    </div>
  );
};
