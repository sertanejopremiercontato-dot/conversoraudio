export * from "../../../types/audioMetadata";

import { 
  AudioFormatCategory, 
  AudioCoverArt, 
  AudioTechnicalDetails, 
  AudioMetadataModel, 
  CleanOptions,
  ID3FrameItem,
  RawMetadataItem
} from "../../../types/audioMetadata";

// V2 backward compatibility type aliases
export type AudioFormatCategoryV2 = AudioFormatCategory;
export type AudioCoverArtV2 = AudioCoverArt;
export type AudioTechnicalDetailsV2 = AudioTechnicalDetails;
export type NativeFrameItemV2 = { id: string; type: string; value: string };
export type AudioMetadataModelV2 = AudioMetadataModel;
export type CleanOptionsV2 = CleanOptions;
