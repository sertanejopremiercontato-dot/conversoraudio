/**
 * Service for executing non-destructive rotate/flip operations and outputting processed image files/ZIP
 */

import { decodeImageFile } from "./imageDecoder";
import {
  TransformState,
  renderTransformedCanvas
} from "../../utils/imageTransformCommands";

export interface ProcessImageOptions {
  file: File;
  transform: TransformState;
  qualitySetting?: "max" | "high" | "rec";
  fallbackFormat?: string;
}

export interface ProcessedRotateFlipResult {
  id: string;
  originalFileName: string;
  outputFileName: string;
  blob: Blob;
  dataUrl: string;
  format: string;
  width: number;
  height: number;
  sizeBytes: number;
  transformSummary: string;
}

export function getQualityValue(setting: "max" | "high" | "rec" = "max"): number {
  switch (setting) {
    case "high":
      return 0.92;
    case "rec":
      return 0.85;
    case "max":
    default:
      return 0.98;
  }
}

export function detectMimeType(file: File): string {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/")) {
    return file.type;
  }
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".avif")) return "image/avif";
  if (name.endsWith(".bmp")) return "image/bmp";
  return "image/jpeg";
}

export function getCleanExtension(mimeType: string, originalName: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("avif")) return "avif";
  if (mimeType.includes("bmp")) return "bmp";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";

  const extMatch = originalName.match(/\.([a-z0-9]+)$/i);
  return extMatch ? extMatch[1].toLowerCase() : "jpg";
}

export function buildAdjustedFileName(originalName: string, ext: string): string {
  const lastDot = originalName.lastIndexOf(".");
  const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  return `${baseName}-ajustado.${ext}`;
}

export function buildTransformSummary(transform: TransformState): string {
  const parts: string[] = [];
  if (transform.rotation !== 0) {
    parts.push(`Giro ${transform.rotation}°`);
  }
  if (transform.flipH) {
    parts.push("Espelhado H");
  }
  if (transform.flipV) {
    parts.push("Espelhado V");
  }
  if (transform.autoOriented) {
    parts.push("Orientação corrigida");
  }
  return parts.length > 0 ? parts.join(" + ") : "Sem alterações";
}

/**
 * Processes a single image file according to its transform state
 */
export async function processRotateFlipImage(
  options: ProcessImageOptions,
  id: string
): Promise<ProcessedRotateFlipResult> {
  const { file, transform, qualitySetting = "max" } = options;
  const decoded = await decodeImageFile(file);

  try {
    const canvas = renderTransformedCanvas(
      decoded.source,
      decoded.width,
      decoded.height,
      transform
    );

    const inputMime = detectMimeType(file);
    let targetMime = inputMime;

    // For PNG/BMP, quality parameter is ignored by browsers
    const quality = getQualityValue(qualitySetting);

    // Render canvas to Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else {
            // Fallback to JPEG if browser doesn't support outputting native mime (e.g. AVIF or BMP export)
            targetMime = "image/jpeg";
            canvas.toBlob(
              (fallbackBlob) => {
                if (fallbackBlob) resolve(fallbackBlob);
                else reject(new Error("Falha ao exportar imagem do Canvas."));
              },
              "image/jpeg",
              quality
            );
          }
        },
        targetMime,
        quality
      );
    });

    const ext = getCleanExtension(targetMime, file.name);
    const outputFileName = buildAdjustedFileName(file.name, ext);
    const dataUrl = URL.createObjectURL(blob);
    const transformSummary = buildTransformSummary(transform);

    // Clean up temporary canvas
    canvas.width = 0;
    canvas.height = 0;

    return {
      id,
      originalFileName: file.name,
      outputFileName,
      blob,
      dataUrl,
      format: ext.toUpperCase(),
      width: canvas.width || (transform.rotation % 180 === 90 ? decoded.height : decoded.width),
      height: canvas.height || (transform.rotation % 180 === 90 ? decoded.width : decoded.height),
      sizeBytes: blob.size,
      transformSummary
    };
  } finally {
    decoded.cleanUp();
  }
}
