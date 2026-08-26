/**
 * Conversor Audio V2 - Tipos do Módulo de Extração de Vídeo para Áudio
 */

export type VideoOutputFormatV2 = "mp3" | "wav" | "aac" | "flac" | "ogg";
export type VideoMp3BitrateV2 = 64 | 96 | 112 | 128 | 160 | 192 | 256 | 320;
export type VideoAacBitrateV2 = 96 | 112 | 128 | 160 | 192 | 256 | 320;
export type VideoWavSampleRateV2 = "original" | "44100" | "48000" | "96000";
export type VideoWavBitDepthV2 = 16 | 24 | 32;
export type VideoWavChannelsV2 = "original" | "mono" | "stereo";
export type VideoFlacBitDepthV2 = "original" | 16 | 24;
export type VideoOggBitrateV2 = 64 | 96 | 112 | 128 | 160 | 192 | 256 | 320;

export interface AudioTrackInfoV2 {
  index: number;
  trackId: number;
  codec: string;
  codecLongName: string;
  sampleRate: number;
  channels: number;
  channelLayout: string;
  bitDepth?: number;
  bitrate?: number; // em kbps
  duration: number;
  language?: string;
  isDefault: boolean;
  isSupportedForExtraction: boolean;
}

export interface VideoStreamInfoV2 {
  index: number;
  trackId: number;
  codec: string;
  codecLongName: string;
  width: number;
  height: number;
  duration: number;
}

export interface SubtitleStreamInfoV2 {
  index: number;
  codec: string;
  language?: string;
}

export type VideoAudioDetectionStatusV2 = 
  | "ANALYZING"
  | "AUDIO_TRACK_FOUND_AND_SUPPORTED"
  | "AUDIO_TRACK_FOUND_BUT_UNSUPPORTED_CODEC"
  | "NO_AUDIO_TRACK_FOUND"
  | "PROBE_FAILED";

export interface VideoMetadataV2 {
  file: File;
  name: string;
  container: string;
  format: string;
  size: number;
  duration: number; // segundos
  width: number;
  height: number;
  hasAudioTrack: boolean;
  audioChannels: number;
  sampleRate: number;
  mimeType: string;
  videoCodec?: string;
  videoStreams: VideoStreamInfoV2[];
  audioTracks: AudioTrackInfoV2[];
  selectedAudioTrackIndex: number;
  subtitleStreams: SubtitleStreamInfoV2[];
  status: VideoAudioDetectionStatusV2;
  statusMessage?: string;
}

export interface VideoOutputConfigV2 {
  format: VideoOutputFormatV2;
  mp3Kbps: VideoMp3BitrateV2;
  aacKbps: VideoAacBitrateV2;
  wavSampleRate: VideoWavSampleRateV2;
  wavBitDepth: VideoWavBitDepthV2;
  wavChannels: VideoWavChannelsV2;
  flacBitDepth: VideoFlacBitDepthV2;
  oggKbps: VideoOggBitrateV2;
  hasAcceptedTerms: boolean;
}

export interface VideoResultV2 {
  outputFileName: string;
  outputBlobUrl: string;
  outputBlob: Blob;
  format: VideoOutputFormatV2;
  originalSize: number;
  finalSize: number;
  duration: number;
  qualityChosen: string;
}

export interface ExtractedAudioDataV2 {
  leftChannel: Float32Array;
  rightChannel: Float32Array | null;
  channels: number;
  sampleRate: number;
  duration: number;
}
