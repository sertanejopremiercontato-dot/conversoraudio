export interface BorderEdgeModel {
  style?: "thin" | "medium" | "thick" | "dashed" | "dotted" | "double" | string;
  color?: string;
  widthPx?: number;
  widthPt?: number;
}

export interface CellBorderStyleModel {
  top?: BorderEdgeModel;
  bottom?: BorderEdgeModel;
  left?: BorderEdgeModel;
  right?: BorderEdgeModel;
}

export interface CellStyleModel {
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSizePt?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  horizontalAlignment?: "left" | "center" | "right" | "justify";
  verticalAlignment?: "top" | "middle" | "bottom";
  wrapText?: boolean;
  shrinkToFit?: boolean;
  textRotation?: number;
  borders?: CellBorderStyleModel;
}

export interface MergedRangeModel {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  rowSpan: number;
  colSpan: number;
}

export interface EmbeddedImageModel {
  id: string;
  name: string;
  mimeType: "image/png" | "image/jpeg" | "image/gif" | "image/svg+xml" | string;
  data: Uint8Array;
  sheetName?: string;
  startRow?: number;
  startCol?: number;
  endRow?: number;
  endCol?: number;
  offsetXPx?: number;
  offsetYPx?: number;
  widthPx?: number;
  heightPx?: number;
  aspectRatio?: number;
  isPositionResolved: boolean;
}

export interface ConditionalFormattingRule {
  type: "cellIs" | "containsText" | "beginsWith" | "endsWith" | "other";
  operator?: "equal" | "notEqual" | "greaterThan" | "lessThan" | "greaterThanOrEqual" | "lessThanOrEqual" | "between";
  formulae: string[];
  styleOverride?: Partial<CellStyleModel>;
  isSupported: boolean;
}

export interface CellVisualModel {
  address: string;
  row: number;
  col: number;
  rawValue: any;
  formattedText: string;
  formula?: string;
  type: "string" | "number" | "boolean" | "date" | "error" | "empty";
  widthPx: number;
  heightPx: number;
  style: CellStyleModel;
  mergeInfo?: {
    isTopLeft: boolean;
    mainAddress: string;
    rowSpan: number;
    colSpan: number;
  };
  conditionalFormattingApplied?: string[];
  isVisible: boolean;
}

export interface SheetVisualModel {
  id: string;
  name: string;
  index: number;
  usedRange: {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
    totalRows: number;
    totalCols: number;
  };
  cells: Record<string, CellVisualModel>;
  colWidthsPx: number[];
  colWidthOrigins: ("EXPLICIT" | "CALCULATED" | "DEFAULT")[];
  rowHeightsPx: number[];
  rowHeightOrigins: ("EXPLICIT" | "CALCULATED" | "DEFAULT")[];
  mergedRanges: MergedRangeModel[];
  images: EmbeddedImageModel[];
  detectedChartsCount: number;
  hiddenRows: number[];
  hiddenCols: number[];
  orientation: "portrait" | "landscape";
  marginsPt: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    header: number;
    footer: number;
  };
  printArea?: string;
  warnings: string[];
}

export interface WorkbookWarning {
  code: string;
  message: string;
  sheetName?: string;
}

export interface WorkbookTheme {
  themeName?: string;
  colorPalette: string[];
}

export interface WorkbookVisualModel {
  filename: string;
  sheets: SheetVisualModel[];
  theme: WorkbookTheme;
  warnings: WorkbookWarning[];
  detectedChartsCount: number;
  detectedImagesCount: number;
  unsupportedFeatures: string[];
  processingTimeMs: number;
}

export interface ExcelRenderingOptions {
  defaultFontFamily?: string;
  defaultFontSizePt?: number;
  fallbackColWidthPx?: number;
  fallbackRowHeightPx?: number;
  evaluateConditionalFormatting?: boolean;
}
