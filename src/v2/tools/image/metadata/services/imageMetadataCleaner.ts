import { ImageCleanReport, ImageMetadataAnalysisResult } from "../types";
import { ImageMetadataReader } from "./imageMetadataReader";
import { JpegMetadataAdapter } from "../adapters/JpegMetadataAdapter";
import { PngMetadataAdapter } from "../adapters/PngMetadataAdapter";
import { WebpMetadataAdapter } from "../adapters/WebpMetadataAdapter";

export class ImageMetadataCleaner {
  /**
   * Executa a limpeza física dos metadados a partir dos bytes reais
   * e faz uma reanálise completa a partir do novo ArrayBuffer gerado.
   */
  public static async clean(file: File, analysisBefore: ImageMetadataAnalysisResult): Promise<ImageCleanReport> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (ImageMetadataReader.isJpeg(bytes)) {
      return await JpegMetadataAdapter.clean(file, bytes, analysisBefore);
    } else if (ImageMetadataReader.isPng(bytes)) {
      return await PngMetadataAdapter.clean(file, bytes, analysisBefore);
    } else if (ImageMetadataReader.isWebp(bytes)) {
      return await WebpMetadataAdapter.clean(file, bytes, analysisBefore);
    } else {
      throw new Error(`Formato ${analysisBefore.technical.format} ainda não suportado para limpeza física.`);
    }
  }
}
