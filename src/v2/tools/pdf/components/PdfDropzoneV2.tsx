import React, { useRef, useState } from "react";
import { Upload, FileText, Sparkles, Image as ImageIcon } from "lucide-react";

interface PdfDropzoneV2Props {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  badge?: string;
  iconType?: "pdf" | "image";
}

export const PdfDropzoneV2: React.FC<PdfDropzoneV2Props> = ({
  onFilesSelected,
  accept = "application/pdf,.pdf",
  multiple = true,
  title = "Arraste e solte seus arquivos PDF aqui",
  subtitle = "Ou clique no botão abaixo para selecionar do seu computador",
  badge = "Processamento 100% Local & Seguro",
  iconType = "pdf"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all cursor-pointer ${
        isDragging
          ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
          : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
          {iconType === "image" ? <ImageIcon className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Selecionar Arquivos</span>
          </button>
        </div>

        {badge && (
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              {badge}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
