/**
 * WAV FORENSICS ADAPTER
 * Parser binário linear RIFF rigoroso (byte 12 até EOF), analisador de chunks,
 * detector de proveniência e reconstrutor de container PCM por Whitelist pura.
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

export class WavForensicsAdapter {
  private static readonly PROVENANCE_KEYWORDS = [
    "suno",
    "suno studio",
    "made with suno studio",
    "created=",
    "project=",
    "model=",
    "tempo=",
    "generator",
    "vendor",
    "software",
    "encoder",
    "encoded by",
    "encoding tool",
    "writing application",
    "writing library",
    "origin",
    "originator",
    "source",
    "lavf",
    "lame",
    "ffmpeg",
    "http://",
    "https://",
  ];

  /**
   * Executa a análise forense completa do arquivo WAV
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
    const unknownBlocks: ForensicsItem[] = [];

    // 1. Validação do Cabeçalho RIFF / WAVE (12 bytes iniciais)
    if (file.size < 12) {
      throw new Error("Arquivo WAV corrompido ou truncado: tamanho menor que 12 bytes.");
    }

    const riffId = this.readAscii(bytes, 0, 4);
    if (riffId !== "RIFF" && riffId !== "RIFX" && riffId !== "RF64" && riffId !== "BW64") {
      throw new Error(`Container inválido: assinatura inicial '${riffId}' não é RIFF/RF64/BW64.`);
    }

    const declaredRiffSize = view.getUint32(4, true);
    const waveId = this.readAscii(bytes, 8, 4);
    if (waveId !== "WAVE") {
      throw new Error(`Formato de container inválido: subtipo '${waveId}' não é WAVE.`);
    }

    if (declaredRiffSize + 8 > file.size) {
      errors.push(`RIFF declared size (${declaredRiffSize + 8} bytes) excede o tamanho físico do arquivo (${file.size} bytes).`);
    }

    // 2. Parser linear de Chunks do byte 12 até EOF
    let offset = 12;
    let fmtChunk: { offset: number; size: number } | null = null;
    let dataChunk: { offset: number; size: number } | null = null;

    let audioFormat = 1;
    let channels = 2;
    let sampleRate = 44100;
    let byteRate = 176400;
    let blockAlign = 4;
    let bitsPerSample = 16;
    let isExtensible = false;

    while (offset + 8 <= file.size) {
      const chunkId = this.readAscii(bytes, offset, 4);
      const chunkSize = view.getUint32(offset + 4, true);
      const payloadOffset = offset + 8;
      const payloadEnd = payloadOffset + chunkSize;
      const padding = chunkSize % 2 !== 0 ? 1 : 0;
      const nextOffset = payloadEnd + padding;

      const isValidBounds = payloadEnd <= file.size;
      if (!isValidBounds) {
        errors.push(`Chunk '${chunkId}' no offset ${offset} declara tamanho de ${chunkSize} bytes, ultrapassando o final do arquivo.`);
      }

      const chunkDetail: ChunkDetail = {
        id: chunkId,
        offset,
        size: chunkSize,
        payloadOffset,
        payloadEnd,
        isValid: isValidBounds,
        isEssential: chunkId === "fmt " || chunkId === "data",
        description: this.getChunkDescription(chunkId),
      };

      // Processamento específico de cada Chunk
      if (chunkId === "fmt ") {
        fmtChunk = { offset, size: chunkSize };
        if (chunkSize >= 16 && isValidBounds) {
          audioFormat = view.getUint16(payloadOffset, true);
          channels = view.getUint16(payloadOffset + 2, true);
          sampleRate = view.getUint32(payloadOffset + 4, true);
          byteRate = view.getUint32(payloadOffset + 8, true);
          blockAlign = view.getUint16(payloadOffset + 12, true);
          bitsPerSample = view.getUint16(payloadOffset + 14, true);

          if (audioFormat === 0xfffe || (audioFormat !== 1 && audioFormat !== 3 && chunkSize > 18)) {
            isExtensible = true;
          }
        }
      } else if (chunkId === "fact") {
        // Chunk técnico obrigatório / recomendado para IEEE Float e formatos não-PCM
        chunkDetail.description = "Chunk Técnico 'fact' (Sample count / frame info)";
        chunkDetail.isEssential = true;
      } else if (chunkId === "data") {
        dataChunk = { offset, size: chunkSize };
      } else if (chunkId === "LIST") {
        // Parser de LIST / INFO
        if (isValidBounds && chunkSize >= 4) {
          const listType = this.readAscii(bytes, payloadOffset, 4);
          chunkDetail.description = `LIST Chunk (Tipo: ${listType})`;
          const subChunks: ChunkDetail[] = [];

          if (listType === "INFO") {
            let subOffset = payloadOffset + 4;
            while (subOffset + 8 <= payloadEnd) {
              const subId = this.readAscii(bytes, subOffset, 4);
              const subSize = view.getUint32(subOffset + 4, true);
              const subPayload = subOffset + 8;
              const subPadding = subSize % 2 !== 0 ? 1 : 0;
              const subEnd = subPayload + subSize;

              if (subEnd <= payloadEnd) {
                const textVal = this.readInfoText(bytes, subPayload, subSize).trim();
                const subDetail: ChunkDetail = {
                  id: subId,
                  offset: subOffset,
                  size: subSize,
                  payloadOffset: subPayload,
                  payloadEnd: subEnd,
                  isValid: true,
                  isEssential: false,
                  description: `INFO Sub-tag: ${subId}`,
                  textValue: textVal,
                };
                subChunks.push(subDetail);

                const parsedFields = this.extractDetailedFields(subId, textVal);

                const item: ForensicsItem = {
                  id: `list_info_${subId}_${subOffset}`,
                  key: subId,
                  value: textVal,
                  rawValue: textVal,
                  offset: subOffset,
                  size: subSize + 8,
                  source: "LIST / INFO",
                  classification: this.classifyTextMetadata(subId, textVal),
                  isRemovable: true,
                  details: `Sub-chunk ${subId} no bloco LIST/INFO (offset ${subOffset})`,
                  parsedFields: parsedFields.length > 0 ? parsedFields : undefined,
                };

                embeddedMetadata.push(item);
                this.checkProvenanceAndEncoder(item, provenance, encoderSignatures);
              }
              subOffset = subEnd + subPadding;
            }
          }
          chunkDetail.subChunks = subChunks;
        }
      } else if (chunkId === "bext") {
        // Broadcast Audio Extension
        const originator = isValidBounds && chunkSize >= 32 ? this.readText(bytes, payloadOffset, 32).trim() : "";
        const item: ForensicsItem = {
          id: `bext_${offset}`,
          key: "BEXT",
          value: originator ? `Broadcast Wave Extension (Originator: ${originator})` : "Broadcast Wave Extension Block",
          offset,
          size: chunkSize + 8,
          source: "bext Chunk",
          classification: ForensicsItemClassification.PROVENANCE_SIGNATURE,
          isRemovable: true,
          details: `Metadados de emissão BWF (offset ${offset})`,
        };
        provenance.push(item);
        embeddedMetadata.push(item);
      } else if (
        chunkId === "iXML" ||
        chunkId === "XMP " ||
        chunkId === "id3 " ||
        chunkId === "ID3 " ||
        chunkId === "axml" ||
        chunkId === "_axm"
      ) {
        const textVal = isValidBounds ? this.readText(bytes, payloadOffset, Math.min(chunkSize, 512)).trim() : "";
        const item: ForensicsItem = {
          id: `${chunkId.trim().toLowerCase()}_${offset}`,
          key: chunkId.trim(),
          value: textVal || `Bloco de Metadados XML/ID3/AXML (${chunkSize} bytes)`,
          offset,
          size: chunkSize + 8,
          source: `${chunkId} Chunk`,
          classification: ForensicsItemClassification.OPTIONAL_CONTAINER_METADATA,
          isRemovable: true,
          details: `Metadados embutidos em ${chunkId} (offset ${offset})`,
        };
        embeddedMetadata.push(item);
        this.checkProvenanceAndEncoder(item, provenance, encoderSignatures);
      } else if (chunkId === "cart") {
        const title = isValidBounds && chunkSize >= 64 ? this.readText(bytes, payloadOffset, 64).trim() : "";
        const item: ForensicsItem = {
          id: `cart_${offset}`,
          key: "cart",
          value: title ? `Cart Chunk Automação Rádio (${title})` : `Cart Chunk Automação Rádio (${chunkSize} bytes)`,
          offset,
          size: chunkSize + 8,
          source: "cart Chunk",
          classification: ForensicsItemClassification.OPTIONAL_CONTAINER_METADATA,
          isRemovable: true,
          details: `Metadados de automação de rádio cartChunk (offset ${offset})`,
        };
        embeddedMetadata.push(item);
      } else if (chunkId === "DISP" || chunkId === "cue " || chunkId === "smpl" || chunkId === "PEAK") {
        const item: ForensicsItem = {
          id: `${chunkId.trim().toLowerCase()}_${offset}`,
          key: chunkId.trim(),
          value: `${this.getChunkDescription(chunkId)} (${chunkSize} bytes)`,
          offset,
          size: chunkSize + 8,
          source: `${chunkId} Chunk`,
          classification: ForensicsItemClassification.OPTIONAL_CONTAINER_METADATA,
          isRemovable: true,
          details: `Chunk auxiliar/opcional '${chunkId}' no offset ${offset}`,
        };
        embeddedMetadata.push(item);
      } else if (chunkId === "JUNK" || chunkId === "PAD ") {
        const item: ForensicsItem = {
          id: `junk_${offset}`,
          key: chunkId,
          value: `Padding/Junk Space (${chunkSize} bytes)`,
          offset,
          size: chunkSize + 8,
          source: "Container Padding",
          classification: ForensicsItemClassification.OPTIONAL_CONTAINER_METADATA,
          isRemovable: true,
          details: `Bloco de preenchimento inútil (offset ${offset})`,
        };
        embeddedMetadata.push(item);
      } else {
        // Chunk Desconhecido
        const item: ForensicsItem = {
          id: `unknown_${chunkId}_${offset}`,
          key: chunkId,
          value: `Chunk Desconhecido '${chunkId}' (${chunkSize} bytes)`,
          offset,
          size: chunkSize + 8,
          source: "RIFF Chunk Não Reconhecido",
          classification: ForensicsItemClassification.UNKNOWN_BLOCK,
          isRemovable: true,
          details: `Bloco não essencial com FourCC '${chunkId}' no offset ${offset}`,
        };
        unknownBlocks.push(item);
      }

      chunks.push(chunkDetail);
      offset = nextOffset;
    }

    // 3. Extração do Payload de Áudio PCM e Cálculo de Hash
    let pcmSha256 = "";
    let payloadSize = 0;
    if (dataChunk && dataChunk.size > 0) {
      const dataPayloadOffset = dataChunk.offset + 8;
      const dataPayloadEnd = Math.min(dataPayloadOffset + dataChunk.size, buffer.byteLength);
      if (dataPayloadEnd > dataPayloadOffset) {
        const pcmSlice = buffer.slice(dataPayloadOffset, dataPayloadEnd);
        payloadSize = pcmSlice.byteLength;
        pcmSha256 = await this.computeSha256(pcmSlice);
      }
    }

    const duration = byteRate > 0 && payloadSize > 0 ? payloadSize / byteRate : 0;
    const bitrate = Math.round((sampleRate * bitsPerSample * channels) / 1000);

    const technical: TechnicalDetails = {
      format: "WAV",
      container: "RIFF Waveform Audio (WAV)",
      codec:
        audioFormat === 1
          ? "PCM Linear (Uncompressed)"
          : audioFormat === 3
          ? "IEEE 754 32-bit Floating Point (WAVE_FORMAT_IEEE_FLOAT)"
          : isExtensible
          ? "WAVE_FORMAT_EXTENSIBLE"
          : `WAV Format Code 0x${audioFormat.toString(16)}`,
      sampleRate,
      bitDepth: bitsPerSample,
      channels,
      bitrate,
      duration,
      byteRate,
      blockAlign,
      audioFormatCode: audioFormat,
      isPcmClassic: audioFormat === 1 && (fmtChunk?.size === 16 || fmtChunk?.size === 18) && !isExtensible,
      isExtensible,
      payloadSize,
      pcmSha256,
    };

    // 4. Verificação de Container Mínimo Forense
    // O container é forensicamente mínimo se e somente se contiver estritamente fmt, data e opcionalmente fact
    const isForensicallyMinimal =
      chunks.length >= 2 &&
      chunks.every((c) => c.id === "fmt " || c.id === "data" || c.id === "fact") &&
      chunks.some((c) => c.id === "fmt ") &&
      chunks.some((c) => c.id === "data") &&
      embeddedMetadata.length === 0 &&
      provenance.length === 0 &&
      unknownBlocks.length === 0;

    // 5. Consulta ao CleanReceiptStore
    const receipt = await CleanReceiptStore.getReceiptByFileSha256(fileSha256);

    let analysisState = ForensicsAnalysisState.NOT_PROCESSED;
    let stateDescription = "ANÁLISE CONCLUÍDA — ARQUIVO NÃO PROCESSADO NESTA SESSÃO";

    if (receipt) {
      analysisState = ForensicsAnalysisState.PREVIOUSLY_CLEANED_BY_TOOL;
      stateDescription = "✓ LIMPEZA ANTERIOR COMPROVADA POR ESTE SISTEMA (RECIBO SHA-256 IDENTIFICADO)";
    } else if (isForensicallyMinimal) {
      stateDescription = "CONTAINER FORENSICAMENTE MÍNIMO (fmt + data). Não existe registro de que este arquivo tenha sido limpo por esta ferramenta.";
    }

    return {
      identity: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "audio/wav",
        format: "WAV",
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
      unknownBlocks,
      integrity: {
        fileSha256,
        audioPayloadSha256: pcmSha256,
        isPcmExact: true,
        pcmSha256,
      },
      cleanReceipt: receipt,
      contentAnalysis: {
        status: "NOT_IMPLEMENTED",
        message: "ANÁLISE DE ORIGEM POR CONTEÚDO SONORO: NÃO DETERMINADA",
        details:
          "A análise forense local restringe-se rigorosamente à integridade dos bytes do arquivo e estrutura de metadados. A classificação acústica de IA requer modelos neurais espectrais externos.",
      },
      analysisState,
      stateDescription,
    };
  }

  /**
   * Executa a reconstrução física por Whitelist pura para WAV (PCM linear 0x0001 e IEEE Float 0x0003)
   */
  public static async clean(file: File): Promise<{ cleanedFile: File; originalPcmSha256: string; cleanedPcmSha256: string }> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    if (file.size < 44) {
      throw new Error("Arquivo muito pequeno para ser um WAV válido.");
    }

    // Localizar chunks técnicos essenciais
    let offset = 12;
    let fmtPayload: Uint8Array | null = null;
    let fmtDeclaredSize = 16;
    let factChunkBytes: Uint8Array | null = null;
    let dataPayload: Uint8Array | null = null;
    let audioFormat = 1;
    let isExtensible = false;

    while (offset + 8 <= file.size) {
      const chunkId = this.readAscii(bytes, offset, 4);
      const chunkSize = view.getUint32(offset + 4, true);
      const payloadOffset = offset + 8;
      const padding = chunkSize % 2 !== 0 ? 1 : 0;

      if (chunkId === "fmt ") {
        audioFormat = view.getUint16(payloadOffset, true);
        fmtDeclaredSize = chunkSize;
        if (audioFormat === 0xfffe || (audioFormat !== 1 && audioFormat !== 3 && chunkSize > 18)) {
          isExtensible = true;
        }
        // Copiar o payload fmt COMPLETO verbatim respeitando seu tamanho real
        fmtPayload = bytes.slice(payloadOffset, payloadOffset + chunkSize);
      } else if (chunkId === "fact") {
        // Preservar chunk fact para IEEE Float e formatos não-PCM
        const factTotalLength = 8 + chunkSize + padding;
        factChunkBytes = bytes.slice(offset, offset + factTotalLength);
      } else if (chunkId === "data") {
        dataPayload = bytes.slice(payloadOffset, payloadOffset + chunkSize);
      }

      offset = payloadOffset + chunkSize + padding;
    }

    if (!fmtPayload || fmtPayload.length < 16) {
      throw new Error("Bloco 'fmt ' essencial ausente ou corrompido.");
    }

    if (!dataPayload || dataPayload.length === 0) {
      throw new Error("Bloco 'data' essencial com amostras de áudio ausente ou vazio.");
    }

    // Suporte rigoroso: PCM clássico (AudioFormat 1) e IEEE Float (AudioFormat 3)
    if ((audioFormat !== 1 && audioFormat !== 3) || isExtensible) {
      throw new Error(
        `O formato do áudio (Code: 0x${audioFormat.toString(16)}) requer adapter especializado e não deve ser reconstruído arbitrariamente.`
      );
    }

    // Hashes de integridade do Payload de Áudio Original
    const originalPcmSha256 = await this.computeViewSha256(dataPayload);

    // Reconstrução Whitelist Pura:
    // Header RIFF (12) + fmt Chunk (8 + fmtDeclaredSize + fmtPad) + [fact Chunk se houver] + data Chunk (8 + dataSize)
    const fmtPad = fmtPayload.length % 2 !== 0 ? 1 : 0;
    const fmtChunkTotalSize = 8 + fmtPayload.length + fmtPad;
    const factSize = factChunkBytes ? factChunkBytes.length : 0;
    const dataSize = dataPayload.length;
    const totalFileSize = 12 + fmtChunkTotalSize + factSize + 8 + dataSize;

    const cleanBuffer = new ArrayBuffer(totalFileSize);
    const cleanView = new DataView(cleanBuffer);
    const cleanBytes = new Uint8Array(cleanBuffer);

    // 1. RIFF Header
    cleanBytes.set([0x52, 0x49, 0x46, 0x46], 0); // 'RIFF'
    cleanView.setUint32(4, totalFileSize - 8, true); // Declared Size
    cleanBytes.set([0x57, 0x41, 0x56, 0x45], 8); // 'WAVE'

    // 2. fmt Chunk (Verbatim)
    let writeOffset = 12;
    cleanBytes.set([0x66, 0x6d, 0x74, 0x20], writeOffset); // 'fmt '
    cleanView.setUint32(writeOffset + 4, fmtPayload.length, true);
    cleanBytes.set(fmtPayload, writeOffset + 8);
    if (fmtPad > 0) {
      cleanBytes[writeOffset + 8 + fmtPayload.length] = 0;
    }
    writeOffset += fmtChunkTotalSize;

    // 3. fact Chunk (se existir, preservado verbatim)
    if (factChunkBytes) {
      cleanBytes.set(factChunkBytes, writeOffset);
      writeOffset += factChunkBytes.length;
    }

    // 4. data Chunk (Payload de Áudio Original Verbatim)
    const dataHeaderOffset = writeOffset;
    cleanBytes.set([0x64, 0x61, 0x74, 0x61], dataHeaderOffset); // 'data'
    cleanView.setUint32(dataHeaderOffset + 4, dataSize, true);
    const dataPayloadStart = dataHeaderOffset + 8;
    cleanBytes.set(dataPayload, dataPayloadStart);

    // Validação matemática do payload gerado (usando estritamente a view exata de bytes de áudio)
    const cleanedPcmPayload = cleanBytes.subarray(dataPayloadStart, dataPayloadStart + dataSize);
    const cleanedPcmSha256 = await this.computeViewSha256(cleanedPcmPayload);

    if (originalPcmSha256 !== cleanedPcmSha256) {
      throw new Error("Falha crítica de integridade: O hash do áudio reconstruído divergiu do original.");
    }

    const cleanBlob = new Blob([cleanBuffer], { type: "audio/wav" });
    const cleanedFile = new File([cleanBlob], file.name, { type: "audio/wav", lastModified: Date.now() });

    return {
      cleanedFile,
      originalPcmSha256,
      cleanedPcmSha256,
    };
  }

  /**
   * Grava novos metadados limpos fornecidos pelo usuário em LIST/INFO sobre o arquivo limpo
   */
  public static async writeNewMetadata(file: File, meta: EditableMetadata): Promise<File> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    // Extrair parâmetros do fmt, fact (se houver) e payload do data
    let fmtBytes: Uint8Array | null = null;
    let factBytes: Uint8Array | null = null;
    let dataBytes: Uint8Array | null = null;

    let offset = 12;
    while (offset + 8 <= file.size) {
      const chunkId = this.readAscii(bytes, offset, 4);
      const chunkSize = view.getUint32(offset + 4, true);
      const payloadOffset = offset + 8;
      const padding = chunkSize % 2 !== 0 ? 1 : 0;

      if (chunkId === "fmt ") {
        fmtBytes = bytes.slice(payloadOffset, payloadOffset + chunkSize);
      } else if (chunkId === "fact") {
        factBytes = bytes.slice(offset, offset + 8 + chunkSize + padding);
      } else if (chunkId === "data") {
        dataBytes = bytes.slice(payloadOffset, payloadOffset + chunkSize);
      }
      offset = payloadOffset + chunkSize + padding;
    }

    if (!fmtBytes || !dataBytes) {
      throw new Error("Estrutura WAV inválida para gravação de novos metadados.");
    }

    // Criar subchunks INFO
    const infoEntries: { id: string; text: string }[] = [];
    if (meta.title) infoEntries.push({ id: "INAM", text: meta.title.trim() });
    if (meta.artist) infoEntries.push({ id: "IART", text: meta.artist.trim() });
    if (meta.album) infoEntries.push({ id: "IPRD", text: meta.album.trim() });
    if (meta.year) infoEntries.push({ id: "ICRD", text: meta.year.trim() });
    if (meta.genre) infoEntries.push({ id: "IGNR", text: meta.genre.trim() });
    if (meta.composer) infoEntries.push({ id: "IENG", text: meta.composer.trim() });
    if (meta.isrc) infoEntries.push({ id: "ISRC", text: meta.isrc.trim() });
    if (meta.trackNumber) infoEntries.push({ id: "ITRK", text: meta.trackNumber.trim() });
    if (meta.copyright) infoEntries.push({ id: "ICOP", text: meta.copyright.trim() });
    if (meta.comment) infoEntries.push({ id: "ICMT", text: meta.comment.trim() });

    let listChunkBytes: Uint8Array | null = null;
    if (infoEntries.length > 0) {
      const parts: Uint8Array[] = [];
      parts.push(this.encodeAscii("INFO"));

      for (const entry of infoEntries) {
        const textPayload = this.encodeWindows1252(entry.text);
        // String terminada em NUL (0x00)
        const textBuf = new Uint8Array(textPayload.length + 1);
        textBuf.set(textPayload, 0);
        textBuf[textPayload.length] = 0x00;

        const entrySize = textBuf.length;
        const entryPad = entrySize % 2 !== 0 ? 1 : 0;

        const header = new Uint8Array(8);
        header.set(this.encodeAscii(entry.id), 0);
        new DataView(header.buffer).setUint32(4, entrySize, true);
        parts.push(header);
        parts.push(textBuf);
        if (entryPad > 0) parts.push(new Uint8Array([0]));
      }

      const listPayloadSize = parts.reduce((acc, p) => acc + p.length, 0);
      const listHeader = new Uint8Array(8);
      listHeader.set(this.encodeAscii("LIST"), 0);
      new DataView(listHeader.buffer).setUint32(4, listPayloadSize, true);

      const totalListChunk = new Uint8Array(8 + listPayloadSize);
      totalListChunk.set(listHeader, 0);
      let listOff = 8;
      for (const p of parts) {
        totalListChunk.set(p, listOff);
        listOff += p.length;
      }
      listChunkBytes = totalListChunk;
    }

    const fmtPad = fmtBytes.length % 2 !== 0 ? 1 : 0;
    const fmtTotal = 8 + fmtBytes.length + fmtPad;
    const factTotal = factBytes ? factBytes.length : 0;
    const dataSize = dataBytes.length;
    const listSize = listChunkBytes ? listChunkBytes.length : 0;
    const totalFileSize = 12 + fmtTotal + factTotal + (8 + dataSize) + listSize;

    const outBuffer = new ArrayBuffer(totalFileSize);
    const outView = new DataView(outBuffer);
    const outBytes = new Uint8Array(outBuffer);

    // RIFF Header
    outBytes.set([0x52, 0x49, 0x46, 0x46], 0);
    outView.setUint32(4, totalFileSize - 8, true);
    outBytes.set([0x57, 0x41, 0x56, 0x45], 8);

    // fmt Chunk
    let writeOffset = 12;
    outBytes.set([0x66, 0x6d, 0x74, 0x20], writeOffset);
    outView.setUint32(writeOffset + 4, fmtBytes.length, true);
    outBytes.set(fmtBytes, writeOffset + 8);
    if (fmtPad > 0) {
      outBytes[writeOffset + 8 + fmtBytes.length] = 0;
    }
    writeOffset += fmtTotal;

    // fact Chunk
    if (factBytes) {
      outBytes.set(factBytes, writeOffset);
      writeOffset += factBytes.length;
    }

    // data Chunk
    outBytes.set([0x64, 0x61, 0x74, 0x61], writeOffset);
    outView.setUint32(writeOffset + 4, dataSize, true);
    outBytes.set(dataBytes, writeOffset + 8);
    writeOffset += 8 + dataSize;

    // LIST Chunk
    if (listChunkBytes) {
      outBytes.set(listChunkBytes, writeOffset);
    }

    let outputFileName = file.name;
    if (meta.title && meta.title.trim()) {
      const ext = file.name.split(".").pop() || "wav";
      const sanitized = meta.title.trim().replace(/[<>:"/\\|?*]/g, "").trim();
      if (sanitized) {
        outputFileName = `${sanitized}.${ext}`;
      }
    }

    const blob = new Blob([outBuffer], { type: "audio/wav" });
    return new File([blob], outputFileName, { type: "audio/wav", lastModified: Date.now() });
  }

  // --- Helpers Internos de Codificação / Decodificação Windows-1252 e RIFF ---

  private static encodeAscii(text: string): Uint8Array {
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      bytes[i] = text.charCodeAt(i) & 0x7f;
    }
    return bytes;
  }

  /**
   * Codifica uma string unicode em bytes Windows-1252/ANSI reais (ex: ç=0xE7, ô=0xF4, ã=0xE3, é=0xE9)
   */
  public static encodeWindows1252(text: string): Uint8Array {
    if (!text) return new Uint8Array(0);
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code <= 0x7f) {
        bytes[i] = code;
      } else if (code >= 0xa0 && code <= 0xff) {
        // Bloco Latin-1 direto no Windows-1252 (á, à, â, ã, é, ê, í, ó, ô, õ, ú, ç, etc.)
        bytes[i] = code;
      } else {
        // Mapeamento de caracteres especiais na faixa 0x80-0x9F do Windows-1252
        switch (code) {
          case 0x20ac: bytes[i] = 0x80; break; // €
          case 0x201a: bytes[i] = 0x82; break; // ‚
          case 0x0192: bytes[i] = 0x83; break; // ƒ
          case 0x201e: bytes[i] = 0x84; break; // „
          case 0x2026: bytes[i] = 0x85; break; // …
          case 0x2020: bytes[i] = 0x86; break; // †
          case 0x2021: bytes[i] = 0x87; break; // ‡
          case 0x02c6: bytes[i] = 0x88; break; // ˆ
          case 0x2030: bytes[i] = 0x89; break; // ‰
          case 0x0160: bytes[i] = 0x8a; break; // Š
          case 0x2039: bytes[i] = 0x8b; break; // ‹
          case 0x0152: bytes[i] = 0x8c; break; // Œ
          case 0x017d: bytes[i] = 0x8e; break; // Ž
          case 0x2018: bytes[i] = 0x91; break; // ‘
          case 0x2019: bytes[i] = 0x92; break; // ’
          case 0x201c: bytes[i] = 0x93; break; // “
          case 0x201d: bytes[i] = 0x94; break; // ”
          case 0x2022: bytes[i] = 0x95; break; // •
          case 0x2013: bytes[i] = 0x96; break; // – (en-dash)
          case 0x2014: bytes[i] = 0x97; break; // — (em-dash)
          case 0x02dc: bytes[i] = 0x98; break; // ˜
          case 0x2122: bytes[i] = 0x99; break; // ™
          case 0x0161: bytes[i] = 0x9a; break; // š
          case 0x203a: bytes[i] = 0x9b; break; // ›
          case 0x0153: bytes[i] = 0x9c; break; // œ
          case 0x017e: bytes[i] = 0x9e; break; // ž
          case 0x0178: bytes[i] = 0x9f; break; // Ÿ
          default:
            bytes[i] = 0x3f; // '?' fallback para caracteres fora do Windows-1252
            break;
        }
      }
    }
    return bytes;
  }

  /**
   * Decodifica bytes Windows-1252 / ANSI diretamente para string Unicode (simétrico ao encode)
   */
  public static decodeWindows1252(bytes: Uint8Array): string {
    if (!bytes || bytes.length === 0) return "";
    let s = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b === 0) break; // Terminação NUL
      if (b < 0x80) {
        s += String.fromCharCode(b);
      } else if (b >= 0xa0) {
        s += String.fromCharCode(b);
      } else {
        // Faixa 0x80 - 0x9F do Windows-1252
        const map1252: Record<number, string> = {
          0x80: "€", 0x82: "‚", 0x83: "ƒ", 0x84: "„", 0x85: "…", 0x86: "†", 0x87: "‡",
          0x88: "ˆ", 0x89: "‰", 0x8a: "Š", 0x8b: "‹", 0x8c: "Œ", 0x8e: "Ž",
          0x91: "‘", 0x92: "’", 0x93: "“", 0x94: "”", 0x95: "•", 0x96: "–", 0x97: "—",
          0x98: "˜", 0x99: "™", 0x9a: "š", 0x9b: "›", 0x9c: "œ", 0x9e: "ž", 0x9f: "Ÿ"
        };
        s += map1252[b] || String.fromCharCode(b);
      }
    }
    return s;
  }

  /**
   * Lê especificamente texto das sub-tags RIFF LIST/INFO no formato Windows-1252 / ANSI padrão
   */
  private static readInfoText(bytes: Uint8Array, offset: number, length: number): string {
    const slice = bytes.subarray(offset, offset + length);
    return this.decodeWindows1252(slice).replace(/\0+$/, "");
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

  private static readText(bytes: Uint8Array, offset: number, length: number): string {
    const slice = bytes.subarray(offset, offset + length);
    // Para blocos genéricos fora de LIST/INFO (XML, BEXT, etc.), decodificar UTF-8 ou Windows-1252
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(slice).replace(/\0+$/, "");
    } catch {
      return this.decodeWindows1252(slice).replace(/\0+$/, "");
    }
  }

  private static getChunkDescription(chunkId: string): string {
    switch (chunkId) {
      case "fmt ":
        return "Formato e Parâmetros de Áudio (Taxa, Canais, Bits)";
      case "data":
        return "Payload com Amostras de Áudio PCM";
      case "LIST":
        return "Bloco de Lista de Metadados / Informações";
      case "bext":
        return "Broadcast Wave Extension (BWF)";
      case "iXML":
        return "Metadados iXML de Produção";
      case "XMP ":
        return "Pacote Adobe Extensible Metadata Platform";
      case "id3 ":
      case "ID3 ":
        return "Container ID3v2 Embutido em WAV";
      case "cart":
        return "Metadados de Automação de Rádio (CartChunk)";
      case "DISP":
        return "Informações de Exibição / Título";
      case "cue ":
        return "Pontos de Marcação (Cue Points)";
      case "smpl":
        return "Parâmetros de Amostrador / Loop";
      case "PEAK":
        return "Pico de Nível de Sinal";
      case "JUNK":
      case "PAD ":
        return "Espaço de Preenchimento / Alinhamento";
      default:
        return `Chunk Customizado / Desconhecido (${chunkId})`;
    }
  }

  private static extractDetailedFields(
    key: string,
    rawText: string
  ): Array<{ key: string; label: string; value: string }> {
    const fields: Array<{ key: string; label: string; value: string }> = [];
    if (!rawText) return fields;

    const lower = rawText.toLowerCase();

    // 1. Detecção de plataforma / origem conhecida (ex: Suno Studio)
    if (lower.includes("suno studio")) {
      fields.push({
        key: "platform",
        label: "Origem / Plataforma",
        value: "Suno Studio",
      });
    } else if (lower.includes("suno")) {
      fields.push({
        key: "platform",
        label: "Origem / Plataforma",
        value: "Suno AI",
      });
    }

    // 2. Extração de pares chave=valor separados por ponto-e-vírgula ou vírgula (ex: created=...; project=...; model=...)
    const tokens = rawText.split(/[;,]/);
    for (const token of tokens) {
      const trimmed = token.trim();
      if (!trimmed) continue;

      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const k = trimmed.substring(0, eqIdx).trim();
        const v = trimmed.substring(eqIdx + 1).trim();

        if (k && v) {
          let label = k;
          const kLower = k.toLowerCase();
          if (kLower === "created") label = "created (Data de Criação)";
          else if (kLower === "project") label = "project (Identificador do Projeto)";
          else if (kLower === "model") label = "model (Modelo de IA)";
          else if (kLower === "tempo") label = "tempo (BPM / Andamento)";
          else if (kLower === "prompt") label = "prompt (Instrução Gerativa)";

          if (!fields.some((f) => f.key.toLowerCase() === kLower)) {
            fields.push({ key: k, label, value: v });
          }
        }
      }
    }

    return fields;
  }

  private static classifyTextMetadata(key: string, value: string): ForensicsItemClassification {
    const valLower = value.toLowerCase();
    const keyLower = key.toLowerCase();

    if (
      this.PROVENANCE_KEYWORDS.some((kw) => valLower.includes(kw)) ||
      keyLower.includes("origin") ||
      keyLower.includes("encoder") ||
      keyLower.includes("software")
    ) {
      return ForensicsItemClassification.PROVENANCE_SIGNATURE;
    }

    if (["inam", "iart", "iprd", "icrd", "ignr", "icop", "title", "artist", "album"].includes(keyLower)) {
      return ForensicsItemClassification.EDITABLE_METADATA;
    }

    return ForensicsItemClassification.OPTIONAL_CONTAINER_METADATA;
  }

  private static checkProvenanceAndEncoder(item: ForensicsItem, provenance: ForensicsItem[], encoderSignatures: ForensicsItem[]): void {
    const valLower = item.value.toLowerCase();
    const isProv = this.PROVENANCE_KEYWORDS.some((kw) => valLower.includes(kw));

    if (isProv) {
      if (!provenance.some((p) => p.id === item.id)) {
        provenance.push({
          ...item,
          classification: ForensicsItemClassification.PROVENANCE_SIGNATURE,
        });
      }
    }

    if (valLower.includes("lavf") || valLower.includes("lame") || valLower.includes("ffmpeg") || item.key === "ISFT" || item.key === "TSS") {
      if (!encoderSignatures.some((e) => e.id === item.id)) {
        encoderSignatures.push({
          ...item,
          classification: ForensicsItemClassification.ENCODER_TECHNICAL_SIGNATURE,
        });
      }
    }
  }

  private static async computeViewSha256(bytes: Uint8Array): Promise<string> {
    const exactBuffer =
      bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
        ? bytes.buffer
        : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return this.computeSha256(exactBuffer);
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
