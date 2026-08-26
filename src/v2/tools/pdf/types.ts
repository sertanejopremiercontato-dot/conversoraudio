/**
 * Types and interfaces for PDF Tools V2
 */

export type PdfSubTool = 
  | "hub"
  | "merge" 
  | "compress" 
  | "organize" 
  | "deleteRotate" 
  | "imagesToPdf" 
  | "pdfToImages" 
  | "extractText";

export interface PdfFileItemV2 {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  previewUrl?: string;
}

export interface PdfPageItemV2 {
  id: string;
  originalIndex: number; // 0-indexed original page
  pageNumber: number; // 1-indexed display
  rotation: number; // 0, 90, 180, 270
  deleted: boolean;
  thumbnailUrl?: string;
}

export interface PdfProgressStateV2 {
  isProcessing: boolean;
  progress: number;
  stepText: string;
  canCancel?: boolean;
}

export interface PdfResultDataV2 {
  blob: Blob;
  fileName: string;
  originalSize?: number;
  finalSize: number;
  savedBytes?: number;
  pageCount?: number;
  downloadUrl: string;
  savingsPercent?: number;
  previewUrl?: string;
  status?: "COMPRESSED" | "NO_GAIN";
  wasEffective?: boolean;
}

export interface PdfCompressResultV2 {
  blob: Blob;
  originalSize: number;
  finalSize: number;
  savedBytes: number;
  savingsPercent: number;
  pageCount: number;
  status: "COMPRESSED" | "NO_GAIN";
  wasEffective: boolean;
  strategyUsed?: "lossless" | "image_optimization" | "none";
}

export type PageSizeOptionV2 = "a4" | "letter" | "fit";
export type OrientationOptionV2 = "auto" | "portrait" | "landscape";
export type MarginOptionV2 = "none" | "small" | "large";
export type ImageQualityOptionV2 = "original" | "high" | "medium";

export interface ImagesToPdfConfigV2 {
  pageSize: PageSizeOptionV2;
  orientation: OrientationOptionV2;
  margin: MarginOptionV2;
  quality: ImageQualityOptionV2;
}

export interface PdfExtractResultV2 {
  totalCharacters: number;
  totalPages: number;
  pagesWithText: number;
  fullText: string;
  pages: { pageNumber: number; text: string }[];
  isScannedOnly: boolean;
}
