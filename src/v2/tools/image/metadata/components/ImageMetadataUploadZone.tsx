import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, Sparkles, FileText, CheckCircle } from "lucide-react";

interface ImageMetadataUploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  onGenerateTestImage?: () => void;
}

export const ImageMetadataUploadZone: React.FC<ImageMetadataUploadZoneProps> = ({
  onFileSelect,
  isLoading,
  onGenerateTestImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|avif|heic|tiff)$/i.test(file.name)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4" id="image-metadata-upload-container">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-[24px] p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] ${
          isDragging
            ? "border-[#10B981] bg-[#ECFDF5]/60 scale-[1.008]"
            : "border-[#CBD5E1] hover:border-[#10B981]/60 bg-white hover:bg-[#F8FAFC]"
        }`}
        id="image-metadata-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={handleFileInputChange}
          id="input-file-image-metadata"
        />

        <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center mb-4 shadow-xs">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-md">
          <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
            Arraste sua imagem ou clique para selecionar
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Formatos suportados: <strong className="text-[#334155]">JPG, JPEG, PNG, WEBP</strong> (análise física binária)
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-[#475569] text-xs font-semibold">
            EXIF
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-[#475569] text-xs font-semibold">
            GPS / Localização
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-[#475569] text-xs font-semibold">
            XMP Dublin Core
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-[#475569] text-xs font-semibold">
            IPTC / Photoshop
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-[#475569] text-xs font-semibold">
            Perfil ICC
          </span>
        </div>
      </div>

      {onGenerateTestImage && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateTestImage();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-xs font-bold text-[#059669] transition-all cursor-pointer shadow-2xs"
            id="btn-load-test-image-with-metadata"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Carregar Imagem de Teste com GPS, Câmera e Metadados</span>
          </button>
        </div>
      )}
    </div>
  );
};
