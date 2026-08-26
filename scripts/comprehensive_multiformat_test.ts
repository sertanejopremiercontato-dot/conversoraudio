import { readAudioMetadata, extractRemovableTagsList } from "../src/services/audio/metadataReaderService";
import { writeAudioMetadata } from "../src/services/audio/metadataWriterService";
import { AudioMetadataModel, CleanOptions } from "../src/types/audioMetadata";

// Helper: Generates MP3 with ID3v2.3 tags
function createControlledMp3WithMetadata(): Uint8Array {
  // Simple ID3v2.3 tag
  const frames: Uint8Array[] = [];
  const addFrame = (id: string, text: string) => {
    const enc = new TextEncoder().encode(text);
    const body = new Uint8Array(1 + enc.length);
    body[0] = 3; // UTF-8
    body.set(enc, 1);
    const frame = new Uint8Array(10 + body.length);
    frame.set(new TextEncoder().encode(id), 0);
    const s = body.length;
    frame[4] = (s >> 24) & 0xff;
    frame[5] = (s >> 16) & 0xff;
    frame[6] = (s >> 8) & 0xff;
    frame[7] = s & 0xff;
    frame.set(body, 10);
    frames.push(frame);
  };

  addFrame("TIT2", "MP3 Título Teste");
  addFrame("TPE1", "MP3 Artista Teste");
  addFrame("TALB", "MP3 Álbum Teste");
  addFrame("COMM", "MP3 Comentário Teste");
  addFrame("TSSE", "LAME3.100");

  let totalFramesSize = frames.reduce((acc, f) => acc + f.length, 0);
  const id3Header = new Uint8Array(10);
  id3Header.set([0x49, 0x44, 0x33, 0x03, 0x00, 0x00], 0);
  id3Header[6] = (totalFramesSize >> 21) & 0x7f;
  id3Header[7] = (totalFramesSize >> 14) & 0x7f;
  id3Header[8] = (totalFramesSize >> 7) & 0x7f;
  id3Header[9] = totalFramesSize & 0x7f;

  // Fake MPEG sync frames payload (10 frames)
  const mpegFrames: Uint8Array[] = [];
  for (let i = 0; i < 10; i++) {
    const mf = new Uint8Array(418); // standard 128kbps 44.1kHz frame size
    mf[0] = 0xff;
    mf[1] = 0xfb; // MPEG 1 Layer III 128kbps 44.1kHz stereo
    mf[2] = 0x90;
    mf[3] = 0x64;
    mpegFrames.push(mf);
  }

  const totalLen = 10 + totalFramesSize + mpegFrames.reduce((acc, f) => acc + f.length, 0);
  const out = new Uint8Array(totalLen);
  out.set(id3Header, 0);
  let p = 10;
  for (const f of frames) {
    out.set(f, p);
    p += f.length;
  }
  for (const mf of mpegFrames) {
    out.set(mf, p);
    p += mf.length;
  }
  return out;
}

async function runMultiFormatTest() {
  console.log("\n==================================================");
  console.log("TESTANDO MP3 LOSSLESS STRIPPER & WRITER");
  console.log("==================================================");

  const mp3Bytes = createControlledMp3WithMetadata();
  const mp3File = new File([new Blob([mp3Bytes])], "controlled_test.mp3", { type: "audio/mpeg" });

  const metaBefore = await readAudioMetadata(mp3File);
  console.log("MP3 antes - Título:", metaBefore.title);
  console.log("MP3 antes - Artista:", metaBefore.artist);
  console.log("MP3 antes - Software/Encoder:", metaBefore.software || metaBefore.encoder);

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

  const cleanedMp3Blob = await writeAudioMetadata(mp3File, emptyModel, cleanOptions);
  const cleanedMp3File = new File([cleanedMp3Blob], "cleaned_test.mp3", { type: "audio/mpeg" });

  const metaCleaned = await readAudioMetadata(cleanedMp3File);
  const tagsCleaned = extractRemovableTagsList(metaCleaned);
  console.log("MP3 limpo - Tags restantes:", tagsCleaned.length);

  if (tagsCleaned.length !== 0 || metaCleaned.title || metaCleaned.artist) {
    console.error("ERRO: MP3 Limpeza falhou!");
    process.exit(1);
  }

  // Re-upload test
  const reloadedMp3Bytes = new Uint8Array(await cleanedMp3File.arrayBuffer());
  const reloadedMp3File = new File([new Blob([reloadedMp3Bytes])], "reloaded.mp3", { type: "audio/mpeg" });
  const metaReloaded = await readAudioMetadata(reloadedMp3File);
  console.log("MP3 Reupload - Tags:", extractRemovableTagsList(metaReloaded).length);

  if (extractRemovableTagsList(metaReloaded).length !== 0) {
    console.error("ERRO: Reupload MP3 acusou tags antigas!");
    process.exit(1);
  }

  // Edit & Save
  const editedMp3Model: AudioMetadataModel = {
    ...metaCleaned,
    title: "MP3 Novo Título",
    artist: "MP3 Novo Artista",
    composer: "MP3 Novo Compositor"
  };

  const savedMp3Blob = await writeAudioMetadata(cleanedMp3File, editedMp3Model);
  const savedMp3File = new File([savedMp3Blob], "saved.mp3", { type: "audio/mpeg" });
  const metaSaved = await readAudioMetadata(savedMp3File);

  console.log("MP3 Salvo - Novo Título:", metaSaved.title);
  console.log("MP3 Salvo - Novo Artista:", metaSaved.artist);
  console.log("MP3 Salvo - Novo Compositor:", metaSaved.composer);

  if (metaSaved.title !== "MP3 Novo Título" || metaSaved.artist !== "MP3 Novo Artista" || metaSaved.composer !== "MP3 Novo Compositor") {
    console.error("ERRO: MP3 Gravação falhou!");
    process.exit(1);
  }

  console.log("\n==================================================");
  console.log("MULTI-FORMAT TEST: PASSOU 100%");
  console.log("==================================================");
}

runMultiFormatTest().catch(e => {
  console.error(e);
  process.exit(1);
});
