import React, { useRef, useState } from "react";
import { Upload, FolderOpen, ShieldCheck, Cloud, Sparkles } from "lucide-react";

interface MetadataDropzoneCardV2Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export const MetadataDropzoneCardV2: React.FC<MetadataDropzoneCardV2Props> = ({
  onFileSelected,
  disabled = false
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
      e.target.value = "";
    }
  };

  const formats = ["WAV", "AIFF", "FLAC", "MP3", "M4A", "OGG", "OPUS"];

  return (
    <div
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-[28px] border-2 border-dashed p-6 sm:p-8 md:p-10 text-center transition-all duration-200 cursor-pointer select-none flex flex-col items-center justify-center min-h-[360px] sm:min-h-[390px] h-full ${
        disabled
          ? "opacity-50 cursor-not-allowed border-[#CBD5E1] bg-[#F8FAFC]"
          : isDragActive
          ? "border-[#EC4899] bg-[#FDF2F8] scale-[1.01] shadow-[0_8px_30px_rgba(236,72,153,0.12)]"
          : "border-[#FBCFE8] hover:border-[#EC4899] bg-white hover:bg-[#FDF2F8]/30 shadow-[0_2px_16px_rgba(236,72,153,0.03)]"
      }`}
      id="v2-metadata-dropzone-card"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".wav,.mp3,.flac,.ogg,.opus,.m4a,.aiff,audio/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
        {/* Glow & Upload Cloud Graphic */}
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center">
          {/* Soft outer glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FCE7F3] via-[#FDF2F8] to-[#FCE7F3] animate-pulse -z-10" />
          
          {/* Main glowing sphere */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#EC4899] via-[#F43F5E] to-[#FB7185] flex items-center justify-center shadow-[0_8px_24px_rgba(236,72,153,0.35)] border-2 border-white">
            <div className="relative flex items-center justify-center">
              <Cloud className="w-9 h-9 sm:w-10 sm:h-10 text-white fill-white" />
              <Upload className="w-4 h-4 text-[#E11D48] absolute top-1 left-2.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Sparkle */}
          <div className="absolute -top-1 -right-1 text-[#F472B6]">
            <Sparkles className="w-4 h-4 fill-[#F472B6]" />
          </div>
        </div>

        <div className="space-y-1 text-center">
          <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-[#0B1F44] tracking-tight">
            Arraste e solte seu arquivo de áudio aqui
          </h3>
          <p className="text-xs sm:text-[13px] text-[#5C6F84] font-medium">
            ou clique para selecionar
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="pt-1">
          <button
            type="button"
            className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#F43F5E] hover:from-[#DB2777] hover:to-[#E11D48] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-[0_4px_16px_rgba(236,72,153,0.3)] pointer-events-none transition-all"
          >
            <span>Selecionar Arquivo</span>
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>

        {/* Formats Supported */}
        <p className="text-[11px] sm:text-xs text-[#64748B] font-medium pt-1">
          Formatos suportados: <strong className="text-[#0B1F44]">{formats.join(", ")}</strong>
        </p>

        {/* Security Subtitle */}
        <div className="flex items-center justify-center gap-1.5 text-[10.5px] sm:text-[11.5px] text-[#059669] font-semibold pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
          <span>Processamento 100% no seu navegador. Nada é enviado aos nossos servidores.</span>
        </div>
      </div>
    </div>
  );
};
