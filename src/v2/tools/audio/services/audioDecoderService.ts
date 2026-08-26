/**
 * Conversor Audio V2 - Audio Decoder Service
 * 
 * Processamento 100% no cliente via Web Audio API e validação binária de cabeçalhos.
 */

export async function checkAudioMagicBytes(file: File): Promise<boolean> {
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

export function checkMp4Audio(arrayBuffer: ArrayBuffer): { hasAudio: boolean; hasVideo: boolean } {
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
      
      if (boxSize < headerSize || pos + boxSize > end) break;
      
      const typeBytes = [
        view.getUint8(pos + 4),
        view.getUint8(pos + 5),
        view.getUint8(pos + 6),
        view.getUint8(pos + 7)
      ];
      const type = String.fromCharCode(...typeBytes);
      
      if (type === "moov" || type === "trak" || type === "mdia" || type === "minf") {
        parseBoxes(pos + headerSize, pos + boxSize);
      } else if (type === "hdlr") {
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
    console.error("Erro ao analisar estrutura MP4:", e);
  }
  
  return { hasAudio, hasVideo };
}

export interface AudioMetadataInfoV2 {
  duration: number;
  channels: number;
  sampleRate: number;
  formatDetected: string;
  bitDepth?: number;
  bitrateKbps?: number;
}

export async function readAudioMetadata(file: File): Promise<AudioMetadataInfoV2> {
  const arrayBuffer = await file.arrayBuffer();
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isVideoContainer = ["mp4", "webm", "3gp", "3gpp", "mov", "m4v", "mkv", "ogv"].includes(ext) || file.type.startsWith("video/");
  
  if (isVideoContainer && (ext === "mp4" || file.type.includes("mp4"))) {
    const mp4Info = checkMp4Audio(arrayBuffer);
    if (!mp4Info.hasAudio && mp4Info.hasVideo) {
      throw new Error("O arquivo de vídeo selecionado não contém faixa de áudio utilizável.");
    }
  }

  // Identificação de formato e bit depth via headers binários
  const bytes = new Uint8Array(arrayBuffer.slice(0, 1024));
  let formatDetected = ext.toUpperCase() || "AUDIO";
  let detectedBitDepth: number | undefined = undefined;

  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    formatDetected = "WAV";
    // Check fmt chunk for bit depth
    const view = new DataView(arrayBuffer);
    for (let i = 12; i < Math.min(arrayBuffer.byteLength - 16, 256); i++) {
      if (
        bytes[i] === 0x66 && // 'f'
        bytes[i + 1] === 0x6D && // 'm'
        bytes[i + 2] === 0x74 && // 't'
        bytes[i + 3] === 0x20 // ' '
      ) {
        if (i + 24 <= arrayBuffer.byteLength) {
          detectedBitDepth = view.getUint16(i + 22, true);
        }
        break;
      }
    }
  } else if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    formatDetected = "MP3";
  } else if (bytes[0] === 0x66 && bytes[1] === 0x4C && bytes[2] === 0x61 && bytes[3] === 0x43) {
    formatDetected = "FLAC";
    detectedBitDepth = 16; // Standard FLAC default
  } else if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    formatDetected = "OGG";
  } else if (ext === "m4a" || ext === "aac") {
    formatDetected = "AAC";
  }

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("A API de áudio (Web Audio API) não é suportada neste navegador.");
  }

  const audioCtx = new AudioContextClass();
  try {
    const buffer = await audioCtx.decodeAudioData(arrayBuffer);
    if (!buffer || buffer.duration === 0) {
      throw new Error("Nenhuma faixa de áudio foi identificada no arquivo.");
    }

    const duration = buffer.duration;
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitrateKbps = duration > 0 ? Math.round((file.size * 8) / (duration * 1000)) : undefined;

    const meta: AudioMetadataInfoV2 = {
      duration,
      channels,
      sampleRate,
      formatDetected,
      bitDepth: detectedBitDepth,
      bitrateKbps
    };

    audioCtx.close();
    return meta;
  } catch (err: any) {
    audioCtx.close();
    if (err.message && (err.message.includes("vídeo") || err.message.includes("faixa de áudio"))) {
      throw err;
    }

    const isAmrHeader = bytes[0] === 0x23 && bytes[1] === 0x21 && bytes[2] === 0x41 && bytes[3] === 0x4D && bytes[4] === 0x52;
    if (isAmrHeader || ext === "amr") {
      throw new Error("O formato AMR não é suportado nativamente pelo decodificador do navegador.");
    }

    if (ext === "3gp" || ext === "3gpp") {
      throw new Error("O arquivo 3GP utiliza um codec de voz móvel não suportado pelo navegador.");
    }

    if (ext === "wma") {
      throw new Error("O formato proprietário WMA (Windows Media Audio) não é suportado pelo navegador.");
    }

    if (ext === "ac3") {
      throw new Error("O formato Dolby Digital AC3 não é suportado nativamente pelo navegador.");
    }

    throw new Error(`Não foi possível decodificar o arquivo (${ext.toUpperCase() || "MÍDIA"}). O codec não é suportado pelo navegador.`);
  }
}
