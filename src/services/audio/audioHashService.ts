/**
 * Extracts and calculates the SHA-256 cryptographic hash of the pure raw audio payload.
 * Ignores metadata headers and trailers to ensure 100% lossless audio stream verification.
 */
export async function calculateAudioPayloadHash(fileOrBlob: Blob): Promise<string> {
  const buffer = await fileOrBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let startOffset = 0;
  let endOffset = bytes.length;

  // 1. Strip ID3v2 header if present (MP3)
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const tagSize =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);
    startOffset = 10 + tagSize;
  }

  // 2. Strip ID3v1 trailer if present (MP3)
  if (bytes.length >= 128) {
    const tailIndex = bytes.length - 128;
    if (bytes[tailIndex] === 0x54 && bytes[tailIndex + 1] === 0x41 && bytes[tailIndex + 2] === 0x47) {
      endOffset = tailIndex;
    }
  }

  // Slice pure audio payload
  const pureAudioPayload = bytes.subarray(startOffset, Math.max(startOffset + 10, endOffset));

  // Compute SHA-256 using SubtleCrypto API
  const hashBuffer = await crypto.subtle.digest("SHA-256", pureAudioPayload);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hexHash;
}
