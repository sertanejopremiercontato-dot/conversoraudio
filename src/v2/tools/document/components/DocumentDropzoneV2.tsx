import React, { useRef, useState } from "react";
import { Upload, FileSpreadsheet, FileText, AlertCircle, Loader2 } from "lucide-react";

interface DocumentDropzoneV2Props {
  accept: string;
  title: string;
  subtitle: string;
  buttonText: string;
  iconType: "excel" | "word" | "doc";
  isLoading?: boolean;
  error?: string | null;
  onFileSelected: (file: File) => void;
  maxSizeBytes?: number;
}

export const DocumentDropzoneV2: React.FC<DocumentDropzoneV2Props> = ({
  accept,
  title,
  subtitle,
  buttonText,
  iconType,
  isLoading = false,
  error = null,
  onFileSelected,
  maxSizeBytes = 30 * 1024 * 1024
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPass(e.target.files[0]);
    }
  };

  const validateAndPass = (file: File) => {
    if (file.size > maxSizeBytes) {
      alert(`O arquivo excede o limite máximo permitido de ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`);
      return;
    }
    onFileSelected(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isLoading) {
            inputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer select-none relative overflow-hidden ${
          isDragOver
            ? "border-[#0284C7] bg-[#E0F2FE]/50 shadow-md scale-[1.005]"
            : isLoading
              ? "border-[#0284C7]/50 bg-[#F8FAFC] cursor-wait"
              : "border-[#CBD5E1] hover:border-[#0284C7] bg-[#F8FAFC] hover:bg-white shadow-xs hover:shadow-md"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-inner transition-transform group-hover:scale-105">
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : iconType === "excel" ? (
              <FileSpreadsheet className="w-8 h-8" />
            ) : (
              <FileText className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{buttonText}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-600 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-red-700">Atenção ao selecionar o arquivo</p>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};
