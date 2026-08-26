import React, { useRef } from "react";
import { Upload, Music, ShieldCheck, Zap, FileAudio, AlertCircle } from "lucide-react";

interface MetadataUploaderProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  loadingStatus: string;
  errorMessage: string | null;
}

export const MetadataUploader: React.FC<MetadataUploaderProps> = ({
  onFileSelected,
  isLoading,
  loadingStatus,
  errorMessage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2FE] border border-[#0284C7]/30 text-[#0284C7] text-xs font-bold uppercase tracking-wider">
          <Zap className="h-3.5 w-3.5" /> ANÁLISE E INSPEÇÃO GRATUITA NO NAVEGADOR
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-[#0F172A]">
          Editor e Leitor de Metadados de Áudio
        </h2>
        <p className="text-sm text-[#475569] max-w-2xl mx-auto font-medium">
          Inspecione, edite ou remova tags ID3, RIFF e VorbisComments de arquivos de áudio sem perda de qualidade e sem envio para servidores.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-bold">Atenção ao analisar o arquivo</p>
            <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 group overflow-hidden ${
          isLoading
            ? "border-[#0284C7]/50 bg-[#E0F2FE]/30 cursor-wait"
            : "border-[#E2E8F0] hover:border-[#0284C7] bg-[#F8FAFC] hover:bg-white shadow-sm"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.m4a,.mp4,.aac,.ogg,.opus"
          onChange={handleFileInput}
          disabled={isLoading}
          className="hidden"
        />

        {isLoading ? (
          <div className="space-y-4 py-6">
            <div className="w-12 h-12 border-4 border-[#0284C7] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <p className="text-base font-extrabold text-[#0284C7]">{loadingStatus}</p>
              <p className="text-xs text-[#475569] mt-1">Analisando tags binárias sem enviar arquivo...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E0F2FE] border border-[#0284C7]/20 text-[#0284C7] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8" />
            </div>

            <div>
              <p className="text-base font-extrabold text-[#0F172A]">
                Arraste seu arquivo de áudio aqui ou <span className="text-[#0284C7] underline decoration-2 underline-offset-4">clique para selecionar</span>
              </p>
              <p className="text-xs text-[#475569] mt-1 font-medium">
                Suporta MP3, WAV, FLAC, M4A, AAC e áudios do WhatsApp
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-[#475569]">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] font-bold">100% Grátis para Analisar</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] font-bold">Sem envio de arquivo para servidor</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] font-bold">Zero perda de qualidade</span>
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex items-start gap-3 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-[#0284C7] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#0F172A]">Análise Privada Local</p>
            <p className="text-[11px] text-[#475569] mt-0.5">O arquivo é inspecionado diretamente no seu navegador via ArrayBuffer.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex items-start gap-3 shadow-sm">
          <FileAudio className="h-5 w-5 text-[#0284C7] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#0F172A]">Suporte a Áudios WhatsApp</p>
            <p className="text-[11px] text-[#475569] mt-0.5">Lê corretamente metadados em arquivos gravados ou baixados de mensagens.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex items-start gap-3 shadow-sm">
          <Music className="h-5 w-5 text-[#0284C7] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#0F172A]">Tags e Capas Completas</p>
            <p className="text-[11px] text-[#475569] mt-0.5">Veja título, artista, álbum, ano, gênero, comentários e capa embutida.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
