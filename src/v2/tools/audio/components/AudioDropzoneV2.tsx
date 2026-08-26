import React, { useRef, useState } from "react";
import { Upload, Music, ShieldCheck, Sparkles, FolderOpen, Cloud } from "lucide-react";

interface AudioDropzoneV2Props {
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
}

export const AudioDropzoneV2: React.FC<AudioDropzoneV2Props> = ({
  onFilesSelected,
  disabled = false
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      e.target.value = "";
    }
  };

  const formats = ["MP3", "WAV", "FLAC", "M4A", "OGG", "AAC", "AIFF"];

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-[28px] border-2 border-dashed p-8 sm:p-10 md:p-12 text-center transition-all duration-200 cursor-pointer select-none flex flex-col items-center justify-center min-h-[380px] sm:min-h-[420px] h-full ${
        disabled
          ? "opacity-50 cursor-not-allowed border-[#CBD5E1] bg-[#F8FAFC]"
          : isDragActive
          ? "border-[#1D68F2] bg-[#EFF6FF] shadow-lg scale-[0.99]"
          : "border-[#60A5FA] bg-white hover:border-[#1D68F2] hover:bg-[#F8FBFF] shadow-[0_2px_16px_rgba(29,104,242,0.03)]"
      }`}
      id="v2-audio-dropzone"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="audio/*,video/mp4,video/webm,video/quicktime,video/x-matroska,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.aiff,.aif,.caf,.mp4,.mov,.webm"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center space-y-5 max-w-md mx-auto">
        {/* Stylized Cloud + Music Graphic as in Reference */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Soft outer glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#DBEAFE] via-[#EFF6FF] to-[#DBEAFE] animate-pulse -z-10" />
          
          {/* Main glowing sphere */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#93C5FD] via-[#60A5FA] to-[#1D68F2] flex items-center justify-center shadow-[0_10px_25px_rgba(29,104,242,0.3)] border-2 border-white">
            <div className="relative flex items-center justify-center">
              <Cloud className="w-10 h-10 text-white fill-white" />
              <Upload className="w-4 h-4 text-[#1D68F2] absolute top-1.5 left-3 stroke-[2.5]" />
            </div>
          </div>

          {/* Floating Music Note Bubble */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-[#BFDBFE] flex items-center justify-center shadow-md text-[#1D68F2]">
            <Music className="w-4 h-4 text-[#1D68F2]" />
          </div>

          {/* Sparkle */}
          <div className="absolute -top-1 -left-1 text-[#38BDF8]">
            <Sparkles className="w-4 h-4 fill-[#38BDF8]" />
          </div>
        </div>

        <div className="space-y-1 text-center">
          <h3 className="text-lg sm:text-xl font-black text-[#0B1F44] tracking-tight">
            Arraste e solte seu arquivo de áudio aqui
          </h3>
          <p className="text-xs sm:text-[13px] text-[#5C6F84] font-medium">
            ou clique para selecionar do seu computador ou celular
          </p>
        </div>

        {/* Formats badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 max-w-sm">
          {formats.map((fmt) => (
            <span
              key={fmt}
              className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-[#EFF6FF] text-[#1D68F2] border border-[#BFDBFE]"
            >
              {fmt}
            </span>
          ))}
        </div>

        {/* Primary Action Button */}
        <div className="pt-1">
          <button
            type="button"
            className="px-7 py-3 rounded-xl bg-[#1D68F2] hover:bg-[#1554C7] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-[0_4px_16px_rgba(29,104,242,0.3)] pointer-events-none transition-all"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Selecionar Arquivo</span>
          </button>
        </div>

        {/* Security subtitle */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#059669] font-semibold pt-1">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span>Leitura 100% no navegador (client-side, seguro e privado)</span>
        </div>
      </div>
    </div>
  );
};

