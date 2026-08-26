import { readAudioMetadata, extractRemovableTagsList } from "../src/services/audio/metadataReaderService";
import { writeAudioMetadata } from "../src/services/audio/metadataWriterService";
import { AudioMetadataModel, CleanOptions } from "../src/types/audioMetadata";

// Helper: Generates a minimal clean WAV with ONLY RIFF, fmt, and data
function createWavWithoutMetadata(): { bytes: Uint8Array; pcm: Uint8Array } {
  const sampleRate = 44100;
  const numChannels = 2;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const numSamples = 22050; // 0.5 sec
  const dataSize = numSamples * blockAlign;

  const pcm = new Uint8Array(dataSize);
  for (let i = 0; i < numSamples; i++) {
    const val = Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 8000);
    const offset = i * blockAlign;
    pcm[offset] = val & 0xff;
    pcm[offset + 1] = (val >> 8) & 0xff;
    pcm[offset + 2] = val & 0xff;
    pcm[offset + 3] = (val >> 8) & 0xff;
  }

  // fmt chunk (24 bytes)
  const fmtChunk = new Uint8Array(24);
  fmtChunk.set(new TextEncoder().encode("fmt "), 0);
  const fmtView = new DataView(fmtChunk.buffer);
  fmtView.setUint32(4, 16, true);
  fmtView.setUint16(8, 1, true); // PCM
  fmtView.setUint16(10, numChannels, true);
  fmtView.setUint32(12, sampleRate, true);
  fmtView.setUint32(16, byteRate, true);
  fmtView.setUint16(20, blockAlign, true);
  fmtView.setUint16(22, bitsPerSample, true);

  // data chunk (8 + dataSize)
  const dataHeader = new Uint8Array(8);
  dataHeader.set(new TextEncoder().encode("data"), 0);
  new DataView(dataHeader.buffer).setUint32(4, dataSize, true);

  // RIFF header
  const totalRiffLen = 4 + fmtChunk.length + dataHeader.length + pcm.length;
  const wav = new Uint8Array(8 + totalRiffLen);
  wav.set(new TextEncoder().encode("RIFF"), 0);
  new DataView(wav.buffer).setUint32(4, totalRiffLen, true);
  wav.set(new TextEncoder().encode("WAVE"), 8);

  let p = 12;
  wav.set(fmtChunk, p); p += fmtChunk.length;
  wav.set(dataHeader, p); p += dataHeader.length;
  wav.set(pcm, p);

  return { bytes: wav, pcm };
}

// Helper: Generates a controlled WAV with metadata (LIST INFO + bext + fmt + data)
function createControlledWavWithMetadata(): { bytes: Uint8Array; pcm: Uint8Array } {
  const sampleRate = 44100;
  const numChannels = 2;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const numSamples = 22050;
  const dataSize = numSamples * blockAlign;

  const pcm = new Uint8Array(dataSize);
  for (let i = 0; i < numSamples; i++) {
    const val = Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 8000);
    const offset = i * blockAlign;
    pcm[offset] = val & 0xff;
    pcm[offset + 1] = (val >> 8) & 0xff;
    pcm[offset + 2] = val & 0xff;
    pcm[offset + 3] = (val >> 8) & 0xff;
  }

  // fmt chunk
  const fmtChunk = new Uint8Array(24);
  fmtChunk.set(new TextEncoder().encode("fmt "), 0);
  const fmtView = new DataView(fmtChunk.buffer);
  fmtView.setUint32(4, 16, true);
  fmtView.setUint16(8, 1, true); // PCM
  fmtView.setUint16(10, numChannels, true);
  fmtView.setUint32(12, sampleRate, true);
  fmtView.setUint32(16, byteRate, true);
  fmtView.setUint16(20, blockAlign, true);
  fmtView.setUint16(22, bitsPerSample, true);

  // LIST INFO chunk
  const infoTags = [
    { id: "INAM", val: "Teste Título" },
    { id: "IART", val: "Teste Artista" },
    { id: "ICMT", val: "Comentário Teste" },
    { id: "ISFT", val: "Software Teste" },
    { id: "ICOP", val: "Copyright Teste" }
  ];

  let listBodyLen = 4; // 'INFO'
  const subBuffers: Uint8Array[] = [];
  for (const tag of infoTags) {
    const valBytes = new TextEncoder().encode(tag.val + "\0");
    const pad = valBytes.length % 2 !== 0 ? 1 : 0;
    const sub = new Uint8Array(8 + valBytes.length + pad);
    sub.set(new TextEncoder().encode(tag.id), 0);
    new DataView(sub.buffer).setUint32(4, valBytes.length, true);
    sub.set(valBytes, 8);
    listBodyLen += sub.length;
    subBuffers.push(sub);
  }

  const listChunk = new Uint8Array(8 + listBodyLen);
  listChunk.set(new TextEncoder().encode("LIST"), 0);
  new DataView(listChunk.buffer).setUint32(4, listBodyLen, true);
  listChunk.set(new TextEncoder().encode("INFO"), 8);
  let curP = 12;
  for (const sb of subBuffers) {
    listChunk.set(sb, curP);
    curP += sb.length;
  }

  // bext chunk (602 bytes payload)
  const bextPayload = new Uint8Array(602);
  const enc = new TextEncoder();
  bextPayload.set(enc.encode("BWF Broadcast Description Master").slice(0, 256), 0);
  bextPayload.set(enc.encode("SoundForge Master Suite").slice(0, 32), 256);
  bextPayload.set(enc.encode("2023:05:12").slice(0, 10), 320);

  const bextChunk = new Uint8Array(8 + bextPayload.length);
  bextChunk.set(enc.encode("bext"), 0);
  new DataView(bextChunk.buffer).setUint32(4, bextPayload.length, true);
  bextChunk.set(bextPayload, 8);

  // data chunk
  const dataHeader = new Uint8Array(8);
  dataHeader.set(enc.encode("data"), 0);
  new DataView(dataHeader.buffer).setUint32(4, dataSize, true);

  const totalLen = 4 + fmtChunk.length + bextChunk.length + listChunk.length + dataHeader.length + pcm.length;
  const wav = new Uint8Array(8 + totalLen);
  wav.set(enc.encode("RIFF"), 0);
  new DataView(wav.buffer).setUint32(4, totalLen, true);
  wav.set(enc.encode("WAVE"), 8);

  let p = 12;
  wav.set(fmtChunk, p); p += fmtChunk.length;
  wav.set(bextChunk, p); p += bextChunk.length;
  wav.set(listChunk, p); p += listChunk.length;
  wav.set(dataHeader, p); p += dataHeader.length;
  wav.set(pcm, p);

  return { bytes: wav, pcm };
}

async function runValidation() {
  console.log("==================================================");
  console.log("EXECUÇÃO DO PROTOCOLO COMPLETO DE VERIFICAÇÃO");
  console.log("==================================================");

  let statusReader = "PASSOU";
  let statusCleaner = "PASSOU";
  let statusWriter = "PASSOU";

  // --------------------------------------------------------
  // 1. ARQUIVO WAV SEM METADATA
  // --------------------------------------------------------
  console.log("\n[1] TESTANDO ARQUIVO WAV SEM METADATA (fmt + data)...");
  const cleanWavData = createWavWithoutMetadata();
  const cleanBlob = new Blob([cleanWavData.bytes], { type: "audio/wav" });
  const cleanFile = new File([cleanBlob], "clean_audio.wav", { type: "audio/wav" });

  const cleanMeta = await readAudioMetadata(cleanFile);
  const cleanRemovable = extractRemovableTagsList(cleanMeta);

  const chunksFoundClean = cleanMeta.technical.chunksList?.map(c => c.id) || [];
  console.log(" -> chunks encontrados:", chunksFoundClean.join(", "));
  console.log(" -> metadata removível encontrada:", cleanRemovable.length);
  console.log(" -> dados técnicos:", {
    audioFormat: `${cleanMeta.technical.audioFormatCode} (${cleanMeta.technical.audioFormatName})`,
    channels: cleanMeta.technical.channels,
    sampleRateHz: cleanMeta.technical.sampleRateHz,
    bitsPerSample: cleanMeta.technical.bitsPerSample,
    byteRate: cleanMeta.technical.byteRate,
    blockAlign: cleanMeta.technical.blockAlign,
    dataSize: cleanMeta.technical.audioDataLength
  });

  if (cleanRemovable.length !== 0) {
    console.error("ERRO: Leitor inventou metadados em WAV que não possui tags!");
    statusReader = "FALHOU";
  }
  if (cleanMeta.title || cleanMeta.artist || cleanMeta.software) {
    console.error("ERRO: Leitor inventou campos textuais em WAV puro!");
    statusReader = "FALHOU";
  }
  if (cleanMeta.technical.sampleRateHz !== 44100 || cleanMeta.technical.channels !== 2 || cleanMeta.technical.bitsPerSample !== 16) {
    console.error("ERRO: Dados técnicos do WAV puro não foram interpretados corretamente!");
    statusReader = "FALHOU";
  }

  // --------------------------------------------------------
  // 2. ARQUIVO CONTROLADO COM METADATA
  // --------------------------------------------------------
  console.log("\n[2] TESTANDO ARQUIVO CONTROLADO COM METADATA (LIST/INFO + bext)...");
  const controlledWavData = createControlledWavWithMetadata();
  const controlledBlob = new Blob([controlledWavData.bytes], { type: "audio/wav" });
  const controlledFile = new File([controlledBlob], "controlled_metadata.wav", { type: "audio/wav" });

  const metaBefore = await readAudioMetadata(controlledFile);
  const removableBefore = extractRemovableTagsList(metaBefore);
  const chunksBefore = metaBefore.technical.chunksList?.map(c => c.id) || [];

  console.log(" -> chunks antes:", chunksBefore.join(", "));
  console.log(" -> tags antes:", removableBefore.map(t => `${t.label}: "${t.value}"`).join(" | "));

  if (
    metaBefore.title !== "Teste Título" ||
    metaBefore.artist !== "Teste Artista" ||
    metaBefore.comment !== "Comentário Teste" ||
    !metaBefore.software?.includes("Software Teste") ||
    metaBefore.copyright !== "Copyright Teste"
  ) {
    console.error("ERRO: Leitor não detectou tags reais do LIST/INFO ou bext!");
    statusReader = "FALHOU";
  }

  // LIMPEZA FÍSICA
  console.log("\n[3] EXECUTANDO LIMPEZA FÍSICA DO ARQUIVO...");
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

  const cleanedBlob = await writeAudioMetadata(controlledFile, emptyModel, cleanOptions);
  const cleanedFile = new File([cleanedBlob], "controlled_metadata.wav", { type: "audio/wav" });
  const cleanedBytes = new Uint8Array(await cleanedFile.arrayBuffer());

  console.log(" -> cleanedFile gerado: SIM");

  // Verificar se o payload PCM de áudio foi preservado byte-a-byte
  const cleanedMeta = await readAudioMetadata(cleanedFile);
  const chunksAfter = cleanedMeta.technical.chunksList?.map(c => c.id) || [];
  const tagsAfter = extractRemovableTagsList(cleanedMeta);

  console.log(" -> chunks depois:", chunksAfter.join(", "));
  console.log(" -> tags depois:", tagsAfter.length === 0 ? "0 (Nenhuma tag restante)" : tagsAfter.map(t => t.label).join(", "));

  // Verificação física do PCM
  let dataOffsetInCleaned = cleanedMeta.technical.audioDataOffset || 0;
  let dataLenInCleaned = cleanedMeta.technical.audioDataLength || 0;
  let dataPreserved = false;

  if (dataLenInCleaned === controlledWavData.pcm.length) {
    const cleanedPcm = cleanedBytes.subarray(dataOffsetInCleaned, dataOffsetInCleaned + dataLenInCleaned);
    let match = true;
    for (let i = 0; i < cleanedPcm.length; i++) {
      if (cleanedPcm[i] !== controlledWavData.pcm[i]) {
        match = false;
        break;
      }
    }
    dataPreserved = match;
  }

  console.log(" -> data chunk preservado byte-a-byte:", dataPreserved ? "SIM" : "NÃO");

  if (!dataPreserved || chunksAfter.includes("LIST") || chunksAfter.includes("bext") || tagsAfter.length !== 0) {
    console.error("ERRO: Limpeza falhou em remover os metadados ou corrompeu o áudio!");
    statusCleaner = "FALHOU";
  }

  // --------------------------------------------------------
  // 3. TESTE DE RE-UPLOAD REAL DO ARQUIVO LIMPO
  // --------------------------------------------------------
  console.log("\n[4] TESTANDO RE-UPLOAD DO ARQUIVO LIMPO...");
  const reloadedBlob = new Blob([cleanedBytes], { type: "audio/wav" });
  const reloadedFile = new File([reloadedBlob], "reloaded_clean.wav", { type: "audio/wav" });
  const reloadedMeta = await readAudioMetadata(reloadedFile);
  const reloadedRemovable = extractRemovableTagsList(reloadedMeta);

  console.log(" -> reupload real executado: SIM");
  console.log(" -> tags depois do reupload:", reloadedRemovable.length);

  if (reloadedRemovable.length !== 0 || reloadedMeta.title || reloadedMeta.artist) {
    console.error("ERRO: Reupload do arquivo limpo acusou metadados antigos!");
    statusCleaner = "FALHOU";
  }

  // --------------------------------------------------------
  // 4. EDIÇÃO E SALVAMENTO SOBRE O ARQUIVO LIMPO
  // --------------------------------------------------------
  console.log("\n[5] TESTANDO GRAVAÇÃO DE NOVOS METADADOS SOBRE O ARQUIVO LIMPO...");
  const editedModel: AudioMetadataModel = {
    ...cleanedMeta,
    title: "Minha Música",
    artist: "Meu Artista",
    composer: "Meu Compositor",
    year: "2026",
    genre: "Sertanejo"
  };

  const finalBlob = await writeAudioMetadata(cleanedFile, editedModel);
  const finalFile = new File([finalBlob], "final_saved.wav", { type: "audio/wav" });
  const finalMeta = await readAudioMetadata(finalFile);

  console.log(" -> Novo Título:", finalMeta.title);
  console.log(" -> Novo Artista:", finalMeta.artist);
  console.log(" -> Novo Compositor:", finalMeta.composer);

  if (
    finalMeta.title !== "Minha Música" ||
    finalMeta.artist !== "Meu Artista" ||
    finalMeta.composer !== "Meu Compositor" ||
    finalMeta.software === "Software Teste" || // tag antiga não pode existir
    finalMeta.comment === "Comentário Teste"
  ) {
    console.error("ERRO: Gravação de novos metadados falhou!");
    statusWriter = "FALHOU";
  }

  // --------------------------------------------------------
  // 5. TESTE DE RE-UPLOAD DO ARQUIVO FINAL GRAVADO
  // --------------------------------------------------------
  console.log("\n[6] TESTANDO RE-UPLOAD DO ARQUIVO FINAL GRAVADO...");
  const finalBytes = new Uint8Array(await finalFile.arrayBuffer());
  const reloadedFinalFile = new File([new Blob([finalBytes])], "reloaded_final.wav", { type: "audio/wav" });
  const reloadedFinalMeta = await readAudioMetadata(reloadedFinalFile);

  console.log(" -> Re-upload final Título:", reloadedFinalMeta.title);
  console.log(" -> Re-upload final Artista:", reloadedFinalMeta.artist);
  console.log(" -> Re-upload final Compositor:", reloadedFinalMeta.composer);

  if (
    reloadedFinalMeta.title !== "Minha Música" ||
    reloadedFinalMeta.artist !== "Meu Artista" ||
    reloadedFinalMeta.composer !== "Meu Compositor"
  ) {
    console.error("ERRO: Re-upload do arquivo final não continha os dados salvos!");
    statusWriter = "FALHOU";
  }

  console.log("\n==================================================");
  console.log("STATUS FINAL DOS MÓDULOS:");
  console.log("STATUS READER:", statusReader);
  console.log("STATUS CLEANER:", statusCleaner);
  console.log("STATUS WRITER:", statusWriter);
  console.log("==================================================");

  if (statusReader !== "PASSOU" || statusCleaner !== "PASSOU" || statusWriter !== "PASSOU") {
    process.exit(1);
  }
}

runValidation().catch((err) => {
  console.error("FALHA NA EXECUÇÃO DO TESTE:", err);
  process.exit(1);
});
