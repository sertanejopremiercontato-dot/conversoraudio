import * as XLSX from "xlsx";
import JSZip from "jszip";

export interface ParsedBorderEdge {
  style?: string;
  color?: string;
  width?: number; // in pt
}

export interface ParsedBorder {
  top?: ParsedBorderEdge;
  bottom?: ParsedBorderEdge;
  left?: ParsedBorderEdge;
  right?: ParsedBorderEdge;
}

export interface EmbeddedImage {
  id: string;
  name: string;
  type: "png" | "jpeg";
  data: Uint8Array;
  row: number;
  col: number;
  widthPx?: number;
  heightPx?: number;
}

export interface ParsedCell {
  r: number;
  c: number;
  v: any; // raw value
  w: string; // formatted text string
  f?: string; // formula if present
  t?: string; // type: 's'|'n'|'b'|'d'|'e'
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right" | "justify";
  verticalAlign?: "top" | "middle" | "bottom";
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  border?: ParsedBorder;
}

export interface ParsedMergeRange {
  s: { r: number; c: number };
  e: { r: number; c: number };
}

export interface ParsedSheet {
  id: string;
  name: string;
  customName: string; // User can rename sheet for PDF output
  selected: boolean;
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
  rowCount: number;
  colCount: number;
  cells: Record<string, ParsedCell>; // Key: `${r}_${c}`
  merges: ParsedMergeRange[];
  colWidths: number[]; // Estimated/parsed column widths
  rowHeights: number[]; // Estimated/parsed row heights
  hasUncalculatedFormulas: boolean;
  hasCharts: boolean;
  hasMacros: boolean;
  hasImages: boolean;
  images: EmbeddedImage[];
}

export interface ParsedExcelFile {
  filename: string;
  filesize: number;
  sheets: ParsedSheet[];
  unsupportedFeatures: string[];
  warnings: string[];
  detectedChartsCount: number;
  detectedImagesCount: number;
}

// Convert RGB hex string and apply tint factor (-1.0 to 1.0)
function applyTint(rgbHex: string, tint: number | undefined): string {
  if (!tint || tint === 0) return rgbHex;
  let hex = rgbHex.replace("#", "");
  if (hex.length === 8) hex = hex.substring(2);
  if (hex.length !== 6) return rgbHex;

  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  if (tint > 0) {
    r = Math.round(r + (255 - r) * tint);
    g = Math.round(g + (255 - g) * tint);
    b = Math.round(b + (255 - b) * tint);
  } else {
    r = Math.round(r * (1 + tint));
    g = Math.round(g * (1 + tint));
    b = Math.round(b * (1 + tint));
  }

  const toHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert hex color or ARGB object to CSS hex/rgb string with theme & tint support
function parseCellColor(colorObj: any, defaultColor: string): string {
  if (!colorObj) return defaultColor;

  if (typeof colorObj === "string") {
    let str = colorObj.trim();
    if (str.startsWith("#")) return str;
    if (str.length === 8) return `#${str.substring(2)}`; // Skip alpha if ARGB
    if (str.length === 6) return `#${str}`;
  }

  if (typeof colorObj === "object") {
    let baseColor = "";
    if (colorObj.rgb) {
      const rgbStr = String(colorObj.rgb).trim();
      if (rgbStr.length === 8) baseColor = `#${rgbStr.substring(2)}`;
      else if (rgbStr.length === 6) baseColor = `#${rgbStr}`;
    } else if (colorObj.theme !== undefined) {
      const themeColors = [
        "#FFFFFF", // 0: System / White
        "#000000", // 1: System / Black
        "#E7E6E6", // 2: Light Gray / Background 2
        "#1E293B", // 3: Dark Navy / Text 2
        "#1E3A8A", // 4: Accent 1 (Dark Blue)
        "#2563EB", // 5: Accent 2 (Blue)
        "#ED7D31", // 6: Accent 3 (Orange)
        "#A5A5A5", // 7: Accent 4 (Gray)
        "#4472C4", // 8: Accent 5 (Ice Blue)
        "#70AD47"  // 9: Accent 6 (Green)
      ];
      baseColor = themeColors[colorObj.theme] || defaultColor;
    } else if (colorObj.indexed !== undefined) {
      const indexedColors: Record<number, string> = {
        0: "#000000", 1: "#FFFFFF", 2: "#FF0000", 3: "#00FF00", 4: "#0000FF",
        5: "#FFFF00", 6: "#FF00FF", 7: "#00FFFF", 8: "#000000", 9: "#FFFFFF",
        10: "#FF0000", 11: "#00FF00", 12: "#0000FF", 13: "#FFFF00", 14: "#FF00FF",
        15: "#00FFFF", 16: "#800000", 17: "#008000", 18: "#000080", 19: "#808000",
        20: "#800080", 21: "#008080", 22: "#C0C0C0", 23: "#808080", 24: "#9999FF",
        25: "#993366", 26: "#FFFFCC", 27: "#CCFFFF", 28: "#660066", 29: "#FF8080",
        30: "#0066CC", 31: "#CCCCFF", 64: "#FFFFFF"
      };
      baseColor = indexedColors[colorObj.indexed] || defaultColor;
    }

    if (baseColor) {
      const tint = typeof colorObj.tint === "number" ? colorObj.tint : undefined;
      return applyTint(baseColor, tint);
    }
  }

  return defaultColor;
}

// Convert XLSX border side to ParsedBorderEdge
function parseBorderSide(sideObj: any): ParsedBorderEdge | undefined {
  if (!sideObj) return undefined;

  let style = sideObj.style || "thin";
  let color = parseCellColor(sideObj.color, "#cbd5e1");

  let width = 0.75;
  if (style === "medium") width = 1.25;
  else if (style === "thick") width = 2.0;
  else if (style === "double") width = 1.75;
  else if (style === "dashed" || style === "dotted") width = 0.75;

  return { style, color, width };
}

// Format raw values into display strings if `w` is missing
function formatRawValue(val: any, type?: string, numFmt?: string): string {
  if (val === null || val === undefined) return "";

  if (val instanceof Date) {
    return val.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  if (typeof val === "boolean") {
    return val ? "VERDADEIRO" : "FALSO";
  }

  if (typeof val === "number") {
    const fmt = (numFmt || "").toLowerCase();

    // Currency check
    if (fmt.includes("$") || fmt.includes("r$") || fmt.includes("currency") || fmt.includes("moeda")) {
      return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    // Percentage check
    if (fmt.includes("%")) {
      const pctVal = val < 2 && val > -2 ? val * 100 : val;
      return `${pctVal.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
    }

    // Standard number
    if (Number.isInteger(val)) {
      return val.toLocaleString("pt-BR");
    } else {
      return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
  }

  return String(val);
}

// Helper to extract static images from XLSX zip buffer using JSZip
async function extractEmbeddedImages(arrayBuffer: ArrayBuffer): Promise<{
  images: EmbeddedImage[];
  hasChartsInZip: boolean;
}> {
  const images: EmbeddedImage[] = [];
  let hasChartsInZip = false;

  try {
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Check for chart objects in xl/charts/
    const chartFiles = Object.keys(zip.files).filter((f) => f.includes("xl/charts/"));
    if (chartFiles.length > 0) {
      hasChartsInZip = true;
    }

    // Find image files in xl/media/
    const mediaFiles = Object.keys(zip.files).filter(
      (f) => f.startsWith("xl/media/") && (f.endsWith(".png") || f.endsWith(".jpeg") || f.endsWith(".jpg"))
    );

    let imgIndex = 0;
    for (const path of mediaFiles) {
      const file = zip.files[path];
      if (!file || file.dir) continue;

      const data = await file.async("uint8array");
      const isPng = path.toLowerCase().endsWith(".png");
      const type: "png" | "jpeg" = isPng ? "png" : "jpeg";

      images.push({
        id: `img_${imgIndex}_${Date.now()}`,
        name: path.split("/").pop() || `Imagem ${imgIndex + 1}`,
        type,
        data,
        row: imgIndex * 4, // Default placement anchor if no drawing xml mapped
        col: 0,
        widthPx: 180,
        heightPx: 120
      });

      imgIndex++;
    }
  } catch (e) {
    // If JSZip fails, continue without embedded images
  }

  return { images, hasChartsInZip };
}

export async function readExcelFile(file: File): Promise<ParsedExcelFile> {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
  const MAX_SHEETS = 50;

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("O arquivo excede o limite máximo de 50 MB.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["xlsx", "xls", "csv"];
  if (!ext || !allowedExts.includes(ext)) {
    throw new Error("Formato não suportado. Por favor, envie um arquivo XLSX, XLS ou CSV.");
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (err) {
    throw new Error("Não foi possível ler o arquivo enviado. Verifique se o arquivo está corrompido.");
  }

  if (arrayBuffer.byteLength === 0) {
    throw new Error("O arquivo enviado está vazio (0 bytes).");
  }

  // Attempt ZIP extraction for images and charts
  const { images: extractedImages, hasChartsInZip } = await extractEmbeddedImages(arrayBuffer);

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(arrayBuffer, {
      type: "array",
      cellStyles: true,
      cellFormula: true,
      cellDates: true,
      cellNF: true,
      sheetStubs: true
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("encrypted") || msg.toLowerCase().includes("protegido")) {
      throw new Error("O arquivo Excel está protegido por senha. Remova a senha e tente novamente.");
    }
    throw new Error("Falha ao processar o arquivo Excel. O arquivo pode estar corrompido ou em formato inválido.");
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("Nenhuma planilha válida foi encontrada dentro do arquivo.");
  }

  const sheets: ParsedSheet[] = [];
  const unsupportedFeaturesSet = new Set<string>();
  const globalWarnings: string[] = [];

  let globalChartDetectedCount = 0;
  if (hasChartsInZip) {
    globalChartDetectedCount++;
    unsupportedFeaturesSet.add("Gráficos e objetos visuais flutuantes");
    globalWarnings.push("Esta planilha contém gráficos ou objetos avançados. Os dados e a formatação compatível foram convertidos, mas alguns gráficos podem não aparecer no PDF gerado pelo modo local.");
  }

  if (workbook.vbaraw || (workbook as any).Macros) {
    unsupportedFeaturesSet.add("Macros / Códigos VBA (não executados)");
  }

  const sheetCount = Math.min(workbook.SheetNames.length, MAX_SHEETS);
  if (workbook.SheetNames.length > MAX_SHEETS) {
    globalWarnings.push(`O arquivo contém ${workbook.SheetNames.length} abas. Apenas as primeiras 50 foram carregadas.`);
  }

  for (let sIdx = 0; sIdx < sheetCount; sIdx++) {
    const sheetName = workbook.SheetNames[sIdx];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) continue;

    const ref = sheet["!ref"];
    let range = { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
    if (ref) {
      try {
        range = XLSX.utils.decode_range(ref);
      } catch (e) {
        // Fallback default
      }
    }

    const minRow = range.s.r;
    const maxRow = range.e.r;
    const minCol = range.s.c;
    const maxCol = range.e.c;
    const rowCount = maxRow - minRow + 1;
    const colCount = maxCol - minCol + 1;

    let hasUncalculatedFormulas = false;
    let hasCharts = hasChartsInZip;
    let hasMacros = false;
    let hasImages = extractedImages.length > 0;

    // Check drawing / chart / object properties
    if (sheet["!drawing"] || sheet["!chart"] || (sheet as any)["!drawings"]) {
      hasCharts = true;
      globalChartDetectedCount++;
      unsupportedFeaturesSet.add("Gráficos e objetos visuais flutuantes");
      if (!globalWarnings.some((w) => w.includes("gráficos ou objetos"))) {
        globalWarnings.push("Esta planilha contém gráficos ou objetos avançados. Os dados e a formatação compatível foram convertidos, mas alguns gráficos podem não aparecer no PDF gerado pelo modo local.");
      }
    }

    // Merges
    const rawMerges = sheet["!merges"] || [];
    const merges: ParsedMergeRange[] = rawMerges.map((m) => ({
      s: { r: m.s.r, c: m.s.c },
      e: { r: m.e.r, c: m.e.c }
    }));

    // Column widths
    const rawCols = sheet["!cols"] || [];
    const colWidths: number[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      const colInfo = rawCols[c];
      if (colInfo && colInfo.wch) {
        colWidths.push(Math.max(45, colInfo.wch * 8.5)); // convert ch to px estimate
      } else if (colInfo && colInfo.wpx) {
        colWidths.push(colInfo.wpx);
      } else {
        colWidths.push(85); // Default width
      }
    }

    // Row heights
    const rawRows = sheet["!rows"] || [];
    const rowHeights: number[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const rowInfo = rawRows[r];
      if (rowInfo && rowInfo.hpt) {
        rowHeights.push(rowInfo.hpt * 1.33); // pt to px
      } else if (rowInfo && rowInfo.hpx) {
        rowHeights.push(rowInfo.hpx);
      } else {
        rowHeights.push(24); // Default height
      }
    }

    const cells: Record<string, ParsedCell> = {};

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[cellAddress];
        if (!cell) continue;

        let formattedVal = cell.w || "";
        if (!formattedVal && cell.v !== undefined && cell.v !== null) {
          formattedVal = formatRawValue(cell.v, cell.t, cell.z);
        }

        // Check formula without calculated value
        if (cell.f && (cell.v === undefined || cell.v === null)) {
          hasUncalculatedFormulas = true;
        }

        // Parse styles if present
        const style = cell.s || {};
        const font = style.font || {};
        const fill = style.fill || {};
        const alignment = style.alignment || {};
        const border = style.border || {};

        let bold = Boolean(font.bold);
        let italic = Boolean(font.italic);
        let underline = Boolean(font.underline);

        let hAlign: "left" | "center" | "right" | "justify" = "left";
        if (alignment.horizontal === "right") hAlign = "right";
        else if (alignment.horizontal === "center") hAlign = "center";
        else if (alignment.horizontal === "justify") hAlign = "justify";

        let vAlign: "top" | "middle" | "bottom" = "middle";
        if (alignment.vertical === "top") vAlign = "top";
        else if (alignment.vertical === "bottom") vAlign = "bottom";

        let bgColor = parseCellColor(fill.fgColor || fill.bgColor || fill.color, "");
        let textColor = parseCellColor(font.color, "");
        let fontSize = font.sz ? Number(font.sz) : 11;

        // Smart status badge detection fallback if style is unpopulated
        const lowerVal = String(formattedVal || cell.v || "").trim().toLowerCase();
        if (!bgColor) {
          if (["pago", "aprovado", "concluído", "concluido", "sim", "ativo", "ok"].includes(lowerVal)) {
            bgColor = "#DCFCE7";
            textColor = "#15803D";
            bold = true;
          } else if (["pendente", "em andamento", "aguardando", "processando"].includes(lowerVal)) {
            bgColor = "#FEF9C3";
            textColor = "#A16207";
            bold = true;
          } else if (["cancelado", "recusado", "inativo", "erro", "não", "nao"].includes(lowerVal)) {
            bgColor = "#FEE2E2";
            textColor = "#B91C1C";
            bold = true;
          }
        }

        // Check top sheet title row / header row heuristics
        if (!bgColor && r === minRow) {
          const isMergedTopTitle = merges.some((m) => m.s.r === r && m.s.c === c && (m.e.c - m.s.c) >= 2);
          if (isMergedTopTitle || (c === minCol && String(formattedVal).length > 10)) {
            bgColor = "#1E3A8A"; // Dark blue title
            textColor = "#FFFFFF";
            bold = true;
            fontSize = Math.max(fontSize, 14);
          }
        }

        const cellBorder: ParsedBorder = {
          top: parseBorderSide(border.top),
          bottom: parseBorderSide(border.bottom),
          left: parseBorderSide(border.left),
          right: parseBorderSide(border.right)
        };

        cells[`${r}_${c}`] = {
          r,
          c,
          v: cell.v ?? "",
          w: formattedVal,
          f: cell.f,
          t: cell.t,
          bold,
          italic,
          underline,
          align: hAlign,
          verticalAlign: vAlign,
          bgColor: bgColor !== "#ffffff" && bgColor !== "#FFFFFF" ? bgColor : "",
          textColor,
          fontSize: font.sz ? Number(font.sz) : 11,
          border: cellBorder
        };
      }
    }

    if (hasUncalculatedFormulas) {
      unsupportedFeaturesSet.add("Fórmulas sem resultado pré-calculado no arquivo");
    }

    // Attach extracted images if available for first sheet or matching index
    const sheetImages = sIdx === 0 ? extractedImages : [];

    sheets.push({
      id: `sheet_${sIdx}_${Date.now()}`,
      name: sheetName,
      customName: sheetName,
      selected: true,
      minRow,
      maxRow,
      minCol,
      maxCol,
      rowCount,
      colCount,
      cells,
      merges,
      colWidths,
      rowHeights,
      hasUncalculatedFormulas,
      hasCharts,
      hasMacros,
      hasImages,
      images: sheetImages
    });
  }

  const unsupportedFeatures = Array.from(unsupportedFeaturesSet);

  return {
    filename: file.name,
    filesize: file.size,
    sheets,
    unsupportedFeatures,
    warnings: globalWarnings,
    detectedChartsCount: globalChartDetectedCount,
    detectedImagesCount: extractedImages.length
  };
}

