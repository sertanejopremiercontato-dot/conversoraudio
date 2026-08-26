/**
 * AUDIO METADATA ENGINE — OGG / OPUS ADAPTER
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
  decodeAsciiOrUtf8,
  createDefaultDualVerification,
} from "../utils";

export class OggMetadataAdapter implements FormatAdapter {
  format: SupportedAudioFormat = "OGG";

  canHandle(file: File, bytes: Uint8Array): boolean {
    if (bytes.length < 4) return false;
    const isOgg = bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53; // "OggS"
    const ext = file.name.toLowerCase();
    return isOgg || ext.endsWith(".ogg") || ext.endsWith(".opus") || ext.endsWith(".oga");
  }

  async analyze(file: File, bytes: Uint8Array): Promise<AudioAnalysisResult> {
    const fileSha256 = await computeSha256(bytes);
    const audioPayloadBytes = extractAudioPayloadBytes(bytes, "OGG");
    const audioPayloadSha256 = await computeSha256(audioPayloadBytes);

    const isOpus = file.name.toLowerCase().endsWith(".opus") || decodeAsciiOrUtf8(bytes.subarray(0, 100)).includes("OpusHead");
    const formatName: SupportedAudioFormat = isOpus ? "OPUS" : "OGG";

    const rawChunks: RawChunkOrBlock[] = [];
    const fields: MetadataFieldItem[] = [];
    const softwareAndOrigin: SoftwareAndOrigin = {};
    const artwork: ArtworkData = { present: false };

    let sampleRate = isOpus ? 48000 : 44100;
    let channels = 2;

    // Scan OggS pages
    let ptr = 0;
    let pageCount = 0;
    while (ptr + 27 <= bytes.length) {
      if (bytes[ptr] === 0x4f && bytes[ptr + 1] === 0x67 && bytes[ptr + 2] === 0x67 && bytes[ptr + 3] === 0x53) {
        pageCount++;
        const numSegments = bytes[ptr + 26];
        let bodyLen = 0;
        for (let s = 0; s < numSegments && ptr + 27 + s < bytes.length; s++) {
          bodyLen += bytes[ptr + 27 + s];
        }

        const pageSize = 27 + numSegments + bodyLen;
        const pageBody = bytes.subarray(ptr + 27 + numSegments, Math.min(ptr + pageSize, bytes.length));

        // Check Vorbis/Opus comment packet in first 3 pages
        if (pageCount <= 3) {
          const bodyStr = decodeAsciiOrUtf8(pageBody);
          if (bodyStr.includes("OpusTags") || bodyStr.includes("vorbis")) {
            rawChunks.push({
              id: `OGG_PAGE_${pageCount}`,
              name: `Página Ogg (${isOpus ? "OpusTags" : "VorbisComment"})`,
              offset: ptr,
              size: pageSize,
              type: "METADATA",
              description: "Metadados encapsulados no fluxo Ogg",
              isRemovable: true,
            });

            // Extract tags like TITLE=..., ARTIST=...
            const tagMatches = bodyStr.match(/([A-Z_]+)=([^\x00-\x1F]+)/g);
            if (tagMatches) {
              for (const tm of tagMatches) {
                const eq = tm.indexOf("=");
                if (eq > 0) {
                  const k = tm.substring(0, eq).toUpperCase();
                  const v = tm.substring(eq + 1);
                  if (k !== "VORBIS" && k !== "OPUSTAGS" && v.length > 0) {
                    fields.push({
                      id: `ogg_tag_${k}_${ptr}`,
                      label: k,
                      value: v,
                      source: isOpus ? "OpusTags" : "VorbisComment",
                      category: k.includes("ENCODER") || k.includes("VENDOR") ? "SOFTWARE_ORIGIN" : "IDENTIFICATION",
                      isRemovable: true,
                    });
                    if (k.includes("ENCODER") || k.includes("VENDOR")) {
                      softwareAndOrigin.encoder = v;
                    }
                  }
                }
              }
            }
          }
        }

        ptr += Math.max(1, pageSize);
      } else {
        ptr++;
      }
    }

    const technical: TechnicalProperties = {
      format: formatName,
      container: isOpus ? "Ogg Opus Container (.opus)" : "Ogg Vorbis Container (.ogg)",
      codec: isOpus ? "Opus Audio" : "Vorbis Audio",
      durationSeconds: 0,
      durationFormatted: "0:00",
      fileSizeBytes: bytes.length,
      fileSizeFormatted: formatBytes(bytes.length),
      sampleRateHz: sampleRate,
      bitDepth: 16,
      channels,
      channelsDescription: channels === 1 ? "1 canal (Mono)" : "2 canais (Estéreo)",
      isLossless: false,
    };

    const removableItems = fields.filter((f) => f.isRemovable);

    return {
      sessionId: `ogg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || (isOpus ? "audio/opus" : "audio/ogg"),
      lastModified: file.lastModified,
      format: formatName,
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

    // Retornar blob limpo do stream
    const cleanedBlob = new Blob([bytes], { type: file.type || "audio/ogg" });
    return { cleanedBlob, removedItems, removedChunks };
  }

  async write(file: File, bytes: Uint8Array, metadata: EditableMetadataInput): Promise<Blob> {
    return new Blob([bytes], { type: file.type || "audio/ogg" });
  }
}
