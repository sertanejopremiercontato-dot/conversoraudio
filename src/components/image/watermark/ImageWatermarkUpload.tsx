import React, { useRef, useState } from "react";
import { Upload, Image as ImageIcon, AlertCircle, Shield, Layers } from "lucide-react";

interface ImageWatermarkUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
  maxBatchSizeMB?: number;
}

export const ImageWatermarkUpload: React.FC<ImageWatermarkUploadProps> = ({
  onFilesSelected,
  maxFiles = 50,
  maxFileSizeMB = 25,
  maxBatchSizeMB = 300
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndPassFiles = (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const files = Array.from(fileList);

    if (files.length === 0) return;

    if (files.length > maxFiles) {
      setErrorMessage(`Você pode enviar no máximo ${maxFiles} imagens por lote.`);
      return;
    }

    let totalSizeBytes = 0;
    const validFiles: File[] = [];
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/bmp"
    ];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isValidExt = ["jpg", "jpeg", "png", "webp", "avif", "bmp"].includes(ext || "");
      const isValidType = allowedTypes.includes(file.type) || isValidExt;

      if (!isValidType) {
        setErrorMessage(
          `O arquivo "${file.name}" não é uma imagem suportada (use JPG, PNG, WEBP, AVIF ou BMP).`
        );
        return;
      }

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxFileSizeMB) {
        setErrorMessage(
          `A imagem "${file.name}" excede o limite individual de ${maxFileSizeMB} MB.`
        );
        return;
      }

      totalSizeBytes += file.size;
      validFiles.push(file);
    }

    const totalMB = totalSizeBytes / (1024 * 1024);
    if (totalMB > maxBatchSizeMB) {
      setErrorMessage(
        `O tamanho total das imagens (${totalMB.toFixed(1)} MB) excede o limite de ${maxBatchSizeMB} MB por lote.`
      );
      return;
    }

    onFilesSelected(validFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      validateAndPassFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndPassFiles(e.target.files);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[280px] ${
          isDragging
            ? "border-green-primary bg-green-primary/10 scale-[1.01]"
            : "border-border-main hover:border-green-primary/60 bg-card-main/70 hover:bg-card-main"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/bmp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="p-4 bg-[#303943] text-green-primary rounded-2xl border border-border-main mb-4 shadow-inner">
          <Upload className="h-8 w-8" />
        </div>

        <h3 className="font-display text-xl font-bold text-text-main">
          Arraste e solte suas imagens aqui
        </h3>
        <p className="text-sm text-text-sec mt-1 font-semibold max-w-md">
          ou clique para selecionar fotos no seu computador ou celular
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-text-muted">
          <span className="px-3 py-1 bg-card-inner border border-border-main rounded-full flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-green-primary" /> JPG, PNG, WEBP, AVIF, BMP
          </span>
          <span className="px-3 py-1 bg-card-inner border border-border-main rounded-full flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-green-primary" /> Até {maxFiles} imagens
          </span>
          <span className="px-3 py-1 bg-card-inner border border-border-main rounded-full flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-green-primary" /> Até {maxFileSizeMB} MB / foto
          </span>
        </div>

        <button
          type="button"
          className="mt-6 px-6 py-3 bg-green-primary hover:bg-green-light text-bg-main font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-green-primary/20 cursor-pointer"
        >
          Adicionar marca d’água
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-semibold animate-fadeIn">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
