export type ImageSubTool =
  | "hub"
  | "converter"
  | "compress"
  | "resize"
  | "crop"
  | "rotate"
  | "watermark"
  | "metadata";

export type ImageOutputFormat = "JPG" | "PNG" | "WEBP";

export interface ImageFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  previewUrl: string;
  format: string;
}

export interface ImageProcessResult {
  id: string;
  originalName: string;
  outputName: string;
  blob: Blob;
  downloadUrl: string;
  originalSize: number;
  finalSize: number;
  savingsBytes: number;
  savingsPercent: number;
  width: number;
  height: number;
  format: string;
}

export interface ResizeConfig {
  mode: "pixels" | "percentage" | "presets";
  width: number;
  height: number;
  keepAspectRatio: boolean;
  percentage: number;
  format: ImageOutputFormat | "original";
  quality: number;
}

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatioOption = "free" | "1:1" | "16:9" | "4:3" | "9:16" | "3:2";

export interface RotateFlipState {
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
}

export type WatermarkType = "text" | "logo";

export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface TextWatermarkConfig {
  text: string;
  fontSize: number;
  color: string;
  opacity: number; // 0.1 to 1.0
  position: WatermarkPosition;
  isTiled: boolean;
  offsetX?: number; // relative custom offset from -1.0 to 1.0 or pixel offset
  offsetY?: number;
}

export interface LogoWatermarkConfig {
  logoFile?: File;
  logoUrl?: string;
  logoWidth: number;
  logoHeight: number;
  scalePercent: number; // 5 to 100
  opacity: number; // 0.1 to 1.0
  position: WatermarkPosition;
  isTiled?: boolean;
  offsetX?: number;
  offsetY?: number;
}

export interface WatermarkConfig {
  type: WatermarkType;
  text: TextWatermarkConfig;
  logo: LogoWatermarkConfig;
  format: ImageOutputFormat | "original";
  quality: number;
}
