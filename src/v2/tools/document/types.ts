/**
 * MultiConverte Document Suite V2 Types
 */

export type DocumentSubTool = "hub" | "excelToPdf" | "wordToPdf";

export interface DocumentToolMeta {
  id: DocumentSubTool;
  title: string;
  shortDesc: string;
  badge?: string;
  formats: string[];
  path: string;
}

export interface ExcelConversionOptionsV2 {
  orientation: "portrait" | "landscape" | "auto";
  pageSize: "a4" | "letter" | "legal";
  scalingMode: "fit_width" | "fit_page" | "actual_size";
  margin: "narrow" | "normal" | "wide";
  repeatHeaderRow: boolean;
  selectedSheetNames: string[];
}

export interface WordConversionOptionsV2 {
  orientation: "auto" | "portrait" | "landscape";
  imageQuality: "standard" | "high";
  addPageNumbers: boolean;
}

export interface DocumentResultDataV2 {
  pdfBlobUrl: string;
  pdfBlob: Blob;
  filename: string;
  filesize: number;
  pageCount: number;
  sheetCount?: number;
  processingTimeMs?: number;
  warnings?: string[];
}
