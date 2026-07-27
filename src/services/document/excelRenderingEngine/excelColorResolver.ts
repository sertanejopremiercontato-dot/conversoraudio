import { DEFAULT_EXCEL_THEME_PALETTE } from "./excelThemeParser";

export const EXCEL_INDEXED_COLORS: Record<number, string> = {
  0: "#000000", 1: "#FFFFFF", 2: "#FF0000", 3: "#00FF00", 4: "#0000FF",
  5: "#FFFF00", 6: "#FF00FF", 7: "#00FFFF", 8: "#000000", 9: "#FFFFFF",
  10: "#FF0000", 11: "#00FF00", 12: "#0000FF", 13: "#FFFF00", 14: "#FF00FF",
  15: "#00FFFF", 16: "#800000", 17: "#008000", 18: "#000080", 19: "#808000",
  20: "#800080", 21: "#008080", 22: "#C0C0C0", 23: "#808080", 24: "#9999FF",
  25: "#993366", 26: "#FFFFCC", 27: "#CCFFFF", 28: "#660066", 29: "#FF8080",
  30: "#0066CC", 31: "#CCCCFF", 32: "#000080", 33: "#FF00FF", 34: "#FFFF00",
  35: "#00FFFF", 36: "#800080", 37: "#800000", 38: "#008080", 39: "#0000FF",
  40: "#00CCFF", 41: "#CCFFFF", 42: "#CCFFCC", 43: "#FFFF99", 44: "#99CCFF",
  45: "#FF9980", 46: "#CC99FF", 47: "#E0E0E0", 48: "#333399", 49: "#336666",
  50: "#003300", 51: "#333300", 52: "#663300", 53: "#963634", 54: "#333333",
  55: "#808080", 64: "#FFFFFF", 65: "#000000"
};

/**
 * Apply tint factor (-1.0 to 1.0) according to Excel OpenXML specifications.
 */
export function applyTint(rgbHex: string, tint: number | undefined): string {
  if (tint === undefined || tint === 0 || isNaN(tint)) {
    return rgbHex;
  }

  let cleanHex = rgbHex.replace("#", "").trim();
  if (cleanHex.length === 8) {
    cleanHex = cleanHex.substring(2); // Strip ARGB alpha if present
  }

  if (cleanHex.length !== 6) {
    return rgbHex;
  }

  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return rgbHex;
  }

  if (tint > 0) {
    r = Math.round(r * (1 - tint) + 255 * tint);
    g = Math.round(g * (1 - tint) + 255 * tint);
    b = Math.round(b * (1 - tint) + 255 * tint);
  } else if (tint < 0) {
    const factor = 1 + tint;
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  }

  const clampHex = (val: number) => Math.min(255, Math.max(0, val)).toString(16).padStart(2, "0");
  return `#${clampHex(r)}${clampHex(g)}${clampHex(b)}`;
}

/**
 * Resolve various Excel color representations into a standard CSS #RRGGBB string.
 */
export function resolveCellColor(
  colorInput: any,
  themePalette: string[] = DEFAULT_EXCEL_THEME_PALETTE,
  defaultColor: string = ""
): string {
  if (!colorInput) return defaultColor;

  // Direct string input
  if (typeof colorInput === "string") {
    const str = colorInput.trim();
    if (!str || str === "none" || str === "auto" || str === "transparent") return defaultColor;
    if (str.startsWith("#")) return str;
    if (str.length === 8) return `#${str.substring(2)}`;
    if (str.length === 6) return `#${str}`;
    return defaultColor;
  }

  let baseHex = "";
  let tint: number | undefined = undefined;

  if (typeof colorInput === "object") {
    if (typeof colorInput.tint === "number") {
      tint = colorInput.tint;
    }

    if (colorInput.rgb) {
      const rgbStr = String(colorInput.rgb).trim();
      if (rgbStr.length === 8) baseHex = `#${rgbStr.substring(2)}`;
      else if (rgbStr.length === 6) baseHex = `#${rgbStr}`;
    } else if (colorInput.theme !== undefined && colorInput.theme !== null) {
      const themeIdx = Number(colorInput.theme);
      if (!isNaN(themeIdx) && themeIdx >= 0 && themeIdx < themePalette.length) {
        baseHex = themePalette[themeIdx];
      } else {
        baseHex = themePalette[0] || defaultColor;
      }
    } else if (colorInput.indexed !== undefined && colorInput.indexed !== null) {
      const idx = Number(colorInput.indexed);
      if (EXCEL_INDEXED_COLORS[idx]) {
        baseHex = EXCEL_INDEXED_COLORS[idx];
      }
    } else if (colorInput.auto) {
      baseHex = "#000000";
    }
  }

  if (!baseHex) {
    return defaultColor;
  }

  return applyTint(baseHex, tint);
}
