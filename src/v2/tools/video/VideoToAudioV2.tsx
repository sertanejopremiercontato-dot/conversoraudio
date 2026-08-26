import React, { useState, useRef, useEffect } from "react";
import { 
  VideoMetadataV2, 
  VideoOutputConfigV2, 
  VideoResultV2 
} from "./types";
import { VideoDropzoneV2 } from "./components/VideoDropzoneV2";
import { VideoInfoCardV2 } from "./components/VideoInfoCardV2";
import { VideoOutputSettingsV2 } from "./components/VideoOutputSettingsV2";
import { VideoProgressV2 } from "./components/VideoProgressV2";
import { VideoResultV2 as VideoResultPanelV2 } from "./components/VideoResultV2";
import { VideoHeroV2 } from "./components/VideoHeroV2";
import { VideoStepsBarV2 } from "./components/VideoStepsBarV2";
import { VideoBenefitsV2 } from "./components/VideoBenefitsV2";
import { analyzeVideoFileV2, extractAudioFromVideoV2 } from "./services/videoEngineV2";
import { 
  encodeMp3BlobWithWorker, 
  encodeWavBlob, 
  encodeWithWebCodecs, 
  resampleAndMixAudio 
} from "../audio/services/audioEncoderService";
import { trackEventV2 } from "../../integrations/analytics";
import { 
  Film, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Star,
  RefreshCw,
  Sliders,
  Volume2
} from "lucide-react";

interface VideoToAudioV2Props {
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const VideoToAudioV2: React.FC<VideoToAudioV2Props> = ({
  onBack,
  onNavigateTab
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadataV2 | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<{ title: string; message: string } | null>(null);

  const [config, setConfig] = useState<VideoOutputConfigV2>({
    format: "mp3",
    mp3Kbps: 112,
    aacKbps: 128,
    wavSampleRate: "original",
    wavBitDepth: 16,
    wavChannels: "original",
    flacBitDepth: "original",
    oggKbps: 128,
    hasAcceptedTerms: true
  });

  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progressStage, setProgressStage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [conversionResult, setConversionResult] = useState<VideoResultV2 | null>(null);

  const isCancelledRef = useRef<boolean>(false);
  const activeWorkerRef = useRef<Worker | null>(null);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      cleanupMemory();
    };
  }, []);

  const cleanupMemory = () => {
    if (activeWorkerRef.current) {
      activeWorkerRef.current.terminate();
      activeWorkerRef.current = null;
    }
    if (conversionResult?.outputBlobUrl) {
      URL.revokeObjectURL(conversionResult.outputBlobUrl);
    }
  };

  const handleFileSelect = async (file: File) => {
    cleanupMemory();
    setSelectedFile(file);
    setVideoMetadata(null);
    setAnalysisError(null);
    setConversionResult(null);
    setIsAnalyzing(true);

    try {
      const metadata = await analyzeVideoFileV2(file);
      setVideoMetadata(metadata);
      
      if (metadata.status === "NO_AUDIO_TRACK_FOUND") {
        setAnalysisError({
          title: "TRILHA DE ÁUDIO AUSENTE",
          message: "O container deste vídeo foi inspecionado e não contém nenhuma trilha de áudio gravada."
        });
      } else if (metadata.status === "AUDIO_TRACK_FOUND_BUT_UNSUPPORTED_CODEC") {
        setAnalysisError({
          title: "CODEC DE ÁUDIO NÃO SUPORTADO",
          message: `A trilha de áudio foi detectada (${metadata.audioTracks[0]?.codec}), porém o formato não é decodificável pelo motor nativo.`
        });
      }
    } catch (err: any) {
      console.error("Erro no probe de mídia:", err);
      setAnalysisError({
        title: "FALHA AO ANALISAR CONTAINER",
        message: err.message || "Erro ao ler a estrutura do arquivo de vídeo."
      });
      setSelectedFile(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectAudioTrack = (trackIndex: number) => {
    if (videoMetadata) {
      setVideoMetadata({
        ...videoMetadata,
        selectedAudioTrackIndex: trackIndex
      });
    }
  };

  const handleStartExtraction = async () => {
    if (!selectedFile || !videoMetadata || !config.hasAcceptedTerms) return;
    
    if (videoMetadata.status === "NO_AUDIO_TRACK_FOUND" || !videoMetadata.hasAudioTrack) {
      setAnalysisError({
        title: "TRILHA DE ÁUDIO AUSENTE",
        message: "O vídeo selecionado não contém faixa de áudio para extração."
      });
      return;
    }

    if (videoMetadata.status === "AUDIO_TRACK_FOUND_BUT_UNSUPPORTED_CODEC") {
      setAnalysisError({
        title: "CODEC DE ÁUDIO NÃO SUPORTADO",
        message: "O codec de áudio detectado no vídeo não possui suporte nativo para extração direta."
      });
      return;
    }

    setIsConverting(true);
    setProgressPercent(5);
    setProgressStage("Iniciando extração estrutural do áudio...");
    isCancelledRef.current = false;
    setAnalysisError(null);

    let qualityStr = "";
    if (config.format === "mp3") qualityStr = `${config.mp3Kbps} kbps`;
    else if (config.format === "aac") qualityStr = `${config.aacKbps} kbps`;
    else if (config.format === "wav") qualityStr = `PCM ${config.wavBitDepth || 16}-bit (${config.wavSampleRate === "original" ? "Original" : config.wavSampleRate + " Hz"})`;
    else if (config.format === "ogg") qualityStr = `${config.oggKbps || 128} kbps`;
    else qualityStr = "Lossless Estúdio";

    trackEventV2("video_extraction_started", {
      output_format: config.format,
      input_format: videoMetadata.format.toLowerCase(),
      quality: qualityStr
    });

    try {
      // 1. Extração da faixa de áudio e conversão para Float32Array PCM
      const audioData = await extractAudioFromVideoV2(
        selectedFile,
        (stage, progress) => {
          setProgressStage(stage);
          setProgressPercent(progress);
        },
        () => isCancelledRef.current
      );

      if (isCancelledRef.current) {
        throw new Error("Operação cancelada pelo usuário.");
      }

      setProgressStage(`Codificando áudio em ${config.format.toUpperCase()}...`);
      setProgressPercent(70);

      // 2. Construir AudioBuffer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const tempCtx = new AudioCtx();
      const numChannels = audioData.channels;
      const length = audioData.leftChannel.length;
      const audioBuffer = tempCtx.createBuffer(numChannels, length, audioData.sampleRate);

      audioBuffer.copyToChannel(audioData.leftChannel, 0, 0);
      if (numChannels > 1 && audioData.rightChannel) {
        audioBuffer.copyToChannel(audioData.rightChannel, 1, 0);
      }
      await tempCtx.close();

      // 3. Resample e Mixagem conforme configuração
      const targetRate = config.wavSampleRate === "original" ? audioBuffer.sampleRate : parseInt(config.wavSampleRate, 10);
      const targetChannels = config.wavChannels === "original" ? audioBuffer.numberOfChannels : config.wavChannels === "mono" ? 1 : 2;
      const processedBuffer = await resampleAndMixAudio(
        audioBuffer,
        targetRate,
        targetChannels
      );

      // 4. Codificação de saída
      let outputBlob: Blob | null = null;
      const startTime = performance.now();

      if (config.format === "mp3") {
        outputBlob = await encodeMp3BlobWithWorker(
          processedBuffer,
          config.mp3Kbps,
          (encoderProg) => {
            if (isCancelledRef.current) return;
            setProgressPercent(70 + Math.round(encoderProg * 0.28));
          },
          activeWorkerRef
        );
      } else if (config.format === "wav") {
        outputBlob = encodeWavBlob(processedBuffer, config.wavBitDepth || 16);
        setProgressPercent(95);
      } else if (config.format === "aac" || config.format === "flac" || config.format === "ogg") {
        const bitrate = config.format === "ogg" ? (config.oggKbps || 128) : config.aacKbps;
        outputBlob = await encodeWithWebCodecs(
          processedBuffer,
          config.format,
          bitrate,
          (encoderProg) => {
            if (isCancelledRef.current) return;
            setProgressPercent(70 + Math.round(encoderProg * 0.28));
          }
        );
      }

      if (isCancelledRef.current) {
        throw new Error("Operação cancelada pelo usuário.");
      }

      if (!outputBlob) {
        throw new Error("Falha ao gerar arquivo de áudio final.");
      }

      const elapsedSec = (performance.now() - startTime) / 1000;
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
      const outputFileName = `${baseName}.${config.format}`;
      const outputBlobUrl = URL.createObjectURL(outputBlob);

      setProgressPercent(100);
      setProgressStage("Concluído!");

      setConversionResult({
        outputBlobUrl,
        outputFileName,
        outputBlob,
        format: config.format,
        originalSize: selectedFile.size,
        finalSize: outputBlob.size,
        duration: audioData.duration || videoMetadata.duration,
        qualityChosen: qualityStr
      });

      trackEventV2("video_extraction_completed", {
        output_format: config.format,
        input_format: videoMetadata.format.toLowerCase(),
        duration_seconds: Math.round(audioData.duration || videoMetadata.duration)
      });

    } catch (err: any) {
      if (isCancelledRef.current || err.message?.includes("cancelada")) {
        console.log("Extração cancelada pelo usuário.");
      } else {
        console.error("Erro na extração do áudio:", err);
        const errMsg = err.message || "";
        let errTitle = "FALHA DO ENGINE DE EXTRAÇÃO";
        if (errMsg.includes("memória") || errMsg.includes("memory") || errMsg.includes("1.8 GB")) {
          errTitle = "MEMÓRIA INSUFICIENTE";
        } else if (errMsg.includes("codec") || errMsg.includes("suportado")) {
          errTitle = "CODEC DE ÁUDIO NÃO SUPORTADO";
        }
        setAnalysisError({
          title: errTitle,
          message: errMsg || "Erro durante o processamento do vídeo."
        });
        trackEventV2("video_extraction_failed", {
          error_code: "extraction_error",
          input_format: videoMetadata.format.toLowerCase()
        });
      }
    } finally {
      setIsConverting(false);
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    if (activeWorkerRef.current) {
      activeWorkerRef.current.terminate();
      activeWorkerRef.current = null;
    }
    setIsConverting(false);
    setProgressStage("");
    setProgressPercent(0);
  };

  const handleReset = () => {
    cleanupMemory();
    setSelectedFile(null);
    setVideoMetadata(null);
    setAnalysisError(null);
    setConversionResult(null);
    setIsConverting(false);
    setProgressPercent(0);
    setProgressStage("");
  };

  const handleDownload = () => {
    if (!conversionResult) return;
    const link = document.createElement("a");
    link.href = conversionResult.outputBlobUrl;
    link.download = conversionResult.outputFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    trackEventV2("video_audio_downloaded", {
      output_format: conversionResult.format
    });
  };

  const getMainButtonText = () => {
    if (!videoMetadata) return "EXTRAIR ÁUDIO";
    if (videoMetadata.status === "NO_AUDIO_TRACK_FOUND") {
      return "SEM TRILHA DE ÁUDIO NO VÍDEO";
    }
    if (videoMetadata.status === "AUDIO_TRACK_FOUND_BUT_UNSUPPORTED_CODEC") {
      return `CODEC (${videoMetadata.audioTracks[0]?.codec || "ÁUDIO"}) NÃO SUPORTADO`;
    }
    if (config.format === "mp3") {
      return `EXTRAIR MP3 — ${config.mp3Kbps} KBPS`;
    }
    if (config.format === "wav") {
      const depth = config.wavBitDepth || 16;
      const sr = config.wavSampleRate === "original" ? "ORIGINAL" : `${parseInt(config.wavSampleRate, 10) / 1000} KHZ`;
      return `EXTRAIR WAV — ${depth}-BIT / ${sr}`;
    }
    if (config.format === "aac") {
      return `EXTRAIR AAC — ${config.aacKbps} KBPS`;
    }
    if (config.format === "flac") {
      return "EXTRAIR FLAC — LOSSLESS ESTÚDIO";
    }
    if (config.format === "ogg") {
      return `EXTRAIR OGG — ${config.oggKbps || 128} KBPS`;
    }
    return `EXTRAIR ÁUDIO (${String(config.format).toUpperCase()})`;
  };

  const isExtractionAllowed = 
    videoMetadata && 
    videoMetadata.status === "AUDIO_TRACK_FOUND_AND_SUPPORTED" && 
    config.hasAcceptedTerms;

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-8 md:space-y-10 font-sans" id="v2-video-to-audio-module">
      {/* Unified Hero Section */}
      <VideoHeroV2 onBack={onBack} />

      {/* Global Error Banner */}
      {analysisError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-700 shadow-xs" id="v2-video-error-banner">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-0.5">
            <p className="font-extrabold uppercase tracking-wide text-rose-900">{analysisError.title}</p>
            <p className="leading-relaxed">{analysisError.message}</p>
          </div>
        </div>
      )}

      {/* Main Content: Dropzone */}
      {!selectedFile && !conversionResult && !isAnalyzing && (
        <VideoDropzoneV2
          onFileSelected={handleFileSelect}
          disabled={isAnalyzing}
        />
      )}

      {/* Estado de Análise Ativo */}
      {isAnalyzing && (
        <div className="border border-[#C7D2FE] rounded-[28px] p-12 text-center bg-white shadow-xs flex flex-col items-center justify-center space-y-4" id="v2-video-analyzing-state">
          <RefreshCw className="w-10 h-10 text-[#6366F1] animate-spin" />
          <div className="space-y-1 max-w-md">
            <h3 className="text-base md:text-lg font-extrabold text-[#0F172A]">
              ANALISANDO CONTAINER E TRILHAS...
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Inspecionando átomos do container, mapeando descritores de streams de vídeo e áudio sem decodificar frames redundantes.
            </p>
          </div>
        </div>
      )}

      {/* Workspace com Vídeo Selecionado */}
      {selectedFile && videoMetadata && !conversionResult && (
        <div className="space-y-6" id="v2-video-processing-workspace">
          {/* Video Info Card */}
          <VideoInfoCardV2
            metadata={videoMetadata}
            onRemove={handleReset}
            onSelectAudioTrack={handleSelectAudioTrack}
            disabled={isConverting}
          />

          {/* Settings */}
          {!isConverting && (
            <VideoOutputSettingsV2
              config={config}
              onChange={setConfig}
              disabled={isConverting || videoMetadata.status !== "AUDIO_TRACK_FOUND_AND_SUPPORTED"}
            />
          )}

          {/* Progress Bar */}
          {isConverting && (
            <VideoProgressV2
              stage={progressStage}
              percent={progressPercent}
              onCancel={handleCancel}
            />
          )}

          {/* Action Trigger Button */}
          {!isConverting && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartExtraction}
                disabled={!isExtractionAllowed}
                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                  !isExtractionAllowed
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                    : "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED] text-white shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] active:scale-[0.99]"
                }`}
                id="v2-btn-start-extraction"
              >
                <Zap className="w-5 h-5" />
                <span className="tracking-wide">
                  {getMainButtonText()}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Result Panel */}
      {conversionResult && (
        <VideoResultPanelV2
          result={conversionResult}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )}

      {/* 3 Passos + Card Rápido e Eficiente */}
      <VideoStepsBarV2 />

      {/* 5 Benefícios Inferiores */}
      <VideoBenefitsV2 />
    </div>
  );
};
