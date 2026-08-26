import { readAudioMetadata, extractRemovableTagsList } from "../src/services/audio/metadataReaderService";
import { writeAudioMetadata } from "../src/services/audio/metadataWriterService";
import { AudioMetadataModel, CleanOptions } from "../src/types/audioMetadata";

function createControlledWavWithMetadata(): Uint8Array {
  const pcmData = new Uint8Array(88200); // 1 sec of stereo 16-bit 44.1kHz audio
  for (let i = 0; i < pcmData.length; i++) {
    pcmData[i] = (i % 256);
  }

  // 1. fmt chunk
  const fmtChunk = new Uint8Array(24);
  fmtChunk.set(new TextEncoder().encode("fmt "), 0);
  new DataView(fmtChunk.buffer).setUint32(4, 16, true);
  new DataView(fmtChunk.buffer).setUint16(8, 1, true); // PCM
  new DataView(fmtChunk.buffer).setUint16(10, 2, true); // 2 channels
  new DataView(fmtChunk.buffer).setUint32(12, 44100, true); // 44.1kHz
  new DataView(fmtChunk.buffer).setUint32(16, 176400, true); // ByteRate
  new DataView(fmtChunk.buffer).setUint16(20, 4, true); // BlockAlign
  new DataView(fmtChunk.buffer).setUint16(22, 16, true); // 16 bits

  // 2. bext chunk
  const bextPayload = new Uint8Array(602);
  const enc = new TextEncoder();
  bextPayload.set(enc.encode("Comentário Original"), 0); // description
  bextPayload.set(enc.encode("Software Original"), 256); // originator
  bextPayload.set(enc.encode("2023:05:12"), 320); // origination date
  const bextChunk = new Uint8Array(8 + bextPayload.length);
  bextChunk.set(enc.encode("bext"), 0);
  new DataView(bextChunk.buffer).setUint32(4, bextPayload.length, true);
  bextChunk.set(bextPayload, 8);

  // 3. LIST INFO chunk
  const infoSubchunks: Uint8Array[] = [];
  const addSubchunk = (id: string, text: string) => {
    const textBytes = enc.encode(text + "\0");
    const sub = new Uint8Array(8 + textBytes.length + (textBytes.length % 2));
    sub.set(enc.encode(id), 0);
    new DataView(sub.buffer).setUint32(4, textBytes.length, true);
    sub.set(textBytes, 8);
    infoSubchunks.push(sub);
  };

  addSubchunk("INAM", "Teste Original");
  addSubchunk("IART", "Artista Original");
  addSubchunk("IENG", "Compositor Original");
  addSubchunk("ICOP", "Copyright Original");
  addSubchunk("ICMT", "Comentário Original");
  addSubchunk("ISFT", "Software Original");

  let listPayloadSize = 4;
  for (const s of infoSubchunks) listPayloadSize += s.length;
  const listChunk = new Uint8Array(8 + listPayloadSize);
  listChunk.set(enc.encode("LIST"), 0);
  new DataView(listChunk.buffer).setUint32(4, listPayloadSize, true);
  listChunk.set(enc.encode("INFO"), 8);
  let listPos = 12;
  for (const s of infoSubchunks) {
    listChunk.set(s, listPos);
    listPos += s.length;
  }

  // 4. data chunk
  const dataChunk = new Uint8Array(8 + pcmData.length);
  dataChunk.set(enc.encode("data"), 0);
  new DataView(dataChunk.buffer).setUint32(4, pcmData.length, true);
  dataChunk.set(pcmData, 8);

  // Total RIFF
  const totalRiffLength = 4 + fmtChunk.length + bextChunk.length + listChunk.length + dataChunk.length;
  const riff = new Uint8Array(8 + totalRiffLength);
  riff.set(enc.encode("RIFF"), 0);
  new DataView(riff.buffer).setUint32(4, totalRiffLength, true);
  riff.set(enc.encode("WAVE"), 8);

  let p = 12;
  riff.set(fmtChunk, p); p += fmtChunk.length;
  riff.set(bextChunk, p); p += bextChunk.length;
  riff.set(listChunk, p); p += listChunk.length;
  riff.set(dataChunk, p); p += dataChunk.length;

  return riff;
}

async function runControlledLifecycleValidation() {
  console.log("==================================================");
  console.log("INICIANDO PROTOCOLO COMPLETO DE VERIFICAÇÃO FÍSICA");
  console.log("==================================================");

  // A) Gerar arquivo controlado em bytes
  const originalBytes = createControlledWavWithMetadata();
  const originalFile = new File([new Blob([originalBytes])], "audio_controlado.wav", { type: "audio/wav" });

  // B) Ler o arquivo pelos bytes
  const metaBefore = await readAudioMetadata(originalFile);
  const tagsBefore = extractRemovableTagsList(metaBefore);

  console.log("\n--- TESTE DE LEITURA ---");
  console.log("Arquivo:", originalFile.name);
  console.log("Tamanho:", originalFile.size, "bytes");
  console.log("Informações técnicas encontradas:", {
    format: metaBefore.format,
    codec: metaBefore.technical.codec,
    sampleRate: metaBefore.technical.sampleRateHz,
    bitsPerSample: metaBefore.technical.bitsPerSample,
    channels: metaBefore.technical.channels,
    byteRate: metaBefore.technical.byteRate,
    blockAlign: metaBefore.technical.blockAlign
  });
  console.log("Metadados removíveis encontrados:", tagsBefore.length);
  console.log("Tags:", tagsBefore.map(t => `${t.label}: "${t.value}"`).join(" | "));
  console.log("Reader leu bytes reais: SIM");

  // D) Limpar
  const cleanOptions: CleanOptions = {
    wipeAll: true,
    removeMainMetadata: true,
    removeCover: true,
    removeComments: true,
    removeSoftwareEncoder: true,
    removeLyrics: true,
    removeCopyright: true,
    removeTechnicalTags: true,
    removePrivateTags: true,
    removeTrackInfo: true,
    removeCustomTags: true,
    removeOriginData: true,
    removeUrls: true
  };

  const emptyModel: AudioMetadataModel = {
    ...metaBefore,
    title: "", artist: "", album: "", albumArtist: "", year: "", genre: "",
    trackNumber: "", totalTracks: "", discNumber: "", totalDiscs: "",
    composer: "", performer: "", author: "", publisher: "", isrc: "", bpm: "",
    key: "", language: "", copyright: "", comment: "", lyrics: "", description: "",
    subtitle: "", grouping: "", mood: "", software: "", encoder: "", encodedBy: "",
    writingLibrary: "", application: "", tool: "", vendor: "", creationTime: "",
    modificationTime: "", originalFilename: "", copyrightMessage: "", encoderDelay: "",
    padding: "", replayGain: "", loudness: "", peak: "", gaplessInfo: "",
    privateFramesCount: 0, ufid: "", popularimeter: "", cover: null,
    id3Frames: [], rawTagsList: [], rawTags: {}
  };

  // E) Gerar Blob real
  const cleanedBlob = await writeAudioMetadata(originalFile, emptyModel, cleanOptions);
  const cleanedFile = new File([cleanedBlob], "audio_limpo.wav", { type: "audio/wav" });

  // F) Ler os bytes do novo Blob DO ZERO
  const metaCleaned = await readAudioMetadata(cleanedFile);
  const tagsCleaned = extractRemovableTagsList(metaCleaned);

  console.log("\n--- TESTE DE LIMPEZA ---");
  console.log("Metadados antes:", tagsBefore.length);
  console.log("Metadados removidos:", tagsBefore.length - tagsCleaned.length);
  console.log("Metadados depois:", tagsCleaned.length);
  console.log("cleanedFile real: SIM");
  console.log("Releitura do cleanedFile: SIM");

  // Verificar PCM intacto
  const originalBuf = await originalFile.slice(originalFile.size - 88200).arrayBuffer();
  const cleanedBuf = await cleanedFile.slice(cleanedFile.size - 88200).arrayBuffer();
  const origPcm = new Uint8Array(originalBuf);
  const cleanPcm = new Uint8Array(cleanedBuf);
  let pcmMatches = origPcm.length === cleanPcm.length;
  for (let i = 0; i < origPcm.length; i++) {
    if (origPcm[i] !== cleanPcm[i]) {
      pcmMatches = false;
      break;
    }
  }
  console.log("PCM preservado bit-a-bit:", pcmMatches ? "SIM" : "NÃO");

  // G) Salvar / Reabrir arquivo limpo do zero
  const reopenedCleanedBytes = new Uint8Array(await cleanedFile.arrayBuffer());
  const reopenedCleanedFile = new File([new Blob([reopenedCleanedBytes])], "audio_reaberto.wav", { type: "audio/wav" });
  const metaReopened = await readAudioMetadata(reopenedCleanedFile);
  const tagsReopened = extractRemovableTagsList(metaReopened);

  console.log("\n--- TESTE DE REABERTURA DO ARQUIVO LIMPO ---");
  console.log("Arquivo gerado foi aberto novamente: SIM");
  console.log("Metadados antigos voltaram:", tagsReopened.length > 0 ? "SIM" : "NÃO");

  // H) Teste de Edição
  const newModel: AudioMetadataModel = {
    ...metaCleaned,
    title: "Música Nova",
    artist: "Artista Novo",
    composer: "Compositor Novo"
  };

  const finalEditedBlob = await writeAudioMetadata(cleanedFile, newModel);
  const finalEditedFile = new File([finalEditedBlob], "audio_final.wav", { type: "audio/wav" });

  // I) Executar novamente o reader DO ZERO no arquivo final
  const metaFinal = await readAudioMetadata(finalEditedFile);

  console.log("\n--- TESTE DE EDIÇÃO & REABERTURA FINAL ---");
  console.log("Novos dados gravados:", {
    title: "Música Nova",
    artist: "Artista Novo",
    composer: "Compositor Novo"
  });
  console.log("Arquivo final relido: SIM");
  console.log("Resultado final relido:", {
    title: metaFinal.title,
    artist: metaFinal.artist,
    composer: metaFinal.composer,
    software: metaFinal.software,
    comment: metaFinal.comment
  });

  const isSuccess = 
    tagsBefore.length > 0 &&
    tagsCleaned.length === 0 &&
    tagsReopened.length === 0 &&
    metaFinal.title === "Música Nova" &&
    metaFinal.artist === "Artista Novo" &&
    metaFinal.composer === "Compositor Novo" &&
    !metaFinal.software &&
    (!metaFinal.comment || metaFinal.comment === "") &&
    pcmMatches;

  console.log("\n==================================================");
  console.log("STATUS:", isSuccess ? "PASSOU" : "FALHOU");
  console.log("==================================================");

  if (!isSuccess) process.exit(1);
}

runControlledLifecycleValidation().catch((err) => {
  console.error("ERRO NO TESTE:", err);
  process.exit(1);
});
