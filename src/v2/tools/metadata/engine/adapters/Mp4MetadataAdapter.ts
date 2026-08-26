/**
 * AUDIO METADATA ENGINE — MP4 / M4A / AAC ADAPTER
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

export class Mp4MetadataAdapter implements FormatAdapter {
  format: SupportedAudioFormat = "M4A";

  canHandle(file: File, bytes: Uint8Array): boolean {
    if (bytes.length < 12) return false;
    const ftyp = readFourCC(bytes, 4);
    const ext = file.name.toLowerCase();
    return ftyp === "ftyp" || ext.endsWith(".m4a") || ext.endsWith(".mp4") || ext.endsWith(".aac");
  }

  async analyze(file: File, bytes: Uint8Array): Promise<AudioAnalysisResult> {
    const fileSha256 = await computeSha256(bytes);
    const audioPayloadBytes = extractAudioPayloadBytes(bytes, "M4A");
    const audioPayloadSha256 = await computeSha256(audioPayloadBytes);

    const rawChunks: RawChunkOrBlock[] = [];
    const fields: MetadataFieldItem[] = [];
    const softwareAndOrigin: SoftwareAndOrigin = {};
    const artwork: ArtworkData = { present: false };

    // Scan top-level atoms
    let offset = 0;
    while (offset + 8 <= bytes.length) {
      let atomSize = readUint32BE(bytes, offset);
      const atomType = readFourCC(bytes, offset + 4);
      if (atomSize === 0) atomSize = bytes.length - offset;
      if (atomSize < 8 || offset + atomSize > bytes.length) break;

      const isMetaAtom = atomType === "udta" || atomType === "meta" || atomType === "ilst";
      rawChunks.push({
        id: atomType,
        name: `MP4 Atom [${atomType}]`,
        offset,
        size: atomSize,
        type: atomType === "mdat" ? "AUDIO_STREAM" : isMetaAtom ? "METADATA" : "HEADER",
        description: atomType === "mdat" ? "Audio Media Data" : `Átomo de estrutura ${atomType}`,
        isRemovable: isMetaAtom,
      });

      offset += atomSize;
    }

    const technical: TechnicalProperties = {
      format: "M4A",
      container: "MPEG-4 Audio Container (.m4a / .mp4)",
      codec: "AAC (Advanced Audio Coding)",
      durationSeconds: 0,
      durationFormatted: "0:00",
      fileSizeBytes: bytes.length,
      fileSizeFormatted: formatBytes(bytes.length),
      sampleRateHz: 44100,
      bitDepth: 16,
      channels: 2,
      channelsDescription: "2 canais (Estéreo)",
      isLossless: false,
    };

    const removableItems = fields.filter((f) => f.isRemovable);

    return {
      sessionId: `m4a_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "audio/mp4",
      lastModified: file.lastModified,
      format: "M4A",
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

    const cleanedBlob = new Blob([bytes], { type: file.type || "audio/mp4" });
    return { cleanedBlob, removedItems, removedChunks };
  }

  async write(file: File, bytes: Uint8Array, metadata: EditableMetadataInput): Promise<Blob> {
    return new Blob([bytes], { type: file.type || "audio/mp4" });
  }
}
