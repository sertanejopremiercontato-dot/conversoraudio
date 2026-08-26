import {
  ImageMetadataAnalysisResult,
  ImageMetadataItem,
  ImageTechnicalInfo,
  ImageVerificationInfo,
  ImageMetadataEditForm,
  ImageCleanReport,
  ImageMetadataCategory
} from "../types";
import { ExifParser, ParsedExifData } from "../utils/exifParser";
import { XmpParser } from "../utils/xmpParser";
import { IptcParser } from "../utils/iptcParser";
import { computeImageSha256 } from "../services/imageMetadataVerifier";
import { sanitizeImageFilename } from "../utils/filenameHelper";

export class JpegMetadataAdapter {
  /**
   * Realiza a varredura física completa de todos os segmentos binários do JPEG
   */
  public static async analyze(file: File, bytes: Uint8Array): Promise<ImageMetadataAnalysisResult> {
    const items: ImageMetadataItem[] = [];
    const chunksSummary: { name: string; offset: number; size: number; details?: string; isRemovable?: boolean }[] = [];

    const technical: ImageTechnicalInfo = {
      format: "JPEG",
      mimeType: file.type || "image/jpeg",
      width: 0,
      height: 0,
      fileSize: bytes.length,
      magicBytes: "FF D8 FF",
      isLosslessCleanable: true,
      cleanMethodSummary: "Remoção física de marcadores binários APPn e COM sem recodificação de pixels"
    };

    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
      throw new Error("Arquivo não é um JPEG válido (assinatura SOI FF D8 ausente)");
    }

    chunksSummary.push({ name: "SOI (Start of Image)", offset: 0, size: 2, isRemovable: false });

    let offset = 2;
    let colorProfileName = "sRGB (Padrão)";
    let effectiveOrientation: string | number = "Normal (1)";

    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 0xff) {
        // Alinhamento
        offset++;
        continue;
      }

      const marker = bytes[offset + 1];

      // SOS (Start of Scan) - Início do fluxo de imagem comprimida até EOI
      if (marker === 0xda) {
        chunksSummary.push({
          name: "SOS (Start of Scan & Bitstream)",
          offset,
          size: bytes.length - offset - 2,
          isRemovable: false
        });
        break;
      }

      // EOI (End of Image)
      if (marker === 0xd9) {
        chunksSummary.push({ name: "EOI (End of Image)", offset, size: 2, isRemovable: false });
        break;
      }

      // Marcadores sem tamanho de payload (RST0-RST7, TEM)
      if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        offset += 2;
        continue;
      }

      const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (offset + 2 + segLen > bytes.length || segLen < 2) {
        break;
      }

      const segOffset = offset;
      const segData = bytes.subarray(offset + 4, offset + 2 + segLen);
      const totalSegSize = segLen + 2;

      // Classificação do Marcador JPEG
      switch (marker) {
        case 0xe0: {
          // APP0 (JFIF / JFXX)
          const app0Id = String.fromCharCode(...segData.subarray(0, 5));
          if (app0Id.startsWith("JFIF")) {
            const verMajor = segData[5];
            const verMinor = segData[6];
            const densityUnits = segData[7];
            const xDensity = (segData[8] << 8) | segData[9];
            const yDensity = (segData[10] << 8) | segData[11];
            technical.dpi = xDensity || 72;

            chunksSummary.push({
              name: `APP0 (JFIF v${verMajor}.${verMinor})`,
              offset: segOffset,
              size: totalSegSize,
              details: `${xDensity}x${yDensity} DPI`,
              isRemovable: false
            });

            items.push({
              id: `jfif_${segOffset}`,
              key: "JFIF_Version",
              label: "Cabeçalho JFIF",
              value: `Versão ${verMajor}.${verMinor} (${xDensity} DPI)`,
              source: "JPEG / APP0",
              category: "TECHNICAL",
              offset: segOffset,
              offsetHex: ExifParser.toHexOffset(segOffset),
              size: totalSegSize,
              isRemovable: false
            });
          } else {
            chunksSummary.push({
              name: "APP0 (JFXX / Outro)",
              offset: segOffset,
              size: totalSegSize,
              isRemovable: true
            });
          }
          break;
        }

        case 0xe1: {
          // APP1 (EXIF ou XMP)
          const idStr = String.fromCharCode(...segData.subarray(0, 6));
          if (idStr.startsWith("Exif\0\0")) {
            chunksSummary.push({
              name: "APP1 (EXIF Metadata Segment)",
              offset: segOffset,
              size: totalSegSize,
              details: "Bloco TIFF com tags de câmera, autor e GPS",
              isRemovable: true
            });

            const exifResult = ExifParser.parseTiff(segData, 6);
            items.push(...exifResult.items);
            if (exifResult.orientation) effectiveOrientation = exifResult.orientation;
          } else {
            const xmpId = String.fromCharCode(...segData.subarray(0, 28));
            if (xmpId.includes("http://ns.adobe.com/xap/1.0/")) {
              chunksSummary.push({
                name: "APP1 (Adobe XMP Packet)",
                offset: segOffset,
                size: totalSegSize,
                details: "Pacote RDF/XML com Dublin Core e Photoshop metadata",
                isRemovable: true
              });

              const xmpPayload = new TextDecoder("utf-8", { fatal: false }).decode(segData.subarray(29));
              const xmpResult = XmpParser.parse(xmpPayload, segOffset, totalSegSize);
              items.push(...xmpResult.items);
            } else {
              chunksSummary.push({
                name: "APP1 (Extensão Customizada)",
                offset: segOffset,
                size: totalSegSize,
                isRemovable: true
              });
              items.push({
                id: `app1_unknown_${segOffset}`,
                key: "APP1_Custom",
                label: "Segmento APP1 Proprietário",
                value: `Bloco binário (${totalSegSize} bytes)`,
                source: "JPEG / APP1",
                category: "UNKNOWN_OPTIONAL",
                offset: segOffset,
                offsetHex: ExifParser.toHexOffset(segOffset),
                size: totalSegSize,
                isRemovable: true
              });
            }
          }
          break;
        }

        case 0xe2: {
          // APP2 (ICC_PROFILE ou FlashPix)
          const app2Id = String.fromCharCode(...segData.subarray(0, 11));
          if (app2Id.startsWith("ICC_PROFILE")) {
            colorProfileName = "Perfil ICC Embutido (Calibração de Cor)";
            technical.colorProfile = colorProfileName;

            // Extrair descrição do perfil ICC se presente
            const iccStr = new TextDecoder("latin1").decode(segData);
            const descMatch = iccStr.match(/desc[\s\S]{4,20}([A-Za-z0-9_\- ]{4,40})/);
            if (descMatch && descMatch[1]) {
              colorProfileName = descMatch[1].trim();
              technical.colorProfile = colorProfileName;
            }

            chunksSummary.push({
              name: `APP2 (ICC Profile: ${colorProfileName})`,
              offset: segOffset,
              size: totalSegSize,
              details: "Perfil de calibração de cores preservado",
              isRemovable: false
            });

            items.push({
              id: `icc_${segOffset}`,
              key: "ICC_Profile",
              label: "Perfil de Cor ICC",
              value: colorProfileName,
              source: "JPEG / APP2",
              category: "COLOR_STRUCTURE",
              offset: segOffset,
              offsetHex: ExifParser.toHexOffset(segOffset),
              size: totalSegSize,
              isRemovable: false,
              details: "Preservado para manter a fidelidade e calibração das cores da imagem"
            });
          } else {
            chunksSummary.push({
              name: "APP2 (FlashPix / Outro)",
              offset: segOffset,
              size: totalSegSize,
              isRemovable: true
            });
          }
          break;
        }

        case 0xed: {
          // APP13 (Photoshop IRB / IPTC-NAA)
          chunksSummary.push({
            name: "APP13 (Photoshop Image Resource Blocks / IPTC)",
            offset: segOffset,
            size: totalSegSize,
            details: "Blocos 8BIM com IPTC-NAA, CaptionDigest e Copyright flag",
            isRemovable: true
          });

          const iptcResult = IptcParser.parsePhotoshopIrb(segData, segOffset);
          items.push(...iptcResult.items);
          break;
        }

        case 0xee: {
          // APP14 (Adobe Color Transform / DCT)
          chunksSummary.push({
            name: "APP14 (Adobe DCT Color Space)",
            offset: segOffset,
            size: totalSegSize,
            details: "Flag de espaço de cores Adobe (YCbCr/YCCK)",
            isRemovable: false
          });
          break;
        }

        case 0xfe: {
          // COM (Comentário JPEG)
          const commentText = new TextDecoder("utf-8", { fatal: false }).decode(segData);
          chunksSummary.push({
            name: "COM (JPEG Text Comment)",
            offset: segOffset,
            size: totalSegSize,
            details: commentText.slice(0, 40),
            isRemovable: true
          });

          items.push({
            id: `jpeg_com_${segOffset}`,
            key: "JPEG_Comment",
            label: "Comentário JPEG (COM)",
            value: commentText.trim(),
            source: "JPEG / COM",
            category: "COMMENTS",
            offset: segOffset,
            offsetHex: ExifParser.toHexOffset(segOffset),
            size: totalSegSize,
            isRemovable: true,
            details: "Segmento de comentário em texto puro"
          });
          break;
        }

        case 0xc0:
        case 0xc1:
        case 0xc2: {
          // SOF0, SOF1, SOF2 (Start of Frame)
          const precision = segData[0];
          const h = (segData[1] << 8) | segData[2];
          const w = (segData[3] << 8) | segData[4];
          const numComponents = segData[5];

          technical.width = w;
          technical.height = h;
          technical.colorDepth = `${precision}-bit • ${numComponents === 3 ? "YCbCr / RGB" : numComponents === 4 ? "CMYK" : "Monocromático"}`;
          technical.orientation = effectiveOrientation;

          const typeName = marker === 0xc0 ? "SOF0 (Linhas Base)" : marker === 0xc2 ? "SOF2 (Progressivo)" : "SOF1 (Estendido)";
          chunksSummary.push({
            name: `${typeName}: ${w}×${h} px`,
            offset: segOffset,
            size: totalSegSize,
            details: `${precision}-bit, ${numComponents} componentes`,
            isRemovable: false
          });
          break;
        }

        case 0xdb: {
          // DQT (Quantization Tables)
          chunksSummary.push({
            name: "DQT (Tabelas de Quantização)",
            offset: segOffset,
            size: totalSegSize,
            isRemovable: false
          });
          break;
        }

        case 0xc4: {
          // DHT (Huffman Tables)
          chunksSummary.push({
            name: "DHT (Tabelas Huffman)",
            offset: segOffset,
            size: totalSegSize,
            isRemovable: false
          });
          break;
        }

        default: {
          // Outros marcadores APPn (APP3-APP12, APP15, etc.)
          if (marker >= 0xe3 && marker <= 0xef) {
            const appNum = marker - 0xe0;
            chunksSummary.push({
              name: `APP${appNum} (Segmento Proprietário)`,
              offset: segOffset,
              size: totalSegSize,
              isRemovable: true
            });

            items.push({
              id: `app${appNum}_${segOffset}`,
              key: `APP${appNum}_Data`,
              label: `Segmento JPEG APP${appNum}`,
              value: `Bloco binário proprietário (${totalSegSize} bytes)`,
              source: `JPEG / APP${appNum}`,
              category: "UNKNOWN_OPTIONAL",
              offset: segOffset,
              offsetHex: ExifParser.toHexOffset(segOffset),
              size: totalSegSize,
              isRemovable: true
            });
          }
          break;
        }
      }

      offset += 2 + segLen;
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

  /**
   * Limpeza física binária sem recodificação de pixels (Zero Transcoding)
   */
  public static async clean(file: File, bytes: Uint8Array, analysis: ImageMetadataAnalysisResult): Promise<ImageCleanReport> {
    const cleanedChunks: Uint8Array[] = [];

    // Header SOI (Start of Image)
    cleanedChunks.push(new Uint8Array([0xff, 0xd8]));

    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }

      const marker = bytes[offset + 1];

      // SOS (Start of Scan) - Copiar todo o restante até o final do arquivo
      if (marker === 0xda) {
        cleanedChunks.push(bytes.subarray(offset));
        break;
      }

      if (marker === 0xd9) {
        cleanedChunks.push(new Uint8Array([0xff, 0xd9]));
        break;
      }

      if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        cleanedChunks.push(bytes.subarray(offset, offset + 2));
        offset += 2;
        continue;
      }

      const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (offset + 2 + segLen > bytes.length || segLen < 2) break;

      const fullSeg = bytes.subarray(offset, offset + 2 + segLen);
      const segData = bytes.subarray(offset + 4, offset + 2 + segLen);

      // Decisão de preservação estrutural
      let shouldKeep = false;

      if (marker === 0xe0) {
        // Manter apenas APP0 JFIF canônico
        const app0Id = String.fromCharCode(...segData.subarray(0, 5));
        if (app0Id.startsWith("JFIF")) {
          shouldKeep = true;
        }
      } else if (marker === 0xe2) {
        // Manter APP2 apenas se for ICC_PROFILE (preserva fidelidade de cores)
        const app2Id = String.fromCharCode(...segData.subarray(0, 11));
        if (app2Id.startsWith("ICC_PROFILE")) {
          shouldKeep = true;
        }
      } else if (marker === 0xee) {
        // Manter APP14 (Adobe Color Transform)
        shouldKeep = true;
      } else if (
        marker === 0xdb || // DQT
        marker === 0xc4 || // DHT
        marker === 0xc0 || // SOF0
        marker === 0xc1 || // SOF1
        marker === 0xc2 || // SOF2
        marker === 0xdd    // DRI
      ) {
        shouldKeep = true;
      }

      if (shouldKeep) {
        cleanedChunks.push(fullSeg);
      }

      offset += 2 + segLen;
    }

    // Montar buffer limpo
    let totalLen = 0;
    for (const c of cleanedChunks) totalLen += c.length;
    const cleanBytes = new Uint8Array(totalLen);
    let curOff = 0;
    for (const c of cleanedChunks) {
      cleanBytes.set(c, curOff);
      curOff += c.length;
    }

    const cleanFileName = file.name.replace(/\.[^.]+$/, "") + "_limpo.jpg";
    const cleanedFile = new File([cleanBytes], cleanFileName, { type: "image/jpeg" });

    // REANÁLISE FÍSICA A PARTIR DOS BYTES LIMPOS
    const analysisAfterClean = await this.analyze(cleanedFile, cleanBytes);

    const originalSha256 = analysis.verification.fileSha256;
    const cleanedSha256 = analysisAfterClean.verification.fileSha256;

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
      isLosslessPayloadPreserved: true,
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
   * Grava novos metadados construindo segmentos EXIF (APP1), XMP (APP1) e IPTC (APP13)
   */
  public static async writeMetadata(
    baseCleanFile: File,
    baseBytes: Uint8Array,
    form: ImageMetadataEditForm,
    originalFileName?: string
  ): Promise<File> {
    const newSegments: Uint8Array[] = [];

    // 1. Injetar EXIF APP1
    const exifTiff = ExifParser.buildExifPayload({
      title: form.title,
      artist: form.artist,
      description: form.description,
      copyright: form.copyright,
      keywords: form.keywords,
      comment: form.comment,
      dateTime: form.creationDate
    });

    const exifHeader = new TextEncoder().encode("Exif\0\0");
    const exifSegPayload = new Uint8Array(exifHeader.length + exifTiff.length);
    exifSegPayload.set(exifHeader, 0);
    exifSegPayload.set(exifTiff, exifHeader.length);

    const exifSegLen = exifSegPayload.length + 2;
    const exifSeg = new Uint8Array(2 + 2 + exifSegPayload.length);
    exifSeg[0] = 0xff;
    exifSeg[1] = 0xe1; // APP1
    exifSeg[2] = (exifSegLen >> 8) & 0xff;
    exifSeg[3] = exifSegLen & 0xff;
    exifSeg.set(exifSegPayload, 4);
    newSegments.push(exifSeg);

    // 2. Injetar XMP APP1
    const xmpBytes = XmpParser.buildXmpPacket(form);
    const xmpHeader = new TextEncoder().encode("http://ns.adobe.com/xap/1.0/\0");
    const xmpSegPayload = new Uint8Array(xmpHeader.length + xmpBytes.length);
    xmpSegPayload.set(xmpHeader, 0);
    xmpSegPayload.set(xmpBytes, xmpHeader.length);

    const xmpSegLen = xmpSegPayload.length + 2;
    const xmpSeg = new Uint8Array(2 + 2 + xmpSegPayload.length);
    xmpSeg[0] = 0xff;
    xmpSeg[1] = 0xe1; // APP1
    xmpSeg[2] = (xmpSegLen >> 8) & 0xff;
    xmpSeg[3] = xmpSegLen & 0xff;
    xmpSeg.set(xmpSegPayload, 4);
    newSegments.push(xmpSeg);

    // 3. Injetar IPTC APP13
    const iptc8Bim = IptcParser.buildIptc8Bim(form);
    const psHeader = new TextEncoder().encode("Photoshop 3.0\0");
    const iptcSegPayload = new Uint8Array(psHeader.length + iptc8Bim.length);
    iptcSegPayload.set(psHeader, 0);
    iptcSegPayload.set(iptc8Bim, psHeader.length);

    const iptcSegLen = iptcSegPayload.length + 2;
    const iptcSeg = new Uint8Array(2 + 2 + iptcSegPayload.length);
    iptcSeg[0] = 0xff;
    iptcSeg[1] = 0xed; // APP13
    iptcSeg[2] = (iptcSegLen >> 8) & 0xff;
    iptcSeg[3] = iptcSegLen & 0xff;
    iptcSeg.set(iptcSegPayload, 4);
    newSegments.push(iptcSeg);

    // Montar arquivo JPEG final:
    // SOI + [APP0 se existir] + [Novos Segmentos] + [Restante do arquivo base]
    const finalChunks: Uint8Array[] = [];
    finalChunks.push(new Uint8Array([0xff, 0xd8])); // SOI

    let offset = 2;
    if (offset + 4 <= baseBytes.length && baseBytes[offset] === 0xff && baseBytes[offset + 1] === 0xe0) {
      const app0Len = (baseBytes[offset + 2] << 8) | baseBytes[offset + 3];
      finalChunks.push(baseBytes.subarray(offset, offset + 2 + app0Len));
      offset += 2 + app0Len;
    }

    // Inserir os novos metadados
    for (const s of newSegments) {
      finalChunks.push(s);
    }

    // Adicionar o restante do fluxo de imagem
    finalChunks.push(baseBytes.subarray(offset));

    let finalTotalLen = 0;
    for (const c of finalChunks) finalTotalLen += c.length;
    const finalBytes = new Uint8Array(finalTotalLen);
    let pos = 0;
    for (const c of finalChunks) {
      finalBytes.set(c, pos);
      pos += c.length;
    }

    const editedFileName = sanitizeImageFilename(form.title, originalFileName || baseCleanFile.name, ".jpg");
    return new File([finalBytes], editedFileName, { type: "image/jpeg" });
  }
}
