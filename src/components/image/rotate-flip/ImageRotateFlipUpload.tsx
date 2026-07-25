import React, { useRef } from "react";
import { Upload, Image as ImageIcon, ShieldCheck, AlertCircle } from "lucide-react";

interface ImageRotateFlipUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const MAX_SINGLE_IMAGE_SIZE = 25 * 1024 * 1024; // 25 MB
export const MAX_BATCH_SIZE = 300 * 1024 * 1024; // 300 MB
export const MAX_IMAGES_COUNT = 50;

export default function ImageRotateFlipUpload({
  onFilesSelected,
  disabled = false
}: ImageRotateFlipUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-[24px] p-8 md:p-12 text-center transition-all ${
        disabled
          ? "border-border-main bg-card-main/50 opacity-60 cursor-not-allowed"
          : "border-green-primary/40 hover:border-green-primary bg-card-main hover:bg-card-inner cursor-pointer group shadow-sm hover:shadow-md"
      }`}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/bmp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-[#303943] text-green-primary rounded-2xl border border-border-main flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-inner">
          <Upload className="h-8 w-8" />
        </div>

        <div>
          <h3 className="font-display text-lg font-bold text-text-main group-hover:text-green-light transition-colors">
            Arraste suas imagens para cá ou clique para selecionar
          </h3>
          <p className="text-xs text-text-sec mt-1 font-semibold">
            Suporta JPG, JPEG, PNG, WEBP, AVIF e BMP (até 50 imagens no mesmo lote)
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card-inner border border-border-main text-[11px] text-text-muted font-bold">
          <ShieldCheck className="h-3.5 w-3.5 text-green-primary" />
          <span>Seus arquivos não ficam salvos. Processamento 100% no navegador.</span>
        </div>
      </div>
    </div>
  );
}
