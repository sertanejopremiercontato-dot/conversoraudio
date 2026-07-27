export type ConversionMode = "high_fidelity" | "searchable_text";

export interface HighFidelityOptions {
  scale?: number; // html2canvas scale (default: 2)
  addPageNumbers?: boolean;
  outputFilename?: string;
  onProgress?: (percent: number, stage: string) => void;
}

export interface HighFidelityResult {
  pdfBlob: Blob;
  pdfUrl: string;
  filename: string;
  pageCount: number;
  fileSizeBytes: number;
  processingTimeMs: number;
  warnings: string[];
}
