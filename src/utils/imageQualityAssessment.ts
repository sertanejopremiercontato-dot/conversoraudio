/**
 * Visual Quality Assessment Engine (SSIM, MSE, PSNR and Alpha Channel Analysis)
 */

export interface VisualQualityResult {
  ssim: number; // 0 to 1.0
  psnr: number; // dB (typically 30 to 60+)
  mse: number;
  qualityPercentage: number; // 0 to 100%
  qualityLabel: "Idêntica (100%)" | "Excelente (Indistinguível)" | "Muito Alta" | "Boa" | "Moderada";
}

/**
 * Checks if an ImageData contains genuine translucent or transparent pixels
 */
export function detectAlphaTransparency(imageData: ImageData): boolean {
  const data = imageData.data;
  const len = data.length;
  // Sample every 4th pixel for high speed detection
  for (let i = 3; i < len; i += 16) {
    if (data[i] < 250) {
      return true;
    }
  }
  return false;
}

/**
 * Computes Structural Similarity Index (SSIM) between two ImageData objects
 * with identical dimensions (width x height).
 */
export function computeSSIM(
  data1: Uint8ClampedArray | Uint8Array,
  data2: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): VisualQualityResult {
  if (data1.length !== data2.length || width <= 0 || height <= 0) {
    return {
      ssim: 1.0,
      psnr: 100,
      mse: 0,
      qualityPercentage: 100,
      qualityLabel: "Idêntica (100%)"
    };
  }

  const C1 = 6.5025; // (0.01 * 255)^2
  const C2 = 58.5225; // (0.03 * 255)^2
  const block = 16;
  let totalSSIM = 0;
  let blockCount = 0;
  let totalSquaredError = 0;
  const totalPixels = width * height;

  const getLuma = (data: Uint8ClampedArray | Uint8Array, idx: number) =>
    0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

  // Block-wise SSIM
  for (let y = 0; y <= height - block; y += block) {
    for (let x = 0; x <= width - block; x += block) {
      let sum1 = 0;
      let sum2 = 0;
      let sumSq1 = 0;
      let sumSq2 = 0;
      let sumCross = 0;
      const N = block * block;

      for (let by = 0; by < block; by++) {
        const rowOffset = (y + by) * width;
        for (let bx = 0; bx < block; bx++) {
          const idx = (rowOffset + (x + bx)) * 4;
          const l1 = getLuma(data1, idx);
          const l2 = getLuma(data2, idx);

          sum1 += l1;
          sum2 += l2;
          sumSq1 += l1 * l1;
          sumSq2 += l2 * l2;
          sumCross += l1 * l2;

          const diffR = data1[idx] - data2[idx];
          const diffG = data1[idx + 1] - data2[idx + 1];
          const diffB = data1[idx + 2] - data2[idx + 2];
          totalSquaredError += (diffR * diffR + diffG * diffG + diffB * diffB) / 3;
        }
      }

      const mu1 = sum1 / N;
      const mu2 = sum2 / N;
      const sigma1Sq = Math.max(0, sumSq1 / N - mu1 * mu1);
      const sigma2Sq = Math.max(0, sumSq2 / N - mu2 * mu2);
      const sigma12 = sumCross / N - mu1 * mu2;

      const num = (2 * mu1 * mu2 + C1) * (2 * sigma12 + C2);
      const den = (mu1 * mu1 + mu2 * mu2 + C1) * (sigma1Sq + sigma2Sq + C2);
      const blockSSIM = den > 0 ? num / den : 1.0;

      totalSSIM += Math.max(0, Math.min(1.0, blockSSIM));
      blockCount++;
    }
  }

  const ssim = blockCount > 0 ? Math.max(0, Math.min(1.0, totalSSIM / blockCount)) : 1.0;
  const mse = totalSquaredError / (blockCount * block * block || totalPixels);
  const psnr = mse > 0 ? Math.min(100, 10 * Math.log10((255 * 255) / mse)) : 100;

  const qualityPercentage = Math.round(ssim * 1000) / 10;

  let qualityLabel: VisualQualityResult["qualityLabel"] = "Boa";
  if (ssim >= 0.999) {
    qualityLabel = "Idêntica (100%)";
  } else if (ssim >= 0.98) {
    qualityLabel = "Excelente (Indistinguível)";
  } else if (ssim >= 0.94) {
    qualityLabel = "Muito Alta";
  } else if (ssim >= 0.88) {
    qualityLabel = "Boa";
  } else {
    qualityLabel = "Moderada";
  }

  return {
    ssim,
    psnr,
    mse,
    qualityPercentage,
    qualityLabel
  };
}
