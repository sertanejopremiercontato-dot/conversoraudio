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
import { computeImageSha256 } from "../services/imageMetadataVerifier";
import { sanitizeImageFilename } from "../utils/filenameHelper";

export class WebpMetadataAdapter {
  /**
   * Realiza a varredura física completa de todos os chunks do container RIFF / WebP
   */
  public static async analyze(file: File, bytes: Uint8Array): Promise<ImageMetadataAnalysisResult> {
    const items: ImageMetadataItem[] = [];
    const chunksSummary: { name: string; offset: number; size: number; details?: string; isRemovable?: boolean }[] = [];

    const technical: ImageTechnicalInfo = {
      format: "WEBP",
      mimeType: file.type || "image/webp",
      width: 0,
      height: 0,
      fileSize: bytes.length,
      magicBytes: "52 49 46 46 (RIFF / WEBP)",
      isLosslessCleanable: true,
      cleanMethodSummary: "Filtragem física de chunks RIFF (EXIF, XMP) com ajuste de flags VP8X e sem recodificação"
    };

    if (bytes.length < 12) {
      throw new Error("Arquivo menor que o cabeçalho RIFF");
    }

    const riffSig = String.fromCharCode(...bytes.subarray(0, 4));
    const webpSig = String.fromCharCode(...bytes.subarray(8, 12));

    if (riffSig !== "RIFF" || webpSig !== "WEBP") {
      throw new Error("Arquivo não é um WebP válido (assinatura RIFF / WEBP ausente)");
    }

    chunksSummary.push({ name: "Cabeçalho RIFF / WEBP (12 bytes)", offset: 0, size: 12, isRemovable: false });

    let offset = 12;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    while (offset + 8 <= bytes.length) {
      const fourCC = String.fromCharCode(...bytes.subarray(offset, offset + 4));
      const chunkLen = view.getUint32(offset + 4, true); // Little Endian
      const chunkOffset = offset;
      const totalChunkSize = 8 + chunkLen + (chunkLen % 2 !== 0 ? 1 : 0);

      if (offset + 8 + chunkLen > bytes.length) {
        break;
      }

      const chunkData = bytes.subarray(offset + 8, offset + 8 + chunkLen);

      switch (fourCC) {
        case "VP8X": {
          // Flags: Bit 1 (Anim), Bit 2 (XMP), Bit 3 (EXIF), Bit 4 (Alpha), Bit 5 (ICC)
          const flags = chunkData[0];
          const hasIcc = (flags & 0x20) !== 0;
          const hasAlpha = (flags & 0x10) !== 0;
          const hasExif = (flags & 0x08) !== 0;
          const hasXmp = (flags & 0x04) !== 0;
          const hasAnim = (flags & 0x02) !== 0;

          // Canvas dimensions (24-bit little endian, +1)
          const canvasW = 1 + (chunkData[4] | (chunkData[5] << 8) | (chunkData[6] << 16));
          const canvasH = 1 + (chunkData[7] | (chunkData[8] << 8) | (chunkData[9] << 16));

          technical.width = canvasW;
          technical.height = canvasH;
          technical.hasAlpha = hasAlpha;

          const flagsDesc = [
            hasExif ? "EXIF" : null,
            hasXmp ? "XMP" : null,
            hasIcc ? "ICC" : null,
            hasAlpha ? "Alpha" : null,
            hasAnim ? "Animado" : null
          ].filter(Boolean).join(", ");

          chunksSummary.push({
            name: `VP8X: ${canvasW}×${canvasH} px`,
            offset: chunkOffset,
            size: totalChunkSize,
            details: `Flags: [${flagsDesc || "Básico"}]`,
            isRemovable: false
          });
          break;
        }

        case "VP8 ": {
          // Keyframe header
          if (chunkData.length >= 10) {
            // Se não foi obtido via VP8X
            if (technical.width === 0) {
              const syncCode = (chunkData[3] << 16) | (chunkData[4] << 8) | chunkData[5];
              if (syncCode === 0x9d012a) {
                const w = (chunkData[6] | (chunkData[7] << 8)) & 0x3fff;
                const h = (chunkData[8] | (chunkData[9] << 8)) & 0x3fff;
                technical.width = w;
                technical.height = h;
              }
            }
          }

          chunksSummary.push({
            name: "VP8 (Fluxo com Perdas)",
            offset: chunkOffset,
            size: totalChunkSize,
            details: `${technical.width}×${technical.height} px`,
            isRemovable: false
          });
          break;
        }

        case "VP8L": {
          // Lossless frame header: 1 byte signature 0x2F + 14-bit width + 14-bit height
          if (chunkData.length >= 5 && chunkData[0] === 0x2f) {
            if (technical.width === 0) {
              const b1 = chunkData[1];
              const b2 = chunkData[2];
              const b3 = chunkData[3];
              const b4 = chunkData[4];
              const w = 1 + (((b2 & 0x3f) << 8) | b1);
              const h = 1 + ((((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)));
              technical.width = w;
              technical.height = h;
            }
          }

          chunksSummary.push({
            name: "VP8L (Fluxo Sem Perdas)",
            offset: chunkOffset,
            size: totalChunkSize,
            details: `${technical.width}×${technical.height} px`,
            isRemovable: false
          });
          break;
        }

        case "EXIF": {
          chunksSummary.push({
            name: "EXIF (WebP EXIF Metadata Chunk)",
            offset: chunkOffset,
            size: totalChunkSize,
            details: "Bloco TIFF com coordenadas GPS e dados de câmera",
            isRemovable: true
          });

          let tiffOffset = 0;
          if (chunkData.length > 6 && String.fromCharCode(...chunkData.subarray(0, 4)) === "Exif") {
            tiffOffset = 6;
          }
          const exifResult = ExifParser.parseTiff(chunkData, tiffOffset);
          items.push(...exifResult.items);
          if (exifResult.orientation) technical.orientation = exifResult.orientation;
          break;
        }

        case "XMP ": {
          chunksSummary.push({
            name: "XMP  (WebP XMP Packet Chunk)",
            offset: chunkOffset,
            size: totalChunkSize,
            details: "Pacote RDF/XML com direitos autorais e Dublin Core",
            isRemovable: true
          });

          const xmpStr = new TextDecoder("utf-8", { fatal: false }).decode(chunkData);
          const xmpResult = XmpParser.parse(xmpStr, chunkOffset, totalChunkSize);
          items.push(...xmpResult.items);
          break;
        }

        case "ICCP": {
          technical.colorProfile = "Perfil ICC Embutido";
          chunksSummary.push({
            name: "ICCP (Perfil de Cor WebP)",
            offset: chunkOffset,
            size: totalChunkSize,
            details: "Perfil de cores preservado",
            isRemovable: false
          });

          items.push({
            id: `webp_iccp_${chunkOffset}`,
            key: "WebP_ICCP",
            label: "Perfil de Cor ICC",
            value: "Perfil de Calibração Preservado",
            source: "WebP / ICCP",
            category: "COLOR_STRUCTURE",
            offset: chunkOffset,
            offsetHex: ExifParser.toHexOffset(chunkOffset),
            size: totalChunkSize,
            isRemovable: false
          });
          break;
        }

        default: {
          const isStandard = ["ANIM", "ANMF", "ALPH"].includes(fourCC);
          chunksSummary.push({
            name: `${fourCC} (${isStandard ? "Estrutura do Container" : "Chunk Opcional"})`,
            offset: chunkOffset,
            size: totalChunkSize,
            isRemovable: !isStandard
          });

          if (!isStandard) {
            items.push({
              id: `webp_chunk_${fourCC}_${chunkOffset}`,
              key: `WebP_Chunk_${fourCC}`,
              label: `Chunk WebP Proprietário (${fourCC})`,
              value: `Bloco binário (${chunkLen} bytes)`,
              source: `WebP / ${fourCC}`,
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

  /**
   * Limpeza física de chunks WebP com ajuste das flags VP8X sem recodificar pixels
   */
  public static async clean(file: File, bytes: Uint8Array, analysis: ImageMetadataAnalysisResult): Promise<ImageCleanReport> {
    const cleanedChunks: Uint8Array[] = [];

    let offset = 12;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    while (offset + 8 <= bytes.length) {
      const fourCC = String.fromCharCode(...bytes.subarray(offset, offset + 4));
      const chunkLen = view.getUint32(offset + 4, true);
      const totalChunkSize = 8 + chunkLen + (chunkLen % 2 !== 0 ? 1 : 0);

      if (offset + totalChunkSize > bytes.length) break;

      const fullChunk = bytes.subarray(offset, offset + totalChunkSize);

      if (fourCC === "EXIF" || fourCC === "XMP ") {
        // Remover chunks de metadados
      } else if (fourCC === "VP8X") {
        // Clonar chunk VP8X e desabilitar flags de EXIF (bit 3 / 0x08) e XMP (bit 2 / 0x04)
        const modifiedVP8X = new Uint8Array(fullChunk);
        let flags = modifiedVP8X[8];
        flags = flags & ~0x08; // desabilita EXIF
        flags = flags & ~0x04; // desabilita XMP
        modifiedVP8X[8] = flags;
        cleanedChunks.push(modifiedVP8X);
      } else {
        cleanedChunks.push(fullChunk);
      }

      offset += totalChunkSize;
    }

    // Calcular tamanho total do payload limpo
    let payloadLen = 0;
    for (const c of cleanedChunks) payloadLen += c.length;

    // Criar cabeçalho RIFF com tamanho atualizado (payloadLen + 4 bytes do 'WEBP')
    const riffHeader = new Uint8Array(12);
    riffHeader[0] = 0x52; // R
    riffHeader[1] = 0x49; // I
    riffHeader[2] = 0x46; // F
    riffHeader[3] = 0x46; // F
    const totalRiffSize = payloadLen + 4;
    const headerView = new DataView(riffHeader.buffer);
    headerView.setUint32(4, totalRiffSize, true);
    riffHeader[8] = 0x57; // W
    riffHeader[9] = 0x45; // E
    riffHeader[10] = 0x42; // B
    riffHeader[11] = 0x50; // P

    const finalCleanBytes = new Uint8Array(12 + payloadLen);
    finalCleanBytes.set(riffHeader, 0);
    let curOff = 12;
    for (const c of cleanedChunks) {
      finalCleanBytes.set(c, curOff);
      curOff += c.length;
    }

    const cleanFileName = file.name.replace(/\.[^.]+$/, "") + "_limpo.webp";
    const cleanedFile = new File([finalCleanBytes], cleanFileName, { type: "image/webp" });

    // REANÁLISE FÍSICA A PARTIR DOS BYTES LIMPOS
    const analysisAfterClean = await this.analyze(cleanedFile, finalCleanBytes);

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
      cleanedSize: finalCleanBytes.length,
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
   * Grava novos metadados construindo chunks EXIF e XMP no container WebP
   */
  public static async writeMetadata(
    baseCleanFile: File,
    baseBytes: Uint8Array,
    form: ImageMetadataEditForm,
    originalFileName?: string
  ): Promise<File> {
    const newChunks: Uint8Array[] = [];

    // 1. Chunk EXIF
    const exifTiff = ExifParser.buildExifPayload({
      title: form.title,
      artist: form.artist,
      description: form.description,
      copyright: form.copyright,
      keywords: form.keywords,
      comment: form.comment,
      dateTime: form.creationDate
    });

    const exifChunkLen = exifTiff.length;
    const exifPad = exifChunkLen % 2 !== 0 ? 1 : 0;
    const exifChunk = new Uint8Array(8 + exifChunkLen + exifPad);
    exifChunk[0] = 0x45; // E
    exifChunk[1] = 0x58; // X
    exifChunk[2] = 0x49; // I
    exifChunk[3] = 0x46; // F
    const exifView = new DataView(exifChunk.buffer);
    exifView.setUint32(4, exifChunkLen, true);
    exifChunk.set(exifTiff, 8);
    newChunks.push(exifChunk);

    // 2. Chunk XMP
    const xmpBytes = XmpParser.buildXmpPacket(form);
    const xmpChunkLen = xmpBytes.length;
    const xmpPad = xmpChunkLen % 2 !== 0 ? 1 : 0;
    const xmpChunk = new Uint8Array(8 + xmpChunkLen + xmpPad);
    xmpChunk[0] = 0x58; // X
    xmpChunk[1] = 0x4d; // M
    xmpChunk[2] = 0x50; // P
    xmpChunk[3] = 0x20; // ' '
    const xmpView = new DataView(xmpChunk.buffer);
    xmpView.setUint32(4, xmpChunkLen, true);
    xmpChunk.set(xmpBytes, 8);
    newChunks.push(xmpChunk);

    // Inserir os chunks no container WebP e atualizar VP8X se existir
    const remainingChunks: Uint8Array[] = [];
    let offset = 12;
    const view = new DataView(baseBytes.buffer, baseBytes.byteOffset, baseBytes.byteLength);

    let hasVP8X = false;

    while (offset + 8 <= baseBytes.length) {
      const fourCC = String.fromCharCode(...baseBytes.subarray(offset, offset + 4));
      const chunkLen = view.getUint32(offset + 4, true);
      const totalChunkSize = 8 + chunkLen + (chunkLen % 2 !== 0 ? 1 : 0);

      if (offset + totalChunkSize > baseBytes.length) break;

      const fullChunk = baseBytes.subarray(offset, offset + totalChunkSize);

      if (fourCC === "VP8X") {
        hasVP8X = true;
        const modifiedVP8X = new Uint8Array(fullChunk);
        // Habilitar bits de EXIF (0x08) e XMP (0x04)
        modifiedVP8X[8] = modifiedVP8X[8] | 0x08 | 0x04;
        remainingChunks.push(modifiedVP8X);
      } else if (fourCC !== "EXIF" && fourCC !== "XMP ") {
        remainingChunks.push(fullChunk);
      }

      offset += totalChunkSize;
    }

    // Se não tinha VP8X, criar cabeçalho VP8X para suportar metadados
    if (!hasVP8X) {
      // Criação simplificada de chunk VP8X
      const vp8x = new Uint8Array(18);
      vp8x[0] = 0x56; // V
      vp8x[1] = 0x50; // P
      vp8x[2] = 0x38; // 8
      vp8x[3] = 0x58; // X
      const vp8xView = new DataView(vp8x.buffer);
      vp8xView.setUint32(4, 10, true);
      vp8x[8] = 0x08 | 0x04; // EXIF + XMP flags
      remainingChunks.unshift(vp8x);
    }

    // Adicionar novos chunks de metadados no final
    for (const nc of newChunks) {
      remainingChunks.push(nc);
    }

    let payloadLen = 0;
    for (const c of remainingChunks) payloadLen += c.length;

    const riffHeader = new Uint8Array(12);
    riffHeader[0] = 0x52; // R
    riffHeader[1] = 0x49; // I
    riffHeader[2] = 0x46; // F
    riffHeader[3] = 0x46; // F
    const totalRiffSize = payloadLen + 4;
    const headerView = new DataView(riffHeader.buffer);
    headerView.setUint32(4, totalRiffSize, true);
    riffHeader[8] = 0x57; // W
    riffHeader[9] = 0x45; // E
    riffHeader[10] = 0x42; // B
    riffHeader[11] = 0x50; // P

    const finalBytes = new Uint8Array(12 + payloadLen);
    finalBytes.set(riffHeader, 0);
    let curOff = 12;
    for (const c of remainingChunks) {
      finalBytes.set(c, curOff);
      curOff += c.length;
    }

    const editedFileName = sanitizeImageFilename(form.title, originalFileName || baseCleanFile.name, ".webp");
    return new File([finalBytes], editedFileName, { type: "image/webp" });
  }
}
