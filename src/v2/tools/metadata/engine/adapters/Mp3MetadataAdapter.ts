/**
 * AUDIO METADATA ENGINE — MP3 ADAPTER (ID3v1, ID3v2.2/v2.3/v2.4, APEv2, Xing/LAME)
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

export class Mp3MetadataAdapter implements FormatAdapter {
  format: SupportedAudioFormat = "MP3";

  canHandle(file: File, bytes: Uint8Array): boolean {
    if (bytes.length < 4) return false;
    // 'ID3' or MPEG sync 0xFF, 0xEx
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;
    if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return true;
    const ext = file.name.toLowerCase();
    return ext.endsWith(".mp3");
  }

  async analyze(file: File, bytes: Uint8Array): Promise<AudioAnalysisResult> {
    const fileSha256 = await computeSha256(bytes);
    const audioPayloadBytes = extractAudioPayloadBytes(bytes, "MP3");
    const audioPayloadSha256 = await computeSha256(audioPayloadBytes);

    const rawChunks: RawChunkOrBlock[] = [];
    const fields: MetadataFieldItem[] = [];
    const softwareAndOrigin: SoftwareAndOrigin = {};
    const artwork: ArtworkData = { present: false };

    let audioStartOffset = 0;
    let audioEndOffset = bytes.length;

    // 1. Inspecionar ID3v2 no início
    if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const majorVer = bytes[3];
      const revVer = bytes[4];
      const flags = bytes[5];
      const tagSize =
        ((bytes[6] & 0x7f) << 21) |
        ((bytes[7] & 0x7f) << 14) |
        ((bytes[8] & 0x7f) << 7) |
        (bytes[9] & 0x7f);

      const totalId3Size = 10 + tagSize;
      audioStartOffset = totalId3Size;

      rawChunks.push({
        id: "ID3v2",
        name: `ID3v2.${majorVer}.${revVer} Header`,
        offset: 0,
        size: totalId3Size,
        type: "METADATA",
        description: `Metadados ID3v2.${majorVer} (${formatBytes(totalId3Size)})`,
        isRemovable: true,
      });

      // Parsear frames ID3v2
      let frameOffset = 10;
      const id3End = Math.min(totalId3Size, bytes.length);

      while (frameOffset + 10 <= id3End) {
        if (bytes[frameOffset] === 0) break; // Padding reached

        let frameId = readFourCC(bytes, frameOffset);
        let frameSize = 0;
        let headerLen = 10;

        if (majorVer === 2) {
          // ID3v2.2: 3-char IDs & 3-byte size
          frameId = String.fromCharCode(bytes[frameOffset], bytes[frameOffset + 1], bytes[frameOffset + 2]);
          frameSize = (bytes[frameOffset + 3] << 16) | (bytes[frameOffset + 4] << 8) | bytes[frameOffset + 5];
          headerLen = 6;
        } else if (majorVer === 4) {
          // ID3v2.4 synchsafe integer
          frameSize =
            ((bytes[frameOffset + 4] & 0x7f) << 21) |
            ((bytes[frameOffset + 5] & 0x7f) << 14) |
            ((bytes[frameOffset + 6] & 0x7f) << 7) |
            (bytes[frameOffset + 7] & 0x7f);
        } else {
          // ID3v2.3 standard 32-bit BE
          frameSize = readUint32BE(bytes, frameOffset + 4);
        }

        if (frameSize <= 0 || frameOffset + headerLen + frameSize > id3End) {
          break;
        }

        const payloadStart = frameOffset + headerLen;
        const payloadBytes = bytes.subarray(payloadStart, payloadStart + frameSize);

        // Parsear texto ou APIC
        if (frameId.startsWith("T") && frameId !== "TXXX") {
          const encoding = payloadBytes[0] || 0;
          let text = "";
          try {
            text = new TextDecoder(encoding === 1 || encoding === 2 ? "utf-16le" : "utf-8")
              .decode(payloadBytes.subarray(1))
              .replace(/\0+$/, "")
              .trim();
          } catch {
            text = decodeAsciiOrUtf8(payloadBytes.subarray(1));
          }

          if (text) {
            const frameLabels: Record<string, string> = {
              TIT2: "Título",
              TT2: "Título",
              TPE1: "Artista / Intérprete",
              TP1: "Artista",
              TALB: "Álbum",
              TAL: "Álbum",
              TPE2: "Artista do Álbum",
              TCOM: "Compositor",
              TCON: "Gênero",
              TCO: "Gênero",
              TYER: "Ano",
              TYE: "Ano",
              TDRC: "Data de Gravação",
              TRCK: "Faixa / Número",
              TRK: "Faixa",
              TPOS: "Disco / Volume",
              TSRC: "Código ISRC",
              TBPM: "BPM / Andamento",
              TPUB: "Gravadora / Publisher",
              TCOP: "Copyright",
              TENC: "Codificador / Software",
              TSSE: "Configurações de Codificação",
            };

            const label = frameLabels[frameId] || `Frame [${frameId}]`;
            const isSoftware = frameId === "TENC" || frameId === "TSSE";

            fields.push({
              id: `id3_${frameId}_${frameOffset}`,
              label,
              value: text,
              source: `ID3v2.${majorVer}`,
              category: isSoftware ? "SOFTWARE_ORIGIN" : "IDENTIFICATION",
              isRemovable: true,
            });

            if (isSoftware) {
              softwareAndOrigin.encoder = text;
            }
          }
        } else if (frameId === "COMM" || frameId === "COM") {
          // Comentário
          const encoding = payloadBytes[0] || 0;
          let commentText = "";
          try {
            commentText = new TextDecoder(encoding === 1 || encoding === 2 ? "utf-16le" : "utf-8")
              .decode(payloadBytes.subarray(4))
              .replace(/\0+$/, "")
              .trim();
          } catch {
            commentText = decodeAsciiOrUtf8(payloadBytes.subarray(4));
          }

          if (commentText) {
            fields.push({
              id: `id3_comm_${frameOffset}`,
              label: "Comentário",
              value: commentText,
              source: `ID3v2.${majorVer}`,
              category: "IDENTIFICATION",
              isRemovable: true,
            });

            if (commentText.toLowerCase().includes("suno")) {
              softwareAndOrigin.isSunoAIGenerated = true;
              softwareAndOrigin.sunoDetails = {
                modelOrPrompt: "Suno Studio",
                fullComment: commentText,
              };
            }
          }
        } else if (frameId === "APIC" || frameId === "PIC") {
          // Artwork
          artwork.present = true;
          artwork.sizeBytes = frameSize;
          fields.push({
            id: `id3_apic_${frameOffset}`,
            label: "Capa do Álbum (Artwork)",
            value: `Imagem incorporada (${formatBytes(frameSize)})`,
            source: `ID3v2.${majorVer}`,
            category: "CONTAINER_TAG",
            isRemovable: true,
          });
        }

        frameOffset += headerLen + frameSize;
      }
    }

    // 2. Inspecionar ID3v1 no final (128 bytes)
    if (bytes.length >= 128) {
      const tailOffset = bytes.length - 128;
      if (bytes[tailOffset] === 0x54 && bytes[tailOffset + 1] === 0x41 && bytes[tailOffset + 2] === 0x47) {
        audioEndOffset = tailOffset;
        rawChunks.push({
          id: "ID3v1",
          name: "ID3v1 Tag Trailer",
          offset: tailOffset,
          size: 128,
          type: "METADATA",
          description: "Metadados legados ID3v1 no final do arquivo",
          isRemovable: true,
        });

        const v1Title = decodeAsciiOrUtf8(bytes.subarray(tailOffset + 3, tailOffset + 33));
        const v1Artist = decodeAsciiOrUtf8(bytes.subarray(tailOffset + 33, tailOffset + 63));
        const v1Album = decodeAsciiOrUtf8(bytes.subarray(tailOffset + 63, tailOffset + 93));

        if (v1Title) fields.push({ id: "id3v1_title", label: "Título (ID3v1)", value: v1Title, source: "ID3v1", category: "IDENTIFICATION", isRemovable: true });
        if (v1Artist) fields.push({ id: "id3v1_artist", label: "Artista (ID3v1)", value: v1Artist, source: "ID3v1", category: "IDENTIFICATION", isRemovable: true });
        if (v1Album) fields.push({ id: "id3v1_album", label: "Álbum (ID3v1)", value: v1Album, source: "ID3v1", category: "IDENTIFICATION", isRemovable: true });
      }
    }

    // 3. Audio stream chunk
    const audioDataSize = Math.max(0, audioEndOffset - audioStartOffset);
    rawChunks.push({
      id: "MPEG_FRAMES",
      name: "MPEG Audio Stream",
      offset: audioStartOffset,
      size: audioDataSize,
      type: "AUDIO_STREAM",
      description: `Fluxo de quadros de áudio MPEG (${formatBytes(audioDataSize)})`,
      isRemovable: false,
    });

    // Análise rápida do primeiro header MPEG para dados técnicos
    let sampleRate = 44100;
    let bitrateKbps = 320;
    let channels = 2;

    if (audioStartOffset + 4 <= bytes.length) {
      const b0 = bytes[audioStartOffset];
      const b1 = bytes[audioStartOffset + 1];
      const b2 = bytes[audioStartOffset + 2];
      const b3 = bytes[audioStartOffset + 3];

      if (b0 === 0xff && (b1 & 0xe0) === 0xe0) {
        const bitrateIdx = (b2 >> 4) & 0x0f;
        const sampleRateIdx = (b2 >> 2) & 0x03;
        const channelMode = (b3 >> 6) & 0x03;

        const bitrateTable = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
        const sampleRates = [44100, 48000, 32000, 44100];

        bitrateKbps = bitrateTable[bitrateIdx] || 320;
        sampleRate = sampleRates[sampleRateIdx] || 44100;
        channels = channelMode === 3 ? 1 : 2;
      }
    }

    const durationSeconds = bitrateKbps > 0 ? (audioDataSize * 8) / (bitrateKbps * 1000) : 0;

    const technical: TechnicalProperties = {
      format: "MP3",
      container: "MPEG-1/2 Audio Layer III (.mp3)",
      codec: "MP3 (MPEG-1 Layer 3)",
      durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
      fileSizeBytes: bytes.length,
      fileSizeFormatted: formatBytes(bytes.length),
      sampleRateHz: sampleRate,
      bitDepth: 16,
      channels,
      channelsDescription: channels === 1 ? "1 canal (Mono)" : "2 canais (Estéreo)",
      bitrateKbps,
      isLossless: false,
      audioDataOffset: audioStartOffset,
      audioDataLength: audioDataSize,
    };

    const removableItems = fields.filter((f) => f.isRemovable);

    return {
      sessionId: `mp3_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "audio/mpeg",
      lastModified: file.lastModified,
      format: "MP3",
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

    let start = 0;
    // Pular ID3v2
    if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const tagSize =
        ((bytes[6] & 0x7f) << 21) |
        ((bytes[7] & 0x7f) << 14) |
        ((bytes[8] & 0x7f) << 7) |
        (bytes[9] & 0x7f);
      start = 10 + tagSize;
    }

    let end = bytes.length;
    // Pular ID3v1 no final
    if (end >= 128 && bytes[end - 128] === 0x54 && bytes[end - 127] === 0x41 && bytes[end - 126] === 0x47) {
      end -= 128;
    }

    // Pular APEv2
    if (end >= 32 && bytes[end - 32] === 0x41 && bytes[end - 31] === 0x50 && bytes[end - 30] === 0x45) {
      const apeSize =
        bytes[end - 20] |
        (bytes[end - 19] << 8) |
        (bytes[end - 18] << 16) |
        (bytes[end - 17] << 24);
      if (apeSize > 0 && end - apeSize >= start) {
        end -= apeSize;
      }
    }

    const cleanAudioBytes = bytes.subarray(start, end);
    const cleanedBlob = new Blob([cleanAudioBytes], { type: "audio/mpeg" });

    return { cleanedBlob, removedItems, removedChunks };
  }

  async write(file: File, bytes: Uint8Array, metadata: EditableMetadataInput): Promise<Blob> {
    const { cleanedBlob } = await this.clean(file, bytes);
    const cleanAudioBytes = new Uint8Array(await cleanedBlob.arrayBuffer());

    // Se nenhum metadado novo foi fornecido, retornar áudio limpo
    const frames: Array<{ id: string; data: Uint8Array }> = [];
    const encoder = new TextEncoder();

    const makeTextFrame = (id: string, text: string) => {
      const utf8 = encoder.encode(text);
      const data = new Uint8Array(1 + utf8.length);
      data[0] = 3; // UTF-8 encoding flag
      data.set(utf8, 1);
      return { id, data };
    };

    if (metadata.title) frames.push(makeTextFrame("TIT2", metadata.title));
    if (metadata.artist) frames.push(makeTextFrame("TPE1", metadata.artist));
    if (metadata.album) frames.push(makeTextFrame("TALB", metadata.album));
    if (metadata.albumArtist) frames.push(makeTextFrame("TPE2", metadata.albumArtist));
    if (metadata.year) frames.push(makeTextFrame("TYER", metadata.year));
    if (metadata.genre) frames.push(makeTextFrame("TCON", metadata.genre));
    if (metadata.composer) frames.push(makeTextFrame("TCOM", metadata.composer));
    if (metadata.trackNumber) {
      const val = metadata.trackTotal ? `${metadata.trackNumber}/${metadata.trackTotal}` : metadata.trackNumber;
      frames.push(makeTextFrame("TRCK", val));
    }
    if (metadata.discNumber) {
      const val = metadata.discTotal ? `${metadata.discNumber}/${metadata.discTotal}` : metadata.discNumber;
      frames.push(makeTextFrame("TPOS", val));
    }
    if (metadata.isrc) frames.push(makeTextFrame("TSRC", metadata.isrc));
    if (metadata.bpm) frames.push(makeTextFrame("TBPM", metadata.bpm));
    if (metadata.publisher) frames.push(makeTextFrame("TPUB", metadata.publisher));
    if (metadata.copyright) frames.push(makeTextFrame("TCOP", metadata.copyright));

    if (metadata.comment) {
      // COMM frame: encoding(1) + lang(3) + shortDesc(1) + fullText
      const commentUtf8 = encoder.encode(metadata.comment);
      const commData = new Uint8Array(1 + 3 + 1 + commentUtf8.length);
      commData[0] = 3; // UTF-8
      commData[1] = 0x65; // 'e'
      commData[2] = 0x6e; // 'n'
      commData[3] = 0x67; // 'g'
      commData[4] = 0; // null separator
      commData.set(commentUtf8, 5);
      frames.push({ id: "COMM", data: commData });
    }

    // Artwork APIC
    if (metadata.artwork?.rawBuffer) {
      const mime = encoder.encode(metadata.artwork.mimeType || "image/jpeg");
      const imgBytes = metadata.artwork.rawBuffer;
      const apicData = new Uint8Array(1 + mime.length + 1 + 1 + 1 + imgBytes.length);
      let p = 0;
      apicData[p++] = 0; // ISO-8859-1 for mime/desc
      apicData.set(mime, p);
      p += mime.length;
      apicData[p++] = 0; // null terminate mime
      apicData[p++] = 3; // Picture type 3 = Cover (front)
      apicData[p++] = 0; // empty description + null
      apicData.set(imgBytes, p);
      frames.push({ id: "APIC", data: apicData });
    }

    if (frames.length === 0) {
      return cleanedBlob;
    }

    // Calcular tamanho total dos frames ID3v2.3
    let totalFramesSize = 0;
    for (const f of frames) {
      totalFramesSize += 10 + f.data.length; // 10-byte header per frame
    }

    // Header ID3v2 (10 bytes) com tamanho synchsafe
    const synchsafeTagSize = totalFramesSize;
    const s0 = (synchsafeTagSize >> 21) & 0x7f;
    const s1 = (synchsafeTagSize >> 14) & 0x7f;
    const s2 = (synchsafeTagSize >> 7) & 0x7f;
    const s3 = synchsafeTagSize & 0x7f;

    const id3Header = new Uint8Array(10);
    id3Header[0] = 0x49; // 'I'
    id3Header[1] = 0x44; // 'D'
    id3Header[2] = 0x33; // '3'
    id3Header[3] = 3; // ID3v2.3
    id3Header[4] = 0; // revision
    id3Header[5] = 0; // flags
    id3Header[6] = s0;
    id3Header[7] = s1;
    id3Header[8] = s2;
    id3Header[9] = s3;

    // Buffer de frames
    const framesBuffer = new Uint8Array(totalFramesSize);
    let ptr = 0;
    for (const f of frames) {
      // 4-char ID
      framesBuffer[ptr++] = f.id.charCodeAt(0);
      framesBuffer[ptr++] = f.id.charCodeAt(1);
      framesBuffer[ptr++] = f.id.charCodeAt(2);
      framesBuffer[ptr++] = f.id.charCodeAt(3);

      // 4-byte size BE
      framesBuffer[ptr++] = (f.data.length >> 24) & 0xff;
      framesBuffer[ptr++] = (f.data.length >> 16) & 0xff;
      framesBuffer[ptr++] = (f.data.length >> 8) & 0xff;
      framesBuffer[ptr++] = f.data.length & 0xff;

      // 2-byte flags (0, 0)
      framesBuffer[ptr++] = 0;
      framesBuffer[ptr++] = 0;

      // Data
      framesBuffer.set(f.data, ptr);
      ptr += f.data.length;
    }

    return new Blob([id3Header, framesBuffer, cleanAudioBytes], { type: "audio/mpeg" });
  }
}
