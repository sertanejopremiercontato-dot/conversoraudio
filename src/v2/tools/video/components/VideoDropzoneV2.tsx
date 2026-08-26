import React, { useRef, useState } from "react";
import { Film, Upload, FolderOpen, AlertCircle, Lock } from "lucide-react";

interface VideoDropzoneV2Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export const VideoDropzoneV2: React.FC<VideoDropzoneV2Props> = ({
  onFileSelected,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!disabled) setIsDragOver(true);
  };

  const validateAndProcess = (file: File) => {
    setErrorMsg(null);
    const validExtensions = ["mp4", "mov", "m4v", "webm", "mkv", "avi", "ogv", "3gp", "flv"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (!validExtensions.includes(ext) && !file.type.startsWith("video/")) {
      setErrorMsg("Formato inválido. Por favor envie um vídeo nos formatos MP4, MOV, M4V, WebM, MKV, AVI ou 3GP.");
      return;
    }

    if (file.size > 1.5 * 1024 * 1024 * 1024) {
      setErrorMsg("Arquivo muito grande. O limite máximo para processamento no navegador é 1.5 GB.");
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formats = ["MP4", "MOV", "MKV", "AVI", "WebM", "3GP"];

  return (
    <div className="w-full space-y-3" id="v2-video-dropzone-container">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-[28px] md:rounded-[32px] px-6 py-8 sm:py-10 text-center transition-all duration-200 cursor-pointer select-none flex flex-col items-center justify-center ${
          disabled
            ? "opacity-50 pointer-events-none border-[#CBD5E1] bg-[#F8FAFC]"
            : isDragOver
            ? "border-[#8B5CF6] bg-[#FAF5FF] scale-[1.005] shadow-[0_8px_30px_rgba(139,92,246,0.12)]"
            : "border-[#C4B5FD] hover:border-[#8B5CF6] bg-white hover:bg-[#FAF5FF]/30 shadow-[0_4px_20px_rgba(139,92,246,0.04)]"
        }`}
        id="v2-video-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-m4v,video/webm,video/x-matroska,video/avi,video/3gpp,.mp4,.mov,.m4v,.webm,.mkv,.avi,.3gp"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          id="v2-video-file-input"
        />

        <div className="flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto">
          
          {/* Central Purple Frame Icon Box */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] shadow-xs">
            <div className="relative flex items-center justify-center">
              <Film className="w-8 h-8 sm:w-9 sm:h-9 text-[#7C3AED] stroke-[1.75]" />
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7C3AED] absolute top-1.5 left-2 sm:top-2 sm:left-2.5 stroke-[2.75]" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1 text-center">
            <h3 className="text-lg sm:text-xl md:text-[22px] font-black text-[#0F172A] tracking-tight">
              Arraste e solte seu arquivo de vídeo aqui
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium">
              ou clique para selecionar do seu computador ou celular
            </p>
          </div>

          {/* Formats Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
            {formats.map((fmt) => (
              <span
                key={fmt}
                className="px-3.5 py-1 text-xs font-black rounded-lg bg-white text-[#6D28D9] border border-[#E2E8F0] shadow-2xs"
              >
                {fmt}
              </span>
            ))}
          </div>

          {/* Primary Action Button */}
          <div className="pt-1.5">
            <button
              type="button"
              className="min-w-[230px] h-[48px] px-8 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:from-[#4F46E5] hover:to-[#6D28D9] text-white text-sm font-black flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(99,102,241,0.35)] pointer-events-none transition-all"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Selecionar Vídeo</span>
            </button>
          </div>

          {/* Privacy footer */}
          <div className="flex items-center justify-center gap-1.5 text-[11.5px] sm:text-xs text-[#059669] font-medium pt-1">
            <Lock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            <span>Processamento 100% no navegador. Seus vídeos não são enviados para a nuvem.</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

