import React, { useEffect, useState } from "react";
import { Scissors, RefreshCw, Image as ImageIcon } from "lucide-react";

interface BackgroundRemovalSelectedProps {
  file: File;
  onStartRemoval: () => void;
  onChooseAnother: () => void;
}

export const BackgroundRemovalSelected: React.FC<BackgroundRemovalSelectedProps> = ({
  file,
  onStartRemoval,
  onChooseAnother
}) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const fileSizeFormatted = (file.size / (1024 * 1024)).toFixed(2);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-card-main border border-border-main rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        {/* Preview image */}
        <div className="w-full h-64 md:h-80 bg-black/60 rounded-2xl border border-border-main overflow-hidden flex items-center justify-center p-3 relative">
          {previewUrl && (
            <img
              src={previewUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs md:text-sm font-semibold text-text-sec px-1 border-b border-border-main/60 pb-4">
          <div className="flex items-center gap-2 truncate max-w-full">
            <ImageIcon className="h-4 w-4 text-green-primary shrink-0" />
            <span className="truncate text-text-main font-bold" title={file.name}>
              {file.name}
            </span>
          </div>
          <span className="shrink-0 text-text-muted">
            {dimensions ? `${dimensions.width} × ${dimensions.height} px` : "Carregando..."} • {fileSizeFormatted} MB
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onStartRemoval}
            className="w-full py-4 bg-green-primary hover:bg-green-light text-bg-main font-bold text-base rounded-2xl transition-all shadow-lg hover:shadow-green-primary/20 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wide"
          >
            <Scissors className="h-5 w-5" />
            <span>Remover fundo</span>
          </button>

          <button
            type="button"
            onClick={onChooseAnother}
            className="w-full py-2.5 text-xs font-semibold text-text-sec hover:text-text-main transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Escolher outra imagem</span>
          </button>
        </div>
      </div>
    </div>
  );
};
