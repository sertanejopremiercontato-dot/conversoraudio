import React, { useState } from "react";
import { MetadataUploader } from "../components/audio/metadata/MetadataUploader";
import { MetadataFullAnalysisView } from "../components/audio/metadata/MetadataFullAnalysisView";
import { MetadataCleaner } from "../components/audio/metadata/MetadataCleaner";
import { MetadataEditorForm } from "../components/audio/metadata/MetadataEditorForm";
import { MetadataResultView } from "../components/audio/metadata/MetadataResultView";

import { readAudioMetadata } from "../services/audio/metadataReaderService";
import { writeAudioMetadata } from "../services/audio/metadataWriterService";
import { validateMetadataResult } from "../services/audio/metadataValidationService";
import { checkAudioMagicBytes } from "../services/audio/audioMagicBytesService";
import { computeAnalysisSummaryStats } from "../services/audio/metadataNormalizationService";

import {
  AudioMetadataModel,
  AudioValidationResult,
  BeforeAfterItem,
  ProcessingStats,
  AnalysisSummaryStats,
  CleanOptions
} from "../types/audioMetadata";

type StudioState =
  | "idle"
  | "reading"
  | "analyzed"
  | "cleaning"
  | "editing"
  | "saving"
  | "result";

export const AudioMetadataStudio: React.FC = () => {
  const [currentState, setCurrentState] = useState<StudioState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Models
  const [initialModel, setInitialModel] = useState<AudioMetadataModel | null>(null);
  const [workingModel, setWorkingModel] = useState<AudioMetadataModel | null>(null);
  const [reanalyzedModel, setReanalyzedModel] = useState<AudioMetadataModel | null>(null);
  const [analysisStats, setAnalysisStats] = useState<AnalysisSummaryStats | null>(null);

  // Result data
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [outputFilename, setOutputFilename] = useState<string>("");
  const [validationResult, setValidationResult] = useState<AudioValidationResult | null>(null);
  const [diffList, setDiffList] = useState<BeforeAfterItem[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);

  // 1. FILE SELECTION & AUTOMATIC ANALYSIS (REQUIREMENT 2)
  const handleFileSelected = async (file: File) => {
    setErrorMessage(null);
    setLoadingStatus("ANALISANDO ARQUIVO...");
    setCurrentState("reading");

    try {
      // 1. Magic bytes validation
      const magicResult = await checkAudioMagicBytes(file);

      if (!magicResult.isValidAudio && magicResult.detectedFormat === "UNKNOWN") {
        setErrorMessage(
          "Não foi possível identificar uma assinatura válida de áudio no arquivo selecionado."
        );
        setCurrentState("idle");
        return;
      }

      // 2. Read Metadata locally
      setLoadingStatus("EXTRAINDO METADADOS, CAPAS E TAGS TÉCNICAS...");
      const model = await readAudioMetadata(file);

      // 3. Compute analysis summary stats
      const stats = computeAnalysisSummaryStats(model);

      setSelectedFile(file);
      setInitialModel(model);
      setWorkingModel(model);
      setAnalysisStats(stats);
      setCurrentState("analyzed");
    } catch (err: any) {
      console.error("Erro ao ler áudio:", err);
      setErrorMessage(err?.message || "Ocorreu um erro ao analisar o arquivo de áudio.");
      setCurrentState("idle");
    }
  };

  // 2. EXECUTE CLEANING WITH REANALYSIS (REQUIREMENT 14, 15, 16)
  const handleExecuteClean = async (options: CleanOptions) => {
    if (!selectedFile || !workingModel) return;

    setErrorMessage(null);
    setLoadingStatus("PROCESSANDO LIMPEZA LOSSLESS DOS METADADOS...");
    setCurrentState("saving");

    try {
      // Prepare model for clean
      const cleanedModel: AudioMetadataModel = options.wipeAll
        ? {
            ...workingModel,
            title: "",
            artist: "",
            album: "",
            albumArtist: "",
            composer: "",
            performer: "",
            author: "",
            genre: "",
            year: "",
            trackNumber: "",
            totalTracks: "",
            discNumber: "",
            totalDiscs: "",
            copyright: "",
            publisher: "",
            isrc: "",
            bpm: "",
            key: "",
            language: "",
            comment: "",
            description: "",
            subtitle: "",
            lyrics: "",
            grouping: "",
            mood: "",
            encoderSettings: "",
            software: "",
            encoder: "",
            encodedBy: "",
            writingLibrary: "",
            application: "",
            tool: "",
            vendor: "",
            creationTime: "",
            modificationTime: "",
            originalFilename: "",
            copyrightMessage: "",
            encoderDelay: "",
            padding: "",
            replayGain: "",
            loudness: "",
            peak: "",
            gaplessInfo: "",
            privateFramesCount: 0,
            ufid: "",
            popularimeter: "",
            chapterMarkers: "",
            timestamps: "",
            cover: null,
            id3Frames: [],
            rawTagsList: [],
            rawTags: {}
          }
        : {
            ...workingModel,
            title: options.removeMainMetadata ? "" : workingModel.title,
            artist: options.removeMainMetadata ? "" : workingModel.artist,
            album: options.removeMainMetadata ? "" : workingModel.album,
            cover: options.removeCover ? null : workingModel.cover,
            comment: options.removeComments ? "" : workingModel.comment,
            encoder: options.removeSoftwareEncoder ? "" : workingModel.encoder,
            software: options.removeSoftwareEncoder ? "" : workingModel.software,
            lyrics: options.removeLyrics ? "" : workingModel.lyrics,
            copyright: options.removeCopyright ? "" : workingModel.copyright,
            rawTagsList: options.removeTechnicalTags ? [] : workingModel.rawTagsList,
            rawTags: options.removeTechnicalTags ? {} : workingModel.rawTags
          };

      // 1. Lossless Write
      const newBlob = await writeAudioMetadata(selectedFile, cleanedModel, options);

      // 2. REANALYZE GENERATED FILE (REQUIREMENT 16)
      const newFile = new File([newBlob], selectedFile.name, { type: newBlob.type });
      const postModel = await readAudioMetadata(newFile);

      // 3. Audit and diff
      const audit = await validateMetadataResult(selectedFile, workingModel, newBlob, postModel);

      // 4. Output filename
      const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf(".")) || selectedFile.name;
      const cleanOutputName = `${baseName}-limpo.${workingModel.format.toLowerCase()}`;

      setProcessedBlob(newBlob);
      setOutputFilename(cleanOutputName);
      setReanalyzedModel(postModel);
      setValidationResult(audit.validation);
      setDiffList(audit.diffList);
      setProcessingStats(audit.stats);
      setCurrentState("result");
    } catch (err: any) {
      console.error("Erro ao limpar metadados:", err);
      setErrorMessage(err?.message || "Falha ao limpar metadados do arquivo.");
      setCurrentState("analyzed");
    }
  };

  // 3. EXECUTE EDITING WITH REANALYSIS (REQUIREMENT 18, 19, 20)
  const handleExecuteSaveEdit = async (updatedModel: AudioMetadataModel, finalFilename: string) => {
    if (!selectedFile) return;

    setErrorMessage(null);
    setLoadingStatus("GRAVANDO NOVOS METADADOS NO ARQUIVO...");
    setCurrentState("saving");

    try {
      // 1. Write metadata losslessly
      const newBlob = await writeAudioMetadata(selectedFile, updatedModel);

      // 2. REANALYZE GENERATED FILE (REQUIREMENT 16)
      const newFile = new File([newBlob], finalFilename, { type: newBlob.type });
      const postModel = await readAudioMetadata(newFile);

      // 3. Audit and diff
      const audit = await validateMetadataResult(selectedFile, initialModel || updatedModel, newBlob, postModel);

      setProcessedBlob(newBlob);
      setOutputFilename(finalFilename);
      setReanalyzedModel(postModel);
      setValidationResult(audit.validation);
      setDiffList(audit.diffList);
      setProcessingStats(audit.stats);
      setCurrentState("result");
    } catch (err: any) {
      console.error("Erro ao salvar metadados:", err);
      setErrorMessage(err?.message || "Falha ao salvar metadados no arquivo.");
      setCurrentState("analyzed");
    }
  };

  const handleReset = () => {
    setCurrentState("idle");
    setSelectedFile(null);
    setInitialModel(null);
    setWorkingModel(null);
    setReanalyzedModel(null);
    setAnalysisStats(null);
    setProcessedBlob(null);
    setValidationResult(null);
    setDiffList([]);
    setProcessingStats(null);
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 space-y-6">
      {/* 1. UPLOADER (IDLE / READING) */}
      {(currentState === "idle" || currentState === "reading") && (
        <MetadataUploader
          onFileSelected={handleFileSelected}
          isLoading={currentState === "reading"}
          loadingStatus={loadingStatus}
          errorMessage={errorMessage}
        />
      )}

      {/* 2. FULL ANALYSIS VIEW (ANALYZED STATE - REQUIREMENT 2 & 25) */}
      {workingModel && analysisStats && currentState === "analyzed" && (
        <MetadataFullAnalysisView
          model={workingModel}
          stats={analysisStats}
          onCleanClick={() => setCurrentState("cleaning")}
          onEditClick={() => setCurrentState("editing")}
          onResetClick={handleReset}
          onRemoveCoverClick={() => {
            setWorkingModel({ ...workingModel, cover: null });
          }}
          onReplaceCoverClick={() => setCurrentState("editing")}
        />
      )}

      {/* 3. CONFIRMATION CLEANER VIEW (CLEANING STATE - REQUIREMENT 14) */}
      {workingModel && analysisStats && currentState === "cleaning" && (
        <MetadataCleaner
          model={workingModel}
          stats={analysisStats}
          onSubmitClean={handleExecuteClean}
          onCancel={() => setCurrentState("analyzed")}
        />
      )}

      {/* 4. EDITOR FORM VIEW (EDITING STATE - REQUIREMENT 18, 19, 20) */}
      {workingModel && currentState === "editing" && (
        <MetadataEditorForm
          model={workingModel}
          onSubmitSave={handleExecuteSaveEdit}
          onCancel={() => setCurrentState("analyzed")}
        />
      )}

      {/* 5. SAVING / PROCESSING LOADING STATE */}
      {currentState === "saving" && (
        <div className="p-12 bg-white border border-[#E2E8F0] rounded-3xl text-center space-y-4 my-8 shadow-sm">
          <div className="w-12 h-12 border-4 border-[#0284C7] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-extrabold text-[#0284C7]">{loadingStatus}</p>
          <p className="text-xs text-[#475569]">Aguarde enquanto o novo arquivo é reanalisado e verificado...</p>
        </div>
      )}

      {/* 6. RESULT & DOWNLOAD VIEW (RESULT STATE - REQUIREMENT 16, 17, 20) */}
      {currentState === "result" && processedBlob && validationResult && processingStats && initialModel && reanalyzedModel && (
        <MetadataResultView
          processedBlob={processedBlob}
          outputFilename={outputFilename}
          initialModel={initialModel}
          reanalyzedModel={reanalyzedModel}
          stats={processingStats}
          validation={validationResult}
          diffList={diffList}
          onEditAgain={() => setCurrentState("editing")}
          onProcessAnother={handleReset}
        />
      )}
    </div>
  );
};

export default AudioMetadataStudio;
