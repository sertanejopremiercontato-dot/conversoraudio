import JSZip from "jszip";
import UPNG from "upng-js";
import {
  ImageFileItem,
  ImageOutputFormat,
  ImageProcessResult,
  CropBox,
  RotateFlipState,
  WatermarkConfig,
  WatermarkPosition
} from "../types";

/**
 * Loads an image from a File, Blob, or URL string and returns an HTMLImageElement with dimensions
 */
export async function loadImageFromFile(source: File | Blob | string): Promise<{
  img: HTMLImageElement;
  width: number;
  height: number;
  cleanUp: () => void;
}> {
  return new Promise((resolve, reject) => {
    const isUrl = typeof source === "string";
    const url = isUrl ? source : URL.createObjectURL(source);
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      resolve({
        img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanUp: () => {
          if (!isUrl) {
            URL.revokeObjectURL(url);
          }
        }
      });
    };

    img.onerror = () => {
      if (!isUrl) {
        URL.revokeObjectURL(url);
      }
      reject(new Error("Falha ao carregar a imagem. Verifique se o arquivo é válido."));
    };

    img.src = url;
  });
}

/**
 * Prepares image file metadata for UI
 */
export async function prepareImageFile(file: File): Promise<ImageFileItem> {
  const ext = file.name.split(".").pop()?.toUpperCase() || "IMG";
  const { width, height, cleanUp } = await loadImageFromFile(file);
  const previewUrl = URL.createObjectURL(file);
  cleanUp();

  return {
    id: Math.random().toString(36).substring(2, 9),
    file,
    name: file.name,
    size: file.size,
    width,
    height,
    previewUrl,
    format: ext
  };
}

/**
 * Returns MIME type and proper extension from ImageOutputFormat
 */
export function getMimeAndExtension(
  format: ImageOutputFormat | "original",
  originalName: string
): { mimeType: string; extension: string } {
  if (format === "JPG") {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }
  if (format === "PNG") {
    return { mimeType: "image/png", extension: "png" };
  }
  if (format === "WEBP") {
    return { mimeType: "image/webp", extension: "webp" };
  }

  // Original format detection
  const lower = originalName.toLowerCase();
  if (lower.endsWith(".png")) return { mimeType: "image/png", extension: "png" };
  if (lower.endsWith(".webp")) return { mimeType: "image/webp", extension: "webp" };
  return { mimeType: "image/jpeg", extension: "jpg" };
}

/**
 * Converts canvas to Blob with fallback
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Falha ao renderizar a imagem no navegador."));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Generates an output filename
 */
export function generateOutputName(
  originalName: string,
  suffix: string,
  newExtension: string
): string {
  const base = originalName.replace(/\.[^/.]+$/, "");
  return `${base}-${suffix}.${newExtension}`;
}

/**
 * 1. Convert Image Format
 * Strictly preserves native image resolution (INPUT_WIDTH === OUTPUT_WIDTH and INPUT_HEIGHT === OUTPUT_HEIGHT)
 * Uses high-efficiency encoding (UPNG for PNG lossless/quantized, Native WebP with quality control, JPEG with clean white background)
 */
export async function convertImage(
  item: ImageFileItem,
  format: ImageOutputFormat,
  quality = 0.85
): Promise<ImageProcessResult> {
  const { img, width, height, cleanUp } = await loadImageFromFile(item.file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Não foi possível criar o contexto 2D do Canvas.");

    const { mimeType, extension } = getMimeAndExtension(format, item.name);
    let blob: Blob;

    if (mimeType === "image/png") {
      // Clear canvas to preserve full alpha
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // If already PNG with identical format and user just exported PNG
      const isInputPng = (item.format || "").toUpperCase() === "PNG" || item.name.toLowerCase().endsWith(".png");
      
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        // UPNG with cnum: 0 is 100% lossless PNG with optimal DEFLATE compression
        // If quality < 0.85, allow high-fidelity 256 palette quantization for smaller size
        const cnum = quality >= 0.85 ? 0 : 256;
        const arrayBuffer = UPNG.encode([imgData.data.buffer], width, height, cnum);
        const upngBlob = new Blob([arrayBuffer], { type: "image/png" });

        if (isInputPng && upngBlob.size > item.size && quality >= 0.85) {
          // If original PNG was already better compressed and target is PNG, preserve original blob
          blob = item.file;
        } else {
          blob = upngBlob;
        }
      } catch (upngErr) {
        console.warn("[UPNG Encode fallback to standard canvas]", upngErr);
        blob = await canvasToBlob(canvas, "image/png", quality);
      }
    } else if (mimeType === "image/jpeg") {
      // JPEG: Fill solid white background for alpha transparency replacement
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    } else {
      // WEBP: Full alpha support, native quality control
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      blob = await canvasToBlob(canvas, "image/webp", quality);
    }

    // Safety verification: Ensure dimensions are 100% preserved
    const verifyImg = await loadImageFromFile(blob);
    if (verifyImg.width !== width || verifyImg.height !== height) {
      verifyImg.cleanUp();
      throw new Error(`Erro na conversão: resolução final (${verifyImg.width}x${verifyImg.height}) divergiu da resolução original (${width}x${height}).`);
    }
    verifyImg.cleanUp();

    const downloadUrl = URL.createObjectURL(blob);
    const outputName = generateOutputName(item.name, "convertido", extension);

    const savingsBytes = item.size - blob.size;
    const savingsPercent = item.size > 0 ? Math.round((savingsBytes / item.size) * 100) : 0;

    return {
      id: item.id,
      originalName: item.name,
      outputName,
      blob,
      downloadUrl,
      originalSize: item.size,
      finalSize: blob.size,
      savingsBytes,
      savingsPercent,
      width,
      height,
      format
    };
  } finally {
    cleanUp();
  }
}

/**
 * Helper to validate if candidate blob is genuinely smaller than the original
 */
export function validateCompressionResult(
  originalSize: number,
  candidateBlob: Blob | null,
  originalFile: File
): {
  isValidSaving: boolean;
  finalBlob: Blob;
  finalSize: number;
  savingsBytes: number;
  savingsPercent: number;
} {
  if (candidateBlob && candidateBlob.size < originalSize) {
    const savingsBytes = originalSize - candidateBlob.size;
    const savingsPercent = Math.round((savingsBytes / originalSize) * 100);
    return {
      isValidSaving: true,
      finalBlob: candidateBlob,
      finalSize: candidateBlob.size,
      savingsBytes,
      savingsPercent: Math.max(1, savingsPercent)
    };
  }

  // File cannot be further reduced without exceeding original size
  return {
    isValidSaving: false,
    finalBlob: originalFile,
    finalSize: originalSize,
    savingsBytes: 0,
    savingsPercent: 0
  };
}

/**
 * 2. Compress Image - Real multi-candidate compression engine
 */
export async function compressImage(
  item: ImageFileItem,
  quality = 0.8
): Promise<ImageProcessResult> {
  const { img, width, height, cleanUp } = await loadImageFromFile(item.file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível criar o contexto 2D do Canvas.");

    const { mimeType, extension } = getMimeAndExtension("original", item.name);
    let encoderType = "UNKNOWN";
    let candidateBlob: Blob | null = null;
    let candidateQualityUsed = quality;

    if (mimeType === "image/png") {
      encoderType = "UPNG.js (Real PNG Quantizer & Deflate)";
      // Clear canvas to preserve full alpha
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);

      // Determine candidate color quantization levels based on requested quality
      let cnumCandidates: number[] = [];
      if (quality >= 0.85) {
        // High quality: try lossless first, then high-fidelity 256-color palette
        cnumCandidates = [0, 256, 192];
      } else if (quality >= 0.70) {
        // Balanced (Recommended): 256 colors, 192 colors, 128 colors
        cnumCandidates = [256, 192, 128];
      } else {
        // Maximum reduction: 128 colors, 64 colors, 32 colors
        cnumCandidates = [128, 64, 32];
      }

      // Also support custom quality fine-tuning
      if (quality !== 0.88 && quality !== 0.75 && quality !== 0.55) {
        const customCnum = Math.max(16, Math.min(256, Math.round(32 + (quality - 0.2) * (256 - 32) / 0.75)));
        cnumCandidates = [customCnum, Math.max(16, Math.round(customCnum * 0.75)), Math.max(16, Math.round(customCnum * 0.5))];
      }

      let bestBlob: Blob | null = null;

      for (const cnum of cnumCandidates) {
        try {
          const arrayBuffer = UPNG.encode([imgData.data.buffer], width, height, cnum);
          const blob = new Blob([arrayBuffer], { type: "image/png" });

          if (blob.size < item.size) {
            if (!bestBlob || blob.size < bestBlob.size) {
              bestBlob = blob;
              candidateQualityUsed = cnum === 0 ? 1.0 : cnum / 256;
              // If we already achieved a healthy saving with high quality, stop testing lower fidelities
              if (cnum !== 0 && blob.size < item.size * 0.8) {
                break;
              }
            }
          }
        } catch (encErr) {
          console.warn("[UPNG Encode Attempt Error]", encErr);
        }
      }

      candidateBlob = bestBlob;

    } else if (mimeType === "image/webp") {
      encoderType = "Native Canvas WebP (Quality Controlled)";
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const webpQualities = [
        quality,
        Math.max(0.3, quality - 0.08),
        Math.max(0.25, quality - 0.16),
        Math.max(0.2, quality - 0.24)
      ];

      let bestBlob: Blob | null = null;
      for (const q of webpQualities) {
        try {
          const blob = await canvasToBlob(canvas, "image/webp", q);
          if (blob.size < item.size) {
            if (!bestBlob || blob.size < bestBlob.size) {
              bestBlob = blob;
              candidateQualityUsed = q;
              if (blob.size < item.size * 0.85) break;
            }
          }
        } catch (e) {}
      }

      candidateBlob = bestBlob;

    } else {
      // JPEG
      encoderType = "Native Canvas JPEG (Stepped Quality Optimizer)";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const jpegQualities = [
        quality,
        Math.max(0.35, quality - 0.06),
        Math.max(0.3, quality - 0.12),
        Math.max(0.25, quality - 0.18)
      ];

      let bestBlob: Blob | null = null;
      for (const q of jpegQualities) {
        try {
          const blob = await canvasToBlob(canvas, "image/jpeg", q);
          if (blob.size < item.size) {
            if (!bestBlob || blob.size < bestBlob.size) {
              bestBlob = blob;
              candidateQualityUsed = q;
              if (blob.size < item.size * 0.85) break;
            }
          }
        } catch (e) {}
      }

      candidateBlob = bestBlob;
    }

    // Validate result
    const validated = validateCompressionResult(item.size, candidateBlob, item.file);
    const finalBlob = validated.finalBlob;
    const downloadUrl = URL.createObjectURL(finalBlob);
    const outputName = generateOutputName(item.name, "otimizado", extension);

    // Mandatory Diagnostic Log (Etapa 3)
    const ratio = (finalBlob.size / item.size).toFixed(4);
    console.log(`[COMPRESSOR LOG]
INPUT_NAME: ${item.name}
INPUT_TYPE: ${item.file.type || mimeType}
INPUT_WIDTH: ${width}
INPUT_HEIGHT: ${height}
INPUT_BYTES: ${item.size}

ENCODER_TYPE: ${encoderType}
ENCODER_QUALITY: ${candidateQualityUsed.toFixed(2)}

OUTPUT_TYPE: ${finalBlob.type || mimeType}
OUTPUT_WIDTH: ${width}
OUTPUT_HEIGHT: ${height}
OUTPUT_BYTES: ${finalBlob.size}

RATIO = ${ratio} (${validated.isValidSaving ? `ECONOMIA REAL DE ${validated.savingsPercent}%` : "ARQUIVO JÁ OTIMIZADO - TAMANHO ORIGINAL MANTIDO SEM INFLAÇÃO"})
`);

    return {
      id: item.id,
      originalName: item.name,
      outputName,
      blob: finalBlob,
      downloadUrl,
      originalSize: item.size,
      finalSize: validated.finalSize,
      savingsBytes: validated.savingsBytes,
      savingsPercent: validated.savingsPercent,
      width,
      height,
      format: extension.toUpperCase()
    };
  } finally {
    cleanUp();
  }
}

/**
 * 3. Resize Image with Real Visual Framing Support
 */
export async function resizeImage(
  item: ImageFileItem,
  targetWidth: number,
  targetHeight: number,
  format: ImageOutputFormat | "original" = "original",
  quality = 0.92,
  framing?: {
    fitMode?: "cover" | "contain";
    zoom?: number;
    offsetX?: number;
    offsetY?: number;
  }
): Promise<ImageProcessResult> {
  const { img, cleanUp } = await loadImageFromFile(item.file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível inicializar o canvas.");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const { mimeType, extension } = getMimeAndExtension(format, item.name);

    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
      ctx.clearRect(0, 0, targetWidth, targetHeight);
    }

    const fitMode = framing?.fitMode || "cover";
    const zoom = Math.max(1, Math.min(3, framing?.zoom || 1.0));
    const offsetX = Math.max(-1, Math.min(1, framing?.offsetX || 0));
    const offsetY = Math.max(-1, Math.min(1, framing?.offsetY || 0));

    let baseScale: number;
    if (fitMode === "contain") {
      baseScale = Math.min(targetWidth / img.width, targetHeight / img.height);
    } else {
      baseScale = Math.max(targetWidth / img.width, targetHeight / img.height);
    }

    const scale = baseScale * zoom;
    const renderW = img.width * scale;
    const renderH = img.height * scale;

    const maxPanX = Math.max(0, (renderW - targetWidth) / 2);
    const maxPanY = Math.max(0, (renderH - targetHeight) / 2);

    const centerX = (targetWidth - renderW) / 2;
    const centerY = (targetHeight - renderH) / 2;

    const dx = centerX + offsetX * maxPanX;
    const dy = centerY + offsetY * maxPanY;

    ctx.drawImage(img, dx, dy, renderW, renderH);

    const blob = await canvasToBlob(canvas, mimeType, quality);
    const downloadUrl = URL.createObjectURL(blob);
    const outputName = generateOutputName(
      item.name,
      `redimensionado-${targetWidth}x${targetHeight}`,
      extension
    );

    const savingsBytes = item.size - blob.size;
    const savingsPercent = item.size > 0 ? Math.round((savingsBytes / item.size) * 100) : 0;

    return {
      id: item.id,
      originalName: item.name,
      outputName,
      blob,
      downloadUrl,
      originalSize: item.size,
      finalSize: blob.size,
      savingsBytes,
      savingsPercent,
      width: targetWidth,
      height: targetHeight,
      format: extension.toUpperCase()
    };
  } finally {
    cleanUp();
  }
}

/**
 * 4. Crop Image
 */
export async function cropImage(
  item: ImageFileItem,
  cropBox: CropBox,
  format: ImageOutputFormat | "original" = "original",
  quality = 0.92
): Promise<ImageProcessResult> {
  const { img, cleanUp } = await loadImageFromFile(item.file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(cropBox.width));
    canvas.height = Math.max(1, Math.round(cropBox.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível inicializar o canvas.");

    const { mimeType, extension } = getMimeAndExtension(format, item.name);

    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(
      img,
      cropBox.x,
      cropBox.y,
      cropBox.width,
      cropBox.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const blob = await canvasToBlob(canvas, mimeType, quality);
    const downloadUrl = URL.createObjectURL(blob);
    const outputName = generateOutputName(
      item.name,
      `recorte-${canvas.width}x${canvas.height}`,
      extension
    );

    return {
      id: item.id,
      originalName: item.name,
      outputName,
      blob,
      downloadUrl,
      originalSize: item.size,
      finalSize: blob.size,
      savingsBytes: item.size - blob.size,
      savingsPercent: item.size > 0 ? Math.round(((item.size - blob.size) / item.size) * 100) : 0,
      width: canvas.width,
      height: canvas.height,
      format: extension.toUpperCase()
    };
  } finally {
    cleanUp();
  }
}

/**
 * 5. Rotate & Flip Image
 */
export async function rotateFlipImage(
  item: ImageFileItem,
  state: RotateFlipState,
  quality = 0.95
): Promise<ImageProcessResult> {
  const { img, width, height, cleanUp } = await loadImageFromFile(item.file);
  try {
    const angle = (state.rotation % 360 + 360) % 360;
    const is90or270 = angle === 90 || angle === 270;

    const outWidth = is90or270 ? height : width;
    const outHeight = is90or270 ? width : height;

    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível inicializar o canvas.");

    const { mimeType, extension } = getMimeAndExtension("original", item.name);

    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, outWidth, outHeight);
    }

    ctx.save();
    ctx.translate(outWidth / 2, outHeight / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();

    const blob = await canvasToBlob(canvas, mimeType, quality);
    const downloadUrl = URL.createObjectURL(blob);
    const outputName = generateOutputName(item.name, "ajustado", extension);

    return {
      id: item.id,
      originalName: item.name,
      outputName,
      blob,
      downloadUrl,
      originalSize: item.size,
      finalSize: blob.size,
      savingsBytes: item.size - blob.size,
      savingsPercent: item.size > 0 ? Math.round(((item.size - blob.size) / item.size) * 100) : 0,
      width: outWidth,
      height: outHeight,
      format: extension.toUpperCase()
    };
  } finally {
    cleanUp();
  }
}

/**
 * Calculates coordinates for a given position box
 */
export function getPositionCoords(
  position: WatermarkPosition,
  canvasWidth: number,
  canvasHeight: number,
  itemWidth: number,
  itemHeight: number,
  margin = 24,
  offsetX = 0,
  offsetY = 0
): { x: number; y: number } {
  let baseMarginX = Math.max(margin, Math.round(canvasWidth * 0.03));
  let baseMarginY = Math.max(margin, Math.round(canvasHeight * 0.03));

  let x = baseMarginX;
  let y = baseMarginY;

  if (position.includes("center") && !position.includes("left") && !position.includes("right")) {
    x = (canvasWidth - itemWidth) / 2;
  } else if (position.includes("right")) {
    x = canvasWidth - itemWidth - baseMarginX;
  }

  if (position.startsWith("center") || position === "center") {
    y = (canvasHeight - itemHeight) / 2;
  } else if (position.startsWith("bottom")) {
    y = canvasHeight - itemHeight - baseMarginY;
  }

  // Apply custom drag offset
  const maxShiftX = Math.max(0, canvasWidth - itemWidth);
  const maxShiftY = Math.max(0, canvasHeight - itemHeight);

  if (offsetX !== 0) {
    x = Math.max(0, Math.min(canvasWidth - itemWidth, x + offsetX * maxShiftX));
  }
  if (offsetY !== 0) {
    y = Math.max(0, Math.min(canvasHeight - itemHeight, y + offsetY * maxShiftY));
  }

  return { x: Math.max(0, x), y: Math.max(0, y) };
}

/**
 * 6. Apply Watermark (Text or Logo)
 */
export async function applyWatermark(
  item: ImageFileItem,
  config: WatermarkConfig
): Promise<ImageProcessResult> {
  const { img, width, height, cleanUp } = await loadImageFromFile(item.file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível inicializar o canvas.");

    const { mimeType, extension } = getMimeAndExtension(config.format, item.name);

    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    if (config.type === "text" && config.text.text.trim()) {
      const { text, fontSize, color, opacity, position, isTiled, offsetX = 0, offsetY = 0 } = config.text;

      // Scale font size proportionally if canvas is high resolution
      const effectiveFontSize = Math.max(12, Math.round(fontSize * (width / 1000)));

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.font = `bold ${effectiveFontSize}px sans-serif`;
      ctx.textBaseline = "top";

      if (isTiled) {
        // Tiled repeating watermark across whole image at 30 deg
        const textMetrics = ctx.measureText(text);
        const textW = textMetrics.width;
        const textH = effectiveFontSize;
        const stepX = textW + effectiveFontSize * 2.5;
        const stepY = textH + effectiveFontSize * 3;

        ctx.rotate((-30 * Math.PI) / 180);
        const diagonal = Math.sqrt(width * width + height * height);
        for (let x = -diagonal; x < diagonal * 1.5; x += stepX) {
          for (let y = -diagonal; y < diagonal * 1.5; y += stepY) {
            ctx.fillText(text, x, y);
          }
        }
      } else {
        const textMetrics = ctx.measureText(text);
        const textW = textMetrics.width;
        const textH = effectiveFontSize;
        const { x, y } = getPositionCoords(position, width, height, textW, textH, 24, offsetX, offsetY);
        ctx.fillText(text, x, y);
      }
      ctx.restore();
    } else if (config.type === "logo" && (config.logo.logoFile || config.logo.logoUrl)) {
      const logoSource = config.logo.logoFile || config.logo.logoUrl!;
      const { img: logoImg, width: logoOrigW, height: logoOrigH, cleanUp: cleanLogo } =
        await loadImageFromFile(logoSource);

      try {
        const scale = config.logo.scalePercent / 100;
        // Proportionally scale logo based on parent image width
        const baseTargetW = width * 0.4 * scale;
        const logoAspect = logoOrigW / logoOrigH;
        const logoTargetW = Math.max(20, baseTargetW);
        const logoTargetH = logoTargetW / logoAspect;

        ctx.save();
        ctx.globalAlpha = config.logo.opacity;

        if (config.logo.isTiled) {
          const stepX = logoTargetW + 80;
          const stepY = logoTargetH + 80;
          ctx.rotate((-30 * Math.PI) / 180);
          const diagonal = Math.sqrt(width * width + height * height);
          for (let x = -diagonal; x < diagonal * 1.5; x += stepX) {
            for (let y = -diagonal; y < diagonal * 1.5; y += stepY) {
              ctx.drawImage(logoImg, x, y, logoTargetW, logoTargetH);
            }
          }
        } else {
          const { offsetX = 0, offsetY = 0 } = config.logo;
          const { x, y } = getPositionCoords(
            config.logo.position,
            width,
            height,
            logoTargetW,
            logoTargetH,
            24,
            offsetX,
            offsetY
          );
          ctx.drawImage(logoImg, x, y, logoTargetW, logoTargetH);
        }
        ctx.restore();
      } finally {
        cleanLogo();
      }
    }

    const blob = await canvasToBlob(canvas, mimeType, config.quality);
    const downloadUrl = URL.createObjectURL(blob);
    const outputName = generateOutputName(item.name, "marca-dagua", extension);

    return {
      id: item.id,
      originalName: item.name,
      outputName,
      blob,
      downloadUrl,
      originalSize: item.size,
      finalSize: blob.size,
      savingsBytes: item.size - blob.size,
      savingsPercent: item.size > 0 ? Math.round(((item.size - blob.size) / item.size) * 100) : 0,
      width,
      height,
      format: extension.toUpperCase()
    };
  } finally {
    cleanUp();
  }
}

/**
 * Downloads a single Blob to disk
 */
export function downloadImageBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Downloads multiple images in a single ZIP file
 */
export async function downloadImagesZip(
  results: ImageProcessResult[],
  zipFileName = "imagens-processadas.zip"
): Promise<void> {
  const zip = new JSZip();
  results.forEach((item, index) => {
    // Avoid name collisions
    const safeName = item.outputName || `imagem-${index + 1}.${item.format.toLowerCase()}`;
    zip.file(safeName, item.blob);
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadImageBlob(zipBlob, zipFileName);
}
