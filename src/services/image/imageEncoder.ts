/**
 * Service for encoding drawn image canvas into desired output format and quality
 */

import UPNG from "upng-js";
import { getMimeTypeFromFormat, canEncodeMimeType } from "../../utils/imageFormatSupport";

export interface EncodeOptions {
  outputFormat: "JPG" | "PNG" | "WEBP" | "AVIF" | "BMP";
  quality: number; // 0.1 - 1.0
  backgroundColor?: string; // Hex color string, e.g. "#FFFFFF" for transparency replacement in JPG
}

export async function encodeImageCanvas(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  options: EncodeOptions
): Promise<Blob> {
  const mimeType = getMimeTypeFromFormat(options.outputFormat);

  // Validate format support before attempting
  if (!canEncodeMimeType(mimeType)) {
    throw new Error(`Seu navegador não possui suporte para gerar arquivos no formato ${options.outputFormat}.`);
  }

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    throw new Error("Não foi possível inicializar o contexto de renderização Canvas.");
  }

  // Handle background fill if target format does not support transparency (like JPG / JPEG)
  const isJpg = options.outputFormat === "JPG" || options.outputFormat === "BMP";
  if (isJpg || options.backgroundColor) {
    const bg = options.backgroundColor || "#FFFFFF";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  // Draw image onto canvas
  ctx.drawImage(source, 0, 0, width, height);

  // For PNG, use UPNG for high-efficiency DEFLATE compression instead of uncompressed browser canvas bloat
  if (options.outputFormat === "PNG") {
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const cnum = options.quality >= 0.85 ? 0 : 256;
      const arrayBuffer = UPNG.encode([imgData.data.buffer], width, height, cnum);
      return new Blob([arrayBuffer], { type: "image/png" });
    } catch (upngErr) {
      console.warn("[UPNG Encode fallback in imageEncoder]", upngErr);
    }
  }

  // Fallback to HTMLCanvasElement.toBlob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Falha ao exportar a imagem no formato ${options.outputFormat}.`));
        }
      },
      mimeType,
      options.quality
    );
  });
}
