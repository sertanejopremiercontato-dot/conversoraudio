/**
 * Conversor Audio V2 - Audio Tool Types
 */

export type AudioOutputFormatV2 = "mp3" | "wav" | "aac" | "flac" | "ogg";

export type Mp3BitrateV2 = 64 | 96 | 112 | 128 | 160 | 192 | 256 | 320;

export type WavSampleRateV2 = "original" | "44100" | "48000" | "96000";

export type WavBitDepthV2 = 16 | 24 | 32;

export type WavChannelsV2 = "original" | "mono" | "stereo";

export type AacBitrateV2 = 96 | 112 | 128 | 160 | 192 | 256 | 320;

export type FlacSampleRateV2 = "original" | "44100" | "48000" | "96000";

export type FlacBitDepthV2 = "original" | 16 | 24;

export type OggBitrateV2 = 64 | 96 | 112 | 128 | 160 | 192 | 256 | 320;

export type OggQualityV2 = "low" | "medium" | "high";

export type ConversionStatusV2 =
  | "aguardando"
  | "preparando"
  | "convertendo"
  | "concluido"
  | "erro"
  | "cancelado";

export interface AudioSettingsStateV2 {
  format: AudioOutputFormatV2;
  mp3Kbps: Mp3BitrateV2;
  wavSampleRate: WavSampleRateV2;
  wavBitDepth: WavBitDepthV2;
  wavChannels: WavChannelsV2;
  aacKbps: AacBitrateV2;
  flacSampleRate: FlacSampleRateV2;
  flacBitDepth: FlacBitDepthV2;
  oggKbps: OggBitrateV2;
  oggQuality: OggQualityV2;
}

export interface AudioQueueItemV2 {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  duration: number | null;
  channels: number | null;
  sampleRate?: number | null;
  formatDetected?: string;
  bitDepth?: number | null;
  bitrateKbps?: number | null;
  status: ConversionStatusV2;
  progress: number;
  errorMessage?: string;
  convertedSize?: number;
  convertedBlobUrl?: string;
  convertedFileName?: string;
  originalBlobUrl?: string;
}

export interface PlaybackStateV2 {
  id: string | null;
  type: "original" | "converted" | null;
}

