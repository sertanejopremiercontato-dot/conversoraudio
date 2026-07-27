import { PDFDocument, StandardFonts, rgb, RGB, PDFFont } from "pdf-lib";
import {
  WordDocumentModel,
  WordSectionModel,
  WordParagraphModel,
  WordRunModel,
  WordTableModel,
  WordImageModel,
} from "./types";

export interface WordToPdfOptions {
  orientation?: "auto" | "portrait" | "landscape";
  imageQuality?: "standard" | "high";
  outputFilename?: string;
  addPageNumbers?: boolean;
}

export interface WordToPdfResult {
  pdfBlob: Blob;
  pdfUrl: string;
  filename: string;
  pageCount: number;
  fileSizeBytes: number;
  processingTimeMs: number;
  stats: {
    paragraphCount: number;
    tableCount: number;
    imageCount: number;
    headerCount: number;
    footerCount: number;
  };
  warnings: string[];
}

function hexToRgb(hexStr?: string): RGB {
  if (!hexStr) return rgb(0.12, 0.16, 0.23); // slate 800 default
  const clean = hexStr.replace("#", "").trim();
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
  return rgb(0.12, 0.16, 0.23);
}

interface WordToken {
  text: string;
  font: PDFFont;
  fontSize: number;
  color: RGB;
  underline?: boolean;
  strike?: boolean;
  isLink?: boolean;
  linkUrl?: string;
  width: number;
  isSpace: boolean;
}

interface FormattedLine {
  tokens: WordToken[];
  lineWidth: number;
  maxFontSize: number;
  maxLineHeight: number;
  indentX: number;
  availableWidth: number;
  isLastLine: boolean;
  spaceCount: number;
}

function sanitizeTextForWinAnsi(text: string): string {
  if (!text) return "";

  return text
    // Replace smart quotes and typographic characters with ASCII equivalents
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/…/g, "...")
    // Replace bullet symbols (including Word Wingdings private use 0xF0B7)
    .replace(/[\u2022\u2023\u25CF\u25CB\u25A0\uF0B7\uF0A7\uF0D2]/g, "-")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    // Strip Private Use Area characters
    .replace(/[\uE000-\uF8FF]/g, "")
    // Filter out remaining characters outside 0x00-0xFF range
    .replace(/[^\x00-\xFF]/g, (char) => {
      const code = char.charCodeAt(0);
      if (code >= 0x00c0 && code <= 0x00ff) return char; // Latin-1 Supplement (accents)
      return "";
    });
}

function tokenizeParagraph(
  p: WordParagraphModel,
  fontRegular: PDFFont,
  fontBold: PDFFont,
  fontOblique: PDFFont,
  fontBoldOblique: PDFFont
): WordToken[] {
  const tokens: WordToken[] = [];

  let defaultSize = 11;
  let isHeading = false;
  if (p.headingLevel === 1) {
    defaultSize = 20;
    isHeading = true;
  } else if (p.headingLevel === 2) {
    defaultSize = 16;
    isHeading = true;
  } else if (p.headingLevel === 3) {
    defaultSize = 13;
    isHeading = true;
  }

  for (const run of p.runs) {
    const size = run.fontSizePt || defaultSize;
    const isBold = run.bold || isHeading;
    const isItalic = run.italic;

    let font = fontRegular;
    if (isBold && isItalic) font = fontBoldOblique;
    else if (isBold) font = fontBold;
    else if (isItalic) font = fontOblique;

    const color = hexToRgb(run.textColor);
    const rawText = run.text || "";
    const text = sanitizeTextForWinAnsi(rawText);

    if (!text) continue;

    // Split text into words and whitespace parts
    const parts = text.split(/(\s+)/);

    for (const part of parts) {
      if (!part) continue;
      const isSpace = /^\s+$/.test(part);
      let width = 0;
      try {
        width = font.widthOfTextAtSize(part, size);
      } catch (err) {
        // Fallback for any unexpected character
        const safePart = part.replace(/[^\x20-\x7E]/g, "");
        width = font.widthOfTextAtSize(safePart, size);
      }

      tokens.push({
        text: part,
        font,
        fontSize: size,
        color,
        underline: run.underline,
        strike: run.strike,
        isLink: run.isLink,
        linkUrl: run.linkUrl,
        width,
        isSpace,
      });
    }
  }

  return tokens;
}

function splitLongToken(
  tok: WordToken,
  availWidth: number
): { fit: WordToken; remainder: WordToken } {
  const font = tok.font;
  const size = tok.fontSize;

  let fitStr = "";
  let fitWidth = 0;
  let i = 0;

  for (i = 0; i < tok.text.length; i++) {
    const char = tok.text[i];
    const charW = font.widthOfTextAtSize(char, size);
    if (fitWidth + charW > availWidth && fitStr.length > 0) {
      break;
    }
    fitStr += char;
    fitWidth += charW;
  }

  const remainderStr = tok.text.substring(i) || "";

  return {
    fit: {
      ...tok,
      text: fitStr,
      width: fitWidth,
      isSpace: false,
    },
    remainder: {
      ...tok,
      text: remainderStr,
      width: font.widthOfTextAtSize(remainderStr, size),
      isSpace: false,
    },
  };
}

function layoutParagraphLines(
  tokens: WordToken[],
  p: WordParagraphModel,
  printableWidth: number
): FormattedLine[] {
  const lines: FormattedLine[] = [];
  if (tokens.length === 0) return lines;

  const baseLeftIndent = p.leftIndentPt || 0;
  const baseRightIndent = p.rightIndentPt || 0;
  const listIndent = p.isListItem ? (p.listLevel || 0) * 16 + 14 : 0;
  const firstLineIndent = p.firstLineIndentPt || 0;
  const hangingIndent = p.hangingIndentPt || 0;

  let tokenIndex = 0;
  let lineIndex = 0;

  while (tokenIndex < tokens.length) {
    let indentX = baseLeftIndent + listIndent;
    if (lineIndex === 0) {
      indentX += firstLineIndent;
    } else {
      indentX += hangingIndent;
    }

    let availWidth = printableWidth - indentX - baseRightIndent;
    if (availWidth < 20) availWidth = 20;

    const currentTokens: WordToken[] = [];
    let currentLineWidth = 0;
    let spaceCount = 0;

    // Skip leading spaces for a new line
    while (tokenIndex < tokens.length && tokens[tokenIndex].isSpace) {
      tokenIndex++;
    }

    if (tokenIndex >= tokens.length) break;

    while (tokenIndex < tokens.length) {
      const tok = tokens[tokenIndex];

      if (currentLineWidth + tok.width <= availWidth || currentTokens.length === 0) {
        if (currentLineWidth + tok.width > availWidth && currentTokens.length === 0) {
          // Token is wider than available width, force split character by character
          const splitToks = splitLongToken(tok, availWidth);
          currentTokens.push(splitToks.fit);
          currentLineWidth += splitToks.fit.width;
          if (splitToks.fit.isSpace) spaceCount++;
          tokens[tokenIndex] = splitToks.remainder;
          break;
        } else {
          currentTokens.push(tok);
          currentLineWidth += tok.width;
          if (tok.isSpace) spaceCount++;
          tokenIndex++;
        }
      } else {
        break;
      }
    }

    // Trim trailing spaces from current line
    while (currentTokens.length > 0 && currentTokens[currentTokens.length - 1].isSpace) {
      const popped = currentTokens.pop()!;
      currentLineWidth -= popped.width;
      spaceCount--;
    }

    if (currentTokens.length > 0) {
      const maxFontSize = Math.max(...currentTokens.map((t) => t.fontSize));
      const lineSpacingMult = p.lineSpacingRatio || 1.35;
      const maxLineHeight = (p.lineSpacingPt || maxFontSize) * lineSpacingMult;

      lines.push({
        tokens: currentTokens,
        lineWidth: currentLineWidth,
        maxFontSize,
        maxLineHeight,
        indentX,
        availableWidth: availWidth,
        isLastLine: tokenIndex >= tokens.length,
        spaceCount: Math.max(0, spaceCount),
      });
    }

    lineIndex++;
  }

  if (lines.length > 0) {
    lines[lines.length - 1].isLastLine = true;
  }

  return lines;
}

export async function renderWordModelToPdf(
  docModel: WordDocumentModel,
  options: WordToPdfOptions = {}
): Promise<WordToPdfResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  const addPageNum = options.addPageNumbers !== false;
  const filename = options.outputFilename || docModel.filename.replace(/\.docx$/i, "") + ".pdf";

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const primarySection = docModel.sections[0];
  const pageSettings = primarySection?.pageSettings || {
    orientation: "portrait",
    widthPt: 595.28,
    heightPt: 841.89,
    marginTopPt: 54,
    marginBottomPt: 54,
    marginLeftPt: 54,
    marginRightPt: 54,
  };

  const isLandscape =
    options.orientation === "landscape" ||
    (options.orientation === "auto" && pageSettings.orientation === "landscape");

  const pageWidth = isLandscape ? 841.89 : 595.28;
  const pageHeight = isLandscape ? 595.28 : 841.89;

  const marginLeft = pageSettings.marginLeftPt || 54;
  const marginRight = pageSettings.marginRightPt || 54;
  const marginTop = pageSettings.marginTopPt || 54;
  const marginBottom = pageSettings.marginBottomPt || 54;

  const printableWidth = pageWidth - marginLeft - marginRight;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - marginTop;

  const addNewPage = () => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    currentY = pageHeight - marginTop;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY - neededHeight < marginBottom) {
      addNewPage();
    }
  };

  // Render Sections
  for (const section of docModel.sections) {
    const headerText = sanitizeTextForWinAnsi(section.headers[0]?.paragraphs.map(p => p.runs.map(r => r.text).join("")).join(" ").trim());
    const footerText = sanitizeTextForWinAnsi(section.footers[0]?.paragraphs.map(p => p.runs.map(r => r.text).join("")).join(" ").trim());

    // Paragraphs
    for (const p of section.paragraphs) {
      // Space before paragraph
      if (p.spaceBeforePt && p.spaceBeforePt > 0) {
        currentY -= p.spaceBeforePt;
      }

      const tokens = tokenizeParagraph(p, fontRegular, fontBold, fontOblique, fontBoldOblique);
      const formattedLines = layoutParagraphLines(tokens, p, printableWidth);

      if (p.isListItem) {
        const indent = (p.listLevel || 0) * 16;
        const bulletX = marginLeft + (p.leftIndentPt || 0) + indent;
        const firstLineHeight = formattedLines[0]?.maxLineHeight || 14;

        checkPageBreak(firstLineHeight);

        currentPage.drawText("-", {
          x: bulletX,
          y: currentY,
          size: formattedLines[0]?.maxFontSize || 11,
          font: fontBold,
          color: rgb(0.2, 0.25, 0.33),
        });
      }

      if (formattedLines.length === 0) {
        // Empty paragraph line spacing
        const emptyHeight = (p.headingLevel ? 18 : 12) * (p.lineSpacingRatio || 1.2);
        currentY -= emptyHeight;
      } else {
        for (const line of formattedLines) {
          checkPageBreak(line.maxLineHeight);

          let startX = marginLeft + line.indentX;

          if (p.alignment === "center") {
            startX = marginLeft + line.indentX + Math.max(0, (line.availableWidth - line.lineWidth) / 2);
          } else if (p.alignment === "right") {
            startX = marginLeft + line.indentX + Math.max(0, line.availableWidth - line.lineWidth);
          }

          let extraSpacePerSpace = 0;
          if (p.alignment === "justify" && !line.isLastLine && line.spaceCount > 0) {
            extraSpacePerSpace = Math.max(0, line.availableWidth - line.lineWidth) / line.spaceCount;
          }

          let currX = startX;

          for (const tok of line.tokens) {
            if (tok.text) {
              currentPage.drawText(tok.text, {
                x: currX,
                y: currentY,
                size: tok.fontSize,
                font: tok.font,
                color: tok.color,
              });

              if (tok.underline) {
                currentPage.drawLine({
                  start: { x: currX, y: currentY - 1 },
                  end: { x: currX + tok.width, y: currentY - 1 },
                  thickness: 0.5,
                  color: tok.color,
                });
              }

              if (tok.strike) {
                currentPage.drawLine({
                  start: { x: currX, y: currentY + tok.fontSize * 0.35 },
                  end: { x: currX + tok.width, y: currentY + tok.fontSize * 0.35 },
                  thickness: 0.5,
                  color: tok.color,
                });
              }
            }

            const advance = tok.width + (tok.isSpace ? extraSpacePerSpace : 0);
            currX += advance;
          }

          currentY -= line.maxLineHeight;
        }
      }

      // Space after paragraph
      const spaceAfter = p.spaceAfterPt !== undefined ? p.spaceAfterPt : (p.headingLevel ? 6 : 3);
      currentY -= spaceAfter;
    }

    // Tables
    for (const tbl of section.tables) {
      if (!tbl.rows || tbl.rows.length === 0) continue;

      const colCount = Math.max(...tbl.rows.map((r) => r.cells.length));
      if (colCount === 0) continue;

      const colWidth = printableWidth / colCount;
      const cellPadding = 5;

      for (const row of tbl.rows) {
        // Pre-calculate line layouts for all cells in row to find max cell height
        const cellLayouts = row.cells.map((cell) => {
          const cellWidth = colWidth - cellPadding * 2;
          const cellLines: FormattedLine[] = [];

          cell.paragraphs.forEach((p) => {
            const tokens = tokenizeParagraph(p, fontRegular, fontBold, fontOblique, fontBoldOblique);
            const lines = layoutParagraphLines(tokens, p, cellWidth);
            cellLines.push(...lines);
          });

          const totalTextHeight = cellLines.reduce((acc, l) => acc + l.maxLineHeight, 0);
          const cellHeight = Math.max(22, totalTextHeight + cellPadding * 2);

          return {
            cell,
            cellLines,
            cellHeight,
          };
        });

        const rowHeight = Math.max(...cellLayouts.map((cl) => cl.cellHeight), 22);

        checkPageBreak(rowHeight);

        const rowTopY = currentY;

        cellLayouts.forEach((cl, colIdx) => {
          const x = marginLeft + colIdx * colWidth;
          const y = rowTopY - rowHeight;

          // Fill Background
          if (cl.cell.backgroundColor) {
            currentPage.drawRectangle({
              x,
              y,
              width: colWidth,
              height: rowHeight,
              color: hexToRgb(cl.cell.backgroundColor),
            });
          }

          // Border
          currentPage.drawRectangle({
            x,
            y,
            width: colWidth,
            height: rowHeight,
            borderColor: rgb(0.8, 0.83, 0.88),
            borderWidth: 0.5,
          });

          // Draw wrapped cell text
          let textY = rowTopY - cellPadding - 10;
          for (const line of cl.cellLines) {
            let startX = x + cellPadding + line.indentX;
            let currX = startX;

            for (const tok of line.tokens) {
              if (tok.text) {
                currentPage.drawText(tok.text, {
                  x: currX,
                  y: textY,
                  size: tok.fontSize > 10 ? 9 : tok.fontSize,
                  font: row.isHeader ? fontBold : tok.font,
                  color: tok.color,
                });
              }
              currX += tok.width;
            }

            textY -= line.maxLineHeight;
          }
        });

        currentY -= rowHeight;
      }

      currentY -= 10;
    }

    // Images
    for (const img of section.images) {
      if (!img.data || img.data.byteLength === 0) continue;

      try {
        const isPng = img.mimeType.includes("png");
        const embeddedImg = isPng
          ? await pdfDoc.embedPng(img.data)
          : await pdfDoc.embedJpg(img.data);

        const imgAspect = embeddedImg.height / embeddedImg.width;
        const displayWidth = Math.min(printableWidth, 320);
        const displayHeight = displayWidth * imgAspect;

        checkPageBreak(displayHeight + 10);

        currentPage.drawImage(embeddedImg, {
          x: marginLeft,
          y: currentY - displayHeight,
          width: displayWidth,
          height: displayHeight,
        });

        currentY -= displayHeight + 12;
      } catch (err) {
        warnings.push(`Imagem '${img.name}' ignorada na exportação.`);
      }
    }

    // Page Numbers & Header/Footer on all pages
    const pages = pdfDoc.getPages();
    const totalPagesCount = pages.length;

    pages.forEach((p, pageIdx) => {
      const pageNumStr = `Página ${pageIdx + 1} de ${totalPagesCount}`;

      if (headerText) {
        p.drawText(headerText.substring(0, 80), {
          x: marginLeft,
          y: pageHeight - marginTop + 14,
          size: 8,
          font: fontOblique,
          color: rgb(0.58, 0.64, 0.72),
        });
      }

      if (footerText) {
        p.drawText(footerText.substring(0, 80), {
          x: marginLeft,
          y: marginBottom - 18,
          size: 8,
          font: fontOblique,
          color: rgb(0.58, 0.64, 0.72),
        });
      }

      if (addPageNum) {
        p.drawText(pageNumStr, {
          x: pageWidth - marginRight - fontRegular.widthOfTextAtSize(pageNumStr, 8),
          y: marginBottom - 18,
          size: 8,
          font: fontRegular,
          color: rgb(0.58, 0.64, 0.72),
        });
      }
    });
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const fileSizeBytes = pdfBlob.size;
  const processingTimeMs = Date.now() - startTime;

  return {
    pdfBlob,
    pdfUrl,
    filename,
    pageCount: pdfDoc.getPageCount(),
    fileSizeBytes,
    processingTimeMs,
    stats: {
      paragraphCount: docModel.paragraphCount,
      tableCount: docModel.tableCount,
      imageCount: docModel.imageCount,
      headerCount: primarySection?.headers.length || 0,
      footerCount: primarySection?.footers.length || 0,
    },
    warnings,
  };
}
