export interface WordWarning {
  code: string;
  message: string;
}

export interface WordPageSettingsModel {
  orientation: "portrait" | "landscape";
  widthPt: number;
  heightPt: number;
  marginTopPt: number;
  marginBottomPt: number;
  marginLeftPt: number;
  marginRightPt: number;
}

export interface WordRunModel {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  textColor?: string;
  backgroundColor?: string;
  fontSizePt?: number;
  fontFamily?: string;
  isLink?: boolean;
  linkUrl?: string;
}

export interface WordParagraphModel {
  id: string;
  runs: WordRunModel[];
  alignment?: "left" | "center" | "right" | "justify";
  headingLevel?: number; // 1 for H1, 2 for H2, etc.
  isListItem?: boolean;
  listLevel?: number;
  listNumId?: number;
  spaceBeforePt?: number;
  spaceAfterPt?: number;
  lineSpacingRatio?: number;
  lineSpacingPt?: number;
  leftIndentPt?: number;
  rightIndentPt?: number;
  firstLineIndentPt?: number;
  hangingIndentPt?: number;
}

export interface WordTableCellModel {
  id: string;
  paragraphs: WordParagraphModel[];
  widthPx?: number;
  colSpan?: number;
  rowSpan?: number;
  backgroundColor?: string;
  borders?: {
    top?: { style: string; color: string; widthPx: number };
    bottom?: { style: string; color: string; widthPx: number };
    left?: { style: string; color: string; widthPx: number };
    right?: { style: string; color: string; widthPx: number };
  };
}

export interface WordTableRowModel {
  id: string;
  cells: WordTableCellModel[];
  heightPx?: number;
  isHeader?: boolean;
}

export interface WordTableModel {
  id: string;
  rows: WordTableRowModel[];
  colWidthsPx?: number[];
  alignment?: "left" | "center" | "right";
}

export interface WordImageModel {
  id: string;
  name: string;
  mimeType: string;
  data: Uint8Array;
  widthPx?: number;
  heightPx?: number;
  isInline?: boolean;
}

export interface WordHeaderModel {
  id: string;
  paragraphs: WordParagraphModel[];
  type?: "default" | "first" | "even";
}

export interface WordFooterModel {
  id: string;
  paragraphs: WordParagraphModel[];
  type?: "default" | "first" | "even";
}

export interface WordSectionModel {
  id: string;
  paragraphs: WordParagraphModel[];
  tables: WordTableModel[];
  images: WordImageModel[];
  headers: WordHeaderModel[];
  footers: WordFooterModel[];
  pageSettings: WordPageSettingsModel;
}

export interface WordDocumentModel {
  filename: string;
  sections: WordSectionModel[];
  warnings: WordWarning[];
  processingTimeMs: number;
  paragraphCount: number;
  tableCount: number;
  imageCount: number;
  totalPagesEstimate: number;
}
