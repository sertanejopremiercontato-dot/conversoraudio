import JSZip from "jszip";
import {
  WordDocumentModel,
  WordSectionModel,
  WordParagraphModel,
  WordRunModel,
  WordTableModel,
  WordTableRowModel,
  WordTableCellModel,
  WordImageModel,
  WordHeaderModel,
  WordFooterModel,
  WordWarning
} from "./types";
import { createDefaultPageSettings, calculateStats } from "./wordDocumentModel";

export async function parseDocxFile(
  fileInput: File | ArrayBuffer,
  filename?: string
): Promise<WordDocumentModel> {
  const startTime = Date.now();
  let name = filename || "documento.docx";
  let buffer: ArrayBuffer;

  if (fileInput instanceof File) {
    name = fileInput.name;
    buffer = await fileInput.arrayBuffer();
  } else {
    buffer = fileInput;
  }

  // Check for old .doc binary signature or extension
  if (name.toLowerCase().endsWith(".doc") && !name.toLowerCase().endsWith(".docx")) {
    throw new Error(
      "Este formato Word antigo não é suportado. Salve o documento como .docx e tente novamente."
    );
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch (err) {
    // Check if it's not a ZIP archive (likely a binary .doc or corrupted file)
    throw new Error(
      "Este formato Word antigo não é suportado ou o arquivo está corrompido. Salve o documento como .docx e tente novamente."
    );
  }

  const docFile = zip.file("word/document.xml");
  if (!docFile) {
    throw new Error(
      "Arquivo DOCX inválido: estrutura 'word/document.xml' não encontrada."
    );
  }

  const docXmlStr = await docFile.async("text");
  const warnings: WordWarning[] = [];

  // Parse Relationships
  const relsFile = zip.file("word/_rels/document.xml.rels");
  const relsMap: Record<string, string> = {};
  if (relsFile) {
    const relsStr = await relsFile.async("text");
    const relsDoc = new DOMParser().parseFromString(relsStr, "text/xml");
    const relNodes = relsDoc.querySelectorAll("Relationship");
    relNodes.forEach((node) => {
      const id = node.getAttribute("Id");
      const target = node.getAttribute("Target");
      if (id && target) {
        relsMap[id] = target.startsWith("word/") ? target.replace("word/", "") : target;
      }
    });
  }

  // Parse Media / Images
  const mediaFolder = zip.folder("word/media");
  const imagesMap: Record<string, WordImageModel> = {};
  if (mediaFolder) {
    const mediaFiles = mediaFolder.file(/./);
    for (const mFile of mediaFiles) {
      const data = await mFile.async("uint8array");
      const mPath = mFile.name.replace("word/", "");
      const ext = mPath.split(".").pop()?.toLowerCase() || "png";
      const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "gif" ? "image/gif" : "image/png";
      
      imagesMap[mPath] = {
        id: mPath,
        name: mPath.split("/").pop() || "imagem",
        mimeType,
        data,
        widthPx: 300,
        heightPx: 200,
        isInline: true
      };
    }
  }

  // Parse Document XML
  const docXml = new DOMParser().parseFromString(docXmlStr, "text/xml");
  const body = docXml.querySelector("body") || docXml.documentElement;

  const section: WordSectionModel = {
    id: "sec_main",
    paragraphs: [],
    tables: [],
    images: Object.values(imagesMap),
    headers: [],
    footers: [],
    pageSettings: createDefaultPageSettings(),
  };

  // Parse Header/Footer if exists
  const headerFiles = zip.file(/word\/header\d+\.xml/);
  for (const hf of headerFiles) {
    const hStr = await hf.async("text");
    const hDoc = new DOMParser().parseFromString(hStr, "text/xml");
    const pEls = hDoc.querySelectorAll("p");
    const hParagraphs: WordParagraphModel[] = [];
    pEls.forEach((p, idx) => {
      const pModel = parseParagraphElement(p, `h_p_${idx}`);
      if (pModel) hParagraphs.push(pModel);
    });
    if (hParagraphs.length > 0) {
      section.headers.push({ id: hf.name, paragraphs: hParagraphs, type: "default" });
    }
  }

  const footerFiles = zip.file(/word\/footer\d+\.xml/);
  for (const ff of footerFiles) {
    const fStr = await ff.async("text");
    const fDoc = new DOMParser().parseFromString(fStr, "text/xml");
    const pEls = fDoc.querySelectorAll("p");
    const fParagraphs: WordParagraphModel[] = [];
    pEls.forEach((p, idx) => {
      const pModel = parseParagraphElement(p, `f_p_${idx}`);
      if (pModel) fParagraphs.push(pModel);
    });
    if (fParagraphs.length > 0) {
      section.footers.push({ id: ff.name, paragraphs: fParagraphs, type: "default" });
    }
  }

  // Iterate over children of body
  let pIdx = 0;
  let tIdx = 0;
  Array.from(body.childNodes).forEach((node) => {
    if (node.nodeType !== 1) return; // Only element nodes
    const el = node as Element;
    const tagName = el.tagName.replace(/^w:/, "");

    if (tagName === "p") {
      const pModel = parseParagraphElement(el, `p_${pIdx++}`);
      if (pModel) {
        section.paragraphs.push(pModel);
      }
    } else if (tagName === "tbl") {
      const tModel = parseTableElement(el, `tbl_${tIdx++}`);
      if (tModel) {
        section.tables.push(tModel);
      }
    } else if (tagName === "sectPr") {
      // Page settings / section properties
      const pgSz = el.querySelector("pgSz") || el.querySelector("w\\:pgSz");
      if (pgSz) {
        const orient = pgSz.getAttribute("w:orient") || pgSz.getAttribute("orient");
        if (orient === "landscape") {
          section.pageSettings.orientation = "landscape";
          section.pageSettings.widthPt = 841.89;
          section.pageSettings.heightPt = 595.28;
        }
      }
    }
  });

  const processingTimeMs = Date.now() - startTime;

  const result: WordDocumentModel = {
    filename: name,
    sections: [section],
    warnings,
    processingTimeMs,
    paragraphCount: 0,
    tableCount: 0,
    imageCount: 0,
    totalPagesEstimate: 1,
  };

  calculateStats(result);
  return result;
}

function parseParagraphElement(pEl: Element, id: string): WordParagraphModel | null {
  const runs: WordRunModel[] = [];

  // Paragraph properties
  const pPr = pEl.querySelector("pPr") || pEl.querySelector("w\\:pPr");
  let alignment: "left" | "center" | "right" | "justify" | undefined = undefined;
  let headingLevel: number | undefined = undefined;
  let isListItem = false;
  let listLevel = 0;
  let spaceBeforePt: number | undefined = undefined;
  let spaceAfterPt: number | undefined = undefined;
  let lineSpacingRatio: number | undefined = undefined;
  let lineSpacingPt: number | undefined = undefined;
  let leftIndentPt: number | undefined = undefined;
  let rightIndentPt: number | undefined = undefined;
  let firstLineIndentPt: number | undefined = undefined;
  let hangingIndentPt: number | undefined = undefined;

  if (pPr) {
    const jc = pPr.querySelector("jc") || pPr.querySelector("w\\:jc");
    if (jc) {
      const val = jc.getAttribute("w:val") || jc.getAttribute("val");
      if (val === "center") alignment = "center";
      else if (val === "right") alignment = "right";
      else if (val === "both" || val === "justify") alignment = "justify";
      else alignment = "left";
    }

    const pStyle = pPr.querySelector("pStyle") || pPr.querySelector("w\\:pStyle");
    if (pStyle) {
      const val = pStyle.getAttribute("w:val") || pStyle.getAttribute("val") || "";
      const hMatch = val.match(/(?:Heading|Título)\s*(\d)/i);
      if (hMatch) {
        headingLevel = parseInt(hMatch[1], 10);
      }
    }

    const numPr = pPr.querySelector("numPr") || pPr.querySelector("w\\:numPr");
    if (numPr) {
      isListItem = true;
      const ilvl = numPr.querySelector("ilvl") || numPr.querySelector("w\\:ilvl");
      if (ilvl) {
        listLevel = parseInt(ilvl.getAttribute("w:val") || ilvl.getAttribute("val") || "0", 10);
      }
    }

    const ind = pPr.querySelector("ind") || pPr.querySelector("w\\:ind");
    if (ind) {
      const left = ind.getAttribute("w:left") || ind.getAttribute("left");
      if (left) leftIndentPt = parseInt(left, 10) / 20;
      const right = ind.getAttribute("w:right") || ind.getAttribute("right");
      if (right) rightIndentPt = parseInt(right, 10) / 20;
      const firstLine = ind.getAttribute("w:firstLine") || ind.getAttribute("firstLine");
      if (firstLine) firstLineIndentPt = parseInt(firstLine, 10) / 20;
      const hanging = ind.getAttribute("w:hanging") || ind.getAttribute("hanging");
      if (hanging) hangingIndentPt = parseInt(hanging, 10) / 20;
    }

    const spacing = pPr.querySelector("spacing") || pPr.querySelector("w\\:spacing");
    if (spacing) {
      const before = spacing.getAttribute("w:before") || spacing.getAttribute("before");
      if (before) spaceBeforePt = parseInt(before, 10) / 20;
      const after = spacing.getAttribute("w:after") || spacing.getAttribute("after");
      if (after) spaceAfterPt = parseInt(after, 10) / 20;
      const line = spacing.getAttribute("w:line") || spacing.getAttribute("line");
      const lineRule = spacing.getAttribute("w:lineRule") || spacing.getAttribute("lineRule");
      if (line) {
        if (lineRule === "exact" || lineRule === "atLeast") {
          lineSpacingPt = parseInt(line, 10) / 20;
        } else {
          lineSpacingRatio = parseInt(line, 10) / 240;
        }
      }
    }
  }

  // Parse runs
  const childNodes = Array.from(pEl.childNodes);
  childNodes.forEach((child) => {
    if (child.nodeType !== 1) return;
    const el = child as Element;
    const tagName = el.tagName.replace(/^w:/, "");

    if (tagName === "r") {
      const rModel = parseRunElement(el);
      if (rModel) runs.push(rModel);
    } else if (tagName === "hyperlink") {
      const linkRuns = el.querySelectorAll("r, w\\:r");
      linkRuns.forEach((rEl) => {
        const rModel = parseRunElement(rEl);
        if (rModel) {
          rModel.isLink = true;
          runs.push(rModel);
        }
      });
    }
  });

  if (runs.length === 0 && !isListItem) {
    // Keep empty paragraph for spacing
    runs.push({ text: "" });
  }

  return {
    id,
    runs,
    alignment,
    headingLevel,
    isListItem,
    listLevel,
    spaceBeforePt,
    spaceAfterPt,
    lineSpacingRatio,
    lineSpacingPt,
    leftIndentPt,
    rightIndentPt,
    firstLineIndentPt,
    hangingIndentPt,
  };
}

function parseRunElement(rEl: Element): WordRunModel | null {
  const rPr = rEl.querySelector("rPr") || rEl.querySelector("w\\:rPr");
  let bold = false;
  let italic = false;
  let underline = false;
  let strike = false;
  let textColor: string | undefined = undefined;
  let fontSizePt: number | undefined = undefined;
  let fontFamily: string | undefined = undefined;

  if (rPr) {
    if (rPr.querySelector("b, w\\:b")) bold = true;
    if (rPr.querySelector("i, w\\:i")) italic = true;
    if (rPr.querySelector("u, w\\:u")) underline = true;
    if (rPr.querySelector("strike, w\\:strike")) strike = true;

    const colorEl = rPr.querySelector("color, w\\:color");
    if (colorEl) {
      const val = colorEl.getAttribute("w:val") || colorEl.getAttribute("val");
      if (val && val !== "auto") textColor = `#${val}`;
    }

    const szEl = rPr.querySelector("sz, w\\:sz");
    if (szEl) {
      const val = szEl.getAttribute("w:val") || szEl.getAttribute("val");
      if (val) fontSizePt = parseInt(val, 10) / 2; // half-points to pt
    }

    const rFonts = rPr.querySelector("rFonts, w\\:rFonts");
    if (rFonts) {
      fontFamily = rFonts.getAttribute("w:ascii") || rFonts.getAttribute("ascii") || undefined;
    }
  }

  // Extract text
  const tEls = rEl.querySelectorAll("t, w\\:t");
  let text = "";
  tEls.forEach((t) => {
    text += t.textContent || "";
  });

  return {
    text,
    bold,
    italic,
    underline,
    strike,
    textColor,
    fontSizePt,
    fontFamily,
  };
}

function parseTableElement(tblEl: Element, id: string): WordTableModel | null {
  const rows: WordTableRowModel[] = [];

  const trEls = tblEl.querySelectorAll("tr, w\\:tr");
  trEls.forEach((trEl, rIdx) => {
    const cells: WordTableCellModel[] = [];
    const tcEls = trEl.querySelectorAll("tc, w\\:tc");

    tcEls.forEach((tcEl, cIdx) => {
      const paragraphs: WordParagraphModel[] = [];
      const pEls = tcEl.querySelectorAll("p, w\\:p");

      pEls.forEach((pEl, pIdx) => {
        const pModel = parseParagraphElement(pEl, `${id}_r${rIdx}_c${cIdx}_p${pIdx}`);
        if (pModel) paragraphs.push(pModel);
      });

      // Shading / Cell background color
      let backgroundColor: string | undefined = undefined;
      const shd = tcEl.querySelector("shd, w\\:shd");
      if (shd) {
        const fill = shd.getAttribute("w:fill") || shd.getAttribute("fill");
        if (fill && fill !== "auto" && fill !== "none") {
          backgroundColor = `#${fill}`;
        }
      }

      cells.push({
        id: `${id}_r${rIdx}_c${cIdx}`,
        paragraphs,
        backgroundColor,
      });
    });

    rows.push({
      id: `${id}_r${rIdx}`,
      cells,
      isHeader: rIdx === 0,
    });
  });

  return {
    id,
    rows,
    alignment: "center",
  };
}
