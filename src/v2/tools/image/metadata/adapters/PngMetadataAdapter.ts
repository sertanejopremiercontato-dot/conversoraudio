import {
  ImageMetadataAnalysisResult,
  ImageMetadataItem,
  ImageTechnicalInfo,
  ImageVerificationInfo,
  ImageMetadataEditForm,
  ImageCleanReport,
  ImageMetadataCategory
} from "../types";
import { ExifParser } from "../utils/exifParser";
import { XmpParser } from "../utils/xmpParser";
import { decompressZlibAsync } from "../utils/inflate";
import { computeImageSha256 } from "../services/imageMetadataVerifier";
import { sanitizeImageFilename } from "../utils/filenameHelper";

export class PngMetadataAdapter {
  private static PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  /**
   * Tabela CRC32 pré-calculada para gravação de novos chunks PNG
   */
  private static crcTable: number[] = (() => {
    const table: number[] = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        if (c & 1) c = 0xedb88320 ^ (c >>> 1);
        else c = c >>> 1;
      }
      table[n] = c;
    }
    return table;
  })();

  private static calculateCrc(typeBytes: Uint8Array, dataBytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < typeBytes.length; i++) {
      crc = this.crcTable[(crc ^ typeBytes[i]) & 0xff] ^ (crc >>> 8);
    }
    for (let i = 0; i < dataBytes.length; i++) {
      crc = this.crcTable[(crc ^ dataBytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  /**
   * Realiza a varredura física completa de todos os chunks do PNG
   */
  public static async analyze(file: File, bytes: Uint8Array): Promise<ImageMetadataAnalysisResult> {
    const items: ImageMetadataItem[] = [];
    const chunksSummary: { name: string; offset: number; size: number; details?: string; isRemovable?: boolean }[] = [];

    const technical: ImageTechnicalInfo = {
      format: "PNG",
      mimeType: file.type || "image/png",
      width: 0,
      height: 0,
      fileSize: bytes.length,
      magicBytes: "89 50 4E 47",
      isLosslessCleanable: true,
      cleanMethodSummary: "Filtragem física de chunks auxiliares (tEXt, zTXt, iTXt, eXIf, tIME) sem recodificação"
    };

    if (bytes.length < 8) {
      throw new Error("Arquivo menor que o cabeçalho mínimo PNG");
    }

    for (let i = 0; i < 8; i++) {
      if (bytes[i] !== this.PNG_SIGNATURE[i]) {
        throw new Error("Arquivo não é um PNG válido (assinatura 89 50 4E 47 ausente)");
      }
    }

    chunksSummary.push({ name: "Assinatura PNG (8 bytes)", offset: 0, size: 8, isRemovable: false });

    let offset = 8;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    while (offset + 12 <= bytes.length) {
      const chunkLen = view.getUint32(offset);
      const chunkTypeBytes = bytes.subarray(offset + 4, offset + 8);
      const chunkType = String.fromCharCode(...chunkTypeBytes);
      const chunkOffset = offset;
      const totalChunkSize = chunkLen + 12;

      if (offset + 8 + chunkLen > bytes.length) {
        break;
      }

      const chunkData = bytes.subarray(offset + 8, offset + 8 + chunkLen);

      // Tratamento por tipo de chunk
      switch (chunkType) {
        case "IHDR": {
          const w = view.getUint32(offset + 8);
          const h = view.getUint32(offset + 12);
          const bitDepth = chunkData[8];
          const colorType = chunkData[9];
          const hasAlpha = colorType === 4 || colorType === 6;

          technical.width = w;
          technical.height = h;
          technical.hasAlpha = hasAlpha;

          const colorNames: Record<number, string> = {
            0: "Escala de Cinza",
            2: "RGB Colorido",
            3: "Paleta Indexada",
            4: "Escala de Cinza com Alpha",
            6: "RGBA Colorido com Alpha"
          };

          technical.colorDepth = `${bitDepth}-bit • ${colorNames[colorType] || "Desconhecido"}`;
          chunksSummary.push({
            name: `IHDR: ${w}×${h} px`,
            offset: chunkOffset,
            size: totalChunkSize,
            details: `${bitDepth}-bit ${colorNames[colorType] || ""}`,
            isRemovable: false
          });
          break;
        }

        case "tEXt": {
          // Chave NUL Texto (Latin-1)
          let nullIdx = -1;
          for (let k = 0; k < chunkData.length; k++) {
            if (chunkData[k] === 0) {
              nullIdx = k;
              break;
            }
          }

          let keyword = "Texto";
          let textVal = "";

          if (nullIdx !== -1) {
            keyword = new TextDecoder("latin1").decode(chunkData.subarray(0, nullIdx));
            textVal = new TextDecoder("latin1").decode(chunkData.subarray(nullIdx + 1));
          } else {
            textVal = new TextDecoder("latin1").decode(chunkData);
          }

          chunksSummary.push({
            name: `tEXt: "${keyword}"`,
            offset: chunkOffset,
            size: totalChunkSize,
            details: textVal.slice(0, 40),
            isRemovable: true
          });

          const cat = this.classifyPngKeyword(keyword);
          items.push({
            id: `png_text_${chunkOffset}`,
            key: keyword,
            label: `Campo PNG (${keyword})`,
            value: textVal.trim(),
            source: "PNG / tEXt",
            category: cat,
            offset: chunkOffset,
            offsetHex: ExifParser.toHexOffset(chunkOffset),
            size: totalChunkSize,
            isRemovable: true,
            details: `Chunk tEXt codificado em Latin-1`
          });
          break;
        }

        case "zTXt": {
          // Chave NUL CompressionMethod(1 byte) CompressedData
          let nullIdx = -1;
          for (let k = 0; k < chunkData.length; k++) {
            if (chunkData[k] === 0) {
              nullIdx = k;
              break;
            }
          }

          let keyword = "CompressedText";
          let decompressedText = "";

          if (nullIdx !== -1 && nullIdx + 2 <= chunkData.length) {
            keyword = new TextDecoder("latin1").decode(chunkData.subarray(0, nullIdx));
            const compressedPayload = chunkData.subarray(nullIdx + 2);
            try {
              const decompressedBytes = await decompressZlibAsync(compressedPayload);
              decompressedText = new TextDecoder("utf-8", { fatal: false }).decode(decompressedBytes);
            } catch {
              decompressedText = `[Bloco comprimido zlib de ${compressedPayload.length} bytes]`;
            }
          }

          chunksSummary.push({
            name: `zTXt: "${keyword}"`,
            offset: chunkOffset,
            size: totalChunkSize,
            details: decompressedText.slice(0, 40),
            isRemovable: true
          });

          const cat = this.classifyPngKeyword(keyword);
          items.push({
            id: `png_ztxt_${chunkOffset}`,
            key: keyword,
            label: `Texto Comprimido PNG (${keyword})`,
            value: decompressedText.trim(),
            source: "PNG / zTXt",
            category: cat,
            offset: chunkOffset,
            offsetHex: ExifParser.toHexOffset(chunkOffset),
            size: totalChunkSize,
            isRemovable: true,
            details: `Chunk zTXt descomprimido com sucesso`
          });
          break;
        }

        case "iTXt": {
          // Keyword NUL CompressionFlag(1) CompressionMethod(1) LanguageTag NUL TranslatedKeyword NUL Text
          let null1 = -1;
          for (let k = 0; k < chunkData.length; k++) {
            if (chunkData[k] === 0) {
              null1 = k;
              break;
            }
          }

          if (null1 !== -1 && null1 + 3 < chunkData.length) {
            const keyword = new TextDecoder("utf-8", { fatal: false }).decode(chunkData.subarray(0, null1));
            const isCompressed = chunkData[null1 + 1] === 1;

            // Pular language tag e translated keyword
            let cur = null1 + 3;
            // Procurar 2º NUL
            while (cur < chunkData.length && chunkData[cur] !== 0) cur++;
            cur++; // pular 2º NUL
            // Procurar 3º NUL
            while (cur < chunkData.length && chunkData[cur] !== 0) cur++;
            cur++; // pular 3º NUL

            let textPayload = "";
            if (cur <= chunkData.length) {
              const rawData = chunkData.subarray(cur);
              if (isCompressed) {
                try {
                  const uncompressed = await decompressZlibAsync(rawData);
                  textPayload = new TextDecoder("utf-8", { fatal: false }).decode(uncompressed);
                } catch {
                  textPayload = new TextDecoder("utf-8", { fatal: false }).decode(rawData);
                }
              } else {
                textPayload = new TextDecoder("utf-8", { fatal: false }).decode(rawData);
              }
            }

            chunksSummary.push({
              name: `iTXt: "${keyword}"`,
              offset: chunkOffset,
              size: totalChunkSize,
              details: textPayload.slice(0, 40),
              isRemovable: true
            });

            // Se for XMP embutido no PNG
            if (keyword === "XML:com.adobe.xmp") {
              const xmpResult = XmpParser.parse(textPayload, chunkOffset, totalChunkSize);
              items.push(...xmpResult.items);
            } else {
              const cat = this.classifyPngKeyword(keyword);
              items.push({
                id: `png_itxt_${chunkOffset}`,
                key: keyword,
                label: `Campo Internacional iTXt (${keyword})`,
                value: textPayload.trim(),
                source: "PNG / iTXt",
                category: cat,
                offset: chunkOffset,
                offsetHex: ExifParser.toHexOffset(chunkOffset),
                size: totalChunkSize,
                isRemovable: true,
                details: isCompressed ? "Comprimido via zlib" : "UTF-8 sem compressão"
              });
            }
          }
          break;
        }

        case "eXIf": {
          // Bloco EXIF TIFF direto
          chunksSummary.push({
            name: "eXIf (PNG EXIF Chunk)",
            offset: chunkOffset,
            size: totalChunkSize,
            details: "Bloco TIFF padronizado no PNG",
            isRemovable: true
          });

          const exifResult = ExifParser.parseTiff(chunkData, 0);
          items.push(...exifResult.items);
          if (exifResult.orientation) technical.orientation = exifResult.orientation;
          break;
        }

        case "iCCP": {
          // Perfil ICC
          let nullIdx = -1;
          for (let k = 0; k < chunkData.length; k++) {
            if (chunkData[k] === 0) {
              nullIdx = k;
              break;
            }
          }
          const profName = nullIdx !== -1 ? new TextDecoder("latin1").decode(chunkData.subarray(0, nullIdx)) : "Perfil ICC";
          technical.colorProfile = profName;

          chunksSummary.push({
            name: `iCCP: "${profName}"`,
            offset: chunkOffset,
            size: totalChunkSize,
            details: "Perfil de calibração de cor preservado",
            isRemovable: false
          });

          items.push({
            id: `png_iccp_${chunkOffset}`,
            key: "iCCP_Profile",
            label: "Perfil de Cor ICC",
            value: profName,
            source: "PNG / iCCP",
            category: "COLOR_STRUCTURE",
            offset: chunkOffset,
            offsetHex: ExifParser.toHexOffset(chunkOffset),
            size: totalChunkSize,
            isRemovable: false,
            details: "Preservado para manter a calibração de cor do monitor"
          });
          break;
        }

        case "tIME": {
          // Timestamp PNG (7 bytes: Year 2, Month 1, Day 1, Hour 1, Min 1, Sec 1)
          if (chunkData.length >= 7) {
            const y = (chunkData[0] << 8) | chunkData[1];
            const m = chunkData[2];
            const d = chunkData[3];
            const hh = chunkData[4];
            const mm = chunkData[5];
            const ss = chunkData[6];
            const timeStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

            chunksSummary.push({
              name: "tIME (Timestamp de Modificação)",
              offset: chunkOffset,
              size: totalChunkSize,
              details: timeStr,
              isRemovable: true
            });

            items.push({
              id: `png_time_${chunkOffset}`,
              key: "PNG_tIME",
              label: "Data de Modificação PNG (tIME)",
              value: timeStr,
              source: "PNG / tIME",
              category: "PRIVACY",
              offset: chunkOffset,
              offsetHex: ExifParser.toHexOffset(chunkOffset),
              size: totalChunkSize,
              isRemovable: true,
              details: "Timestamp físico gravado no container PNG"
            });
          }
          break;
        }

        case "pHYs": {
          if (chunkData.length >= 9) {
            const ppuX = view.getUint32(offset + 8);
            const ppuY = view.getUint32(offset + 12);
            const unit = chunkData[8];
            const dpi = unit === 1 ? Math.round(ppuX * 0.0254) : undefined;
            if (dpi) technical.dpi = dpi;

            chunksSummary.push({
              name: `pHYs: ${dpi ? `${dpi} DPI` : `${ppuX}x${ppuY} ppu`}`,
              offset: chunkOffset,
              size: totalChunkSize,
              details: "Dimensões físicas em pixels por metro",
              isRemovable: false
            });
          }
          break;
        }

        case "IDAT": {
          chunksSummary.push({
            name: "IDAT (Pixel Bitstream Data)",
            offset: chunkOffset,
            size: totalChunkSize,
            isRemovable: false
          });
          break;
        }

        case "IEND": {
          chunksSummary.push({
            name: "IEND (Fim da Imagem PNG)",
            offset: chunkOffset,
            size: totalChunkSize,
            isRemovable: false
          });
          break;
        }

        default: {
          // Outros chunks (sRGB, gAMA, cHRM, bKGD, ou chunks proprietários)
          const isStandardVisual = ["sRGB", "gAMA", "cHRM", "sBIT", "bKGD", "hIST", "PLTE"].includes(chunkType);
          chunksSummary.push({
            name: `${chunkType} (${isStandardVisual ? "Estrutura Visual" : "Chunk Auxiliar"})`,
            offset: chunkOffset,
            size: totalChunkSize,
            isRemovable: !isStandardVisual
          });

          if (!isStandardVisual) {
            items.push({
              id: `png_chunk_${chunkType}_${chunkOffset}`,
              key: `PNG_Chunk_${chunkType}`,
              label: `Chunk PNG Proprietário (${chunkType})`,
              value: `Bloco binário (${chunkLen} bytes)`,
              source: `PNG / ${chunkType}`,
              category: "UNKNOWN_OPTIONAL",
              offset: chunkOffset,
              offsetHex: ExifParser.toHexOffset(chunkOffset),
              size: totalChunkSize,
              isRemovable: true
            });
          }
          break;
        }
      }

      offset += totalChunkSize;
    }

    const privacyItems = items.filter(i => i.category === "PRIVACY");
    const provenanceItems = items.filter(i => i.category === "PROVENANCE");
    const softwareItems = items.filter(i => i.category === "SOFTWARE_GENERATOR");
    const metadataItems = items.filter(i => i.category === "METADATA");
    const commentItems = items.filter(i => i.category === "COMMENTS");
    const xmpIptcItems = items.filter(i => i.category === "XMP_IPTC");
    const unknownOptionalItems = items.filter(i => i.category === "UNKNOWN_OPTIONAL");
    const technicalItems = items.filter(i => i.category === "TECHNICAL" || i.category === "COLOR_STRUCTURE");

    const fileSha256 = await computeImageSha256(bytes);

    const verification: ImageVerificationInfo = {
      fileSha256,
      chunksSummary,
      removableMetadataCount: items.filter(i => i.isRemovable).length,
      privacyIssuesCount: privacyItems.length,
      softwareGeneratorCount: softwareItems.length,
      gpsCount: items.filter(i => i.key.toLowerCase().includes("gps")).length,
      commentsCount: commentItems.length,
      unknownOptionalCount: unknownOptionalItems.length,
      xmpIptcCount: xmpIptcItems.length,
      isClean: items.filter(i => i.isRemovable).length === 0
    };

    return {
      technical,
      verification,
      items,
      privacyItems,
      provenanceItems,
      softwareItems,
      metadataItems,
      commentItems,
      xmpIptcItems,
      unknownOptionalItems,
      technicalItems
    };
  }

  private static classifyPngKeyword(kw: string): ImageMetadataCategory {
    const k = kw.toLowerCase();
    if (k.includes("prompt") || k.includes("parameters") || k.includes("workflow") || k.includes("software") || k.includes("tool") || k.includes("generator") || k.includes("model") || k.includes("seed")) {
      return "SOFTWARE_GENERATOR";
    }
    if (k.includes("date") || k.includes("time") || k.includes("gps") || k.includes("serial") || k.includes("location")) {
      return "PRIVACY";
    }
    if (k.includes("camera") || k.includes("make") || k.includes("lens") || k.includes("device")) {
      return "PROVENANCE";
    }
    if (k.includes("comment") || k.includes("description") || k.includes("notes")) {
      return "COMMENTS";
    }
    if (k.includes("title") || k.includes("author") || k.includes("artist") || k.includes("copyright") || k.includes("source") || k.includes("disclaimer") || k.includes("warning")) {
      return "METADATA";
    }
    return "UNKNOWN_OPTIONAL";
  }

  /**
   * Limpeza física de chunks PNG sem recodificação de imagem
   */
  public static async clean(file: File, bytes: Uint8Array, analysis: ImageMetadataAnalysisResult): Promise<ImageCleanReport> {
    const cleanedChunks: Uint8Array[] = [];

    // 8 bytes de assinatura
    cleanedChunks.push(bytes.subarray(0, 8));

    let offset = 8;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    // Chunks estritamente essenciais e preservados
    const ESSENTIAL_CHUNKS = new Set(["IHDR", "PLTE", "IDAT", "IEND", "iCCP", "sRGB", "gAMA", "cHRM", "pHYs", "sBIT", "bKGD", "hIST"]);

    while (offset + 12 <= bytes.length) {
      const chunkLen = view.getUint32(offset);
      const chunkTypeBytes = bytes.subarray(offset + 4, offset + 8);
      const chunkType = String.fromCharCode(...chunkTypeBytes);
      const totalChunkSize = chunkLen + 12;

      if (offset + totalChunkSize > bytes.length) break;

      const fullChunk = bytes.subarray(offset, offset + totalChunkSize);

      if (ESSENTIAL_CHUNKS.has(chunkType)) {
        cleanedChunks.push(fullChunk);
      }

      offset += totalChunkSize;
    }

    let totalLen = 0;
    for (const c of cleanedChunks) totalLen += c.length;
    const cleanBytes = new Uint8Array(totalLen);
    let curOff = 0;
    for (const c of cleanedChunks) {
      cleanBytes.set(c, curOff);
      curOff += c.length;
    }

    const cleanFileName = file.name.replace(/\.[^.]+$/, "") + "_limpo.png";
    const cleanedFile = new File([cleanBytes], cleanFileName, { type: "image/png" });

    // REANÁLISE FÍSICA A PARTIR DOS BYTES LIMPOS
    const analysisAfterClean = await this.analyze(cleanedFile, cleanBytes);

    const originalSha256 = analysis.verification.fileSha256;
    const cleanedSha256 = analysisAfterClean.verification.fileSha256;

    // Prova de preservação bit-a-bit dos IDATs no Clean
    const idatBefore = this.extractIdatPayloads(bytes);
    const idatAfter = this.extractIdatPayloads(cleanBytes);
    const idatPayloadHashBefore = await computeImageSha256(idatBefore);
    const idatPayloadHashAfter = await computeImageSha256(idatAfter);
    const isIdatPayloadPreserved = idatPayloadHashBefore === idatPayloadHashAfter;

    const removedItems = analysis.items
      .filter(item => item.isRemovable)
      .map(item => ({
        key: item.key,
        label: item.label,
        value: item.value,
        source: item.source,
        offsetHex: item.offsetHex,
        category: item.category
      }));

    return {
      cleanedFile,
      originalSha256,
      cleanedSha256,
      originalSize: bytes.length,
      cleanedSize: cleanBytes.length,
      originalWidth: analysis.technical.width,
      originalHeight: analysis.technical.height,
      cleanedWidth: analysisAfterClean.technical.width,
      cleanedHeight: analysisAfterClean.technical.height,
      dimensionsPreserved: analysis.technical.width === analysisAfterClean.technical.width,
      isLosslessPayloadPreserved: isIdatPayloadPreserved,
      idatPayloadHashBefore,
      idatPayloadHashAfter,
      isIdatPayloadPreserved,
      itemsBeforeCount: analysis.items.length,
      itemsAfterCount: analysisAfterClean.items.length,
      removedItems,
      analysisAfterClean,
      isFullyClean: analysisAfterClean.verification.removableMetadataCount === 0,
      cleaningStatusSummary: {
        exifRemaining: analysisAfterClean.items.filter(i => i.source.includes("EXIF") && i.isRemovable).length,
        gpsRemaining: analysisAfterClean.items.filter(i => i.key.toLowerCase().includes("gps")).length,
        xmpRemaining: analysisAfterClean.items.filter(i => i.source.includes("XMP") && i.isRemovable).length,
        iptcRemaining: analysisAfterClean.items.filter(i => i.source.includes("IPTC") && i.isRemovable).length,
        softwareRemaining: analysisAfterClean.items.filter(i => i.category === "SOFTWARE_GENERATOR").length,
        commentsRemaining: analysisAfterClean.items.filter(i => i.category === "COMMENTS").length,
        provenanceRemaining: analysisAfterClean.items.filter(i => i.category === "PROVENANCE").length,
        unknownOptionalRemaining: analysisAfterClean.items.filter(i => i.category === "UNKNOWN_OPTIONAL").length
      }
    };
  }

  /**
   * Extrai e concatena todos os payloads dos chunks IDAT para cálculo de hash de integridade
   */
  public static extractIdatPayloads(bytes: Uint8Array): Uint8Array {
    const parts: Uint8Array[] = [];
    let offset = 8;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    while (offset + 12 <= bytes.length) {
      const chunkLen = view.getUint32(offset, false);
      const chunkTypeBytes = bytes.subarray(offset + 4, offset + 8);
      const chunkType = String.fromCharCode(...chunkTypeBytes);
      const totalChunkSize = chunkLen + 12;

      if (offset + totalChunkSize > bytes.length) break;

      if (chunkType === "IDAT") {
        parts.push(bytes.subarray(offset + 8, offset + 8 + chunkLen));
      }

      offset += totalChunkSize;
    }

    let totalLen = 0;
    for (const p of parts) totalLen += p.length;
    const combined = new Uint8Array(totalLen);
    let cur = 0;
    for (const p of parts) {
      combined.set(p, cur);
      cur += p.length;
    }
    return combined;
  }

  /**
   * Grava novos metadados construindo chunks canônicos iTXt (XMP, Title, Author, etc.) e eXIf
   * Preserva pixels e IDATs originais intactos
   */
  public static async writeMetadata(
    baseCleanFile: File,
    baseBytes: Uint8Array,
    form: ImageMetadataEditForm,
    originalFileName?: string
  ): Promise<File> {
    const newChunks: Uint8Array[] = [];

    const createTextChunk = (type: "tEXt" | "iTXt", keyword: string, text: string): Uint8Array => {
      const typeBytes = new TextEncoder().encode(type);
      let dataBytes: Uint8Array;

      if (type === "tEXt") {
        const kw = new TextEncoder().encode(keyword);
        const txt = new TextEncoder().encode(text);
        dataBytes = new Uint8Array(kw.length + 1 + txt.length);
        dataBytes.set(kw, 0);
        dataBytes[kw.length] = 0;
        dataBytes.set(txt, kw.length + 1);
      } else {
        // iTXt: Keyword \0 CompressionFlag(0) CompressionMethod(0) LangTag \0 TransKw \0 Text
        const kw = new TextEncoder().encode(keyword);
        const txt = new TextEncoder().encode(text);
        dataBytes = new Uint8Array(kw.length + 5 + txt.length);
        dataBytes.set(kw, 0);
        dataBytes[kw.length] = 0; // null 1
        dataBytes[kw.length + 1] = 0; // uncompressed
        dataBytes[kw.length + 2] = 0; // method 0
        dataBytes[kw.length + 3] = 0; // null 2 (empty lang)
        dataBytes[kw.length + 4] = 0; // null 3 (empty trans kw)
        dataBytes.set(txt, kw.length + 5);
      }

      const crc = this.calculateCrc(typeBytes, dataBytes);
      const chunk = new Uint8Array(4 + 4 + dataBytes.length + 4);
      const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      view.setUint32(0, dataBytes.length, false);
      chunk.set(typeBytes, 4);
      chunk.set(dataBytes, 8);
      view.setUint32(8 + dataBytes.length, crc, false);
      return chunk;
    };

    if (form.title && form.title.trim()) {
      newChunks.push(createTextChunk("iTXt", "Title", form.title.trim()));
    }
    if (form.artist && form.artist.trim()) {
      newChunks.push(createTextChunk("iTXt", "Author", form.artist.trim()));
    }
    if (form.description && form.description.trim()) {
      newChunks.push(createTextChunk("iTXt", "Description", form.description.trim()));
    }
    if (form.copyright && form.copyright.trim()) {
      newChunks.push(createTextChunk("iTXt", "Copyright", form.copyright.trim()));
    }
    if (form.keywords && form.keywords.trim()) {
      newChunks.push(createTextChunk("iTXt", "Keywords", form.keywords.trim()));
    }
    if (form.comment && form.comment.trim()) {
      newChunks.push(createTextChunk("iTXt", "Comment", form.comment.trim()));
    }
    if (form.creationDate && form.creationDate.trim()) {
      newChunks.push(createTextChunk("iTXt", "Creation Time", form.creationDate.trim()));
    }

    // XMP chunk em iTXt (XML:com.adobe.xmp)
    const xmpBytes = XmpParser.buildXmpPacket(form);
    const xmpText = new TextDecoder("utf-8").decode(xmpBytes);
    newChunks.push(createTextChunk("iTXt", "XML:com.adobe.xmp", xmpText));

    // Inserir os novos chunks imediatamente após o IHDR
    const finalParts: Uint8Array[] = [];
    finalParts.push(baseBytes.subarray(0, 8)); // Assinatura PNG

    let offset = 8;
    const view = new DataView(baseBytes.buffer, baseBytes.byteOffset, baseBytes.byteLength);

    while (offset + 12 <= baseBytes.length) {
      const chunkLen = view.getUint32(offset, false);
      const chunkTypeBytes = baseBytes.subarray(offset + 4, offset + 8);
      const chunkType = String.fromCharCode(...chunkTypeBytes);
      const totalChunkSize = chunkLen + 12;

      if (offset + totalChunkSize > baseBytes.length) break;

      finalParts.push(baseBytes.subarray(offset, offset + totalChunkSize));

      if (chunkType === "IHDR") {
        // Inserir novos chunks iTXt / XMP após IHDR
        for (const nc of newChunks) {
          finalParts.push(nc);
        }
      }

      offset += totalChunkSize;
    }

    let totalLen = 0;
    for (const p of finalParts) totalLen += p.length;
    const finalBytes = new Uint8Array(totalLen);
    let curOff = 0;
    for (const p of finalParts) {
      finalBytes.set(p, curOff);
      curOff += p.length;
    }

    const editedFileName = sanitizeImageFilename(form.title, originalFileName || baseCleanFile.name, ".png");
    const finalEditedFile = new File([finalBytes], editedFileName, {
      type: "image/png",
      lastModified: Date.now()
    });

    // Validação física imediata sobre o ArrayBuffer do File gerado
    const validationBuffer = await finalEditedFile.arrayBuffer();
    const validationBytes = new Uint8Array(validationBuffer);

    // Validação de assinatura PNG
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < 8; i++) {
      if (validationBytes[i] !== pngSignature[i]) {
        throw new Error("Falha de integridade: assinatura PNG inválida no arquivo final gerado.");
      }
    }

    return finalEditedFile;
  }
}
