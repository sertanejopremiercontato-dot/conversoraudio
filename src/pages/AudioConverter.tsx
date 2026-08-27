/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileAudio, 
  Clock, 
  ShieldCheck, 
  Trash2, 
  X, 
  Play, 
  Pause,
  Info,
  Music,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { zipSync } from "fflate";
import { QueueItem } from "../types";
import { trackEvent } from "../lib/gtag";

// Web Worker code as a string to run the LameJS encoder in a background thread
const workerCode = `
  self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.all.min.js');

  self.onmessage = function(e) {
    const { left, right, channels, sampleRate, kbps } = e.data;
    
    // Check if lamejs loaded successfully from CDN
    var lameInstance = typeof lamejs !== 'undefined' ? lamejs : (typeof lame !== 'undefined' ? lame : null);
    if (!lameInstance) {
      self.postMessage({ type: 'error', error: 'Não foi possível carregar a biblioteca de codificação MP3 (LameJS).' });
      return;
    }
    
    // Helper function to convert Float32Array to Int16Array (16-bit signed PCM)
    function floatTo16BitPCM(float32Array) {
      var len = float32Array.length;
      var buffer = new Int16Array(len);
      for (var i = 0; i < len; i++) {
        var s = Math.max(-1, Math.min(1, float32Array[i]));
        buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return buffer;
    }
    
    self.postMessage({ type: 'status', message: 'Processando canais...' });
    
    var leftPCM = floatTo16BitPCM(left);
    var rightPCM = (channels === 2 && right) ? floatTo16BitPCM(right) : null;
    
    self.postMessage({ type: 'status', message: 'Codificando em MP3...' });
    
    var mp3encoder = new lameInstance.Mp3Encoder(channels, sampleRate, kbps);
    var mp3Data = [];
    
    var sampleBlockSize = 1152; // LAME standard block size
    var totalSamples = leftPCM.length;
    
    for (var i = 0; i < totalSamples; i += sampleBlockSize) {
      var leftChunk = leftPCM.subarray(i, i + sampleBlockSize);
      var mp3buf;
      
      if (channels === 2 && rightPCM) {
        var rightChunk = rightPCM.subarray(i, i + sampleBlockSize);
        mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      } else {
        mp3buf = mp3encoder.encodeBuffer(leftChunk);
      }
      
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
      
      // Periodically report progress to the main thread
      if (i % (sampleBlockSize * 25) === 0 || i + sampleBlockSize >= totalSamples) {
        var progress = Math.min(100, Math.round((i / totalSamples) * 100));
        self.postMessage({ type: 'progress', progress: progress });
      }
    }
    
    var mp3bufFlush = mp3encoder.flush();
    if (mp3bufFlush.length > 0) {
      mp3Data.push(new Uint8Array(mp3bufFlush));
    }
    
    // Combine all MP3 chunks into a single ArrayBuffer to transfer back
    var totalLength = 0;
    for (var j = 0; j < mp3Data.length; j++) {
      totalLength += mp3Data[j].length;
    }
    var result = new Uint8Array(totalLength);
    var offset = 0;
    for (var j = 0; j < mp3Data.length; j++) {
      result.set(mp3Data[j], offset);
      offset += mp3Data[j].length;
    }
    
    self.postMessage({ type: 'complete', data: result.buffer }, [result.buffer]);
  };
`;

// Helper functions to check for video tracks and magic bytes
async function checkAudioMagicBytes(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 65536);
    const arrayBuffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    if (bytes.length < 4) return false;

    // 1. MP3 ID3 header: 'ID3' (0x49 0x44 0x33)
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;

    // 2. MP3 frame header sync (0xFF 0xFB, 0xFF 0xF3, 0xFF 0xF2, etc.)
    for (let i = 0; i < Math.min(bytes.length - 2, 8192); i++) {
      if (bytes[i] === 0xFF && (bytes[i + 1] & 0xE0) === 0xE0) return true;
    }

    // 3. RIFF WAV / AVI: 'RIFF'
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true;

    // 4. OGG / Opus / Vorbis: 'OggS'
    if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return true;

    // 5. FLAC: 'fLaC'
    if (bytes[0] === 0x66 && bytes[1] === 0x4C && bytes[2] === 0x61 && bytes[3] === 0x43) return true;

    // 6. MP4 / M4A / 3GP / MOV / M4V / AAC: 'ftyp' box at offset 4 or within first 1024 bytes
    for (let i = 0; i < Math.min(bytes.length - 8, 1024); i++) {
      if (bytes[i + 4] === 0x66 && bytes[i + 5] === 0x74 && bytes[i + 6] === 0x79 && bytes[i + 7] === 0x70) {
        return true;
      }
    }

    // 7. Raw AAC ADTS syncword (0xFF 0xF1 or 0xFF 0xF9)
    if (bytes[0] === 0xFF && (bytes[1] === 0xF1 || bytes[1] === 0xF9)) return true;

    // 8. WebM / MKV EBML header: 0x1A 0x45 0xDF 0xA3
    if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) return true;

    // 9. AIFF: 'FORM'
    if (bytes[0] === 0x46 && bytes[1] === 0x4F && bytes[2] === 0x52 && bytes[3] === 0x4D) return true;

    // 10. CAF: 'caff'
    if (bytes[0] === 0x63 && bytes[1] === 0x61 && bytes[2] === 0x66 && bytes[3] === 0x66) return true;

    // 11. AMR: '#!AMR'
    if (bytes[0] === 0x23 && bytes[1] === 0x21 && bytes[2] === 0x41 && bytes[3] === 0x4D && bytes[4] === 0x52) return true;

    // 12. WMA / ASF header: 0x30 0x26 0xB2 0x75
    if (bytes[0] === 0x30 && bytes[1] === 0x26 && bytes[2] === 0xB2 && bytes[3] === 0x75) return true;

    return false;
  } catch {
    return false;
  }
}

function checkMp4Audio(arrayBuffer: ArrayBuffer): { hasAudio: boolean; hasVideo: boolean } {
  const view = new DataView(arrayBuffer);
  let hasAudio = false;
  let hasVideo = false;
  const len = arrayBuffer.byteLength;
  
  function parseBoxes(start: number, end: number) {
    let pos = start;
    while (pos + 8 <= end) {
      let boxSize = view.getUint32(pos);
      let headerSize = 8;
      
      if (boxSize === 1) {
        if (pos + 16 > end) break;
        boxSize = view.getUint32(pos + 12);
        headerSize = 16;
      } else if (boxSize === 0) {
        boxSize = end - pos;
      }
      
      if (boxSize < headerSize || boxSize > (end - pos)) break;
      
      const typeBytes = [
        view.getUint8(pos + 4),
        view.getUint8(pos + 5),
        view.getUint8(pos + 6),
        view.getUint8(pos + 7)
      ];
      const boxType = String.fromCharCode(...typeBytes);
      
      if (boxType === "moov" || boxType === "trak" || boxType === "mdia" || boxType === "minf" || boxType === "stbl") {
        parseBoxes(pos + headerSize, Math.min(pos + boxSize, end));
      } else if (boxType === "hdlr") {
        if (pos + headerSize + 12 <= end) {
          const handlerBytes = [
            view.getUint8(pos + headerSize + 8),
            view.getUint8(pos + headerSize + 9),
            view.getUint8(pos + headerSize + 10),
            view.getUint8(pos + headerSize + 11)
          ];
          const handlerType = String.fromCharCode(...handlerBytes);
          if (handlerType === "soun") {
            hasAudio = true;
          } else if (handlerType === "vide") {
            hasVideo = true;
          }
        }
      }
      
      pos += boxSize;
    }
  }
  
  try {
    parseBoxes(0, len);
  } catch (e) {
    console.error("Erro ao analisar MP4: ", e);
  }
  
  return { hasAudio, hasVideo };
}

function checkMpegAudio(arrayBuffer: ArrayBuffer): { hasAudio: boolean; hasVideo: boolean } {
  const view = new DataView(arrayBuffer);
  const len = arrayBuffer.byteLength;
  let hasAudio = false;
  let hasVideo = false;
  const scanLimit = Math.min(len, 10 * 1024 * 1024);

  for (let i = 0; i < scanLimit - 4; i++) {
    if (view.getUint8(i) === 0x00 && view.getUint8(i + 1) === 0x00 && view.getUint8(i + 2) === 0x01) {
      const streamId = view.getUint8(i + 3);
      if (streamId >= 0xC0 && streamId <= 0xDF) {
        hasAudio = true;
      } else if (streamId >= 0xE0 && streamId <= 0xEF) {
        hasVideo = true;
      }
      if (hasAudio && hasVideo) {
        break;
      }
    }
  }

  if (!hasAudio) {
    for (let i = 0; i < scanLimit - 2; i++) {
      const byte1 = view.getUint8(i);
      const byte2 = view.getUint8(i + 1);
      if (byte1 === 0xFF && (byte2 & 0xE0) === 0xE0) {
        hasAudio = true;
        break;
      }
    }
  }

  return { hasAudio, hasVideo };
}

interface AudioConverterProps {
  onBack?: () => void;
}

export default function AudioConverter({ onBack }: AudioConverterProps = {}) {
  // Main Queue and Format States
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<"mp3" | "wav" | "aac" | "flac" | "ogg">("mp3");
  
  // Format-specific settings
  const [selectedKbps, setSelectedKbps] = useState<64 | 96 | 112 | 128 | 192 | 256 | 320>(128);
  const [wavSampleRate, setWavSampleRate] = useState<"original" | "44100" | "48000">("original");
  const [wavChannels, setWavChannels] = useState<"original" | "mono" | "stereo">("original");
  const [aacKbps, setAacKbps] = useState<96 | 128 | 192 | 256>(128);
  const [oggQuality, setOggQuality] = useState<"low" | "medium" | "high">("medium");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [zipWarningType, setZipWarningType] = useState<"none" | "warning-50" | "warning-100">("none");

  // Playback States
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [playbackState, setPlaybackState] = useState<{ id: string | null; type: "original" | "converted" | null }>({ id: null, type: null });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeWorkerRef = useRef<Worker | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Supported extensions
  const allowedExtensions = [
    "mp3", "wav", "m4a", "aac", "flac", "ogg", "oga", "opus", "wma", "amr", "aiff", "aif", "caf", "ac3", "mp2", "mp1", "pcm", "au", "snd",
    "mp4", "webm", "3gp", "3gpp", "mov", "m4v", "ogv", "mkv"
  ];

  // Limits (Desktop users get up to 700MB per file, mobile gets 100MB)
  const isMobileDevice = typeof window !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
  const MAX_FILE_SIZE = isMobileDevice ? 100 * 1024 * 1024 : 700 * 1024 * 1024; 
  const MAX_BATCH_SIZE = isMobileDevice ? 300 * 1024 * 1024 : 1500 * 1024 * 1024;
  const MAX_FILES_COUNT = 15;

  // Cleanup references on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      queue.forEach(item => {
        if (item.convertedBlobUrl) URL.revokeObjectURL(item.convertedBlobUrl);
        if (item.originalBlobUrl) URL.revokeObjectURL(item.originalBlobUrl);
      });
    };
  }, []);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const removeItem = (id: string) => {
    if (playbackState.id === id) {
      handleStopAudio();
    }
    
    setQueue((prev) => {
      const target = prev.find(item => item.id === id);
      if (target) {
        if (target.convertedBlobUrl) URL.revokeObjectURL(target.convertedBlobUrl);
        if (target.originalBlobUrl) URL.revokeObjectURL(target.originalBlobUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const clearQueue = () => {
    cancelQueue();
    handleStopAudio();
    queue.forEach(item => {
      if (item.convertedBlobUrl) URL.revokeObjectURL(item.convertedBlobUrl);
      if (item.originalBlobUrl) URL.revokeObjectURL(item.originalBlobUrl);
    });
    setQueue([]);
    setGlobalError(null);
  };

  const cancelQueue = () => {
    isCancelledRef.current = true;
    if (activeWorkerRef.current) {
      activeWorkerRef.current.terminate();
      activeWorkerRef.current = null;
    }
    
    setQueue((prev) => prev.map((item) => {
      if (item.status === "convertendo" || item.status === "preparando" || item.status === "aguardando") {
        return { ...item, status: "cancelado", progress: 0 };
      }
      return item;
    }));

    setIsProcessing(false);
    setCurrentProcessingIndex(-1);
  };

  const readAudioMetadata = async (file: File): Promise<{ duration: number; channels: number }> => {
    const arrayBuffer = await file.arrayBuffer();

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isVideoContainer = ["mp4", "webm", "3gp", "3gpp", "mov", "m4v", "mkv", "ogv"].includes(ext) || file.type.startsWith("video/");
    
    if (isVideoContainer && (ext === "mp4" || file.type.includes("mp4"))) {
      const mp4Info = checkMp4Audio(arrayBuffer);
      if (!mp4Info.hasAudio && mp4Info.hasVideo) {
        throw new Error("O arquivo MP4 contém apenas vídeo sem faixa de áudio.");
      }
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio API não suportada neste navegador.");
    }
    const audioCtx = new AudioContextClass();
    try {
      const buffer = await audioCtx.decodeAudioData(arrayBuffer);
      if (!buffer || buffer.duration === 0) {
        throw new Error("Nenhuma faixa de áudio utilizável foi encontrada no arquivo.");
      }
      const metadata = {
        duration: buffer.duration,
        channels: buffer.numberOfChannels
      };
      audioCtx.close();
      return metadata;
    } catch (err: any) {
      audioCtx.close();
      if (err.message && (err.message.includes("vídeo") || err.message.includes("faixa de áudio"))) {
        throw err;
      }

      // Layer 7: Inspect container for specific unsupported codec messages
      const bytes = new Uint8Array(arrayBuffer.slice(0, 32));
      const isAmrHeader = bytes[0] === 0x23 && bytes[1] === 0x21 && bytes[2] === 0x41 && bytes[3] === 0x4D && bytes[4] === 0x52;
      if (isAmrHeader || ext === "amr") {
        throw new Error("O formato AMR (utilizado em áudios antigos de celular) não é suportado nativamente pelo navegador.");
      }

      if (ext === "3gp" || ext === "3gpp") {
        throw new Error("O arquivo 3GP contém um codec de áudio (como AMR) não suportado pelo navegador.");
      }

      if (ext === "wma") {
        throw new Error("O formato WMA (Windows Media Audio) é proprietário e não é suportado pelo navegador.");
      }

      if (ext === "ac3") {
        throw new Error("O formato AC3 (Dolby Digital) não é suportado pelo navegador.");
      }

      throw new Error(`Não foi possível decodificar o áudio. O codec do arquivo (${ext.toUpperCase() || "MÍDIA"}) não é suportado pelo navegador.`);
    }
  };

  const handleSelectedFiles = async (selectedFiles: FileList) => {
    setGlobalError(null);
    const filesArray = Array.from(selectedFiles);

    if (queue.length + filesArray.length > MAX_FILES_COUNT) {
      setGlobalError(`Você pode converter no máximo 15 arquivos de uma vez. Fila atual: ${queue.length} arquivos.`);
      return;
    }

    const newItems: QueueItem[] = [];
    let currentBatchSize = queue.reduce((sum, item) => sum + item.originalSize, 0);

    for (const file of filesArray) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isAllowedExt = allowedExtensions.includes(ext);
      const mime = file.type.toLowerCase();
      const isMediaMime = 
        mime.startsWith("audio/") || 
        mime.startsWith("video/") || 
        mime === "" || 
        mime === "application/octet-stream" || 
        mime.includes("ogg") || 
        mime.includes("mpeg");

      let isValidCandidate = isAllowedExt || isMediaMime;
      if (!isValidCandidate) {
        isValidCandidate = await checkAudioMagicBytes(file);
      }
      
      if (!isValidCandidate) {
        setGlobalError(`O arquivo "${file.name}" não pôde ser adicionado por não parecer um formato de áudio ou mídia compatível.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setGlobalError(`Arquivo rejeitado por exceder o limite de ${isMobileDevice ? "100MB" : "700MB"}: "${file.name}" (${formatBytes(file.size)})`);
        continue;
      }

      if (currentBatchSize + file.size > MAX_BATCH_SIZE) {
        setGlobalError(`Limite total do lote de ${isMobileDevice ? "300MB" : "1.5GB"} seria excedido. Alguns arquivos foram ignorados.`);
        break;
      }

      currentBatchSize += file.size;

      const id = Math.random().toString(36).substring(2, 9);
      newItems.push({
        id,
        file,
        name: file.name,
        originalSize: file.size,
        format: ext.toUpperCase() || "AUDIO",
        duration: null,
        channels: null,
        status: "aguardando",
        progress: 0,
        convertedSize: null,
        convertedBlobUrl: null,
        convertedFileName: null,
        errorMessage: null,
        originalBlobUrl: URL.createObjectURL(file)
      });
    }

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);

      newItems.forEach((item) => {
        readAudioMetadata(item.file).then((meta) => {
          setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, duration: meta.duration, channels: meta.channels } : q));
        }).catch((err: any) => {
          console.warn("Erro ao ler metadados de áudio:", item.name, err);
          const errMsg = err?.message || "Incapaz de ler metadados de áudio do arquivo.";
          setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, errorMessage: errMsg } : q));
        });
      });
    }
  };

  // Resampler utilizing OfflineAudioContext
  const resampleAndMixAudio = async (buffer: AudioBuffer, targetSampleRate: number, targetChannels: number): Promise<AudioBuffer> => {
    const offlineCtx = new OfflineAudioContext(
      targetChannels,
      Math.round(targetSampleRate * buffer.duration),
      targetSampleRate
    );

    const bufferSource = offlineCtx.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.connect(offlineCtx.destination);
    bufferSource.start();

    return await offlineCtx.startRendering();
  };

  // 16-bit PCM WAV Encoder
  const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // raw PCM
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 2) {
      result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      result = buffer.getChannelData(0);
    }
    
    const bufferLength = result.length * 2;
    const arrayBuffer = new ArrayBuffer(44 + bufferLength);
    const view = new DataView(arrayBuffer);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
      for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    };
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bufferLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bufferLength, true);
    
    floatTo16BitPCM(view, 44, result);
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const interleave = (inputL: Float32Array, inputR: Float32Array): Float32Array => {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    
    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  };

  const createADTSHeader = (sampleRate: number, channels: number, frameLength: number): Uint8Array => {
    const samplingFrequencies = [
      96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350
    ];
    let sampleRateIndex = samplingFrequencies.indexOf(sampleRate);
    if (sampleRateIndex === -1) sampleRateIndex = 4; // default to 44100
    
    const adts = new Uint8Array(7);
    const totalLength = frameLength + 7;
    
    adts[0] = 0xFF; // Syncword
    adts[1] = 0xF1; // Syncword + MPEG-4 + Layer 0 + Protection Absent
    adts[2] = ((1 << 6) | (sampleRateIndex << 2) | (channels >> 2)) & 0xFF;
    adts[3] = (((channels & 3) << 6) | (totalLength >> 11)) & 0xFF;
    adts[4] = (totalLength >> 3) & 0xFF;
    adts[5] = (((totalLength & 7) << 5) | 0x1F) & 0xFF;
    adts[6] = 0xFC;
    
    return adts;
  };

  const encodeWithWebCodecs = async (
    buffer: AudioBuffer, 
    codecName: "aac" | "flac" | "ogg", 
    bitrate: number,
    onProgress: (prog: number) => void
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      let encoder: any;
      
      try {
        const AudioEncoderClass = (window as any).AudioEncoder;
        const AudioDataClass = (window as any).AudioData;
        
        if (!AudioEncoderClass || !AudioDataClass) {
          throw new Error("WebCodecs não suportado");
        }
        
        encoder = new AudioEncoderClass({
          output: (chunk: any) => {
            const buf = new Uint8Array(chunk.byteLength);
            chunk.copyTo(buf);
            
            if (codecName === "aac") {
              const adtsHeader = createADTSHeader(buffer.sampleRate, buffer.numberOfChannels, chunk.byteLength);
              chunks.push(adtsHeader);
            }
            chunks.push(buf);
          },
          error: (e: any) => {
            reject(e);
          }
        });
        
        let codecString = "mp4a.40.2"; // AAC-LC
        let sampleRate = buffer.sampleRate;
        let channels = buffer.numberOfChannels;
        
        if (codecName === "flac") {
          codecString = "flac";
        } else if (codecName === "ogg") {
          codecString = "opus";
        }
        
        encoder.configure({
          codec: codecString,
          sampleRate: sampleRate,
          numberOfChannels: channels,
          bitrate: bitrate,
        });
        
        const blockSize = 4096;
        const totalSamples = buffer.length;
        let offset = 0;
        
        const encodeNext = () => {
          if (offset >= totalSamples) {
            encoder.flush().then(() => {
              encoder.close();
              const finalBlob = new Blob(chunks, { 
                type: codecName === "aac" ? "audio/aac" : 
                      codecName === "flac" ? "audio/flac" : "audio/ogg" 
              });
              resolve(finalBlob);
            }).catch(reject);
            return;
          }
          
          const size = Math.min(blockSize, totalSamples - offset);
          const planes: Float32Array[] = [];
          for (let c = 0; c < channels; c++) {
            const plane = new Float32Array(size);
            buffer.copyFromChannel(plane, c, offset);
            planes.push(plane);
          }
          
          const totalPlanesLength = planes.reduce((sum, p) => sum + p.length, 0);
          const rawData = new Float32Array(totalPlanesLength);
          let rawOffset = 0;
          for (const plane of planes) {
            rawData.set(plane, rawOffset);
            rawOffset += plane.length;
          }
          
          const audioData = new AudioDataClass({
            format: "f32-planar",
            sampleRate: sampleRate,
            numberOfFrames: size,
            numberOfChannels: channels,
            timestamp: Math.round((offset / sampleRate) * 1000000),
            data: rawData
          });
          
          encoder.encode(audioData);
          audioData.close();
          
          offset += size;
          onProgress(Math.min(95, Math.round((offset / totalSamples) * 100)));
          
          setTimeout(encodeNext, 0);
        };
        
        encodeNext();
        
      } catch (err) {
        console.warn("WebCodecs falhou, usando WAV como fallback:", err);
        const wavBlob = audioBufferToWavBlob(buffer);
        resolve(wavBlob);
      }
    });
  };

  const startBatchConversion = async () => {
    if (isProcessing || queue.length === 0) return;

    const itemsToConvert = queue.filter(item => item.status === "aguardando" || item.status === "cancelado" || item.status === "erro");
    if (itemsToConvert.length === 0) {
      setGlobalError("Todos os arquivos selecionados já foram convertidos com sucesso!");
      return;
    }

    setIsProcessing(true);
    isCancelledRef.current = false;
    setGlobalError(null);

    // Track audio conversion start event
    trackEvent("audio_conversion_started", {
      files_count: itemsToConvert.length,
      format: selectedFormat,
    });

    for (let i = 0; i < queue.length; i++) {
      if (isCancelledRef.current) break;

      const currentItem = queue[i];
      if (currentItem.status === "concluido") continue;

      setCurrentProcessingIndex(i);
      setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "preparando", progress: 10 } : q));

      // Track individual file conversion start
      trackEvent("audio_conversion_started", {
        format: selectedFormat,
        input_format: currentItem.file.name.split(".").pop()?.toLowerCase() || ""
      });

      try {
        const arrayBuffer = await currentItem.file.arrayBuffer();

        const ext = currentItem.file.name.split(".").pop()?.toLowerCase() || "";
        const isVideoContainer = ["mp4", "webm", "3gp", "3gpp", "mov", "m4v", "mkv", "ogv"].includes(ext) || currentItem.file.type.startsWith("video/");

        if (isVideoContainer && (ext === "mp4" || currentItem.file.type.includes("mp4"))) {
          const mp4Info = checkMp4Audio(arrayBuffer);
          if (!mp4Info.hasAudio && mp4Info.hasVideo) {
            throw new Error("O arquivo MP4 contém apenas vídeo sem faixa de áudio.");
          }
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error("Web Audio API não é suportada neste navegador.");
        }

        const audioCtx = new AudioContextClass();
        
        setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "preparando", progress: 30 } : q));

        let decodedBuffer: AudioBuffer;
        try {
          decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (decodeErr: any) {
          audioCtx.close();
          const bytes = new Uint8Array(arrayBuffer.slice(0, 32));
          const isAmrHeader = bytes[0] === 0x23 && bytes[1] === 0x21 && bytes[2] === 0x41 && bytes[3] === 0x4D && bytes[4] === 0x52;
          if (isAmrHeader || ext === "amr") {
            throw new Error("O formato AMR (utilizado em áudios antigos de celular) não é suportado nativamente pelo navegador.");
          }
          if (ext === "3gp" || ext === "3gpp") {
            throw new Error("O arquivo 3GP contém um codec de áudio (como AMR) não suportado pelo navegador.");
          }
          if (ext === "wma") {
            throw new Error("O formato WMA (Windows Media Audio) é proprietário e não é suportado pelo navegador.");
          }
          if (ext === "ac3") {
            throw new Error("O formato AC3 (Dolby Digital) não é suportado pelo navegador.");
          }
          if (isVideoContainer) {
            throw new Error(`Não foi possível extrair/decodificar a faixa de áudio deste arquivo (${ext.toUpperCase() || "de vídeo"}). O codec de áudio utilizado pode não ser suportado pelo navegador.`);
          } else {
            throw new Error(`Não foi possível decodificar o arquivo de áudio (${ext.toUpperCase() || "mídia"}). O codec ou contêiner não é suportado pelo navegador.`);
          }
        }
        audioCtx.close();

        setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "preparando", progress: 50 } : q));

        if (selectedFormat === "wav") {
          // WAV Processing: Native Offline Context Resampling and Channel downmix/upmix
          let targetSampleRate = decodedBuffer.sampleRate;
          if (wavSampleRate === "44100") {
            targetSampleRate = 44100;
          } else if (wavSampleRate === "48000") {
            targetSampleRate = 48000;
          }

          let targetChannels = decodedBuffer.numberOfChannels;
          if (wavChannels === "mono") {
            targetChannels = 1;
          } else if (wavChannels === "stereo") {
            targetChannels = 2;
          }
          if (targetChannels > 2) {
            targetChannels = 2; // clamp to stereo max
          }

          setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "convertendo", progress: 70 } : q));
          const mixedBuffer = await resampleAndMixAudio(decodedBuffer, targetSampleRate, targetChannels);
          
          setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, progress: 90 } : q));
          const wavBlob = audioBufferToWavBlob(mixedBuffer);
          const wavUrl = URL.createObjectURL(wavBlob);

          const originalName = currentItem.file.name;
          const lastDotIndex = originalName.lastIndexOf(".");
          const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;

          setQueue((prev) => prev.map((q, idx) => idx === i ? { 
            ...q, 
            status: "concluido", 
            progress: 100,
            convertedSize: wavBlob.size,
            convertedBlobUrl: wavUrl,
            convertedFileName: `${baseName}.wav`
          } : q));

          // Track WAV success
          trackEvent("audio_conversion_completed", {
            format: "wav",
            original_size: currentItem.file.size,
            converted_size: wavBlob.size,
          });

        } else if (selectedFormat === "mp3") {
          // MP3 Processing: lamejs Web Worker
          // We always resample to 44100Hz for high-compatibility LameJS encoding
          const resampledBuffer = await resampleAndMixAudio(decodedBuffer, 44100, Math.min(decodedBuffer.numberOfChannels, 2));

          setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "convertendo", progress: 0 } : q));

          await new Promise<void>((resolve, reject) => {
            const workerBlob = new Blob([workerCode], { type: "application/javascript" });
            const workerUrl = URL.createObjectURL(workerBlob);
            const worker = new Worker(workerUrl);
            activeWorkerRef.current = worker;

            const cleanUpWorker = () => {
              worker.terminate();
              URL.revokeObjectURL(workerUrl);
              activeWorkerRef.current = null;
            };

            worker.onmessage = (e) => {
              const msg = e.data;
              if (msg.type === "progress") {
                setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, progress: msg.progress } : q));
              } else if (msg.type === "error") {
                cleanUpWorker();
                reject(new Error(msg.error));
              } else if (msg.type === "complete") {
                const mp3Buffer = msg.data;
                const mp3Blob = new Blob([mp3Buffer], { type: "audio/mp3" });
                const mp3Url = URL.createObjectURL(mp3Blob);

                const originalName = currentItem.file.name;
                const lastDotIndex = originalName.lastIndexOf(".");
                const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;

                setQueue((prev) => prev.map((q, idx) => idx === i ? { 
                  ...q, 
                  status: "concluido", 
                  progress: 100,
                  convertedSize: mp3Blob.size,
                  convertedBlobUrl: mp3Url,
                  convertedFileName: `${baseName}.mp3`
                } : q));

                // Track MP3 success
                trackEvent("audio_conversion_completed", {
                  format: "mp3",
                  original_size: currentItem.file.size,
                  converted_size: mp3Blob.size,
                });

                cleanUpWorker();
                resolve();
              }
            };

            const leftData = resampledBuffer.getChannelData(0);
            const rightData = resampledBuffer.numberOfChannels > 1 ? resampledBuffer.getChannelData(1) : null;

            const workerLeft = new Float32Array(leftData);
            const workerRight = rightData ? new Float32Array(rightData) : null;

            const transfers: Transferable[] = [workerLeft.buffer];
            if (workerRight) {
              transfers.push(workerRight.buffer);
            }

            worker.postMessage({
              left: workerLeft,
              right: workerRight,
              channels: resampledBuffer.numberOfChannels,
              sampleRate: 44100,
              kbps: selectedKbps
            }, transfers);
          });
        } else if (selectedFormat === "aac" || selectedFormat === "flac" || selectedFormat === "ogg") {
          setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "convertendo", progress: 0 } : q));
          
          let targetBitrate = 128000;
          if (selectedFormat === "aac") {
            targetBitrate = aacKbps * 1000;
          } else if (selectedFormat === "ogg") {
            targetBitrate = oggQuality === "low" ? 96000 : oggQuality === "medium" ? 160000 : 256000;
          } else {
            targetBitrate = 320000; // FLAC lossless (target high quality)
          }

          const targetBlob = await encodeWithWebCodecs(
            decodedBuffer,
            selectedFormat,
            targetBitrate,
            (prog) => {
              setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, progress: prog } : q));
            }
          );

          const targetUrl = URL.createObjectURL(targetBlob);
          const originalName = currentItem.file.name;
          const lastDotIndex = originalName.lastIndexOf(".");
          const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;

          setQueue((prev) => prev.map((q, idx) => idx === i ? { 
            ...q, 
            status: "concluido", 
            progress: 100,
            convertedSize: targetBlob.size,
            convertedBlobUrl: targetUrl,
            convertedFileName: `${baseName}.${selectedFormat}`
          } : q));

          // Track WebCodecs success
          trackEvent("audio_conversion_completed", {
            format: selectedFormat,
            original_size: currentItem.file.size,
            converted_size: targetBlob.size,
          });
        }

      } catch (err: any) {
        console.error("Erro ao converter arquivo: ", currentItem.name, err);
        const customMessage = err.message || "Não foi possível interpretar o áudio deste arquivo. O codec ou conteúdo pode não ser compatível com o navegador.";
        
        setQueue((prev) => prev.map((q, idx) => idx === i ? { 
          ...q, 
          status: "erro", 
          progress: 0,
          errorMessage: customMessage
        } : q));

        // Track conversion failure
        trackEvent("audio_conversion_failed", {
          format: selectedFormat,
          error_message: err.message || String(err),
        });
      }
    }

    setIsProcessing(false);
    setCurrentProcessingIndex(-1);
  };

  // Playback managers
  const handlePlayAudio = (url: string, id: string, type: "original" | "converted") => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    if (playbackState.id === id && playbackState.type === type) {
      setPlaybackState({ id: null, type: null });
      return;
    }

    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    audio.play().catch(err => {
      console.error("Erro ao reproduzir áudio:", err);
    });

    setPlaybackState({ id, type });
    audio.onended = () => {
      setPlaybackState({ id: null, type: null });
    };
  };

  const handleStopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setPlaybackState({ id: null, type: null });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleSelectedFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const completedCount = queue.filter(item => item.status === "concluido").length;
  const queueLength = queue.length;
  const totalOriginalBytes = queue.reduce((sum, item) => sum + item.originalSize, 0);
  const totalConvertedBytes = queue.reduce((sum, item) => sum + (item.convertedSize || 0), 0);
  const spaceSavings = totalOriginalBytes > 0 && totalConvertedBytes > 0 && totalOriginalBytes > totalConvertedBytes
    ? Math.round(((totalOriginalBytes - totalConvertedBytes) / totalOriginalBytes) * 100)
    : 0;

  const handleDownloadAllZip = async (force = false) => {
    const completedItems = queue.filter(item => item.status === "concluido" && item.convertedBlobUrl);
    if (completedItems.length === 0) return;

    const totalConvertedSize = completedItems.reduce((sum, item) => sum + (item.convertedSize || 0), 0);
    const limit50MB = 50 * 1024 * 1024;
    const limit100MB = 100 * 1024 * 1024;

    if (!force) {
      if (totalConvertedSize > limit100MB) {
        setZipWarningType("warning-100");
        return;
      } else if (totalConvertedSize > limit50MB) {
        setZipWarningType("warning-50");
        return;
      }
    }

    setZipWarningType("none");
    setIsGeneratingZip(true);

    try {
      const usedNames = new Set<string>();
      const uniqueEntries = completedItems.map(item => {
        const originalName = item.file.name;
        const lastDotIndex = originalName.lastIndexOf(".");
        const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
        
        let fileName = item.convertedFileName || `${baseName}.${selectedFormat}`;
        let counter = 2;
        
        while (usedNames.has(fileName.toLowerCase())) {
          fileName = `${baseName}-${counter}.${selectedFormat}`;
          counter++;
        }
        
        usedNames.add(fileName.toLowerCase());
        return { item, fileName };
      });

      const filesToZip: Record<string, [Uint8Array, { level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }]> = {};
      for (const entry of uniqueEntries) {
        const response = await fetch(entry.item.convertedBlobUrl!);
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        filesToZip[entry.fileName] = [uint8Array, { level: 0 }];
      }

      const zippedData = zipSync(filesToZip);
      const zipBlob = new Blob([zippedData], { type: "application/zip" });
      const zipUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `conversoraudio-conversao-${selectedFormat}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(zipUrl);
      }, 5000);

    } catch (err) {
      console.error("Erro ao gerar arquivo ZIP: ", err);
      setGlobalError("Não foi possível gerar o arquivo ZIP localmente. Tente baixar os arquivos individualmente.");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="space-y-8 text-text-main bg-transparent">
      
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-border-main gap-4" id="audio-header-block">
        <div>
          <h2 className="font-display text-xl font-extrabold text-text-main" id="audio-main-title">
            Conversor de Áudio em Lote
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5" id="audio-main-subtitle">
            <span className="bg-card-inner text-text-sec text-[11px] px-2.5 py-1 rounded-md border border-border-main font-semibold">💻 Recomendado para Computador</span>
          </div>
        </div>
        
        {queueLength > 0 && (
          <button
            onClick={clearQueue}
            className="text-xs font-bold text-quality-max hover:text-white transition-colors py-2 px-4 bg-quality-max/10 border border-quality-max/30 rounded-xl hover:bg-quality-max/20 flex items-center space-x-1.5 cursor-pointer"
            id="btn-clear-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Limpar Fila</span>
          </button>
        )}
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-8 items-start">
        
        {/* Left Side Workspace (45%) */}
        <div className="space-y-6 w-full">
          
          {/* File Upload Dropzone (Large and Clean) */}
          <form 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onSubmit={(e) => e.preventDefault()}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-4 group ${
              dragActive 
                ? "border-[#0284C7] bg-[#E0F2FE] scale-[0.99]" 
                : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#0284C7] hover:bg-white"
            }`}
            id="upload-dropzone"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              multiple
              className="hidden" 
              accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,.oga,.opus,.wma,.amr,.aiff,.aif,.caf,.ac3,.mp2,.mp1,.pcm,.au,.snd,.mp4,.webm,.3gp,.3gpp,.mov,.m4v,.ogv,.mkv,audio/*,video/mp4,video/webm,video/3gpp,video/*,application/octet-stream"
              onChange={handleChange}
            />
            
            <div className="p-4 bg-[#E0F2FE] rounded-2xl border border-[#BAE6FD] text-[#0284C7] group-hover:scale-105 transition-transform duration-200 shadow-sm">
              <Upload className="h-6 w-6" id="upload-icon" />
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-extrabold text-[#0F172A]" id="upload-text-main">
                Arraste seus arquivos para cá ou clique para selecionar
              </p>
              <p className="text-xs text-[#475569]" id="upload-text-sub">
                Formatos aceitos: MP3, WAV, M4A, Áudios do WhatsApp (.mp4), AAC, OGG, WEBM, FLAC, 3GP, etc.
              </p>
              <p className="text-xs text-[#10B981] font-bold mt-1">
                Não salvamos nenhum arquivo.
              </p>
            </div>

            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerFileInput();
              }}
              className="px-5 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Selecionar Arquivos
            </button>
          </form>

          {/* Queue Statistics Header Banner */}
          {queueLength > 0 && (
            <div className="grid grid-cols-3 gap-3 py-4 text-center border border-[#E2E8F0] bg-white rounded-xl px-4 shadow-sm" id="stats-banner">
              <div className="space-y-0.5">
                <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Arquivos</p>
                <p className="text-base font-extrabold text-[#0284C7]">{completedCount} / {queueLength}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Original</p>
                <p className="text-base font-extrabold text-[#0F172A] font-mono">{formatBytes(totalOriginalBytes, 1)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Economia</p>
                <p className="text-base font-extrabold text-[#10B981] font-mono">{spaceSavings > 0 ? `${spaceSavings}%` : "0%"}</p>
              </div>
            </div>
          )}

          {/* Queue Files List Section */}
          <div className="space-y-3" id="queue-list-container">
            {queue.length === 0 ? (
              <div className="text-center py-10 text-[#64748B] border border-dashed border-[#CBD5E1] rounded-2xl bg-white/60" id="empty-queue-message">
                <FileAudio className="h-10 w-10 mx-auto text-[#0284C7] mb-2.5 opacity-60" />
                <p className="text-xs font-extrabold text-[#0F172A]">Nenhum arquivo na fila de conversão</p>
                <p className="text-[11px] text-[#64748B] mt-1">Adicione arquivos acima para configurá-los e convertê-los.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {queue.map((item, index) => {
                  const isCurrent = index === currentProcessingIndex;
                  const itemSavings = item.originalSize && item.convertedSize && item.originalSize > item.convertedSize
                    ? Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)
                    : null;

                  const isPlayingOriginal = playbackState.id === item.id && playbackState.type === "original";
                  const isPlayingConverted = playbackState.id === item.id && playbackState.type === "converted";

                  return (
                    <div 
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative ${
                        isCurrent 
                          ? "bg-[#E0F2FE] border-[#0284C7]" 
                          : item.status === "concluido" 
                          ? "bg-[#ECFDF5] border-[#10B981]/40" 
                          : item.status === "erro"
                          ? "bg-red-50 border-red-200"
                          : "bg-white border-[#E2E8F0] hover:border-[#0284C7]/50"
                      }`}
                      id={`queue-item-${item.id}`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${
                          item.status === "concluido"
                            ? "bg-[#D1FAE5] border-[#10B981]/30 text-[#10B981]"
                            : item.status === "erro"
                            ? "bg-red-100 border-red-300 text-red-600"
                            : "bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]"
                        }`}>
                          <FileAudio className="h-5 w-5" />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#0F172A] truncate" id={`name-${item.id}`}>
                            {item.name}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-[#475569] font-semibold">
                            <span className="font-mono text-[#0284C7] uppercase bg-[#E0F2FE] px-1.5 py-0.5 rounded text-[10px]">{item.format}</span>
                            <span>•</span>
                            <span>{formatBytes(item.originalSize)}</span>
                            {item.duration !== null && (
                              <>
                                <span>•</span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDuration(item.duration)}</span>
                                </span>
                              </>
                            )}
                            {item.convertedSize && (
                              <>
                                <span>•</span>
                                <span className="text-[#10B981] font-bold font-mono">Convertido: {formatBytes(item.convertedSize)}</span>
                                {itemSavings && (
                                  <span className="text-[#10B981] font-bold font-mono">({itemSavings}% menor)</span>
                                )}
                              </>
                            )}
                          </div>

                          {/* Media Controls */}
                          <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-[#E2E8F0]">
                            {item.originalBlobUrl && (
                              <button
                                onClick={() => {
                                  if (isPlayingOriginal) handleStopAudio();
                                  else handlePlayAudio(item.originalBlobUrl!, item.id, "original");
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                                  isPlayingOriginal
                                    ? "bg-[#0284C7] text-white"
                                    : "bg-[#F8FAFC] border border-[#CBD5E1] text-[#334155] hover:text-[#0F172A]"
                                }`}
                                title="Ouvir original"
                              >
                                {isPlayingOriginal ? (
                                  <>
                                    <Pause className="h-3 w-3 text-white fill-white animate-pulse" />
                                    <span>Parar Original</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3 w-3 text-[#475569]" />
                                    <span>Ouvir Original</span>
                                  </>
                                )}
                              </button>
                            )}

                            {item.status === "concluido" && item.convertedBlobUrl && (
                              <button
                                onClick={() => {
                                  if (isPlayingConverted) handleStopAudio();
                                  else handlePlayAudio(item.convertedBlobUrl!, item.id, "converted");
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                                  isPlayingConverted
                                    ? "bg-[#10B981] text-white"
                                    : "bg-[#ECFDF5] border border-[#10B981]/30 text-[#10B981] hover:bg-[#D1FAE5]"
                                }`}
                                title="Ouvir convertido"
                              >
                                {isPlayingConverted ? (
                                  <>
                                    <Pause className="h-3 w-3 text-white fill-white animate-pulse" />
                                    <span>Parar Convertido</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3 w-3 text-[#10B981]" />
                                    <span>Ouvir Convertido</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status and Action Buttons */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 self-end sm:self-center">
                        <div className="text-right">
                          {item.status === "aguardando" && (
                            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wide">Aguardando</span>
                          )}
                          {item.status === "preparando" && (
                            <span className="text-[10px] text-[#0284C7] font-bold uppercase tracking-wide flex items-center space-x-1">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Processando...</span>
                            </span>
                          )}
                          {item.status === "convertendo" && (
                            <span className="text-[10px] text-[#0284C7] font-bold uppercase tracking-wide flex items-center space-x-1">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>{item.progress}%</span>
                            </span>
                          )}
                          {item.status === "concluido" && (
                            <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wide flex items-center space-x-1 bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#10B981]/30">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Pronto</span>
                            </span>
                          )}
                          {item.status === "cancelado" && (
                            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wide">Cancelado</span>
                          )}
                          {item.status === "erro" && (
                            <span className="text-[10px] text-red-600 font-bold uppercase tracking-wide flex items-center space-x-1" title={item.errorMessage || "Erro"}>
                              <AlertCircle className="h-3 w-3" />
                              <span>Erro</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {item.status === "concluido" && item.convertedBlobUrl && (
                            <a
                              href={item.convertedBlobUrl}
                              download={item.convertedFileName || `convertido.${selectedFormat}`}
                              className="p-2 bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#10B981]/30 text-[#10B981] rounded-lg transition-colors"
                              title="Baixar arquivo convertido"
                              id={`dl-${item.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}

                          {!isProcessing && (
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 bg-[#F8FAFC] hover:bg-red-50 border border-[#CBD5E1] hover:border-red-300 text-[#64748B] hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Remover"
                              id={`rm-${item.id}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {item.errorMessage && (
                        <div className="w-full text-[11px] text-red-600 font-semibold pt-2 mt-1 border-t border-red-200 leading-normal flex items-start gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>{item.errorMessage}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side Settings Panel (55%) */}
        <div className="space-y-6 w-full bg-white p-6 md:p-8 rounded-[24px] border border-[#E2E8F0] shadow-sm">
          
          <div className="space-y-2">
            <h3 className="font-display font-extrabold text-[#0F172A] text-sm flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-3.5 bg-[#0284C7] rounded-full inline-block"></span>
              Ajustes de Saída
            </h3>
            <p className="text-[11px] text-[#475569] font-semibold leading-normal">
              Defina as especificações de formato, taxa de amostragem e compressão de áudio.
            </p>
          </div>

          <div className="border-t border-[#E2E8F0] my-4"></div>

          {/* Format Selector Tab Buttons */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-text-main flex items-center gap-1.5">
              <Music className="h-4 w-4 text-[#0284C7]" />
              Formato de Saída:
            </label>
            <div className="grid grid-cols-5 gap-2.5" id="format-selector-grid">
              {(["mp3", "wav", "aac", "flac", "ogg"] as const).map((format) => {
                const isSelected = selectedFormat === format;
                const IconComponent = 
                  format === "mp3" ? Music : 
                  format === "wav" ? FileAudio : 
                  format === "aac" ? Volume2 : 
                  format === "flac" ? ShieldCheck : Music;
                return (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    disabled={isProcessing}
                    className={`py-3.5 px-1.5 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      isSelected
                        ? "border-[#0284C7] bg-[#E0F2FE] text-[#0284C7] shadow-sm scale-[1.02]"
                        : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#0284C7]/50 hover:bg-[#F8FAFC] hover:text-[#0F172A] disabled:opacity-50"
                    }`}
                  >
                    <IconComponent className={`h-5 w-5 transition-transform ${isSelected ? "scale-110 text-[#0284C7]" : "text-[#64748B]"}`} />
                    <span className="text-xs font-extrabold uppercase tracking-wider">{format}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Configuration Panel */}
          <div className="space-y-4">
            
            {/* MP3 Options */}
            {selectedFormat === "mp3" && (
              <div className="space-y-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <label className="text-xs font-extrabold text-[#0F172A] flex items-center gap-1.5">
                  <Volume2 className="h-4 w-4 text-[#0284C7]" />
                  Selecione o Bitrate (Qualidade MP3):
                </label>
                
                {/* Wide Grid of Quality Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" id="bitrate-selector">
                  {([
                    { value: 64, label: "64 kbps", desc: "Muito leve", badge: "Econômico" },
                    { value: 96, label: "96 kbps", desc: "Econômico", badge: "Compacto" },
                    { value: 112, label: "112 kbps", desc: "Equilíbrio", badge: "Leve" },
                    { value: 128, label: "128 kbps", desc: "Recomendado", badge: "Padrão" },
                    { value: 192, label: "192 kbps", desc: "Alta qualidade", badge: "Fidelidade" },
                    { value: 256, label: "256 kbps", desc: "Superior", badge: "Estúdio" },
                    { value: 320, label: "320 kbps", desc: "Máxima qualidade", badge: "Máxima" }
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedKbps(opt.value)}
                      disabled={isProcessing}
                      type="button"
                      className={`w-full min-w-[120px] min-h-[115px] p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-between shadow-sm relative overflow-hidden ${
                        selectedKbps === opt.value
                          ? "border-[#0284C7] bg-[#E0F2FE] text-[#0284C7] scale-[1.02]"
                          : "border-[#E2E8F0] bg-white hover:border-[#0284C7]/50 text-[#475569] hover:text-[#0F172A] disabled:opacity-50"
                      }`}
                    >
                      {/* Quality Badge - Top */}
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0 ${
                        selectedKbps === opt.value 
                          ? "text-[#0284C7] border-[#0284C7]/30 bg-[#0284C7]/10" 
                          : "text-[#64748B] border-[#E2E8F0] bg-[#F1F5F9]"
                      }`}>
                        {opt.badge}
                      </span>
                      
                      {/* Text Data - Mid */}
                      <div className="my-1.5">
                        <span className="text-[14px] sm:text-[15px] font-extrabold tracking-tight block">{opt.label}</span>
                        <span className="text-[10px] font-semibold opacity-80 mt-0.5 block leading-tight">{opt.desc}</span>
                      </div>
                      
                      {/* Active Indicator Dot - Bottom */}
                      <div className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${selectedKbps === opt.value ? "bg-[#0284C7] scale-110" : "bg-transparent"}`}></div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* WAV Options */}
            {selectedFormat === "wav" && (
              <div className="space-y-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                
                {/* WAV sample rate */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-[#0F172A] block">
                    Taxa de Amostragem (Frequência):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-lg border border-[#E2E8F0]">
                    {([
                      { value: "original", label: "Manter Original" },
                      { value: "44100", label: "44.100 Hz" },
                      { value: "48000", label: "48.000 Hz" }
                    ] as const).map((opt) => {
                      const isSel = wavSampleRate === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setWavSampleRate(opt.value)}
                          disabled={isProcessing}
                          className={`py-2 text-[10px] font-bold rounded transition-all cursor-pointer border ${
                            isSel ? "bg-[#E0F2FE] text-[#0284C7] border-[#0284C7]/30" : "border-transparent text-[#475569] hover:text-[#0F172A]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* WAV channels */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-[#0F172A] block">
                    Canais de Áudio:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-lg border border-[#E2E8F0]">
                    {([
                      { value: "original", label: "Manter Original" },
                      { value: "mono", label: "Mono" },
                      { value: "stereo", label: "Estéreo" }
                    ] as const).map((opt) => {
                      const isSel = wavChannels === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setWavChannels(opt.value)}
                          disabled={isProcessing}
                          className={`py-2 text-[10px] font-bold rounded transition-all cursor-pointer border ${
                            isSel ? "bg-[#E0F2FE] text-[#0284C7] border-[#0284C7]/30" : "border-transparent text-[#475569] hover:text-[#0F172A]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[10px] text-[#475569] border-l-2 border-[#0284C7] pl-2 leading-relaxed">
                  O arquivo WAV gerado utilizará codificação linear PCM de 16 bits sem qualquer compressão destrutiva de dados.
                </div>
              </div>
            )}
            {/* AAC Settings */}
            {selectedFormat === "aac" && (
              <div className="space-y-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] animate-fade-in">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-[#0F172A] block">
                    Taxa de Bits (Bitrate):
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 bg-white p-1 rounded-lg border border-[#E2E8F0]">
                    {([96, 128, 192, 256] as const).map((kbps) => (
                      <button
                        key={kbps}
                        onClick={() => setAacKbps(kbps)}
                        disabled={isProcessing}
                        type="button"
                        className={`py-2 text-[10px] font-bold rounded transition-all cursor-pointer border ${
                          aacKbps === kbps 
                            ? "bg-[#E0F2FE] text-[#0284C7] border-[#0284C7]/30" 
                            : "border-transparent text-[#475569] hover:text-[#0F172A]"
                        }`}
                      >
                        {kbps}k
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-[#475569] border-l-2 border-[#0284C7] pl-2 leading-relaxed">
                  O formato AAC fornece alta eficiência de compressão de áudio, ideal para reprodução moderna.
                </div>
              </div>
            )}

            {/* FLAC Settings */}
            {selectedFormat === "flac" && (
              <div className="space-y-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] animate-fade-in">
                <div className="p-3 bg-white border border-[#0284C7]/20 rounded-xl flex items-start space-x-2">
                  <ShieldCheck className="h-4 w-4 text-[#0284C7] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-[11px] font-bold text-[#0284C7]">Qualidade Lossless Estúdio</h4>
                    <p className="text-[10px] text-[#475569] leading-relaxed mt-0.5 font-semibold">
                      O formato FLAC mantém a qualidade máxima de estúdio com compressão sem perdas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* OGG Settings */}
            {selectedFormat === "ogg" && (
              <div className="space-y-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] animate-fade-in">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-[#0F172A] block">
                    Qualidade de Áudio (Opus):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-lg border border-[#E2E8F0]">
                    {(["low", "medium", "high"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setOggQuality(lvl)}
                        disabled={isProcessing}
                        type="button"
                        className={`py-2 text-[10px] font-bold rounded transition-all cursor-pointer border capitalize ${
                          oggQuality === lvl 
                            ? "bg-[#E0F2FE] text-[#0284C7] border-[#0284C7]/30" 
                            : "border-transparent text-[#475569] hover:text-[#0F172A]"
                        }`}
                      >
                        {lvl === "low" ? "Baixa (96k)" : lvl === "medium" ? "Média (160k)" : "Alta (256k)"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-[#475569] border-l-2 border-[#0284C7] pl-2 leading-relaxed">
                  O contêiner Ogg/Opus oferece uma alternativa livre de alta eficiência para web e streaming profissional.
                </div>
              </div>
            )}

          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2 space-y-3">
            {isProcessing ? (
              <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-2xl border border-dashed border-[#0284C7]/30 shadow-sm">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#475569]">
                  <span className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-[#0284C7]" />
                    <span>Processando {currentProcessingIndex + 1} de {queueLength}...</span>
                  </span>
                  <span className="text-[#0284C7] font-mono font-extrabold text-sm">{queue[currentProcessingIndex]?.progress || 0}%</span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden border border-[#CBD5E1]">
                  <div 
                    className="h-full bg-[#0284C7] transition-all duration-300 rounded-full" 
                    style={{ width: `${queue[currentProcessingIndex]?.progress || 0}%` }}
                  />
                </div>

                <button
                  onClick={cancelQueue}
                  className="w-full py-3 px-4 text-xs font-bold rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 duration-200"
                  id="btn-cancel-conversion"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar Processamento</span>
                </button>
              </div>
            ) : completedCount >= 2 ? (
              <div className="space-y-3 bg-[#ECFDF5] p-4 rounded-2xl border border-[#10B981]/30 shadow-sm">
                <button
                  onClick={() => handleDownloadAllZip()}
                  disabled={isGeneratingZip}
                  className="w-full py-3.5 px-4 text-xs font-extrabold rounded-xl bg-[#10B981] hover:bg-[#059669] text-white shadow-md flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
                  id="btn-download-all-zip"
                >
                  {isGeneratingZip ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Comprimindo Lote em ZIP...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Baixar Lote Completo (ZIP)</span>
                    </>
                  )}
                </button>
                <button
                  onClick={clearQueue}
                  className="w-full py-3 px-4 text-xs font-bold rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Iniciar Novo Lote</span>
                </button>
              </div>
            ) : (
              <button
                onClick={startBatchConversion}
                disabled={queueLength === 0}
                className={`w-full min-h-[54px] py-4 px-6 text-sm font-extrabold rounded-xl text-white shadow-md transition-all flex items-center justify-center space-x-2.5 duration-300 uppercase tracking-wider ${
                  queueLength > 0
                    ? "bg-[#0284C7] hover:bg-[#0369A1] cursor-pointer"
                    : "bg-[#0284C7]/50 text-white/70 border border-[#0284C7]/20 cursor-not-allowed opacity-65 shadow-none"
                }`}
                id="btn-start-batch"
              >
                <Play className="h-4.5 w-4.5 fill-white" />
                <span>Converter Áudio Agora</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Global Error Alert block */}
      {globalError && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3.5 text-left animate-shake" id="global-error-alert">
          <AlertCircle className="h-5.5 w-5.5 text-red-600 mt-0.5 shrink-0" id="error-icon" />
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-extrabold text-red-700 uppercase tracking-wider">Aviso de Limitação</h4>
            <p className="text-[14px] text-red-600 leading-relaxed mt-1 font-semibold" id="global-error-message">
              {globalError}
            </p>
          </div>
          <button onClick={() => setGlobalError(null)} className="text-[#64748B] hover:text-[#0F172A] shrink-0 cursor-pointer">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* Safety Size Warning Modal */}
      {zipWarningType !== "none" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" id="zip-warning-modal">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4" id="zip-warning-content">
            <div className="flex items-center space-x-3 text-[#0284C7]">
              <AlertCircle className="h-6 w-6 text-amber-500 animate-bounce" />
              <h3 className="font-display font-extrabold text-base text-[#0F172A]">
                {zipWarningType === "warning-100" ? "Consumo de Memória Elevado" : "Aviso de Tamanho de Arquivo"}
              </h3>
            </div>
            
            <p className="text-xs text-[#475569] leading-relaxed font-semibold">
              {zipWarningType === "warning-100" ? (
                <>
                  O tamanho total dos arquivos convertidos é elevado (<strong>{formatBytes(queue.filter(item => item.status === "concluido").reduce((sum, item) => sum + (item.convertedSize || 0), 0))}</strong>). Recomendamos baixar os arquivos individualmente para maior rapidez. Se preferir, você ainda pode tentar gerar o arquivo ZIP.
                </>
              ) : (
                <>
                  O tamanho total dos arquivos convertidos é grande (<strong>{formatBytes(queue.filter(item => item.status === "concluido").reduce((sum, item) => sum + (item.convertedSize || 0), 0))}</strong>). A geração do arquivo ZIP pode demorar em alguns dispositivos. Deseja prosseguir?
                </>
              )}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleDownloadAllZip(true)}
                className="w-full px-4 py-2.5 text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-white rounded-xl transition-colors cursor-pointer shadow-sm"
                id="btn-confirm-zip"
              >
                {zipWarningType === "warning-100" ? "Gerar ZIP mesmo assim" : "Sim, gerar ZIP"}
              </button>
              <button
                onClick={() => setZipWarningType("none")}
                className="w-full px-4 py-2.5 text-xs font-bold bg-[#F8FAFC] border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] rounded-xl transition-colors cursor-pointer"
                id="btn-cancel-zip"
              >
                {zipWarningType === "warning-100" ? "Baixar arquivos individualmente" : "Cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
