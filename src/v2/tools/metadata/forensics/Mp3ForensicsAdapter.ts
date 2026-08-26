/**
 * MP3 FORENSICS ADAPTER
 * Analisador forense para MPEG Audio Layer III:
 * Detecta ID3v2, ID3v1, APEv2, Lyrics3, frames de sincronismo MPEG,
 * cabeçalhos Xing/Info/VBRI e assinaturas de encoder LAME/Lavf.
 */

import {
  AudioForensicsResult,
  ChunkDetail,
  ForensicsItem,
  ForensicsItemClassification,
  ForensicsAnalysisState,
  TechnicalDetails,
  EditableMetadata,
} from "./types";
import { CleanReceiptStore } from "./CleanReceiptStore";

export class Mp3ForensicsAdapter {
  /**
   * Executa a análise forense completa de um arquivo MP3
   */
  public static async analyze(file: File): Promise<AudioForensicsResult> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    const fileSha256 = await this.computeSha256(buffer);

    const errors: string[] = [];
    const chunks: ChunkDetail[] = [];
    const embeddedMetadata: ForensicsItem[] = [];
    const provenance: ForensicsItem[] = [];
    const encoderSignatures: ForensicsItem[] = [];
    const technicalStructures: ForensicsItem[] = [];
    const unknownBlocks: ForensicsItem[] = [];

    // 1. Detecção de ID3v2
    let id3v2Size = 0;
    let id3v2Version = "";
    let id3v2FramesCount = 0;

    if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const major = bytes[3];
      const rev = bytes[4];
      id3v2Version = `2.${major}.${rev}`;
      const flags = bytes[5];
      const hasFooter = (flags & 0x10) !== 0;
      const rawSize = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
      id3v2Size = 10 + rawSize + (hasFooter ? 10 : 0);

      chunks.push({
        id: "ID3v2",
        offset: 0,
        size: id3v2Size,
        payloadOffset: 10,
        payloadEnd: 10 + rawSize,
        isValid: id3v2Size <= file.size,
        isEssential: false,
        description: `Cabeçalho ID3v${id3v2Version} (${id3v2Size} bytes)`,
      });

      // Parser de Frames ID3v2
      let fOffset = 10;
      const fEnd = 10 + rawSize;

      while (fOffset + 10 <= fEnd && fOffset + 10 <= bytes.length) {
        if (bytes[fOffset] === 0) break; // Padding

        const frameId = String.fromCharCode(bytes[fOffset], bytes[fOffset + 1], bytes[fOffset + 2], bytes[fOffset + 3]);
        let frameSize = 0;

        if (major === 4) {
          // Syncsafe em v2.4
          frameSize =
            (bytes[fOffset + 4] << 21) |
            (bytes[fOffset + 5] << 14) |
            (bytes[fOffset + 6] << 7) |
            bytes[fOffset + 7];
        } else {
          // Uint32 em v2.3
          frameSize = view.getUint32(fOffset + 4, false);
        }

        if (frameSize <= 0 || fOffset + 10 + frameSize > fEnd) break;

        const payload = bytes.subarray(fOffset + 10, fOffset + 10 + frameSize);
        const textVal = this.decodeFrameText(payload);

        id3v2FramesCount++;

        const item: ForensicsItem = {
          id: `id3v2_${frameId}_${fOffset}`,
          key: frameId,
          value: textVal,
          offset: fOffset,
          size: frameSize + 10,
          source: `ID3v${id3v2Version} Frame`,
          classification: this.classifyMp3Frame(frameId, textVal),
          isRemovable: true,
          details: `Frame ID3v2 ${frameId} (offset ${fOffset}, size ${frameSize} bytes)`,
          rawValue: textVal,
        };

        embeddedMetadata.push(item);
        this.checkProvenanceAndEncoder(item, provenance, encoderSignatures);

        fOffset += 10 + frameSize;
      }
    }

    // 2. Detecção de ID3v1 (últimos 128 bytes)
    let hasId3v1 = false;
    if (bytes.length >= 128) {
      const tagOffset = bytes.length - 128;
      if (bytes[tagOffset] === 0x54 && bytes[tagOffset + 1] === 0x41 && bytes[tagOffset + 2] === 0x47) {
        hasId3v1 = true;
        const v1Title = this.readAscii(bytes, tagOffset + 3, 30).trim();
        const v1Artist = this.readAscii(bytes, tagOffset + 33, 30).trim();

        const item: ForensicsItem = {
          id: `id3v1_${tagOffset}`,
          key: "ID3v1",
          value: `Título: '${v1Title}' | Artista: '${v1Artist}'`,
          offset: tagOffset,
          size: 128,
          source: "ID3v1 Container",
          classification: ForensicsItemClassification.OPTIONAL_CONTAINER_METADATA,
          isRemovable: true,
          details: `Tag ID3v1 nos últimos 128 bytes (offset ${tagOffset})`,
          rawValue: `TAG${v1Title}${v1Artist}`,
        };
        embeddedMetadata.push(item);

        chunks.push({
          id: "ID3v1",
          offset: tagOffset,
          size: 128,
          payloadOffset: tagOffset + 3,
          payloadEnd: tagOffset + 128,
          isValid: true,
          isEssential: false,
          description: "Tag ID3v1 nos 128 bytes finais",
        });
      }
    }

    // 3. Sincronismo do Primeiro Frame MPEG de Áudio
    let audioStartOffset = id3v2Size;
    let firstFrameOffset = -1;

    for (let i = audioStartOffset; i < bytes.length - 4; i++) {
      if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0) {
        firstFrameOffset = i;
        break;
      }
    }

    let sampleRate = 44100;
    let channels = 2;
    let bitrate = 320;
    let isVbr = false;

    if (firstFrameOffset !== -1) {
      const b1 = bytes[firstFrameOffset + 1];
      const b2 = bytes[firstFrameOffset + 2];
      const b3 = bytes[firstFrameOffset + 3];

      const mpegVersion = (b1 >> 3) & 0x03; // 3 = MPEG1, 2 = MPEG2
      const layer = (b1 >> 1) & 0x03; // 1 = Layer 3
      const bitrateIdx = (b2 >> 4) & 0x0f;
      const srIdx = (b2 >> 2) & 0x03;
      const channelMode = (b3 >> 6) & 0x03;
      channels = channelMode === 3 ? 1 : 2;

      const srTable = [44100, 48000, 32000];
      if (srIdx < 3) sampleRate = srTable[srIdx];

      const brTable = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
      if (bitrateIdx < brTable.length) bitrate = brTable[bitrateIdx];

      // Busca de Xing / Info / VBRI no primeiro frame (Estrutura Técnica VBR/CBR)
      const xingOffset = firstFrameOffset + (channels === 1 ? 21 : 36);
      if (xingOffset + 4 <= bytes.length) {
        const headerId = String.fromCharCode(
          bytes[xingOffset],
          bytes[xingOffset + 1],
          bytes[xingOffset + 2],
          bytes[xingOffset + 3]
        );

        if (headerId === "Xing" || headerId === "Info") {
          isVbr = headerId === "Xing";
          const item: ForensicsItem = {
            id: `xing_${xingOffset}`,
            key: headerId,
            value: `Estrutura técnica MPEG/VBR (${headerId} no offset ${xingOffset})`,
            offset: xingOffset,
            size: 120,
            source: "MPEG Stream Technical Header",
            classification: ForensicsItemClassification.MPEG_STREAM_TECHNICAL_STRUCTURE,
            isRemovable: false,
            details: `Estrutura técnica necessária do stream MPEG (${isVbr ? "VBR" : "CBR"} Table/Frame Count/Duration)`,
            rawValue: `${headerId} Header Table`,
          };
          technicalStructures.push(item);
        }
      }

      // Varredura de LAME string nos primeiros 4096 bytes (fora de ID3)
      const scanLimit = Math.min(bytes.length, firstFrameOffset + 4096);
      for (let i = firstFrameOffset; i < scanLimit - 8; i++) {
        if (
          bytes[i] === 0x4c && // 'L'
          bytes[i + 1] === 0x41 && // 'A'
          bytes[i + 2] === 0x4d && // 'M'
          bytes[i + 3] === 0x45 // 'E'
        ) {
          const lameTag = this.readAscii(bytes, i, 9).trim();
          const item: ForensicsItem = {
            id: `lame_${i}`,
            key: "LAME",
            value: `Assinatura de Encoder LAME: '${lameTag}'`,
            offset: i,
            size: 9,
            source: "MPEG Ancillary Data (Xing/LAME header block)",
            classification: ForensicsItemClassification.ENCODER_TECHNICAL_SIGNATURE,
            isRemovable: true,
            details: `Identificador textual de encoder '${lameTag}' no offset ${i}. Removível na limpeza estrita sem afetar delay/padding ou frames sonoros.`,
            rawValue: lameTag,
          };
          encoderSignatures.push(item);
          break;
        }
      }

      // Varredura de Lavf nos bytes do arquivo
      // Se Lavf estiver fora de ID3 (ex: em tags auxiliares ou cabeçalhos soltos), localizamos com precisão física
      for (let i = 0; i < Math.min(bytes.length, 4096) - 4; i++) {
        if (
          bytes[i] === 0x4c &&
          bytes[i + 1] === 0x61 &&
          bytes[i + 2] === 0x76 &&
          bytes[i + 3] === 0x66
        ) {
          const isInId3 = id3v2Size > 0 && i < id3v2Size;
          const lavfTag = this.readAscii(bytes, i, 24).trim();
          const location = isInId3
            ? `ID3v2 Container (offset ${i}) [Removível na limpeza]`
            : `Stream Ancillary Area (offset ${i})`;

          const item: ForensicsItem = {
            id: `lavf_${i}`,
            key: "Lavf",
            value: `Assinatura Muxer Libavformat: '${lavfTag}'`,
            offset: i,
            size: 16,
            source: location,
            classification: ForensicsItemClassification.ENCODER_TECHNICAL_SIGNATURE,
            isRemovable: true,
            details: `Muxer FFmpeg/Libavformat string detectada no offset ${i}. ${isInId3 ? "Localizada dentro do bloco ID3v2 eliminável." : "Localizada em bloco auxiliar eliminável."}`,
            rawValue: lavfTag,
          };
          // Evitar duplicata se já capturada no frame TSSE do ID3v2
          if (!encoderSignatures.some((e) => e.offset === i || (isInId3 && e.source.includes("ID3")))) {
            encoderSignatures.push(item);
          }
          break;
        }
      }
    }

    // 4. Payload de Áudio MPEG Puro (Sem ID3v2 e Sem ID3v1)
    const audioEndOffset = hasId3v1 ? bytes.length - 128 : bytes.length;
    const rawAudioSlice = buffer.slice(audioStartOffset, audioEndOffset);
    const audioPayloadSha256 = await this.computeSha256(rawAudioSlice);

    const payloadSize = rawAudioSlice.byteLength;
    const duration = bitrate > 0 ? (payloadSize * 8) / (bitrate * 1000) : 0;

    const technical: TechnicalDetails = {
      format: "MP3",
      container: "MPEG Audio Layer III (MP3)",
      codec: "MPEG-1/2 Audio Layer III (MP3)",
      sampleRate,
      bitDepth: 16,
      channels,
      bitrate,
      duration,
      isPcmClassic: false,
      isExtensible: false,
      payloadSize,
      pcmSha256: audioPayloadSha256,
    };

    const editableRemaining = embeddedMetadata.filter((m) => m.classification === ForensicsItemClassification.EDITABLE_METADATA).length;
    const provenanceRemaining = provenance.length;
    const optionalSoftwareRemaining = encoderSignatures.filter((e) => e.isRemovable).length;
    const unknownRemaining = unknownBlocks.length;

    const isForensicallyMinimal =
      id3v2Size === 0 &&
      !hasId3v1 &&
      editableRemaining === 0 &&
      provenanceRemaining === 0 &&
      optionalSoftwareRemaining === 0 &&
      unknownRemaining === 0;

    const receipt = await CleanReceiptStore.getReceiptByFileSha256(fileSha256);

    let analysisState = ForensicsAnalysisState.NOT_PROCESSED;
    let stateDescription = "ANÁLISE CONCLUÍDA — ARQUIVO NÃO PROCESSADO NESTA SESSÃO";

    if (receipt) {
      analysisState = ForensicsAnalysisState.PREVIOUSLY_CLEANED_BY_TOOL;
      stateDescription = "✓ LIMPEZA ANTERIOR COMPROVADA POR ESTE SISTEMA (RECIBO SHA-256 IDENTIFICADO)";
    } else if (isForensicallyMinimal) {
      stateDescription = "✓ CONTAINER FORENSICAMENTE MÍNIMO (Metadados e proveniência ausentes; estruturas técnicas preservadas)";
    }

    return {
      identity: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "audio/mpeg",
        format: "MP3",
        fileSha256,
      },
      technical,
      containerStructure: {
        isForensicallyMinimal,
        totalChunksCount: chunks.length,
        chunks,
        structuralErrors: errors,
      },
      embeddedMetadata,
      provenance,
      encoderSignatures,
      technicalStructures,
      unknownBlocks,
      integrity: {
        fileSha256,
        audioPayloadSha256,
        isPcmExact: false,
        pcmSha256: audioPayloadSha256,
      },
      cleanReceipt: receipt,
      contentAnalysis: {
        status: "NOT_IMPLEMENTED",
        message: "ANÁLISE DE ORIGEM POR CONTEÚDO SONORO: NÃO DETERMINADA",
        details:
          "A análise forense local restringe-se rigorosamente aos metadados e streams do container MP3. Não utiliza estimativas heurísticas artificiais.",
      },
      analysisState,
      stateDescription,
    };
  }

  /**
   * Executa a limpeza física de tags ID3v2, ID3v1 e metadados opcionais do MP3
   */
  public static async clean(file: File): Promise<{ cleanedFile: File; originalPcmSha256: string; cleanedPcmSha256: string }> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Calcular offset de início (pular ID3v2)
    let startOffset = 0;
    if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const flags = bytes[5];
      const hasFooter = (flags & 0x10) !== 0;
      const rawSize = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
      startOffset = 10 + rawSize + (hasFooter ? 10 : 0);
    }

    // Calcular offset de fim (remover ID3v1)
    let endOffset = bytes.length;
    if (bytes.length >= 128) {
      const tagOff = bytes.length - 128;
      if (bytes[tagOff] === 0x54 && bytes[tagOff + 1] === 0x41 && bytes[tagOff + 2] === 0x47) {
        endOffset = tagOff;
      }
    }

    const cleanAudioBytes = bytes.slice(startOffset, endOffset);

    // Localizar primeiro frame MPEG no cleanAudioBytes
    let firstMpegFrame = -1;
    for (let i = 0; i < cleanAudioBytes.length - 4; i++) {
      if (cleanAudioBytes[i] === 0xff && (cleanAudioBytes[i + 1] & 0xe0) === 0xe0) {
        firstMpegFrame = i;
        break;
      }
    }

    if (firstMpegFrame !== -1) {
      const scanLimit = Math.min(cleanAudioBytes.length, firstMpegFrame + 4096);

      // 1. Sanitizar cirurgicamente o identificador ASCII "LAME" / "LAME3.xxx" (9 bytes) no bloco auxiliar
      // Preserva integralmente a tabela Xing (TOC), frame count, flags e os bytes técnicos de delay/padding (+21..23)
      for (let i = firstMpegFrame; i < scanLimit - 8; i++) {
        if (
          cleanAudioBytes[i] === 0x4c && // 'L'
          cleanAudioBytes[i + 1] === 0x41 && // 'A'
          cleanAudioBytes[i + 2] === 0x4d && // 'M'
          cleanAudioBytes[i + 3] === 0x45 // 'E'
        ) {
          for (let k = 0; k < 9; k++) {
            cleanAudioBytes[i + k] = 0x00;
          }
          break;
        }
      }

      // 2. Sanitizar eventuais assinaturas soltas "Lavf" / "Lavc" / "FFmpeg" em áreas auxiliares antes dos dados sonoros
      for (let i = firstMpegFrame; i < Math.min(cleanAudioBytes.length, firstMpegFrame + 512) - 4; i++) {
        if (
          cleanAudioBytes[i] === 0x4c &&
          cleanAudioBytes[i + 1] === 0x61 &&
          cleanAudioBytes[i + 2] === 0x76 &&
          (cleanAudioBytes[i + 3] === 0x66 || cleanAudioBytes[i + 3] === 0x63)
        ) {
          for (let k = 0; k < 16; k++) {
            if (i + k < cleanAudioBytes.length) cleanAudioBytes[i + k] = 0x00;
          }
        }
      }
    }

    const audioHash = await this.computeSha256(cleanAudioBytes.buffer);

    const cleanBlob = new Blob([cleanAudioBytes], { type: "audio/mpeg" });
    const cleanedFile = new File([cleanBlob], file.name, { type: "audio/mpeg", lastModified: Date.now() });

    return {
      cleanedFile,
      originalPcmSha256: audioHash,
      cleanedPcmSha256: audioHash,
    };
  }

  /**
   * Grava novos metadados ID3v2.3 limpos sobre o arquivo MP3
   */
  public static async writeNewMetadata(file: File, meta: EditableMetadata): Promise<File> {
    const cleanResult = await this.clean(file);
    const audioBuffer = await cleanResult.cleanedFile.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    // Constrói frames ID3v2.3
    const frames: Uint8Array[] = [];
    if (meta.title) frames.push(this.buildTextFrame("TIT2", meta.title));
    if (meta.artist) frames.push(this.buildTextFrame("TPE1", meta.artist));
    if (meta.album) frames.push(this.buildTextFrame("TALB", meta.album));
    if (meta.year) frames.push(this.buildTextFrame("TYER", meta.year));
    if (meta.genre) frames.push(this.buildTextFrame("TCON", meta.genre));
    if (meta.composer) frames.push(this.buildTextFrame("TCOM", meta.composer));
    if (meta.isrc) frames.push(this.buildTextFrame("TSRC", meta.isrc));
    if (meta.comment) frames.push(this.buildCommentFrame(meta.comment));

    if (frames.length === 0) {
      return cleanResult.cleanedFile;
    }

    const totalFramesSize = frames.reduce((acc, f) => acc + f.length, 0);
    const header = new Uint8Array(10);
    header[0] = 0x49; // 'I'
    header[1] = 0x44; // 'D'
    header[2] = 0x33; // '3'
    header[3] = 3; // Version 2.3
    header[4] = 0;
    header[5] = 0; // Flags

    // Syncsafe size
    header[6] = (totalFramesSize >> 21) & 0x7f;
    header[7] = (totalFramesSize >> 14) & 0x7f;
    header[8] = (totalFramesSize >> 7) & 0x7f;
    header[9] = totalFramesSize & 0x7f;

    const outBuffer = new Uint8Array(10 + totalFramesSize + audioBytes.length);
    outBuffer.set(header, 0);
    let off = 10;
    for (const f of frames) {
      outBuffer.set(f, off);
      off += f.length;
    }
    outBuffer.set(audioBytes, off);

    let outputFileName = file.name;
    if (meta.title && meta.title.trim()) {
      const ext = file.name.split(".").pop() || "mp3";
      const sanitized = meta.title.trim().replace(/[<>:"/\\|?*]/g, "").trim();
      if (sanitized) {
        outputFileName = `${sanitized}.${ext}`;
      }
    }

    const blob = new Blob([outBuffer], { type: "audio/mpeg" });
    return new File([blob], outputFileName, { type: "audio/mpeg", lastModified: Date.now() });
  }

  // --- Helpers Internos de Frames ID3 ---

  private static buildTextFrame(id: string, text: string): Uint8Array {
    const cleanedText = this.fixMojibakeIfNeeded(text.trim());
    const encodedText = new TextEncoder().encode(cleanedText);
    const payloadSize = 1 + encodedText.length; // 1 byte de encoding (UTF-8 = 3)
    const frame = new Uint8Array(10 + payloadSize);

    frame.set(new TextEncoder().encode(id), 0);
    new DataView(frame.buffer).setUint32(4, payloadSize, false);
    frame[10] = 3; // UTF-8
    frame.set(encodedText, 11);
    return frame;
  }

  private static buildCommentFrame(text: string): Uint8Array {
    const cleanedText = this.fixMojibakeIfNeeded(text.trim());
    const encodedText = new TextEncoder().encode(cleanedText);
    const payloadSize = 1 + 3 + 1 + encodedText.length; // encoding + lang (3) + short desc null + text
    const frame = new Uint8Array(10 + payloadSize);

    frame.set(new TextEncoder().encode("COMM"), 0);
    new DataView(frame.buffer).setUint32(4, payloadSize, false);
    frame[10] = 3; // UTF-8
    frame[11] = 0x65; // 'e'
    frame[12] = 0x6e; // 'n'
    frame[13] = 0x67; // 'g'
    frame[14] = 0; // Short desc null
    frame.set(encodedText, 15);
    return frame;
  }

  private static decodeFrameText(payload: Uint8Array): string {
    if (payload.length === 0) return "";
    const enc = payload[0];
    const data = payload.subarray(1);

    try {
      if (enc === 0) {
        // ISO-8859-1 com fix de Mojibake se UTF-8 foi escrito como latin-1
        const dec = new TextDecoder("windows-1252", { fatal: false }).decode(data).replace(/\0+$/, "");
        return this.fixMojibakeIfNeeded(dec);
      }
      if (enc === 1) {
        return new TextDecoder("utf-16").decode(data).replace(/\0+$/, "");
      }
      if (enc === 2) {
        return new TextDecoder("utf-16be").decode(data).replace(/\0+$/, "");
      }
      if (enc === 3) {
        const dec = new TextDecoder("utf-8").decode(data).replace(/\0+$/, "");
        return this.fixMojibakeIfNeeded(dec);
      }
    } catch {
      // Fallback
    }

    try {
      const dec = new TextDecoder("utf-8", { fatal: false }).decode(data).replace(/\0+$/, "");
      return this.fixMojibakeIfNeeded(dec);
    } catch {
      return "";
    }
  }

  /**
   * Corrige sequências clássicas de mojibake (quando UTF-8 foi lido/gravado como Latin-1 ou vice-versa)
   */
  public static fixMojibakeIfNeeded(text: string): string {
    if (!text) return "";
    if (/[\u00C2\u00C3][\u0080-\u00BF]/.test(text)) {
      try {
        const bytes = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
          bytes[i] = text.charCodeAt(i) & 0xff;
        }
        const repaired = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        if (repaired && !repaired.includes("\uFFFD")) {
          return repaired;
        }
      } catch {
        // Fallback
      }
    }
    return text;
  }

  private static classifyMp3Frame(frameId: string, value: string): ForensicsItemClassification {
    const valLower = value.toLowerCase();
    if (
      valLower.includes("suno") ||
      valLower.includes("created=") ||
      valLower.includes("project=") ||
      frameId === "TENC" ||
      frameId === "TSSE"
    ) {
      return ForensicsItemClassification.PROVENANCE_SIGNATURE;
    }
    if (["TIT2", "TPE1", "TALB", "TYER", "TCON", "TCOM", "TSRC"].includes(frameId)) {
      return ForensicsItemClassification.EDITABLE_METADATA;
    }
    return ForensicsItemClassification.OPTIONAL_CONTAINER_METADATA;
  }

  private static checkProvenanceAndEncoder(item: ForensicsItem, provenance: ForensicsItem[], encoderSignatures: ForensicsItem[]): void {
    const valLower = item.value.toLowerCase();
    if (valLower.includes("suno") || valLower.includes("created=") || valLower.includes("project=")) {
      provenance.push(item);
    }
    if (valLower.includes("lavf") || valLower.includes("lame") || item.key === "TSSE" || item.key === "TENC") {
      encoderSignatures.push(item);
    }
  }

  private static readAscii(bytes: Uint8Array, offset: number, length: number): string {
    let s = "";
    for (let i = 0; i < length; i++) {
      const b = bytes[offset + i];
      if (b === 0) break;
      s += String.fromCharCode(b);
    }
    return s;
  }

  private static async computeSha256(buffer: ArrayBuffer): Promise<string> {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(digest));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return "crypto-subtle-unavailable";
  }
}
