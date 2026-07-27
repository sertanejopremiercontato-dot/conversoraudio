import { PDFDocument, rgb, StandardFonts, PDFFont, RGB } from "pdf-lib";
import { ParsedExcelFile, ParsedSheet, ParsedCell } from "./excelReaderService";
import { PrintSettings } from "../../utils/document/excelPrintSettings";
import { calculatePageChunksForSheet, PageChunk } from "../../utils/document/excelPageCalculator";
import { formatCellValueForDisplay } from "../../utils/document/excelCellFormatter";

export interface ConversionReportData {
  filename: string;
  pdfFilename: string;
  pdfBlobUrl: string;
  pdfBytes: Uint8Array;
  pdfSize: number;
  convertedSheets: string[];
  skippedSheets: string[];
  totalCellsProcessed: number;
  uncalculatedFormulasCount: number;
  generatedPagesCount: number;
  unsupportedFeatures: string[];
  warnings: string[];
  orientationUsed: string;
  pageSizeUsed: string;
  imagesDetectedCount?: number;
  imagesInsertedCount?: number;
  chartsDetectedCount?: number;
  processingTimeMs?: number;
}

export interface ProgressCallback {
  (step: string, sheetName: string, sheetIdx: number, totalSheets: number, pageIdx: number, totalPages: number, percent: number): void;
}

// Convert CSS hex or rgb string to pdf-lib RGB object
function parsePdfColor(colorStr: string | undefined, defaultHex: string = "#000000"): RGB {
  const str = (colorStr || defaultHex).trim();
  if (str.startsWith("#")) {
    let hex = str.substring(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      return rgb(r, g, b);
    }
  }
  if (str.toLowerCase().startsWith("rgb")) {
    const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (match) {
      return rgb(
        parseInt(match[1], 10) / 255,
        parseInt(match[2], 10) / 255,
        parseInt(match[3], 10) / 255
      );
    }
  }
  return parsePdfColor(defaultHex, "#000000");
}

// Sanitize string for WinAnsiEncoding (StandardFonts in pdf-lib)
// Preserves Latin-1 characters (á, é, í, ó, ú, ã, õ, ç, etc.)
function sanitizeForWinAnsi(str: string): string {
  if (!str) return "";
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Standard ASCII (0x20 - 0x7E) and Latin-1 Supplement (0xA0 - 0xFF)
    if ((code >= 0x20 && code <= 0x7E) || (code >= 0xA0 && code <= 0xFF)) {
      result += str[i];
    } else if (str[i] === "–" || str[i] === "—") {
      result += "-";
    } else if (str[i] === "“" || str[i] === "”") {
      result += '"';
    } else if (str[i] === "‘" || str[i] === "’") {
      result += "'";
    } else if (str[i] === "…") {
      result += "...";
    } else if (str[i] === "•") {
      result += "*";
    } else if (str[i] === "\t") {
      result += " ";
    } else if (str[i] === "\n" || str[i] === "\r") {
      result += " ";
    } else {
      result += ""; // Skip unrepresentable characters
    }
  }
  return result;
}

export async function convertExcelToPdf(
  fileData: ParsedExcelFile,
  settings: PrintSettings,
  outputFilename?: string,
  onProgress?: ProgressCallback
): Promise<ConversionReportData> {
  const startTime = Date.now();
  const selectedSheets = fileData.sheets.filter((s) => s.selected);
  const skippedSheets = fileData.sheets.filter((s) => !s.selected).map((s) => s.name);

  if (selectedSheets.length === 0) {
    throw new Error("Nenhuma aba foi selecionada para conversão.");
  }

  onProgress?.("Calculando páginas e layout...", selectedSheets[0].name, 1, selectedSheets.length, 0, 0, 10);

  // Calculate all page chunks across all selected sheets
  const allChunks: PageChunk[] = [];
  for (const sheet of selectedSheets) {
    const chunks = calculatePageChunksForSheet(sheet, settings);
    allChunks.push(...chunks);
  }

  const totalPages = Math.max(1, allChunks.length);
  const pdfDoc = await PDFDocument.create();

  // Embed standard Helvetica fonts for native vector text
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  let totalCellsProcessed = 0;
  let uncalculatedFormulasCount = 0;
  let totalImagesInsertedCount = 0;

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    const sheet = fileData.sheets.find((s) => s.id === chunk.sheetId) || selectedSheets[0];

    const currentSheetIdx = selectedSheets.findIndex((s) => s.id === chunk.sheetId) + 1;
    const progressPercent = Math.min(95, 15 + Math.round((i / totalPages) * 80));

    onProgress?.(
      `Gerando página ${i + 1} de ${totalPages} (${chunk.sheetCustomName})`,
      chunk.sheetCustomName,
      currentSheetIdx,
      selectedSheets.length,
      i + 1,
      totalPages,
      progressPercent
    );

    // Create a new vector PDF Page
    const pdfPage = pdfDoc.addPage([chunk.widthPt, chunk.heightPt]);

    // Fill page white background
    pdfPage.drawRectangle({
      x: 0,
      y: 0,
      width: chunk.widthPt,
      height: chunk.heightPt,
      color: parsePdfColor("#ffffff")
    });

    // Header & Footer Vector Drawing
    if (settings.headerFooter.enabled) {
      const headerPdfY = chunk.heightPt - (chunk.marginPt.top / 2) - 4;
      const footerPdfY = (chunk.marginPt.bottom / 2) + 2;

      const headerText = settings.headerFooter.showSheetName
        ? chunk.sheetCustomName
        : settings.headerFooter.showFilename
        ? fileData.filename
        : "";

      if (headerText) {
        const cleanHeader = sanitizeForWinAnsi(headerText);
        pdfPage.drawText(cleanHeader, {
          x: chunk.marginPt.left,
          y: headerPdfY,
          size: 8,
          font: fontRegular,
          color: parsePdfColor("#64748b")
        });
      }

      if (settings.headerFooter.showDate) {
        const todayStr = new Date().toLocaleDateString("pt-BR");
        const dateWidth = fontRegular.widthOfTextAtSize(todayStr, 8);
        pdfPage.drawText(todayStr, {
          x: chunk.widthPt - chunk.marginPt.right - dateWidth,
          y: headerPdfY,
          size: 8,
          font: fontRegular,
          color: parsePdfColor("#64748b")
        });
      }

      if (settings.headerFooter.showPageNumber) {
        const pageStr = `Página ${i + 1} de ${totalPages}`;
        const pageStrWidth = fontRegular.widthOfTextAtSize(pageStr, 8);
        pdfPage.drawText(pageStr, {
          x: (chunk.widthPt - pageStrWidth) / 2,
          y: footerPdfY,
          size: 8,
          font: fontRegular,
          color: parsePdfColor("#64748b")
        });
      }

      if (settings.headerFooter.customText) {
        const cleanCustom = sanitizeForWinAnsi(settings.headerFooter.customText);
        pdfPage.drawText(cleanCustom, {
          x: chunk.marginPt.left,
          y: footerPdfY,
          size: 8,
          font: fontRegular,
          color: parsePdfColor("#64748b")
        });
      }
    }

    // Table Content Geometry
    const contentX = chunk.marginPt.left;
    const contentY = chunk.marginPt.top + (settings.headerFooter.enabled ? 15 : 0);
    const availableWidthPt = chunk.widthPt - chunk.marginPt.left - chunk.marginPt.right;

    const PX_TO_PT = 0.75;
    const colWidthsPt: number[] = [];
    let sumColWidthsPt = 0;

    for (let c = chunk.startCol; c <= chunk.endCol; c++) {
      const idx = c - sheet.minCol;
      const wPt = (sheet.colWidths[idx] || 85) * PX_TO_PT * chunk.scale;
      colWidthsPt.push(wPt);
      sumColWidthsPt += wPt;
    }

    // Center table horizontally if narrower than available printable width
    let startX = contentX;
    if (sumColWidthsPt < availableWidthPt && settings.scalingMode !== "fit_columns") {
      startX = contentX + (availableWidthPt - sumColWidthsPt) / 2;
    }

    let currentY = contentY;

    // Helper to render a single row natively into PDF
    const renderRowVector = (rowIdx: number, isHeaderRow: boolean) => {
      const rIdx = rowIdx - sheet.minRow;
      const rowHeightPt = (sheet.rowHeights[rIdx] || 24) * PX_TO_PT * chunk.scale;

      let currentX = startX;

      for (let c = chunk.startCol; c <= chunk.endCol; c++) {
        const colOffset = c - chunk.startCol;
        const colW = colWidthsPt[colOffset];

        // Check if merged range cell
        let isMergedChild = false;
        let mergeOrigin: { s: { r: number; c: number }; e: { r: number; c: number } } | null = null;

        if (sheet.merges && sheet.merges.length > 0) {
          for (const m of sheet.merges) {
            if (rowIdx >= m.s.r && rowIdx <= m.e.r && c >= m.s.c && c <= m.e.c) {
              if (rowIdx !== m.s.r || c !== m.s.c) {
                isMergedChild = true;
              } else {
                mergeOrigin = m;
              }
              break;
            }
          }
        }

        if (!isMergedChild) {
          totalCellsProcessed++;

          const cellKey = `${rowIdx}_${c}`;
          const cell = sheet.cells[cellKey];

          // Calculate effective cell width and height (accounting for merges)
          let effectiveColW = colW;
          let effectiveRowH = rowHeightPt;

          if (mergeOrigin) {
            let mWidth = 0;
            for (let mc = mergeOrigin.s.c; mc <= Math.min(mergeOrigin.e.c, chunk.endCol); mc++) {
              const mOffset = mc - chunk.startCol;
              if (mOffset >= 0 && mOffset < colWidthsPt.length) {
                mWidth += colWidthsPt[mOffset];
              }
            }
            effectiveColW = Math.max(colW, mWidth);

            let mHeight = 0;
            for (let mr = mergeOrigin.s.r; mr <= Math.min(mergeOrigin.e.r, chunk.endRow); mr++) {
              const mrIdx = mr - sheet.minRow;
              mHeight += (sheet.rowHeights[mrIdx] || 24) * PX_TO_PT * chunk.scale;
            }
            effectiveRowH = Math.max(rowHeightPt, mHeight);
          }

          // PDF Y coordinate (0,0 is bottom-left in pdf-lib)
          const pdfCellX = currentX;
          const pdfCellY = chunk.heightPt - currentY - effectiveRowH;

          // Determine effective Cell Background Color
          let fillHex = cell?.bgColor;
          if (!fillHex) {
            if (rowIdx === sheet.minRow) {
              // Main Sheet Title Row
              fillHex = "#1E3A8A"; // Dark executive blue
            } else if (isHeaderRow || (rowIdx === sheet.minRow + 1 && cell?.bold)) {
              // Table Header Row
              fillHex = "#2563EB"; // Header royal blue
            } else {
              fillHex = "#ffffff"; // Default body cell background
            }
          }

          const fillColor = parsePdfColor(fillHex, "#ffffff");

          // Determine Text Color with High-Contrast Automatic Whites for Dark Fills
          let textColorHex = cell?.textColor;
          if (!textColorHex) {
            const isDarkBg =
              fillHex.toLowerCase().startsWith("#1e") ||
              fillHex.toLowerCase().startsWith("#0f") ||
              fillHex.toLowerCase().startsWith("#25") ||
              fillHex.toLowerCase().startsWith("#1d") ||
              fillHex.toLowerCase().startsWith("#15") ||
              fillHex.toLowerCase().startsWith("#b9") ||
              fillHex.toLowerCase().startsWith("#11") ||
              fillHex.toLowerCase().startsWith("#00") ||
              fillHex.toLowerCase() === "#1a202c";

            if (isDarkBg) {
              textColorHex = "#ffffff";
            } else if (rowIdx === sheet.minRow || isHeaderRow) {
              textColorHex = "#ffffff";
            } else {
              textColorHex = "#1e293b";
            }
          }

          const textColor = parsePdfColor(textColorHex, "#1e293b");

          // Fill Cell Background
          pdfPage.drawRectangle({
            x: pdfCellX,
            y: pdfCellY,
            width: effectiveColW,
            height: effectiveRowH,
            color: fillColor
          });

          // Draw Per-Side Custom Borders or Standard Table Gridline
          const borderObj = cell?.border;
          const isDefaultLightFill = fillHex.toLowerCase() === "#ffffff";
          const defaultGridColor = parsePdfColor(isDefaultLightFill ? "#cbd5e1" : "#3b82f6");

          if (borderObj && (borderObj.top || borderObj.bottom || borderObj.left || borderObj.right)) {
            // Top Side
            if (borderObj.top) {
              pdfPage.drawLine({
                start: { x: pdfCellX, y: pdfCellY + effectiveRowH },
                end: { x: pdfCellX + effectiveColW, y: pdfCellY + effectiveRowH },
                thickness: (borderObj.top.width || 0.75) * chunk.scale,
                color: parsePdfColor(borderObj.top.color, "#cbd5e1")
              });
            }
            // Bottom Side
            if (borderObj.bottom) {
              pdfPage.drawLine({
                start: { x: pdfCellX, y: pdfCellY },
                end: { x: pdfCellX + effectiveColW, y: pdfCellY },
                thickness: (borderObj.bottom.width || 0.75) * chunk.scale,
                color: parsePdfColor(borderObj.bottom.color, "#cbd5e1")
              });
            }
            // Left Side
            if (borderObj.left) {
              pdfPage.drawLine({
                start: { x: pdfCellX, y: pdfCellY },
                end: { x: pdfCellX, y: pdfCellY + effectiveRowH },
                thickness: (borderObj.left.width || 0.75) * chunk.scale,
                color: parsePdfColor(borderObj.left.color, "#cbd5e1")
              });
            }
            // Right Side
            if (borderObj.right) {
              pdfPage.drawLine({
                start: { x: pdfCellX + effectiveColW, y: pdfCellY },
                end: { x: pdfCellX + effectiveColW, y: pdfCellY + effectiveRowH },
                thickness: (borderObj.right.width || 0.75) * chunk.scale,
                color: parsePdfColor(borderObj.right.color, "#cbd5e1")
              });
            }
          } else {
            // Draw default table cell bounding box
            pdfPage.drawRectangle({
              x: pdfCellX,
              y: pdfCellY,
              width: effectiveColW,
              height: effectiveRowH,
              borderColor: defaultGridColor,
              borderWidth: 0.5
            });
          }

          // Render Text
          if (cell) {
            if (cell.f && (cell.v === undefined || cell.v === null || cell.v === "")) {
              uncalculatedFormulasCount++;
            }

            const rawText = formatCellValueForDisplay(cell);
            if (rawText) {
              const cleanText = sanitizeForWinAnsi(rawText);
              if (cleanText) {
                const fontSize = Math.max(7, Math.min(14, (cell.fontSize || 11) * chunk.scale * 0.9));
                const isBold = isHeaderRow || cell.bold;
                const isItalic = Boolean(cell.italic);

                const fontToUse = isBold && isItalic
                  ? fontBoldOblique
                  : isBold
                  ? fontBold
                  : isItalic
                  ? fontOblique
                  : fontRegular;

                const padding = 4;
                const maxAllowedWidth = effectiveColW - (padding * 2);

                // Truncate text with ellipsis if exceeding cell width
                let textToDraw = cleanText;
                if (maxAllowedWidth > 5 && fontToUse.widthOfTextAtSize(textToDraw, fontSize) > maxAllowedWidth) {
                  while (textToDraw.length > 1 && fontToUse.widthOfTextAtSize(textToDraw + "...", fontSize) > maxAllowedWidth) {
                    textToDraw = textToDraw.substring(0, textToDraw.length - 1);
                  }
                  if (textToDraw.length < cleanText.length) {
                    textToDraw = textToDraw + "...";
                  }
                }

                const measuredWidth = fontToUse.widthOfTextAtSize(textToDraw, fontSize);

                // Horizontal position
                let textX = pdfCellX + padding;
                if (cell.align === "right") {
                  textX = pdfCellX + effectiveColW - padding - measuredWidth;
                } else if (cell.align === "center") {
                  textX = pdfCellX + (effectiveColW - measuredWidth) / 2;
                }
                textX = Math.max(pdfCellX + 2, textX);

                // Vertical baseline position according to verticalAlign
                let textY = pdfCellY + ((effectiveRowH - fontSize) / 2) + (fontSize * 0.15);
                if (cell.verticalAlign === "top") {
                  textY = pdfCellY + effectiveRowH - padding - fontSize + (fontSize * 0.15);
                } else if (cell.verticalAlign === "bottom") {
                  textY = pdfCellY + padding + (fontSize * 0.15);
                }

                if (maxAllowedWidth > 2) {
                  pdfPage.drawText(textToDraw, {
                    x: textX,
                    y: textY,
                    size: fontSize,
                    font: fontToUse,
                    color: textColor
                  });
                }
              }
            }
          }
        }

        currentX += colW;
      }

      currentY += rowHeightPt;
    };

    // Render repeated header rows first if present and not on first page
    if (chunk.repeatRows && chunk.repeatRows.length > 0) {
      for (const r of chunk.repeatRows) {
        renderRowVector(r, true);
      }
    }

    // Render normal rows for this chunk
    for (let r = chunk.startRow; r <= chunk.endRow; r++) {
      if (chunk.repeatRows && chunk.repeatRows.includes(r)) {
        continue; // Skip duplicate if already drawn in header
      }
      renderRowVector(r, false);
    }

    // Embed and render static images if present in sheet
    if (sheet.images && sheet.images.length > 0 && i === 0) {
      for (const img of sheet.images) {
        try {
          const embedded = img.type === "png"
            ? await pdfDoc.embedPng(img.data)
            : await pdfDoc.embedJpg(img.data);

          const imgW = (img.widthPx || 180) * PX_TO_PT * chunk.scale;
          const imgH = (img.heightPx || 120) * PX_TO_PT * chunk.scale;

          // Position image near top right of sheet printable area
          const imgX = chunk.widthPt - chunk.marginPt.right - imgW - 10;
          const imgY = chunk.heightPt - contentY - imgH - 10;

          pdfPage.drawImage(embedded, {
            x: imgX,
            y: imgY,
            width: imgW,
            height: imgH
          });

          totalImagesInsertedCount++;
        } catch (e) {
          // Skip unparseable image silently
        }
      }
    }
  }

  onProgress?.("Finalizando documento PDF...", selectedSheets[0].name, selectedSheets.length, selectedSheets.length, totalPages, totalPages, 98);

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
  const pdfBlobUrl = URL.createObjectURL(pdfBlob);

  const rawName = fileData.filename.replace(/\.[^/.]+$/, "");
  const finalFilename = outputFilename?.trim()
    ? outputFilename.endsWith(".pdf")
      ? outputFilename
      : `${outputFilename}.pdf`
    : `${rawName}-convertido.pdf`;

  const warningsList = [...fileData.warnings];
  if (uncalculatedFormulasCount > 0) {
    warningsList.push(`${uncalculatedFormulasCount} células contêm fórmulas sem resultado pré-calculado no arquivo.`);
  }

  const processingTimeMs = Date.now() - startTime;

  return {
    filename: fileData.filename,
    pdfFilename: finalFilename,
    pdfBlobUrl,
    pdfBytes,
    pdfSize: pdfBlob.size,
    convertedSheets: selectedSheets.map((s) => s.customName || s.name),
    skippedSheets,
    totalCellsProcessed,
    uncalculatedFormulasCount,
    generatedPagesCount: totalPages,
    unsupportedFeatures: fileData.unsupportedFeatures,
    warnings: warningsList,
    orientationUsed: allChunks[0]?.orientation === "landscape" ? "Paisagem" : "Retrato",
    pageSizeUsed: settings.pageSize,
    imagesDetectedCount: fileData.detectedImagesCount,
    imagesInsertedCount: totalImagesInsertedCount,
    chartsDetectedCount: fileData.detectedChartsCount,
    processingTimeMs
  };
}
