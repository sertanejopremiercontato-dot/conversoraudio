/**
 * PDF Engine Service V2 - Native client-side PDF manipulation with pdf-lib & fflate
 */

import {
  PDFDocument,
  degrees,
  PageSizes,
  rgb,
  PDFRawStream,
  PDFDict,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFArray
} from "pdf-lib";
import * as fflate from "fflate";
import { ImagesToPdfConfigV2, PdfPageItemV2, PdfCompressResultV2 } from "../types";

export class PdfEngineV2 {
  /**
   * Merges multiple PDF files in order into a single PDF
   */
  static async mergePdfs(
    files: File[],
    onProgress?: (percent: number, stepText: string) => void,
    isCancelled?: () => boolean
  ): Promise<{ blob: Blob; pageCount: number; size: number }> {
    if (files.length < 2) {
      throw new Error("Selecione pelo menos 2 arquivos PDF para mesclar.");
    }

    onProgress?.(5, "Iniciando criação do novo documento PDF...");
    const mergedDoc = await PDFDocument.create();
    let totalPagesCount = 0;

    for (let i = 0; i < files.length; i++) {
      if (isCancelled?.()) {
        throw new Error("Operação cancelada pelo usuário.");
      }

      const file = files[i];
      const percent = Math.round(10 + (i / files.length) * 80);
      onProgress?.(percent, `Lendo e mesclando: ${file.name} (${i + 1} de ${files.length})`);

      const fileBuffer = await file.arrayBuffer();
      const donorDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      const donorPages = await mergedDoc.copyPages(donorDoc, donorDoc.getPageIndices());

      for (const page of donorPages) {
        mergedDoc.addPage(page);
        totalPagesCount++;
      }
    }

    onProgress?.(95, "Finalizando montagem do documento...");
    const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
    const blob = new Blob([mergedBytes], { type: "application/pdf" });

    onProgress?.(100, "Concluído!");
    return {
      blob,
      pageCount: totalPagesCount,
      size: blob.size
    };
  }

  /**
   * Reorganizes pages of a single PDF according to a list of page objects
   */
  static async organizePages(
    file: File,
    pages: PdfPageItemV2[],
    onProgress?: (percent: number, stepText: string) => void,
    isCancelled?: () => boolean
  ): Promise<{ blob: Blob; pageCount: number; size: number }> {
    const activePages = pages.filter((p) => !p.deleted);
    if (activePages.length === 0) {
      throw new Error("O documento final precisa conter pelo menos 1 página ativa.");
    }

    onProgress?.(10, "Carregando documento original...");
    const fileBuffer = await file.arrayBuffer();
    const sourceDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();

    const total = activePages.length;
    for (let i = 0; i < total; i++) {
      if (isCancelled?.()) {
        throw new Error("Operação cancelada pelo usuário.");
      }

      const pageItem = activePages[i];
      const percent = Math.round(20 + (i / total) * 70);
      onProgress?.(percent, `Organizando página ${i + 1} de ${total}...`);

      const [copiedPage] = await newDoc.copyPages(sourceDoc, [pageItem.originalIndex]);

      if (pageItem.rotation % 360 !== 0) {
        const currentRot = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees((currentRot + pageItem.rotation) % 360));
      }

      newDoc.addPage(copiedPage);
    }

    onProgress?.(95, "Salvando arquivo reorganizado...");
    const outputBytes = await newDoc.save({ useObjectStreams: true });
    const blob = new Blob([outputBytes], { type: "application/pdf" });

    onProgress?.(100, "Concluído!");
    return {
      blob,
      pageCount: activePages.length,
      size: blob.size
    };
  }

  /**
   * Deletes and rotates specific pages
   */
  static async deleteAndRotatePages(
    file: File,
    pages: PdfPageItemV2[],
    onProgress?: (percent: number, stepText: string) => void,
    isCancelled?: () => boolean
  ): Promise<{ blob: Blob; pageCount: number; size: number }> {
    return this.organizePages(file, pages, onProgress, isCancelled);
  }

  /**
   * Converts a list of image files to a clean, formatted PDF
   */
  static async convertImagesToPdf(
    images: File[],
    config: ImagesToPdfConfigV2,
    onProgress?: (percent: number, stepText: string) => void,
    isCancelled?: () => boolean
  ): Promise<{ blob: Blob; pageCount: number; size: number }> {
    if (images.length === 0) {
      throw new Error("Selecione pelo menos uma imagem para gerar o PDF.");
    }

    onProgress?.(5, "Inicializando novo documento...");
    const pdfDoc = await PDFDocument.create();
    const total = images.length;

    const marginMap = {
      none: 0,
      small: 20,
      large: 40
    };
    const marginPt = marginMap[config.margin] || 0;

    for (let i = 0; i < total; i++) {
      if (isCancelled?.()) {
        throw new Error("Operação cancelada pelo usuário.");
      }

      const imgFile = images[i];
      const percent = Math.round(10 + (i / total) * 80);
      onProgress?.(percent, `Processando imagem ${i + 1} de ${total}: ${imgFile.name}`);

      const imgData = await this.loadImageElement(imgFile);
      const isPng = imgFile.type === "image/png" && !imgFile.type.includes("jpeg");

      let embeddedImage;
      if (isPng && config.quality === "original") {
        const bytes = await imgFile.arrayBuffer();
        try {
          embeddedImage = await pdfDoc.embedPng(bytes);
        } catch {
          const jpgBytes = await this.rasterizeImageToJpeg(imgData, 0.9);
          embeddedImage = await pdfDoc.embedJpg(jpgBytes);
        }
      } else {
        const qualityVal = config.quality === "original" ? 0.95 : config.quality === "high" ? 0.85 : 0.7;
        const jpgBytes = await this.rasterizeImageToJpeg(imgData, qualityVal);
        embeddedImage = await pdfDoc.embedJpg(jpgBytes);
      }

      const naturalW = embeddedImage.width;
      const naturalH = embeddedImage.height;

      let pageWidth = naturalW;
      let pageHeight = naturalH;

      if (config.pageSize === "a4") {
        const [a4W, a4H] = PageSizes.A4;
        if (config.orientation === "landscape" || (config.orientation === "auto" && naturalW > naturalH)) {
          pageWidth = a4H;
          pageHeight = a4W;
        } else {
          pageWidth = a4W;
          pageHeight = a4H;
        }
      } else if (config.pageSize === "letter") {
        const [letW, letH] = PageSizes.Letter;
        if (config.orientation === "landscape" || (config.orientation === "auto" && naturalW > naturalH)) {
          pageWidth = letH;
          pageHeight = letW;
        } else {
          pageWidth = letW;
          pageHeight = letH;
        }
      } else {
        pageWidth = naturalW + marginPt * 2;
        pageHeight = naturalH + marginPt * 2;
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const availW = Math.max(10, pageWidth - marginPt * 2);
      const availH = Math.max(10, pageHeight - marginPt * 2);

      const scale = Math.min(availW / naturalW, availH / naturalH, 1.0);
      const drawW = naturalW * scale;
      const drawH = naturalH * scale;

      const posX = marginPt + (availW - drawW) / 2;
      const posY = marginPt + (availH - drawH) / 2;

      page.drawImage(embeddedImage, {
        x: posX,
        y: posY,
        width: drawW,
        height: drawH
      });
    }

    onProgress?.(95, "Finalizando PDF com imagens...");
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    onProgress?.(100, "Concluído!");
    return {
      blob,
      pageCount: total,
      size: blob.size
    };
  }

  /**
   * Validates if a generated candidate is a readable PDF with the expected page count
   */
  static async validatePdf(bytes: Uint8Array, expectedPageCount: number): Promise<boolean> {
    try {
      if (!bytes || bytes.length === 0) return false;
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const count = doc.getPageCount();
      if (count !== expectedPageCount || count === 0) return false;
      const page = doc.getPage(0);
      const { width, height } = page.getSize();
      if (width <= 0 || height <= 0) return false;
      return true;
    } catch (e) {
      console.warn("Candidato PDF não passou na validação de integridade:", e);
      return false;
    }
  }

  /**
   * Decompresses and recompresses an image stream safely
   */
  private static async optimizeImageObject(
    rawBytes: Uint8Array,
    dict: PDFDict,
    maxDim: number,
    quality: number
  ): Promise<{ bytes: Uint8Array; width: number; height: number; filter: string; colorSpace: string } | null> {
    try {
      const filterObj = dict.get(PDFName.of("Filter"));
      const filterName = filterObj ? filterObj.toString() : "";
      const widthObj = dict.get(PDFName.of("Width"));
      const heightObj = dict.get(PDFName.of("Height"));
      const hasSMask = dict.has(PDFName.of("SMask"));

      const origW = widthObj instanceof PDFNumber ? widthObj.asNumber() : 0;
      const origH = heightObj instanceof PDFNumber ? heightObj.asNumber() : 0;

      // 1. JPEG image streams (/DCTDecode)
      if (filterName.includes("DCTDecode") || (rawBytes[0] === 0xff && rawBytes[1] === 0xd8)) {
        if (rawBytes.length < 1500) {
          // Do not touch tiny icons to avoid inflation
          return null;
        }

        const blob = new Blob([rawBytes], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        const loaded = await new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });

        URL.revokeObjectURL(url);
        if (!loaded) return null;

        let targetW = img.naturalWidth || origW || img.width;
        let targetH = img.naturalHeight || origH || img.height;

        if (targetW > maxDim || targetH > maxDim) {
          if (targetW >= targetH) {
            targetH = Math.max(1, Math.round((targetH * maxDim) / targetW));
            targetW = maxDim;
          } else {
            targetW = Math.max(1, Math.round((targetW * maxDim) / targetH));
            targetH = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const newJpegBytes = await new Promise<Uint8Array | null>((resolve) => {
          canvas.toBlob(
            async (b) => {
              if (!b) return resolve(null);
              const buf = await b.arrayBuffer();
              resolve(new Uint8Array(buf));
            },
            "image/jpeg",
            quality
          );
        });

        canvas.width = 0;
        canvas.height = 0;

        if (newJpegBytes && newJpegBytes.length < rawBytes.length) {
          return {
            bytes: newJpegBytes,
            width: targetW,
            height: targetH,
            filter: "DCTDecode",
            colorSpace: "DeviceRGB"
          };
        }
      }

      // 2. Deflated bitmap streams (/FlateDecode) without soft mask
      if (filterName.includes("FlateDecode") && !hasSMask && origW > 0 && origH > 0 && rawBytes.length > 3000) {
        try {
          const uncompressed = fflate.unzlibSync(rawBytes);
          if (uncompressed && uncompressed.length >= origW * origH * 3) {
            // RGB 24-bit raw bitmap
            const canvas = document.createElement("canvas");
            canvas.width = origW;
            canvas.height = origH;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const imgData = ctx.createImageData(origW, origH);
              const data = imgData.data;
              let srcIdx = 0;
              let dstIdx = 0;
              const totalPixels = origW * origH;
              for (let p = 0; p < totalPixels && srcIdx + 2 < uncompressed.length; p++) {
                data[dstIdx] = uncompressed[srcIdx];
                data[dstIdx + 1] = uncompressed[srcIdx + 1];
                data[dstIdx + 2] = uncompressed[srcIdx + 2];
                data[dstIdx + 3] = 255;
                srcIdx += 3;
                dstIdx += 4;
              }
              ctx.putImageData(imgData, 0, 0);

              let targetW = origW;
              let targetH = origH;
              if (targetW > maxDim || targetH > maxDim) {
                if (targetW >= targetH) {
                  targetH = Math.max(1, Math.round((targetH * maxDim) / targetW));
                  targetW = maxDim;
                } else {
                  targetW = Math.max(1, Math.round((targetW * maxDim) / targetH));
                  targetH = maxDim;
                }
              }

              let finalCanvas = canvas;
              if (targetW !== origW || targetH !== origH) {
                const scaledCanvas = document.createElement("canvas");
                scaledCanvas.width = targetW;
                scaledCanvas.height = targetH;
                const scaledCtx = scaledCanvas.getContext("2d");
                if (scaledCtx) {
                  scaledCtx.drawImage(canvas, 0, 0, targetW, targetH);
                  finalCanvas = scaledCanvas;
                }
              }

              const newJpegBytes = await new Promise<Uint8Array | null>((resolve) => {
                finalCanvas.toBlob(
                  async (b) => {
                    if (!b) return resolve(null);
                    const buf = await b.arrayBuffer();
                    resolve(new Uint8Array(buf));
                  },
                  "image/jpeg",
                  quality
                );
              });

              canvas.width = 0;
              canvas.height = 0;
              if (finalCanvas !== canvas) {
                finalCanvas.width = 0;
                finalCanvas.height = 0;
              }

              if (newJpegBytes && newJpegBytes.length < rawBytes.length) {
                return {
                  bytes: newJpegBytes,
                  width: targetW,
                  height: targetH,
                  filter: "DCTDecode",
                  colorSpace: "DeviceRGB"
                };
              }
            }
          }

          // Fallback: Try re-compressing uncompressed stream with max zlib level 9
          const recompressed = fflate.zlibSync(uncompressed, { level: 9 });
          if (recompressed && recompressed.length < rawBytes.length) {
            return {
              bytes: recompressed,
              width: origW,
              height: origH,
              filter: "FlateDecode",
              colorSpace: dict.get(PDFName.of("ColorSpace"))?.toString().replace("/", "") || "DeviceRGB"
            };
          }
        } catch {
          // Keep raw stream
        }
      }

      return null;
    } catch (err) {
      console.warn("Failed to optimize individual image stream:", err);
      return null;
    }
  }

  /**
   * Real PDF Compressor with multi-candidate optimization and strict NEVER-GROW guarantee
   */
  static async compressPdf(
    file: File,
    level: "standard" | "high" = "standard",
    onProgress?: (percent: number, stepText: string) => void,
    isCancelled?: () => boolean
  ): Promise<PdfCompressResultV2> {
    const originalSize = file.size;
    onProgress?.(10, "Lendo estrutura física do documento PDF...");

    const fileBuffer = await file.arrayBuffer();
    const originalBytes = new Uint8Array(fileBuffer);

    // Initial check: load original to get page count and check validity
    const initialDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const originalPageCount = initialDoc.getPageCount();

    if (originalPageCount === 0) {
      throw new Error("O documento PDF não possui páginas válidas.");
    }

    if (isCancelled?.()) {
      throw new Error("Operação cancelada pelo usuário.");
    }

    onProgress?.(25, "Analisando objetos, fluxos de imagem e vetores...");

    interface CandidateAttempt {
      bytes: Uint8Array;
      type: "lossless" | "image_optimization";
    }

    const candidatePool: CandidateAttempt[] = [];

    // ==========================================
    // CANDIDATE 1: Lossless Structural Optimization
    // ==========================================
    try {
      onProgress?.(35, "Gerando candidato A (Otimização estrutural sem perdas)...");
      const docA = await PDFDocument.load(fileBuffer.slice(0), { ignoreEncryption: true });

      // Strip unneeded redundant metadata
      docA.setTitle("");
      docA.setAuthor("");
      docA.setSubject("");
      docA.setKeywords([]);
      docA.setProducer("");
      docA.setCreator("");

      docA.context.enumerateIndirectObjects().forEach(([ref, obj]) => {
        if (obj instanceof PDFDict) {
          obj.delete(PDFName.of("PieceInfo"));
          obj.delete(PDFName.of("Metadata"));
        }
      });

      const bytesWithObjectStreams = await docA.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 60
      });

      if (bytesWithObjectStreams.length < originalSize) {
        candidatePool.push({ bytes: bytesWithObjectStreams, type: "lossless" });
      }

      // Also try standard xref stream saving in case object streams add overhead to small files
      const bytesWithoutObjectStreams = await docA.save({
        useObjectStreams: false,
        addDefaultPage: false,
        objectsPerTick: 60
      });

      if (bytesWithoutObjectStreams.length < originalSize) {
        candidatePool.push({ bytes: bytesWithoutObjectStreams, type: "lossless" });
      }
    } catch (err) {
      console.warn("Falha no candidato sem perdas:", err);
    }

    if (isCancelled?.()) {
      throw new Error("Operação cancelada pelo usuário.");
    }

    // ==========================================
    // CANDIDATE 2: High-Quality Image Optimization
    // ==========================================
    try {
      onProgress?.(55, "Gerando candidato B (Otimização de imagens em alta definição)...");
      const docB = await PDFDocument.load(fileBuffer.slice(0), { ignoreEncryption: true });

      const maxDimension = level === "high" ? 1440 : 1920;
      const targetQuality = level === "high" ? 0.76 : 0.84;

      const indirectObjects = docB.context.enumerateIndirectObjects();
      let optimizedImagesCount = 0;

      for (const [ref, obj] of indirectObjects) {
        if (isCancelled?.()) throw new Error("Operação cancelada.");

        if (obj instanceof PDFRawStream) {
          const dict = obj.dict;
          const subtype = dict.get(PDFName.of("Subtype"));
          if (subtype === PDFName.of("Image") || subtype?.toString() === "/Image") {
            const rawBytes = obj.contents;
            if (rawBytes && rawBytes.length > 1500) {
              const res = await this.optimizeImageObject(rawBytes, dict, maxDimension, targetQuality);
              if (res && res.bytes.length < rawBytes.length) {
                const newStream = PDFRawStream.of(dict, res.bytes);
                docB.context.assign(ref, newStream);

                dict.set(PDFName.of("Length"), PDFNumber.of(res.bytes.length));
                dict.set(PDFName.of("Width"), PDFNumber.of(res.width));
                dict.set(PDFName.of("Height"), PDFNumber.of(res.height));
                dict.set(PDFName.of("Filter"), PDFName.of(res.filter));
                dict.set(PDFName.of("ColorSpace"), PDFName.of(res.colorSpace));
                dict.delete(PDFName.of("DecodeParms"));
                optimizedImagesCount++;
              }
            }
          }
        }
      }

      // Cleanup metadata on docB
      docB.setTitle("");
      docB.setAuthor("");
      docB.setSubject("");
      docB.setKeywords([]);
      docB.setProducer("");
      docB.setCreator("");

      docB.context.enumerateIndirectObjects().forEach(([ref, obj]) => {
        if (obj instanceof PDFDict) {
          obj.delete(PDFName.of("PieceInfo"));
          obj.delete(PDFName.of("Metadata"));
        }
      });

      const bytesB = await docB.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 60
      });

      if (bytesB.length < originalSize) {
        candidatePool.push({ bytes: bytesB, type: "image_optimization" });
      }
    } catch (err) {
      console.warn("Falha no candidato com otimização de imagens:", err);
    }

    // ==========================================
    // CANDIDATE 3: Conservative Image Optimization
    // ==========================================
    if (level === "standard") {
      try {
        onProgress?.(75, "Gerando candidato C (Preservação ultra-fiel de mídia)...");
        const docC = await PDFDocument.load(fileBuffer.slice(0), { ignoreEncryption: true });

        const indirectObjects = docC.context.enumerateIndirectObjects();
        for (const [ref, obj] of indirectObjects) {
          if (isCancelled?.()) throw new Error("Operação cancelada.");

          if (obj instanceof PDFRawStream) {
            const dict = obj.dict;
            const subtype = dict.get(PDFName.of("Subtype"));
            if (subtype === PDFName.of("Image") || subtype?.toString() === "/Image") {
              const rawBytes = obj.contents;
              if (rawBytes && rawBytes.length > 5000) {
                const res = await this.optimizeImageObject(rawBytes, dict, 2200, 0.88);
                if (res && res.bytes.length < rawBytes.length) {
                  const newStream = PDFRawStream.of(dict, res.bytes);
                  docC.context.assign(ref, newStream);

                  dict.set(PDFName.of("Length"), PDFNumber.of(res.bytes.length));
                  dict.set(PDFName.of("Width"), PDFNumber.of(res.width));
                  dict.set(PDFName.of("Height"), PDFNumber.of(res.height));
                  dict.set(PDFName.of("Filter"), PDFName.of(res.filter));
                  dict.set(PDFName.of("ColorSpace"), PDFName.of(res.colorSpace));
                  dict.delete(PDFName.of("DecodeParms"));
                }
              }
            }
          }
        }

        docC.setTitle("");
        docC.setAuthor("");
        docC.setSubject("");
        docC.setKeywords([]);
        docC.setProducer("");
        docC.setCreator("");

        const bytesC = await docC.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 60
        });

        if (bytesC.length < originalSize) {
          candidatePool.push({ bytes: bytesC, type: "image_optimization" });
        }
      } catch (err) {
        console.warn("Falha no candidato conservador:", err);
      }
    }

    onProgress?.(90, "Validando candidatos e conferindo integridade...");

    // ==========================================
    // FILTER AND SELECT BEST CANDIDATE
    // ==========================================
    const validCandidates: CandidateAttempt[] = [];

    for (const cand of candidatePool) {
      if (cand.bytes.length < originalSize) {
        const isValid = await this.validatePdf(cand.bytes, originalPageCount);
        if (isValid) {
          validCandidates.push(cand);
        }
      }
    }

    // Sort by smallest byte size first
    validCandidates.sort((a, b) => a.bytes.length - b.bytes.length);

    onProgress?.(100, "Processamento concluído!");

    // CRITICAL: NEVER-GROW GUARD
    // candidateBytes < originalBytes is STRICTLY REQUIRED
    if (validCandidates.length > 0 && validCandidates[0].bytes.length < originalSize) {
      const best = validCandidates[0];
      const finalSize = best.bytes.length;
      const savedBytes = originalSize - finalSize;
      const savingsPercent = Number(((savedBytes / originalSize) * 100).toFixed(1));
      const blob = new Blob([best.bytes], { type: "application/pdf" });

      return {
        blob,
        originalSize,
        finalSize,
        savedBytes,
        savingsPercent,
        pageCount: originalPageCount,
        status: "COMPRESSED",
        wasEffective: true,
        strategyUsed: best.type
      };
    }

    // NO_GAIN FALLBACK: The original file is already highly optimized.
    // Never offer a bloated or re-serialized larger file. Keep original byte-for-byte.
    const originalBlob = new Blob([fileBuffer], { type: "application/pdf" });
    return {
      blob: originalBlob,
      originalSize,
      finalSize: originalSize,
      savedBytes: 0,
      savingsPercent: 0,
      pageCount: originalPageCount,
      status: "NO_GAIN",
      wasEffective: false,
      strategyUsed: "none"
    };
  }

  private static loadImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error(`Falha ao ler arquivo de imagem: ${file.name}`));
      };
      img.src = url;
    });
  }

  private static rasterizeImageToJpeg(img: HTMLImageElement, quality: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Falha no contexto gráfico 2D"));
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error("Falha ao converter canvas para JPG"));
            return;
          }
          const buf = await blob.arrayBuffer();
          resolve(new Uint8Array(buf));
        },
        "image/jpeg",
        quality
      );
    });
  }
}

