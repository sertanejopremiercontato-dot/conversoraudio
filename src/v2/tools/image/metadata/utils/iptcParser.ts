import { ImageMetadataItem, ImageMetadataCategory } from "../types";
import { ExifParser } from "./exifParser";

export interface ParsedIptcData {
  items: ImageMetadataItem[];
  title?: string;
  byline?: string;
  copyright?: string;
  caption?: string;
  keywords?: string[];
  headline?: string;
  credit?: string;
}

export class IptcParser {
  private static DATASET_NAMES: Record<number, { name: string; label: string; cat: ImageMetadataCategory }> = {
    5: { name: "ObjectName", label: "Título da Imagem (IPTC)", cat: "METADATA" },
    25: { name: "Keywords", label: "Palavras-chave (IPTC)", cat: "METADATA" },
    40: { name: "SpecialInstructions", label: "Instruções Especiais (IPTC)", cat: "METADATA" },
    55: { name: "DateCreated", label: "Data de Criação (IPTC)", cat: "PRIVACY" },
    60: { name: "TimeCreated", label: "Hora de Criação (IPTC)", cat: "PRIVACY" },
    80: { name: "Byline", label: "Autor / Fotógrafo (IPTC)", cat: "METADATA" },
    85: { name: "BylineTitle", label: "Cargo do Autor (IPTC)", cat: "METADATA" },
    90: { name: "City", label: "Cidade (IPTC)", cat: "PRIVACY" },
    95: { name: "ProvinceState", label: "Estado / Província (IPTC)", cat: "PRIVACY" },
    101: { name: "CountryName", label: "País (IPTC)", cat: "PRIVACY" },
    105: { name: "Headline", label: "Manchete (IPTC)", cat: "METADATA" },
    110: { name: "Credit", label: "Créditos (IPTC)", cat: "METADATA" },
    115: { name: "Source", label: "Fonte Original (IPTC)", cat: "PROVENANCE" },
    116: { name: "CopyrightNotice", label: "Aviso de Copyright (IPTC)", cat: "METADATA" },
    120: { name: "Caption", label: "Legenda / Descrição (IPTC)", cat: "METADATA" },
    122: { name: "CaptionWriter", label: "Autor da Legenda (IPTC)", cat: "METADATA" }
  };

  /**
   * Realiza a varredura de todos os blocos 8BIM do Photoshop IRB e registros IPTC
   */
  public static parsePhotoshopIrb(bytes: Uint8Array, baseOffset = 0): ParsedIptcData {
    const result: ParsedIptcData = { items: [] };
    let offset = 0;

    while (offset + 8 <= bytes.length) {
      // Assinatura '8BIM' ou 'MeSa'
      const sig = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
      if (sig !== "8BIM" && sig !== "MeSa") {
        offset++;
        continue;
      }

      const resourceId = (bytes[offset + 4] << 8) | bytes[offset + 5];
      offset += 6;

      // Nome do recurso (Pascal string: 1 byte de tamanho + caracteres, alinhado em múltiplos de 2)
      let nameLen = 0;
      if (offset < bytes.length) {
        nameLen = bytes[offset];
      }
      let nameOffset = offset + 1;
      let totalNameBytes = 1 + nameLen;
      if (totalNameBytes % 2 !== 0) totalNameBytes += 1;
      offset += totalNameBytes;

      if (offset + 4 > bytes.length) break;
      const dataSize = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 4;

      if (offset + dataSize > bytes.length || dataSize < 0) break;
      const dataSlice = bytes.subarray(offset, offset + dataSize);

      const blockAbsoluteOffset = baseOffset + offset;

      if (resourceId === 0x0404) {
        // Bloco IPTC-NAA
        this.parseIptcNaa(dataSlice, blockAbsoluteOffset, result);
      } else if (resourceId === 0x040a) {
        // Copyright flag
        const isCopyrighted = dataSlice.length > 0 && dataSlice[0] === 1;
        result.items.push({
          id: `ps_copyright_flag_${blockAbsoluteOffset}`,
          key: "PhotoshopCopyrightFlag",
          label: "Flag de Copyright (Photoshop)",
          value: isCopyrighted ? "Sim (Protegido por Direitos Autorais)" : "Não",
          source: "JPEG / APP13 (Photoshop IRB)",
          category: "METADATA",
          offset: blockAbsoluteOffset,
          offsetHex: ExifParser.toHexOffset(blockAbsoluteOffset),
          size: dataSize,
          isRemovable: true,
          details: "Resource ID 0x040A"
        });
      } else if (resourceId === 0x0421) {
        // Caption Digest
        result.items.push({
          id: `ps_caption_digest_${blockAbsoluteOffset}`,
          key: "CaptionDigest",
          label: "Digest de Legenda (Photoshop)",
          value: `Hash criptográfico (${dataSize} bytes)`,
          source: "JPEG / APP13 (Photoshop IRB)",
          category: "PRIVACY",
          offset: blockAbsoluteOffset,
          offsetHex: ExifParser.toHexOffset(blockAbsoluteOffset),
          size: dataSize,
          isRemovable: true,
          details: "Hash de integridade da legenda do Photoshop"
        });
      } else {
        // Outros blocos IRB (0x03ED ResolutionInfo, 0x040C Thumbnail, etc.)
        result.items.push({
          id: `ps_irb_${resourceId.toString(16)}_${blockAbsoluteOffset}`,
          key: `Photoshop_IRB_0x${resourceId.toString(16).toUpperCase()}`,
          label: `Recurso Photoshop IRB (0x${resourceId.toString(16).toUpperCase()})`,
          value: `Bloco binário (${dataSize} bytes)`,
          source: "JPEG / APP13 (Photoshop IRB)",
          category: "UNKNOWN_OPTIONAL",
          offset: blockAbsoluteOffset,
          offsetHex: ExifParser.toHexOffset(blockAbsoluteOffset),
          size: dataSize,
          isRemovable: true
        });
      }

      // Alinhamento do bloco de dados (múltiplo de 2)
      offset += dataSize;
      if (dataSize % 2 !== 0) offset++;
    }

    return result;
  }

  /**
   * Lê datasets binários do padrão IPTC-NAA (Tag Marker 0x1C)
   */
  public static parseIptcNaa(bytes: Uint8Array, baseOffset: number, result: ParsedIptcData) {
    let offset = 0;
    while (offset + 5 <= bytes.length) {
      if (bytes[offset] !== 0x1c) {
        offset++;
        continue;
      }

      const recordNumber = bytes[offset + 1];
      const datasetNumber = bytes[offset + 2];
      const datasetSize = (bytes[offset + 3] << 8) | bytes[offset + 4];
      offset += 5;

      if (offset + datasetSize > bytes.length) break;

      const payload = bytes.subarray(offset, offset + datasetSize);
      let textVal = "";
      try {
        textVal = new TextDecoder("utf-8", { fatal: false }).decode(payload).trim();
      } catch {
        textVal = Array.from(payload).map(b => String.fromCharCode(b)).join("").trim();
      }

      const absOffset = baseOffset + offset;

      if (recordNumber === 2) {
        const info = this.DATASET_NAMES[datasetNumber];
        if (info) {
          if (datasetNumber === 5) result.title = textVal;
          if (datasetNumber === 80) result.byline = textVal;
          if (datasetNumber === 116) result.copyright = textVal;
          if (datasetNumber === 120) result.caption = textVal;
          if (datasetNumber === 105) result.headline = textVal;
          if (datasetNumber === 110) result.credit = textVal;
          if (datasetNumber === 25) {
            if (!result.keywords) result.keywords = [];
            result.keywords.push(textVal);
          }

          result.items.push({
            id: `iptc_${info.name}_${absOffset}`,
            key: info.name,
            label: info.label,
            value: textVal,
            source: "JPEG / APP13 (IPTC-NAA)",
            category: info.cat,
            offset: absOffset,
            offsetHex: ExifParser.toHexOffset(absOffset),
            size: datasetSize,
            isRemovable: true,
            details: `Dataset 2:${datasetNumber.toString().padStart(2, "0")}`
          });
        } else {
          result.items.push({
            id: `iptc_dataset_${datasetNumber}_${absOffset}`,
            key: `IPTC_Dataset_2_${datasetNumber}`,
            label: `Dataset IPTC 2:${datasetNumber}`,
            value: textVal || `Binário (${datasetSize} bytes)`,
            source: "JPEG / APP13 (IPTC-NAA)",
            category: "XMP_IPTC",
            offset: absOffset,
            offsetHex: ExifParser.toHexOffset(absOffset),
            size: datasetSize,
            isRemovable: true
          });
        }
      }

      offset += datasetSize;
    }
  }

  /**
   * Constrói bloco binário Photoshop IRB com IPTC-NAA datasets
   */
  public static buildIptc8Bim(fields: {
    title?: string;
    artist?: string;
    description?: string;
    copyright?: string;
    keywords?: string;
  }): Uint8Array {
    const enc = new TextEncoder();
    const datasets: Uint8Array[] = [];

    const addDataset = (record: number, dataset: number, text: string) => {
      const bytes = enc.encode(text);
      const ds = new Uint8Array(5 + bytes.length);
      ds[0] = 0x1c; // IPTC marker
      ds[1] = record;
      ds[2] = dataset;
      ds[3] = (bytes.length >> 8) & 0xff;
      ds[4] = bytes.length & 0xff;
      ds.set(bytes, 5);
      datasets.push(ds);
    };

    if (fields.title) addDataset(2, 5, fields.title);
    if (fields.artist) addDataset(2, 80, fields.artist);
    if (fields.copyright) addDataset(2, 116, fields.copyright);
    if (fields.description) addDataset(2, 120, fields.description);
    if (fields.keywords) {
      const kws = fields.keywords.split(",").map(k => k.trim()).filter(Boolean);
      for (const kw of kws) {
        addDataset(2, 25, kw);
      }
    }

    let iptcLen = 0;
    for (const d of datasets) iptcLen += d.length;
    const iptcBuf = new Uint8Array(iptcLen);
    let off = 0;
    for (const d of datasets) {
      iptcBuf.set(d, off);
      off += d.length;
    }

    // Encapsular em 8BIM Resource 0x0404
    // Header 8BIM: '8BIM' (4) + ID (2) + PascalName (2) + Size (4) + Data + Pad
    let pad = iptcLen % 2 !== 0 ? 1 : 0;
    const totalSize = 12 + iptcLen + pad;
    const irb = new Uint8Array(totalSize);

    // '8BIM'
    irb[0] = 0x38;
    irb[1] = 0x42;
    irb[2] = 0x49;
    irb[3] = 0x4d;
    // ID 0x0404
    irb[4] = 0x04;
    irb[5] = 0x04;
    // Name: empty pascal string (0x00 0x00)
    irb[6] = 0x00;
    irb[7] = 0x00;
    // Size (uint32 big-endian)
    irb[8] = (iptcLen >> 24) & 0xff;
    irb[9] = (iptcLen >> 16) & 0xff;
    irb[10] = (iptcLen >> 8) & 0xff;
    irb[11] = iptcLen & 0xff;

    irb.set(iptcBuf, 12);
    return irb;
  }
}
