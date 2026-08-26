import { AudioMetadataModel, AnalysisSummaryStats } from "../../types/audioMetadata";

export function computeAnalysisSummaryStats(model: AudioMetadataModel): AnalysisSummaryStats {
  let personalTextFieldsCount = 0;
  let embeddedCoversCount = model.cover ? 1 : 0;
  let technicalTagsCount = 0;
  let unknownTagsCount = 0;

  // Personal / Text fields list check
  const personalKeys: (keyof AudioMetadataModel)[] = [
    "title", "artist", "album", "albumArtist", "year", "trackNumber", "totalTracks",
    "discNumber", "totalDiscs", "genre", "composer", "performer", "author", "copyright",
    "publisher", "isrc", "bpm", "key", "language", "comment", "description", "subtitle",
    "lyrics", "grouping", "mood"
  ];

  const removableFieldsList: { key: string; label: string; currentVal: string; reason: string }[] = [];

  personalKeys.forEach((key) => {
    const val = model[key];
    if (typeof val === "string" && val.trim().length > 0) {
      personalTextFieldsCount++;
      removableFieldsList.push({
        key: String(key),
        label: getFieldLabel(String(key)),
        currentVal: val,
        reason: "Dado textual editável ou sensível à privacidade."
      });
    }
  });

  if (model.cover) {
    removableFieldsList.push({
      key: "cover",
      label: "Capa do Álbum",
      currentVal: `${model.cover.format.toUpperCase()} (${(model.cover.sizeBytes / 1024).toFixed(1)} KB)`,
      reason: "Imagem incorporada no arquivo."
    });
  }

  // Count technical tags & unknown tags from id3Frames and rawTagsList
  if (model.id3Frames && model.id3Frames.length > 0) {
    model.id3Frames.forEach((frame) => {
      if (frame.isUnknown) {
        unknownTagsCount++;
      } else {
        technicalTagsCount++;
      }
    });
  } else if (model.rawTagsList && model.rawTagsList.length > 0) {
    technicalTagsCount = model.rawTagsList.length;
  } else {
    technicalTagsCount = Object.keys(model.rawTags || {}).length;
  }

  // Count software / origin
  if (model.software || model.encoder || model.encodedBy || model.application) {
    technicalTagsCount++;
  }

  const totalMetadataFound =
    personalTextFieldsCount +
    embeddedCoversCount +
    technicalTagsCount +
    unknownTagsCount;

  return {
    totalMetadataFound,
    personalTextFieldsCount,
    embeddedCoversCount,
    technicalTagsCount,
    unknownTagsCount,
    removableFieldsCount: removableFieldsList.length,
    removableFieldsList
  };
}

function getFieldLabel(key: string): string {
  const map: Record<string, string> = {
    title: "Título",
    artist: "Artista",
    album: "Álbum",
    albumArtist: "Artista do Álbum",
    year: "Ano / Data",
    trackNumber: "Número da Faixa",
    totalTracks: "Total de Faixas",
    discNumber: "Número do Disco",
    totalDiscs: "Total de Discos",
    genre: "Gênero Musical",
    composer: "Compositor",
    performer: "Intérprete",
    author: "Autor",
    copyright: "Copyright",
    publisher: "Editora / Publisher",
    isrc: "Código ISRC",
    bpm: "Andamento (BPM)",
    key: "Chave / Tom",
    language: "Idioma",
    comment: "Comentários",
    description: "Descrição",
    subtitle: "Subtítulo",
    lyrics: "Letras (Lyrics)",
    grouping: "Agrupamento (Grouping)",
    mood: "Humor (Mood)"
  };
  return map[key] || key;
}
