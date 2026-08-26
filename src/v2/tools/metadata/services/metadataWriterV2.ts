/**
 * Reexporta diretamente o gravador canônico de metadados comprovado da aplicação (src/services/audio/metadataWriterService.ts)
 */
export { writeAudioMetadata, computeFileHash } from "../../../../services/audio/metadataWriterService";
export type { AudioMetadataModel, CleanOptions } from "../../../../types/audioMetadata";
