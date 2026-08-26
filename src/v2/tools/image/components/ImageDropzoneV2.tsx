import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, ShieldCheck, Plus } from "lucide-react";

interface ImageDropzoneV2Props {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  acceptedFormatsText?: string;
  isCompact?: boolean;
  disabled?: boolean;
}

export const ImageDropzoneV2: React.FC<ImageDropzoneV2Props> = ({
  onFilesSelected,
  multiple = true,
  acceptedFormatsText = "JPG, PNG, WEBP, GIF ou BMP",
  isCompact = false,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)
    );

    if (droppedFiles.length > 0) {
      onFilesSelected(multiple ? droppedFiles : [droppedFiles[0]]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(multiple ? selectedFiles : [selectedFiles[0]]);
      e.target.value = "";
    }
  };

  if (isCompact) {
    return (
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-all ${
          isDragOver
            ? "border-[#0284C7] bg-[#E0F2FE]/50 text-[#0284C7]"
            : "border-[#CBD5E1] hover:border-[#94A3B8] bg-[#F8FAFC] text-[#64748B]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp"
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <Plus className="w-5 h-5 text-[#0284C7]" />
        <span className="text-xs font-bold text-[#334155]">
          {multiple ? "Adicionar mais fotos" : "Trocar imagem"}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ${
        isDragOver
          ? "border-[#0284C7] bg-[#E0F2FE]/40 scale-[1.01]"
          : "border-[#CBD5E1] hover:border-[#0284C7] bg-white hover:bg-[#F8FAFC]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp"
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mx-auto shadow-xs group-hover:scale-105 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg md:text-xl font-bold text-[#0F172A]">
            Arraste suas fotos ou clique para escolher
          </h3>
          <p className="text-xs text-[#64748B]">
            Formatos suportados: <strong className="text-[#334155]">{acceptedFormatsText}</strong>
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-4 text-[11px] font-bold text-[#16A34A]">
          <div className="flex items-center gap-1.5 bg-[#F0FDF4] px-3 py-1 rounded-full border border-[#DCFCE7]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Processamento 100% no seu dispositivo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
