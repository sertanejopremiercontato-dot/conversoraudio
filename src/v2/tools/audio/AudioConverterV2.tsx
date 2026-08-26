import React, { useState, useRef, useEffect } from "react";
import { 
  AudioQueueItemV2, 
  AudioSettingsStateV2 
} from "./types";
import { AudioDropzoneV2 } from "./components/AudioDropzoneV2";
import { AudioSettingsV2 } from "./components/AudioSettingsV2";
import { AudioQueueV2 } from "./components/AudioQueueV2";
import { AudioHeroV2 } from "./components/AudioHeroV2";
import { 
  checkAudioMagicBytes, 
  checkMp4Audio, 
  readAudioMetadata 
} from "./services/audioDecoderService";
import { 
  encodeMp3BlobWithWorker, 
  encodeWavBlob, 
  encodeWithWebCodecs, 
  resampleAndMixAudio 
} from "./services/audioEncoderService";
import { createAudioBatchZipBlob } from "./services/audioZipService";
import { trackEventV2 } from "../../integrations/analytics";
import { 
  Music, 
  ShieldCheck, 
  Zap, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  Layers, 
  Lock, 
  Smartphone, 
  Tag
} from "lucide-react";
import { BenefitsBarV2 } from "../../components/BenefitsBarV2";
import { HowItWorksV2 } from "../../components/HowItWorksV2";

interface AudioConverterV2Props {
  onBack?: () => void;
}

export const AudioConverterV2: React.FC<AudioConverterV2Props> = ({ onBack }) => {
  // State
  const [queue, setQueue] = useState<AudioQueueItemV2[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<AudioSettingsStateV2>({
    format: "mp3",
    mp3Kbps: 112,
    wavSampleRate: "original",
    wavBitDepth: 16,
    wavChannels: "original",
    aacKbps: 128,
    flacSampleRate: "original",
    flacBitDepth: "original",
    oggKbps: 128,
    oggQuality: "medium"
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const activeWorkerRef = useRef<Worker | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

  // Limits
  const isMobileDevice = typeof window !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
  const MAX_FILE_SIZE = isMobileDevice ? 100 * 1024 * 1024 : 700 * 1024 * 1024;
  const MAX_BATCH_SIZE = isMobileDevice ? 300 * 1024 * 1024 : 1500 * 1024 * 1024;
  const MAX_FILES_COUNT = 15;

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (activeWorkerRef.current) {
        activeWorkerRef.current.terminate();
        activeWorkerRef.current = null;
      }
      queue.forEach((item) => {
        if (item.convertedBlobUrl) URL.revokeObjectURL(item.convertedBlobUrl);
        if (item.originalBlobUrl) URL.revokeObjectURL(item.originalBlobUrl);
      });
    };
  }, []);

  const handleFilesSelected = async (fileList: FileList) => {
    setGlobalError(null);
    const filesArray = Array.from(fileList);

    if (queue.length + filesArray.length > MAX_FILES_COUNT) {
      setGlobalError(`Você pode converter no máximo 15 arquivos por lote. A fila atual tem ${queue.length} arquivos.`);
      return;
    }

    const newItems: AudioQueueItemV2[] = [];
    let currentBatchSize = queue.reduce((sum, item) => sum + item.originalSize, 0);

    for (const file of filesArray) {
      if (file.size > MAX_FILE_SIZE) {
        const limitMb = Math.round(MAX_FILE_SIZE / (1024 * 1024));
        setGlobalError(`O arquivo "${file.name}" ultrapassa o limite máximo de ${limitMb}MB.`);
        continue;
      }

      if (currentBatchSize + file.size > MAX_BATCH_SIZE) {
        const totalMb = Math.round(MAX_BATCH_SIZE / (1024 * 1024));
        setGlobalError(`O tamanho total do lote ultrapassará o limite de ${totalMb}MB.`);
        break;
      }

      // Validação de magic bytes
      const isValid = await checkAudioMagicBytes(file);
      if (!isValid && !file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
        setGlobalError(`O arquivo "${file.name}" não é um arquivo de áudio ou vídeo suportado.`);
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const originalBlobUrl = URL.createObjectURL(file);

      newItems.push({
        id,
        file,
        name: file.name,
        originalSize: file.size,
        duration: null,
        channels: null,
        status: "aguardando",
        progress: 0,
        originalBlobUrl
      });

      currentBatchSize += file.size;
    }

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
      setSelectedIds((prev) => [...prev, ...newItems.map((item) => item.id)]);

      // Extrai metadados assincronamente em segundo plano
      newItems.forEach((item) => {
        readAudioMetadata(item.file).then((meta) => {
          setQueue((prev) => prev.map((q) => q.id === item.id ? { 
            ...q, 
            duration: meta.duration, 
            channels: meta.channels,
            sampleRate: meta.sampleRate,
            formatDetected: meta.formatDetected,
            bitDepth: meta.bitDepth,
            bitrateKbps: meta.bitrateKbps
          } : q));
        }).catch((err: any) => {
          console.warn("Metadados não extraídos para:", item.name, err);
          const errMsg = err?.message || "Não foi possível carregar metadados deste arquivo.";
          setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, errorMessage: errMsg } : q));
        });
      });
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === queue.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(queue.map((item) => item.id));
    }
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        if (item.convertedBlobUrl) URL.revokeObjectURL(item.convertedBlobUrl);
        if (item.originalBlobUrl) URL.revokeObjectURL(item.originalBlobUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleClearQueue = () => {
    queue.forEach((item) => {
      if (item.convertedBlobUrl) URL.revokeObjectURL(item.convertedBlobUrl);
      if (item.originalBlobUrl) URL.revokeObjectURL(item.originalBlobUrl);
    });
    setQueue([]);
    setSelectedIds([]);
    setGlobalError(null);
  };

  const handleCancelQueue = () => {
    isCancelledRef.current = true;
    if (activeWorkerRef.current) {
      activeWorkerRef.current.terminate();
      activeWorkerRef.current = null;
    }
    setIsProcessing(false);
    setQueue((prev) => prev.map((item) => item.status === "convertendo" || item.status === "preparando" ? { ...item, status: "cancelado", progress: 0 } : item));
  };

  const handleConvertItems = async (targetIds?: string[]) => {
    if (queue.length === 0 || isProcessing) return;
    setIsProcessing(true);
    isCancelledRef.current = false;
    setGlobalError(null);

    // Converte sequencialmente para manter estabilidade na CPU/Memória
    for (let i = 0; i < queue.length; i++) {
      if (isCancelledRef.current) break;
      const currentItem = queue[i];
      if (currentItem.status === "concluido") continue;
      if (targetIds && targetIds.length > 0 && !targetIds.includes(currentItem.id)) continue;

      // Atualiza status para preparando
      setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "preparando", progress: 5 } : q));

      try {
        let audioBuffer: AudioBuffer | null = null;
        const arrayBuffer = await currentItem.file.arrayBuffer();

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        await audioCtx.close();

        if (isCancelledRef.current) break;

        // Atualiza status para convertendo
        setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "convertendo", progress: 20 } : q));

        // Resample/Mix se necessário
        const targetRate = settings.wavSampleRate === "original" ? audioBuffer.sampleRate : parseInt(settings.wavSampleRate, 10);
        const targetChannels = settings.wavChannels === "original" ? audioBuffer.numberOfChannels : settings.wavChannels === "mono" ? 1 : 2;
        const processedBuffer = await resampleAndMixAudio(
          audioBuffer,
          targetRate,
          targetChannels
        );

        let convertedBlob: Blob | null = null;
        let ext = settings.format;

        if (settings.format === "mp3") {
          convertedBlob = await encodeMp3BlobWithWorker(
            processedBuffer,
            settings.mp3Kbps,
            (prog) => {
              if (isCancelledRef.current) return;
              setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, progress: 20 + Math.round(prog * 0.75) } : q));
            },
            activeWorkerRef
          );
        } else if (settings.format === "wav") {
          convertedBlob = encodeWavBlob(processedBuffer, settings.wavBitDepth || 16);
          setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, progress: 95 } : q));
        } else if (settings.format === "aac" || settings.format === "ogg" || settings.format === "flac") {
          const bitrate = settings.format === "ogg" ? (settings.oggKbps || 128) : settings.aacKbps;
          convertedBlob = await encodeWithWebCodecs(
            processedBuffer,
            settings.format,
            bitrate,
            (prog) => {
              setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, progress: 20 + Math.round(prog * 0.75) } : q));
            }
          );
        }

        if (isCancelledRef.current) break;

        if (!convertedBlob) {
          throw new Error("Não foi possível gerar o arquivo convertido.");
        }

        const baseName = currentItem.name.replace(/\.[^/.]+$/, "");
        const convertedFileName = `${baseName}.${ext}`;
        const convertedBlobUrl = URL.createObjectURL(convertedBlob);

        setQueue((prev) => prev.map((q, idx) => idx === i ? {
          ...q,
          status: "concluido",
          progress: 100,
          convertedBlobUrl,
          convertedFileName,
          convertedSize: convertedBlob!.size
        } : q));

        // Telemetria isolada da V2: Conversão individual
        trackEventV2("audio_converted", {
          output_format: settings.format,
          input_format: currentItem.file.name.split(".").pop()?.toLowerCase() || "unknown",
          file_count: 1
        });

      } catch (err: any) {
        console.error("Erro na conversão do arquivo:", currentItem.name, err);
        const customMessage = err.message || "Falha ao processar arquivo de áudio.";
        setQueue((prev) => prev.map((q, idx) => idx === i ? {
          ...q,
          status: "erro",
          progress: 0,
          errorMessage: customMessage
        } : q));

        // Telemetria isolada da V2: Falha na conversão
        trackEventV2("audio_conversion_failed", {
          output_format: settings.format,
          input_format: currentItem.file.name.split(".").pop()?.toLowerCase() || "unknown",
          error_code: "conversion_error"
        });
      }
    }

    setIsProcessing(false);
  };

  const handleConvertAll = () => handleConvertItems();
  const handleConvertSelected = () => handleConvertItems(selectedIds.length > 0 ? selectedIds : undefined);

  const handleAddMoreFiles = () => {
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    }
  };

  const handleHiddenFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
      e.target.value = "";
    }
  };

  const handleDownloadAllZip = async () => {
    try {
      setIsGeneratingZip(true);
      const zipBlob = await createAudioBatchZipBlob(queue);
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `audios_convertidos_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);

      // Telemetria isolada da V2: Download ZIP de lote
      trackEventV2("audio_zip_download", {
        output_format: settings.format,
        file_count: queue.filter(q => q.status === "concluido").length
      });
    } catch (err: any) {
      setGlobalError(err.message || "Erro ao gerar arquivo ZIP compactado.");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const audioBenefits = [
    {
      title: "Rápido e Eficiente",
      description: "Processamento instantâneo via WebAssembly sem filas ou esperas.",
      icon: <Zap className="w-5 h-5 text-[#8B5CF6]" />,
      iconBg: "bg-[#F5F3FF] border-[#DDD6FE]"
    },
    {
      title: "Privacidade Total",
      description: "100% no seu navegador. Seus dados nunca saem do seu computador.",
      icon: <ShieldCheck className="w-5 h-5 text-[#059669]" />,
      iconBg: "bg-[#ECFDF5] border-[#A7F3D0]"
    },
    {
      title: "Alta Fidelidade",
      description: "Preservação máxima de frequências e dinâmica sonora do áudio original.",
      icon: <Sparkles className="w-5 h-5 text-[#1D68F2]" />,
      iconBg: "bg-[#EFF6FF] border-[#BFDBFE]"
    },
    {
      title: "Metadados Inteligentes",
      description: "Preserva e transfere tags ID3, capa e dados para o arquivo convertido.",
      icon: <Tag className="w-5 h-5 text-[#F59E0B]" />,
      iconBg: "bg-[#FFFBEB] border-[#FDE68A]"
    },
    {
      title: "Funciona em Tudo",
      description: "Compatível com qualquer navegador desktop e mobile sem instalar nada.",
      icon: <Smartphone className="w-5 h-5 text-[#6366F1]" />,
      iconBg: "bg-[#EEF2FF] border-[#C7D2FE]"
    }
  ];

  return (
    <div className="space-y-8 md:space-y-10" id="v2-audio-converter-module">
      {/* Visual Audio Hero Section Matching Reference Image Exactly */}
      <AudioHeroV2 onBack={onBack} />

      {/* Hidden File Input for Add More Files */}
      <input
        ref={hiddenFileInputRef}
        type="file"
        multiple
        accept="audio/*,video/mp4,video/webm,video/quicktime,video/x-matroska,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.aiff,.aif,.caf,.mp4,.mov,.webm"
        className="hidden"
        onChange={handleHiddenFileInputChange}
        disabled={isProcessing}
      />

      {/* Main Workspace */}
      {queue.length === 0 ? (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="v2-audio-workspace">
          {/* Left Column: Large Upload Dropzone */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
            <AudioDropzoneV2
              onFilesSelected={handleFilesSelected}
              disabled={isProcessing}
            />
          </div>

          {/* Right Column: Settings Card */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
            <AudioSettingsV2
              settings={settings}
              onChange={setSettings}
              disabled={isProcessing}
            />
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="v2-audio-workspace-queue">
          {/* Left Column: Dropzone + Settings stacked vertically */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-6">
            <AudioDropzoneV2
              onFilesSelected={handleFilesSelected}
              disabled={isProcessing}
            />
            <AudioSettingsV2
              settings={settings}
              onChange={setSettings}
              disabled={isProcessing}
            />
          </div>

          {/* Right Column: Queue Component matching reference image */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
            <AudioQueueV2
              queue={queue}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              isProcessing={isProcessing}
              isGeneratingZip={isGeneratingZip}
              globalError={globalError}
              onConvertSelected={handleConvertSelected}
              onConvertAll={handleConvertAll}
              onDownloadAllZip={handleDownloadAllZip}
              onCancelQueue={handleCancelQueue}
              onClearQueue={handleClearQueue}
              onRemoveItem={handleRemoveItem}
              onAddMoreFiles={handleAddMoreFiles}
            />
          </div>
        </section>
      )}

      {/* 5-Card Benefits Row */}
      <BenefitsBarV2 items={audioBenefits} variant="five-cards" />
    </div>
  );
};
