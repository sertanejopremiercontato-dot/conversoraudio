/**
 * AUDIO METADATA CLEAN STUDIO — MOTOR B: AUDITOR BINÁRIO ESTRUTURAL INDEPENDENTE
 * 
 * Este módulo NÃO é um leitor de metadados convencional nem depende do Motor A.
 * Trata-se de um scanner físico e estrutural de bytes que percorre o container
 * de áudio até o EOF para auditar fisicamente todos os blocos, cabeçalhos,
 * tags e estruturas presentes no arquivo.
 */

import {
  RawChunkOrBlock,
  EngineBVerifierResult,
  SupportedAudioFormat,
} from "./types";
import {
  readFourCC,
  readUint16LE,
  readUint32LE,
  readUint32BE,
  decodeAsciiOrUtf8,
} from "./utils";

export interface BinaryAuditReport {
  format: SupportedAudioFormat;
  essentialBlocks: RawChunkOrBlock[];
  removableBlocks: RawChunkOrBlock[];
  unknownBlocks: RawChunkOrBlock[];
  detectedSignatures: string[];
  sunoDetected: boolean;
  sunoDetails?: string;
  isPureClean: boolean;
}

export class BinaryStructuralVerifier {
  /**
   * Executa a auditoria física completa do arquivo byte-a-byte
   */
  audit(bytes: Uint8Array, hintFormat?: SupportedAudioFormat): EngineBVerifierResult {
    const report = this.auditInternal(bytes, hintFormat);

    const removableBlocksCount = report.removableBlocks.length;
    const unknownBlocksCount = report.unknownBlocks.length;
    const essentialBlocksCount = report.essentialBlocks.length;
    const allBlocks = [
      ...report.essentialBlocks,
      ...report.removableBlocks,
      ...report.unknownBlocks,
    ];

    let status: "CLEAN" | "HAS_METADATA" | "HAS_UNKNOWN_BLOCKS" | "ERROR" = "CLEAN";
    if (unknownBlocksCount > 0) {
      status = "HAS_UNKNOWN_BLOCKS";
    } else if (removableBlocksCount > 0 || report.sunoDetected) {
      status = "HAS_METADATA";
    }

    return {
      removableBlocksCount,
      unknownBlocksCount,
      essentialBlocksCount,
      blocksFound: allBlocks,
      detectedSignatures: report.detectedSignatures,
      sunoDetected: report.sunoDetected,
      status,
    };
  }

  private auditInternal(bytes: Uint8Array, hintFormat?: SupportedAudioFormat): BinaryAuditReport {
    // Detecção primária de cabeçalho
    if (bytes.length >= 12) {
      const tag = readFourCC(bytes, 0);
      const sub = readFourCC(bytes, 8);

      if ((tag === "RIFF" || tag === "RIFX" || tag === "RF64" || tag === "BW64") && (sub === "WAVE" || sub === "BW64")) {
        return this.auditWav(bytes, tag);
      }

      if (tag === "FORM" && (sub === "AIFF" || sub === "AIFC")) {
        return this.auditAiff(bytes);
      }
    }

    if (bytes.length >= 4 && readFourCC(bytes, 0) === "fLaC") {
      return this.auditFlac(bytes);
    }

    if (bytes.length >= 4 && readFourCC(bytes, 0) === "OggS") {
      return this.auditOgg(bytes);
    }

    if (bytes.length >= 8) {
      const boxType = readFourCC(bytes, 4);
      if (boxType === "ftyp" || boxType === "moov" || boxType === "mdat") {
        return this.auditMp4(bytes);
      }
    }

    // MP3 check (ID3 header or MPEG sync)
    if (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      return this.auditMp3(bytes);
    }

    // Check for MPEG frame sync
    for (let i = 0; i < Math.min(bytes.length - 1, 8192); i++) {
      if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0) {
        return this.auditMp3(bytes);
      }
    }

    if (hintFormat === "MP3") return this.auditMp3(bytes);
    if (hintFormat === "WAV") return this.auditWav(bytes, "RIFF");

    return {
      format: "UNKNOWN",
      essentialBlocks: [],
      removableBlocks: [],
      unknownBlocks: [],
      detectedSignatures: [],
      sunoDetected: false,
      isPureClean: false,
    };
  }

  // ==========================================
  // WAV / RIFF AUDITOR BINÁRIO ESTRUTURAL
  // ==========================================
  private auditWav(bytes: Uint8Array, headerTag: string): BinaryAuditReport {
    const essentialBlocks: RawChunkOrBlock[] = [];
    const removableBlocks: RawChunkOrBlock[] = [];
    const unknownBlocks: RawChunkOrBlock[] = [];
    const detectedSignatures: string[] = [];
    let sunoDetected = false;
    let sunoDetails: string | undefined;

    // Cabeçalho Principal RIFF
    essentialBlocks.push({
      id: headerTag,
      name: `Container RIFF (${headerTag}/WAVE)`,
      offset: 0,
      size: 12,
      type: "HEADER",
      description: "Estrutura básica do container RIFF",
      isRemovable: false,
    });

    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const chunkId = readFourCC(bytes, offset);
      const chunkSize = readUint32LE(bytes, offset + 4);
      const payloadOffset = offset + 8;
      const nextOffset = payloadOffset + chunkSize + (chunkSize % 2);

      // Chunks Essenciais de Áudio
      if (chunkId === "fmt ") {
        essentialBlocks.push({
          id: "fmt ",
          name: "Format Header (fmt )",
          offset,
          size: chunkSize + 8,
          type: "HEADER",
          description: `Cabeçalho de formato PCM (${chunkSize} bytes)`,
          isRemovable: false,
        });
      } else if (chunkId === "data") {
        essentialBlocks.push({
          id: "data",
          name: "Audio Payload Stream (data)",
          offset,
          size: chunkSize + 8,
          type: "AUDIO_STREAM",
          description: `Fluxo de áudio real (${chunkSize} bytes)`,
          isRemovable: false,
        });
      } else if (chunkId === "ds64") {
        essentialBlocks.push({
          id: "ds64",
          name: "RF64 64-bit Data Size (ds64)",
          offset,
          size: chunkSize + 8,
          type: "HEADER",
          description: "Estrutura necessária para arquivos > 4GB",
          isRemovable: false,
        });
      } else if (chunkId === "fact") {
        // Chunk fact é estrutural padrão em WAVs com codecs especiais/float
        essentialBlocks.push({
          id: "fact",
          name: "Sample Count (fact)",
          offset,
          size: chunkSize + 8,
          type: "HEADER",
          description: "Contagem de amostras",
          isRemovable: false,
        });
      }
      // Chunks de Metadados / Opcionais / Removíveis Conhecidos
      else if (chunkId === "LIST") {
        const listType = payloadOffset + 4 <= bytes.length ? readFourCC(bytes, payloadOffset) : "UNKNOWN";
        removableBlocks.push({
          id: "LIST",
          name: `RIFF LIST (${listType})`,
          offset,
          size: chunkSize + 8,
          type: "METADATA",
          description: `Bloco LIST do tipo ${listType}`,
          isRemovable: true,
        });

        // Inspecionar sub-chunks se for LIST/INFO
        if (listType === "INFO") {
          let subOff = payloadOffset + 4;
          const subEndLimit = Math.min(payloadOffset + chunkSize, bytes.length);
          while (subOff + 8 <= subEndLimit) {
            const subId = readFourCC(bytes, subOff);
            const subSize = readUint32LE(bytes, subOff + 4);
            const subPayloadOff = subOff + 8;
            const subEnd = Math.min(subPayloadOff + subSize, subEndLimit);

            if (subEnd > subPayloadOff) {
              const subBytes = bytes.subarray(subPayloadOff, subEnd);
              const textVal = decodeAsciiOrUtf8(subBytes);

              detectedSignatures.push(`LIST/INFO [${subId}]: ${textVal}`);

              // Scan Suno Studio & software
              const lower = textVal.toLowerCase();
              if (
                lower.includes("suno") ||
                lower.includes("made with suno") ||
                lower.includes("created=") ||
                lower.includes("project=")
              ) {
                sunoDetected = true;
                sunoDetails = textVal;
              }
            }

            subOff = subPayloadOff + subSize + (subSize % 2);
          }
        }
      } else if (chunkId === "bext") {
        removableBlocks.push({
          id: "bext",
          name: "Broadcast Wave Extension (bext)",
          offset,
          size: chunkSize + 8,
          type: "METADATA",
          description: "Metadados EBU Broadcast Extension",
          isRemovable: true,
        });
      } else if (chunkId === "iXML" || chunkId === "XMP_" || chunkId === "_PMX") {
        removableBlocks.push({
          id: chunkId,
          name: `XML Metadata (${chunkId})`,
          offset,
          size: chunkSize + 8,
          type: "METADATA",
          description: "Bloco de metadados XML de gravação/projeto",
          isRemovable: true,
        });
      } else if (chunkId === "id3 " || chunkId === "ID3 " || chunkId === "ID32") {
        removableBlocks.push({
          id: chunkId,
          name: `ID3 Tag Encapsulada (${chunkId})`,
          offset,
          size: chunkSize + 8,
          type: "METADATA",
          description: "Metadados ID3v2 incorporados no WAV",
          isRemovable: true,
        });
      } else if (chunkId === "cart") {
        removableBlocks.push({
          id: "cart",
          name: "Broadcast Cart Metadata (cart)",
          offset,
          size: chunkSize + 8,
          type: "METADATA",
          description: "Metadados de automação de rádio",
          isRemovable: true,
        });
      } else if (chunkId === "DISP") {
        removableBlocks.push({
          id: "DISP",
          name: "Display Title Chunk (DISP)",
          offset,
          size: chunkSize + 8,
          type: "METADATA",
          description: "Objeto de título gráfico/display",
          isRemovable: true,
        });
      } else if (
        chunkId === "JUNK" ||
        chunkId === "PAD " ||
        chunkId === "FLLR" ||
        chunkId === "junk"
      ) {
        removableBlocks.push({
          id: chunkId,
          name: `Padding / Junk (${chunkId})`,
          offset,
          size: chunkSize + 8,
          type: "PADDING",
          description: "Padding de alinhamento de arquivo",
          isRemovable: true,
        });
      } else if (
        chunkId === "cue " ||
        chunkId === "plst" ||
        chunkId === "labl" ||
        chunkId === "note" ||
        chunkId === "ltxt" ||
        chunkId === "smpl" ||
        chunkId === "inst" ||
        chunkId === "acid"
      ) {
        removableBlocks.push({
          id: chunkId,
          name: `Studio Cue / Marker (${chunkId})`,
          offset,
          size: chunkSize + 8,
          type: "EXTRA",
          description: "Marcadores de edição e sample points",
          isRemovable: true,
        });
      } else {
        // Chunk desconhecido — NÃO afirmar limpo até classificar
        unknownBlocks.push({
          id: chunkId,
          name: `BLOCO DESCONHECIDO [${chunkId}]`,
          offset,
          size: chunkSize + 8,
          type: "UNKNOWN",
          description: `Chunk binário não catalogado no offset ${offset} (${chunkSize} bytes) — REQUER CLASSIFICAÇÃO`,
          isRemovable: true,
        });
      }

      offset = nextOffset;
    }

    // Busca textual profunda em busca de rastros de IA e softwares conhecidos
    const fullTextScan = this.scanDeepStrings(bytes);
    if (fullTextScan.sunoDetected) {
      sunoDetected = true;
      if (!sunoDetails) sunoDetails = fullTextScan.sunoDetails;
    }
    if (fullTextScan.detectedSignatures.length > 0) {
      detectedSignatures.push(...fullTextScan.detectedSignatures);
    }

    return {
      format: "WAV",
      essentialBlocks,
      removableBlocks,
      unknownBlocks,
      detectedSignatures,
      sunoDetected,
      sunoDetails,
      isPureClean: removableBlocks.length === 0 && unknownBlocks.length === 0 && !sunoDetected,
    };
  }

  // ==========================================
  // MP3 AUDITOR BINÁRIO ESTRUTURAL
  // ==========================================
  private auditMp3(bytes: Uint8Array): BinaryAuditReport {
    const essentialBlocks: RawChunkOrBlock[] = [];
    const removableBlocks: RawChunkOrBlock[] = [];
    const unknownBlocks: RawChunkOrBlock[] = [];
    const detectedSignatures: string[] = [];
    let sunoDetected = false;
    let sunoDetails: string | undefined;

    let audioStartOffset = 0;
    let audioEndOffset = bytes.length;

    // 1. Inspecionar Cabeçalho ID3v2 no início do arquivo
    if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const versionMajor = bytes[3];
      const versionMinor = bytes[4];
      const flags = bytes[5];
      const sync0 = bytes[6] & 0x7f;
      const sync1 = bytes[7] & 0x7f;
      const sync2 = bytes[8] & 0x7f;
      const sync3 = bytes[9] & 0x7f;
      const tagBodySize = (sync0 << 21) | (sync1 << 14) | (sync2 << 7) | sync3;
      const hasFooter = (flags & 0x10) !== 0;
      const totalId3Size = 10 + tagBodySize + (hasFooter ? 10 : 0);

      removableBlocks.push({
        id: "ID3v2",
        name: `ID3v2.${versionMajor}.${versionMinor} Tag Header`,
        offset: 0,
        size: totalId3Size,
        type: "METADATA",
        description: `Tag de metadados ID3v2 (${totalId3Size} bytes)`,
        isRemovable: true,
      });

      audioStartOffset = totalId3Size;

      // Scan de frames internos do ID3v2
      const id3Bytes = bytes.subarray(10, Math.min(totalId3Size, bytes.length));
      const id3Scan = this.scanDeepStrings(id3Bytes);
      if (id3Scan.sunoDetected) {
        sunoDetected = true;
        sunoDetails = id3Scan.sunoDetails;
      }
      detectedSignatures.push(...id3Scan.detectedSignatures);
    }

    // 2. Inspecionar ID3v1 no final (últimos 128 bytes)
    if (bytes.length >= 128) {
      const v1Offset = bytes.length - 128;
      if (bytes[v1Offset] === 0x54 && bytes[v1Offset + 1] === 0x41 && bytes[v1Offset + 2] === 0x47) {
        removableBlocks.push({
          id: "ID3v1",
          name: "ID3v1 Tag Footer",
          offset: v1Offset,
          size: 128,
          type: "METADATA",
          description: "Tag legado ID3v1 nos últimos 128 bytes",
          isRemovable: true,
        });
        audioEndOffset = Math.min(audioEndOffset, v1Offset);
      }
    }

    // 3. Inspecionar APEv2 Footer
    if (bytes.length >= 32) {
      const apeOffset = bytes.length - 32;
      const apeSig = readFourCC(bytes, apeOffset);
      if (apeSig === "APET") {
        removableBlocks.push({
          id: "APEv2",
          name: "APEv2 Tag Footer",
          offset: apeOffset,
          size: 32,
          type: "METADATA",
          description: "Tag APEv2 encontrada no final do arquivo",
          isRemovable: true,
        });
        audioEndOffset = Math.min(audioEndOffset, apeOffset);
      }
    }

    // 4. Inspecionar Lyrics3 tag
    if (bytes.length >= 150) {
      const lastBytes = decodeAsciiOrUtf8(bytes.subarray(bytes.length - 160));
      if (lastBytes.includes("LYRICSBEGIN") || lastBytes.includes("LYRICS200")) {
        removableBlocks.push({
          id: "Lyrics3",
          name: "Lyrics3 Embedded Tag",
          offset: bytes.length - 160,
          size: 160,
          type: "METADATA",
          description: "Letras encapsuladas no padrão Lyrics3",
          isRemovable: true,
        });
      }
    }

    // 5. Inspecionar Fluxo de Áudio MPEG (MPEG Sync Frames)
    let firstMpegOffset = -1;
    for (let i = audioStartOffset; i < Math.min(bytes.length - 1, audioStartOffset + 8192); i++) {
      if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0) {
        firstMpegOffset = i;
        break;
      }
    }

    if (firstMpegOffset !== -1) {
      const audioSize = Math.max(0, audioEndOffset - firstMpegOffset);
      essentialBlocks.push({
        id: "MPEG_AUDIO",
        name: "MPEG Audio Stream (Frames)",
        offset: firstMpegOffset,
        size: audioSize,
        type: "AUDIO_STREAM",
        description: `Stream de áudio MPEG comprimido (${audioSize} bytes)`,
        isRemovable: false,
      });

      // Inspecionar se o primeiro frame tem cabeçalho Xing/Info/LAME/VBRI
      const frameSlice = bytes.subarray(firstMpegOffset, Math.min(firstMpegOffset + 256, bytes.length));
      const frameStr = decodeAsciiOrUtf8(frameSlice);
      if (frameStr.includes("Xing") || frameStr.includes("Info") || frameStr.includes("VBRI")) {
        essentialBlocks.push({
          id: "VBR_HEADER",
          name: "Xing / Info / VBRI VBR Header",
          offset: firstMpegOffset,
          size: 156,
          type: "HEADER",
          description: "Cabeçalho de índice de busca VBR e contagem de frames",
          isRemovable: false,
        });
      }
    } else {
      unknownBlocks.push({
        id: "INVALID_STREAM",
        name: "Fluxo de Áudio Não Sincronizado",
        offset: 0,
        size: bytes.length,
        type: "UNKNOWN",
        description: "Nenhum frame MPEG sync (0xFFE) encontrado no arquivo",
        isRemovable: false,
      });
    }

    return {
      format: "MP3",
      essentialBlocks,
      removableBlocks,
      unknownBlocks,
      detectedSignatures,
      sunoDetected,
      sunoDetails,
      isPureClean: removableBlocks.length === 0 && unknownBlocks.length === 0 && !sunoDetected,
    };
  }

  // ==========================================
  // FLAC AUDITOR BINÁRIO ESTRUTURAL
  // ==========================================
  private auditFlac(bytes: Uint8Array): BinaryAuditReport {
    const essentialBlocks: RawChunkOrBlock[] = [];
    const removableBlocks: RawChunkOrBlock[] = [];
    const unknownBlocks: RawChunkOrBlock[] = [];
    const detectedSignatures: string[] = [];
    let sunoDetected = false;
    let sunoDetails: string | undefined;

    essentialBlocks.push({
      id: "fLaC",
      name: "FLAC Magic Signature",
      offset: 0,
      size: 4,
      type: "HEADER",
      description: "Assinatura do arquivo FLAC",
      isRemovable: false,
    });

    let offset = 4;
    let isLast = false;

    while (offset + 4 <= bytes.length && !isLast) {
      const headerByte = bytes[offset];
      isLast = (headerByte & 0x80) !== 0;
      const blockType = headerByte & 0x7f;
      const blockSize = (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
      const payloadOffset = offset + 4;

      if (blockType === 0) {
        // STREAMINFO
        essentialBlocks.push({
          id: "STREAMINFO",
          name: "FLAC Stream Info",
          offset,
          size: blockSize + 4,
          type: "HEADER",
          description: "Informações essenciais de taxa de amostragem e canais",
          isRemovable: false,
        });
      } else if (blockType === 1) {
        // PADDING
        removableBlocks.push({
          id: "PADDING",
          name: "FLAC Padding Block",
          offset,
          size: blockSize + 4,
          type: "PADDING",
          description: "Bloco de padding vazio",
          isRemovable: true,
        });
      } else if (blockType === 4) {
        // VORBIS_COMMENT
        removableBlocks.push({
          id: "VORBIS_COMMENT",
          name: "Vorbis Comment Block",
          offset,
          size: blockSize + 4,
          type: "METADATA",
          description: "Metadados textuais e tags",
          isRemovable: true,
        });
        const commentBytes = bytes.subarray(payloadOffset, Math.min(payloadOffset + blockSize, bytes.length));
        const commentScan = this.scanDeepStrings(commentBytes);
        if (commentScan.sunoDetected) {
          sunoDetected = true;
          sunoDetails = commentScan.sunoDetails;
        }
        detectedSignatures.push(...commentScan.detectedSignatures);
      } else if (blockType === 6) {
        // PICTURE
        removableBlocks.push({
          id: "PICTURE",
          name: "FLAC Picture Block",
          offset,
          size: blockSize + 4,
          type: "METADATA",
          description: "Capa do álbum / Artwork embutida",
          isRemovable: true,
        });
      } else if (blockType === 3) {
        // SEEKTABLE
        essentialBlocks.push({
          id: "SEEKTABLE",
          name: "FLAC Seek Table",
          offset,
          size: blockSize + 4,
          type: "HEADER",
          description: "Tabela de indexação de busca rápida",
          isRemovable: false,
        });
      } else {
        removableBlocks.push({
          id: `BLOCK_${blockType}`,
          name: `FLAC Metadata Block (Tipo ${blockType})`,
          offset,
          size: blockSize + 4,
          type: "METADATA",
          description: `Bloco opcional tipo ${blockType}`,
          isRemovable: true,
        });
      }

      offset = payloadOffset + blockSize;
    }

    if (offset < bytes.length) {
      essentialBlocks.push({
        id: "FLAC_FRAMES",
        name: "FLAC Audio Frames Stream",
        offset,
        size: bytes.length - offset,
        type: "AUDIO_STREAM",
        description: "Fluxo de áudio comprimido sem perdas",
        isRemovable: false,
      });
    }

    return {
      format: "FLAC",
      essentialBlocks,
      removableBlocks,
      unknownBlocks,
      detectedSignatures,
      sunoDetected,
      sunoDetails,
      isPureClean: removableBlocks.length === 0 && unknownBlocks.length === 0 && !sunoDetected,
    };
  }

  // ==========================================
  // OGG / OPUS AUDITOR BINÁRIO ESTRUTURAL
  // ==========================================
  private auditOgg(bytes: Uint8Array): BinaryAuditReport {
    const essentialBlocks: RawChunkOrBlock[] = [];
    const removableBlocks: RawChunkOrBlock[] = [];
    const unknownBlocks: RawChunkOrBlock[] = [];
    const detectedSignatures: string[] = [];
    let sunoDetected = false;
    let sunoDetails: string | undefined;

    let offset = 0;
    let pageCount = 0;

    while (offset + 27 <= bytes.length) {
      const sig = readFourCC(bytes, offset);
      if (sig !== "OggS") break;

      const pageSegCount = bytes[offset + 26];
      let segTableSize = 0;
      if (offset + 27 + pageSegCount <= bytes.length) {
        for (let i = 0; i < pageSegCount; i++) {
          segTableSize += bytes[offset + 27 + i];
        }
      }
      const totalPageSize = 27 + pageSegCount + segTableSize;
      const pagePayloadOffset = offset + 27 + pageSegCount;
      const pagePayloadBytes = bytes.subarray(pagePayloadOffset, Math.min(pagePayloadOffset + segTableSize, bytes.length));
      const pageStr = decodeAsciiOrUtf8(pagePayloadBytes.subarray(0, 32));

      if (pageCount === 0 || pageStr.includes("vorbis") || pageStr.includes("OpusHead")) {
        essentialBlocks.push({
          id: `OGG_PAGE_${pageCount}`,
          name: `Ogg Header Page (${pageStr.substring(0, 10)})`,
          offset,
          size: totalPageSize,
          type: "HEADER",
          description: "Página de identificação de codec",
          isRemovable: false,
        });
      } else if (pageStr.includes("OpusTags") || pageStr.includes("vorbis\x03") || pageStr.includes("TRACKNUMBER=")) {
        removableBlocks.push({
          id: `OGG_TAGS_${pageCount}`,
          name: "Ogg Vorbis / Opus Comment Page",
          offset,
          size: totalPageSize,
          type: "METADATA",
          description: "Página contendo comentários e tags textuais",
          isRemovable: true,
        });
        const scan = this.scanDeepStrings(pagePayloadBytes);
        if (scan.sunoDetected) {
          sunoDetected = true;
          sunoDetails = scan.sunoDetails;
        }
        detectedSignatures.push(...scan.detectedSignatures);
      } else {
        essentialBlocks.push({
          id: `OGG_AUDIO_PAGE_${pageCount}`,
          name: "Ogg Audio Packet Page",
          offset,
          size: totalPageSize,
          type: "AUDIO_STREAM",
          description: "Página de dados de áudio",
          isRemovable: false,
        });
      }

      pageCount++;
      offset += totalPageSize;
    }

    return {
      format: "OGG",
      essentialBlocks,
      removableBlocks,
      unknownBlocks,
      detectedSignatures,
      sunoDetected,
      sunoDetails,
      isPureClean: removableBlocks.length === 0 && unknownBlocks.length === 0 && !sunoDetected,
    };
  }

  // ==========================================
  // MP4 / M4A AUDITOR BINÁRIO ESTRUTURAL
  // ==========================================
  private auditMp4(bytes: Uint8Array): BinaryAuditReport {
    const essentialBlocks: RawChunkOrBlock[] = [];
    const removableBlocks: RawChunkOrBlock[] = [];
    const unknownBlocks: RawChunkOrBlock[] = [];
    const detectedSignatures: string[] = [];
    let sunoDetected = false;
    let sunoDetails: string | undefined;

    let offset = 0;
    while (offset + 8 <= bytes.length) {
      const atomSize = readUint32BE(bytes, offset);
      const atomType = readFourCC(bytes, offset + 4);
      const effectiveSize = atomSize === 0 ? bytes.length - offset : atomSize === 1 ? readUint32BE(bytes, offset + 8) : atomSize;
      if (effectiveSize <= 0) break;

      if (atomType === "ftyp" || atomType === "moov" || atomType === "mdat") {
        essentialBlocks.push({
          id: atomType,
          name: `MP4 Container Atom (${atomType})`,
          offset,
          size: effectiveSize,
          type: atomType === "mdat" ? "AUDIO_STREAM" : "HEADER",
          description: atomType === "mdat" ? "Fluxo de áudio bruto AAC/ALAC" : "Átomo estrutural MP4",
          isRemovable: false,
        });
      } else if (atomType === "udta" || atomType === "meta" || atomType === "ilst") {
        removableBlocks.push({
          id: atomType,
          name: `MP4 Metadata Atom (${atomType})`,
          offset,
          size: effectiveSize,
          type: "METADATA",
          description: "Átomo de metadados e tags iTunes",
          isRemovable: true,
        });
      } else if (atomType === "free" || atomType === "skip") {
        removableBlocks.push({
          id: atomType,
          name: `MP4 Padding Atom (${atomType})`,
          offset,
          size: effectiveSize,
          type: "PADDING",
          description: "Espaço em branco descartável",
          isRemovable: true,
        });
      } else {
        unknownBlocks.push({
          id: atomType,
          name: `Átomo Extra [${atomType}]`,
          offset,
          size: effectiveSize,
          type: "UNKNOWN",
          description: `Átomo ${atomType} (${effectiveSize} bytes)`,
          isRemovable: true,
        });
      }

      offset += effectiveSize;
    }

    return {
      format: "M4A",
      essentialBlocks,
      removableBlocks,
      unknownBlocks,
      detectedSignatures,
      sunoDetected,
      sunoDetails,
      isPureClean: removableBlocks.length === 0 && unknownBlocks.length === 0 && !sunoDetected,
    };
  }

  // ==========================================
  // AIFF AUDITOR BINÁRIO ESTRUTURAL
  // ==========================================
  private auditAiff(bytes: Uint8Array): BinaryAuditReport {
    const essentialBlocks: RawChunkOrBlock[] = [];
    const removableBlocks: RawChunkOrBlock[] = [];
    const unknownBlocks: RawChunkOrBlock[] = [];
    const detectedSignatures: string[] = [];
    let sunoDetected = false;
    let sunoDetails: string | undefined;

    essentialBlocks.push({
      id: "FORM",
      name: "AIFF FORM Container",
      offset: 0,
      size: 12,
      type: "HEADER",
      description: "Estrutura do container AIFF",
      isRemovable: false,
    });

    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const chunkId = readFourCC(bytes, offset);
      const chunkSize = readUint32BE(bytes, offset + 4);
      const payloadOffset = offset + 8;
      const nextOffset = payloadOffset + chunkSize + (chunkSize % 2);

      if (chunkId === "COMM") {
        essentialBlocks.push({
          id: "COMM",
          name: "Common Chunk (COMM)",
          offset,
          size: chunkSize + 8,
          type: "HEADER",
          description: "Cabeçalho de formato AIFF",
          isRemovable: false,
        });
      } else if (chunkId === "SSND") {
        essentialBlocks.push({
          id: "SSND",
          name: "Sound Data Chunk (SSND)",
          offset,
          size: chunkSize + 8,
          type: "AUDIO_STREAM",
          description: "Fluxo de som PCM linear",
          isRemovable: false,
        });
      } else if (
        chunkId === "NAME" ||
        chunkId === "AUTH" ||
        chunkId === "(c) " ||
        chunkId === "ANNO" ||
        chunkId === "ID3 " ||
        chunkId === "id3 "
      ) {
        removableBlocks.push({
          id: chunkId,
          name: `AIFF Metadata Chunk (${chunkId})`,
          offset,
          size: chunkSize + 8,
          type: "METADATA",
          description: "Metadados textuais e tags",
          isRemovable: true,
        });
      } else {
        unknownBlocks.push({
          id: chunkId,
          name: `AIFF Chunk [${chunkId}]`,
          offset,
          size: chunkSize + 8,
          type: "UNKNOWN",
          description: `Chunk ${chunkId} (${chunkSize} bytes)`,
          isRemovable: true,
        });
      }

      offset = nextOffset;
    }

    return {
      format: "AIFF",
      essentialBlocks,
      removableBlocks,
      unknownBlocks,
      detectedSignatures,
      sunoDetected,
      sunoDetails,
      isPureClean: removableBlocks.length === 0 && unknownBlocks.length === 0 && !sunoDetected,
    };
  }

  // ==========================================
  // BUSCA PROFUNDA DE STRINGS & AI SIGNATURES
  // ==========================================
  private scanDeepStrings(bytes: Uint8Array): {
    sunoDetected: boolean;
    sunoDetails?: string;
    detectedSignatures: string[];
  } {
    const text = decodeAsciiOrUtf8(bytes);
    const detectedSignatures: string[] = [];
    let sunoDetected = false;
    let sunoDetails: string | undefined;

    const lower = text.toLowerCase();

    // Check for Suno signatures
    if (
      lower.includes("suno") ||
      lower.includes("made with suno") ||
      lower.includes("project=") ||
      lower.includes("tempo=")
    ) {
      sunoDetected = true;
      const match = text.match(/made with suno[^\n;\0]+/i) || text.match(/created=[^\n;\0]+/i);
      sunoDetails = match ? match[0] : "Assinatura Suno Studio";
    }

    // Check for encoder / software strings
    const patterns = [
      /Lavf\d+[\.\d]*/gi,
      /LAME\d+[\.\d]*[a-zA-Z]*/gi,
      /encoder[=:\s]+[^\n;\0]{2,40}/gi,
      /software[=:\s]+[^\n;\0]{2,40}/gi,
      /https?:\/\/[^\s\0]{4,60}/gi,
    ];

    for (const pat of patterns) {
      const matches = text.match(pat);
      if (matches) {
        for (const m of matches) {
          if (!detectedSignatures.includes(m)) {
            detectedSignatures.push(m);
          }
        }
      }
    }

    return {
      sunoDetected,
      sunoDetails,
      detectedSignatures,
    };
  }
}

export const binaryStructuralVerifier = new BinaryStructuralVerifier();
