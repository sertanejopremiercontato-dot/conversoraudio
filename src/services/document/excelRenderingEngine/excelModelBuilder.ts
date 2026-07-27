import * as XLSX from "xlsx";
import JSZip from "jszip";
import {
  WorkbookVisualModel,
  SheetVisualModel,
  CellVisualModel,
  CellStyleModel,
  EmbeddedImageModel,
  MergedRangeModel,
  WorkbookWarning,
  ExcelRenderingOptions
} from "./types";
import { parseExcelThemeXml } from "./excelThemeParser";
import { parseExcelStylesXml } from "./excelStylesParser";
import {
  parseSheetConditionalFormattingXml,
  isCellInSqref,
  evaluateConditionalRule
} from "./excelConditionalFormattingParser";

function colIndexToName(colIdx: number): string {
  let temp = colIdx + 1;
  let letter = "";
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

export async function buildWorkbookVisualModelFromData(
  fileData: ArrayBuffer,
  filename: string,
  options: ExcelRenderingOptions = {}
): Promise<WorkbookVisualModel> {
  const startTime = Date.now();
  const warnings: WorkbookWarning[] = [];
  const unsupportedFeatures: string[] = [];

  // Defaults
  const defaultFontFamily = options.defaultFontFamily || "Calibri";
  const defaultFontSizePt = options.defaultFontSizePt || 11;
  const fallbackColWidthPx = options.fallbackColWidthPx || 85;
  const fallbackRowHeightPx = options.fallbackRowHeightPx || 24;
  const evaluateCF = options.evaluateConditionalFormatting !== false;

  // 1. Read SheetJS Workbook
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(fileData, {
      type: "array",
      cellStyles: true,
      cellFormula: true,
      cellNF: true,
      cellDates: true,
    });
  } catch (err: any) {
    throw new Error(`Falha ao ler arquivo Excel: ${err?.message || "Formato inválido"}`);
  }

  // 2. Read Zip for OpenXML details
  let zip: JSZip | null = null;
  try {
    zip = await JSZip.loadAsync(fileData);
  } catch (_) {
    // Zip reading might fail for old XLS, handled gracefully
  }

  // 3. Parse Theme
  let themeXmlStr: string | undefined = undefined;
  if (zip) {
    const themeFile = zip.file("xl/theme/theme1.xml") || zip.file("xl/theme/theme2.xml");
    if (themeFile) {
      themeXmlStr = await themeFile.async("text");
    }
  }
  const theme = parseExcelThemeXml(themeXmlStr);

  // 4. Parse Styles
  let stylesXmlStr: string | undefined = undefined;
  if (zip) {
    const stylesFile = zip.file("xl/styles.xml");
    if (stylesFile) {
      stylesXmlStr = await stylesFile.async("text");
    }
  }
  const openXmlStyles = parseExcelStylesXml(stylesXmlStr, theme.colorPalette);

  // 5. Detect Media and Images
  const mediaImages: Record<string, Uint8Array> = {};
  let totalImagesCount = 0;
  if (zip) {
    const mediaFolder = zip.folder("xl/media");
    if (mediaFolder) {
      const files = mediaFolder.file(/./);
      for (const imgFile of files) {
        const data = await imgFile.async("uint8array");
        const path = imgFile.name;
        mediaImages[path] = data;
        totalImagesCount++;
      }
    }
  }

  // 6. Detect Charts
  let totalChartsCount = 0;
  if (zip) {
    const chartsFolder = zip.folder("xl/charts");
    if (chartsFolder) {
      const chartFiles = chartsFolder.file(/./);
      totalChartsCount = chartFiles.length;
      if (totalChartsCount > 0) {
        unsupportedFeatures.push(`${totalChartsCount} gráfico(s) detectado(s). O modo local converte dados e formatações, mas não renderiza vetores de gráficos.`);
      }
    }
  }

  // 7. Parse Sheets
  const sheets: SheetVisualModel[] = [];

  for (let sIdx = 0; sIdx < wb.SheetNames.length; sIdx++) {
    const sheetName = wb.SheetNames[sIdx];
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const sheetWarnings: string[] = [];

    // Range bounds
    const ref = ws["!ref"] || "A1:A1";
    const range = XLSX.utils.decode_range(ref);
    const minRow = range.s.r;
    const maxRow = range.e.r;
    const minCol = range.s.c;
    const maxCol = range.e.c;
    const totalRows = maxRow - minRow + 1;
    const totalCols = maxCol - minCol + 1;

    // Load sheet XML from zip if available
    let sheetXmlStr: string | undefined = undefined;
    if (zip) {
      const sheetFile = zip.file(`xl/worksheets/sheet${sIdx + 1}.xml`) || zip.file(`xl/worksheets/sheet${sIdx}.xml`);
      if (sheetFile) {
        sheetXmlStr = await sheetFile.async("text");
      }
    }

    // Parse Sheet Conditional Formatting
    const sheetCFs = sheetXmlStr ? parseSheetConditionalFormattingXml(sheetXmlStr, openXmlStyles.dxfs) : [];

    // Page setup orientation
    let orientation: "portrait" | "landscape" = "portrait";
    if (ws["!pageSetup"] && ws["!pageSetup"].orientation) {
      orientation = ws["!pageSetup"].orientation.toLowerCase() === "landscape" ? "landscape" : "portrait";
    } else if (sheetXmlStr && sheetXmlStr.includes('orientation="landscape"')) {
      orientation = "landscape";
    }

    // Column widths
    const colWidthsPx: number[] = [];
    const colWidthOrigins: ("EXPLICIT" | "CALCULATED" | "DEFAULT")[] = [];

    for (let c = minCol; c <= maxCol; c++) {
      let widthPx = fallbackColWidthPx;
      let origin: "EXPLICIT" | "CALCULATED" | "DEFAULT" = "DEFAULT";

      if (ws["!cols"] && ws["!cols"][c]) {
        const colInfo = ws["!cols"][c];
        if (colInfo.wpx) {
          widthPx = colInfo.wpx;
          origin = "EXPLICIT";
        } else if (colInfo.wch) {
          widthPx = Math.round(colInfo.wch * 7.5);
          origin = "CALCULATED";
        }
      }
      colWidthsPx.push(widthPx);
      colWidthOrigins.push(origin);
    }

    // Row heights
    const rowHeightsPx: number[] = [];
    const rowHeightOrigins: ("EXPLICIT" | "CALCULATED" | "DEFAULT")[] = [];

    for (let r = minRow; r <= maxRow; r++) {
      let heightPx = fallbackRowHeightPx;
      let origin: "EXPLICIT" | "CALCULATED" | "DEFAULT" = "DEFAULT";

      if (ws["!rows"] && ws["!rows"][r]) {
        const rowInfo = ws["!rows"][r];
        if (rowInfo.hpx) {
          heightPx = rowInfo.hpx;
          origin = "EXPLICIT";
        } else if (rowInfo.hpt) {
          heightPx = Math.round(rowInfo.hpt * 1.333);
          origin = "CALCULATED";
        }
      }
      rowHeightsPx.push(heightPx);
      rowHeightOrigins.push(origin);
    }

    // Merged ranges
    const mergedRanges: MergedRangeModel[] = [];
    const mergedMap: Record<string, { isTopLeft: boolean; mainAddress: string; rowSpan: number; colSpan: number }> = {};

    if (ws["!merges"]) {
      ws["!merges"].forEach((m) => {
        const startRow = m.s.r;
        const startCol = m.s.c;
        const endRow = m.e.r;
        const endCol = m.e.c;
        const rowSpan = endRow - startRow + 1;
        const colSpan = endCol - startCol + 1;

        mergedRanges.push({ startRow, startCol, endRow, endCol, rowSpan, colSpan });

        const mainAddr = `${colIndexToName(startCol)}${startRow + 1}`;
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const key = `${r}_${c}`;
            mergedMap[key] = {
              isTopLeft: r === startRow && c === startCol,
              mainAddress: mainAddr,
              rowSpan,
              colSpan,
            };
          }
        }
      });
    }

    // Embedded Images for this sheet
    const sheetImages: EmbeddedImageModel[] = [];
    let imgIdx = 1;
    for (const [imgPath, imgBytes] of Object.entries(mediaImages)) {
      const ext = imgPath.split(".").pop()?.toLowerCase() || "png";
      const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : "image/png";

      sheetImages.push({
        id: `img_${sIdx}_${imgIdx}`,
        name: `Imagem ${imgIdx}`,
        mimeType,
        data: imgBytes,
        sheetName,
        widthPx: 200,
        heightPx: 120,
        isPositionResolved: true,
      });
      imgIdx++;
    }

    // Cells processing
    const cells: Record<string, CellVisualModel> = {};

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cellAddr = `${colIndexToName(c)}${r + 1}`;
        const cellKey = `${r}_${c}`;
        const rawCell = ws[cellAddr];

        const widthPx = colWidthsPx[c - minCol] || fallbackColWidthPx;
        const heightPx = rowHeightsPx[r - minRow] || fallbackRowHeightPx;

        // Base cell values
        let rawValue: any = null;
        let formattedText = "";
        let formula: string | undefined = undefined;
        let cellType: "string" | "number" | "boolean" | "date" | "error" | "empty" = "empty";

        if (rawCell) {
          rawValue = rawCell.v;
          formula = rawCell.f ? `=` + rawCell.f : undefined;

          if (rawCell.w !== undefined) {
            formattedText = String(rawCell.w);
          } else if (rawCell.v !== undefined && rawCell.v !== null) {
            formattedText = String(rawCell.v);
          }

          if (rawCell.t === "n") cellType = "number";
          else if (rawCell.t === "b") cellType = "boolean";
          else if (rawCell.t === "d") cellType = "date";
          else if (rawCell.t === "e") cellType = "error";
          else if (rawCell.t === "s" || formattedText) cellType = "string";
        }

        // Cell Style Resolution
        let style: CellStyleModel = {
          fontFamily: defaultFontFamily,
          fontSizePt: defaultFontSizePt,
          textColor: "#000000",
          backgroundColor: "",
          bold: false,
          italic: false,
          underline: false,
        };

        // OpenXML style index
        if (rawCell && rawCell.s !== undefined) {
          const sId = typeof rawCell.s === "number" ? rawCell.s : parseInt(String(rawCell.s), 10);
          if (!isNaN(sId) && openXmlStyles.cellXfs[sId]) {
            style = { ...openXmlStyles.cellXfs[sId] };
          }
        }

        // Alignment fallback based on cell type if unassigned
        if (!style.horizontalAlignment) {
          if (cellType === "number") style.horizontalAlignment = "right";
          else if (cellType === "boolean" || cellType === "error") style.horizontalAlignment = "center";
          else style.horizontalAlignment = "left";
        }

        // Conditional Formatting Evaluation
        const cfApplied: string[] = [];
        if (evaluateCF && sheetCFs.length > 0 && rawValue !== null && rawValue !== undefined) {
          sheetCFs.forEach((cf) => {
            if (isCellInSqref(r, c, cf.sqref)) {
              cf.rules.forEach((rule) => {
                if (evaluateConditionalRule(rawValue, rule) && rule.styleOverride) {
                  style = { ...style, ...rule.styleOverride };
                  cfApplied.push(`${rule.type}:${rule.operator || "match"}`);
                }
              });
            }
          });
        }

        const mergeInfo = mergedMap[cellKey];

        cells[cellKey] = {
          address: cellAddr,
          row: r,
          col: c,
          rawValue,
          formattedText,
          formula,
          type: cellType,
          widthPx,
          heightPx,
          style,
          mergeInfo,
          conditionalFormattingApplied: cfApplied.length > 0 ? cfApplied : undefined,
          isVisible: true,
        };
      }
    }

    sheets.push({
      id: `sheet_${sIdx}`,
      name: sheetName,
      index: sIdx,
      usedRange: { minRow, maxRow, minCol, maxCol, totalRows, totalCols },
      cells,
      colWidthsPx,
      colWidthOrigins,
      rowHeightsPx,
      rowHeightOrigins,
      mergedRanges,
      images: sheetImages,
      detectedChartsCount: totalChartsCount,
      hiddenRows: [],
      hiddenCols: [],
      orientation,
      marginsPt: { top: 36, bottom: 36, left: 36, right: 36, header: 18, footer: 18 },
      warnings: sheetWarnings,
    });
  }

  const processingTimeMs = Date.now() - startTime;

  return {
    filename,
    sheets,
    theme,
    warnings,
    detectedChartsCount: totalChartsCount,
    detectedImagesCount: totalImagesCount,
    unsupportedFeatures,
    processingTimeMs,
  };
}
