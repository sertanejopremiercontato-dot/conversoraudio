import * as mm from "music-metadata-browser";
import {
  AudioMetadataModel,
  AudioCoverArt,
  RiffChunkItem,
  RawMetadataItem,
  ID3FrameItem,
  RawMetadataInventoryItem
} from "../../types/audioMetadata";
import { checkAudioMagicBytes } from "./audioMagicBytesService";
import { computeAudioPayloadHash, computeFileHash } from "./metadataWriterService";

/**
 * Standard ID3v1 Genre List
 */
const ID3_GENRES = [
  "Blues", "Classic Rock", "Country", "Dance", "Disco", "Funk", "Grunge", "Hip-Hop",
  "Jazz", "Metal", "New Age", "Oldies", "Other", "Pop", "R&B", "Rap", "Reggae", "Rock",
  "Techno", "Industrial", "Alternative", "Ska", "Death Metal", "Pranks", "Soundtrack",
  "Euro-Techno", "Ambient", "Trip-Hop", "Vocal", "Jazz+Funk", "Fusion", "Trance",
  "Classical", "Instrumental", "Acid", "House", "Game", "Sound Clip", "Gospel",
  "Noise", "AlternRock", "Bass", "Soul", "Punk", "Space", "Meditative", "Instrumental Pop",
  "Instrumental Rock", "Ethnic", "Gothic", "Darkwave", "Techno-Industrial", "Electronic",
  "Pop-Folk", "Eurodance", "Dream", "Southern Rock", "Comedy", "Cult", "Gangsta",
  "Top 40", "Christian Rap", "Pop/Funk", "Jungle", "Native American", "Cabaret",
  "New Wave", "Psychadelic", "Rave", "Showtunes", "Trailer", "Lo-Fi", "Tribal",
  "Acid Punk", "Acid Jazz", "Polka", "Retro", "Musical", "Rock & Roll", "Hard Rock",
  "Folk", "Folk-Rock", "National Folk", "Swing", "Fast Fusion", "Bebop", "Latin",
  "Revival", "Celtic", "Bluegrass", "Avantgarde", "Gothic Rock", "Progressive Rock",
  "Psychedelic Rock", "Symphonic Rock", "Slow Rock", "Big Band", "Chorus",
  "Easy Listening", "Acoustic", "Humour", "Speech", "Chanson", "Opera", "Chamber Music",
  "Sonata", "Symphony", "Booty Bass", "Primus", "Porn Groove", "Satire", "Slow Jam",
  "Club", "Tango", "Samba", "Folklore", "Ballad", "Power Ballad", "Rhythmic Soul",
  "Freestyle", "Duet", "Punk Rock", "Drum Solo", "A capella", "Euro-House", "Dance Hall",
  "Goa", "Drum & Bass", "Club-House", "Hardcore", "Terror", "Indie", "BritPop",
  "Negerpunk", "Polsk Punk", "Beat", "Christian Gangsta Rap", "Heavy Metal", "Black Metal",
  "Crossover", "Contemporary Christian", "Christian Rock", "Merengue", "Salsa",
  "Thrash Metal", "Anime", "JPop", "Synthpop", "Sertanejo", "Forró", "Pagode", "MPB", "Axé"
];

function cleanGenreString(rawGenre: string): string {
  if (!rawGenre) return "";
  const match = rawGenre.match(/^\((\d+)\)$/);
  if (match) {
    const idx = parseInt(match[1], 10);
    if (idx >= 0 && idx < ID3_GENRES.length) {
      return ID3_GENRES[idx];
    }
  }
  return rawGenre.replace(/^\(\d+\)\s*/, "").trim();
}

function getWavAudioFormatName(code: number): string {
  switch (code) {
    case 1:
      return "PCM Uncompressed (Linear / Inteiro)";
    case 3:
      return "IEEE 754 Floating Point (Float 32/64-bit)";
    case 6:
      return "ITU G.711 A-law";
    case 7:
      return "ITU G.711 µ-law";
    case 17:
      return "IMA ADPCM";
    case 85:
      return "MPEG Audio Layer III (MP3)";
    case 65534:
      return "WAVE_FORMAT_EXTENSIBLE (Multi-canal / Alta Resolução)";
    default:
      return `Formato de Áudio Especial (Código ${code})`;
  }
}

/**
 * Universal Audio Metadata Reader & Complete Binary File Analyzer
 * Layer A: High-Level Parser (music-metadata-browser)
 * Layer B: Deep Binary Container & Physical Chunk Inspector across the entire file
 */
export async function readAudioMetadata(file: File): Promise<AudioMetadataModel> {
  const magic = await checkAudioMagicBytes(file);

  const model: AudioMetadataModel = {
    filename: file.name,
    filesize: file.size,
    mimeType: magic.detectedMime || file.type || "audio/mpeg",
    format: magic.detectedFormat,
    detectedTagTypes: [],
    hasCorruptedTagsWarning: false,
    technical: {
      durationSeconds: 0,
      bitrateKbps: 0,
      sampleRateHz: 44100,
      channels: 2,
      codec: magic.detectedFormat,
      containerType: magic.detectedFormat,
      endianness: "Little-Endian (LE)",
      isLossless: magic.detectedFormat === "WAV" || magic.detectedFormat === "FLAC" || magic.detectedFormat === "AIFF",
      chunksList: [],
      advancedTagsCount: 0
    },
    id3Frames: [],
    rawTagsList: [],
    rawTags: {}
  };

  // CAMADA A: Parser de Metadados de Alto Nível (music-metadata-browser)
  let mmParsed: mm.IAudioMetadata | null = null;
  try {
    mmParsed = await mm.parseBlob(file, { duration: true, skipCovers: false });
  } catch (err) {
    console.warn("Aviso na Camada A (parser mm):", err);
    model.hasCorruptedTagsWarning = true;
  }

  if (mmParsed) {
    applyMusicMetadataToModel(mmParsed, model);
  }

  // CAMADA B: Inspeção Binária Nativa do Container
  try {
    const headSlice = await file.slice(0, Math.min(file.size, 65536)).arrayBuffer();
    const headBytes = new Uint8Array(headSlice);

    // 1. WAV / RF64 / RIFF (Lê chunks em todo o arquivo, inclusive após 'data')
    if (
      model.format === "WAV" ||
      (headBytes[0] === 0x52 && headBytes[1] === 0x49 && headBytes[2] === 0x46 && (headBytes[3] === 0x46 || headBytes[3] === 0x58))
    ) {
      await parseWavCompleteFileChunks(file, model);
    } 
    // 2. MP3 / MPEG Stream
    else if (
      model.format === "MP3" ||
      (headBytes[0] === 0x49 && headBytes[1] === 0x44 && headBytes[2] === 0x33) ||
      (headBytes[0] === 0xff && (headBytes[1] & 0xe0) === 0xe0)
    ) {
      await parseMp3BinaryDeep(headBytes, file, model);
      parseMpegFrameHeader(headBytes, model);
    } 
    // 3. FLAC
    else if (
      model.format === "FLAC" ||
      (headBytes[0] === 0x66 && headBytes[1] === 0x4c && headBytes[2] === 0x61 && headBytes[3] === 0x43)
    ) {
      await parseFlacComplete(file, model);
    }
    // 4. OGG / OPUS
    else if (
      model.format === "OGG" ||
      (headBytes[0] === 0x4f && headBytes[1] === 0x47 && headBytes[2] === 0x67 && headBytes[3] === 0x53)
    ) {
      parseOggBinaryDeep(headBytes, model);
    }
    // 5. M4A / MP4 / AAC
    else if (
      model.format === "M4A" ||
      (headBytes[4] === 0x66 && headBytes[5] === 0x74 && headBytes[6] === 0x79 && headBytes[7] === 0x70)
    ) {
      parseMp4AtomsDeep(headBytes, model);
    }
    // 6. AIFF / AIFC
    else if (
      model.format === "AIFF" ||
      (headBytes[0] === 0x46 && headBytes[1] === 0x4f && headBytes[2] === 0x52 && headBytes[3] === 0x4d)
    ) {
      parseAiffBinaryDeep(headBytes, model);
    }

    // APEv2 check at head or tail
    await parseApeBinaryDeep(file, headBytes, model);

    // XMP & Extensible package scanning
    scanDeepBinaryMetadata(headBytes, model);
  } catch (e) {
    console.warn("Aviso na Camada B (inspeção binária):", e);
  }

  // Preencher campos de alto nível que possam ter vindo de tags brutas/nativas
  fillMissingFieldsFromRawTags(model);

  // Fallbacks para métricas técnicas de áudio
  calculateAudioMetricsFallback(file, model);
  await extractAudioElementTechnicalInfo(file, model);

  // Dimensões da capa
  if (model.cover && model.cover.dataUrl && (!model.cover.width || !model.cover.height)) {
    await measureCoverDimensions(model.cover);
  }

  model.technical.advancedTagsCount = model.rawTagsList.length;

  // Cálculo do Hash SHA-256 do arquivo inteiro (identidade única & anti-cache)
  try {
    model.technical.fileHash = await computeFileHash(file);
  } catch (e) {
    console.warn("Erro ao calcular hash do arquivo:", e);
  }

  // Cálculo do Hash SHA-256 do payload de áudio puro (comprovação bit-a-bit)
  try {
    model.technical.audioPayloadHash = await computeAudioPayloadHash(file, model.format);
  } catch (e) {
    console.warn("Erro ao calcular hash de payload:", e);
  }

  // CONSTRUÇÃO DO INVENTÁRIO COMPLETO SEM FILTRO & AUDITORIA DE FLUXO
  model.inventory = buildCompleteMetadataInventory(model);

  // Contagem da cadeia de auditoria
  const commonCount = [
    model.title, model.artist, model.album, model.albumArtist, model.composer, model.year,
    model.genre, model.trackNumber, model.discNumber, model.copyright, model.comment,
    model.lyrics, model.bpm, model.key, model.publisher, model.isrc, model.cover ? "cover" : ""
  ].filter(Boolean).length;

  const nativeCount = model.rawTagsList.filter(t => t.category !== "TECNICO" && t.category !== "ESTRUTURA").length;
  const rawCount = model.rawTagsList.length;
  const normalizedCount = Object.keys(model).filter(k => {
    const v = (model as any)[k];
    return v !== undefined && v !== null && v !== "" && k !== "technical" && k !== "rawTagsList" && k !== "rawTags" && k !== "id3Frames" && k !== "audit" && k !== "inventory";
  }).length;

  const renderedCount = model.inventory.length;
  const protectedCount = model.inventory.filter(i => !i.isRemovable).length;
  const removableCount = model.inventory.filter(i => i.isRemovable).length;

  model.audit = {
    commonCount,
    nativeCount,
    rawCount,
    normalizedCount,
    renderedCount,
    protectedCount,
    removableCount
  };

  return model;
}

// ---------------- MAP MUSIC-METADATA TO MODEL ----------------
function applyMusicMetadataToModel(mmParsed: mm.IAudioMetadata, model: AudioMetadataModel) {
  const { common, format, native } = mmParsed;

  if (format) {
    if (format.container) model.technical.containerType = format.container;
    if (format.codec) model.technical.codec = format.codec;
    if (format.duration) model.technical.durationSeconds = Math.round(format.duration * 100) / 100;
    if (format.bitrate) model.technical.bitrateKbps = Math.round(format.bitrate / 1000);
    if (format.sampleRate) model.technical.sampleRateHz = format.sampleRate;
    if (format.numberOfChannels) model.technical.channels = format.numberOfChannels;
    if (format.bitsPerSample) model.technical.bitsPerSample = format.bitsPerSample;
    if (format.lossless !== undefined) model.technical.isLossless = format.lossless;
    if (format.tagTypes && format.tagTypes.length > 0) {
      model.detectedTagTypes = Array.from(new Set([...model.detectedTagTypes, ...format.tagTypes]));
    }
  }

  if (common) {
    if (common.title && !model.title) model.title = common.title;
    if (common.artist && !model.artist) model.artist = common.artist;
    if (common.album && !model.album) model.album = common.album;
    if (common.albumartist && !model.albumArtist) model.albumArtist = common.albumartist;
    if (common.composer && common.composer.length > 0 && !model.composer) model.composer = common.composer.join(", ");
    if (common.genre && common.genre.length > 0 && !model.genre) model.genre = cleanGenreString(common.genre.join(", "));
    if (common.year && !model.year) model.year = String(common.year);
    else if (common.date && !model.year) model.year = String(common.date);

    if (common.track && common.track.no && !model.trackNumber) {
      model.trackNumber = String(common.track.no);
      if (common.track.of && !model.totalTracks) model.totalTracks = String(common.track.of);
    }

    if (common.disk && common.disk.no && !model.discNumber) {
      model.discNumber = String(common.disk.no);
      if (common.disk.of && !model.totalDiscs) model.totalDiscs = String(common.disk.of);
    }

    if (common.copyright && !model.copyright) model.copyright = common.copyright;
    if (common.isrc && common.isrc.length > 0 && !model.isrc) model.isrc = common.isrc.join(", ");
    if (common.bpm && !model.bpm) model.bpm = String(common.bpm);
    if (common.key && !model.key) model.key = common.key;
    if (common.language && !model.language) model.language = common.language;
    const cAny = common as any;
    if (cAny.publisher && !model.publisher) model.publisher = String(cAny.publisher);

    if (common.comment && common.comment.length > 0 && !model.comment) {
      model.comment = common.comment.map((c: any) => (typeof c === "string" ? c : c.text || c.descriptor || "")).join("\n");
    }
    if (common.lyrics && common.lyrics.length > 0 && !model.lyrics) {
      model.lyrics = common.lyrics.map((l: any) => (typeof l === "string" ? l : l.text || "")).join("\n");
    }
    if (common.description && common.description.length > 0 && !model.description) {
      model.description = common.description.join("\n");
    }
    if (common.subtitle && common.subtitle.length > 0 && !model.subtitle) {
      model.subtitle = common.subtitle.join("\n");
    }

    if (common.picture && common.picture.length > 0 && !model.cover) {
      const pic = common.picture[0];
      try {
        const mimeType = pic.format || "image/jpeg";
        const uint8 = new Uint8Array(pic.data);
        let binaryStr = "";
        const len = uint8.length;
        const chunkSize = 8192;
        for (let i = 0; i < len; i += chunkSize) {
          const sub = uint8.subarray(i, Math.min(i + chunkSize, len));
          binaryStr += String.fromCharCode.apply(null, Array.from(sub));
        }
        const base64 = btoa(binaryStr);

        model.cover = {
          dataUrl: `data:${mimeType};base64,${base64}`,
          mimeType,
          format: mimeType.split("/")[1] || "jpeg",
          sizeBytes: pic.data.length,
          typeDescription: pic.type || "Front Cover"
        };
      } catch (e) {
        console.warn("Erro ao extrair capa na Camada A:", e);
      }
    }
  }

  if (native) {
    Object.keys(native).forEach((tagCategory) => {
      if (!model.detectedTagTypes.includes(tagCategory)) {
        model.detectedTagTypes.push(tagCategory);
      }

      const frames = native[tagCategory];
      if (Array.isArray(frames)) {
        frames.forEach((frame) => {
          if (!frame || !frame.id) return;

          let frameId = String(frame.id).trim();
          let frameValStr = "";

          if (typeof frame.value === "string") {
            frameValStr = frame.value;
          } else if (typeof frame.value === "number" || typeof frame.value === "boolean") {
            frameValStr = String(frame.value);
          } else if (frame.value && typeof frame.value === "object") {
            if ("description" in frame.value && "text" in frame.value) {
              if (frame.value.description) {
                if (frameId === "TXXX" || frameId === "WXXX" || frameId === "COMM" || frameId === "TXX") {
                  frameId = `${frameId}:${frame.value.description}`;
                }
              }
              frameValStr = String(frame.value.text);
            } else if ("owner_identifier" in frame.value) {
              if (frameId === "PRIV") {
                frameId = `PRIV:${frame.value.owner_identifier}`;
              }
              if ("data" in frame.value && frame.value.data) {
                const d = frame.value.data;
                if (typeof d === "string") frameValStr = d;
                else if (d instanceof Uint8Array || Array.isArray(d)) {
                  try {
                    const str = new TextDecoder("utf-8").decode(new Uint8Array(d)).replace(/\0/g, "").trim();
                    frameValStr = str.length > 0 && /^[\x20-\x7E\s\u00A0-\uFFFF]+$/.test(str) ? str : `[Payload Privado: ${d.length} bytes]`;
                  } catch {
                    frameValStr = `[Payload Privado: ${d.length} bytes]`;
                  }
                }
              }
            } else if ("text" in frame.value) {
              frameValStr = String(frame.value.text);
            } else if ("data" in frame.value && frame.value.data instanceof Uint8Array) {
              frameValStr = `[Dados Binários: ${frame.value.data.length} bytes]`;
            } else {
              try {
                frameValStr = JSON.stringify(frame.value);
              } catch {
                frameValStr = "[Objeto Complexo / Binário]";
              }
            }
          }

          if (!frameValStr || frameValStr.trim().length === 0) return;

          addRawItem(
            model,
            frameId,
            frameValStr,
            tagCategory,
            model.format,
            tagCategory,
            true,
            "MUSICAL"
          );
        });
      }
    });
  }
}

function decodeWindows1252(bytes: Uint8Array): string {
  if (!bytes || bytes.length === 0) return "";
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0) break;
    if (b < 0x80) {
      s += String.fromCharCode(b);
    } else if (b >= 0xa0) {
      s += String.fromCharCode(b);
    } else {
      const map1252: Record<number, string> = {
        0x80: "€", 0x82: "‚", 0x83: "ƒ", 0x84: "„", 0x85: "…", 0x86: "†", 0x87: "‡",
        0x88: "ˆ", 0x89: "‰", 0x8a: "Š", 0x8b: "‹", 0x8c: "Œ", 0x8e: "Ž",
        0x91: "‘", 0x92: "’", 0x93: "“", 0x94: "”", 0x95: "•", 0x96: "–", 0x97: "—",
        0x98: "˜", 0x99: "™", 0x9a: "š", 0x9b: "›", 0x9c: "œ", 0x9e: "ž", 0x9f: "Ÿ"
      };
      s += map1252[b] || String.fromCharCode(b);
    }
  }
  return s.trim();
}

function safeDecodeBinaryText(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/\0/g, "").trim();
  } catch {
    return new TextDecoder("latin1").decode(bytes).replace(/\0/g, "").trim();
  }
}

function parseCommentSubproperties(
  commentText: string,
  model: AudioMetadataModel,
  origin: string,
  block: string
) {
  if (!commentText) return;
  // Suporte a múltiplos delimitadores estruturados: nova linha, ponto-e-vírgula, pipe
  const tokens = commentText.split(/[\r\n;|]+/).map((t) => t.trim()).filter(Boolean);

  for (const token of tokens) {
    if (token.toLowerCase().includes("suno")) {
      addRawItem(model, "AI_STUDIO_TAG", token, origin, model.format, block, true, "ORIGEM");
      if (!model.software) model.software = token;
      if (!model.tool) model.tool = token;
    }
    const eqIdx = token.indexOf("=");
    if (eqIdx > 0 && eqIdx < token.length - 1) {
      const key = token.substring(0, eqIdx).trim();
      const val = token.substring(eqIdx + 1).trim();
      if (key && val) {
        addRawItem(
          model,
          `ICMT:${key}`,
          val,
          origin,
          model.format,
          block,
          true,
          key.toLowerCase().includes("project") || key.toLowerCase().includes("created") || key.toLowerCase().includes("gen") ? "ORIGEM" : "MUSICAL"
        );
        if (key.toLowerCase() === "created" && !model.creationTime) model.creationTime = val;
        if (key.toLowerCase() === "project" && !model.originator) model.originator = val;
        if ((key.toLowerCase() === "tempo" || key.toLowerCase() === "bpm") && !model.bpm) model.bpm = val;
        if (key.toLowerCase() === "key" && !model.key) model.key = val;
        if (key.toLowerCase() === "genre" && !model.genre) model.genre = val;
      }
    }
  }
}

// ---------------- Helper para detecção de strings puramente estruturais do container ----------------
function isStructuralWavString(str: string): boolean {
  const clean = str.replace(/[\x00-\x1F\s]/g, "").toUpperCase();
  if (!clean || clean.length < 3) return true;
  // Excluir FourCCs e assinaturas conhecidas de cabeçalho e container
  if (/^(RIFF|RIFX|RF64|BW64|WAVE|FMT|DATA|DS64|FACT|JUNK|PAD|SMPL|CUE|ADTL|LIST|INFO|PEAK|ID3|ID32)$/i.test(clean)) return true;
  // Excluir concatenações conhecidas resultantes de headers estruturais
  if (/^(RIFF|RIFX|RF64|BW64|WAVE|FMT|DATA)/i.test(clean) && clean.length <= 12) return true;
  if (clean.startsWith("WAVEFMT") || clean.startsWith("RIFFWAVE") || clean.startsWith("FMT") || clean.startsWith("DATA")) return true;
  return false;
}

// ---------------- 1. WAV / RIFF COMPLETE FILE SCANNER ----------------
async function parseWavCompleteFileChunks(file: File, model: AudioMetadataModel) {
  model.technical.containerType = "RIFF Waveform Audio (WAV)";
  model.technical.codec = "PCM Uncompressed Audio";
  model.technical.isLossless = true;
  model.technical.endianness = "Little-Endian (LE)";
  if (!model.detectedTagTypes.includes("RIFF Structure")) {
    model.detectedTagTypes.push("RIFF Structure");
  }

  // 1. Ler cabeçalho RIFF de 12 bytes
  const headerBuf = await file.slice(0, 12).arrayBuffer();
  const headerBytes = new Uint8Array(headerBuf);
  const riffId = String.fromCharCode(headerBytes[0], headerBytes[1], headerBytes[2], headerBytes[3]);
  const waveId = String.fromCharCode(headerBytes[8], headerBytes[9], headerBytes[10], headerBytes[11]);
  const riffSize = (headerBytes[4] | (headerBytes[5] << 8) | (headerBytes[6] << 16) | (headerBytes[7] << 24)) >>> 0;

  if ((riffId === "RIFF" || riffId === "RIFX" || riffId === "RF64") && (waveId === "WAVE" || waveId === "BW64")) {
    addRawItem(model, "RIFF_HEADER", `${riffId}/${waveId} Header (${riffSize + 8} bytes totais no container)`, "RIFF", "WAV / RIFF", "RIFF", false, "ESTRUTURA");
  }

  let offset = 12;
  const fileSize = file.size;
  const chunks: RiffChunkItem[] = [];
  const nonAudioRanges: Array<{ start: number; end: number; regionName: string }> = [];

  // Percorrer TODOS os chunks do arquivo WAV sem limite (do início até EOF)
  while (offset + 8 <= fileSize) {
    const chunkHeadBuf = await file.slice(offset, offset + 8).arrayBuffer();
    const chunkHeadBytes = new Uint8Array(chunkHeadBuf);
    if (chunkHeadBytes.length < 8) break;

    const chunkId = String.fromCharCode(chunkHeadBytes[0], chunkHeadBytes[1], chunkHeadBytes[2], chunkHeadBytes[3]);
    let chunkSize = (chunkHeadBytes[4] | (chunkHeadBytes[5] << 8) | (chunkHeadBytes[6] << 16) | (chunkHeadBytes[7] << 24)) >>> 0;
    const chunkOffset = offset;
    const chunkDataOffset = offset + 8;

    let chunkDesc = `Chunk ${chunkId}`;
    let isRemovable = true;

    // fmt Chunk
    if (chunkId === "fmt " && chunkSize >= 14) {
      isRemovable = false;
      chunkDesc = "Propriedades do Formato de Áudio (fmt)";
      const fmtBuf = await file.slice(chunkDataOffset, chunkDataOffset + Math.min(chunkSize, 64)).arrayBuffer();
      const bytes = new Uint8Array(fmtBuf);

      const audioFormat = bytes[0] | (bytes[1] << 8);
      const numChannels = bytes[2] | (bytes[3] << 8);
      const sampleRate = (bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24)) >>> 0;
      const byteRate = (bytes[8] | (bytes[9] << 8) | (bytes[10] << 16) | (bytes[11] << 24)) >>> 0;
      const blockAlign = bytes[12] | (bytes[13] << 8);
      const bitsPerSample = bytes.length >= 16 ? (bytes[14] | (bytes[15] << 8)) : 16;

      model.technical.audioFormatCode = audioFormat;
      model.technical.audioFormatName = getWavAudioFormatName(audioFormat);
      model.technical.channels = numChannels;
      model.technical.sampleRateHz = sampleRate;
      model.technical.byteRate = byteRate;
      model.technical.blockAlign = blockAlign;
      model.technical.bitsPerSample = bitsPerSample;
      model.technical.channelLayout = numChannels === 1 ? "Mono (1.0)" : numChannels === 2 ? "Estéreo (2.0)" : `${numChannels} Canais Multi-canal`;

      const calculatedBitrate = Math.round((byteRate * 8) / 1000);
      if (calculatedBitrate > 0) model.technical.bitrateKbps = calculatedBitrate;

      addRawItem(model, "AudioFormat", `${audioFormat} (${getWavAudioFormatName(audioFormat)})`, "RIFF fmt", "WAV / RIFF", "fmt", false, "TECNICO");
      addRawItem(model, "NumOfChannels", `${numChannels} (${numChannels === 1 ? "Mono" : "Estéreo"})`, "RIFF fmt", "WAV / RIFF", "fmt", false, "TECNICO");
      addRawItem(model, "SampleRate", `${sampleRate} Hz (${(sampleRate / 1000).toFixed(1)} kHz)`, "RIFF fmt", "WAV / RIFF", "fmt", false, "TECNICO");
      addRawItem(model, "ByteRate", `${byteRate} B/s (${(byteRate / 1024).toFixed(1)} KB/s)`, "RIFF fmt", "WAV / RIFF", "fmt", false, "TECNICO");
      addRawItem(model, "BlockAlign", `${blockAlign} bytes`, "RIFF fmt", "WAV / RIFF", "fmt", false, "TECNICO");
      addRawItem(model, "BitsPerSample", `${bitsPerSample} bits`, "RIFF fmt", "WAV / RIFF", "fmt", false, "TECNICO");
    }
    // data Chunk
    else if (chunkId === "data") {
      isRemovable = false;
      chunkDesc = "Payload de Amostras de Áudio PCM (data)";
      model.technical.audioDataOffset = chunkDataOffset;
      const maxAvailable = Math.max(0, fileSize - chunkDataOffset);
      const actualDataLen = (chunkSize > maxAvailable || chunkSize === 0xFFFFFFFF || chunkSize === 0x7FFFFFFF) ? maxAvailable : chunkSize;
      model.technical.audioDataLength = actualDataLen;
      addRawItem(model, "PCM_DATA_PAYLOAD", `${actualDataLen} bytes (${(actualDataLen / (1024 * 1024)).toFixed(2)} MB áudio puro)`, "RIFF data", "WAV / RIFF", "data", false, "TECNICO");
      
      // If chunkSize was overreported, adjust chunkSize for loop step
      if (chunkSize > maxAvailable) {
        chunkSize = maxAvailable;
      }
    }
    // LIST / INFO Chunk
    else if (chunkId === "LIST" && chunkSize >= 4) {
      nonAudioRanges.push({ start: chunkDataOffset, end: chunkDataOffset + chunkSize, regionName: "LIST Chunk" });
      const listBuf = await file.slice(chunkDataOffset, chunkDataOffset + Math.min(chunkSize, 4 * 1024 * 1024)).arrayBuffer();
      const bytes = new Uint8Array(listBuf);
      const listType = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
      chunkDesc = `Lista de Metadados (LIST ${listType})`;

      if (listType === "INFO") {
        if (!model.detectedTagTypes.includes("RIFF INFO")) model.detectedTagTypes.push("RIFF INFO");
        let infoOffset = 4;
        const infoEnd = bytes.length;

        while (infoOffset + 8 <= infoEnd) {
          const subId = String.fromCharCode(bytes[infoOffset], bytes[infoOffset + 1], bytes[infoOffset + 2], bytes[infoOffset + 3]);
          const subSize = (bytes[infoOffset + 4] | (bytes[infoOffset + 5] << 8) | (bytes[infoOffset + 6] << 16) | (bytes[infoOffset + 7] << 24)) >>> 0;

          if (subSize > 0 && infoOffset + 8 <= infoEnd) {
            const valBytes = bytes.subarray(infoOffset + 8, Math.min(infoOffset + 8 + subSize, infoEnd));
            const valStr = decodeWindows1252(valBytes);
            if (valStr) {
              addRawItem(model, subId, valStr, "RIFF INFO", "WAV / RIFF", "LIST/INFO", true, subId === "ISFT" ? "ORIGEM" : "MUSICAL");

              // Assign direct fields from LIST INFO
              if (subId === "INAM") model.title = valStr;
              else if (subId === "IART") model.artist = valStr;
              else if (subId === "IPRD") model.album = valStr;
              else if (subId === "ICRD") model.year = valStr;
              else if (subId === "IGNR") model.genre = valStr;
              else if (subId === "ICMT") {
                model.comment = valStr;
                parseCommentSubproperties(valStr, model, "RIFF INFO", "LIST/INFO");
              }
              else if (subId === "ICOP") model.copyright = valStr;
              else if (subId === "ISFT") {
                model.software = valStr;
                model.encoder = valStr;
              }
              else if (subId === "IENG") model.composer = model.composer || valStr;
              else if (subId === "ITCH") model.encodedBy = valStr;
              else if (subId === "ISRC") model.isrc = valStr;
              else if (subId === "ITRK") model.trackNumber = valStr;
            }
          }
          infoOffset += 8 + subSize + (subSize % 2);
          if (subSize === 0) infoOffset += 8;
        }
      }
    }
    // bext (Broadcast Wave)
    else if (chunkId === "bext" && chunkSize >= 300) {
      chunkDesc = "Metadados Broadcast Wave (BWF bext)";
      nonAudioRanges.push({ start: chunkDataOffset, end: chunkDataOffset + chunkSize, regionName: "BWF bext Chunk" });
      if (!model.detectedTagTypes.includes("BWF BEXT")) model.detectedTagTypes.push("BWF BEXT");
      try {
        const bextBuf = await file.slice(chunkDataOffset, chunkDataOffset + Math.min(chunkSize, 4096)).arrayBuffer();
        const bextData = new Uint8Array(bextBuf);
        const description = safeDecodeBinaryText(bextData.subarray(0, 256));
        const originator = safeDecodeBinaryText(bextData.subarray(256, 288));
        const origRef = safeDecodeBinaryText(bextData.subarray(288, 320));
        const origDate = safeDecodeBinaryText(bextData.subarray(320, 330));
        const origTime = safeDecodeBinaryText(bextData.subarray(330, 338));

        if (description) {
          model.description = description;
          addRawItem(model, "Description", description, "BWF BEXT", "WAV / RIFF", "bext", true, "MUSICAL");
        }
        if (originator) {
          model.originator = originator;
          model.software = model.software || originator;
          addRawItem(model, "Originator", originator, "BWF BEXT", "WAV / RIFF", "bext", true, "ORIGEM");
        }
        if (origRef) addRawItem(model, "OriginatorReference", origRef, "BWF BEXT", "WAV / RIFF", "bext", true, "ORIGEM");
        if (origDate) addRawItem(model, "OriginationDate", `${origDate} ${origTime}`.trim(), "BWF BEXT", "WAV / RIFF", "bext", true, "ORIGEM");

        if (bextData.length > 602) {
          const codingHistory = safeDecodeBinaryText(bextData.subarray(602));
          if (codingHistory) addRawItem(model, "CodingHistory", codingHistory, "BWF BEXT", "WAV / RIFF", "bext", true, "ORIGEM");
        }
      } catch (err) {
        console.warn("BEXT parse error:", err);
      }
    }
    // iXML
    else if (chunkId === "iXML" && chunkSize > 0) {
      chunkDesc = "Metadados iXML de Produção";
      nonAudioRanges.push({ start: chunkDataOffset, end: chunkDataOffset + chunkSize, regionName: "iXML Chunk" });
      if (!model.detectedTagTypes.includes("iXML")) model.detectedTagTypes.push("iXML");
      try {
        const xmlBuf = await file.slice(chunkDataOffset, chunkDataOffset + Math.min(chunkSize, 262144)).arrayBuffer();
        const xmlStr = new TextDecoder("utf-8").decode(new Uint8Array(xmlBuf)).replace(/\0/g, "").trim();
        parseGenericXmlNodes(xmlStr, model, "iXML", "WAV / RIFF", "iXML");
      } catch (e) {
        console.warn("iXML parse error:", e);
      }
    }
    // Embedded ID3 in WAV
    else if ((chunkId === "id3 " || chunkId === "ID3 " || chunkId === "ID32") && chunkSize > 0) {
      chunkDesc = "Tags ID3v2 Embutidas no WAV";
      nonAudioRanges.push({ start: chunkDataOffset, end: chunkDataOffset + chunkSize, regionName: "Embedded ID3 Chunk" });
      try {
        const id3Buf = await file.slice(chunkDataOffset, chunkDataOffset + Math.min(chunkSize, 1024 * 1024)).arrayBuffer();
        await parseMp3BinaryDeep(new Uint8Array(id3Buf), file, model);
      } catch (err) {
        console.warn("Embedded ID3 parse error:", err);
      }
    }
    // Outros FourCCs
    else if (chunkId === "fact") {
      isRemovable = false;
      chunkDesc = "Informações de Codec/Amostras (fact)";
    } else if (chunkId === "JUNK" || chunkId === "PAD ") {
      chunkDesc = "Bloco de Alinhamento/Padding (JUNK/PAD)";
      nonAudioRanges.push({ start: chunkDataOffset, end: chunkDataOffset + chunkSize, regionName: `${chunkId} Chunk` });
    } else if (chunkId === "cue " || chunkId === "adtl") {
      chunkDesc = "Marcadores de Faixa e Pontos de Edição (cue/adtl)";
      nonAudioRanges.push({ start: chunkDataOffset, end: chunkDataOffset + chunkSize, regionName: `${chunkId} Chunk` });
    } else if (chunkId === "smpl") {
      chunkDesc = "Informações de Loop e Sampler (smpl)";
      nonAudioRanges.push({ start: chunkDataOffset, end: chunkDataOffset + chunkSize, regionName: "smpl Chunk" });
    } else if (chunkId === "cart") {
      chunkDesc = "Automação de Rádio (cart)";
      nonAudioRanges.push({ start: chunkDataOffset, end: chunkDataOffset + chunkSize, regionName: "cart Chunk" });
    } else if (chunkId === "DISP") {
      chunkDesc = "Objeto de Exibição / Título (DISP)";
      nonAudioRanges.push({ start: chunkDataOffset, end: chunkDataOffset + chunkSize, regionName: "DISP Chunk" });
    } else if (chunkId === "XMP " || chunkId === "_xmp" || chunkId === "axml") {
      chunkDesc = "Pacote de Metadados XMP Extensível";
      nonAudioRanges.push({ start: chunkDataOffset, end: chunkDataOffset + chunkSize, regionName: "XMP Chunk" });
    } else if (chunkId !== "fmt " && chunkId !== "data") {
      nonAudioRanges.push({ start: chunkDataOffset, end: chunkDataOffset + chunkSize, regionName: `Chunk ${chunkId}` });
    }

    chunks.push({
      id: chunkId,
      sizeBytes: chunkSize,
      offset: chunkOffset,
      description: chunkDesc,
      isRemovable
    });

    addRawItem(
      model,
      `CHUNK_${chunkId.trim()}`,
      `${chunkDesc} [${chunkSize} bytes no offset ${chunkOffset}]`,
      "RIFF Chunk",
      "WAV / RIFF",
      chunkId.trim(),
      isRemovable,
      isRemovable ? "ORIGEM" : "ESTRUTURA"
    );

    offset += 8 + chunkSize + (chunkSize % 2);
    if (chunkSize === 0) offset += 8;
  }

  // FAILSAFE DEEP SCAN: Se o loop principal não encontrou LIST/INFO ou BEXT, realizar varredura no arquivo
  if (!chunks.some((c) => c.id === "LIST" && c.description?.includes("INFO"))) {
    try {
      const scanLen = Math.min(file.size, 1024 * 1024);
      const tailBuf = await file.slice(Math.max(0, file.size - scanLen), file.size).arrayBuffer();
      const tailBytes = new Uint8Array(tailBuf);

      for (let i = 0; i <= tailBytes.length - 12; i++) {
        if (
          tailBytes[i] === 0x4c && tailBytes[i+1] === 0x49 && tailBytes[i+2] === 0x53 && tailBytes[i+3] === 0x54 && // LIST
          tailBytes[i+8] === 0x49 && tailBytes[i+9] === 0x4e && tailBytes[i+10] === 0x46 && tailBytes[i+11] === 0x4f // INFO
        ) {
          const listSize = (tailBytes[i+4] | (tailBytes[i+5] << 8) | (tailBytes[i+6] << 16) | (tailBytes[i+7] << 24)) >>> 0;
          if (listSize > 4 && listSize <= 65536) {
            let infoOffset = i + 12;
            const infoEnd = Math.min(tailBytes.length, i + 8 + listSize);
            while (infoOffset + 8 <= infoEnd) {
              const subId = String.fromCharCode(tailBytes[infoOffset], tailBytes[infoOffset+1], tailBytes[infoOffset+2], tailBytes[infoOffset+3]);
              const subSize = (tailBytes[infoOffset+4] | (tailBytes[infoOffset+5] << 8) | (tailBytes[infoOffset+6] << 16) | (tailBytes[infoOffset+7] << 24)) >>> 0;
              if (subSize > 0 && infoOffset + 8 <= infoEnd) {
                const valBytes = tailBytes.subarray(infoOffset + 8, Math.min(infoOffset + 8 + subSize, infoEnd));
                const valStr = safeDecodeBinaryText(valBytes);
                if (valStr) {
                  addRawItem(model, subId, valStr, "RIFF INFO (Deep Scan)", "WAV / RIFF", "LIST/INFO", true, subId === "ISFT" ? "ORIGEM" : "MUSICAL");
                  if (subId === "INAM" && !model.title) model.title = valStr;
                  if (subId === "IART" && !model.artist) model.artist = valStr;
                  if (subId === "IPRD" && !model.album) model.album = valStr;
                  if (subId === "ICMT" && !model.comment) {
                    model.comment = valStr;
                    parseCommentSubproperties(valStr, model, "RIFF INFO", "LIST/INFO");
                  }
                  if (subId === "ISFT" && !model.software) {
                    model.software = valStr;
                    model.encoder = valStr;
                  }
                }
              }
              infoOffset += 8 + subSize + (subSize % 2);
              if (subSize === 0) infoOffset += 8;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failsafe WAV sweep notice:", e);
    }
  }

  // 2. SCANNER DE STRINGS BINÁRIAS NAS REGIÕES NÃO-ÁUDIO POTENCIAIS (Metadados e Chunks Finais, sem tocar cabeçalhos essenciais)
  try {
    const audioEnd = (model.technical.audioDataOffset || 44) + (model.technical.audioDataLength || 0);
    if (audioEnd < file.size) {
      nonAudioRanges.push({ start: audioEnd, end: file.size, regionName: "Chunks & Metadados Finais (Pós-data)" });
    }

    if (nonAudioRanges.length > 0) {
      await scanNonAudioTextualStrings(file, model, nonAudioRanges);
    }
  } catch (e) {
    console.warn("Aviso no scanner binário textual:", e);
  }

  model.technical.chunksList = chunks;
}

/**
 * CAMADA B/C: Scanner de Strings Binárias ASCII/UTF-8 em Regiões Fora do Payload de Áudio
 */
async function scanNonAudioTextualStrings(
  file: File,
  model: AudioMetadataModel,
  nonAudioRanges: Array<{ start: number; end: number; regionName: string }>
) {
  const existingValues = new Set<string>();
  const addValToExisting = (v?: string) => {
    if (v) existingValues.add(v.toLowerCase().trim());
  };
  addValToExisting(model.title);
  addValToExisting(model.artist);
  addValToExisting(model.album);
  addValToExisting(model.albumArtist);
  addValToExisting(model.comment);
  addValToExisting(model.software);
  addValToExisting(model.encoder);
  addValToExisting(model.originator);
  addValToExisting(model.tool);
  addValToExisting(model.creationTime);
  model.rawTagsList.forEach((r) => addValToExisting(r.value));

  for (const range of nonAudioRanges) {
    const len = Math.max(0, range.end - range.start);
    if (len <= 0) continue;
    const sliceLen = Math.min(len, 2 * 1024 * 1024); // até 2MB por região de metadados
    const buf = await file.slice(range.start, range.start + sliceLen).arrayBuffer();
    const bytes = new Uint8Array(buf);

    let currentStrBytes: number[] = [];
    let startOffsetInRegion = 0;

    for (let i = 0; i <= bytes.length; i++) {
      const b = i < bytes.length ? bytes[i] : 0;
      const isPrintable = (b >= 0x20 && b <= 0x7e) || (b >= 0xc0 && b <= 0xfd) || (b >= 0x80 && b <= 0xbf) || b === 0x09;

      if (isPrintable && b !== 0) {
        if (currentStrBytes.length === 0) {
          startOffsetInRegion = i;
        }
        currentStrBytes.push(b);
      } else {
        if (currentStrBytes.length >= 4) {
          try {
            const rawStr = safeDecodeBinaryText(new Uint8Array(currentStrBytes));
            const trimmed = rawStr.trim();
            const absOffset = range.start + startOffsetInRegion;

            const isFourCC = trimmed.length <= 4 && /^[A-Za-z0-9 _-]{1,4}$/.test(trimmed);
            const isPureNumber = /^[0-9.,\s]+$/.test(trimmed);
            const isStructural = isStructuralWavString(trimmed);

            if (trimmed.length >= 4 && !isFourCC && !isPureNumber && !isStructural) {
              const lower = trimmed.toLowerCase();
              const alreadyKnown = existingValues.has(lower) || Array.from(existingValues).some((v) => v === lower || (v.length > 8 && v.includes(lower)));

              if (!alreadyKnown) {
                if (lower.includes("suno") || lower.includes("project=") || lower.includes("created=") || lower.includes("tempo=")) {
                  parseCommentSubproperties(trimmed, model, `Scanner Binário (Offset ${absOffset})`, range.regionName);
                }

                addRawItem(
                  model,
                  `RAW_TEXT_${absOffset}`,
                  trimmed,
                  `Scanner Binário [${range.regionName}]`,
                  model.format,
                  `Offset 0x${absOffset.toString(16).toUpperCase()}`,
                  true,
                  lower.includes("suno") || lower.includes("project") || lower.includes("created") || lower.includes("software") || lower.includes("encoder") || lower.includes("http") ? "ORIGEM" : "MUSICAL"
                );
                existingValues.add(lower);
              }
            }
          } catch {}
        }
        currentStrBytes = [];
      }
    }
  }
}

// ---------------- 2. MP3 / MPEG DEEP INSPECTOR ----------------
function parseMpegFrameHeader(bytes: Uint8Array, model: AudioMetadataModel) {
  model.technical.containerType = "MPEG Audio Stream";
  model.technical.codec = "MPEG Audio Layer III (MP3)";
  model.technical.isLossless = false;
  model.technical.endianness = "Big-Endian (MPEG Stream)";

  const bitratesMpeg1L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
  const sampleRatesMpeg1 = [44100, 48000, 32000, 0];

  for (let i = 0; i < Math.min(bytes.length - 4, 65536); i++) {
    if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0) {
      const b1 = bytes[i + 1];
      const b2 = bytes[i + 2];
      const b3 = bytes[i + 3];

      const mpegVerBits = (b1 >> 3) & 0x03;
      const layerBits = (b1 >> 1) & 0x03;
      const bitrateIdx = (b2 >> 4) & 0x0f;
      const sampleRateIdx = (b2 >> 2) & 0x03;
      const channelModeBits = (b3 >> 6) & 0x03;

      let verStr = "MPEG-1";
      if (mpegVerBits === 2) verStr = "MPEG-2";
      if (mpegVerBits === 0) verStr = "MPEG-2.5";

      let layerStr = "Layer III (MP3)";
      if (layerBits === 2) layerStr = "Layer II";
      if (layerBits === 3) layerStr = "Layer I";

      const bitrate = bitratesMpeg1L3[bitrateIdx] || 0;
      const sampleRate = sampleRatesMpeg1[sampleRateIdx] || 44100;

      let channelMode = "Estéreo (2.0)";
      if (channelModeBits === 1) channelMode = "Joint Stereo";
      if (channelModeBits === 2) channelMode = "Dual Channel";
      if (channelModeBits === 3) channelMode = "Mono (1.0)";

      model.technical.mpegVersion = verStr;
      model.technical.mpegLayer = layerStr;
      model.technical.mpegChannelMode = channelMode;
      model.technical.channelLayout = channelMode;
      model.technical.audioFormatCode = 85;
      model.technical.audioFormatName = `${verStr} ${layerStr}`;

      if (sampleRate && model.technical.sampleRateHz === 44100) model.technical.sampleRateHz = sampleRate;
      if (bitrate && model.technical.bitrateKbps === 0) model.technical.bitrateKbps = bitrate;

      addRawItem(
        model,
        "MPEG_FRAME_HEADER",
        `${verStr} ${layerStr} • ${bitrate > 0 ? `${bitrate} kbps` : "VBR"} • ${sampleRate} Hz • ${channelMode}`,
        "MPEG Stream",
        "MP3 / MPEG",
        "MPEG Header",
        false,
        "TECNICO"
      );
      break;
    }
  }
}

async function parseMp3BinaryDeep(headerBytes: Uint8Array, file: File, model: AudioMetadataModel) {
  let id3Offset = -1;
  const maxSearch = Math.min(headerBytes.length - 10, 65536);
  for (let i = 0; i < maxSearch; i++) {
    if (headerBytes[i] === 0x49 && headerBytes[i + 1] === 0x44 && headerBytes[i + 2] === 0x33) {
      id3Offset = i;
      break;
    }
  }

  if (id3Offset >= 0) {
    const majorVersion = headerBytes[id3Offset + 3];
    const versionStr = `ID3v2.${majorVersion}`;
    if (!model.detectedTagTypes.includes(versionStr)) model.detectedTagTypes.push(versionStr);

    const flags = headerBytes[id3Offset + 5];
    const hasExtendedHeader = (flags & 0x40) !== 0;

    const tagPayloadSize =
      ((headerBytes[id3Offset + 6] & 0x7f) << 21) |
      ((headerBytes[id3Offset + 7] & 0x7f) << 14) |
      ((headerBytes[id3Offset + 8] & 0x7f) << 7) |
      (headerBytes[id3Offset + 9] & 0x7f);

    const totalHeaderSize = tagPayloadSize + 10;
    model.technical.audioDataOffset = id3Offset + totalHeaderSize;

    // Se o payload for maior que o buffer inicial, buscar o bloco ID3 completo
    let id3Bytes = headerBytes;
    if (id3Offset + totalHeaderSize > headerBytes.length) {
      try {
        const fullSlice = await file.slice(id3Offset, id3Offset + Math.min(totalHeaderSize, 2 * 1024 * 1024)).arrayBuffer();
        id3Bytes = new Uint8Array(fullSlice);
      } catch (e) {
        console.warn("Could not read full ID3 block:", e);
      }
    }

    let offset = 10;
    const maxOffset = Math.min(id3Bytes.length, totalHeaderSize);

    if (hasExtendedHeader && offset + 4 < maxOffset) {
      const extSize = majorVersion === 4
        ? (((id3Bytes[offset] & 0x7f) << 21) | ((id3Bytes[offset + 1] & 0x7f) << 14) | ((id3Bytes[offset + 2] & 0x7f) << 7) | (id3Bytes[offset + 3] & 0x7f))
        : ((id3Bytes[offset] << 24) | (id3Bytes[offset + 1] << 16) | (id3Bytes[offset + 2] << 8) | id3Bytes[offset + 3]);
      if (extSize > 0 && extSize < 10000) {
        offset += extSize + (majorVersion === 3 ? 4 : 0);
      }
    }

    const minHeaderLen = majorVersion === 2 ? 6 : 10;

    while (offset + minHeaderLen < maxOffset) {
      if (id3Bytes[offset] === 0x00) {
        let skipCount = 0;
        while (offset < maxOffset && id3Bytes[offset] === 0x00 && skipCount < 1024) {
          offset++;
          skipCount++;
        }
        if (offset >= maxOffset || offset + minHeaderLen >= maxOffset) break;
      }

      let frameId = "";
      let frameSize = 0;
      let dataOffset = 0;

      if (majorVersion === 2) {
        frameId = String.fromCharCode(id3Bytes[offset], id3Bytes[offset + 1], id3Bytes[offset + 2]);
        frameSize = (id3Bytes[offset + 3] << 16) | (id3Bytes[offset + 4] << 8) | id3Bytes[offset + 5];
        dataOffset = offset + 6;
        offset += 6 + frameSize;
      } else {
        frameId = String.fromCharCode(id3Bytes[offset], id3Bytes[offset + 1], id3Bytes[offset + 2], id3Bytes[offset + 3]);
        const b4 = id3Bytes[offset + 4];
        const b5 = id3Bytes[offset + 5];
        const b6 = id3Bytes[offset + 6];
        const b7 = id3Bytes[offset + 7];

        const syncsafeSize = ((b4 & 0x7f) << 21) | ((b5 & 0x7f) << 14) | ((b6 & 0x7f) << 7) | (b7 & 0x7f);
        const standardSize = (b4 << 24) | (b5 << 16) | (b6 << 8) | b7;

        frameSize = majorVersion === 4 ? (syncsafeSize > 0 ? syncsafeSize : standardSize) : standardSize;
        dataOffset = offset + 10;
        offset += 10 + frameSize;
      }

      const isValidId = majorVersion === 2 ? /^[A-Z0-9©_]{3}$/i.test(frameId) : /^[A-Z0-9©_ ]{4}$/i.test(frameId);
      if (!isValidId || frameSize < 0 || dataOffset + frameSize > id3Bytes.length + 100) {
        offset = dataOffset - (majorVersion === 2 ? 5 : 9);
        continue;
      }

      const clampedEnd = Math.min(dataOffset + frameSize, id3Bytes.length);
      const frameData = id3Bytes.subarray(dataOffset, clampedEnd);

      if (frameId.startsWith("T") && frameId !== "TXXX" && frameId !== "TXX") {
        const textVal = decodeId3Text(frameData);
        if (textVal) {
          addRawItem(model, frameId, textVal, versionStr, "MP3 / MPEG", versionStr, true, frameId === "TSSE" || frameId === "TENC" ? "ORIGEM" : "MUSICAL");
        }
      } else if (frameId === "COMM" || frameId === "COM" || frameId === "USLT" || frameId === "ULT") {
        const commentVal = decodeId3Comment(frameData);
        if (commentVal) {
          addRawItem(model, frameId, commentVal, versionStr, "MP3 / MPEG", versionStr, true, "MUSICAL");
        }
      } else if (frameId === "TXXX" || frameId === "TXX") {
        const txxxVal = decodeId3TXXX(frameData);
        if (txxxVal) {
          const key = txxxVal.description ? `TXXX:${txxxVal.description}` : "TXXX";
          addRawItem(model, key, txxxVal.value, versionStr, "MP3 / MPEG", versionStr, true, "ORIGEM");
        }
      } else if (frameId === "WXXX" || frameId === "WXX") {
        const wxxxVal = decodeId3TXXX(frameData);
        if (wxxxVal) {
          const key = wxxxVal.description ? `WXXX:${wxxxVal.description}` : "WXXX";
          addRawItem(model, key, wxxxVal.value, versionStr, "MP3 / MPEG", versionStr, true, "ORIGEM");
        }
      } else if (frameId === "PRIV") {
        const privVal = decodeId3PRIV(frameData);
        if (privVal) {
          const key = privVal.owner ? `PRIV:${privVal.owner}` : "PRIV";
          addRawItem(model, key, privVal.value, versionStr, "MP3 / MPEG", versionStr, true, "ORIGEM");
        }
      } else if ((frameId === "APIC" || frameId === "PIC") && !model.cover) {
        const coverObj = decodeId3APIC(frameData, majorVersion === 2);
        if (coverObj) {
          model.cover = coverObj;
          addRawItem(model, frameId, `[Capa Embutida: ${coverObj.mimeType}, ${(coverObj.sizeBytes / 1024).toFixed(1)} KB]`, versionStr, "MP3 / MPEG", versionStr, true, "MUSICAL");
        }
      } else {
        const strVal = decodeId3Text(frameData);
        if (strVal && strVal.length > 0 && /^[\x20-\x7E\s\u00A0-\uFFFF]+$/.test(strVal)) {
          addRawItem(model, frameId, strVal, versionStr, "MP3 / MPEG", versionStr, true, "ORIGEM");
        } else {
          addRawItem(model, frameId, `[Frame ${frameId}: ${frameSize} bytes]`, versionStr, "MP3 / MPEG", versionStr, true, "ORIGEM");
        }
      }
    }
  }

  // ID3v1 Tail Check
  try {
    if (file.size >= 128) {
      const tailLen = Math.min(file.size, 4096);
      const tailSlice = await file.slice(file.size - tailLen, file.size).arrayBuffer();
      const tailBytes = new Uint8Array(tailSlice);

      let tagPos = -1;
      for (let i = tailBytes.length - 128; i >= 0; i--) {
        if (tailBytes[i] === 0x54 && tailBytes[i + 1] === 0x41 && tailBytes[i + 2] === 0x47) {
          tagPos = i;
          break;
        }
      }

      if (tagPos >= 0) {
        if (!model.detectedTagTypes.includes("ID3v1")) model.detectedTagTypes.push("ID3v1");
        const decoder = new TextDecoder("latin1");
        const title1 = decoder.decode(tailBytes.subarray(tagPos + 3, tagPos + 33)).replace(/\0/g, "").trim();
        const artist1 = decoder.decode(tailBytes.subarray(tagPos + 33, tagPos + 63)).replace(/\0/g, "").trim();
        const album1 = decoder.decode(tailBytes.subarray(tagPos + 63, tagPos + 93)).replace(/\0/g, "").trim();
        const year1 = decoder.decode(tailBytes.subarray(tagPos + 93, tagPos + 97)).replace(/\0/g, "").trim();
        const comment1 = decoder.decode(tailBytes.subarray(tagPos + 97, tagPos + 127)).replace(/\0/g, "").trim();
        const genreIdx = tailBytes[tagPos + 127];

        if (title1) addRawItem(model, "ID3v1_TITLE", title1, "ID3v1", "MP3 / MPEG", "ID3v1", true, "MUSICAL");
        if (artist1) addRawItem(model, "ID3v1_ARTIST", artist1, "ID3v1", "MP3 / MPEG", "ID3v1", true, "MUSICAL");
        if (album1) addRawItem(model, "ID3v1_ALBUM", album1, "ID3v1", "MP3 / MPEG", "ID3v1", true, "MUSICAL");
        if (year1) addRawItem(model, "ID3v1_YEAR", year1, "ID3v1", "MP3 / MPEG", "ID3v1", true, "MUSICAL");
        if (comment1) addRawItem(model, "ID3v1_COMMENT", comment1, "ID3v1", "MP3 / MPEG", "ID3v1", true, "MUSICAL");
        if (genreIdx < ID3_GENRES.length) addRawItem(model, "ID3v1_GENRE", ID3_GENRES[genreIdx], "ID3v1", "MP3 / MPEG", "ID3v1", true, "MUSICAL");
      }
    }
  } catch (e) {
    console.warn("Error reading ID3v1 tail:", e);
  }

  // Scanner binário de strings em regiões não-áudio do MP3 (ID3v2 Header e Tail ID3v1/APEv2)
  try {
    const mp3Ranges: Array<{ start: number; end: number; regionName: string }> = [];
    if (id3Offset >= 0) {
      mp3Ranges.push({ start: id3Offset, end: id3Offset + 65536, regionName: "ID3v2 Header" });
    }
    if (file.size >= 256) {
      mp3Ranges.push({ start: file.size - 256, end: file.size, regionName: "MP3 Tail / ID3v1 / APE" });
    }
    if (mp3Ranges.length > 0) {
      await scanNonAudioTextualStrings(file, model, mp3Ranges);
    }
  } catch (e) {
    console.warn("Aviso no scan de strings MP3:", e);
  }
}

// ---------------- 3. FLAC COMPLETE INSPECTOR ----------------
async function parseFlacComplete(file: File, model: AudioMetadataModel) {
  model.technical.containerType = "Free Lossless Audio Codec (FLAC)";
  model.technical.codec = "FLAC";
  model.technical.isLossless = true;
  if (!model.detectedTagTypes.includes("Vorbis")) model.detectedTagTypes.push("Vorbis");

  const headBuf = await file.slice(0, Math.min(file.size, 131072)).arrayBuffer();
  const bytes = new Uint8Array(headBuf);

  let offset = 4;
  let isLast = false;

  while (offset + 4 < bytes.length && !isLast) {
    const headerByte = bytes[offset];
    isLast = (headerByte & 0x80) !== 0;
    const blockType = headerByte & 0x7f;
    const blockLen = (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    const blockDataOffset = offset + 4;

    if (blockType === 0 && blockDataOffset + 18 <= bytes.length) {
      const minBlockSize = (bytes[blockDataOffset] << 8) | bytes[blockDataOffset + 1];
      const maxBlockSize = (bytes[blockDataOffset + 2] << 8) | bytes[blockDataOffset + 3];
      const sampleRate = ((bytes[blockDataOffset + 10] << 12) | (bytes[blockDataOffset + 11] << 4) | (bytes[blockDataOffset + 12] >> 4)) >>> 0;
      const channels = ((bytes[blockDataOffset + 12] >> 1) & 0x07) + 1;
      const bitsPerSample = (((bytes[blockDataOffset + 12] & 0x01) << 4) | (bytes[blockDataOffset + 13] >> 4)) + 1;
      const totalSamples =
        ((bytes[blockDataOffset + 13] & 0x0f) * 0x100000000) +
        ((bytes[blockDataOffset + 14] << 24) | (bytes[blockDataOffset + 15] << 16) | (bytes[blockDataOffset + 16] << 8) | bytes[blockDataOffset + 17]);

      model.technical.sampleRateHz = sampleRate;
      model.technical.channels = channels;
      model.technical.bitsPerSample = bitsPerSample;
      model.technical.channelLayout = channels === 1 ? "Mono (1.0)" : channels === 2 ? "Estéreo (2.0)" : `${channels} Canais`;

      if (sampleRate > 0 && totalSamples > 0) {
        model.technical.durationSeconds = Math.round((totalSamples / sampleRate) * 100) / 100;
        if (model.filesize > 0) {
          model.technical.bitrateKbps = Math.round((model.filesize * 8) / (model.technical.durationSeconds * 1000));
        }
      }

      addRawItem(model, "FLAC_STREAMINFO", `${sampleRate} Hz • ${bitsPerSample}-bit • ${channels} canais • ${model.technical.durationSeconds}s`, "FLAC Block", "FLAC", "STREAMINFO", false, "TECNICO");
    } else if (blockType === 4 && blockDataOffset + blockLen <= bytes.length) {
      parseVorbisCommentBlock(bytes.subarray(blockDataOffset, blockDataOffset + blockLen), model, "FLAC Vorbis", "FLAC");
    }

    offset += 4 + blockLen;
  }
}

// ---------------- 4. VORBIS COMMENTS PARSER (FLAC / OGG) ----------------
function parseVorbisCommentBlock(data: Uint8Array, model: AudioMetadataModel, origin: string, container: string) {
  try {
    if (data.length < 4) return;
    const vendorLen = data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24);
    let offset = 4;
    if (offset + vendorLen > data.length) return;

    const vendorStr = new TextDecoder("utf-8").decode(data.subarray(offset, offset + vendorLen)).trim();
    if (vendorStr) {
      model.vendor = vendorStr;
      model.software = vendorStr;
      addRawItem(model, "VENDOR", vendorStr, origin, container, "Vorbis Header", true, "ORIGEM");
    }
    offset += vendorLen;

    if (offset + 4 > data.length) return;
    const commentCount = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
    offset += 4;

    for (let i = 0; i < commentCount && offset + 4 <= data.length; i++) {
      const len = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
      offset += 4;
      if (offset + len > data.length) break;

      const commentStr = new TextDecoder("utf-8").decode(data.subarray(offset, offset + len)).trim();
      offset += len;

      const eqIdx = commentStr.indexOf("=");
      if (eqIdx > 0) {
        const key = commentStr.substring(0, eqIdx).trim();
        const val = commentStr.substring(eqIdx + 1).trim();
        addRawItem(model, key, val, origin, container, "Vorbis Comment", true, "MUSICAL");
      }
    }
  } catch (e) {
    console.warn("Vorbis comments parse error:", e);
  }
}

function parseOggBinaryDeep(bytes: Uint8Array, model: AudioMetadataModel) {
  model.technical.containerType = "Ogg Bitstream Container";
  model.technical.codec = "Vorbis / Opus";
  model.technical.isLossless = false;
  if (!model.detectedTagTypes.includes("Ogg Vorbis")) model.detectedTagTypes.push("Ogg Vorbis");

  for (let i = 0; i < Math.min(bytes.length - 7, 8192); i++) {
    if (
      bytes[i] === 0x03 &&
      bytes[i + 1] === 0x76 &&
      bytes[i + 2] === 0x6f &&
      bytes[i + 3] === 0x72 &&
      bytes[i + 4] === 0x62 &&
      bytes[i + 5] === 0x69 &&
      bytes[i + 6] === 0x73
    ) {
      parseVorbisCommentBlock(bytes.subarray(i + 7), model, "Ogg Vorbis", "OGG");
      break;
    }
  }
}

// ---------------- 5. MP4 / M4A ATOMS DEEP PARSER ----------------
function parseMp4AtomsDeep(bytes: Uint8Array, model: AudioMetadataModel) {
  model.technical.containerType = "QuickTime / MP4 Audio";
  model.technical.codec = "Advanced Audio Coding (AAC)";
  model.technical.isLossless = false;
  if (!model.detectedTagTypes.includes("iTunes / MP4 Atoms")) model.detectedTagTypes.push("iTunes / MP4 Atoms");

  let offset = 0;
  while (offset + 8 <= bytes.length) {
    const atomSize = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    const atomType = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);

    if (atomSize <= 0 || offset + atomSize > bytes.length) break;

    if (atomType === "moov" || atomType === "udta" || atomType === "meta" || atomType === "ilst") {
      const nextOffset = atomType === "meta" ? offset + 12 : offset + 8;
      parseMp4IlstAtoms(bytes.subarray(nextOffset, offset + atomSize), model);
    }
    offset += atomSize;
  }
}

function parseMp4IlstAtoms(bytes: Uint8Array, model: AudioMetadataModel) {
  let offset = 0;
  while (offset + 8 <= bytes.length) {
    const size = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (size <= 0 || offset + size > bytes.length) break;

    const atomName = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);

    if (offset + 16 <= bytes.length) {
      const dataAtomSize = (bytes[offset + 8] << 24) | (bytes[offset + 9] << 16) | (bytes[offset + 10] << 8) | bytes[offset + 11];
      const dataAtomType = String.fromCharCode(bytes[offset + 12], bytes[offset + 13], bytes[offset + 14], bytes[offset + 15]);

      if (dataAtomType === "data" && dataAtomSize > 16 && offset + 8 + dataAtomSize <= bytes.length) {
        const payload = bytes.subarray(offset + 24, offset + 8 + dataAtomSize);
        try {
          const text = new TextDecoder("utf-8").decode(payload).replace(/\0/g, "").trim();
          if (text) {
            addRawItem(model, atomName, text, "MP4 Atom", "M4A / MP4", atomName, true, "MUSICAL");
          }
        } catch {}
      }
    }
    offset += size;
  }
}

// ---------------- 6. AIFF DEEP INSPECTOR ----------------
function parseAiffBinaryDeep(bytes: Uint8Array, model: AudioMetadataModel) {
  model.technical.containerType = "Audio Interchange File Format (AIFF)";
  model.technical.codec = "PCM Big-Endian Audio";
  model.technical.isLossless = true;
  model.technical.endianness = "Big-Endian (BE)";
  if (!model.detectedTagTypes.includes("AIFF Chunks")) model.detectedTagTypes.push("AIFF Chunks");

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    const chunkSize = (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
    if (chunkSize <= 0 || offset + 8 + chunkSize > bytes.length) break;

    if (chunkId === "COMM" && chunkSize >= 18) {
      const numChannels = (bytes[offset + 8] << 8) | bytes[offset + 9];
      const sampleRate = (bytes[offset + 14] << 8) | bytes[offset + 15];
      const sampleSize = (bytes[offset + 16] << 8) | bytes[offset + 17];

      model.technical.channels = numChannels;
      model.technical.sampleRateHz = sampleRate;
      model.technical.bitsPerSample = sampleSize;
      model.technical.channelLayout = numChannels === 1 ? "Mono (1.0)" : numChannels === 2 ? "Estéreo (2.0)" : `${numChannels} Canais`;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
}

// ---------------- 7. APEv2 BINARY PARSER ----------------
async function parseApeBinaryDeep(file: File, headBytes: Uint8Array, model: AudioMetadataModel) {
  try {
    if (file.size < 64) return;
    const tailLen = Math.min(file.size, 8192);
    const tailBuf = await file.slice(file.size - tailLen, file.size).arrayBuffer();
    const tailBytes = new Uint8Array(tailBuf);

    let apePos = -1;
    for (let i = tailBytes.length - 32; i >= 0; i--) {
      if (
        tailBytes[i] === 0x41 &&
        tailBytes[i + 1] === 0x50 &&
        tailBytes[i + 2] === 0x45 &&
        tailBytes[i + 3] === 0x54 &&
        tailBytes[i + 4] === 0x41 &&
        tailBytes[i + 5] === 0x47 &&
        tailBytes[i + 6] === 0x45 &&
        tailBytes[i + 7] === 0x58
      ) {
        apePos = i;
        break;
      }
    }

    if (apePos >= 0) {
      if (!model.detectedTagTypes.includes("APEv2")) model.detectedTagTypes.push("APEv2");
      const tagSize =
        tailBytes[apePos + 12] |
        (tailBytes[apePos + 13] << 8) |
        (tailBytes[apePos + 14] << 16) |
        (tailBytes[apePos + 15] << 24);
      const itemCount =
        tailBytes[apePos + 16] |
        (tailBytes[apePos + 17] << 8) |
        (tailBytes[apePos + 18] << 16) |
        (tailBytes[apePos + 19] << 24);

      addRawItem(model, "APEv2_HEADER", `APEv2 Tag (${tagSize} bytes, ${itemCount} itens)`, "APEv2", model.format, "APEv2", true, "ORIGEM");
    }
  } catch (e) {
    console.warn("APEv2 parse notice:", e);
  }
}

// ---------------- 8. XMP & EXTENSIBLE PACKAGE SCANNER ----------------
function scanDeepBinaryMetadata(bytes: Uint8Array, model: AudioMetadataModel) {
  try {
    const latin1Str = new TextDecoder("latin1").decode(bytes);
    const xmpStart = latin1Str.indexOf("<x:xmpmeta");
    const xmpEnd = latin1Str.indexOf("</x:xmpmeta>");
    if (xmpStart >= 0 && xmpEnd > xmpStart) {
      const xmpXml = latin1Str.substring(xmpStart, xmpEnd + 12);
      if (!model.detectedTagTypes.includes("XMP")) model.detectedTagTypes.push("XMP");
      addRawItem(model, "XMP_PACKAGE", `[Pacote XML XMP Detectado: ${xmpXml.length} caracteres]`, "XMP Packet", model.format, "XMP", true, "ORIGEM");
      parseGenericXmlNodes(xmpXml, model, "XMP Packet", model.format, "XMP");
    }
  } catch (err) {
    console.warn("Deep scan notice:", err);
  }
}

// ---------------- GENERIC XML NODES PARSER (iXML & XMP) ----------------
function parseGenericXmlNodes(xmlString: string, model: AudioMetadataModel, origin: string, container: string, block: string) {
  const matches = xmlString.matchAll(/<([a-zA-Z0-9_:-]+)[^>]*>([^<]+)<\/\1>/g);
  for (const m of matches) {
    const nodeName = m[1].trim();
    const nodeVal = m[2].trim();
    if (nodeVal && nodeName !== "x:xmpmeta" && nodeName !== "rdf:RDF" && nodeName !== "rdf:Description") {
      addRawItem(model, nodeName, nodeVal, origin, container, block, true, "ORIGEM");

      if (nodeName.toLowerCase().includes("creator") || nodeName.toLowerCase().includes("tool")) {
        model.software = nodeVal;
      }
    }
  }
}

// ---------------- ATOMIC RAW ITEM ADDER ----------------
function addRawItem(
  model: AudioMetadataModel,
  key: string,
  value: string,
  origin: string,
  container: string = model.format,
  blockOrFrame: string = origin,
  isRemovable: boolean = true,
  category: "MUSICAL" | "TECNICO" | "ORIGEM" | "ESTRUTURA" = "MUSICAL"
) {
  const cleanVal = String(value).trim();
  if (!cleanVal) return;

  const sizeBytes = cleanVal.length;

  if (origin.startsWith("ID3") && !model.id3Frames.some((f) => f.id === key && f.value === cleanVal)) {
    model.id3Frames.push({
      id: key,
      version: origin,
      description: getID3FrameDescription(key),
      value: cleanVal,
      sizeBytes,
      isUnknown: false,
      isRemovable
    });
  }

  if (!model.rawTagsList.some((r) => r.key === key && r.value === cleanVal)) {
    model.rawTagsList.push({
      type: origin,
      key,
      value: cleanVal,
      sizeBytes,
      origin,
      container,
      blockOrFrame,
      isRemovable,
      category
    });
  }

  model.rawTags[key] = cleanVal;

  checkAndSetSoftwareOrigin(key, cleanVal, model);
}

// ---------------- CROSS-FILL MISSING FIELDS FROM RAW TAGS ----------------
function fillMissingFieldsFromRawTags(model: AudioMetadataModel) {
  const findVal = (...keys: string[]): string => {
    const targets = keys.map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ""));
    for (const item of model.rawTagsList) {
      const norm = item.key.toLowerCase().replace(/[^a-z0-9]/g, "");
      // Match exact, or suffix (e.g. id3v23tit2 matching tit2)
      for (const target of targets) {
        if (norm === target || norm.endsWith(target) || norm.startsWith(target)) {
          if (item.value && !item.value.startsWith("[Frame") && !item.value.startsWith("[Payload")) {
            return item.value;
          }
        }
      }
    }
    return "";
  };

  if (!model.title) model.title = findVal("TIT2", "TT2", "TITLE", "INAM", "©nam", "nam", "ID3v1_TITLE", "TrackTitle");
  if (!model.artist) model.artist = findVal("TPE1", "TP1", "ARTIST", "IART", "©ART", "art", "ID3v1_ARTIST", "Author");
  if (!model.album) model.album = findVal("TALB", "TAL", "ALBUM", "IPRD", "©alb", "alb", "ID3v1_ALBUM", "AlbumTitle");
  if (!model.albumArtist) model.albumArtist = findVal("TPE2", "TP2", "ALBUMARTIST", "AlbumArtist", "aART", "Band");
  if (!model.composer) model.composer = findVal("TCOM", "TCM", "COMPOSER", "Composer", "©wrt", "IENG");
  if (!model.genre) {
    const g = findVal("TCON", "TCO", "GENRE", "Genre", "IGNR", "©gen", "ID3v1_GENRE");
    if (g) model.genre = cleanGenreString(g);
  }
  if (!model.year) model.year = findVal("TYER", "TYE", "TDRC", "DATE", "Date", "YEAR", "ICRD", "©day", "ID3v1_YEAR", "OriginationDate");
  if (!model.trackNumber) {
    const trk = findVal("TRCK", "TRK", "TRACKNUMBER", "Track", "ITRK", "trkn");
    if (trk) {
      const p = trk.split("/");
      model.trackNumber = p[0].trim();
      if (p[1] && !model.totalTracks) model.totalTracks = p[1].trim();
    }
  }
  if (!model.copyright) model.copyright = findVal("TCOP", "TCR", "COPYRIGHT", "Copyright", "ICOP", "cprt");
  if (!model.comment) model.comment = findVal("COMM", "COM", "COMMENT", "Comment", "ICMT", "©cmt", "ID3v1_COMMENT", "Description");
  if (!model.lyrics) model.lyrics = findVal("USLT", "ULT", "LYRICS", "Lyrics", "©lyr");
  if (!model.isrc) model.isrc = findVal("TSRC", "TRC", "ISRC");
  if (!model.bpm) model.bpm = findVal("TBPM", "TBP", "BPM");
  if (!model.key) model.key = findVal("TKEY", "TKE", "KEY");
  if (!model.publisher) model.publisher = findVal("TPUB", "TPB", "PUBLISHER", "LABEL");

  if (!model.software && !model.encoder) {
    const s = findVal("TSSE", "TSS", "TENC", "ISFT", "ENCODER", "SOFTWARE", "Originator", "VENDOR", "©too", "CreatorTool");
    if (s) {
      model.software = s;
      model.encoder = s;
    }
  }
}

function checkAndSetSoftwareOrigin(frameId: string, value: string, model: AudioMetadataModel) {
  const norm = frameId.toUpperCase();
  if (
    norm === "TSSE" || norm === "TENC" || norm === "ISFT" || norm === "ENCODER" ||
    norm === "SOFTWARE" || norm === "ORIGINATOR" || norm === "VENDOR" || norm === "©TOO" ||
    norm.startsWith("TXXX:ENCODER") || norm.startsWith("TXXX:SOFTWARE")
  ) {
    if (!model.software) model.software = value;
    if (!model.encoder) model.encoder = value;
  }
  if (norm.startsWith("TXXX:ORIGIN") || norm.startsWith("TXXX:SOURCE") || norm.startsWith("TXXX:URL") || norm === "WOAS" || norm === "WOAR") {
    if (!model.tool) model.tool = value;
  }
}

function calculateAudioMetricsFallback(file: File, model: AudioMetadataModel) {
  if (model.format === "WAV" && model.technical.byteRate && model.technical.byteRate > 0 && model.technical.audioDataLength) {
    const dur = Math.round((model.technical.audioDataLength / model.technical.byteRate) * 100) / 100;
    if (dur > 0 && model.technical.durationSeconds === 0) {
      model.technical.durationSeconds = dur;
    }
  }
}

async function extractAudioElementTechnicalInfo(file: File, model: AudioMetadataModel): Promise<void> {
  if (model.technical.durationSeconds > 0 && model.technical.bitrateKbps > 0) return;

  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = "metadata";

      const cleanup = () => {
        URL.revokeObjectURL(url);
        resolve();
      };

      audio.onloadedmetadata = () => {
        if (!isNaN(audio.duration) && audio.duration > 0 && model.technical.durationSeconds === 0) {
          model.technical.durationSeconds = Math.round(audio.duration * 100) / 100;
          if (model.technical.bitrateKbps === 0 && file.size > 0) {
            const kbps = Math.round((file.size * 8) / (audio.duration * 1000));
            model.technical.bitrateKbps = kbps;
          }
        }
        cleanup();
      };

      audio.onerror = () => cleanup();
      setTimeout(cleanup, 1500);
      audio.src = url;
    } catch {
      resolve();
    }
  });
}

function measureCoverDimensions(cover: AudioCoverArt): Promise<void> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        cover.width = img.naturalWidth;
        cover.height = img.naturalHeight;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = cover.dataUrl;
    } catch {
      resolve();
    }
  });
}

function decodeId3Text(data: Uint8Array): string {
  if (data.length === 0) return "";
  const encoding = data[0];
  const payload = data.subarray(1);
  if (payload.length === 0) return "";

  try {
    if (encoding === 0x00) return new TextDecoder("latin1").decode(payload).replace(/\0/g, "").trim();
    if (encoding === 0x01) return new TextDecoder("utf-16le").decode(payload).replace(/\0/g, "").trim();
    if (encoding === 0x02) return new TextDecoder("utf-16be").decode(payload).replace(/\0/g, "").trim();
    if (encoding === 0x03) return new TextDecoder("utf-8").decode(payload).replace(/\0/g, "").trim();
    return new TextDecoder("utf-8").decode(payload).replace(/\0/g, "").trim();
  } catch {
    return new TextDecoder("latin1").decode(payload).replace(/\0/g, "").trim();
  }
}

function decodeId3Comment(data: Uint8Array): string {
  if (data.length < 4) return "";
  const encoding = data[0];
  let offset = 4;

  if (encoding === 0x00 || encoding === 0x03) {
    while (offset < data.length && data[offset] !== 0x00) offset++;
    offset++;
  } else {
    while (offset + 1 < data.length && !(data[offset] === 0x00 && data[offset + 1] === 0x00)) offset += 2;
    offset += 2;
  }

  if (offset < data.length) {
    const textData = data.subarray(offset);
    return decodeId3Text(new Uint8Array([encoding, ...Array.from(textData)]));
  }
  return decodeId3Text(data);
}

function decodeId3TXXX(data: Uint8Array): { description: string; value: string } | null {
  if (data.length < 2) return null;
  const encoding = data[0];
  let offset = 1;

  let descEnd = offset;
  if (encoding === 0x00 || encoding === 0x03) {
    while (descEnd < data.length && data[descEnd] !== 0x00) descEnd++;
  } else {
    while (descEnd + 1 < data.length && !(data[descEnd] === 0x00 && data[descEnd + 1] === 0x00)) descEnd += 2;
  }

  const descBytes = data.subarray(offset, descEnd);
  const descStr = decodeId3Text(new Uint8Array([encoding, ...Array.from(descBytes)]));

  const valOffset = descEnd + (encoding === 0x01 || encoding === 0x02 ? 2 : 1);
  if (valOffset < data.length) {
    const valBytes = data.subarray(valOffset);
    const valStr = decodeId3Text(new Uint8Array([encoding, ...Array.from(valBytes)]));
    return { description: descStr, value: valStr };
  }
  return { description: descStr, value: "" };
}

function decodeId3PRIV(data: Uint8Array): { owner: string; value: string } | null {
  if (data.length === 0) return null;
  let offset = 0;
  while (offset < data.length && data[offset] !== 0x00) offset++;
  const owner = new TextDecoder("latin1").decode(data.subarray(0, offset)).trim();
  offset++;

  let val = "";
  if (offset < data.length) {
    const payload = data.subarray(offset);
    val = `[Payload Privado: ${payload.length} bytes]`;
  }
  return { owner, value: val };
}

function decodeId3APIC(data: Uint8Array, isV22: boolean): AudioCoverArt | null {
  try {
    if (data.length < 10) return null;
    const encoding = data[0];
    let offset = 1;

    let mimeType = "image/jpeg";
    if (isV22) {
      const formatStr = String.fromCharCode(data[1], data[2], data[3]).toLowerCase();
      mimeType = formatStr === "png" ? "image/png" : "image/jpeg";
      offset = 4;
    } else {
      let mimeEnd = offset;
      while (mimeEnd < data.length && data[mimeEnd] !== 0x00) mimeEnd++;
      mimeType = new TextDecoder("latin1").decode(data.subarray(offset, mimeEnd)) || "image/jpeg";
      offset = mimeEnd + 1;
    }

    const picType = data[offset];
    offset++;

    if (encoding === 0x00 || encoding === 0x03) {
      while (offset < data.length && data[offset] !== 0x00) offset++;
      offset++;
    } else {
      while (offset + 1 < data.length && !(data[offset] === 0x00 && data[offset + 1] === 0x00)) offset += 2;
      offset += 2;
    }

    if (offset < data.length) {
      const imgBytes = data.subarray(offset);
      let binaryStr = "";
      const len = imgBytes.length;
      const chunkSize = 8192;
      for (let i = 0; i < len; i += chunkSize) {
        const sub = imgBytes.subarray(i, Math.min(i + chunkSize, len));
        binaryStr += String.fromCharCode.apply(null, Array.from(sub));
      }
      const base64 = btoa(binaryStr);

      return {
        dataUrl: `data:${mimeType};base64,${base64}`,
        mimeType,
        format: mimeType.split("/")[1] || "jpeg",
        sizeBytes: imgBytes.length,
        typeDescription: picType === 3 ? "Front Cover" : "Capa Embutida"
      };
    }
  } catch (e) {
    console.warn("Falha ao decodificar frame APIC:", e);
  }
  return null;
}

function getID3FrameDescription(frameId: string): string {
  const map: Record<string, string> = {
    TIT2: "Título da Faixa",
    TT2: "Título da Faixa",
    TPE1: "Artista / Intérprete Principal",
    TP1: "Artista Principal",
    TALB: "Nome do Álbum",
    TAL: "Nome do Álbum",
    TPE2: "Artista do Álbum / Banda",
    TP2: "Artista do Álbum",
    TCOM: "Compositor da Música",
    TCM: "Compositor",
    TCON: "Gênero Musical",
    TCO: "Gênero Musical",
    TYER: "Ano de Lançamento",
    TYE: "Ano de Lançamento",
    TDRC: "Data de Gravação / Release",
    TRCK: "Número da Faixa",
    TRK: "Número da Faixa",
    TPOS: "Número do Disco / Volume",
    TPA: "Número do Disco",
    TCOP: "Copyright / Direitos Autorais",
    TCR: "Copyright",
    TPUB: "Gravadora / Editora / Selo",
    TPB: "Editora",
    TSRC: "Código ISRC da Faixa",
    TRC: "Código ISRC",
    TBPM: "Batidas por Minuto (BPM)",
    TBP: "BPM",
    TKEY: "Tom Musical / Escala",
    TKE: "Tom Musical",
    TLAN: "Idioma do Áudio",
    TLA: "Idioma",
    COMM: "Comentários do Áudio",
    COM: "Comentários",
    USLT: "Letra da Música",
    ULT: "Letra da Música",
    TSSE: "Software / Configuração do Encoder",
    TSS: "Encoder",
    TENC: "Codificado por / Engenheiro",
    TEN: "Codificado por",
    TXXX: "Texto Personalizado",
    WXXX: "Link / URL Personalizado",
    WOAR: "URL Oficial do Artista",
    WOAS: "URL Oficial da Fonte",
    WPUB: "URL Oficial da Editora",
    UFID: "Identificador Único",
    PRIV: "Frame Privado",
    APIC: "Capa do Álbum",
    PIC: "Capa do Álbum",
    POPM: "Classificação",
    INAM: "Título (RIFF INFO)",
    IART: "Artista (RIFF INFO)",
    IPRD: "Álbum (RIFF INFO)",
    ICRD: "Data de Criação (RIFF INFO)",
    IGNR: "Gênero (RIFF INFO)",
    ICMT: "Comentário (RIFF INFO)",
    ISFT: "Software (RIFF INFO)",
    ICOP: "Copyright (RIFF INFO)",
    ITRK: "Faixa (RIFF INFO)",
    IENG: "Engenheiro (RIFF INFO)",
    ITCH: "Técnico (RIFF INFO)",
    ISRC: "ISRC (RIFF INFO)",
    Description: "Descrição Broadcast (BWF)",
    Originator: "Software / Criador (BWF)",
    OriginatorReference: "Referência de Origem (BWF)",
    OriginationDate: "Data de Criação (BWF)",
    CodingHistory: "Histórico de Codificação (BWF)"
  };

  if (map[frameId]) return map[frameId];
  if (frameId.startsWith("TXXX:")) return `Tag Personalizada (${frameId.replace("TXXX:", "")})`;
  if (frameId.startsWith("WXXX:")) return `URL Personalizada (${frameId.replace("WXXX:", "")})`;
  if (frameId.startsWith("PRIV:")) return `Frame Privado (${frameId.replace("PRIV:", "")})`;
  if (frameId.startsWith("CHUNK_")) return `Estrutura RIFF (${frameId.replace("CHUNK_", "")})`;
  return "Propriedade de Metadados";
}

/**
 * Compiles a comprehensive list of all removable metadata items from an AudioMetadataModel
 */
export function extractRemovableTagsList(model: AudioMetadataModel): Array<{ key: string; label: string; value: string; category: string }> {
  const items: Array<{ key: string; label: string; value: string; category: string }> = [];

  // Musical fields
  if (model.title) items.push({ key: "title", label: "Título da Música", value: model.title, category: "Musical" });
  if (model.artist) items.push({ key: "artist", label: "Artista Principal", value: model.artist, category: "Musical" });
  if (model.album) items.push({ key: "album", label: "Álbum", value: model.album, category: "Musical" });
  if (model.albumArtist) items.push({ key: "albumArtist", label: "Artista do Álbum", value: model.albumArtist, category: "Musical" });
  if (model.year) items.push({ key: "year", label: "Ano / Data", value: model.year, category: "Musical" });
  if (model.genre) items.push({ key: "genre", label: "Gênero", value: model.genre, category: "Musical" });
  if (model.trackNumber) items.push({ key: "trackNumber", label: "Número da Faixa", value: `${model.trackNumber}${model.totalTracks ? `/${model.totalTracks}` : ""}`, category: "Musical" });
  if (model.discNumber) items.push({ key: "discNumber", label: "Disco / Volume", value: `${model.discNumber}${model.totalDiscs ? `/${model.totalDiscs}` : ""}`, category: "Musical" });
  if (model.composer) items.push({ key: "composer", label: "Compositor", value: model.composer, category: "Musical" });
  if (model.isrc) items.push({ key: "isrc", label: "Código ISRC", value: model.isrc, category: "Musical" });
  if (model.bpm) items.push({ key: "bpm", label: "BPM", value: model.bpm, category: "Musical" });
  if (model.key) items.push({ key: "key", label: "Tom Musical", value: model.key, category: "Musical" });
  if (model.publisher) items.push({ key: "publisher", label: "Editora / Selo", value: model.publisher, category: "Musical" });
  if (model.copyright) items.push({ key: "copyright", label: "Copyright", value: model.copyright, category: "Musical" });
  if (model.comment) items.push({ key: "comment", label: "Comentários", value: model.comment, category: "Musical" });
  if (model.lyrics) items.push({ key: "lyrics", label: "Letra da Música", value: model.lyrics.length > 60 ? `${model.lyrics.substring(0, 60)}...` : model.lyrics, category: "Musical" });
  if (model.cover) items.push({ key: "cover", label: "Capa do Álbum", value: `Imagem (${model.cover.mimeType || "JPEG"}, ${(model.cover.sizeBytes / 1024).toFixed(1)} KB)`, category: "Musical" });

  // Origin / Software fields
  if (model.software) items.push({ key: "software", label: "Software / Aplicativo", value: model.software, category: "Software / Origem" });
  if (model.encoder && model.encoder !== model.software) items.push({ key: "encoder", label: "Encoder", value: model.encoder, category: "Software / Origem" });
  if (model.encodedBy) items.push({ key: "encodedBy", label: "Codificado por", value: model.encodedBy, category: "Software / Origem" });
  if (model.writingLibrary) items.push({ key: "writingLibrary", label: "Biblioteca de Escrita", value: model.writingLibrary, category: "Software / Origem" });
  if (model.vendor) items.push({ key: "vendor", label: "Fabricante / Vendor", value: model.vendor, category: "Software / Origem" });
  if (model.originator) items.push({ key: "originator", label: "Originador (BWF)", value: model.originator, category: "Software / Origem" });
  if (model.tool) items.push({ key: "tool", label: "Ferramenta", value: model.tool, category: "Software / Origem" });
  if (model.source) items.push({ key: "source", label: "Fonte / Origem", value: model.source, category: "Software / Origem" });
  if (model.url || model.website) items.push({ key: "url", label: "URL / Website", value: model.url || model.website || "", category: "Software / Origem" });
  if (model.description) items.push({ key: "description", label: "Descrição", value: model.description, category: "Software / Origem" });

  // Native / Extra tags in rawTagsList that are removable
  const standardKeys = new Set([
    "title", "artist", "album", "albumartist", "year", "genre", "track", "tracknumber", "disc", "discnumber",
    "composer", "isrc", "bpm", "key", "publisher", "copyright", "comment", "lyrics",
    "software", "encoder", "encodedby", "writinglibrary", "vendor", "originator", "originatorreference", "originationdate", "tool", "source", "url", "website",
    "description", "creationtime",
    "tit2", "tt2", "tpe1", "tp1", "talb", "tal", "tpe2", "tp2", "tcom", "tcm", "tcon", "tco",
    "tyer", "tye", "tdrc", "trck", "trk", "tpos", "tpa", "tcop", "tcr", "tpub", "tpb", "tsrc", "trc",
    "tbpm", "tbp", "tkey", "tke", "tlan", "tla", "comm", "com", "uslt", "ult", "tsse", "tss", "tenc", "ten",
    "apic", "pic", "covr", "picture",
    "inam", "iart", "iprd", "icrd", "ignr", "icmt", "isft", "icop", "itrk", "isrc", "ieng", "itch",
    "©nam", "©art", "©alb", "aart", "©day", "©gen", "©wrt", "©cmt", "©lyr", "©too", "cprt", "trkn", "disk",
    "id3v1_title", "id3v1_artist", "id3v1_album", "id3v1_year", "id3v1_comment", "id3v1_genre"
  ]);

  if (model.rawTagsList) {
    model.rawTagsList.forEach((tag) => {
      if (tag.category !== "TECNICO" && tag.category !== "ESTRUTURA" && tag.isRemovable) {
        const cleanK = tag.key.toLowerCase().replace(/[^a-z0-9©_]/g, "");
        if (!standardKeys.has(cleanK) && !items.some(i => i.key === tag.key)) {
          items.push({
            key: tag.key,
            label: tag.key,
            value: tag.value,
            category: tag.origin || "Tag Específica"
          });
        }
      }
    });
  }

  return items;
}

/**
 * Builds a complete, non-lossy raw metadata inventory containing every discovered technical and metadata item
 */
export function buildCompleteMetadataInventory(model: AudioMetadataModel): RawMetadataInventoryItem[] {
  const inventory: RawMetadataInventoryItem[] = [];
  const seen = new Set<string>();

  const addItem = (
    name: string,
    value: string | number | undefined,
    origin: string,
    block: string,
    isRemovable: boolean,
    category: "MUSICAL" | "ORIGEM" | "TAGS_NATIVAS" | "TECNICO" | "ESTRUTURA",
    container: string = model.format
  ) => {
    if (value === undefined || value === null || String(value).trim() === "") return;
    const strVal = String(value).trim();
    const uniqueKey = `${name}::${strVal}::${origin}`;
    if (seen.has(uniqueKey)) return;
    seen.add(uniqueKey);

    inventory.push({
      id: `${name}_${inventory.length}`,
      name,
      value: strVal,
      origin,
      container,
      block,
      isRemovable,
      typeLabel: isRemovable ? "REMOVER NA LIMPEZA" : "ESSENCIAL PARA REPRODUÇÃO",
      category
    });
  };

  // 1. DADOS TÉCNICOS E ESTRUTURAIS (TODOS PROTEGIDOS)
  addItem("Formato", model.format, "Container Header", "Format", false, "TECNICO");
  addItem("Container", model.technical.containerType || model.format, "Container Header", "Container", false, "TECNICO");
  addItem("Codec", model.technical.codec, "Audio Stream", "Codec", false, "TECNICO");
  addItem("SampleRate", model.technical.sampleRateHz ? `${model.technical.sampleRateHz.toLocaleString("pt-BR")} Hz` : undefined, `${model.format} Header`, "fmt", false, "TECNICO");
  addItem("BitsPerSample", model.technical.bitsPerSample ? `${model.technical.bitsPerSample} bits` : undefined, `${model.format} Header`, "fmt", false, "TECNICO");
  addItem("NumChannels", model.technical.channels ? `${model.technical.channels} (${model.technical.channels === 1 ? "Mono" : model.technical.channels === 2 ? "Estéreo" : "Multi-canal"})` : undefined, `${model.format} Header`, "fmt", false, "TECNICO");
  addItem("ChannelLayout", model.technical.channelLayout, "Audio Stream", "Channels", false, "TECNICO");
  addItem("ByteRate", model.technical.byteRate ? `${model.technical.byteRate.toLocaleString("pt-BR")} B/s` : undefined, "WAV / fmt", "fmt", false, "TECNICO");
  addItem("BlockAlign", model.technical.blockAlign ? `${model.technical.blockAlign} bytes` : undefined, "WAV / fmt", "fmt", false, "TECNICO");
  addItem("AudioFormat", model.technical.audioFormatCode ? `${model.technical.audioFormatCode} (${model.technical.audioFormatName || "PCM Linear"})` : undefined, "WAV / fmt", "fmt", false, "TECNICO");
  addItem("Bitrate", model.technical.bitrateKbps ? `${model.technical.bitrateKbps} kbps` : undefined, "Audio Stream", "Bitrate", false, "TECNICO");
  addItem("Duration", model.technical.durationSeconds ? `${model.technical.durationSeconds.toFixed(2)}s` : undefined, "Audio Stream", "Duration", false, "TECNICO");
  addItem("FileSize", model.filesize ? `${model.filesize.toLocaleString("pt-BR")} bytes` : undefined, "File System", "File", false, "TECNICO");

  // Chunks essenciais de WAV / Container
  if (model.technical.audioDataLength) {
    addItem("data_payload", `${model.technical.audioDataLength.toLocaleString("pt-BR")} bytes (PCM puro)`, "WAV / data", "data", false, "TECNICO");
  }

  // Hashes Criptográficos de Comprovação
  if (model.technical.fileHash) {
    addItem("SHA256_File_Fingerprint", model.technical.fileHash, "Crypto / Subtitle", "SHA-256", false, "TECNICO");
  }
  if (model.technical.audioPayloadHash) {
    addItem("SHA256_Audio_Payload", model.technical.audioPayloadHash, "PCM Stream / Hash", "SHA-256", false, "TECNICO");
  }

  // 2. TODOS OS ITENS RAW CAPTURADOS PELO PARSER (Nativos, ID3, LIST/INFO, BEXT, etc.)
  if (model.rawTagsList && model.rawTagsList.length > 0) {
    model.rawTagsList.forEach((raw) => {
      // Defesa: se for uma string estrutural (ex: RIFF, WAVEfmt, headers essenciais), proteger como ESTRUTURA / não removível
      const isStructural = isStructuralWavString(raw.value) || (raw.key.startsWith("RAW_TEXT_") && isStructuralWavString(raw.value));
      if (isStructural) {
        addItem(raw.key, raw.value, raw.origin || model.format, raw.blockOrFrame || "Estrutura", false, "ESTRUTURA", raw.container || model.format);
        return;
      }

      let cat: "MUSICAL" | "ORIGEM" | "TAGS_NATIVAS" | "TECNICO" | "ESTRUTURA" = "TAGS_NATIVAS";
      if (!raw.isRemovable) cat = raw.category === "ESTRUTURA" ? "ESTRUTURA" : "TECNICO";
      else if (raw.category === "ORIGEM") cat = "ORIGEM";
      else if (raw.category === "MUSICAL") cat = "MUSICAL";

      addItem(
        raw.key,
        raw.value,
        raw.origin || model.format,
        raw.blockOrFrame || raw.origin || "Tag",
        Boolean(raw.isRemovable),
        cat,
        raw.container || model.format
      );
    });
  }

  // 3. METADADOS NORMALIZADOS (Garantir que todos apareçam no inventário)
  if (model.title) addItem("Título (Title)", model.title, "Metadados Musicais", "INAM / TIT2", true, "MUSICAL");
  if (model.artist) addItem("Artista (Artist)", model.artist, "Metadados Musicais", "IART / TPE1", true, "MUSICAL");
  if (model.album) addItem("Álbum (Album)", model.album, "Metadados Musicais", "IPRD / TALB", true, "MUSICAL");
  if (model.albumArtist) addItem("Artista do Álbum", model.albumArtist, "Metadados Musicais", "TPE2", true, "MUSICAL");
  if (model.year) addItem("Ano / Data (Year)", model.year, "Metadados Musicais", "ICRD / TYER", true, "MUSICAL");
  if (model.genre) addItem("Gênero (Genre)", model.genre, "Metadados Musicais", "IGNR / TCON", true, "MUSICAL");
  if (model.trackNumber) addItem("Número da Faixa", `${model.trackNumber}${model.totalTracks ? `/${model.totalTracks}` : ""}`, "Metadados Musicais", "ITRK / TRCK", true, "MUSICAL");
  if (model.discNumber) addItem("Disco / Volume", `${model.discNumber}${model.totalDiscs ? `/${model.totalDiscs}` : ""}`, "Metadados Musicais", "TPOS", true, "MUSICAL");
  if (model.composer) addItem("Compositor (Composer)", model.composer, "Metadados Musicais", "IENG / TCOM", true, "MUSICAL");
  if (model.copyright) addItem("Copyright", model.copyright, "Metadados Musicais", "ICOP / TCOP", true, "MUSICAL");
  if (model.comment) addItem("Comentário (Comment)", model.comment, "Metadados Musicais", "ICMT / COMM", true, "MUSICAL");
  if (model.lyrics) addItem("Letra (Lyrics)", model.lyrics, "Metadados Musicais", "USLT", true, "MUSICAL");
  if (model.isrc) addItem("Código ISRC", model.isrc, "Metadados Musicais", "ISRC / TSRC", true, "MUSICAL");
  if (model.bpm) addItem("BPM", model.bpm, "Metadados Musicais", "TBPM", true, "MUSICAL");
  if (model.key) addItem("Tom Musical", model.key, "Metadados Musicais", "TKEY", true, "MUSICAL");
  if (model.publisher) addItem("Editora / Selo", model.publisher, "Metadados Musicais", "TPUB", true, "MUSICAL");
  if (model.cover) addItem("Capa (Cover Art)", `Imagem ${model.cover.mimeType} (${(model.cover.sizeBytes / 1024).toFixed(1)} KB)`, "Arte Embutida", "APIC / Cover", true, "MUSICAL");
  if (model.software) addItem("Software", model.software, "Origem / Software", "ISFT / TSSE / bext", true, "ORIGEM");
  if (model.encoder) addItem("Encoder", model.encoder, "Origem / Software", "TSSE / bext", true, "ORIGEM");
  if (model.originator) addItem("Originator", model.originator, "Origem BWF", "bext", true, "ORIGEM");

  return inventory;
}
