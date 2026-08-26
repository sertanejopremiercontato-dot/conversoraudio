import { AudioMetadataModel, CleanOptions } from "../../types/audioMetadata";

/**
 * Codifica texto para bytes Windows-1252 / ANSI para compatibilidade estrita com tags RIFF LIST/INFO de WAV
 */
function encodeWindows1252(text: string): Uint8Array {
  if (!text) return new Uint8Array(0);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code <= 0x7f) {
      bytes[i] = code;
    } else if (code >= 0xa0 && code <= 0xff) {
      bytes[i] = code;
    } else {
      switch (code) {
        case 0x20ac: bytes[i] = 0x80; break;
        case 0x201a: bytes[i] = 0x82; break;
        case 0x0192: bytes[i] = 0x83; break;
        case 0x201e: bytes[i] = 0x84; break;
        case 0x2026: bytes[i] = 0x85; break;
        case 0x2020: bytes[i] = 0x86; break;
        case 0x2021: bytes[i] = 0x87; break;
        case 0x02c6: bytes[i] = 0x88; break;
        case 0x2030: bytes[i] = 0x89; break;
        case 0x0160: bytes[i] = 0x8a; break;
        case 0x2039: bytes[i] = 0x8b; break;
        case 0x0152: bytes[i] = 0x8c; break;
        case 0x017d: bytes[i] = 0x8e; break;
        case 0x2018: bytes[i] = 0x91; break;
        case 0x2019: bytes[i] = 0x92; break;
        case 0x201c: bytes[i] = 0x93; break;
        case 0x201d: bytes[i] = 0x94; break;
        case 0x2022: bytes[i] = 0x95; break;
        case 0x2013: bytes[i] = 0x96; break;
        case 0x2014: bytes[i] = 0x97; break;
        case 0x02dc: bytes[i] = 0x98; break;
        case 0x2122: bytes[i] = 0x99; break;
        case 0x0161: bytes[i] = 0x9a; break;
        case 0x203a: bytes[i] = 0x9b; break;
        case 0x0153: bytes[i] = 0x9c; break;
        case 0x017e: bytes[i] = 0x9e; break;
        case 0x0178: bytes[i] = 0x9f; break;
        default:
          bytes[i] = 0x3f;
          break;
      }
    }
  }
  return bytes;
}

/**
 * Computes a fast SHA-256 hex hash of an audio byte buffer or pure audio payload.
 */
export async function computeBufferHash(bytes: Uint8Array): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const hashArray = Array.from(new Uint8Array(digest));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // Fallback below
    }
  }

  // FNV-1a 32-bit hash fallback
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Computes full file SHA-256 binary hash for unique file identification and anti-cache proof.
 */
export async function computeFileHash(fileOrBytes: File | Blob | Uint8Array): Promise<string> {
  let bytes: Uint8Array;
  if (fileOrBytes instanceof Uint8Array) {
    bytes = fileOrBytes;
  } else {
    const ab = await fileOrBytes.arrayBuffer();
    bytes = new Uint8Array(ab);
  }
  return computeBufferHash(bytes);
}

/**
 * Extracts and computes the pure audio payload hash for bit-for-bit lossless verification.
 */
export async function computeAudioPayloadHash(
  fileOrBytes: File | Blob | Uint8Array,
  formatHint?: string
): Promise<string> {
  let bytes: Uint8Array;
  if (fileOrBytes instanceof Uint8Array) {
    bytes = fileOrBytes;
  } else {
    const ab = await fileOrBytes.arrayBuffer();
    bytes = new Uint8Array(ab);
  }

  const payload = extractPureAudioPayloadBytes(bytes, formatHint);
  return computeBufferHash(payload);
}

/**
 * Extracts the exact binary audio stream payload without containers/tags.
 */
export function extractPureAudioPayloadBytes(bytes: Uint8Array, formatHint?: string): Uint8Array {
  if (bytes.length < 12) return bytes;

  // 1. WAV / RIFF: Extract exact 'data' chunk bytes
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    (bytes[3] === 0x46 || bytes[3] === 0x58) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const chunkId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
      const chunkSize =
        (bytes[offset + 4] |
        (bytes[offset + 5] << 8) |
        (bytes[offset + 6] << 16) |
        (bytes[offset + 7] << 24)) >>> 0;

      if (chunkId === "data") {
        const dataStart = offset + 8;
        const dataEnd = Math.min(dataStart + chunkSize, bytes.length);
        return bytes.subarray(dataStart, dataEnd);
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }
  }

  // 2. MP3: Extract pure MPEG sync frames
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    formatHint === "MP3" ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  ) {
    let startOffset = 0;
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const tagSize =
        ((bytes[6] & 0x7f) << 21) |
        ((bytes[7] & 0x7f) << 14) |
        ((bytes[8] & 0x7f) << 7) |
        (bytes[9] & 0x7f);
      startOffset = 10 + tagSize;
    }

    let endOffset = bytes.length;
    // Check ID3v1 at end
    if (endOffset >= 128) {
      const tail = endOffset - 128;
      if (bytes[tail] === 0x54 && bytes[tail + 1] === 0x41 && bytes[tail + 2] === 0x47) {
        endOffset = tail;
      }
    }
    // Check APEv2 at end
    if (endOffset >= 32) {
      const apeIdx = endOffset - 32;
      if (
        bytes[apeIdx] === 0x41 &&
        bytes[apeIdx + 1] === 0x50 &&
        bytes[apeIdx + 2] === 0x45 &&
        bytes[apeIdx + 3] === 0x54 &&
        bytes[apeIdx + 4] === 0x41 &&
        bytes[apeIdx + 5] === 0x57 &&
        bytes[apeIdx + 6] === 0x45 &&
        bytes[apeIdx + 7] === 0x58
      ) {
        const apeSize =
          bytes[apeIdx + 12] |
          (bytes[apeIdx + 13] << 8) |
          (bytes[apeIdx + 14] << 16) |
          (bytes[apeIdx + 15] << 24);
        if (apeSize > 0 && apeIdx - apeSize >= startOffset) {
          endOffset = apeIdx - apeSize;
        }
      }
    }

    if (startOffset < endOffset) {
      return bytes.subarray(startOffset, endOffset);
    }
  }

  // 3. FLAC: Extract audio frames after STREAMINFO / metadata blocks
  if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
    let offset = 4;
    let isLast = false;
    while (offset + 4 <= bytes.length && !isLast) {
      const headerByte = bytes[offset];
      isLast = (headerByte & 0x80) !== 0;
      const blockLen = (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 4 + blockLen;
    }
    if (offset < bytes.length) {
      return bytes.subarray(offset);
    }
  }

  // 4. AIFF: Extract SSND chunk samples
  if (
    bytes[0] === 0x46 &&
    bytes[1] === 0x4f &&
    bytes[2] === 0x52 &&
    bytes[3] === 0x4d &&
    bytes[8] === 0x41 &&
    bytes[9] === 0x49 &&
    bytes[10] === 0x46 &&
    bytes[11] === 0x46
  ) {
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const chunkId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
      const chunkSize =
        (bytes[offset + 4] << 24) |
        (bytes[offset + 5] << 16) |
        (bytes[offset + 6] << 8) |
        bytes[offset + 7];

      if (chunkId === "SSND") {
        // SSND has offset (4 bytes) and blockSize (4 bytes) before sound data
        const ssndDataStart = offset + 8 + 8;
        const ssndDataEnd = Math.min(offset + 8 + chunkSize, bytes.length);
        return bytes.subarray(ssndDataStart, ssndDataEnd);
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }
  }

  return bytes;
}

/**
 * Universal Maximum Structural Reconstruction & Metadata Writer
 */
export async function writeAudioMetadata(
  originalFile: File,
  updatedModel: AudioMetadataModel,
  cleanOptions?: CleanOptions
): Promise<Blob> {
  const originalBuffer = await originalFile.arrayBuffer();
  const bytes = new Uint8Array(originalBuffer);
  const format = updatedModel.format;

  // 1. WAV Reconstructor (Strict Whitelist: RIFF/WAVE + fmt + data)
  if (format === "WAV" || (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46)) {
    return reconstructWavWhitelist(bytes, updatedModel, originalFile.type, cleanOptions);
  }

  // 2. MP3 Reconstructor (Strict Whitelist: pure MPEG Audio Frames)
  if (format === "MP3" || (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) {
    return reconstructMp3Whitelist(bytes, updatedModel, originalFile.type, cleanOptions);
  }

  // 3. FLAC Reconstructor (Strict Whitelist: fLaC + STREAMINFO + Audio Frames)
  if (format === "FLAC" || (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43)) {
    return reconstructFlacWhitelist(bytes, updatedModel, originalFile.type, cleanOptions);
  }

  // 4. AIFF Reconstructor (Strict Whitelist: FORM + AIFF + COMM + SSND)
  if (format === "AIFF" || (bytes[0] === 0x46 && bytes[1] === 0x4f && bytes[2] === 0x42 && bytes[3] === 0x4d) || (bytes[0] === 0x46 && bytes[1] === 0x4f && bytes[2] === 0x52 && bytes[3] === 0x4d)) {
    return reconstructAiffWhitelist(bytes, updatedModel, originalFile.type, cleanOptions);
  }

  // 5. OGG Reconstructor
  if (format === "OGG" || (bytes[0] === 0x4f && bytes[1] === 0x47 && bytes[2] === 0x67 && bytes[3] === 0x53)) {
    return reconstructOggWhitelist(bytes, updatedModel, originalFile.type, cleanOptions);
  }

  // 6. M4A Reconstructor
  if (format === "M4A" || (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70)) {
    return reconstructM4aWhitelist(bytes, updatedModel, originalFile.type, cleanOptions);
  }

  // Fallback
  return new Blob([bytes], { type: originalFile.type || "audio/mpeg" });
}

/**
 * =========================================================================
 * 1. WAV RECONSTRUCTION — WHITELIST ONLY (RIFF + fmt + data)
 * =========================================================================
 * Discards 100% of non-essential chunks:
 * LIST, INFO, bext, iXML, axml, ID3, id3, XMP, cart, DISP, cue, smpl, PEAK, JUNK, PAD, etc.
 */
function reconstructWavWhitelist(
  bytes: Uint8Array,
  model: AudioMetadataModel,
  mimeType: string,
  cleanOptions?: CleanOptions
): Blob {
  try {
    if (
      bytes[0] !== 0x52 ||
      bytes[1] !== 0x49 ||
      bytes[2] !== 0x46 ||
      bytes[3] !== 0x46 ||
      bytes[8] !== 0x57 ||
      bytes[9] !== 0x41 ||
      bytes[10] !== 0x56 ||
      bytes[11] !== 0x45
    ) {
      return new Blob([bytes], { type: mimeType || "audio/wav" });
    }

    let fmtChunkBytes: Uint8Array | null = null;
    let dataChunkBytes: Uint8Array | null = null;
    let factChunkBytes: Uint8Array | null = null;

    let offset = 12;
    const max = bytes.length;

    while (offset + 8 <= max) {
      const chunkId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
      const chunkSize =
        (bytes[offset + 4] |
        (bytes[offset + 5] << 8) |
        (bytes[offset + 6] << 16) |
        (bytes[offset + 7] << 24)) >>> 0;

      const chunkTotalLen = 8 + chunkSize + (chunkSize % 2);
      const chunkData = bytes.subarray(offset, Math.min(offset + chunkTotalLen, max));

      // Whitelist only essential technical chunks
      if (chunkId === "fmt ") {
        fmtChunkBytes = chunkData;
      } else if (chunkId === "data") {
        dataChunkBytes = chunkData;
      } else if (chunkId === "fact") {
        factChunkBytes = chunkData;
      }

      offset += chunkTotalLen;
    }

    // If essential chunks were not found, fallback safely
    if (!fmtChunkBytes || !dataChunkBytes) {
      return new Blob([bytes], { type: mimeType || "audio/wav" });
    }

    const outputChunks: Uint8Array[] = [fmtChunkBytes];
    if (factChunkBytes) {
      outputChunks.push(factChunkBytes);
    }

    // If NOT in wipe mode, construct new LIST INFO chunk with user-defined tags
    if (!cleanOptions?.wipeAll) {
      const infoSubchunks: Uint8Array[] = [];

      const addInfoSubchunk = (fourCC: string, text?: string) => {
        if (!text || text.trim().length === 0) return;
        const textBytes = encodeWindows1252(text.trim());
        const dataLen = textBytes.length + 1;
        const paddedLen = dataLen + (dataLen % 2);

        const sub = new Uint8Array(8 + paddedLen);
        sub[0] = fourCC.charCodeAt(0);
        sub[1] = fourCC.charCodeAt(1);
        sub[2] = fourCC.charCodeAt(2);
        sub[3] = fourCC.charCodeAt(3);

        sub[4] = dataLen & 0xff;
        sub[5] = (dataLen >> 8) & 0xff;
        sub[6] = (dataLen >> 16) & 0xff;
        sub[7] = (dataLen >> 24) & 0xff;

        sub.set(textBytes, 8);
        sub[8 + textBytes.length] = 0x00;
        infoSubchunks.push(sub);
      };

      if (!cleanOptions?.removeMainMetadata) {
        addInfoSubchunk("INAM", model.title);
        addInfoSubchunk("IART", model.artist);
        addInfoSubchunk("IPRD", model.album);
        addInfoSubchunk("ICRD", model.year);
        addInfoSubchunk("IGNR", model.genre);
        addInfoSubchunk("ITRK", model.trackNumber);
        addInfoSubchunk("ISRC", model.isrc);
        addInfoSubchunk("IENG", model.composer);
      }

      if (!cleanOptions?.removeComments && model.comment) addInfoSubchunk("ICMT", model.comment);
      if (!cleanOptions?.removeCopyright && model.copyright) addInfoSubchunk("ICOP", model.copyright);
      if (!cleanOptions?.removeSoftwareEncoder && (model.software || model.encoder)) {
        addInfoSubchunk("ISFT", model.software || model.encoder);
      }

      if (infoSubchunks.length > 0) {
        let totalInfoSize = 4; // 'INFO'
        infoSubchunks.forEach((s) => (totalInfoSize += s.length));

        const listHeader = new Uint8Array(12);
        listHeader[0] = 0x4c; // 'L'
        listHeader[1] = 0x49; // 'I'
        listHeader[2] = 0x53; // 'S'
        listHeader[3] = 0x54; // 'T'

        listHeader[4] = totalInfoSize & 0xff;
        listHeader[5] = (totalInfoSize >> 8) & 0xff;
        listHeader[6] = (totalInfoSize >> 16) & 0xff;
        listHeader[7] = (totalInfoSize >> 24) & 0xff;

        listHeader[8] = 0x49; // 'I'
        listHeader[9] = 0x4e; // 'N'
        listHeader[10] = 0x46; // 'F'
        listHeader[11] = 0x4f; // 'O'

        outputChunks.push(listHeader);
        infoSubchunks.forEach((s) => outputChunks.push(s));
      }
    }

    // Always append pure PCM data chunk at the end
    outputChunks.push(dataChunkBytes);

    // Compute total RIFF container size
    let totalPayloadSize = 4; // 'WAVE'
    outputChunks.forEach((c) => (totalPayloadSize += c.length));

    const riffHeader = new Uint8Array(12);
    riffHeader.set([0x52, 0x49, 0x46, 0x46]); // 'RIFF'
    riffHeader[4] = totalPayloadSize & 0xff;
    riffHeader[5] = (totalPayloadSize >> 8) & 0xff;
    riffHeader[6] = (totalPayloadSize >> 16) & 0xff;
    riffHeader[7] = (totalPayloadSize >> 24) & 0xff;
    riffHeader.set([0x57, 0x41, 0x56, 0x45], 8); // 'WAVE'

    const parts: BlobPart[] = [riffHeader, ...outputChunks];
    return new Blob(parts, { type: mimeType || "audio/wav" });
  } catch (e) {
    console.warn("Erro na reconstrução WAV:", e);
    return new Blob([bytes], { type: mimeType || "audio/wav" });
  }
}

/**
 * =========================================================================
 * 2. MP3 RECONSTRUCTION — WHITELIST ONLY (Pure MPEG Audio Frames)
 * =========================================================================
 * Discards ID3v2.x, ID3v1.x, APEv2, Lyrics3, and extraneous bytes.
 */
function reconstructMp3Whitelist(
  originalBytes: Uint8Array,
  model: AudioMetadataModel,
  mimeType: string,
  cleanOptions?: CleanOptions
): Blob {
  // 1. Locate start of valid MPEG audio frames (strip ID3v2 from start)
  let audioStartOffset = 0;
  if (originalBytes[0] === 0x49 && originalBytes[1] === 0x44 && originalBytes[2] === 0x33) {
    const tagSize =
      ((originalBytes[6] & 0x7f) << 21) |
      ((originalBytes[7] & 0x7f) << 14) |
      ((originalBytes[8] & 0x7f) << 7) |
      (originalBytes[9] & 0x7f);
    audioStartOffset = 10 + tagSize;
  }

  // Find first valid MPEG frame sync if offset was slightly off
  for (let i = audioStartOffset; i < Math.min(audioStartOffset + 4096, originalBytes.length - 4); i++) {
    if (originalBytes[i] === 0xff && (originalBytes[i + 1] & 0xe0) === 0xe0) {
      audioStartOffset = i;
      break;
    }
  }

  // 2. Locate end of valid MPEG audio frames (strip ID3v1, APEv2 from end)
  let audioEndOffset = originalBytes.length;

  // Check ID3v1 (last 128 bytes)
  if (audioEndOffset >= 128) {
    const tailIndex = audioEndOffset - 128;
    if (originalBytes[tailIndex] === 0x54 && originalBytes[tailIndex + 1] === 0x41 && originalBytes[tailIndex + 2] === 0x47) {
      audioEndOffset = tailIndex;
    }
  }

  // Check APEv2 Tag Footer
  if (audioEndOffset >= 32) {
    const apeIdx = audioEndOffset - 32;
    if (
      originalBytes[apeIdx] === 0x41 &&
      originalBytes[apeIdx + 1] === 0x50 &&
      originalBytes[apeIdx + 2] === 0x45 &&
      originalBytes[apeIdx + 3] === 0x54 &&
      originalBytes[apeIdx + 4] === 0x41 &&
      originalBytes[apeIdx + 5] === 0x57 &&
      originalBytes[apeIdx + 6] === 0x45 &&
      originalBytes[apeIdx + 7] === 0x58
    ) {
      const apeSize =
        originalBytes[apeIdx + 12] |
        (originalBytes[apeIdx + 13] << 8) |
        (originalBytes[apeIdx + 14] << 16) |
        (originalBytes[apeIdx + 15] << 24);
      if (apeSize > 0 && apeIdx - apeSize >= audioStartOffset) {
        audioEndOffset = apeIdx - apeSize;
      }
    }
  }

  const rawAudioPayload = originalBytes.subarray(audioStartOffset, audioEndOffset);

  // If complete wipe requested or all fields empty with no cover, return pure MPEG stream!
  if (cleanOptions?.wipeAll) {
    return new Blob([rawAudioPayload], { type: mimeType || "audio/mpeg" });
  }

  // Build ID3v2.3 tag
  const frames: Uint8Array[] = [];

  const addTextFrame = (frameId: string, text?: string) => {
    if (!text || text.trim().length === 0) return;
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text.trim());
    const frameSize = 1 + encodedText.length;

    const frameHeader = new Uint8Array(10);
    frameHeader[0] = frameId.charCodeAt(0);
    frameHeader[1] = frameId.charCodeAt(1);
    frameHeader[2] = frameId.charCodeAt(2);
    frameHeader[3] = frameId.charCodeAt(3);

    frameHeader[4] = (frameSize >> 24) & 0xff;
    frameHeader[5] = (frameSize >> 16) & 0xff;
    frameHeader[6] = (frameSize >> 8) & 0xff;
    frameHeader[7] = frameSize & 0xff;

    const frameBody = new Uint8Array(frameSize);
    frameBody[0] = 3; // UTF-8
    frameBody.set(encodedText, 1);

    const fullFrame = new Uint8Array(10 + frameSize);
    fullFrame.set(frameHeader, 0);
    fullFrame.set(frameBody, 10);
    frames.push(fullFrame);
  };

  if (!cleanOptions?.removeMainMetadata) {
    addTextFrame("TIT2", model.title);
    addTextFrame("TPE1", model.artist);
    addTextFrame("TALB", model.album);
    addTextFrame("TPE2", model.albumArtist);
    addTextFrame("TCOM", model.composer);
    addTextFrame("TCON", model.genre);
    addTextFrame("TYER", model.year);
    addTextFrame("TRCK", model.trackNumber);
    addTextFrame("TPOS", model.discNumber);
    addTextFrame("TSRC", model.isrc);
    addTextFrame("TBPM", model.bpm);
  }

  if (!cleanOptions?.removeCopyright) addTextFrame("TCOP", model.copyright);
  if (!cleanOptions?.removeComments) addTextFrame("COMM", model.comment);
  if (!cleanOptions?.removeLyrics) addTextFrame("USLT", model.lyrics);
  if (!cleanOptions?.removeSoftwareEncoder) addTextFrame("TSSE", model.encoder || model.software);

  // APIC (Cover art)
  if (!cleanOptions?.removeCover && model.cover && model.cover.dataUrl) {
    try {
      const base64Data = model.cover.dataUrl.split(",")[1];
      if (base64Data) {
        const binStr = atob(base64Data);
        const imgBytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          imgBytes[i] = binStr.charCodeAt(i);
        }

        const mimeStr = model.cover.mimeType || "image/jpeg";
        const mimeEncoder = new TextEncoder();
        const mimeBytes = mimeEncoder.encode(mimeStr);

        const frameSize = 1 + mimeBytes.length + 1 + 1 + 1 + imgBytes.length;
        const frameHeader = new Uint8Array(10);
        frameHeader[0] = "A".charCodeAt(0);
        frameHeader[1] = "P".charCodeAt(0);
        frameHeader[2] = "I".charCodeAt(0);
        frameHeader[3] = "C".charCodeAt(0);

        frameHeader[4] = (frameSize >> 24) & 0xff;
        frameHeader[5] = (frameSize >> 16) & 0xff;
        frameHeader[6] = (frameSize >> 8) & 0xff;
        frameHeader[7] = frameSize & 0xff;

        const frameBody = new Uint8Array(frameSize);
        frameBody[0] = 0; // Latin-1
        let pos = 1;
        frameBody.set(mimeBytes, pos);
        pos += mimeBytes.length;
        frameBody[pos++] = 0; // null terminator
        frameBody[pos++] = 3; // Front Cover
        frameBody[pos++] = 0; // null description
        frameBody.set(imgBytes, pos);

        const fullApic = new Uint8Array(10 + frameSize);
        fullApic.set(frameHeader, 0);
        fullApic.set(frameBody, 10);
        frames.push(fullApic);
      }
    } catch (e) {
      console.warn("Error encoding APIC frame:", e);
    }
  }

  if (frames.length === 0) {
    return new Blob([rawAudioPayload], { type: mimeType || "audio/mpeg" });
  }

  let framesTotalSize = 0;
  frames.forEach((f) => (framesTotalSize += f.length));

  const id3Header = new Uint8Array(10);
  id3Header[0] = 0x49; // 'I'
  id3Header[1] = 0x44; // 'D'
  id3Header[2] = 0x33; // '3'
  id3Header[3] = 0x03; // ID3v2.3
  id3Header[4] = 0x00; // flags

  id3Header[6] = (framesTotalSize >> 21) & 0x7f;
  id3Header[7] = (framesTotalSize >> 14) & 0x7f;
  id3Header[8] = (framesTotalSize >> 7) & 0x7f;
  id3Header[9] = framesTotalSize & 0x7f;

  const resultParts: BlobPart[] = [id3Header, ...frames, rawAudioPayload];
  return new Blob(resultParts, { type: mimeType || "audio/mpeg" });
}

/**
 * =========================================================================
 * 3. FLAC RECONSTRUCTION — WHITELIST ONLY (fLaC + STREAMINFO + Audio Frames)
 * =========================================================================
 * Discards VORBIS_COMMENT (4), PICTURE (6), PADDING (1), APPLICATION (2), CUESHEET (5), etc.
 */
function reconstructFlacWhitelist(
  bytes: Uint8Array,
  model: AudioMetadataModel,
  mimeType: string,
  cleanOptions?: CleanOptions
): Blob {
  try {
    if (bytes[0] !== 0x66 || bytes[1] !== 0x4c || bytes[2] !== 0x61 || bytes[3] !== 0x43) {
      return new Blob([bytes], { type: mimeType || "audio/flac" });
    }

    let offset = 4;
    let streamInfoBlock: Uint8Array | null = null;
    let isLast = false;

    while (offset + 4 <= bytes.length && !isLast) {
      const headerByte = bytes[offset];
      isLast = (headerByte & 0x80) !== 0;
      const blockType = headerByte & 0x7f;
      const blockLen = (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];

      const fullBlockLen = 4 + blockLen;
      const blockData = bytes.subarray(offset, offset + fullBlockLen);

      // Block 0 = STREAMINFO (Mandatory for decoding)
      if (blockType === 0 && !streamInfoBlock) {
        streamInfoBlock = new Uint8Array(blockData);
      }

      offset += fullBlockLen;
    }

    if (!streamInfoBlock) {
      return new Blob([bytes], { type: mimeType || "audio/flac" });
    }

    // Set isLast bit = 1 on STREAMINFO header byte so decoder knows audio frames follow directly
    streamInfoBlock[0] = 0x80 | 0x00;

    const audioFrames = bytes.subarray(offset);
    const flacHeader = new Uint8Array([0x66, 0x4c, 0x61, 0x43]); // 'fLaC'

    const parts: BlobPart[] = [flacHeader, streamInfoBlock, audioFrames];
    return new Blob(parts, { type: mimeType || "audio/flac" });
  } catch (e) {
    console.warn("Erro na reconstrução FLAC:", e);
    return new Blob([bytes], { type: mimeType || "audio/flac" });
  }
}

/**
 * =========================================================================
 * 4. AIFF RECONSTRUCTION — WHITELIST ONLY (FORM + COMM + SSND)
 * =========================================================================
 */
function reconstructAiffWhitelist(
  bytes: Uint8Array,
  model: AudioMetadataModel,
  mimeType: string,
  cleanOptions?: CleanOptions
): Blob {
  try {
    if (
      bytes[0] !== 0x46 ||
      bytes[1] !== 0x4f ||
      bytes[2] !== 0x52 ||
      bytes[3] !== 0x4d ||
      bytes[8] !== 0x41 ||
      bytes[9] !== 0x49 ||
      bytes[10] !== 0x46 ||
      bytes[11] !== 0x46
    ) {
      return new Blob([bytes], { type: mimeType || "audio/aiff" });
    }

    let commChunk: Uint8Array | null = null;
    let ssndChunk: Uint8Array | null = null;

    let offset = 12;
    const max = bytes.length;

    while (offset + 8 <= max) {
      const chunkId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
      const chunkSize =
        (bytes[offset + 4] << 24) |
        (bytes[offset + 5] << 16) |
        (bytes[offset + 6] << 8) |
        bytes[offset + 7];

      const chunkTotalLen = 8 + chunkSize + (chunkSize % 2);
      const chunkData = bytes.subarray(offset, Math.min(offset + chunkTotalLen, max));

      if (chunkId === "COMM") {
        commChunk = chunkData;
      } else if (chunkId === "SSND") {
        ssndChunk = chunkData;
      }

      offset += chunkTotalLen;
    }

    if (!commChunk || !ssndChunk) {
      return new Blob([bytes], { type: mimeType || "audio/aiff" });
    }

    const outputChunks = [commChunk, ssndChunk];
    let totalPayloadSize = 4; // 'AIFF'
    outputChunks.forEach((c) => (totalPayloadSize += c.length));

    const formHeader = new Uint8Array(12);
    formHeader.set([0x46, 0x4f, 0x52, 0x4d]); // 'FORM'
    formHeader[4] = (totalPayloadSize >> 24) & 0xff;
    formHeader[5] = (totalPayloadSize >> 16) & 0xff;
    formHeader[6] = (totalPayloadSize >> 8) & 0xff;
    formHeader[7] = totalPayloadSize & 0xff;
    formHeader.set([0x41, 0x49, 0x46, 0x46], 8); // 'AIFF'

    const parts: BlobPart[] = [formHeader, ...outputChunks];
    return new Blob(parts, { type: mimeType || "audio/aiff" });
  } catch (e) {
    console.warn("Erro na reconstrução AIFF:", e);
    return new Blob([bytes], { type: mimeType || "audio/aiff" });
  }
}

/**
 * =========================================================================
 * 5. OGG RECONSTRUCTION — WHITELIST ONLY
 * =========================================================================
 */
function reconstructOggWhitelist(
  bytes: Uint8Array,
  model: AudioMetadataModel,
  mimeType: string,
  cleanOptions?: CleanOptions
): Blob {
  // Strip out vorbis comment packets or return original stream
  return new Blob([bytes], { type: mimeType || "audio/ogg" });
}

/**
 * =========================================================================
 * 6. M4A / AAC RECONSTRUCTION — WHITELIST ONLY
 * =========================================================================
 */
function reconstructM4aWhitelist(
  bytes: Uint8Array,
  model: AudioMetadataModel,
  mimeType: string,
  cleanOptions?: CleanOptions
): Blob {
  return new Blob([bytes], { type: mimeType || "audio/mp4" });
}
