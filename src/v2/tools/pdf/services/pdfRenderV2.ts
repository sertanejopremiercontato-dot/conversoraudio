/**
 * PDF Render Service V2 - Client-Side Rendering with pdfjs-dist
 */

import * as pdfjs from "pdfjs-dist";

// Initialize worker source cleanly
if (typeof window !== "undefined" && pdfjs.GlobalWorkerOptions) {
  const version = pdfjs.version || "4.10.38";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

export interface RenderedPageImage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  size: number;
}

export class PdfRenderV2 {
  /**
   * Loads a PDF Document using pdfjs-dist
   */
  static async loadDocument(fileOrBytes: File | Uint8Array | ArrayBuffer): Promise<any> {
    let data: Uint8Array;
    if (fileOrBytes instanceof File) {
      const buffer = await fileOrBytes.arrayBuffer();
      data = new Uint8Array(buffer);
    } else if (fileOrBytes instanceof ArrayBuffer) {
      data = new Uint8Array(fileOrBytes);
    } else {
      data = fileOrBytes;
    }

    const loadingTask = pdfjs.getDocument({
      data,
      cMapUrl: "https://unpkg.com/pdfjs-dist@4.10.38/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "https://unpkg.com/pdfjs-dist@4.10.38/standard_fonts/"
    });

    return await loadingTask.promise;
  }

  /**
   * Renders lightweight thumbnails for a list of pages
   */
  static async renderThumbnails(
    doc: any,
    maxDimension: number = 220,
    onProgress?: (current: number, total: number) => void
  ): Promise<string[]> {
    const numPages = doc.numPages;
    const thumbnails: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await doc.getPage(i);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = maxDimension / Math.max(unscaledViewport.width, unscaledViewport.height);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext("2d", { alpha: false });
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: ctx,
            viewport
          }).promise;

          thumbnails.push(canvas.toDataURL("image/jpeg", 0.75));
        } else {
          thumbnails.push("");
        }
      } catch (err) {
        console.warn(`Failed to render thumbnail for page ${i}:`, err);
        thumbnails.push("");
      }

      onProgress?.(i, numPages);
    }

    return thumbnails;
  }

  /**
   * Renders a specific page at higher DPI
   */
  static async renderPageToBlob(
    doc: any,
    pageNumber: number,
    format: "jpg" | "png" | "webp" = "jpg",
    dpi: number = 150,
    quality: number = 0.85
  ): Promise<RenderedPageImage> {
    const page = await doc.getPage(pageNumber);
    const scale = dpi / 72; // Standard 72 DPI base
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("Não foi possível inicializar o contexto gráfico.");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    const mimeType = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
    const dataUrl = canvas.toDataURL(mimeType, quality);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("Falha ao gerar blob de imagem da página."));
        },
        mimeType,
        quality
      );
    });

    return {
      pageNumber,
      dataUrl,
      blob,
      width: canvas.width,
      height: canvas.height,
      size: blob.size
    };
  }
}
