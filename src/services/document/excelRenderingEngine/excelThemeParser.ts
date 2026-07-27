import { WorkbookTheme } from "./types";

export const DEFAULT_EXCEL_THEME_PALETTE: string[] = [
  "#FFFFFF", // 0: lt1 (Light 1)
  "#000000", // 1: dk1 (Dark 1)
  "#E7E6E6", // 2: lt2 (Light 2)
  "#1E293B", // 3: dk2 (Dark 2)
  "#1E3A8A", // 4: accent1 (Dark Blue)
  "#2563EB", // 5: accent2 (Blue)
  "#ED7D31", // 6: accent3 (Orange)
  "#A5A5A5", // 7: accent4 (Gray)
  "#4472C4", // 8: accent5 (Ice Blue)
  "#70AD47", // 9: accent6 (Green)
  "#0563C1", // 10: hlink
  "#954F72", // 11: folHlink
];

export function parseExcelThemeXml(themeXmlStr?: string): WorkbookTheme {
  if (!themeXmlStr) {
    return {
      themeName: "Office Standard (Default)",
      colorPalette: [...DEFAULT_EXCEL_THEME_PALETTE],
    };
  }

  const palette: string[] = [...DEFAULT_EXCEL_THEME_PALETTE];
  let themeName = "Office Custom Theme";

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(themeXmlStr, "text/xml");

    const themeNode = doc.querySelector("theme") || doc.querySelector("a\\:theme") || doc.documentElement;
    if (themeNode && themeNode.getAttribute("name")) {
      themeName = themeNode.getAttribute("name") || themeName;
    }

    const clrScheme = doc.querySelector("clrScheme") || doc.querySelector("a\\:clrScheme");
    if (clrScheme) {
      const slots = ["lt1", "dk1", "lt2", "dk2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];

      slots.forEach((slotName, idx) => {
        const slotEl = clrScheme.querySelector(slotName) || clrScheme.querySelector(`a\\:${slotName}`);
        if (slotEl) {
          const srgbClr = slotEl.querySelector("srgbClr") || slotEl.querySelector("a\\:srgbClr");
          if (srgbClr && srgbClr.getAttribute("val")) {
            const val = srgbClr.getAttribute("val")!.trim();
            palette[idx] = `#${val.length === 6 ? val : val.substring(2)}`;
          } else {
            const sysClr = slotEl.querySelector("sysClr") || slotEl.querySelector("a\\:sysClr");
            if (sysClr && sysClr.getAttribute("lastClr")) {
              const val = sysClr.getAttribute("lastClr")!.trim();
              palette[idx] = `#${val.length === 6 ? val : val.substring(2)}`;
            }
          }
        }
      });
    }
  } catch (e) {
    // Regex fallback parser if DOMParser fails or namespace issues occur
    try {
      const clrMatches = themeXmlStr.match(/<a:clrScheme[^>]*>([\s\S]*?)<\/a:clrScheme>/);
      if (clrMatches && clrMatches[1]) {
        const content = clrMatches[1];
        const extractColor = (tag: string): string | null => {
          const tagRegex = new RegExp(`<a:${tag}[^>]*>[\\s\\S]*?val="([A-Fa-f0-9]{6})"`);
          const match = content.match(tagRegex);
          return match ? `#${match[1]}` : null;
        };

        const slots = ["lt1", "dk1", "lt2", "dk2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
        slots.forEach((s, i) => {
          const hex = extractColor(s);
          if (hex) palette[i] = hex;
        });
      }
    } catch (_) {
      // Keep defaults
    }
  }

  return {
    themeName,
    colorPalette: palette,
  };
}
