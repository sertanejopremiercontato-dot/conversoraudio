import React, { useRef, useState } from "react";
import { UploadCloud, FileAudio, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface MetadataDropzoneV2Props {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  loadingStep?: string;
  hasFile?: boolean;
  onReset?: () => void;
}

export const MetadataDropzoneV2: React.FC<MetadataDropzoneV2Props> = ({
  onFileSelected,
  isLoading,
  loadingStep = "LENDO METADADOS",
  hasFile = false,
  onReset
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelected(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
      // Reset input value so same file can be re-selected if needed
      e.target.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/60 rounded-3xl p-10 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-bold rounded-full font-mono">
            {loadingStep}
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Analisando Tags & Metadados Reais
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Identificando cabeçalhos ID3, Vorbis, RIFF, capas embutidas e informações técnicas do arquivo sem alterar o áudio.
          </p>
        </div>
      </div>
    );
  }

  if (hasFile) {
    return (
      <div className="bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            Arquivo carregado com sucesso. Você pode editar os campos abaixo ou trocar de arquivo.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
          >
            Trocar Arquivo
          </button>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            >
              Limpar
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.aiff"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
        isDragOver
          ? "border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 scale-[0.99]"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-sky-400 dark:hover:border-sky-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 shadow-xs"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.aiff"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-4 border border-sky-100 dark:border-sky-900/40">
        <UploadCloud className="w-8 h-8" />
      </div>

      <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
        Arraste e solte sua música ou áudio aqui
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
        Clique para selecionar do seu computador ou celular. Suporte a MP3, WAV, FLAC, M4A, OGG, AAC e AIFF.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
          Nenhum arquivo analisado.
        </span>
        <div className="flex items-center gap-1.5">
          <FileAudio className="w-3.5 h-3.5 text-sky-500" />
          <span>Leitura 100% no navegador (Client-side, seguro e privado)</span>
        </div>
      </div>
    </div>
  );
};
