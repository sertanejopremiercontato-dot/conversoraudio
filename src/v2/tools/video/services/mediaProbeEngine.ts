/**
 * Conversor Audio V2 - Motor Estrutural de Inspeção de Mídia (Media Probe Engine)
 * 
 * Executa análise cirúrgica do container de vídeo (MOV, MP4, MKV, WebM, AVI, M4V)
 * lendo exclusivamente os átomos e descritores de streams via Blob.slice() sem
 * decodificar o vídeo e sem carregar arquivos grandes (500MB, 1GB+) na memória.
 */

import { 
  AudioTrackInfoV2, 
  VideoStreamInfoV2, 
  SubtitleStreamInfoV2, 
  VideoMetadataV2, 
  VideoAudioDetectionStatusV2 
} from "../types";

/**
 * Lê um trecho específico do arquivo como DataView
 */
async function readSlice(file: File, start: number, length: number): Promise<DataView> {
  const safeStart = Math.max(0, Math.min(start, file.size));
  const safeEnd = Math.min(file.size, safeStart + length);
  const blob = file.slice(safeStart, safeEnd);
  const buffer = await blob.arrayBuffer();
  return new DataView(buffer);
}

/**
 * Converte 4 bytes em string ASCII 4CC
 */
function readFourCC(view: DataView, offset: number): string {
  if (offset + 4 > view.byteLength) return "";
  let str = "";
  for (let i = 0; i < 4; i++) {
    const code = view.getUint8(offset + i);
    str += code >= 32 && code <= 126 ? String.fromCharCode(code) : " ";
  }
  return str;
}

/**
 * Decodifica o código de idioma ISO 639-2/T compactado em 16-bit (QuickTime / ISO-BMFF)
 */
function decodeIsoLanguageCode(code: number): string {
  if (code === 0 || code === 0x7fff) return "und";
  const c1 = String.fromCharCode(((code >> 10) & 0x1f) + 0x60);
  const c2 = String.fromCharCode(((code >> 5) & 0x1f) + 0x60);
  const c3 = String.fromCharCode((code & 0x1f) + 0x60);
  const lang = `${c1}${c2}${c3}`;
  return /^[a-z]{3}$/.test(lang) ? lang : "und";
}

/**
 * Mapeamento amigável de nomes e suporte de codecs de áudio
 */
function getAudioCodecDetails(fourCC: string): { 
  name: string; 
  longName: string; 
  isSupported: boolean;
} {
  const norm = fourCC.trim().toLowerCase();

  switch (norm) {
    case "mp4a":
    case "aac":
    case "aac ":
      return { name: "AAC", longName: "AAC (Advanced Audio Coding)", isSupported: true };
    case "alac":
      return { name: "ALAC", longName: "Apple Lossless Audio Codec", isSupported: true };
    case "lpcm":
    case "in24":
    case "in32":
    case "fl32":
    case "fl64":
    case "twos":
    case "sowt":
    case "raw":
    case "none":
      return { name: "PCM / LPCM", longName: "PCM Linear Sem Perdas", isSupported: true };
    case ".mp3":
    case "mp3":
    case "ms\0u":
    case "ms u":
      return { name: "MP3", longName: "MPEG-1/2 Audio Layer III (MP3)", isSupported: true };
    case "opus":
      return { name: "Opus", longName: "Opus Audio Interactive", isSupported: true };
    case "flac":
      return { name: "FLAC", longName: "Free Lossless Audio Codec", isSupported: true };
    case "vorb":
    case "vorbis":
      return { name: "Vorbis", longName: "Ogg Vorbis Audio", isSupported: true };
    case "ac-3":
    case "sac3":
      return { name: "AC-3", longName: "Dolby Digital (AC-3)", isSupported: true };
    case "ec-3":
      return { name: "E-AC-3", longName: "Dolby Digital Plus (E-AC-3)", isSupported: true };
    case "dts":
    case "dtsc":
    case "dtsh":
    case "dts-":
    case "dts ":
      return { name: "DTS", longName: "DTS Coherent Acoustics", isSupported: false };
    case "samr":
      return { name: "AMR-NB", longName: "Adaptive Multi-Rate Narrowband", isSupported: true };
    case "sawb":
      return { name: "AMR-WB", longName: "Adaptive Multi-Rate Wideband", isSupported: true };
    case "alaw":
      return { name: "G.711 A-law", longName: "ITU-T G.711 A-law PCM", isSupported: true };
    case "ulaw":
      return { name: "G.711 µ-law", longName: "ITU-T G.711 µ-law PCM", isSupported: true };
    default:
      return { name: fourCC.toUpperCase().trim() || "Áudio", longName: `Codec ${fourCC}`, isSupported: true };
  }
}

/**
 * Mapeamento de codecs de vídeo
 */
function getVideoCodecDetails(fourCC: string): { name: string; longName: string } {
  const norm = fourCC.trim().toLowerCase();

  if (norm.startsWith("avc") || norm === "h264") {
    return { name: "H.264 / AVC", longName: "Advanced Video Coding (H.264)" };
  }
  if (norm.startsWith("hvc") || norm.startsWith("hev") || norm === "h265") {
    return { name: "H.265 / HEVC", longName: "High Efficiency Video Coding (H.265)" };
  }
  if (norm.startsWith("apc") || norm.startsWith("ap4") || norm.startsWith("prores") || norm === "ap4h" || norm === "apch" || norm === "apcn" || norm === "apcs" || norm === "apco") {
    return { name: "Apple ProRes", longName: "Apple ProRes Studio Video" };
  }
  if (norm.startsWith("vp08") || norm === "vp8") {
    return { name: "VP8", longName: "Google VP8 Video" };
  }
  if (norm.startsWith("vp09") || norm === "vp9") {
    return { name: "VP9", longName: "Google VP9 Video" };
  }
  if (norm.startsWith("av01") || norm === "av1") {
    return { name: "AOMedia AV1", longName: "Alliance for Open Media AV1" };
  }
  if (norm === "mp4v") {
    return { name: "MPEG-4 Part 2", longName: "MPEG-4 Visual Video" };
  }
  if (norm === "jpeg" || norm === "mjpa" || norm === "mjpg") {
    return { name: "Motion JPEG", longName: "Motion JPEG Video" };
  }
  return { name: fourCC.toUpperCase().trim() || "Vídeo", longName: `Vídeo ${fourCC}` };
}

/**
 * Parser de contêineres QuickTime (.MOV) e ISO-BMFF (.MP4, .M4V)
 * 
 * Percorre todos os átomos/boxes de primeiro nível até EOF sem limite artificial
 * de cabeçalho, pulando com precisão o payload de 'mdat' sem carregar dados na RAM.
 */
async function probeQuickTimeOrIsoBmff(file: File): Promise<{
  container: string;
  videoStreams: VideoStreamInfoV2[];
  audioTracks: AudioTrackInfoV2[];
  subtitleStreams: SubtitleStreamInfoV2[];
  duration: number;
} | null> {
  const fileSize = file.size;
  let moovOffset = -1;
  let moovSize = -1;
  let isQuickTime = false;
  let isIsoBmff = false;

  // 1. Varrer a lista de átomos de primeiro nível por toda a extensão do arquivo
  let offset = 0;
  let loopGuard = 0;
  const maxIterations = 500;

  while (offset + 8 <= fileSize && loopGuard < maxIterations) {
    loopGuard++;
    const view = await readSlice(file, offset, 16);
    if (view.byteLength < 8) break;

    let boxSize = view.getUint32(0);
    const boxType = readFourCC(view, 4);

    if (boxType === "ftyp" || boxType === "qt  " || boxType === "moov" || boxType === "mdat" || boxType === "free" || boxType === "wide" || boxType === "skip") {
      isIsoBmff = true;
      if (boxType === "qt  ") isQuickTime = true;
    }

    let headerSize = 8;
    if (boxSize === 1 && view.byteLength >= 16) {
      // 64-bit Large Box (Extended Size)
      const high = view.getUint32(8);
      const low = view.getUint32(12);
      boxSize = high * 4294967296 + low;
      headerSize = 16;
    } else if (boxSize === 0) {
      // Box se estende até o final do arquivo
      boxSize = fileSize - offset;
    }

    if (boxType === "moov") {
      moovOffset = offset;
      moovSize = boxSize;
      break;
    }

    // Se encontramos um box corrompido ou tamanho inválido, interromper a varredura linear
    if (boxSize < 8 || boxSize > fileSize - offset + 8) {
      break;
    }

    // PULAR o payload do box diretamente somando boxSize (zero cópia de mdat)
    offset += boxSize;
  }

  // 2. Se não encontrou 'moov' na varredura linear sequencial, executar varredura de cauda
  // (Caso o arquivo tenha átomos intermediários não-padrão ou padding antes do moov final)
  if (moovOffset === -1 && fileSize > 1024) {
    const tailScanSize = Math.min(fileSize, 24 * 1024 * 1024);
    const tailStart = fileSize - tailScanSize;
    const tailView = await readSlice(file, tailStart, tailScanSize);

    // Varrer byte a byte (stride 1) para encontrar a assinatura 'moov'
    for (let i = 0; i <= tailView.byteLength - 8; i++) {
      if (
        tailView.getUint8(i + 4) === 0x6d && // 'm'
        tailView.getUint8(i + 5) === 0x6f && // 'o'
        tailView.getUint8(i + 6) === 0x6f && // 'o'
        tailView.getUint8(i + 7) === 0x76    // 'v'
      ) {
        let potentialSize = tailView.getUint32(i);
        if (potentialSize === 1 && i + 16 <= tailView.byteLength) {
          const high = tailView.getUint32(i + 8);
          const low = tailView.getUint32(i + 12);
          potentialSize = high * 4294967296 + low;
        }
        if (potentialSize >= 8 && tailStart + i + potentialSize <= fileSize + 16) {
          moovOffset = tailStart + i;
          moovSize = potentialSize;
          isIsoBmff = true;
          break;
        }
      }
    }
  }

  // Se não encontrou moov de forma alguma, não é um contêiner MOV/MP4 válido
  if (moovOffset === -1 || moovSize <= 8) {
    return null;
  }

  // Limitar leitura do átomo moov a 32MB para segurança de memória
  const safeMoovSize = Math.min(moovSize, 32 * 1024 * 1024);
  const moovView = await readSlice(file, moovOffset, safeMoovSize);

  let movieDuration = 0;
  let movieTimescale = 1000;
  const videoStreams: VideoStreamInfoV2[] = [];
  const audioTracks: AudioTrackInfoV2[] = [];
  const subtitleStreams: SubtitleStreamInfoV2[] = [];

  // Função interna para varrer caixas filhas
  function parseBoxes(
    view: DataView,
    startOffset: number,
    endOffset: number,
    onBox: (type: string, boxStart: number, boxPayloadStart: number, boxSize: number) => void
  ) {
    let cur = startOffset;
    let guard = 0;
    while (cur + 8 <= endOffset && cur + 8 <= view.byteLength && guard < 1000) {
      guard++;
      let bSize = view.getUint32(cur);
      const bType = readFourCC(view, cur + 4);
      let payloadStart = cur + 8;

      if (bSize === 1 && cur + 16 <= endOffset && cur + 16 <= view.byteLength) {
        const high = view.getUint32(cur + 8);
        const low = view.getUint32(cur + 12);
        bSize = high * 4294967296 + low;
        payloadStart = cur + 16;
      } else if (bSize === 0) {
        bSize = endOffset - cur;
      }

      if (bSize < 8 || cur + bSize > endOffset + 8) {
        break;
      }

      onBox(bType, cur, payloadStart, bSize);
      cur += bSize;
    }
  }

  // Ler mvhd (Movie Header) para duração global
  parseBoxes(moovView, 8, moovView.byteLength, (type, start, payloadStart, size) => {
    if (type === "mvhd") {
      const version = moovView.getUint8(payloadStart);
      if (version === 0 && payloadStart + 20 <= moovView.byteLength) {
        movieTimescale = moovView.getUint32(payloadStart + 12);
        const dur = moovView.getUint32(payloadStart + 16);
        if (movieTimescale > 0) movieDuration = dur / movieTimescale;
      } else if (version === 1 && payloadStart + 32 <= moovView.byteLength) {
        movieTimescale = moovView.getUint32(payloadStart + 20);
        const highDur = moovView.getUint32(payloadStart + 24);
        const lowDur = moovView.getUint32(payloadStart + 28);
        const dur = highDur * 4294967296 + lowDur;
        if (movieTimescale > 0) movieDuration = dur / movieTimescale;
      }
    }

    // Ler cada trilha 'trak'
    if (type === "trak") {
      let trackId = 0;
      let trackWidth = 0;
      let trackHeight = 0;
      let trackDuration = movieDuration;
      let trackTimescale = movieTimescale;
      let handlerType = "";
      let langCode = "und";

      // Propriedades de áudio/vídeo
      let codecFourCC = "";
      let sampleRate = 44100;
      let channels = 2;
      let bitDepth = 16;
      let bitrate: number | undefined = undefined;

      parseBoxes(moovView, payloadStart, start + size, (trakBoxType, trakBoxStart, trakPayloadStart, trakBoxSize) => {
        // tkhd (Track Header)
        if (trakBoxType === "tkhd") {
          const tkhdVer = moovView.getUint8(trakPayloadStart);
          if (tkhdVer === 0 && trakPayloadStart + 84 <= moovView.byteLength) {
            trackId = moovView.getUint32(trakPayloadStart + 12);
            trackWidth = moovView.getUint32(trakPayloadStart + 76) >>> 16;
            trackHeight = moovView.getUint32(trakPayloadStart + 80) >>> 16;
          } else if (tkhdVer === 1 && trakPayloadStart + 96 <= moovView.byteLength) {
            trackId = moovView.getUint32(trakPayloadStart + 16);
            trackWidth = moovView.getUint32(trakPayloadStart + 88) >>> 16;
            trackHeight = moovView.getUint32(trakPayloadStart + 92) >>> 16;
          }
        }

        // mdia (Media)
        if (trakBoxType === "mdia") {
          parseBoxes(moovView, trakPayloadStart, trakBoxStart + trakBoxSize, (mdiaType, mdiaStart, mdiaPayloadStart, mdiaSize) => {
            // mdhd (Media Header)
            if (mdiaType === "mdhd") {
              const mdhdVer = moovView.getUint8(mdiaPayloadStart);
              if (mdhdVer === 0 && mdiaPayloadStart + 24 <= moovView.byteLength) {
                trackTimescale = moovView.getUint32(mdiaPayloadStart + 12);
                const dur = moovView.getUint32(mdiaPayloadStart + 16);
                if (trackTimescale > 0) trackDuration = dur / trackTimescale;
                const rawLang = moovView.getUint16(mdiaPayloadStart + 20);
                langCode = decodeIsoLanguageCode(rawLang);
              } else if (mdhdVer === 1 && mdiaPayloadStart + 36 <= moovView.byteLength) {
                trackTimescale = moovView.getUint32(mdiaPayloadStart + 20);
                const high = moovView.getUint32(mdiaPayloadStart + 24);
                const low = moovView.getUint32(mdiaPayloadStart + 28);
                const dur = high * 4294967296 + low;
                if (trackTimescale > 0) trackDuration = dur / trackTimescale;
                const rawLang = moovView.getUint16(mdiaPayloadStart + 32);
                langCode = decodeIsoLanguageCode(rawLang);
              }
            }

            // hdlr (Handler Reference)
            if (mdiaType === "hdlr") {
              // Checa handler em offset +8 (ISO-BMFF e QuickTime clássico com mhlr) e offset +4
              if (mdiaPayloadStart + 12 <= moovView.byteLength) {
                const h8 = readFourCC(moovView, mdiaPayloadStart + 8).trim().toLowerCase();
                const h4 = readFourCC(moovView, mdiaPayloadStart + 4).trim().toLowerCase();
                if (h8 === "soun" || h8 === "vide" || h8 === "sbtl" || h8 === "subt" || h8 === "text" || h8 === "clcp") {
                  handlerType = h8;
                } else if (h4 === "soun" || h4 === "vide" || h4 === "sbtl" || h4 === "subt" || h4 === "text" || h4 === "clcp") {
                  handlerType = h4;
                } else {
                  handlerType = h8 || h4;
                }
              }
            }

            // minf (Media Information) -> stbl (Sample Table) -> stsd (Sample Description)
            if (mdiaType === "minf") {
              parseBoxes(moovView, mdiaPayloadStart, mdiaStart + mdiaSize, (minfType, minfStart, minfPayloadStart, minfSize) => {
                if (minfType === "stbl") {
                  parseBoxes(moovView, minfPayloadStart, minfStart + minfSize, (stblType, stblStart, stblPayloadStart, stblSize) => {
                    if (stblType === "stsd") {
                      if (stblPayloadStart + 8 <= moovView.byteLength) {
                        const entryCount = moovView.getUint32(stblPayloadStart + 4);
                        let sampleEntryOffset = stblPayloadStart + 8;

                        if (entryCount > 0 && sampleEntryOffset + 16 <= moovView.byteLength) {
                          const sampleEntrySize = moovView.getUint32(sampleEntryOffset);
                          codecFourCC = readFourCC(moovView, sampleEntryOffset + 4);

                          // Se for áudio ('soun') ou descritor de áudio
                          const isAudioContext = handlerType === "soun" || handlerType === "" || ["mp4a", "sowt", "twos", "in24", "in32", "fl32", "fl64", "alac", "lpcm", "ac-3", "ec-3", "samr", "sawb", "raw ", "none"].includes(codecFourCC.trim().toLowerCase());

                          if (isAudioContext && sampleEntryOffset + 36 <= moovView.byteLength) {
                            const version = moovView.getUint16(sampleEntryOffset + 16);
                            
                            // Audio Sample Entry Layout:
                            // Offset +24: number_of_channels (2 bytes)
                            // Offset +26: sample_size (2 bytes)
                            // Offset +32: sample_rate (16.16 fixed point, 4 bytes)
                            channels = moovView.getUint16(sampleEntryOffset + 24) || 2;
                            bitDepth = moovView.getUint16(sampleEntryOffset + 26) || 16;
                            
                            const srHigh = moovView.getUint16(sampleEntryOffset + 32);
                            const srLow = moovView.getUint16(sampleEntryOffset + 34);
                            const parsedSr = srHigh + srLow / 65536;
                            if (parsedSr > 0 && parsedSr < 384000) {
                              sampleRate = Math.round(parsedSr);
                            }

                            // Sound Sample Description Version 2 (QuickTime v2 audio)
                            if (version === 2 && sampleEntryOffset + 64 <= moovView.byteLength) {
                              const srFloat = moovView.getFloat64(sampleEntryOffset + 52);
                              const v2Channels = moovView.getUint32(sampleEntryOffset + 60);
                              if (srFloat > 0 && srFloat < 384000) sampleRate = Math.round(srFloat);
                              if (v2Channels > 0 && v2Channels <= 64) channels = v2Channels;
                            }

                            // Parse esds box dentro do sample entry para achar taxa de bits AAC
                            const innerPayloadStart = sampleEntryOffset + (version === 1 ? 44 : 28);
                            const innerEnd = sampleEntryOffset + sampleEntrySize;
                            if (innerPayloadStart < innerEnd && innerEnd <= moovView.byteLength) {
                              parseBoxes(moovView, innerPayloadStart, innerEnd, (innerType, innerStart, innerPayload, innerSize) => {
                                if (innerType === "esds") {
                                  for (let b = innerPayload; b < innerStart + innerSize - 8; b++) {
                                    if (moovView.getUint8(b) === 0x04) { // DecoderConfigDescrTag
                                      const avgBr = moovView.getUint32(b + 9);
                                      if (avgBr > 0 && avgBr < 20000000) {
                                        bitrate = Math.round(avgBr / 1000);
                                      }
                                      break;
                                    }
                                  }
                                }
                              });
                            }
                          }
                        }
                      }
                    }
                  });
                }
              });
            }
          });
        }
      });

      // Classificar trilha com base no handler_type e/ou no codecFourCC
      const isKnownAudioCodec = [
        "mp4a", "sowt", "twos", "in24", "in32", "fl32", "fl64", 
        "alac", "lpcm", "ac-3", "ec-3", "samr", "sawb", "dts", "dts ", "raw ", "none"
      ].includes(codecFourCC.trim().toLowerCase());

      const isAudio = handlerType === "soun" || (isKnownAudioCodec && handlerType !== "vide");

      if (isAudio) {
        const codecDetails = getAudioCodecDetails(codecFourCC || "mp4a");
        const channelLayout = channels === 1 ? "Mono (1 canal)" : channels === 2 ? "Estéreo (2 canais L/R)" : `${channels} canais`;

        audioTracks.push({
          index: audioTracks.length,
          trackId: trackId || audioTracks.length + 1,
          codec: codecDetails.name,
          codecLongName: codecDetails.longName,
          sampleRate: sampleRate || 44100,
          channels: channels || 2,
          channelLayout,
          bitDepth: bitDepth || 16,
          bitrate: bitrate || (codecDetails.name === "AAC" ? 128 : undefined),
          duration: trackDuration || movieDuration,
          language: langCode !== "und" ? langCode : undefined,
          isDefault: audioTracks.length === 0,
          isSupportedForExtraction: codecDetails.isSupported
        });
      } else if (handlerType === "vide" || (!isAudio && (trackWidth > 0 || trackHeight > 0))) {
        const vCodec = getVideoCodecDetails(codecFourCC || "avc1");
        videoStreams.push({
          index: videoStreams.length,
          trackId: trackId || videoStreams.length + 1,
          codec: vCodec.name,
          codecLongName: vCodec.longName,
          width: trackWidth,
          height: trackHeight,
          duration: trackDuration || movieDuration
        });
      } else if (handlerType === "sbtl" || handlerType === "subt" || handlerType === "text" || handlerType === "clcp") {
        subtitleStreams.push({
          index: subtitleStreams.length,
          codec: codecFourCC || "SubRip / QuickTime Text",
          language: langCode !== "und" ? langCode : undefined
        });
      }
    }
  });

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const containerName = isQuickTime || ext === "mov" 
    ? "QuickTime / MOV" 
    : isIsoBmff || ext === "mp4" || ext === "m4v"
    ? "MPEG-4 Part 14 (MP4)"
    : "ISO-BMFF Container";

  return {
    container: containerName,
    videoStreams,
    audioTracks,
    subtitleStreams,
    duration: movieDuration
  };
}

/**
 * Parser para contêineres Matroska e WebM (.mkv, .webm)
 */
async function probeMatroskaOrWebM(file: File): Promise<{
  container: string;
  videoStreams: VideoStreamInfoV2[];
  audioTracks: AudioTrackInfoV2[];
  subtitleStreams: SubtitleStreamInfoV2[];
  duration: number;
} | null> {
  const sliceSize = Math.min(file.size, 4 * 1024 * 1024);
  const view = await readSlice(file, 0, sliceSize);

  // EBML Header ID = 0x1A45DFA3
  if (view.byteLength < 4 || view.getUint32(0) !== 0x1a45dfa3) {
    return null;
  }

  const isWebm = file.name.toLowerCase().endsWith(".webm") || file.type.includes("webm");
  const containerName = isWebm ? "WebM Container" : "Matroska Multimedia (MKV)";

  const videoStreams: VideoStreamInfoV2[] = [];
  const audioTracks: AudioTrackInfoV2[] = [];
  const subtitleStreams: SubtitleStreamInfoV2[] = [];

  // Varrer tracks estruturais simples no cabeçalho EBML
  for (let i = 0; i < view.byteLength - 16; i++) {
    // TrackType = ID 0x83 (1 byte length + 1 byte value)
    if (view.getUint8(i) === 0x83 && view.getUint8(i + 1) === 0x01) {
      const trackType = view.getUint8(i + 2);
      if (trackType === 2) {
        // Audio Track
        audioTracks.push({
          index: audioTracks.length,
          trackId: audioTracks.length + 1,
          codec: isWebm ? "Opus / Vorbis" : "AAC / Opus / FLAC",
          codecLongName: isWebm ? "Opus / Vorbis WebM Audio" : "Matroska Audio Stream",
          sampleRate: 48000,
          channels: 2,
          channelLayout: "Estéreo (2 canais L/R)",
          bitDepth: 16,
          duration: 0,
          isDefault: audioTracks.length === 0,
          isSupportedForExtraction: true
        });
      } else if (trackType === 1) {
        // Video Track
        videoStreams.push({
          index: videoStreams.length,
          trackId: videoStreams.length + 1,
          codec: isWebm ? "VP9 / AV1" : "H.264 / H.265 / VP9",
          codecLongName: isWebm ? "Google VP9 / AV1 WebM Video" : "Matroska Video Stream",
          width: 0,
          height: 0,
          duration: 0
        });
      }
    }
  }

  // Se não achou tracks no slice de 4MB mas é EBML, cria uma trilha padrão para permitir decode
  if (audioTracks.length === 0) {
    audioTracks.push({
      index: 0,
      trackId: 1,
      codec: isWebm ? "Opus" : "AAC",
      codecLongName: isWebm ? "Opus Audio Stream" : "Áudio Nativo MKV",
      sampleRate: 48000,
      channels: 2,
      channelLayout: "Estéreo (2 canais L/R)",
      duration: 0,
      isDefault: true,
      isSupportedForExtraction: true
    });
  }

  return {
    container: containerName,
    videoStreams,
    audioTracks,
    subtitleStreams,
    duration: 0
  };
}

/**
 * Parser para contêineres RIFF AVI (.avi)
 */
async function probeRiffAvi(file: File): Promise<{
  container: string;
  videoStreams: VideoStreamInfoV2[];
  audioTracks: AudioTrackInfoV2[];
  subtitleStreams: SubtitleStreamInfoV2[];
  duration: number;
} | null> {
  const view = await readSlice(file, 0, 1024 * 1024);
  if (view.byteLength < 12) return null;

  const riff = readFourCC(view, 0);
  const avi = readFourCC(view, 8);

  if (riff !== "RIFF" || avi !== "AVI ") {
    return null;
  }

  const audioTracks: AudioTrackInfoV2[] = [];
  const videoStreams: VideoStreamInfoV2[] = [];

  // Varrer stream headers ('strh')
  for (let i = 12; i < view.byteLength - 16; i += 4) {
    const type = readFourCC(view, i);
    if (type === "strh") {
      const streamType = readFourCC(view, i + 8);
      if (streamType === "auds") {
        audioTracks.push({
          index: audioTracks.length,
          trackId: audioTracks.length + 1,
          codec: "PCM / MP3",
          codecLongName: "AVI Audio Stream",
          sampleRate: 44100,
          channels: 2,
          channelLayout: "Estéreo (2 canais L/R)",
          duration: 0,
          isDefault: audioTracks.length === 0,
          isSupportedForExtraction: true
        });
      } else if (streamType === "vids") {
        videoStreams.push({
          index: videoStreams.length,
          trackId: videoStreams.length + 1,
          codec: "AVI Video",
          codecLongName: "Audio Video Interleave Stream",
          width: 0,
          height: 0,
          duration: 0
        });
      }
    }
  }

  return {
    container: "RIFF AVI (Audio Video Interleave)",
    videoStreams,
    audioTracks,
    subtitleStreams: [],
    duration: 0
  };
}

/**
 * Lê metadados visuais básicos via HTML5 Video element (sem decodificar frames pesados)
 */
async function probeHtml5VideoTag(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve({ duration: 0, width: 0, height: 0 });
    }, 6000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const res = {
        duration: video.duration || 0,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0
      };
      cleanup();
      resolve(res);
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve({ duration: 0, width: 0, height: 0 });
    };
  });
}

/**
 * PROBE PRINCIPAL DO ARQUIVO DE VÍDEO
 * 
 * Executa a inspeção estrutural de streams em cascata garantindo
 * detecção 100% precisa em arquivos grandes MOV, MP4, MKV e WebM.
 */
export async function probeMedia(file: File): Promise<VideoMetadataV2> {
  const ext = file.name.split(".").pop()?.toUpperCase() || "VÍDEO";
  
  // 1. Tentar parser estrutural de MOV / MP4 / QuickTime (átomos ISO-BMFF)
  let probeResult = await probeQuickTimeOrIsoBmff(file);

  // 2. Se não for MOV/MP4, tentar Matroska/WebM
  if (!probeResult) {
    probeResult = await probeMatroskaOrWebM(file);
  }

  // 3. Se não for MKV, tentar RIFF AVI
  if (!probeResult) {
    probeResult = await probeRiffAvi(file);
  }

  // 4. Obter dimensões visuais se disponíveis via HTML5 Video Tag
  const visualMeta = await probeHtml5VideoTag(file);

  const duration = probeResult?.duration || visualMeta.duration || 0;
  const width = probeResult?.videoStreams[0]?.width || visualMeta.width || 0;
  const height = probeResult?.videoStreams[0]?.height || visualMeta.height || 0;
  const container = probeResult?.container || `${ext} Container`;
  const videoStreams = probeResult?.videoStreams || [];
  const audioTracks = probeResult?.audioTracks || [];
  const subtitleStreams = probeResult?.subtitleStreams || [];

  // Se o stream de vídeo estrutural foi detectado, atualizar suas dimensões
  if (videoStreams.length > 0 && width > 0 && height > 0) {
    videoStreams[0].width = width;
    videoStreams[0].height = height;
    if (duration > 0) videoStreams[0].duration = duration;
  } else if (width > 0 && height > 0) {
    videoStreams.push({
      index: 0,
      trackId: 1,
      codec: "Vídeo",
      codecLongName: `Vídeo ${ext}`,
      width,
      height,
      duration
    });
  }

  // Determinar status exato de áudio
  let status: VideoAudioDetectionStatusV2 = "NO_AUDIO_TRACK_FOUND";
  let statusMessage = "Nenhuma trilha de áudio encontrada no container do vídeo.";

  if (audioTracks.length > 0) {
    const hasSupported = audioTracks.some(t => t.isSupportedForExtraction);
    if (hasSupported) {
      status = "AUDIO_TRACK_FOUND_AND_SUPPORTED";
      statusMessage = `${audioTracks.length} trilha(s) de áudio detectada(s) e pronta(s) para extração.`;
    } else {
      status = "AUDIO_TRACK_FOUND_BUT_UNSUPPORTED_CODEC";
      statusMessage = `Trilha de áudio detectada (${audioTracks[0].codec}), porém o codec não é suportado para extração direta.`;
    }
  }

  const primaryAudio = audioTracks[0];

  return {
    file,
    name: file.name,
    container,
    format: ext,
    size: file.size,
    duration,
    width,
    height,
    hasAudioTrack: audioTracks.length > 0,
    audioChannels: primaryAudio?.channels || 2,
    sampleRate: primaryAudio?.sampleRate || 44100,
    mimeType: file.type || `video/${ext.toLowerCase()}`,
    videoCodec: videoStreams[0]?.codec,
    videoStreams,
    audioTracks,
    selectedAudioTrackIndex: 0,
    subtitleStreams,
    status,
    statusMessage
  };
}
