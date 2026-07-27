import { CellStyleModel, CellBorderStyleModel, BorderEdgeModel } from "./types";
import { resolveCellColor } from "./excelColorResolver";

export interface ParsedOpenXmlStyles {
  fonts: any[];
  fills: any[];
  borders: any[];
  cellXfs: CellStyleModel[];
  dxfs: Partial<CellStyleModel>[];
}

function parseBorderEdge(edgeNode: Element | null, themePalette: string[]): BorderEdgeModel | undefined {
  if (!edgeNode) return undefined;
  const style = edgeNode.getAttribute("style") || undefined;
  if (!style) return undefined;

  let color = "#cbd5e1";
  const colorNode = edgeNode.querySelector("color");
  if (colorNode) {
    const colorObj = {
      rgb: colorNode.getAttribute("rgb"),
      theme: colorNode.getAttribute("theme"),
      tint: colorNode.getAttribute("tint") ? parseFloat(colorNode.getAttribute("tint")!) : undefined,
      indexed: colorNode.getAttribute("indexed"),
    };
    color = resolveCellColor(colorObj, themePalette, "#cbd5e1");
  }

  let widthPx = 1;
  let widthPt = 0.75;
  if (style === "medium") { widthPx = 2; widthPt = 1.25; }
  else if (style === "thick") { widthPx = 3; widthPt = 2.0; }
  else if (style === "double") { widthPx = 2; widthPt = 1.75; }
  else if (style === "dashed" || style === "dotted") { widthPx = 1; widthPt = 0.75; }

  return { style, color, widthPx, widthPt };
}

export function parseExcelStylesXml(stylesXmlStr?: string, themePalette: string[] = []): ParsedOpenXmlStyles {
  const result: ParsedOpenXmlStyles = {
    fonts: [],
    fills: [],
    borders: [],
    cellXfs: [],
    dxfs: [],
  };

  if (!stylesXmlStr) return result;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(stylesXmlStr, "text/xml");

    // 1. Parse Fonts
    const fontNodes = doc.querySelectorAll("fonts > font");
    fontNodes.forEach((fontNode) => {
      const b = fontNode.querySelector("b") !== null;
      const i = fontNode.querySelector("i") !== null;
      const u = fontNode.querySelector("u") !== null;
      const szEl = fontNode.querySelector("sz");
      const sz = szEl ? parseFloat(szEl.getAttribute("val") || "11") : 11;
      const nameEl = fontNode.querySelector("name");
      const name = nameEl ? nameEl.getAttribute("val") || "Calibri" : "Calibri";

      const colorEl = fontNode.querySelector("color");
      let colorStr = "#000000";
      if (colorEl) {
        colorStr = resolveCellColor(
          {
            rgb: colorEl.getAttribute("rgb"),
            theme: colorEl.getAttribute("theme"),
            tint: colorEl.getAttribute("tint") ? parseFloat(colorEl.getAttribute("tint")!) : undefined,
            indexed: colorEl.getAttribute("indexed"),
          },
          themePalette,
          "#000000"
        );
      }

      result.fonts.push({ bold: b, italic: i, underline: u, fontSizePt: sz, fontFamily: name, textColor: colorStr });
    });

    // 2. Parse Fills
    const fillNodes = doc.querySelectorAll("fills > fill");
    fillNodes.forEach((fillNode) => {
      const patternFill = fillNode.querySelector("patternFill");
      let bgColor = "";
      if (patternFill) {
        const patternType = patternFill.getAttribute("patternType");
        const fgColorEl = patternFill.querySelector("fgColor");
        const bgColorEl = patternFill.querySelector("bgColor");

        if (fgColorEl) {
          bgColor = resolveCellColor(
            {
              rgb: fgColorEl.getAttribute("rgb"),
              theme: fgColorEl.getAttribute("theme"),
              tint: fgColorEl.getAttribute("tint") ? parseFloat(fgColorEl.getAttribute("tint")!) : undefined,
              indexed: fgColorEl.getAttribute("indexed"),
            },
            themePalette,
            ""
          );
        } else if (bgColorEl && patternType !== "none") {
          bgColor = resolveCellColor(
            {
              rgb: bgColorEl.getAttribute("rgb"),
              theme: bgColorEl.getAttribute("theme"),
              tint: bgColorEl.getAttribute("tint") ? parseFloat(bgColorEl.getAttribute("tint")!) : undefined,
              indexed: bgColorEl.getAttribute("indexed"),
            },
            themePalette,
            ""
          );
        }
      }
      result.fills.push({ backgroundColor: bgColor });
    });

    // 3. Parse Borders
    const borderNodes = doc.querySelectorAll("borders > border");
    borderNodes.forEach((borderNode) => {
      const top = parseBorderEdge(borderNode.querySelector("top"), themePalette);
      const bottom = parseBorderEdge(borderNode.querySelector("bottom"), themePalette);
      const left = parseBorderEdge(borderNode.querySelector("left"), themePalette);
      const right = parseBorderEdge(borderNode.querySelector("right"), themePalette);

      const bordersObj: CellBorderStyleModel = {};
      if (top) bordersObj.top = top;
      if (bottom) bordersObj.bottom = bottom;
      if (left) bordersObj.left = left;
      if (right) bordersObj.right = right;

      result.borders.push(bordersObj);
    });

    // 4. Parse CellXfs
    const xfNodes = doc.querySelectorAll("cellXfs > xf");
    xfNodes.forEach((xfNode) => {
      const fontId = parseInt(xfNode.getAttribute("fontId") || "0", 10);
      const fillId = parseInt(xfNode.getAttribute("fillId") || "0", 10);
      const borderId = parseInt(xfNode.getAttribute("borderId") || "0", 10);

      const font = result.fonts[fontId] || {};
      const fill = result.fills[fillId] || {};
      const border = result.borders[borderId] || {};

      const alignEl = xfNode.querySelector("alignment");
      let hAlign: "left" | "center" | "right" | "justify" | undefined = undefined;
      let vAlign: "top" | "middle" | "bottom" | undefined = undefined;
      let wrapText = false;
      let shrinkToFit = false;
      let textRotation = 0;

      if (alignEl) {
        const h = alignEl.getAttribute("horizontal");
        if (h === "center") hAlign = "center";
        else if (h === "right") hAlign = "right";
        else if (h === "justify") hAlign = "justify";
        else if (h === "left") hAlign = "left";

        const v = alignEl.getAttribute("vertical");
        if (v === "top") vAlign = "top";
        else if (v === "bottom") vAlign = "bottom";
        else if (v === "center") vAlign = "middle";

        wrapText = alignEl.getAttribute("wrapText") === "1" || alignEl.getAttribute("wrapText") === "true";
        shrinkToFit = alignEl.getAttribute("shrinkToFit") === "1" || alignEl.getAttribute("shrinkToFit") === "true";
        textRotation = parseInt(alignEl.getAttribute("textRotation") || "0", 10);
      }

      const style: CellStyleModel = {
        backgroundColor: fill.backgroundColor || "",
        textColor: font.textColor || "#000000",
        fontFamily: font.fontFamily || "Calibri",
        fontSizePt: font.fontSizePt || 11,
        bold: font.bold || false,
        italic: font.italic || false,
        underline: font.underline || false,
        horizontalAlignment: hAlign,
        verticalAlignment: vAlign,
        wrapText,
        shrinkToFit,
        textRotation,
        borders: border,
      };

      result.cellXfs.push(style);
    });

    // 5. Parse DXFs (Differential Formatting for Conditional Formatting)
    const dxfNodes = doc.querySelectorAll("dxfs > dxf");
    dxfNodes.forEach((dxfNode) => {
      const overrideStyle: Partial<CellStyleModel> = {};

      const fontNode = dxfNode.querySelector("font");
      if (fontNode) {
        if (fontNode.querySelector("b")) overrideStyle.bold = true;
        if (fontNode.querySelector("i")) overrideStyle.italic = true;
        if (fontNode.querySelector("u")) overrideStyle.underline = true;
        const colorEl = fontNode.querySelector("color");
        if (colorEl) {
          overrideStyle.textColor = resolveCellColor(
            {
              rgb: colorEl.getAttribute("rgb"),
              theme: colorEl.getAttribute("theme"),
              tint: colorEl.getAttribute("tint") ? parseFloat(colorEl.getAttribute("tint")!) : undefined,
              indexed: colorEl.getAttribute("indexed"),
            },
            themePalette,
            "#000000"
          );
        }
      }

      const fillNode = dxfNode.querySelector("fill");
      if (fillNode) {
        const fgColorEl = fillNode.querySelector("fgColor");
        if (fgColorEl) {
          overrideStyle.backgroundColor = resolveCellColor(
            {
              rgb: fgColorEl.getAttribute("rgb"),
              theme: fgColorEl.getAttribute("theme"),
              tint: fgColorEl.getAttribute("tint") ? parseFloat(fgColorEl.getAttribute("tint")!) : undefined,
              indexed: fgColorEl.getAttribute("indexed"),
            },
            themePalette,
            ""
          );
        }
      }

      result.dxfs.push(overrideStyle);
    });
  } catch (e) {
    // Fail-safe empty result
  }

  return result;
}
