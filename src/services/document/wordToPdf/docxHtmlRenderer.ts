import { WordDocumentModel, WordSectionModel, WordParagraphModel, WordRunModel, WordTableModel, WordImageModel } from "./types";
import { sanitizeHtml } from "./htmlSanitizer";

export interface HtmlRenderOptions {
  showMargins?: boolean;
  pageWidthMm?: number;
  pageHeightMm?: number;
}

export interface RenderedPageHtml {
  pageNumber: number;
  htmlContent: string;
  headerHtml?: string;
  footerHtml?: string;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 0x8000; // 32KB chunks to avoid stack overflow
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export function renderWordDocumentToPagesHtml(
  docModel: WordDocumentModel,
  options: HtmlRenderOptions = {}
): RenderedPageHtml[] {
  if (!docModel || docModel.sections.length === 0) {
    return [
      {
        pageNumber: 1,
        htmlContent: sanitizeHtml('<p style="color: #64748b; text-align: center;">Documento vazio.</p>'),
      },
    ];
  }

  const pages: RenderedPageHtml[] = [];
  let currentPageNumber = 1;

  for (const section of docModel.sections) {
    const headerHtml = renderHeaderFooterParagraphs(section.headers[0]?.paragraphs);
    const footerHtml = renderHeaderFooterParagraphs(section.footers[0]?.paragraphs);

    // Group elements and simulate page breaks
    const pageHtmlBlocks: string[] = [];
    let currentBlock = "";

    // Render Section Paragraphs & Tables
    let pIdx = 0;
    let tIdx = 0;

    while (pIdx < section.paragraphs.length || tIdx < section.tables.length) {
      // Determine next element order
      const nextP = section.paragraphs[pIdx];
      const nextT = section.tables[tIdx];

      let renderTable = false;
      if (nextT && !nextP) {
        renderTable = true;
      } else if (nextT && nextP) {
        // Compare index position in section if available
        renderTable = false; 
      }

      if (renderTable && nextT) {
        const tableHtml = renderTableToHtml(nextT);
        currentBlock += tableHtml;
        tIdx++;
      } else if (nextP) {
        const paragraphHtml = renderParagraphToHtml(nextP, section.images);
        currentBlock += paragraphHtml;
        pIdx++;

        // Check if paragraph contains page break request
        if (paragraphHtml.includes("page-break-after: always")) {
          pageHtmlBlocks.push(currentBlock);
          currentBlock = "";
        }
      } else {
        break;
      }
    }

    if (currentBlock) {
      pageHtmlBlocks.push(currentBlock);
    }

    // Process rendered page blocks
    if (pageHtmlBlocks.length === 0) {
      pageHtmlBlocks.push('<p style="color: #94a3b8; font-style: italic;">Página em branco</p>');
    }

    for (const blockHtml of pageHtmlBlocks) {
      pages.push({
        pageNumber: currentPageNumber++,
        htmlContent: sanitizeHtml(blockHtml),
        headerHtml: headerHtml ? sanitizeHtml(headerHtml) : undefined,
        footerHtml: footerHtml ? sanitizeHtml(footerHtml) : undefined,
      });
    }
  }

  return pages;
}

function renderHeaderFooterParagraphs(paragraphs?: WordParagraphModel[]): string {
  if (!paragraphs || paragraphs.length === 0) return "";
  return paragraphs.map((p) => renderParagraphToHtml(p, [])).join("");
}

function renderParagraphToHtml(p: WordParagraphModel, sectionImages: WordImageModel[]): string {
  const alignStyle = p.alignment ? `text-align: ${p.alignment};` : "text-align: left;";
  const isList = p.isListItem;
  const listIndent = isList ? `margin-left: ${(p.listLevel || 0) * 24 + 16}px;` : "";
  const listSymbol = isList ? '<span style="margin-right: 8px; font-weight: bold;">•</span>' : "";

  const runsHtml = p.runs.map((r) => renderRunToHtml(r)).join("");

  // Check inline or paragraph images
  let imagesHtml = "";
  if (sectionImages && sectionImages.length > 0) {
    // If paragraph has matching image reference or runs empty
  }

  let tag = "p";
  let headingStyle = "";
  if (p.headingLevel) {
    if (p.headingLevel === 1) { tag = "h1"; headingStyle = "font-size: 22pt; font-weight: bold; margin-top: 16px; margin-bottom: 8px; color: #1e293b;"; }
    else if (p.headingLevel === 2) { tag = "h2"; headingStyle = "font-size: 18pt; font-weight: bold; margin-top: 14px; margin-bottom: 6px; color: #334155;"; }
    else if (p.headingLevel === 3) { tag = "h3"; headingStyle = "font-size: 14pt; font-weight: bold; margin-top: 12px; margin-bottom: 4px; color: #475569;"; }
    else { tag = `h${Math.min(6, p.headingLevel)}`; headingStyle = "font-weight: bold; margin-top: 10px; color: #475569;"; }
  }

  const pStyle = `margin-top: 4px; margin-bottom: 4px; line-height: 1.45; ${alignStyle} ${listIndent} ${headingStyle}`;

  return `<${tag} style="${pStyle}">${listSymbol}${runsHtml}${imagesHtml}</${tag}>`;
}

function renderRunToHtml(r: WordRunModel): string {
  let content = escapeHtml(r.text || "");
  if (!content) return "";

  let fontStyle = "";
  if (r.textColor) fontStyle += `color: ${r.textColor}; `;
  if (r.fontSizePt) fontStyle += `font-size: ${r.fontSizePt}pt; `;
  if (r.fontFamily) fontStyle += `font-family: ${r.fontFamily}, sans-serif; `;
  if (r.backgroundColor) fontStyle += `background-color: ${r.backgroundColor}; `;

  if (r.bold) content = `<strong>${content}</strong>`;
  if (r.italic) content = `<em>${content}</em>`;
  if (r.underline) content = `<u>${content}</u>`;
  if (r.strike) content = `<s>${content}</s>`;

  if (r.isLink && r.linkUrl) {
    content = `<a href="${r.linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${content}</a>`;
  }

  if (fontStyle) {
    return `<span style="${fontStyle}">${content}</span>`;
  }

  return content;
}

function renderTableToHtml(tbl: WordTableModel): string {
  if (!tbl.rows || tbl.rows.length === 0) return "";

  const alignStyle = tbl.alignment ? `margin-${tbl.alignment === "center" ? "x: auto" : tbl.alignment === "right" ? "left: auto" : "right: auto"};` : "";

  let tableRowsHtml = "";

  tbl.rows.forEach((row, rIdx) => {
    let cellsHtml = "";
    row.cells.forEach((cell) => {
      const cellBg = cell.backgroundColor ? `background-color: ${cell.backgroundColor};` : "";
      const colSpanAttr = cell.colSpan && cell.colSpan > 1 ? `colspan="${cell.colSpan}"` : "";
      const rowSpanAttr = cell.rowSpan && cell.rowSpan > 1 ? `rowspan="${cell.rowSpan}"` : "";

      const pContent = cell.paragraphs.map((p) => renderParagraphToHtml(p, [])).join("");

      const cellStyle = `padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; ${cellBg}`;
      const cellTag = row.isHeader ? "th" : "td";

      cellsHtml += `<${cellTag} style="${cellStyle}" ${colSpanAttr} ${rowSpanAttr}>${pContent || "&nbsp;"}</${cellTag}>`;
    });

    tableRowsHtml += `<tr>${cellsHtml}</tr>`;
  });

  return `<table style="width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 12px; ${alignStyle}"><tbody>${tableRowsHtml}</tbody></table>`;
}

export function renderImageToHtml(img: WordImageModel): string {
  if (!img.data || img.data.byteLength === 0) return "";

  try {
    const base64 = uint8ArrayToBase64(img.data);
    const src = `data:${img.mimeType || "image/png"};base64,${base64}`;
    const widthStyle = img.widthPx ? `max-width: ${img.widthPx}px;` : "max-width: 100%;";
    const heightStyle = img.heightPx ? `max-height: ${img.heightPx}px;` : "height: auto;";

    return `<img src="${src}" alt="${escapeHtml(img.name)}" style="display: block; margin: 10px auto; ${widthStyle} ${heightStyle} object-fit: contain;" />`;
  } catch (err) {
    return `<div style="padding: 8px; border: 1px dashed #f59e0b; color: #b45309; font-size: 11px; text-align: center;">[Imagem ${escapeHtml(img.name)} não foi possível carregar]</div>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
