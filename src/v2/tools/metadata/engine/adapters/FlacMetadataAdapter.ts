/**
 * AUDIO METADATA ENGINE — FLAC ADAPTER (Free Lossless Audio Codec)
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
  readUint16BE,
  readUint32BE,
  decodeAsciiOrUtf8,
  createDefaultDualVerification,
} from "../utils";

export class FlacMetadataAdapter implements FormatAdapter {
  format: SupportedAudioFormat = "FLAC";

  canHandle(file: File, bytes: Uint8Array): boolean {
    if (bytes.length < 4) return false;
    return (
      (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) ||
      file.name.toLowerCase().endsWith(".flac")
    );
  }

  async analyze(file: File, bytes: Uint8Array): Promise<AudioAnalysisResult> {
    const fileSha256 = await computeSha256(bytes);
    const audioPayloadBytes = extractAudioPayloadBytes(bytes, "FLAC");
    const audioPayloadSha256 = await computeSha256(audioPayloadBytes);

    const rawChunks: RawChunkOrBlock[] = [];
    const fields: MetadataFieldItem[] = [];
    const softwareAndOrigin: SoftwareAndOrigin = {};
    const artwork: ArtworkData = { present: false };

    let sampleRate = 44100;
    let channels = 2;
    let bitsPerSample = 16;
    let totalSamples = 0;
    let audioFramesOffset = 4;

    if (bytes.length >= 4 && bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
      let offset = 4;
      let isLast = false;

      while (offset + 4 <= bytes.length && !isLast) {
        const blockHeader = bytes[offset];
        isLast = (blockHeader & 0x80) !== 0;
        const blockType = blockHeader & 0x7f;
        const blockLength = ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
        const blockPayloadOffset = offset + 4;
        const blockTotalSize = 4 + blockLength;

        const blockNames: Record<number, string> = {
          0: "STREAMINFO",
          1: "PADDING",
          2: "APPLICATION",
          3: "SEEKTABLE",
          4: "VORBIS_COMMENT",
          5: "CUESHEET",
          6: "PICTURE",
        };

        const blockName = blockNames[blockType] || `CUSTOM_BLOCK_${blockType}`;
        const isRemovable = blockType !== 0 && blockType !== 3; // Keep STREAMINFO & SEEKTABLE, strip others on clean

        rawChunks.push({
          id: `FLAC_BLOCK_${blockType}`,
          name: `Bloco FLAC ${blockName}`,
          offset,
          size: blockTotalSize,
          type: blockType === 0 ? "HEADER" : isRemovable ? "METADATA" : "EXTRA",
          description: `Bloco de metadados FLAC (${formatBytes(blockLength)})`,
          isRemovable,
        });

        // 0: STREAMINFO
        if (blockType === 0 && blockLength >= 34) {
          const b = bytes.subarray(blockPayloadOffset, blockPayloadOffset + 34);
          sampleRate = (b[10] << 12) | (b[11] << 4) | (b[12] >> 4);
          channels = ((b[12] >> 1) & 0x07) + 1;
          bitsPerSample = (((b[12] & 0x01) << 4) | (b[13] >> 4)) + 1;
          totalSamples =
            ((b[13] & 0x0f) * Math.pow(2, 32)) +
            ((b[14] << 24) | (b[15] << 16) | (b[16] << 8) | b[17]);
        }

        // 4: VORBIS_COMMENT
        if (blockType === 4 && blockLength >= 8) {
          const b = bytes.subarray(blockPayloadOffset, blockPayloadOffset + blockLength);
          const vendorLength = (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
          if (vendorLength > 0 && vendorLength + 4 <= b.length) {
            const vendor = decodeAsciiOrUtf8(b.subarray(4, 4 + vendorLength));
            if (vendor) {
              softwareAndOrigin.vendor = vendor;
              fields.push({
                id: "flac_vendor",
                label: "Vendor String / Codificador",
                value: vendor,
                source: "Vorbis Comment",
                category: "SOFTWARE_ORIGIN",
                isRemovable: true,
              });
            }
          }

          let ptr = 4 + vendorLength;
          if (ptr + 4 <= b.length) {
            const numComments = (b[ptr] | (b[ptr + 1] << 8) | (b[ptr + 2] << 16) | (b[ptr + 3] << 24)) >>> 0;
            ptr += 4;

            for (let i = 0; i < numComments && ptr + 4 <= b.length; i++) {
              const commentLen = (b[ptr] | (b[ptr + 1] << 8) | (b[ptr + 2] << 16) | (b[ptr + 3] << 24)) >>> 0;
              ptr += 4;
              if (ptr + commentLen <= b.length) {
                const commentStr = decodeAsciiOrUtf8(b.subarray(ptr, ptr + commentLen));
                const eqIdx = commentStr.indexOf("=");
                if (eqIdx > 0) {
                  const tagKey = commentStr.substring(0, eqIdx).toUpperCase();
                  const tagVal = commentStr.substring(eqIdx + 1);

                  const labelMap: Record<string, string> = {
                    TITLE: "Título da Faixa",
                    ARTIST: "Artista / Intérprete",
                    ALBUM: "Álbum",
                    ALBUMARTIST: "Artista do Álbum",
                    GENRE: "Gênero",
                    DATE: "Data / Ano",
                    COMPOSER: "Compositor",
                    TRACKNUMBER: "Número da Faixa",
                    DISCNUMBER: "Número do Disco",
                    ISRC: "ISRC",
                    COMMENT: "Comentário",
                    DESCRIPTION: "Descrição",
                    COPYRIGHT: "Copyright",
                  };

                  fields.push({
                    id: `flac_comment_${i}`,
                    label: labelMap[tagKey] || `Tag [${tagKey}]`,
                    value: tagVal,
                    source: "Vorbis Comment",
                    category: tagKey.includes("SOFTWARE") || tagKey.includes("ENCODER") ? "SOFTWARE_ORIGIN" : "IDENTIFICATION",
                    isRemovable: true,
                  });
                }
                ptr += commentLen;
              }
            }
          }
        }

        // 6: PICTURE
        if (blockType === 6) {
          artwork.present = true;
          artwork.sizeBytes = blockLength;
          fields.push({
            id: `flac_picture_${offset}`,
            label: "Capa do Álbum (Picture Block)",
            value: `Imagem incorporada (${formatBytes(blockLength)})`,
            source: "FLAC PICTURE",
            category: "CONTAINER_TAG",
            isRemovable: true,
          });
        }

        offset += blockTotalSize;
      }
      audioFramesOffset = offset;
    }

    const durationSeconds = sampleRate > 0 ? totalSamples / sampleRate : 0;
    const technical: TechnicalProperties = {
      format: "FLAC",
      container: "Free Lossless Audio Codec (.flac)",
      codec: "FLAC Lossless",
      durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
      fileSizeBytes: bytes.length,
      fileSizeFormatted: formatBytes(bytes.length),
      sampleRateHz: sampleRate,
      bitDepth: bitsPerSample,
      channels,
      channelsDescription: channels === 1 ? "1 canal (Mono)" : "2 canais (Estéreo)",
      bitrateKbps: durationSeconds > 0 ? Math.round((bytes.length * 8) / (durationSeconds * 1000)) : undefined,
      isLossless: true,
      audioDataOffset: audioFramesOffset,
      audioDataLength: bytes.length - audioFramesOffset,
    };

    const removableItems = fields.filter((f) => f.isRemovable);

    return {
      sessionId: `flac_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "audio/flac",
      lastModified: file.lastModified,
      format: "FLAC",
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

    if (bytes.length < 42 || bytes[0] !== 0x66 || bytes[1] !== 0x4c || bytes[2] !== 0x61 || bytes[3] !== 0x43) {
      throw new Error("Arquivo FLAC inválido.");
    }

    // Copiar STREAMINFO (primeiro bloco obrigatório de 34 bytes + 4 bytes header) com flag isLast = 1
    const streamInfoPayload = bytes.subarray(4, 4 + 4 + 34);
    const newStreamInfoHeader = new Uint8Array(4 + 34);
    newStreamInfoHeader.set(streamInfoPayload);
    newStreamInfoHeader[0] = 0x80 | (streamInfoPayload[0] & 0x7f); // set isLast bit to 1

    // Achar onde começam os audio frames reais
    let offset = 4;
    let isLast = false;
    while (offset + 4 <= bytes.length && !isLast) {
      const h = bytes[offset];
      isLast = (h & 0x80) !== 0;
      const len = ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
      offset += 4 + len;
    }

    const audioFrames = bytes.subarray(offset);
    const flacMarker = new Uint8Array([0x66, 0x4c, 0x61, 0x43]);

    const cleanedBlob = new Blob([flacMarker, newStreamInfoHeader, audioFrames], { type: "audio/flac" });
    return { cleanedBlob, removedItems, removedChunks };
  }

  async write(file: File, bytes: Uint8Array, metadata: EditableMetadataInput): Promise<Blob> {
    const { cleanedBlob } = await this.clean(file, bytes);
    const cleanBytes = new Uint8Array(await cleanedBlob.arrayBuffer());

    // Se nenhum metadado, retornar limpo
    const tags: Array<{ k: string; v: string }> = [];
    if (metadata.title) tags.push({ k: "TITLE", v: metadata.title });
    if (metadata.artist) tags.push({ k: "ARTIST", v: metadata.artist });
    if (metadata.album) tags.push({ k: "ALBUM", v: metadata.album });
    if (metadata.albumArtist) tags.push({ k: "ALBUMARTIST", v: metadata.albumArtist });
    if (metadata.genre) tags.push({ k: "GENRE", v: metadata.genre });
    if (metadata.year) tags.push({ k: "DATE", v: metadata.year });
    if (metadata.composer) tags.push({ k: "COMPOSER", v: metadata.composer });
    if (metadata.trackNumber) tags.push({ k: "TRACKNUMBER", v: metadata.trackNumber });
    if (metadata.isrc) tags.push({ k: "ISRC", v: metadata.isrc });
    if (metadata.comment) tags.push({ k: "COMMENT", v: metadata.comment });
    if (metadata.copyright) tags.push({ k: "COPYRIGHT", v: metadata.copyright });

    if (tags.length === 0) {
      return cleanedBlob;
    }

    // Construir VORBIS_COMMENT block
    const encoder = new TextEncoder();
    const vendorStr = encoder.encode("reference libFLAC 1.4.3 20230623");
    const encodedComments: Uint8Array[] = tags.map((t) => encoder.encode(`${t.k}=${t.v}`));

    let commentsTotalLen = 4 + vendorStr.length + 4;
    for (const c of encodedComments) {
      commentsTotalLen += 4 + c.length;
    }

    const commentBlock = new Uint8Array(4 + commentsTotalLen);
    commentBlock[0] = 0x84; // 0x80 (isLast) | 0x04 (VORBIS_COMMENT)
    commentBlock[1] = (commentsTotalLen >> 16) & 0xff;
    commentBlock[2] = (commentsTotalLen >> 8) & 0xff;
    commentBlock[3] = commentsTotalLen & 0xff;

    let p = 4;
    // Vendor length LE
    commentBlock[p++] = vendorStr.length & 0xff;
    commentBlock[p++] = (vendorStr.length >> 8) & 0xff;
    commentBlock[p++] = (vendorStr.length >> 16) & 0xff;
    commentBlock[p++] = (vendorStr.length >> 24) & 0xff;
    commentBlock.set(vendorStr, p);
    p += vendorStr.length;

    // Num comments LE
    commentBlock[p++] = encodedComments.length & 0xff;
    commentBlock[p++] = (encodedComments.length >> 8) & 0xff;
    commentBlock[p++] = (encodedComments.length >> 16) & 0xff;
    commentBlock[p++] = (encodedComments.length >> 24) & 0xff;

    for (const c of encodedComments) {
      commentBlock[p++] = c.length & 0xff;
      commentBlock[p++] = (c.length >> 8) & 0xff;
      commentBlock[p++] = (c.length >> 16) & 0xff;
      commentBlock[p++] = (c.length >> 24) & 0xff;
      commentBlock.set(c, p);
      p += c.length;
    }

    // Atualizar STREAMINFO isLast = 0 (pois o VORBIS_COMMENT será o último bloco)
    const streamInfo = cleanBytes.subarray(4, 4 + 4 + 34);
    const updatedStreamInfo = new Uint8Array(streamInfo);
    updatedStreamInfo[0] = updatedStreamInfo[0] & 0x7f; // clear isLast

    const audioFrames = cleanBytes.subarray(4 + 4 + 34);
    const flacMarker = new Uint8Array([0x66, 0x4c, 0x61, 0x43]);

    return new Blob([flacMarker, updatedStreamInfo, commentBlock, audioFrames], { type: "audio/flac" });
  }
}
