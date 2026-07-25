/**
 * Image Watermark Service for processing images and generating outputs
 */

import { decodeImageFile } from "./imageDecoder";
import { WatermarkSettings } from "../../utils/imageWatermarkPresets";
import { applyWatermarkToCanvas } from "../../utils/imageWatermarkCalculations";

export interface ProcessWatermarkOptions {
  file: File;
  settings: WatermarkSettings;
  overrideSettings?: Partial<WatermarkSettings>;
}

export interface ProcessedWatermarkResult {
  id: string;
  originalFileName: string;
  outputFileName: string;
  blob: Blob;
  dataUrl: string;
  format: string;
  width: number;
  height: number;
  sizeBytes: number;
  watermarkSummary: string;
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

export function detectOutputMime(file: File, targetFormat: "original" | "JPG" | "PNG" | "WEBP"): string {
  if (targetFormat === "JPG") return "image/jpeg";
  if (targetFormat === "PNG") return "image/png";
  if (targetFormat === "WEBP") return "image/webp";

  // Default to original mime or jpeg
  if (file.type.startsWith("image/")) {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export function getCleanExtension(mimeType: string, originalName: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";

  const extMatch = originalName.match(/\.([a-z0-9]+)$/i);
  return extMatch ? extMatch[1].toLowerCase() : "jpg";
}

export function buildWatermarkFileName(originalName: string, ext: string): string {
  const lastDot = originalName.lastIndexOf(".");
  const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  return `${baseName}-com-marca-dagua.${ext}`;
}

export function buildWatermarkSummary(settings: WatermarkSettings): string {
  switch (settings.watermarkType) {
    case "text":
      return `Texto: "${settings.textConfig.text.slice(0, 15)}..."`;
    case "logo":
      return "Logotipo";
    case "repeat":
      return `Marca Repetida (${settings.repeatConfig.type === "text" ? "Texto" : "Logo"})`;
    default:
      return "Marca d'água";
  }
}

/**
 * Processes a single image file applying configured watermark settings
 */
export async function processWatermarkImage(
  options: ProcessWatermarkOptions,
  id: string
): Promise<ProcessedWatermarkResult> {
  const { file, settings } = options;
  const decoded = await decodeImageFile(file);

  try {
    const canvas = applyWatermarkToCanvas(
      decoded.source,
      decoded.width,
      decoded.height,
      settings
    );

    const targetMime = detectOutputMime(file, settings.outputFormat);
    const quality = getQualityValue(settings.qualitySetting);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else {
            canvas.toBlob(
              (fallbackBlob) => {
                if (fallbackBlob) resolve(fallbackBlob);
                else reject(new Error("Falha ao exportar imagem com marca d'água do Canvas."));
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
    const outputFileName = buildWatermarkFileName(file.name, ext);
    const dataUrl = URL.createObjectURL(blob);
    const watermarkSummary = buildWatermarkSummary(settings);

    // clean canvas
    canvas.width = 0;
    canvas.height = 0;

    return {
      id,
      originalFileName: file.name,
      outputFileName,
      blob,
      dataUrl,
      format: ext.toUpperCase(),
      width: decoded.width,
      height: decoded.height,
      sizeBytes: blob.size,
      watermarkSummary
    };
  } finally {
    decoded.cleanUp();
  }
}
