import { ImageMetadataEditForm, ImageWriteResult } from "../types";
import { ImageMetadataReader } from "./imageMetadataReader";
import { computeImageSha256 } from "./imageMetadataVerifier";
import { JpegMetadataAdapter } from "../adapters/JpegMetadataAdapter";
import { PngMetadataAdapter } from "../adapters/PngMetadataAdapter";
import { WebpMetadataAdapter } from "../adapters/WebpMetadataAdapter";

export class ImageMetadataWriter {
  /**
   * Grava novos metadados ESTRITAMENTE sobre a versão limpa,
   * executa uma reanálise física obrigatória a partir dos bytes gerados e retorna a verificação.
   */
  public static async write(
    cleanedFile: File,
    form: ImageMetadataEditForm,
    originalFileName?: string
  ): Promise<ImageWriteResult> {
    const cleanBuffer = await cleanedFile.arrayBuffer();
    const cleanBytes = new Uint8Array(cleanBuffer);
    const cleanedSha256 = await computeImageSha256(cleanBytes);

    let idatPayloadHashBefore: string | undefined;
    let idatPayloadHashAfter: string | undefined;
    let isIdatPayloadPreserved: boolean | undefined;

    const isPngFormat = ImageMetadataReader.isPng(cleanBytes);
    if (isPngFormat) {
      const idatBefore = PngMetadataAdapter.extractIdatPayloads(cleanBytes);
      idatPayloadHashBefore = await computeImageSha256(idatBefore);
    }

    let finalEditedFile: File;

    if (ImageMetadataReader.isJpeg(cleanBytes)) {
      finalEditedFile = await JpegMetadataAdapter.writeMetadata(cleanedFile, cleanBytes, form, originalFileName);
    } else if (isPngFormat) {
      finalEditedFile = await PngMetadataAdapter.writeMetadata(cleanedFile, cleanBytes, form, originalFileName);
    } else if (ImageMetadataReader.isWebp(cleanBytes)) {
      finalEditedFile = await WebpMetadataAdapter.writeMetadata(cleanedFile, cleanBytes, form, originalFileName);
    } else {
      throw new Error("Formato não suportado para gravação.");
    }

    const finalBuffer = await finalEditedFile.arrayBuffer();
    const finalBytes = new Uint8Array(finalBuffer);
    const finalSha256 = await computeImageSha256(finalBytes);

    if (isPngFormat) {
      const idatAfter = PngMetadataAdapter.extractIdatPayloads(finalBytes);
      idatPayloadHashAfter = await computeImageSha256(idatAfter);
      isIdatPayloadPreserved = idatPayloadHashBefore === idatPayloadHashAfter;
    }

    // Reanálise Física Obrigatória e Independente do Arquivo Editado a partir dos bytes gravados
    const analysisAfterWrite = await ImageMetadataReader.analyze(finalEditedFile);

    // Contagem de chunks iTXt físicos
    const iTxTCount = analysisAfterWrite.verification.chunksSummary.filter(c =>
      c.name.toLowerCase().startsWith("itxt")
    ).length;

    // Localizar valores físicos relidos diretamente dos itens da reanálise
    const findRechecked = (keys: string[]): string | undefined => {
      const item = analysisAfterWrite.items.find(i => keys.some(k => i.key.toLowerCase() === k.toLowerCase()));
      return item?.value?.trim();
    };

    const recheckedTitle = findRechecked(["Title", "dc:title", "ObjectName"]);
    const recheckedAuthor = findRechecked(["Author", "Artist", "dc:creator", "By-line"]);
    const recheckedCopyright = findRechecked(["Copyright", "dc:rights", "CopyrightNotice"]);
    const recheckedKeywords = findRechecked(["Keywords", "dc:subject"]);
    const recheckedCreationDate = findRechecked(["Creation Time", "xmp:CreateDate", "DateTimeOriginal"]);

    const titleMatch = !form.title?.trim() || recheckedTitle === form.title.trim();
    const authorMatch = !form.artist?.trim() || recheckedAuthor === form.artist.trim();
    const copyrightMatch = !form.copyright?.trim() || recheckedCopyright === form.copyright.trim();
    const keywordsMatch = !form.keywords?.trim() || (recheckedKeywords?.includes(form.keywords.trim()) ?? false);
    const creationDateMatch = !form.creationDate?.trim() || recheckedCreationDate === form.creationDate.trim();

    const pngValid = !isPngFormat || (iTxTCount > 0 && isIdatPayloadPreserved === true);
    const allMatched =
      Boolean(finalEditedFile instanceof File) &&
      titleMatch &&
      authorMatch &&
      copyrightMatch &&
      keywordsMatch &&
      creationDateMatch &&
      pngValid;

    const validationStatus: "VALIDATED" | "NOT_VALIDATED" = allMatched ? "VALIDATED" : "NOT_VALIDATED";

    // Pesquisa bruta independente de strings UTF-8 diretamente nos bytes físicos
    const searchRawUtf8 = (term: string): { term: string; found: boolean; offset?: number } => {
      const termBytes = new TextEncoder().encode(term);
      if (termBytes.length === 0) return { term, found: false };

      for (let i = 0; i <= finalBytes.length - termBytes.length; i++) {
        let match = true;
        for (let j = 0; j < termBytes.length; j++) {
          if (finalBytes[i + j] !== termBytes[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          return { term, found: true, offset: i };
        }
      }
      return { term, found: false };
    };

    const searchTerms: string[] = [];
    if (form.title?.trim()) {
      searchTerms.push(form.title.trim());
      // também partes do título se tiver várias palavras
      const words = form.title.trim().split(" ");
      if (words.length > 1) searchTerms.push(words[0], words.slice(1).join(" "));
    }
    if (form.artist?.trim() && !searchTerms.includes(form.artist.trim())) searchTerms.push(form.artist.trim());
    if (form.copyright?.trim() && !searchTerms.includes(form.copyright.trim())) searchTerms.push(form.copyright.trim());
    if (form.keywords?.trim() && !searchTerms.includes(form.keywords.trim())) searchTerms.push(form.keywords.trim());
    if (form.creationDate?.trim() && !searchTerms.includes(form.creationDate.trim())) searchTerms.push(form.creationDate.trim());
    if (!searchTerms.includes("Copyright")) searchTerms.push("Copyright");
    if (!searchTerms.includes("Keywords")) searchTerms.push("Keywords");

    const rawUtf8Search = searchTerms.map(t => searchRawUtf8(t));

    const savedFields: { key: string; label: string; value: string }[] = [];
    if (form.title?.trim()) savedFields.push({ key: "Title", label: "Título da Imagem", value: form.title.trim() });
    if (form.artist?.trim()) savedFields.push({ key: "Artist", label: "Autor / Criador", value: form.artist.trim() });
    if (form.description?.trim()) savedFields.push({ key: "Description", label: "Descrição / Legenda", value: form.description.trim() });
    if (form.copyright?.trim()) savedFields.push({ key: "Copyright", label: "Direitos Autorais", value: form.copyright.trim() });
    if (form.keywords?.trim()) savedFields.push({ key: "Keywords", label: "Palavras-chave", value: form.keywords.trim() });
    if (form.comment?.trim()) savedFields.push({ key: "Comment", label: "Comentário", value: form.comment.trim() });
    if (form.creationDate?.trim()) savedFields.push({ key: "CreationDate", label: "Data de Criação", value: form.creationDate.trim() });

    return {
      finalEditedFile,
      cleanedSha256,
      finalSha256,
      cleanedSize: cleanedFile.size,
      finalSize: finalEditedFile.size,
      analysisAfterWrite,
      savedFields,
      idatPayloadHashBefore,
      idatPayloadHashAfter,
      isIdatPayloadPreserved,
      validationStatus,
      rawUtf8Search,
      reanalysisVerification: {
        iTxTCount,
        titleMatch,
        authorMatch,
        copyrightMatch,
        keywordsMatch,
        creationDateMatch,
        recheckedTitle,
        recheckedAuthor,
        recheckedCopyright,
        recheckedKeywords,
        recheckedCreationDate,
        allMatched
      }
    };
  }
}
