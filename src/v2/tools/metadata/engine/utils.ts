/**
 * AUDIO METADATA ENGINE — UTILITIES
 */

import { DualVerificationResult } from "./types";

export function createDefaultDualVerification(): DualVerificationResult {
  return {
    engineA: {
      removableCount: 0,
      detectedTags: [],
      detectedTagTypes: [],
      status: "CLEAN",
      rawCount: 0,
    },
    engineB: {
      removableBlocksCount: 0,
      unknownBlocksCount: 0,
      essentialBlocksCount: 0,
      blocksFound: [],
      detectedSignatures: [],
      sunoDetected: false,
      status: "CLEAN",
    },
    verdict: "CLEAN_VERIFIED",
    isCleanVerified: true,
    hasDiscrepancy: false,
    statusMessage: "✓ Nenhum metadado extra encontrado",
    badgeReaderOk: true,
    badgeVerifierOk: true,
  };
}

export async function computeSha256(bytes: Uint8Array): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      // Fallback
    }
  }

  // FNV-1a 32-bit hash fallback if crypto.subtle unavailable
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}:${remMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
}

export function readFourCC(bytes: Uint8Array, offset: number): string {
  if (offset + 4 > bytes.length) return "";
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

export function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

export function readUint32BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

export function readUint16LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] | (bytes[offset + 1] << 8)) >>> 0;
}

export function readUint16BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 8) | bytes[offset + 1]) >>> 0;
}

export function decodeAsciiOrUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8").decode(bytes).replace(/\0+$/, "").trim();
  } catch {
    return String.fromCharCode(...Array.from(bytes)).replace(/\0+$/, "").trim();
  }
}

/**
 * Extracts pure audio payload bytes for verification without container wrappers
 */
export function extractAudioPayloadBytes(bytes: Uint8Array, format: string): Uint8Array {
  if (bytes.length < 12) return bytes;

  // WAV: 'data' chunk payload
  if (format === "WAV" || (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46)) {
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const chunkId = readFourCC(bytes, offset);
      const chunkSize = readUint32LE(bytes, offset + 4);
      if (chunkId === "data") {
        const start = offset + 8;
        const end = Math.min(start + chunkSize, bytes.length);
        return bytes.subarray(start, end);
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }
  }

  // MP3: MPEG sync frames (skip ID3v2 at start, skip ID3v1 / APEv2 at end)
  if (format === "MP3" || (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) {
    let start = 0;
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const tagSize = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
      start = 10 + tagSize;
    }

    let end = bytes.length;
    if (end >= 128 && bytes[end - 128] === 0x54 && bytes[end - 127] === 0x41 && bytes[end - 126] === 0x47) {
      end -= 128;
    }
    if (end >= 32 && bytes[end - 32] === 0x41 && bytes[end - 31] === 0x50 && bytes[end - 30] === 0x45) {
      const apeSize = readUint32LE(bytes, end - 20);
      if (apeSize > 0 && end - apeSize >= start) {
        end -= apeSize;
      }
    }

    if (start < end) {
      return bytes.subarray(start, end);
    }
  }

  // FLAC: raw audio frames after metadata blocks
  if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
    let offset = 4;
    let isLast = false;
    while (offset + 4 <= bytes.length && !isLast) {
      const headerByte = bytes[offset];
      isLast = (headerByte & 0x80) !== 0;
      const length = ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
      offset += 4 + length;
    }
    if (offset < bytes.length) {
      return bytes.subarray(offset);
    }
  }

  return bytes;
}
