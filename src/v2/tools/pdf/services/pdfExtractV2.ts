/**
 * PDF Text Extraction Service V2 - Native client-side text parsing with pdfjs-dist
 */

import { PdfRenderV2 } from "./pdfRenderV2";
import { PdfExtractResultV2 } from "../types";

export class PdfExtractV2 {
  /**
   * Extracts text from all pages of a PDF
   */
  static async extractText(
    file: File,
    onProgress?: (current: number, total: number) => void,
    isCancelled?: () => boolean
  ): Promise<PdfExtractResultV2> {
    const doc = await PdfRenderV2.loadDocument(file);
    const numPages = doc.numPages;
    const pages: { pageNumber: number; text: string }[] = [];
    let totalCharacters = 0;
    let pagesWithText = 0;

    for (let i = 1; i <= numPages; i++) {
      if (isCancelled?.()) {
        throw new Error("Extração cancelada pelo usuário.");
      }

      onProgress?.(i, numPages);

      try {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        
        let lastY: number | null = null;
        let pageText = "";

        for (const item of textContent.items) {
          if ("str" in item && typeof item.str === "string") {
            const str = item.str;
            const currentY = item.transform ? item.transform[5] : null;

            if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 8) {
              pageText += "\n";
            } else if (pageText.length > 0 && !pageText.endsWith(" ") && !pageText.endsWith("\n")) {
              pageText += " ";
            }

            pageText += str;
            lastY = currentY;
          }
        }

        const trimmed = pageText.trim();
        pages.push({ pageNumber: i, text: trimmed });

        if (trimmed.length > 0) {
          pagesWithText++;
          totalCharacters += trimmed.length;
        }
      } catch (err) {
        console.warn(`Erro ao extrair texto da página ${i}:`, err);
        pages.push({ pageNumber: i, text: "" });
      }
    }

    const fullText = pages
      .map((p) => `--- PÁGINA ${p.pageNumber} ---\n\n${p.text}`)
      .join("\n\n");

    const isScannedOnly = totalCharacters < 20;

    return {
      totalPages: numPages,
      totalCharacters,
      pagesWithText,
      fullText,
      pages,
      isScannedOnly
    };
  }
}
