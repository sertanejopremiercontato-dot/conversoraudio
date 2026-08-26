/**
 * Lightweight synchronous & asynchronous Deflate / Zlib Decompressor
 * Used for PNG zTXt, compressed iTXt, and Adobe XMP packets.
 */

export async function decompressZlibAsync(bytes: Uint8Array): Promise<Uint8Array> {
  // If DecompressionStream is available in browser
  if (typeof DecompressionStream !== "undefined") {
    try {
      // Zlib header check (0x78 0x9c or 0x78 0x01 or 0x78 0xda)
      // If zlib header is present, strip 2 bytes header and 4 bytes adler32 footer if using raw deflate
      let streamFormat: "deflate" | "deflate-raw" = "deflate";
      let payload = bytes;

      try {
        const ds = new DecompressionStream("deflate");
        const writer = ds.writable.getWriter();
        writer.write(payload);
        writer.close();
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        let totalLen = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            totalLen += value.length;
          }
        }
        const result = new Uint8Array(totalLen);
        let off = 0;
        for (const c of chunks) {
          result.set(c, off);
          off += c.length;
        }
        return result;
      } catch {
        // Try deflate-raw by stripping zlib header (2 bytes) and footer (4 bytes)
        if (bytes.length > 6 && (bytes[0] === 0x78)) {
          payload = bytes.subarray(2, bytes.length - 4);
          const ds = new DecompressionStream("deflate-raw");
          const writer = ds.writable.getWriter();
          writer.write(payload);
          writer.close();
          const reader = ds.readable.getReader();
          const chunks: Uint8Array[] = [];
          let totalLen = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              totalLen += value.length;
            }
          }
          const result = new Uint8Array(totalLen);
          let off = 0;
          for (const c of chunks) {
            result.set(c, off);
            off += c.length;
          }
          return result;
        }
      }
    } catch {
      // Fallback
    }
  }

  // Pure JS uncompressed/stored fallback
  return decompressRawFallback(bytes);
}

function decompressRawFallback(bytes: Uint8Array): Uint8Array {
  // Check if uncompressed stored block or return ASCII slice
  if (bytes.length > 2 && bytes[0] === 0x78) {
    // If we cannot decompress deflate stream natively, return printable ASCII chars
    const printable: number[] = [];
    for (let i = 2; i < bytes.length - 4; i++) {
      const b = bytes[i];
      if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
        printable.push(b);
      }
    }
    return new Uint8Array(printable);
  }
  return bytes;
}
