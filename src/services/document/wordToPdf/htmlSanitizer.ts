/**
 * HTML Sanitizer for Word Document Preview
 * Sanitizes generated HTML to ensure safety against XSS while preserving styling for document rendering.
 */

const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "div", "span", "strong", "b", "em", "i", "u", "s", "strike",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "td", "th",
  "a", "img", "br", "hr"
]);

const ALLOWED_ATTRIBUTES = new Set([
  "style", "class", "href", "target", "rel", "src", "alt", "title",
  "width", "height", "colspan", "rowspan", "align"
]);

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");
    const body = doc.body;

    cleanNode(body);

    return body.innerHTML;
  } catch (err) {
    // Safe fallback: strip tags if DOMParser fails
    return rawHtml.replace(/<[^>]*>?/gm, "");
  }
}

function cleanNode(node: Node): void {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tagName)) {
        // Remove disallowed element completely or replace with text content
        el.replaceWith(docTextNode(el.textContent || ""));
        continue;
      }

      // Clean attributes
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();

        // Disallow event handlers (on*) and non-whitelisted attributes
        if (attrName.startsWith("on") || !ALLOWED_ATTRIBUTES.has(attrName)) {
          el.removeAttribute(attr.name);
          continue;
        }

        // Validate links
        if (attrName === "href") {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith("javascript:") || val.startsWith("data:text/html")) {
            el.removeAttribute(attr.name);
          } else {
            el.setAttribute("target", "_blank");
            el.setAttribute("rel", "noopener noreferrer");
          }
        }

        // Validate image sources
        if (attrName === "src") {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith("javascript:")) {
            el.removeAttribute(attr.name);
          }
        }

        // Sanitize inline CSS style attribute
        if (attrName === "style") {
          const sanitizedStyle = sanitizeInlineStyle(attr.value);
          if (sanitizedStyle) {
            el.setAttribute("style", sanitizedStyle);
          } else {
            el.removeAttribute("style");
          }
        }
      }

      // Recursively clean children
      cleanNode(el);
    } else if (child.nodeType !== Node.TEXT_NODE && child.nodeType !== Node.COMMENT_NODE) {
      child.remove();
    }
  }
}

function docTextNode(text: string): Text {
  return document.createTextNode(text);
}

function sanitizeInlineStyle(styleStr: string): string {
  if (!styleStr) return "";

  // Split declarations and keep safe formatting properties
  const declarations = styleStr.split(";");
  const safeDeclarations: string[] = [];

  const safeProperties = new Set([
    "color", "background-color", "font-family", "font-size", "font-weight", "font-style",
    "text-decoration", "text-align", "margin", "margin-top", "margin-bottom", "margin-left",
    "margin-right", "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
    "width", "height", "max-width", "max-height", "line-height", "border", "border-collapse",
    "border-color", "border-style", "border-width", "border-top", "border-bottom", "border-left", "border-right",
    "page-break-after", "page-break-before", "page-break-inside", "vertical-align"
  ]);

  for (const decl of declarations) {
    const parts = decl.split(":");
    if (parts.length === 2) {
      const prop = parts[0].trim().toLowerCase();
      const val = parts[1].trim();

      if (safeProperties.has(prop) && !val.includes("javascript:") && !val.includes("url(")) {
        safeDeclarations.push(`${prop}: ${val}`);
      }
    }
  }

  return safeDeclarations.join("; ");
}
