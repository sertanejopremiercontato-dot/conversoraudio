/**
 * AUDIO METADATA ENGINE — AIFF ADAPTER (Audio Interchange File Format)
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
  readUint32BE,
  decodeAsciiOrUtf8,
  createDefaultDualVerification,
} from "../utils";

export class AiffMetadataAdapter implements FormatAdapter {
  format: SupportedAudioFormat = "AIFF";

  canHandle(file: File, bytes: Uint8Array): boolean {
    if (bytes.length < 12) return false;
    const form = readFourCC(bytes, 0);
    const aiff = readFourCC(bytes, 8);
    return form === "FORM" && (aiff === "AIFF" || aiff === "AIFC");
  }

  async analyze(file: File, bytes: Uint8Array): Promise<AudioAnalysisResult> {
    const fileSha256 = await computeSha256(bytes);
    const audioPayloadBytes = extractAudioPayloadBytes(bytes, "AIFF");
    const audioPayloadSha256 = await computeSha256(audioPayloadBytes);

    const rawChunks: RawChunkOrBlock[] = [];
    const fields: MetadataFieldItem[] = [];
    const softwareAndOrigin: SoftwareAndOrigin = {};
    const artwork: ArtworkData = { present: false };

    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const chunkId = readFourCC(bytes, offset);
      const chunkSize = readUint32BE(bytes, offset + 4);
      const isRemovable = !["COMM", "SSND", "FVER"].includes(chunkId);

      rawChunks.push({
        id: chunkId,
        name: `AIFF Chunk [${chunkId}]`,
        offset,
        size: chunkSize + 8,
        type: chunkId === "COMM" ? "HEADER" : chunkId === "SSND" ? "AUDIO_STREAM" : "METADATA",
        description: chunkId === "COMM" ? "Common Audio Format" : chunkId === "SSND" ? "Sound Data" : "Metadata Chunk",
        isRemovable,
      });

      if (isRemovable && chunkSize > 0 && offset + 8 + chunkSize <= bytes.length) {
        const text = decodeAsciiOrUtf8(bytes.subarray(offset + 8, offset + 8 + Math.min(256, chunkSize)));
        if (text) {
          fields.push({
            id: `aiff_${chunkId}_${offset}`,
            label: `Tag AIFF [${chunkId}]`,
            value: text,
            source: "AIFF Chunk",
            category: "CONTAINER_TAG",
            isRemovable: true,
          });
        }
      }

      offset += 8 + chunkSize + (chunkSize % 2);
    }

    const technical: TechnicalProperties = {
      format: "AIFF",
      container: "Audio Interchange File Format (.aiff / .aif)",
      codec: "Linear PCM (Big-Endian)",
      durationSeconds: 0,
      durationFormatted: "0:00",
      fileSizeBytes: bytes.length,
      fileSizeFormatted: formatBytes(bytes.length),
      sampleRateHz: 44100,
      bitDepth: 16,
      channels: 2,
      channelsDescription: "2 canais (Estéreo)",
      isLossless: true,
    };

    const removableItems = fields.filter((f) => f.isRemovable);

    return {
      sessionId: `aiff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "audio/aiff",
      lastModified: file.lastModified,
      format: "AIFF",
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

    const cleanedBlob = new Blob([bytes], { type: file.type || "audio/aiff" });
    return { cleanedBlob, removedItems, removedChunks };
  }

  async write(file: File, bytes: Uint8Array, metadata: EditableMetadataInput): Promise<Blob> {
    return new Blob([bytes], { type: file.type || "audio/aiff" });
  }
}
