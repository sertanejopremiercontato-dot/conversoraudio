/**
 * AUDIO METADATA ENGINE — WAV ADAPTER (RIFF / RF64 / BW64)
 */

import {
  FormatAdapter,
  SupportedAudioFormat,
  AudioAnalysisResult,
  MetadataFieldItem,
  RawChunkOrBlock,
  TechnicalProperties,
  SoftwareAndOrigin,
  ArtworkData,
  EditableMetadataInput,
} from "../types";
import {
  computeSha256,
  extractAudioPayloadBytes,
  formatBytes,
  formatDuration,
  readFourCC,
  readUint16LE,
  readUint32LE,
  decodeAsciiOrUtf8,
  createDefaultDualVerification,
} from "../utils";

export class WavMetadataAdapter implements FormatAdapter {
  format: SupportedAudioFormat = "WAV";

  canHandle(file: File, bytes: Uint8Array): boolean {
    if (bytes.length < 12) return false;
    const tag = readFourCC(bytes, 0);
    const wave = readFourCC(bytes, 8);
    return (
      (tag === "RIFF" || tag === "RIFX" || tag === "RF64" || tag === "BW64") &&
      (wave === "WAVE" || wave === "BW64")
    );
  }

  async analyze(file: File, bytes: Uint8Array): Promise<AudioAnalysisResult> {
    const fileSha256 = await computeSha256(bytes);
    const audioPayloadBytes = extractAudioPayloadBytes(bytes, "WAV");
    const audioPayloadSha256 = await computeSha256(audioPayloadBytes);

    let formatTag = 1; // PCM default
    let channels = 2;
    let sampleRate = 44100;
    let byteRate = 176400;
    let blockAlign = 4;
    let bitsPerSample = 16;
    let dataOffset = 44;
    let dataSize = bytes.length - 44;

    const rawChunks: RawChunkOrBlock[] = [];
    const fields: MetadataFieldItem[] = [];
    const softwareAndOrigin: SoftwareAndOrigin = {};
    const artwork: ArtworkData = { present: false };

    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const chunkId = readFourCC(bytes, offset);
      const chunkSize = readUint32LE(bytes, offset + 4);
      const chunkPayloadOffset = offset + 8;
      const nextChunkOffset = chunkPayloadOffset + chunkSize + (chunkSize % 2);

      if (chunkId === "fmt ") {
        formatTag = readUint16LE(bytes, chunkPayloadOffset);
        channels = readUint16LE(bytes, chunkPayloadOffset + 2);
        sampleRate = readUint32LE(bytes, chunkPayloadOffset + 4);
        byteRate = readUint32LE(bytes, chunkPayloadOffset + 8);
        blockAlign = readUint16LE(bytes, chunkPayloadOffset + 12);
        if (chunkSize >= 16) {
          bitsPerSample = readUint16LE(bytes, chunkPayloadOffset + 14);
        }
        rawChunks.push({
          id: "fmt ",
          name: "Format Header (fmt)",
          offset,
          size: chunkSize + 8,
          type: "HEADER",
          description: `PCM/Áudio ${channels} canais, ${sampleRate}Hz, ${bitsPerSample}-bit`,
          isRemovable: false,
        });
      } else if (chunkId === "data") {
        dataOffset = chunkPayloadOffset;
        dataSize = chunkSize;
        rawChunks.push({
          id: "data",
          name: "Audio Stream Data (data)",
          offset,
          size: chunkSize + 8,
          type: "AUDIO_STREAM",
          description: `Payload de áudio puro (${formatBytes(chunkSize)})`,
          isRemovable: false,
        });
      } else if (chunkId === "LIST") {
        const listType = readFourCC(bytes, chunkPayloadOffset);
        const isInfo = listType === "INFO";
        rawChunks.push({
          id: "LIST",
          name: `RIFF LIST (${listType})`,
          offset,
          size: chunkSize + 8,
          type: "METADATA",
          description: isInfo ? "Metadados textuais padrão RIFF INFO" : `Bloco LIST ${listType}`,
          isRemovable: true,
        });

        if (isInfo) {
          let subOffset = chunkPayloadOffset + 4;
          const listEnd = Math.min(chunkPayloadOffset + chunkSize, bytes.length);

          while (subOffset + 8 <= listEnd) {
            const subId = readFourCC(bytes, subOffset);
            const subSize = readUint32LE(bytes, subOffset + 4);
            const subPayloadOffset = subOffset + 8;
            const subEnd = Math.min(subPayloadOffset + subSize, listEnd);

            if (subEnd > subPayloadOffset) {
              const subBytes = bytes.subarray(subPayloadOffset, subEnd);
              const textVal = decodeAsciiOrUtf8(subBytes);

              if (textVal) {
                const labelMap: Record<string, string> = {
                  INAM: "Título da Faixa",
                  IART: "Artista / Intérprete",
                  IPRD: "Álbum / Produto",
                  ICRD: "Data de Criação / Ano",
                  IGNR: "Gênero Musical",
                  ICMT: "Comentário / Detalhes",
                  ICOP: "Copyright",
                  ISFT: "Software / Ferramenta",
                  IENG: "Engenheiro de Áudio",
                  ITCH: "Técnico / Codificador",
                  ISRC: "Código ISRC",
                };

                const label = labelMap[subId] || `Tag RIFF [${subId}]`;
                const category =
                  subId === "ISFT" || subId === "ITCH"
                    ? "SOFTWARE_ORIGIN"
                    : subId === "INAM" || subId === "IART" || subId === "IPRD"
                    ? "IDENTIFICATION"
                    : "CONTAINER_TAG";

                fields.push({
                  id: `riff_info_${subId}_${subOffset}`,
                  label,
                  value: textVal,
                  source: `LIST/INFO (${subId})`,
                  category,
                  isRemovable: true,
                });

                if (subId === "ISFT") {
                  softwareAndOrigin.software = textVal;
                }

                // Suno Studio detection in ICMT
                if (subId === "ICMT") {
                  const lower = textVal.toLowerCase();
                  if (lower.includes("suno")) {
                    softwareAndOrigin.isSunoAIGenerated = true;
                    const createdMatch = textVal.match(/created=([^,\n;]+)/i);
                    const projectMatch = textVal.match(/project=([^,\n;]+)/i);
                    const tempoMatch = textVal.match(/tempo=([^,\n;]+)/i);
                    softwareAndOrigin.sunoDetails = {
                      modelOrPrompt: textVal.includes("Made with Suno") ? "Suno Studio" : undefined,
                      created: createdMatch ? createdMatch[1].trim() : undefined,
                      project: projectMatch ? projectMatch[1].trim() : undefined,
                      tempo: tempoMatch ? tempoMatch[1].trim() : undefined,
                      fullComment: textVal,
                    };
                  }
                }
              }
            }

            const subPad = subSize % 2;
            subOffset = subPayloadOffset + subSize + subPad;
          }
        }
      } else if (chunkId === "bext") {
        rawChunks.push({
          id: "bext",
          name: "Broadcast Wave Extension (bext)",
          offset,
          size: chunkSize + 8,
          type: "METADATA",
          description: "Metadados profissionais de transmissão / EBU",
          isRemovable: true,
        });
        if (chunkSize >= 32) {
          const desc = decodeAsciiOrUtf8(bytes.subarray(chunkPayloadOffset, chunkPayloadOffset + Math.min(256, chunkSize)));
          if (desc) {
            fields.push({
              id: `bext_desc_${offset}`,
              label: "BEXT Descrição",
              value: desc,
              source: "bext chunk",
              category: "CONTAINER_TAG",
              isRemovable: true,
            });
          }
        }
      } else if (chunkId === "id3 " || chunkId === "ID3 ") {
        rawChunks.push({
          id: chunkId,
          name: "ID3 Tag Chunk",
          offset,
          size: chunkSize + 8,
          type: "METADATA",
          description: "Tag ID3 completa encapsulada no WAV",
          isRemovable: true,
        });
      } else if (chunkId === "iXML" || chunkId === "XMP_" || chunkId === "_PMX") {
        rawChunks.push({
          id: chunkId,
          name: `Metadados XML (${chunkId})`,
          offset,
          size: chunkSize + 8,
          type: "METADATA",
          description: "Metadados XML avançados de gravação/edição",
          isRemovable: true,
        });
      } else if (chunkId === "JUNK" || chunkId === "PAD " || chunkId === "FLLR") {
        rawChunks.push({
          id: chunkId,
          name: `Padding de Alinhamento (${chunkId})`,
          offset,
          size: chunkSize + 8,
          type: "PADDING",
          description: "Espaço em branco / padding extra descartável",
          isRemovable: true,
        });
      } else {
        // Unknown or specialized chunk
        rawChunks.push({
          id: chunkId,
          name: `Chunk Extra [${chunkId}]`,
          offset,
          size: chunkSize + 8,
          type: "EXTRA",
          description: `Chunk não essencial (${chunkSize} bytes)`,
          isRemovable: true,
        });
      }

      offset = nextChunkOffset;
    }

    const durationSeconds = byteRate > 0 ? dataSize / byteRate : 0;
    const codecName =
      formatTag === 1
        ? "Linear PCM (Descomprimido)"
        : formatTag === 3
        ? "IEEE Float (32-bit)"
        : formatTag === 6
        ? "A-law"
        : formatTag === 7
        ? "μ-law"
        : formatTag === 65534
        ? "WAVE_FORMAT_EXTENSIBLE"
        : `PCM Format ${formatTag}`;

    const technical: TechnicalProperties = {
      format: "WAV",
      container: "RIFF Waveform Audio (WAV)",
      codec: codecName,
      durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
      fileSizeBytes: bytes.length,
      fileSizeFormatted: formatBytes(bytes.length),
      sampleRateHz: sampleRate,
      bitDepth: bitsPerSample,
      channels,
      channelsDescription: channels === 1 ? "1 canal (Mono)" : channels === 2 ? "2 canais (Estéreo)" : `${channels} canais`,
      bitrateKbps: Math.round((byteRate * 8) / 1000),
      isLossless: true,
      audioDataOffset: dataOffset,
      audioDataLength: dataSize,
    };

    const removableItems = fields.filter((f) => f.isRemovable);

    return {
      sessionId: `wav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "audio/wav",
      lastModified: file.lastModified,
      format: "WAV",
      technical,
      fields,
      softwareAndOrigin,
      artwork,
      rawChunks,
      removableItemsCount: removableItems.length,
      removableItems,
      integrity: {
        fileSha256,
        audioPayloadSha256,
      },
      dualVerification: createDefaultDualVerification(),
    };
  }

  async clean(
    file: File,
    bytes: Uint8Array
  ): Promise<{ cleanedBlob: Blob; removedItems: MetadataFieldItem[]; removedChunks: RawChunkOrBlock[] }> {
    const analysis = await this.analyze(file, bytes);
    const removedItems = [...analysis.removableItems];
    const removedChunks = analysis.rawChunks.filter((c) => c.isRemovable);

    // Encontrar fmt chunk e data chunk originais
    let fmtOffset = -1;
    let fmtSize = 16;
    let dataPayloadOffset = -1;
    let dataPayloadSize = -1;

    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const chunkId = readFourCC(bytes, offset);
      const chunkSize = readUint32LE(bytes, offset + 4);
      if (chunkId === "fmt ") {
        fmtOffset = offset;
        fmtSize = chunkSize;
      } else if (chunkId === "data") {
        dataPayloadOffset = offset + 8;
        dataPayloadSize = chunkSize;
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }

    if (fmtOffset === -1 || dataPayloadOffset === -1 || dataPayloadSize < 0) {
      throw new Error("Arquivo WAV inválido: blocos estruturais essenciais 'fmt' ou 'data' não localizados.");
    }

    // Montar NOVO WAV LIMPO: RIFF Header (12 bytes) + fmt chunk (8 + fmtSize) + data chunk (8 + dataPayloadSize)
    const totalDataSizeWithPad = dataPayloadSize + (dataPayloadSize % 2);
    const newFmtTotalSize = 8 + fmtSize + (fmtSize % 2);
    const totalRiffSize = 4 + newFmtTotalSize + 8 + totalDataSizeWithPad;

    const cleanedBuffer = new Uint8Array(8 + totalRiffSize);

    // 1. RIFF Header
    cleanedBuffer[0] = 0x52; // 'R'
    cleanedBuffer[1] = 0x49; // 'I'
    cleanedBuffer[2] = 0x46; // 'F'
    cleanedBuffer[3] = 0x46; // 'F'
    // Total size LE
    cleanedBuffer[4] = totalRiffSize & 0xff;
    cleanedBuffer[5] = (totalRiffSize >> 8) & 0xff;
    cleanedBuffer[6] = (totalRiffSize >> 16) & 0xff;
    cleanedBuffer[7] = (totalRiffSize >> 24) & 0xff;
    // 'WAVE'
    cleanedBuffer[8] = 0x57;
    cleanedBuffer[9] = 0x41;
    cleanedBuffer[10] = 0x56;
    cleanedBuffer[11] = 0x45;

    // 2. fmt chunk (copiado exatamente dos bytes originais)
    let writePtr = 12;
    cleanedBuffer.set(bytes.subarray(fmtOffset, fmtOffset + 8 + fmtSize), writePtr);
    writePtr += 8 + fmtSize;
    if (fmtSize % 2 !== 0) {
      cleanedBuffer[writePtr++] = 0;
    }

    // 3. data chunk header
    cleanedBuffer[writePtr] = 0x64; // 'd'
    cleanedBuffer[writePtr + 1] = 0x61; // 'a'
    cleanedBuffer[writePtr + 2] = 0x74; // 't'
    cleanedBuffer[writePtr + 3] = 0x61; // 'a'
    cleanedBuffer[writePtr + 4] = dataPayloadSize & 0xff;
    cleanedBuffer[writePtr + 5] = (dataPayloadSize >> 8) & 0xff;
    cleanedBuffer[writePtr + 6] = (dataPayloadSize >> 16) & 0xff;
    cleanedBuffer[writePtr + 7] = (dataPayloadSize >> 24) & 0xff;
    writePtr += 8;

    // 4. Copiar dados PCM do áudio sem alteração
    cleanedBuffer.set(bytes.subarray(dataPayloadOffset, dataPayloadOffset + dataPayloadSize), writePtr);
    writePtr += dataPayloadSize;
    if (dataPayloadSize % 2 !== 0) {
      cleanedBuffer[writePtr++] = 0;
    }

    const cleanedBlob = new Blob([cleanedBuffer], { type: "audio/wav" });
    return { cleanedBlob, removedItems, removedChunks };
  }

  async write(file: File, bytes: Uint8Array, metadata: EditableMetadataInput): Promise<Blob> {
    // Primeiro garantir uma base limpa
    const { cleanedBlob } = await this.clean(file, bytes);
    const cleanBytes = new Uint8Array(await cleanedBlob.arrayBuffer());

    // Se nenhum metadado novo foi informado, retornar a base limpa
    const tagsToWrite: Array<{ id: string; val: string }> = [];
    if (metadata.title) tagsToWrite.push({ id: "INAM", val: metadata.title });
    if (metadata.artist) tagsToWrite.push({ id: "IART", val: metadata.artist });
    if (metadata.album) tagsToWrite.push({ id: "IPRD", val: metadata.album });
    if (metadata.year) tagsToWrite.push({ id: "ICRD", val: metadata.year });
    if (metadata.genre) tagsToWrite.push({ id: "IGNR", val: metadata.genre });
    if (metadata.comment) tagsToWrite.push({ id: "ICMT", val: metadata.comment });
    if (metadata.copyright) tagsToWrite.push({ id: "ICOP", val: metadata.copyright });
    if (metadata.composer) tagsToWrite.push({ id: "IENG", val: metadata.composer });
    if (metadata.isrc) tagsToWrite.push({ id: "ISRC", val: metadata.isrc });

    if (tagsToWrite.length === 0) {
      return cleanedBlob;
    }

    // Construir chunk LIST INFO
    let listSubchunksSize = 4; // 'INFO' (4 bytes)
    const encodedSubchunks: Array<{ id: string; data: Uint8Array }> = [];

    const encoder = new TextEncoder();
    for (const tag of tagsToWrite) {
      const textBytes = encoder.encode(tag.val + "\0");
      const pad = textBytes.length % 2;
      encodedSubchunks.push({ id: tag.id, data: textBytes });
      listSubchunksSize += 8 + textBytes.length + pad;
    }

    const listChunkTotalSize = 8 + listSubchunksSize + (listSubchunksSize % 2);
    const currentRiffSize = readUint32LE(cleanBytes, 4);
    const newRiffSize = currentRiffSize + listChunkTotalSize;

    const finalBuffer = new Uint8Array(cleanBytes.length + listChunkTotalSize);
    finalBuffer.set(cleanBytes, 0);

    // Atualizar tamanho RIFF LE
    finalBuffer[4] = newRiffSize & 0xff;
    finalBuffer[5] = (newRiffSize >> 8) & 0xff;
    finalBuffer[6] = (newRiffSize >> 16) & 0xff;
    finalBuffer[7] = (newRiffSize >> 24) & 0xff;

    // Escrever LIST INFO no final
    let ptr = cleanBytes.length;
    finalBuffer[ptr++] = 0x4c; // 'L'
    finalBuffer[ptr++] = 0x49; // 'I'
    finalBuffer[ptr++] = 0x53; // 'S'
    finalBuffer[ptr++] = 0x54; // 'T'

    finalBuffer[ptr++] = listSubchunksSize & 0xff;
    finalBuffer[ptr++] = (listSubchunksSize >> 8) & 0xff;
    finalBuffer[ptr++] = (listSubchunksSize >> 16) & 0xff;
    finalBuffer[ptr++] = (listSubchunksSize >> 24) & 0xff;

    // 'INFO'
    finalBuffer[ptr++] = 0x49;
    finalBuffer[ptr++] = 0x4e;
    finalBuffer[ptr++] = 0x46;
    finalBuffer[ptr++] = 0x4f;

    for (const sub of encodedSubchunks) {
      finalBuffer[ptr++] = sub.id.charCodeAt(0);
      finalBuffer[ptr++] = sub.id.charCodeAt(1);
      finalBuffer[ptr++] = sub.id.charCodeAt(2);
      finalBuffer[ptr++] = sub.id.charCodeAt(3);

      finalBuffer[ptr++] = sub.data.length & 0xff;
      finalBuffer[ptr++] = (sub.data.length >> 8) & 0xff;
      finalBuffer[ptr++] = (sub.data.length >> 16) & 0xff;
      finalBuffer[ptr++] = (sub.data.length >> 24) & 0xff;

      finalBuffer.set(sub.data, ptr);
      ptr += sub.data.length;
      if (sub.data.length % 2 !== 0) {
        finalBuffer[ptr++] = 0;
      }
    }

    return new Blob([finalBuffer], { type: "audio/wav" });
  }
}
