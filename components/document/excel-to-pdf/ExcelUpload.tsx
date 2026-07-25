import React, { useRef, useState } from "react";
import { FileSpreadsheet, Upload, ShieldCheck, AlertCircle } from "lucide-react";

interface ExcelUploadProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function ExcelUpload({ onFileSelected, isLoading, error }: ExcelUploadProps) {
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
      onFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all cursor-pointer relative overflow-hidden group ${
          isDragging
            ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
            : "border-slate-800 bg-slate-900/40 hover:border-emerald-500/50 hover:bg-slate-900/70"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          className="hidden"
        />

        <div className="space-y-4 max-w-md mx-auto">
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 inline-block group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="h-10 w-10 mx-auto" />
          </div>

          <div>
            <h3 className="font-display font-bold text-lg md:text-xl text-slate-100 group-hover:text-emerald-400 transition-colors">
              Arraste e solte sua planilha Excel aqui
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Aceita arquivos <strong>XLSX</strong>, <strong>XLS</strong> e <strong>CSV</strong> (Até 50 MB).
            </p>
          </div>

          <div>
            <button
              type="button"
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs md:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              <span>Selecionar Excel</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            Até 50 MB • Até 50 planilhas • Processamento 100% no seu navegador
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl flex items-start gap-3 text-red-300 text-xs">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Privacy Guarantee */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-center gap-2.5 text-center text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>Seus arquivos não ficam salvos. O processamento é totalmente privado no seu computador.</span>
      </div>
    </div>
  );
}
