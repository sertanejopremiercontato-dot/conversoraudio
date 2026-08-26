import { ImageMetadataAnalysisResult, ImageTechnicalInfo } from "../types";
import { computeImageSha256 } from "./imageMetadataVerifier";
import { JpegMetadataAdapter } from "../adapters/JpegMetadataAdapter";
import { PngMetadataAdapter } from "../adapters/PngMetadataAdapter";
import { WebpMetadataAdapter } from "../adapters/WebpMetadataAdapter";

export class ImageMetadataReader {
  public static isJpeg(bytes: Uint8Array): boolean {
    return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8;
  }

  public static isPng(bytes: Uint8Array): boolean {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  public static isWebp(bytes: Uint8Array): boolean {
    if (bytes.length < 12) return false;
    const riff = String.fromCharCode(...bytes.subarray(0, 4));
    const webp = String.fromCharCode(...bytes.subarray(8, 12));
    return riff === "RIFF" && webp === "WEBP";
  }

  /**
   * Executa a inspeção física e forense a partir dos bytes reais do arquivo
   */
  public static async analyze(file: File): Promise<ImageMetadataAnalysisResult> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // 1. JPEG
    if (this.isJpeg(bytes)) {
      return await JpegMetadataAdapter.analyze(file, bytes);
    }

    // 2. PNG
    if (this.isPng(bytes)) {
      return await PngMetadataAdapter.analyze(file, bytes);
    }

    // 3. WebP
    if (this.isWebp(bytes)) {
      return await WebpMetadataAdapter.analyze(file, bytes);
    }

    // 4. Outros formatos (TIFF / AVIF / HEIC / Genérico)
    let format: ImageTechnicalInfo["format"] = "UNKNOWN";
    let magicBytes = "";
    if (bytes.length >= 4) {
      magicBytes = Array.from(bytes.subarray(0, 4)).map(b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
    }

    if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
        (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)) {
      format = "TIFF";
    } else if (file.type.includes("avif") || file.name.toLowerCase().endsWith(".avif")) {
      format = "AVIF";
    } else if (file.type.includes("heic") || file.name.toLowerCase().endsWith(".heic")) {
      format = "HEIC";
    }

    let width = 0;
    let height = 0;
    try {
      const bmp = await createImageBitmap(file);
      width = bmp.width;
      height = bmp.height;
      bmp.close();
    } catch {
      // Ignorado
    }

    const sha256 = await computeImageSha256(bytes);

    const technical: ImageTechnicalInfo = {
      format,
      mimeType: file.type || "application/octet-stream",
      width,
      height,
      fileSize: file.size,
      colorDepth: "8 bits/canal",
      hasAlpha: false,
      colorProfile: "sRGB",
      magicBytes: magicBytes || "Desconhecido"
    };

    return {
      technical,
      verification: {
        fileSha256: sha256,
        chunksSummary: [],
        removableMetadataCount: 0,
        privacyIssuesCount: 0,
        softwareGeneratorCount: 0,
        gpsCount: 0,
        commentsCount: 0,
        unknownOptionalCount: 0,
        xmpIptcCount: 0,
        isClean: true
      },
      items: [],
      privacyItems: [],
      provenanceItems: [],
      softwareItems: [],
      metadataItems: [],
      commentItems: [],
      xmpIptcItems: [],
      unknownOptionalItems: [],
      technicalItems: []
    };
  }
}
