/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { CheckCircle2, Download, RefreshCw, Play, Pause, Music, Volume2, ShieldCheck, HardDrive } from "lucide-react";

export interface VideoConversionResultData {
  outputFileName: string;
  outputBlobUrl: string;
  outputBlob: Blob;
  format: "mp3" | "wav";
  originalSize: number;
  finalSize: number;
  duration: number;
  qualityChosen: string;
}

interface VideoConversionResultProps {
  result: VideoConversionResultData;
  onReset: () => void;
}

export default function VideoConversionResult({ result, onReset }: VideoConversionResultProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const savingsPercent = Math.max(0, Math.round(((result.originalSize - result.finalSize) / result.originalSize) * 100));

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error(e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = result.outputBlobUrl;
    a.download = result.outputFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 md:p-8 space-y-6 max-w-xl mx-auto shadow-sm animate-fadeIn">
      <div className="text-center space-y-2">
        <div className="p-3 bg-[#ECFDF5] border border-[#10B981]/20 text-[#10B981] rounded-2xl w-fit mx-auto">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-extrabold text-[#0F172A] font-display">
          Áudio Extraído com Sucesso!
        </h3>
        <p className="text-xs text-[#475569]">
          O arquivo de áudio foi gerado e está pronto para ser salvo.
        </p>
      </div>

      {/* Audio Player Card */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              type="button"
              onClick={togglePlay}
              className="p-3 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl transition-all cursor-pointer shrink-0 shadow-sm"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <div className="overflow-hidden">
              <h4 className="font-bold text-[#0F172A] text-xs md:text-sm truncate" title={result.outputFileName}>
                {result.outputFileName}
              </h4>
              <p className="text-[11px] text-[#475569] flex items-center gap-2">
                <span>{result.format.toUpperCase()} • {result.qualityChosen}</span>
                <span>•</span>
                <span>{formatDuration(result.duration)}</span>
              </p>
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={result.outputBlobUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1">
          <span className="text-[#475569] text-[10px] block">Tamanho do Vídeo</span>
          <p className="font-bold text-[#0F172A]">{formatBytes(result.originalSize)}</p>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1">
          <span className="text-[#475569] text-[10px] block">Tamanho do Áudio</span>
          <p className="font-bold text-[#10B981]">{formatBytes(result.finalSize)}</p>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1 col-span-2 md:col-span-1">
          <span className="text-[#475569] text-[10px] block">Redução de Tamanho</span>
          <p className="font-bold text-[#0284C7]">{savingsPercent}% Menor</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 py-3.5 px-6 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Download className="h-5 w-5" />
          <span>BAIXAR ÁUDIO ({result.format.toUpperCase()})</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="py-3.5 px-5 bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className="h-4 w-4 text-[#0284C7]" />
          <span>Converter Outro Vídeo</span>
        </button>
      </div>

      <div className="text-[11px] text-[#64748B] text-center flex items-center justify-center gap-1.5 pt-1 border-t border-[#E2E8F0]">
        <ShieldCheck className="h-4 w-4 text-[#0284C7] shrink-0" />
        <span>Processamento 100% local no seu navegador. Nenhum arquivo foi enviado a servidores.</span>
      </div>
    </div>
  );
}
