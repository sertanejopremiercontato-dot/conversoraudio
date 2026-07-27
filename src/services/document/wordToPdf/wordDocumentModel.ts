import {
  WordDocumentModel,
  WordSectionModel,
  WordParagraphModel,
  WordTableModel,
  WordImageModel,
  WordWarning,
  WordPageSettingsModel
} from "./types";

export function createDefaultPageSettings(): WordPageSettingsModel {
  return {
    orientation: "portrait",
    widthPt: 595.28,  // A4 width in pt (210mm)
    heightPt: 841.89, // A4 height in pt (297mm)
    marginTopPt: 72,   // 1 inch
    marginBottomPt: 72,
    marginLeftPt: 72,
    marginRightPt: 72,
  };
}

export function createEmptyWordDocumentModel(filename: string): WordDocumentModel {
  return {
    filename,
    sections: [
      {
        id: "sec_1",
        paragraphs: [],
        tables: [],
        images: [],
        headers: [],
        footers: [],
        pageSettings: createDefaultPageSettings(),
      },
    ],
    warnings: [],
    processingTimeMs: 0,
    paragraphCount: 0,
    tableCount: 0,
    imageCount: 0,
    totalPagesEstimate: 1,
  };
}

export function calculateStats(docModel: WordDocumentModel): void {
  let pCount = 0;
  let tCount = 0;
  let imgCount = 0;

  docModel.sections.forEach((sec) => {
    pCount += sec.paragraphs.length;
    tCount += sec.tables.length;
    imgCount += sec.images.length;
  });

  docModel.paragraphCount = pCount;
  docModel.tableCount = tCount;
  docModel.imageCount = imgCount;

  // Rough estimation: ~25 paragraphs or 1 table/3 images per A4 page
  const estimated = Math.max(1, Math.ceil(pCount / 22 + tCount * 0.8 + imgCount * 0.5));
  docModel.totalPagesEstimate = estimated;
}
