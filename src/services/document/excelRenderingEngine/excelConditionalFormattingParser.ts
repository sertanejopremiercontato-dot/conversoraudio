import { ConditionalFormattingRule, CellStyleModel } from "./types";

export interface ParsedSheetConditionalFormatting {
  sqref: string; // e.g. "A1:B10 C15"
  rules: ConditionalFormattingRule[];
  dxfIdMap: number[];
}

export function parseSheetConditionalFormattingXml(
  sheetXmlStr: string,
  dxfs: Partial<CellStyleModel>[]
): ParsedSheetConditionalFormatting[] {
  const results: ParsedSheetConditionalFormatting[] = [];
  if (!sheetXmlStr) return results;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(sheetXmlStr, "text/xml");
    const cfNodes = doc.querySelectorAll("conditionalFormatting");

    cfNodes.forEach((cfNode) => {
      const sqref = cfNode.getAttribute("sqref") || "";
      const ruleNodes = cfNode.querySelectorAll("cfRule");
      const rules: ConditionalFormattingRule[] = [];
      const dxfIdMap: number[] = [];

      ruleNodes.forEach((ruleNode) => {
        const type = ruleNode.getAttribute("type") || "cellIs";
        const operator = ruleNode.getAttribute("operator") as any;
        const dxfIdStr = ruleNode.getAttribute("dxfId");
        const dxfId = dxfIdStr !== null ? parseInt(dxfIdStr, 10) : -1;

        const formulaEls = ruleNode.querySelectorAll("formula");
        const formulae: string[] = [];
        formulaEls.forEach((f) => formulae.push(f.textContent || ""));

        const styleOverride = dxfId >= 0 && dxfId < dxfs.length ? dxfs[dxfId] : undefined;

        let isSupported = false;
        if (type === "cellIs" || type === "containsText" || type === "beginsWith" || type === "endsWith") {
          isSupported = true;
        }

        rules.push({
          type: type as any,
          operator,
          formulae,
          styleOverride,
          isSupported,
        });

        dxfIdMap.push(dxfId);
      });

      if (rules.length > 0) {
        results.push({ sqref, rules, dxfIdMap });
      }
    });
  } catch (e) {
    // Fail-safe
  }

  return results;
}

/**
 * Expand Excel range string (e.g. "A1:B10" or "C5") into set of cell addresses.
 */
export function isCellInSqref(cellRow: number, cellCol: number, sqref: string): boolean {
  if (!sqref) return false;
  const ranges = sqref.split(/\s+/);

  for (const range of ranges) {
    const parts = range.split(":");
    const startCell = parseCellRef(parts[0]);
    if (!startCell) continue;

    if (parts.length === 1) {
      if (startCell.row === cellRow && startCell.col === cellCol) return true;
    } else {
      const endCell = parseCellRef(parts[1]);
      if (!endCell) continue;
      const minR = Math.min(startCell.row, endCell.row);
      const maxR = Math.max(startCell.row, endCell.row);
      const minC = Math.min(startCell.col, endCell.col);
      const maxC = Math.max(startCell.col, endCell.col);

      if (cellRow >= minR && cellRow <= maxR && cellCol >= minC && cellCol <= maxC) {
        return true;
      }
    }
  }

  return false;
}

function parseCellRef(ref: string): { row: number; col: number } | null {
  if (!ref) return null;
  const match = ref.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return null;

  const colStr = match[1].toUpperCase();
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  col -= 1; // 0-indexed

  const row = parseInt(match[2], 10) - 1; // 0-indexed
  return { row, col };
}

/**
 * Evaluate conditional formatting rule against cell value.
 */
export function evaluateConditionalRule(
  cellVal: any,
  rule: ConditionalFormattingRule
): boolean {
  if (!rule.isSupported || !rule.styleOverride) return false;

  const numVal = typeof cellVal === "number" ? cellVal : parseFloat(String(cellVal));
  const isNum = !isNaN(numVal);
  const strVal = String(cellVal ?? "").toLowerCase();

  const formula1 = rule.formulae[0] ? rule.formulae[0].replace(/^"|"$/g, "") : "";
  const formula2 = rule.formulae[1] ? rule.formulae[1].replace(/^"|"$/g, "") : "";
  const fNum1 = parseFloat(formula1);
  const fNum2 = parseFloat(formula2);

  if (rule.type === "containsText") {
    return strVal.includes(formula1.toLowerCase());
  }
  if (rule.type === "beginsWith") {
    return strVal.startsWith(formula1.toLowerCase());
  }
  if (rule.type === "endsWith") {
    return strVal.endsWith(formula1.toLowerCase());
  }

  if (rule.type === "cellIs" && rule.operator) {
    switch (rule.operator) {
      case "equal":
        return isNum && !isNaN(fNum1) ? numVal === fNum1 : strVal === formula1.toLowerCase();
      case "notEqual":
        return isNum && !isNaN(fNum1) ? numVal !== fNum1 : strVal !== formula1.toLowerCase();
      case "greaterThan":
        return isNum && !isNaN(fNum1) ? numVal > fNum1 : false;
      case "lessThan":
        return isNum && !isNaN(fNum1) ? numVal < fNum1 : false;
      case "greaterThanOrEqual":
        return isNum && !isNaN(fNum1) ? numVal >= fNum1 : false;
      case "lessThanOrEqual":
        return isNum && !isNaN(fNum1) ? numVal <= fNum1 : false;
      case "between":
        return isNum && !isNaN(fNum1) && !isNaN(fNum2) ? numVal >= fNum1 && numVal <= fNum2 : false;
    }
  }

  return false;
}
