import * as XLSX from "xlsx";

export interface ParsedCell {
  r: number;
  c: number;
  v: any; // raw value
  w: string; // formatted text string
  f?: string; // formula if present
  t?: string; // type: 's'|'n'|'b'|'d'|'e'
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  border?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
  };
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
}

export interface ParsedExcelFile {
  filename: string;
  filesize: number;
  sheets: ParsedSheet[];
  unsupportedFeatures: string[];
  warnings: string[];
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
    if (colorObj.rgb) {
      const rgbStr = String(colorObj.rgb).trim();
      if (rgbStr.length === 8) return `#${rgbStr.substring(2)}`;
      if (rgbStr.length === 6) return `#${rgbStr}`;
    }
    if (colorObj.theme !== undefined) {
      const themeColors = [
        "#FFFFFF", // 0: System / White
        "#000000", // 1: System / Black
        "#E7E6E6", // 2: Light Gray
        "#1E293B", // 3: Dark Navy / Slate
        "#1E3A8A", // 4: Dark Blue / Accent 1
        "#2563EB", // 5: Blue / Accent 2
        "#ED7D31", // 6: Orange / Accent 3
        "#A5A5A5", // 7: Gray / Accent 4
        "#4472C4", // 8: Ice Blue / Accent 5
        "#70AD47"  // 9: Green / Accent 6
      ];
      const baseHex = themeColors[colorObj.theme] || defaultColor;
      return baseHex;
    }
    if (colorObj.indexed !== undefined) {
      // Standard Excel indexed colors
      const indexedColors: Record<number, string> = {
        8: "#000000", 9: "#FFFFFF", 10: "#FF0000", 11: "#00FF00", 12: "#0000FF",
        13: "#FFFF00", 14: "#FF00FF", 15: "#00FFFF", 64: "#FFFFFF"
      };
      if (indexedColors[colorObj.indexed]) return indexedColors[colorObj.indexed];
    }
  }

  return defaultColor;
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
    let hasCharts = false;
    let hasMacros = false;
    let hasImages = false;

    // Check drawing / chart / object properties
    if (sheet["!drawing"] || sheet["!chart"] || (sheet as any)["!drawings"]) {
      hasCharts = true;
      unsupportedFeaturesSet.add("Gráficos e objetos visuais flutuantes");
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
        colWidths.push(Math.max(40, colInfo.wch * 8)); // convert ch to px estimate
      } else if (colInfo && colInfo.wpx) {
        colWidths.push(colInfo.wpx);
      } else {
        colWidths.push(80); // Default width
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
        const align = alignment.horizontal === "right" ? "right" : alignment.horizontal === "center" ? "center" : "left";

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

        // Check top sheet title row / header row heuristics for executive fidelity
        if (!bgColor && r === minRow) {
          // Check if merged range at top row
          const isMergedTopTitle = merges.some((m) => m.s.r === r && m.s.c === c && (m.e.c - m.s.c) >= 2);
          if (isMergedTopTitle || (c === minCol && String(formattedVal).length > 10)) {
            bgColor = "#1E3A8A"; // Dark blue title
            textColor = "#FFFFFF";
            bold = true;
            fontSize = Math.max(fontSize, 14);
          }
        }

        const cellBorder = {
          top: Boolean(border.top),
          bottom: Boolean(border.bottom),
          left: Boolean(border.left),
          right: Boolean(border.right)
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
          align,
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
      hasImages
    });
  }

  const unsupportedFeatures = Array.from(unsupportedFeaturesSet);

  return {
    filename: file.name,
    filesize: file.size,
    sheets,
    unsupportedFeatures,
    warnings: globalWarnings
  };
}
