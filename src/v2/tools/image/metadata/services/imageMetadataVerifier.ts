/**
 * Computes fast, secure SHA-256 hex hash of file bytes using Web Crypto API
 */
export async function computeImageSha256(bytes: Uint8Array): Promise<string> {
  const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
