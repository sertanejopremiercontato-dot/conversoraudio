import React, { useRef, useState } from "react";
import { Upload, FileText, ShieldCheck, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

interface PdfTextUploadProps {
  onFileSelected: (file: File) => void;
}

export const PdfTextUpload: React.FC<PdfTextUploadProps> = ({ onFileSelected }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    setErrorMsg(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg("O arquivo excede o limite máximo de 100 MB. Escolha um PDF menor.");
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setErrorMsg("Formato não suportado. Envie um arquivo no formato PDF.");
      return;
    }

    onFileSelected(file);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all cursor-pointer overflow-hidden ${
          isDragging
            ? "border-green-primary bg-green-primary/10 scale-[1.01]"
            : "border-border-main hover:border-green-primary/60 bg-card-main shadow-lg"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-5 max-w-md mx-auto">
          <div className="p-4 bg-card-inner border border-border-main rounded-2xl text-green-primary shadow-inner">
            <Upload className="h-10 w-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <p className="font-bold text-base md:text-lg text-text-main">
              Arraste seu arquivo PDF aqui ou clique para selecionar
            </p>
            <p className="text-xs text-text-sec font-medium">
              Suporta documentos PDF de até <strong>100 MB</strong>
            </p>
          </div>

          <button
            type="button"
            className="w-full sm:w-auto px-8 py-4 bg-green-primary hover:bg-green-light text-bg-main font-bold text-sm md:text-base rounded-2xl transition-all shadow-md hover:shadow-green-primary/20 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wide"
          >
            <FileText className="h-5 w-5" />
            <span>SELECIONAR PDF</span>
          </button>

          <div className="pt-2 border-t border-border-main/60 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-green-primary" />
            <span>Seus arquivos não ficam salvos. Todo o processamento ocorre no seu navegador.</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs md:text-sm font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
