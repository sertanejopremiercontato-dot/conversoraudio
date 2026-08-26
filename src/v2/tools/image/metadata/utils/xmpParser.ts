import { ImageMetadataItem, ImageMetadataCategory } from "../types";
import { ExifParser } from "./exifParser";

export interface ParsedXmpData {
  items: ImageMetadataItem[];
  title?: string;
  creator?: string;
  description?: string;
  rights?: string;
  keywords?: string[];
  software?: string;
  createDate?: string;
}

export class XmpParser {
  /**
   * Extrai e mapeia exaustivamente todas as tags e atributos do XML/XMP
   */
  public static parse(xmpString: string, baseOffset = 0, packetSize = 0): ParsedXmpData {
    const result: ParsedXmpData = { items: [] };
    if (!xmpString || xmpString.length < 10) return result;

    const size = packetSize || xmpString.length;

    // Parser DOM de XML nativo
    let xmlDoc: Document | null = null;
    try {
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(xmpString, "application/xml");
    } catch {
      xmlDoc = null;
    }

    const seenKeys = new Set<string>();

    const addItem = (
      key: string,
      label: string,
      val: string,
      cat: ImageMetadataCategory,
      details?: string,
      sourcePrefix = "XMP"
    ) => {
      if (!val || val.trim().length === 0) return;
      const cleanVal = val.trim();
      const uniqueId = `xmp_${key.replace(/[^a-zA-Z0-9_]/g, "_")}`;
      if (seenKeys.has(uniqueId)) return;
      seenKeys.add(uniqueId);

      result.items.push({
        id: uniqueId,
        key,
        label,
        value: cleanVal,
        source: sourcePrefix,
        category: cat,
        offset: baseOffset,
        offsetHex: ExifParser.toHexOffset(baseOffset),
        size,
        isRemovable: true,
        details
      });
    };

    if (xmlDoc && xmlDoc.getElementsByTagName("parsererror").length === 0) {
      // Helper seguro para buscar elementos por nomes com ou sem prefixo XML
      const findElementsByTagNames = (root: Document | Element, tagNames: string[]): Element[] => {
        const found: Element[] = [];
        const seen = new Set<Element>();
        for (const tag of tagNames) {
          const list = root.getElementsByTagName(tag);
          for (let i = 0; i < list.length; i++) {
            const el = list[i];
            if (!seen.has(el)) {
              seen.add(el);
              found.push(el);
            }
          }
        }
        return found;
      };

      // 1. Tags do Dublin Core (dc:)
      const getDcValues = (tagName: string): string[] => {
        const els = findElementsByTagNames(xmlDoc!, [`dc:${tagName}`, tagName]);
        const vals: string[] = [];
        els.forEach(el => {
          const liElements = findElementsByTagNames(el, ["rdf:li", "li"]);
          if (liElements.length > 0) {
            liElements.forEach(li => {
              if (li.textContent) vals.push(li.textContent.trim());
            });
          } else if (el.textContent) {
            vals.push(el.textContent.trim());
          }
        });
        return vals;
      };

      const titleVals = getDcValues("title");
      if (titleVals.length > 0) {
        result.title = titleVals.join(", ");
        addItem("dc:title", "Título (Dublin Core)", result.title, "METADATA", "dc:title do pacote XMP");
      }

      const creatorVals = getDcValues("creator");
      if (creatorVals.length > 0) {
        result.creator = creatorVals.join(", ");
        addItem("dc:creator", "Criador / Autor (Dublin Core)", result.creator, "METADATA", "dc:creator do pacote XMP");
      }

      const descVals = getDcValues("description");
      if (descVals.length > 0) {
        result.description = descVals.join(" ");
        addItem("dc:description", "Descrição (Dublin Core)", result.description, "METADATA", "dc:description do pacote XMP");
      }

      const rightsVals = getDcValues("rights");
      if (rightsVals.length > 0) {
        result.rights = rightsVals.join(" ");
        addItem("dc:rights", "Direitos Autorais (Dublin Core)", result.rights, "METADATA", "dc:rights do pacote XMP");
      }

      const subjectVals = getDcValues("subject");
      if (subjectVals.length > 0) {
        result.keywords = subjectVals;
        addItem("dc:subject", "Palavras-chave (Dublin Core)", subjectVals.join(", "), "METADATA", "dc:subject do pacote XMP");
      }

      // 2. Tags do Esquema XMP Básico (xmp:)
      const xmpCreatorTool = this.getXmpNodeText(xmlDoc, "xmp:CreatorTool", "CreatorTool");
      if (xmpCreatorTool) {
        result.software = xmpCreatorTool;
        addItem("xmp:CreatorTool", "Ferramenta de Criação / Software", xmpCreatorTool, "SOFTWARE_GENERATOR", "xmp:CreatorTool");
      }

      const xmpCreateDate = this.getXmpNodeText(xmlDoc, "xmp:CreateDate", "CreateDate");
      if (xmpCreateDate) {
        result.createDate = xmpCreateDate;
        addItem("xmp:CreateDate", "Data de Criação (XMP)", xmpCreateDate, "PRIVACY", "xmp:CreateDate");
      }

      const xmpModifyDate = this.getXmpNodeText(xmlDoc, "xmp:ModifyDate", "ModifyDate");
      if (xmpModifyDate) {
        addItem("xmp:ModifyDate", "Data de Modificação (XMP)", xmpModifyDate, "PRIVACY", "xmp:ModifyDate");
      }

      const xmpMetadataDate = this.getXmpNodeText(xmlDoc, "xmp:MetadataDate", "MetadataDate");
      if (xmpMetadataDate) {
        addItem("xmp:MetadataDate", "Data dos Metadados (XMP)", xmpMetadataDate, "PRIVACY", "xmp:MetadataDate");
      }

      // 3. Photoshop XMP Schema (photoshop:)
      const psCredit = this.getXmpNodeText(xmlDoc, "photoshop:Credit", "Credit");
      if (psCredit) addItem("photoshop:Credit", "Crédito (Photoshop)", psCredit, "METADATA");

      const psSource = this.getXmpNodeText(xmlDoc, "photoshop:Source", "Source");
      if (psSource) addItem("photoshop:Source", "Fonte da Imagem (Photoshop)", psSource, "PROVENANCE");

      const psHeadline = this.getXmpNodeText(xmlDoc, "photoshop:Headline", "Headline");
      if (psHeadline) addItem("photoshop:Headline", "Manchete / Título (Photoshop)", psHeadline, "METADATA");

      const psCity = this.getXmpNodeText(xmlDoc, "photoshop:City", "City");
      if (psCity) addItem("photoshop:City", "Cidade (Localização)", psCity, "PRIVACY");

      const psCountry = this.getXmpNodeText(xmlDoc, "photoshop:Country", "Country");
      if (psCountry) addItem("photoshop:Country", "País (Localização)", psCountry, "PRIVACY");

      // 4. EXIF dentro do XMP
      const exifLat = this.getXmpNodeText(xmlDoc, "exif:GPSLatitude", "GPSLatitude");
      if (exifLat) addItem("exif:GPSLatitude", "GPS Latitude (XMP)", exifLat, "PRIVACY");

      const exifLon = this.getXmpNodeText(xmlDoc, "exif:GPSLongitude", "GPSLongitude");
      if (exifLon) addItem("exif:GPSLongitude", "GPS Longitude (XMP)", exifLon, "PRIVACY");

      const exifBodySerial = this.getXmpNodeText(xmlDoc, "exif:BodySerialNumber", "BodySerialNumber");
      if (exifBodySerial) addItem("exif:BodySerialNumber", "Número de Série da Câmera (XMP)", exifBodySerial, "PRIVACY");

      const exifLensSerial = this.getXmpNodeText(xmlDoc, "exif:LensSerialNumber", "LensSerialNumber");
      if (exifLensSerial) addItem("exif:LensSerialNumber", "Número de Série da Lente (XMP)", exifLensSerial, "PRIVACY");

      // 5. Varredura de TODOS os atributos em rdf:Description
      const descriptions = findElementsByTagNames(xmlDoc, ["rdf:Description", "Description"]);
      descriptions.forEach(desc => {
        for (let i = 0; i < desc.attributes.length; i++) {
          const attr = desc.attributes[i];
          const name = attr.name;
          const val = attr.value;
          if (name.startsWith("xmlns:") || name === "rdf:about") continue;

          let cat: ImageMetadataCategory = "XMP_IPTC";
          if (name.toLowerCase().includes("gps") || name.toLowerCase().includes("serial") || name.toLowerCase().includes("date")) {
            cat = "PRIVACY";
          } else if (name.toLowerCase().includes("tool") || name.toLowerCase().includes("software") || name.toLowerCase().includes("prompt")) {
            cat = "SOFTWARE_GENERATOR";
          } else if (name.toLowerCase().includes("title") || name.toLowerCase().includes("creator") || name.toLowerCase().includes("rights")) {
            cat = "METADATA";
          }
          addItem(`xmp:${name}`, `Atributo XMP (${name})`, val, cat);
        }
      });
    }

    // Varredura regex de segurança para capturar tags que possam ter falhado no DOMParser
    const regexExtract = (regex: RegExp, key: string, label: string, cat: ImageMetadataCategory) => {
      const match = xmpString.match(regex);
      if (match && match[1]) {
        addItem(key, label, match[1], cat);
      }
    };

    regexExtract(/<dc:title[^>]*>[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>/i, "dc:title", "Título (Dublin Core)", "METADATA");
    regexExtract(/<dc:creator[^>]*>[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>/i, "dc:creator", "Criador / Autor (Dublin Core)", "METADATA");
    regexExtract(/<dc:rights[^>]*>[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>/i, "dc:rights", "Direitos Autorais (Dublin Core)", "METADATA");
    regexExtract(/<xmp:CreatorTool>([^<]+)<\/xmp:CreatorTool>/i, "xmp:CreatorTool", "Software de Criação", "SOFTWARE_GENERATOR");
    regexExtract(/<photoshop:Credit>([^<]+)<\/photoshop:Credit>/i, "photoshop:Credit", "Crédito (Photoshop)", "METADATA");

    // Detecção de parâmetros de IA Generativa embutidos no XMP
    const aiPromptMatch = xmpString.match(/(?:prompt|parameters|workflow)\s*[:=]\s*["']?([^"'<\n\r]+)/i);
    if (aiPromptMatch && aiPromptMatch[1]) {
      addItem("xmp:ai_prompt", "Prompt / Parâmetro de IA", aiPromptMatch[1], "SOFTWARE_GENERATOR", "Parâmetro de geração detectado no pacote XMP");
    }

    return result;
  }

  private static getXmpNodeText(doc: Document, q1: string, q2: string): string | null {
    try {
      const list1 = doc.getElementsByTagName(q1);
      if (list1.length > 0 && list1[0].textContent) {
        return list1[0].textContent.trim();
      }
      const list2 = doc.getElementsByTagName(q2);
      if (list2.length > 0 && list2[0].textContent) {
        return list2[0].textContent.trim();
      }
      // Fallback para verificar por localName
      const allEls = doc.getElementsByTagName("*");
      const targetLocal1 = q1.includes(":") ? q1.split(":")[1].toLowerCase() : q1.toLowerCase();
      const targetLocal2 = q2.includes(":") ? q2.split(":")[1].toLowerCase() : q2.toLowerCase();
      for (let i = 0; i < allEls.length; i++) {
        const el = allEls[i];
        const local = (el.localName || el.nodeName).toLowerCase();
        if (local === targetLocal1 || local === targetLocal2) {
          if (el.textContent) return el.textContent.trim();
        }
      }
    } catch {
      // Ignorar erros de DOM
    }
    return null;
  }

  /**
   * Constrói pacote XMP padronizado com Dublin Core e Adobe Photoshop schemas
   */
  public static buildXmpPacket(fields: {
    title?: string;
    artist?: string;
    description?: string;
    copyright?: string;
    keywords?: string;
    comment?: string;
    creationDate?: string;
  }): Uint8Array {
    const escapeXml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const titleXml = fields.title
      ? `<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(fields.title)}</rdf:li></rdf:Alt></dc:title>`
      : "";

    const creatorXml = fields.artist
      ? `<dc:creator><rdf:Seq><rdf:li>${escapeXml(fields.artist)}</rdf:li></rdf:Seq></dc:creator>`
      : "";

    const descXml = (fields.description || fields.comment)
      ? `<dc:description><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(fields.description || fields.comment || "")}</rdf:li></rdf:Alt></dc:description>`
      : "";

    const rightsXml = fields.copyright
      ? `<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(fields.copyright)}</rdf:li></rdf:Alt></dc:rights>`
      : "";

    let subjectXml = "";
    if (fields.keywords) {
      const kwList = fields.keywords.split(",").map(k => k.trim()).filter(Boolean);
      if (kwList.length > 0) {
        subjectXml = `<dc:subject><rdf:Bag>${kwList.map(k => `<rdf:li>${escapeXml(k)}</rdf:li>`).join("")}</rdf:Bag></dc:subject>`;
      }
    }

    const dateVal = fields.creationDate?.trim() || new Date().toISOString();

    const xmp = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Image Metadata Forensics Studio 2.0">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">
      ${titleXml}
      ${creatorXml}
      ${descXml}
      ${rightsXml}
      ${subjectXml}
      <xmp:CreatorTool>Image Metadata Forensics Studio</xmp:CreatorTool>
      <xmp:CreateDate>${escapeXml(dateVal)}</xmp:CreateDate>
      <xmp:ModifyDate>${escapeXml(dateVal)}</xmp:ModifyDate>
      ${fields.artist ? `<photoshop:Credit>${escapeXml(fields.artist)}</photoshop:Credit>` : ""}
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

    return new TextEncoder().encode(xmp);
  }
}
