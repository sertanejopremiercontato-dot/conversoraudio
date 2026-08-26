/**
 * CRC32 implementation for PNG chunk validation and reconstruction
 */

const CRC_TABLE = new Uint32Array(256);

for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

export function computeCrc32(bytes: Uint8Array, offset = 0, length = bytes.length): number {
  let crc = 0xffffffff;
  const end = offset + length;
  for (let i = offset; i < end; i++) {
    const tableIndex = (crc ^ bytes[i]) & 0xff;
    crc = (crc >>> 8) ^ CRC_TABLE[tableIndex];
  }
  return (crc ^ 0xffffffff) >>> 0;
}
