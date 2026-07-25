/**
 * Service for extracting selectable text from PDF documents using pdfjs-dist
 */

import * as pdfjs from "pdfjs-dist";
import { parsePageRange } from "../../utils/pageRangeParser";
import { processPageTextContent, ExtractionMode } from "../../utils/pdfTextLayout";
import { cleanExtractedText, TextCleaningOptions, getTextMetrics } from "../../utils/pdfTextCleaner";

// Configure pdfjs worker
if (typeof window !== "undefined" && pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.1.200"}/build/pdf.worker.min.mjs`;
}

export interface PdfTextExtractOptions {
  pageRangeStr: string;
  mode: ExtractionMode;
  cleaningOptions: TextCleaningOptions;
}

export interface PageTextData {
  pageNum: number;
  text: string;
}

export interface PdfExtractTextResult {
  originalFileName: string;
  totalPages: number;
  processedPagesCount: number;
  hasSelectableText: boolean;
  combinedText: string;
  pages: PageTextData[];
  charCount: number;
  wordCount: number;
}

export class PdfExtractTextService {
  /**
   * Reads PDF document metadata and returns page count
   */
  public static async getPdfInfo(file: File): Promise<{ numPages: number; pdfDoc: any }> {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.1.200"}/cmaps/`,
        cMapPacked: true
      });
      const pdfDoc = await loadingTask.promise;
      return { numPages: pdfDoc.numPages, pdfDoc };
    } catch (err: any) {
      if (err?.name === "PasswordException" || err?.message?.includes("password")) {
        throw new Error("Este arquivo PDF está protegido por senha. Remova a senha antes de extrair o texto.");
      }
      throw new Error("O arquivo PDF está corrompido ou é inválido.");
    }
  }

  /**
   * Processes the PDF document and extracts text page by page sequentially
   */
  public static async extractText(
    file: File,
    options: PdfTextExtractOptions,
    onProgress: (current: number, total: number) => void,
    signal?: AbortSignal
  ): Promise<PdfExtractTextResult> {
    const { numPages, pdfDoc } = await this.getPdfInfo(file);

    // Parse target page numbers
    const { pages: targetPages, error: rangeError } = parsePageRange(options.pageRangeStr, numPages);
    if (rangeError) {
      throw new Error(rangeError);
    }

    const pagesResult: PageTextData[] = [];
    let totalChars = 0;

    for (let i = 0; i < targetPages.length; i++) {
      if (signal?.aborted) {
        throw new Error("Processamento cancelado pelo usuário.");
      }

      const pageNum = targetPages[i];
      onProgress(i + 1, targetPages.length);

      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      let pageRawText = processPageTextContent(textContent.items, options.mode);
      let cleanedPageText = cleanExtractedText(pageRawText, options.cleaningOptions);

      if (options.cleaningOptions.removeEmptyPages && !cleanedPageText.trim()) {
        page.cleanup();
        continue;
      }

      pagesResult.push({
        pageNum,
        text: cleanedPageText
      });

      totalChars += cleanedPageText.length;
      page.cleanup();
    }

    // Determine if PDF contains selectable text
    const hasSelectableText = totalChars > 0;

    // Combine text depending on mode
    let combinedText = "";
    if (hasSelectableText) {
      if (options.mode === "perPage") {
        combinedText = pagesResult
          .map((p) => `--- Página ${p.pageNum} ---\n\n${p.text}`)
          .join("\n\n");
      } else {
        combinedText = pagesResult.map((p) => p.text).join("\n\n");
      }
    }

    const { charCount, wordCount } = getTextMetrics(combinedText);

    return {
      originalFileName: file.name,
      totalPages: numPages,
      processedPagesCount: pagesResult.length,
      hasSelectableText,
      combinedText,
      pages: pagesResult,
      charCount,
      wordCount
    };
  }
}
