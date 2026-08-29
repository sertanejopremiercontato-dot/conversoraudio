/**
 * Presets and adaptive helpers for Extreme & Smart Image Compression
 */

export type CompressionPreset = "extrema" | "maxima" | "alta" | "media" | "lossless" | "personalizada";

export interface CompressionLevelConfig {
  id: CompressionPreset;
  label: string;
  badge?: string;
  description: string;
  targetSSIM: number;
  webpQualityCandidates: number[];
  jpgQualityCandidates: number[];
  pngCnumCandidates: number[];
}

export const COMPRESSION_PRESETS: Record<CompressionPreset, CompressionLevelConfig> = {
  extrema: {
    id: "extrema",
    label: "Compressão Extrema",
    badge: "Máxima Redução",
    description: "Reduz o arquivo ao menor peso possível (75% a 90% de economia) mantendo alta fidelidade visual.",
    targetSSIM: 0.93,
    webpQualityCandidates: [0.82, 0.78, 0.74, 0.70, 0.65, 0.60, 0.55],
    jpgQualityCandidates: [0.82, 0.78, 0.74, 0.70, 0.65],
    pngCnumCandidates: [192, 128, 96, 64]
  },
  maxima: {
    id: "maxima",
    label: "Qualidade Máxima",
    badge: "Recomendado",
    description: "Compressão inteligente praticamente indistinguível ao olho humano. Mantém nitidez impecável.",
    targetSSIM: 0.975,
    webpQualityCandidates: [0.90, 0.86, 0.82, 0.80],
    jpgQualityCandidates: [0.90, 0.86, 0.82],
    pngCnumCandidates: [0, 256, 192]
  },
  alta: {
    id: "alta",
    label: "Alta Fidelidade",
    description: "Excelente redução com nitidez cristalina em todos os detalhes finos.",
    targetSSIM: 0.96,
    webpQualityCandidates: [0.84, 0.80, 0.76],
    jpgQualityCandidates: [0.84, 0.80, 0.76],
    pngCnumCandidates: [256, 192, 160]
  },
  media: {
    id: "media",
    label: "Equilibrado",
    description: "Forte redução de peso, ideal para sites ágeis, mídias sociais e e-commerce.",
    targetSSIM: 0.94,
    webpQualityCandidates: [0.75, 0.70, 0.65],
    jpgQualityCandidates: [0.75, 0.70, 0.65],
    pngCnumCandidates: [192, 128, 96]
  },
  lossless: {
    id: "lossless",
    label: "Sem Perda (100% Lossless)",
    description: "Preserva cada pixel idêntico ao original. Otimiza buffers e remove metadados brutos.",
    targetSSIM: 0.999,
    webpQualityCandidates: [1.0, 0.98],
    jpgQualityCandidates: [0.98, 0.95],
    pngCnumCandidates: [0]
  },
  personalizada: {
    id: "personalizada",
    label: "Qualidade Personalizada",
    description: "Controle manual da porcentagem de qualidade (10% a 100%).",
    targetSSIM: 0.90,
    webpQualityCandidates: [0.80],
    jpgQualityCandidates: [0.80],
    pngCnumCandidates: [192]
  }
};

export function getQualityCandidatesForPreset(
  preset: CompressionPreset,
  customPercentage: number,
  format: string
): number[] {
  if (preset === "personalizada") {
    const q = Math.max(0.1, Math.min(1.0, customPercentage / 100));
    return [q, Math.max(0.1, q - 0.05), Math.max(0.1, q - 0.10)];
  }

  const fmt = format.toLowerCase();
  const config = COMPRESSION_PRESETS[preset] || COMPRESSION_PRESETS.extrema;

  if (fmt === "webp") return config.webpQualityCandidates;
  if (fmt === "png") return config.pngCnumCandidates;
  return config.jpgQualityCandidates;
}
