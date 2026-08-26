import { AudioFormatCategory } from "../../types/audioMetadata";

export interface MagicBytesResult {
  isValidAudio: boolean;
  detectedFormat: AudioFormatCategory;
  detectedMime: string;
  isWhatsAppMedia: boolean;
  warning?: string;
}

export async function checkAudioMagicBytes(file: File): Promise<MagicBytesResult> {
  const headerBuffer = await file.slice(0, 2048).arrayBuffer();
  const bytes = new Uint8Array(headerBuffer);

  const fileName = file.name.toLowerCase();
  const isWhatsAppMedia =
    /whatsapp|ptt-\d|aud-\d/i.test(fileName) ||
    file.type === "" ||
    file.type === "application/octet-stream";

  // 1. ID3v2 (MP3) -> ID3 (0x49 0x44 0x33)
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return {
      isValidAudio: true,
      detectedFormat: "MP3",
      detectedMime: "audio/mpeg",
      isWhatsAppMedia
    };
  }

  // 2. MP3 Frame Sync without ID3 (0xFF 0xFB, 0xFF 0xF3, 0xFF 0xF2, 0xFF 0xE2)
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return {
      isValidAudio: true,
      detectedFormat: "MP3",
      detectedMime: "audio/mpeg",
      isWhatsAppMedia
    };
  }

  // 3. WAV (RIFF...WAVE)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return {
      isValidAudio: true,
      detectedFormat: "WAV",
      detectedMime: "audio/wav",
      isWhatsAppMedia
    };
  }

  // 4. FLAC (fLaC -> 0x66 0x4C 0x61 0x43)
  if (
    bytes[0] === 0x66 &&
    bytes[1] === 0x4c &&
    bytes[2] === 0x61 &&
    bytes[3] === 0x43
  ) {
    return {
      isValidAudio: true,
      detectedFormat: "FLAC",
      detectedMime: "audio/flac",
      isWhatsAppMedia
    };
  }

  // 5. M4A / MP4 (ftyp at offset 4)
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    const isAudioMp4 =
      brand.includes("M4A") ||
      brand.includes("mp42") ||
      brand.includes("isom") ||
      brand.includes("dash");

    return {
      isValidAudio: true,
      detectedFormat: "M4A",
      detectedMime: isAudioMp4 ? "audio/mp4" : "audio/x-m4a",
      isWhatsAppMedia
    };
  }

  // 6. OGG (OggS)
  if (
    bytes[0] === 0x4f &&
    bytes[1] === 0x67 &&
    bytes[2] === 0x67 &&
    bytes[3] === 0x53
  ) {
    return {
      isValidAudio: true,
      detectedFormat: "OGG",
      detectedMime: "audio/ogg",
      isWhatsAppMedia
    };
  }

  // Fallback by extension for WhatsApp / browser MIME anomalies
  if (fileName.endsWith(".mp3")) {
    return { isValidAudio: true, detectedFormat: "MP3", detectedMime: "audio/mpeg", isWhatsAppMedia };
  }
  if (fileName.endsWith(".wav")) {
    return { isValidAudio: true, detectedFormat: "WAV", detectedMime: "audio/wav", isWhatsAppMedia };
  }
  if (fileName.endsWith(".flac")) {
    return { isValidAudio: true, detectedFormat: "FLAC", detectedMime: "audio/flac", isWhatsAppMedia };
  }
  if (fileName.endsWith(".m4a") || fileName.endsWith(".mp4") || fileName.endsWith(".aac")) {
    return { isValidAudio: true, detectedFormat: "M4A", detectedMime: "audio/mp4", isWhatsAppMedia };
  }
  if (fileName.endsWith(".ogg") || fileName.endsWith(".opus")) {
    return { isValidAudio: true, detectedFormat: "OGG", detectedMime: "audio/ogg", isWhatsAppMedia };
  }

  return {
    isValidAudio: false,
    detectedFormat: "UNKNOWN",
    detectedMime: file.type || "application/octet-stream",
    isWhatsAppMedia
  };
}
