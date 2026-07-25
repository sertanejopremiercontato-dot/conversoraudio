import { SUPPORTED_BG_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "../../utils/backgroundRemovalSupport";

export interface ProcessedBackgroundResult {
  originalFile: File;
  originalWidth: number;
  originalHeight: number;
  cutoutBlob: Blob;
  cutoutUrl: string;
}

export class BackgroundRemovalService {
  /**
   * Process and remove background automatically from the image file.
   */
  public static async process(
    file: File,
    onProgress: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<ProcessedBackgroundResult> {
    onProgress(10);
    if (signal?.aborted) throw new Error("Processamento cancelado pelo usuário.");

    // Load original image element
    const img = await this.loadImageElement(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    onProgress(30);
    if (signal?.aborted) throw new Error("Processamento cancelado pelo usuário.");

    // Create full canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    onProgress(50);
    if (signal?.aborted) throw new Error("Processamento cancelado pelo usuário.");

    // Sample background colors along outer perimeter & corners
    const bgSeeds: Array<[number, number, number]> = [];
    const samplePoints = [
      [2, 2],
      [width - 3, 2],
      [2, height - 3],
      [width - 3, height - 3],
      [Math.floor(width / 2), 2],
      [Math.floor(width / 2), height - 3],
      [2, Math.floor(height / 2)],
      [width - 3, Math.floor(height / 2)]
    ];

    for (const [sx, sy] of samplePoints) {
      if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
        const idx = (sy * width + sx) * 4;
        bgSeeds.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    }

    // Perceptual color distance helper
    const calcDist = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
      const rmean = (r1 + r2) / 2;
      const dr = r1 - r2;
      const dg = g1 - g2;
      const db = b1 - b2;
      return Math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db);
    };

    // BFS Flood fill starting from all outer border pixels
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height * 2);
    let head = 0;
    let tail = 0;

    const tolerance = 52; // Color distance tolerance threshold
    const softness = 18;  // Soft edge transition zone

    // Add top & bottom border pixels to flood fill queue
    for (let x = 0; x < width; x++) {
      queue[tail++] = x;
      queue[tail++] = 0;
      visited[0 * width + x] = 1;

      queue[tail++] = x;
      queue[tail++] = height - 1;
      visited[(height - 1) * width + x] = 1;
    }

    // Add left & right border pixels
    for (let y = 1; y < height - 1; y++) {
      queue[tail++] = 0;
      queue[tail++] = y;
      visited[y * width + 0] = 1;

      queue[tail++] = width - 1;
      queue[tail++] = y;
      visited[y * width + (width - 1)] = 1;
    }

    onProgress(70);
    if (signal?.aborted) throw new Error("Processamento cancelado pelo usuário.");

    while (head < tail) {
      const cx = queue[head++];
      const cy = queue[head++];
      const idx = (cy * width + cx) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      let minDist = Infinity;
      for (let i = 0; i < bgSeeds.length; i++) {
        const d = calcDist(r, g, b, bgSeeds[i][0], bgSeeds[i][1], bgSeeds[i][2]);
        if (d < minDist) minDist = d;
      }

      if (minDist <= tolerance + softness) {
        let alpha = 0;
        if (minDist > tolerance) {
          const factor = (minDist - tolerance) / softness;
          alpha = Math.round(255 * factor);
        }
        data[idx + 3] = alpha;

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ];

        for (let i = 0; i < 4; i++) {
          const nx = neighbors[i][0];
          const ny = neighbors[i][1];
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nPIdx = ny * width + nx;
            if (!visited[nPIdx]) {
              visited[nPIdx] = 1;
              const nIdx = nPIdx * 4;
              let nMinDist = Infinity;
              for (let j = 0; j < bgSeeds.length; j++) {
                const d = calcDist(data[nIdx], data[nIdx + 1], data[nIdx + 2], bgSeeds[j][0], bgSeeds[j][1], bgSeeds[j][2]);
                if (d < nMinDist) nMinDist = d;
              }
              if (nMinDist <= tolerance + softness) {
                queue[tail++] = nx;
                queue[tail++] = ny;
              }
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    onProgress(90);
    if (signal?.aborted) throw new Error("Processamento cancelado pelo usuário.");

    // Export as transparent PNG Blob
    const cutoutBlob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b || new Blob()), "image/png")
    );
    const cutoutUrl = URL.createObjectURL(cutoutBlob);

    onProgress(100);

    return {
      originalFile: file,
      originalWidth: width,
      originalHeight: height,
      cutoutBlob,
      cutoutUrl
    };
  }

  public static loadImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Falha ao carregar a imagem original."));
      };
      img.src = url;
    });
  }
}
