/**
 * AUDIO FORENSICS CLEAN STUDIO (V2)
 * Interface Oficial do Motor Canônico AudioForensicsEngine.
 * Separação estrita: Estrutura Técnica | Metadata Editável | Proveniência | Assinaturas de Software | Prova de Integridade
 */

import React, { useState, useRef } from "react";
import {
  Upload,
  Sparkles,
  Trash2,
  Save,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Music,
  FileAudio,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Sliders,
  Copy,
  Hash,
  Activity,
  Terminal,
  Clock,
  Fingerprint,
  User,
  Disc,
  Calendar,
  Tag,
  FileText,
  Globe,
  Image as ImageIcon,
  ArrowDownCircle,
  Zap,
  Star
} from "lucide-react";
import { HeroV2 } from "../../components/HeroV2";
import { BenefitsBarV2 } from "../../components/BenefitsBarV2";
import { MetadataHeroV2 } from "./components/MetadataHeroV2";
import { MetadataDropzoneCardV2 } from "./components/MetadataDropzoneCardV2";
import { MetadataFeatureGridV2 } from "./components/MetadataFeatureGridV2";
import { MetadataHighlightBannerV2 } from "./components/MetadataHighlightBannerV2";
import { MetadataDifferentialsV2 } from "./components/MetadataDifferentialsV2";
import {
  AudioForensicsEngine,
  AudioForensicsResult,
  CleanExecutionResult,
  EditableMetadata,
  ForensicsAnalysisState,
  ForensicsItemClassification,
} from "./forensics";

interface AudioMetadataV2Props {
  onBack?: () => void;
}

export const AudioMetadataV2: React.FC<AudioMetadataV2Props> = ({ onBack }) => {
  // Estados dos Arquivos (Separação estrita de proveniência)
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cleanedFile, setCleanedFile] = useState<File | null>(null);
  const [finalEditedFile, setFinalEditedFile] = useState<File | null>(null);

  // Estados de Análise
  const [analysis, setAnalysis] = useState<AudioForensicsResult | null>(null);
  const [cleanResult, setCleanResult] = useState<CleanExecutionResult | null>(null);
  const [savedProofResult, setSavedProofResult] = useState<{
    title?: string;
    artist?: string;
    album?: string;
    year?: string;
    genre?: string;
    fileSha256: string;
    audioSha256: string;
  } | null>(null);

  // Estados de UI e Processamento
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [showChunksDump, setShowChunksDump] = useState(false);
  const [showTechnicalStructures, setShowTechnicalStructures] = useState(false);

  // Refs de controle de navegação e foco
  const runIdRef = useRef<number>(0);
  const metadataEditorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Capa / Artwork
  const [coverArt, setCoverArt] = useState<{
    dataUrl: string;
    mimeType: string;
    format: string;
    sizeBytes: number;
    width?: number;
    height?: number;
    file?: File;
  } | null>(null);

  // Formulário de Novos Metadados
  const [editForm, setEditForm] = useState<{
    title: string;
    artist: string;
    album: string;
    albumArtist: string;
    composer: string;
    genre: string;
    year: string;
    trackNumber: string;
    discNumber: string;
    isrc: string;
    bpm: string;
    publisher: string;
    copyright: string;
    comment: string;
    lyrics: string;
  }>({
    title: "",
    artist: "",
    album: "",
    albumArtist: "",
    composer: "",
    genre: "",
    year: "",
    trackNumber: "",
    discNumber: "",
    isrc: "",
    bpm: "",
    publisher: "",
    copyright: "",
    comment: "",
    lyrics: "",
  });

  const resetAll = () => {
    runIdRef.current += 1;
    setOriginalFile(null);
    setCleanedFile(null);
    setFinalEditedFile(null);
    setAnalysis(null);
    setCleanResult(null);
    setSavedProofResult(null);
    setErrorMessage(null);
    setShowChunksDump(false);
    setCoverArt(null);
    setEditForm({
      title: "",
      artist: "",
      album: "",
      albumArtist: "",
      composer: "",
      genre: "",
      year: "",
      trackNumber: "",
      discNumber: "",
      isrc: "",
      bpm: "",
      publisher: "",
      copyright: "",
      comment: "",
      lyrics: "",
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    resetAll();
    const currentRun = ++runIdRef.current;
    setIsAnalyzing(true);
    setOriginalFile(file);

    try {
      const res = await AudioForensicsEngine.analyze(file);
      if (currentRun !== runIdRef.current) return;
      setAnalysis(res);
    } catch (err: any) {
      if (currentRun !== runIdRef.current) return;
      setErrorMessage(err?.message || "Erro desconhecido ao analisar o arquivo.");
    } finally {
      if (currentRun === runIdRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleClean = async () => {
    const fileToClean = originalFile;
    if (!fileToClean) return;

    setIsCleaning(true);
    setErrorMessage(null);

    try {
      const result = await AudioForensicsEngine.clean(fileToClean);
      setCleanResult(result);
      setCleanedFile(result.cleanedFile);
      setFinalEditedFile(null); // Reset versão anterior editada caso re-limpe
      setSavedProofResult(null);
      setAnalysis(result.cleanedResult);
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha ao executar limpeza forense do arquivo.");
    } finally {
      setIsCleaning(false);
    }
  };

  const handlePersonalizeMetadata = () => {
    requestAnimationFrame(() => {
      metadataEditorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 350);
    });
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          setCoverArt({
            dataUrl,
            mimeType: file.type || "image/jpeg",
            format: file.type.split("/")[1] || "jpeg",
            sizeBytes: file.size,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            file,
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleSaveNewMetadata = async () => {
    if (!cleanedFile) {
      setErrorMessage("Execute primeiro a limpeza/reconstrução. Novos metadados só podem ser gravados sobre o arquivo limpo.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload: EditableMetadata = {
        title: editForm.title.trim() || undefined,
        artist: editForm.artist.trim() || undefined,
        album: editForm.album.trim() || undefined,
        composer: editForm.composer.trim() || undefined,
        genre: editForm.genre.trim() || undefined,
        year: editForm.year.trim() || undefined,
        trackNumber: editForm.trackNumber.trim() || undefined,
        isrc: editForm.isrc.trim() || undefined,
        bpm: editForm.bpm.trim() || undefined,
        publisher: editForm.publisher.trim() || undefined,
        copyright: editForm.copyright.trim() || undefined,
        comment: editForm.comment.trim() || undefined,
      };

      if (coverArt?.file) {
        payload.coverArtBlob = coverArt.file;
        payload.coverArtMime = coverArt.mimeType;
      }

      // Gravação estrita sobre a base do cleanedFile
      const updatedFile = await AudioForensicsEngine.writeNewMetadata(cleanedFile, payload);
      setFinalEditedFile(updatedFile);

      // Reanálise DO ZERO do arquivo final gerado
      const reAnalysis = await AudioForensicsEngine.analyze(updatedFile);
      setAnalysis(reAnalysis);

      setSavedProofResult({
        title: editForm.title || undefined,
        artist: editForm.artist || undefined,
        album: editForm.album || undefined,
        year: editForm.year || undefined,
        genre: editForm.genre || undefined,
        fileSha256: reAnalysis.identity.fileSha256,
        audioSha256: reAnalysis.integrity.audioPayloadSha256,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || "Erro ao gravar novos metadados no arquivo limpo.");
    } finally {
      setIsSaving(false);
    }
  };

  // Download do Arquivo Limpo Puro (cleanedFile)
  const handleDownloadClean = () => {
    if (!cleanedFile) return;
    const url = URL.createObjectURL(cleanedFile);
    const a = document.createElement("a");
    a.href = url;
    const baseName = cleanedFile.name.replace(/\.[^/.]+$/, "");
    const ext = cleanedFile.name.split(".").pop() || "wav";
    a.download = `${baseName}_clean.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download do Arquivo com Meus Metadados (finalEditedFile)
  const handleDownloadEdited = () => {
    if (!finalEditedFile) return;
    const url = URL.createObjectURL(finalEditedFile);
    const a = document.createElement("a");
    a.href = url;
    
    const rawTitle = (editForm.title || "").trim();
    const ext = finalEditedFile.name.split(".").pop() || "wav";
    let downloadName: string;

    if (rawTitle) {
      // Sanitizar SOMENTE caracteres inválidos no SO: < > : " / \ | ? *
      // Preserva integralmente acentos: á é í ó ú ã õ â ê ô ç Á É Í Ó Ú Ã Õ Â Ê Ô Ç etc.
      const sanitized = rawTitle.replace(/[<>:"/\\|?*]/g, "").trim();
      downloadName = sanitized ? `${sanitized}.${ext}` : finalEditedFile.name;
    } else {
      const baseName = finalEditedFile.name.replace(/\.[^/.]+$/, "");
      downloadName = `${baseName}_meus_metadados.${ext}`;
    }

    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const metadataBenefits = [
    {
      title: "100% Privado",
      description: "Inspeção e reconstrução 100% no seu navegador sem envio a servidores.",
      icon: <ShieldCheck className="w-5 h-5 text-[#1D68F2]" />,
      iconBg: "bg-[#EFF6FF] border-[#BFDBFE]"
    },
    {
      title: "Remoção de IA",
      description: "Elimina marcas ocultas de geradores como Suno, Udio e ElevenLabs.",
      icon: <Sparkles className="w-5 h-5 text-[#8B5CF6]" />,
      iconBg: "bg-[#F5F3FF] border-[#DDD6FE]"
    },
    {
      title: "Preservação Bit-a-Bit",
      description: "O payload de áudio PCM/MPEG original permanece intacto sem re-encoding.",
      icon: <CheckCircle2 className="w-5 h-5 text-[#059669]" />,
      iconBg: "bg-[#ECFDF5] border-[#A7F3D0]"
    },
    {
      title: "Tags ID3v2 & RIFF",
      description: "Insira título, artista, ISRC, BPM, capa e créditos canônicos.",
      icon: <Sliders className="w-5 h-5 text-[#06B6D4]" />,
      iconBg: "bg-[#ECFEFF] border-[#A5F3FC]"
    },
    {
      title: "Prova Criptográfica",
      description: "Validação matemática de integridade com hashes SHA-256 independentes.",
      icon: <Fingerprint className="w-5 h-5 text-[#EC4899]" />,
      iconBg: "bg-[#FDF2F8] border-[#FBCFE8]"
    }
  ];

  return (
    <div className="space-y-8 md:space-y-10 font-sans text-slate-800 dark:text-slate-100" id="v2-audio-metadata-module">
      {/* Unified Hero Section */}
      <MetadataHeroV2 onBack={onBack} />

      {/* Header Forense de Arquivo Ativo */}
      {originalFile && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-[#E4ECF7] dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1D68F2] flex items-center justify-center font-bold">
              <FileAudio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0B1F44] dark:text-white truncate max-w-xs sm:max-w-md">
                {originalFile.name}
              </h3>
              <p className="text-xs text-[#64748B]">
                {formatFileSize(originalFile.size)} • Pronto para análise e limpeza
              </p>
            </div>
          </div>
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1D68F2] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-xl transition-colors cursor-pointer border border-[#BFDBFE]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Novo Arquivo</span>
          </button>
        </div>
      )}

      {/* Zona de Upload e Grid de Benefícios */}
      {!analysis && !isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6 h-full">
            <MetadataDropzoneCardV2 onFileSelected={handleFileSelect} disabled={isAnalyzing} />
          </div>
          <div className="lg:col-span-6 h-full">
            <MetadataFeatureGridV2 />
          </div>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="border border-[#E4ECF7] rounded-[24px] p-12 text-center bg-white shadow-xs flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-9 h-9 text-[#1D68F2] animate-spin" />
          <div>
            <h3 className="text-base font-extrabold text-[#0B1F44]">Executando Auditoria Forense Linear...</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Validando cabeçalhos de container, mapa de chunks, blocos de metadados e assinaturas de encoder.
            </p>
          </div>
        </div>
      )}

      {/* Erro */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Aviso de Operação</h4>
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Painel Principal de Análise */}
      {analysis && !isAnalyzing && (
        <div className="space-y-6">
          {/* 1. Banner de Status Forense Canônico */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              analysis.analysisState === ForensicsAnalysisState.CLEANED_AND_VERIFIED ||
              analysis.analysisState === ForensicsAnalysisState.PREVIOUSLY_CLEANED_BY_TOOL
                ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                : analysis.analysisState === ForensicsAnalysisState.PARTIAL_CLEAN
                ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                : "bg-slate-100/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {analysis.analysisState === ForensicsAnalysisState.CLEANED_AND_VERIFIED ||
                analysis.analysisState === ForensicsAnalysisState.PREVIOUSLY_CLEANED_BY_TOOL ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : analysis.analysisState === ForensicsAnalysisState.PARTIAL_CLEAN ? (
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                      {analysis.analysisState}
                    </span>
                    <h3 className="font-bold text-base">{analysis.stateDescription}</h3>
                  </div>
                  <p className="text-xs opacity-80 mt-1">
                    Arquivo: <span className="font-mono">{analysis.identity.fileName}</span> ({formatFileSize(analysis.identity.fileSize)}) | Formato: {analysis.technical.container}
                  </p>
                </div>
              </div>

              {/* Botões de Ação Imediata */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {!cleanResult ? (
                  <button
                    onClick={handleClean}
                    disabled={isCleaning}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isCleaning ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Limpar / Reconstruir Áudio
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* OPÇÃO A: Baixar Áudio Limpo */}
                    <button
                      onClick={handleDownloadClean}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
                      title="Baixar áudio 100% puro sem nenhum metadado opcional"
                    >
                      <Download className="w-4 h-4" />
                      Baixar Áudio Limpo
                    </button>

                    {/* OPÇÃO B: Personalizar Metadados */}
                    <button
                      onClick={handlePersonalizeMetadata}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer"
                      title="Rola a página e foca o editor de metadados"
                    >
                      <Sliders className="w-4 h-4" />
                      Personalizar Metadados
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Grid de Métricas Forenses */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Metadados Editáveis</span>
              <div className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">
                {analysis.embeddedMetadata.filter((m) => m.classification === ForensicsItemClassification.EDITABLE_METADATA).length}
              </div>
              <span className="text-[11px] text-slate-400">Tags comerciais/autorais</span>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Proveniência / IA</span>
              <div
                className={`text-xl font-bold mt-1 ${
                  analysis.provenance.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-slate-100"
                }`}
              >
                {analysis.provenance.length}
              </div>
              <span className="text-[11px] text-slate-400">Marcas de origem/geração</span>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Software / Muxer</span>
              <div
                className={`text-xl font-bold mt-1 ${
                  analysis.encoderSignatures.length > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-100"
                }`}
              >
                {analysis.encoderSignatures.length}
              </div>
              <span className="text-[11px] text-slate-400">Lavf, LAME, etc.</span>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estruturas Técnicas</span>
              <div className="text-sm font-bold mt-1.5 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                {analysis.analysisState === ForensicsAnalysisState.CLEANED_AND_VERIFIED ||
                analysis.analysisState === ForensicsAnalysisState.PREVIOUSLY_CLEANED_BY_TOOL ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>PRESERVADA</span>
                  </>
                ) : (
                  <span className="text-xl text-slate-800 dark:text-slate-100">
                    {(analysis.technicalStructures || []).length}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                {analysis.analysisState === ForensicsAnalysisState.CLEANED_AND_VERIFIED ||
                analysis.analysisState === ForensicsAnalysisState.PREVIOUSLY_CLEANED_BY_TOOL
                  ? "Xing/VBR necessário"
                  : "Xing/Info/VBR Header"}
              </span>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Container</span>
              <div className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">
                {analysis.containerStructure.isForensicallyMinimal ? "Mínimo" : `${analysis.containerStructure.totalChunksCount} Blocos`}
              </div>
              <span className="text-[11px] text-slate-400">{analysis.containerStructure.isForensicallyMinimal ? "Essencial puro" : "Blocos extras"}</span>
            </div>
          </div>

          {/* 3. Hashes Criptográficos de Integridade */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-sm">Hashes Criptográficos de Integridade (SHA-256)</h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <div className="overflow-hidden">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">SHA-256 do Arquivo Completo</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate block">{analysis.identity.fileSha256}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(analysis.identity.fileSha256, "fileSha")}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 ml-2 cursor-pointer"
                  title="Copiar Hash"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <div className="overflow-hidden">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">SHA-256 do Payload de Áudio (PCM/Float/MPEG)</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate block">{analysis.integrity.audioPayloadSha256 || "N/A"}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(analysis.integrity.audioPayloadSha256 || "", "audioSha")}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 ml-2 cursor-pointer"
                  title="Copiar Hash do Payload"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 4. Recibo Oficial de Limpeza & Seção de Removidos */}
          {analysis.cleanReceipt && (
            <div className="p-5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-semibold text-sm">Recibo Criptográfico Oficial de Limpeza</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Data de Verificação</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {new Date(analysis.cleanReceipt.verifiedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Versão do Cleaner</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{analysis.cleanReceipt.cleanerVersion}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Itens Removidos</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{analysis.cleanReceipt.removedItemsCount} itens</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Preservação de Áudio</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">100% Bit-a-Bit</span>
                </div>
              </div>

              {/* Lista Detalhada de Itens Removidos Nesta Limpeza */}
              {analysis.cleanReceipt.removedItems && analysis.cleanReceipt.removedItems.length > 0 && (
                <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider block">
                    Removidos Nesta Limpeza:
                  </span>
                  <div className="space-y-1.5">
                    {analysis.cleanReceipt.removedItems.map((rem, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{rem.key}</span>
                          <span className="text-slate-600 dark:text-slate-300">({rem.source})</span>
                          <span className="text-slate-500 font-mono text-[11px] truncate max-w-md">
                            {rem.rawValue || rem.value}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 shrink-0">
                          ELIMINADO
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Inventário Forense de Metadados e Proveniência (Duas Camadas) */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Inventário Forense de Metadados e Proveniência (Valor Bruto + Campos Interpretados)
              </h4>
              <span className="text-xs text-slate-500">
                Total: {analysis.embeddedMetadata.length + analysis.provenance.length + analysis.encoderSignatures.length + (analysis.unknownBlocks ? analysis.unknownBlocks.length : 0)} itens detectados
              </span>
            </div>

            {analysis.embeddedMetadata.length === 0 &&
            analysis.provenance.length === 0 &&
            analysis.encoderSignatures.length === 0 &&
            (!analysis.unknownBlocks || analysis.unknownBlocks.length === 0) ? (
              <div className="py-3 px-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    ✓ Nenhum metadado, proveniência ou assinatura de software restante no container.
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 opacity-90">
                    Todos os metadados opcionais foram eliminados. O arquivo contém apenas o payload sonoro puro e estruturas técnicas de stream essenciais.
                  </span>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
                {/* Proveniência / Suno / IA */}
                {analysis.provenance.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">{item.key}</span>
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 rounded text-[10px] font-semibold">
                            PROVENIÊNCIA / IA
                          </span>
                          <span className="text-slate-400">{item.source}</span>
                        </div>
                        {/* Camada 1: Valor Físico Bruto */}
                        <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">
                          <span className="text-slate-400 select-none block text-[9px] uppercase font-sans font-semibold mb-0.5">
                            Valor Físico Bruto (Raw String):
                          </span>
                          {item.rawValue || item.value}
                        </div>
                      </div>
                      {item.offset !== undefined && (
                        <span className="font-mono text-slate-400 shrink-0 text-xs">Offset: {item.offset}</span>
                      )}
                    </div>

                    {/* Camada 2: Campos Interpretados */}
                    {item.parsedFields && item.parsedFields.length > 0 && (
                      <div className="ml-2 pl-3 border-l-2 border-amber-400 dark:border-amber-600 space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Campos Interpretados Extraídos:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {item.parsedFields.map((pf, pIdx) => (
                            <div key={pIdx} className="p-1.5 bg-amber-50/50 dark:bg-amber-950/20 rounded border border-amber-200/50 dark:border-amber-800/40">
                              <span className="font-semibold text-slate-600 dark:text-slate-400 block text-[10px]">{pf.label}</span>
                              <span className="font-mono text-slate-800 dark:text-slate-200 break-all">{pf.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Assinaturas de Software / Encoder */}
                {analysis.encoderSignatures.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{item.key}</span>
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 rounded text-[10px] font-semibold">
                          SOFTWARE / ENCODER
                        </span>
                        <span className="text-slate-400">{item.source}</span>
                      </div>
                      <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">
                        {item.rawValue || item.value}
                      </div>
                      {item.details && (
                        <p className="text-[11px] text-slate-500 mt-1">{item.details}</p>
                      )}
                    </div>
                    {item.offset !== undefined && (
                      <span className="font-mono text-slate-400 shrink-0">Offset: {item.offset}</span>
                    )}
                  </div>
                ))}

                {/* Metadados Gerais */}
                {analysis.embeddedMetadata
                  .filter((m) => !analysis.provenance.some((p) => p.id === m.id))
                  .map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{item.key}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px]">
                            {item.classification}
                          </span>
                          <span className="text-slate-400">{item.source}</span>
                        </div>
                        <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60 font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all">
                          {item.rawValue || item.value}
                        </div>
                      </div>
                      {item.offset !== undefined && (
                        <span className="font-mono text-slate-400 shrink-0">Offset: {item.offset}</span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 6. Informações Técnicas */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Especificações Técnicas do Stream de Áudio
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Codec</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{analysis.technical.codec}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Taxa de Amostragem</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{analysis.technical.sampleRate} Hz</span>
              </div>
              <div>
                <span className="text-slate-500 block">Profundidade de Bits</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{analysis.technical.bitDepth} bits</span>
              </div>
              <div>
                <span className="text-slate-500 block">Canais</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{analysis.technical.channels === 1 ? "Mono (1.0)" : "Estéreo (2.0)"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Bitrate</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{analysis.technical.bitrate ? `${analysis.technical.bitrate} kbps` : "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Duração</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {analysis.technical.duration ? `${analysis.technical.duration.toFixed(2)} segundos` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Tamanho do Áudio Puro</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{formatFileSize(analysis.technical.payloadSize)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tipo de Áudio</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {analysis.technical.isPcmClassic ? "PCM Linear Clássico" : "Codificado / Float / Comprimido"}
                </span>
              </div>
            </div>
          </div>

          {/* 6.1 Seção Separada: Estruturas Técnicas Preservadas (Collapsible) */}
          {analysis.technicalStructures && analysis.technicalStructures.length > 0 && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <button
                onClick={() => setShowTechnicalStructures(!showTechnicalStructures)}
                className="w-full flex items-center justify-between text-left font-semibold text-sm cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Estruturas Técnicas Preservadas</span>
                  <span className="text-xs font-normal text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-mono">
                    {analysis.technicalStructures.length} {analysis.technicalStructures.length === 1 ? "estrutura" : "estruturas"}
                  </span>
                </div>
                {showTechnicalStructures ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {showTechnicalStructures && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Estruturas do stream necessárias ao funcionamento técnico do codec. Não constituem metadados autorais, não identificam IA, não identificam origem e foram mantidas para conformidade do áudio.
                  </p>
                  {analysis.technicalStructures.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-sm">{item.key}</span>
                          <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 rounded text-[10px] font-semibold uppercase">
                            Estrutura Técnica MPEG / VBR
                          </span>
                        </div>
                        {item.offset !== undefined && (
                          <span className="font-mono text-slate-400 text-xs shrink-0">Offset: {item.offset}</span>
                        )}
                      </div>

                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/50 dark:border-slate-700/50 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">
                        {item.rawValue || item.value}
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Motivo da preservação: </span>
                        {item.details || "Auxilia contagem de frames, cálculo exato de duração, índice de seek (TOC) e sincronismo MPEG."}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. Dump Físico de Chunks / Blocos (Dropdown) */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <button
              onClick={() => setShowChunksDump(!showChunksDump)}
              className="w-full flex items-center justify-between text-left font-semibold text-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-500" />
                <span>Dump Estrutural Linear de Chunks (RIFF/MPEG)</span>
                <span className="text-xs font-normal text-slate-500">({analysis.containerStructure.chunks.length} blocos mapeados)</span>
              </div>
              {showChunksDump ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showChunksDump && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 font-mono text-xs">
                {analysis.containerStructure.chunks.map((c, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-blue-600 dark:text-blue-400">CHUNK #{i + 1}: [{c.id}]</span>
                      <span className="text-slate-600 dark:text-slate-300 ml-2 font-sans font-medium text-[11px]">{c.description}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] shrink-0">
                      Offset: {c.offset} | Size: {c.size} bytes | Validade: {c.isValid ? "✓ OK" : "✗ INVÁLIDO"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 8. Análise de Conteúdo Sonoro */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <Info className="w-4 h-4 text-slate-500" />
              <span>{analysis.contentAnalysis.message}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 pl-6">{analysis.contentAnalysis.details}</p>
          </div>

          {/* 9. PROVA DE METADADOS GRAVADOS (Exibido quando novos metadados foram salvos) */}
          {savedProofResult && finalEditedFile && (
            <div className="p-5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 dark:border-purple-800/50 pb-3">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-bold text-sm">Metadados Gravados com Sucesso no Arquivo Limpo</h4>
                </div>
                <button
                  onClick={handleDownloadEdited}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Baixar Áudio com Meus Metadados
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Título:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{savedProofResult.title || "(Não informado)"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Artista:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{savedProofResult.artist || "(Não informado)"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Álbum:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{savedProofResult.album || "(Não informado)"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ano / Gênero:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {savedProofResult.year || "-"} / {savedProofResult.genre || "-"}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-purple-800 dark:text-purple-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Base limpa preservada: 0 marcas de proveniência anteriores detectadas após a gravação.</span>
              </div>
            </div>
          )}

          {/* 10. SEÇÃO OBRIGATÓRIA: EDITAR / INSERIR MEUS METADADOS (SEMPRE VISÍVEL) */}
          <div
            ref={metadataEditorRef}
            id="secao-editor-metadados"
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6 scroll-mt-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    EDITAR / INSERIR MEUS METADADOS
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preencha os campos abaixo com seus próprios dados autorais e comerciais.
                  </p>
                </div>
              </div>

              {cleanedFile && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200/50">
                  Pronto para Gravação
                </span>
              )}
            </div>

            {/* Aviso de Contexto / Requisito de Limpeza Prévia */}
            {!cleanedFile ? (
              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <span className="font-bold block mb-0.5">Aviso de Integridade Forense:</span>
                  Você pode preencher os campos abaixo antecipadamente. Para gravá-los, primeiro execute a
                  limpeza/reconstrução no topo da página. Os novos metadados serão gravados diretamente sobre a base limpa
                  do arquivo, garantindo 0 proveniência residual.
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <span className="font-bold block mb-0.5">Arquivo Limpo e Verificado:</span>
                  Agora você pode salvar seus próprios metadados. Eles serão injetados de forma canônica sobre o container
                  limpo.
                </div>
              </div>
            )}

            {/* Formulário Completo de Metadados */}
            <div className="space-y-6">
              {/* 1. Identificação Principal */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-500" />
                  1. Identificação da Faixa & Álbum
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Título da Faixa / Música *
                    </label>
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Ex: Minha Canção"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Artista / Intérprete Principal
                    </label>
                    <input
                      type="text"
                      value={editForm.artist}
                      onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                      placeholder="Ex: Nome do Artista"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Álbum / Projeto
                    </label>
                    <input
                      type="text"
                      value={editForm.album}
                      onChange={(e) => setEditForm({ ...editForm, album: e.target.value })}
                      placeholder="Ex: Álbum ou Single"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Artista do Álbum
                    </label>
                    <input
                      type="text"
                      value={editForm.albumArtist}
                      onChange={(e) => setEditForm({ ...editForm, albumArtist: e.target.value })}
                      placeholder="Ex: Artista ou Vários"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Ano de Lançamento
                    </label>
                    <input
                      type="text"
                      value={editForm.year}
                      onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                      placeholder="Ex: 2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Gênero Musical
                    </label>
                    <input
                      type="text"
                      value={editForm.genre}
                      onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                      placeholder="Ex: Sertanejo, Pop, MPB, Rock"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Créditos & Dados Técnicos */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                  2. Créditos, Direitos & ISRC
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Nº da Faixa
                    </label>
                    <input
                      type="text"
                      value={editForm.trackNumber}
                      onChange={(e) => setEditForm({ ...editForm, trackNumber: e.target.value })}
                      placeholder="Ex: 1"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Nº do Disco
                    </label>
                    <input
                      type="text"
                      value={editForm.discNumber}
                      onChange={(e) => setEditForm({ ...editForm, discNumber: e.target.value })}
                      placeholder="Ex: 1"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Compositor(es)
                    </label>
                    <input
                      type="text"
                      value={editForm.composer}
                      onChange={(e) => setEditForm({ ...editForm, composer: e.target.value })}
                      placeholder="Ex: Nome do Compositor"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Código ISRC
                    </label>
                    <input
                      type="text"
                      value={editForm.isrc}
                      onChange={(e) => setEditForm({ ...editForm, isrc: e.target.value })}
                      placeholder="Ex: BR-XXX-26-00001"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      BPM (Andamento)
                    </label>
                    <input
                      type="text"
                      value={editForm.bpm}
                      onChange={(e) => setEditForm({ ...editForm, bpm: e.target.value })}
                      placeholder="Ex: 128"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Editora / Publisher
                    </label>
                    <input
                      type="text"
                      value={editForm.publisher}
                      onChange={(e) => setEditForm({ ...editForm, publisher: e.target.value })}
                      placeholder="Ex: Gravadora / Selo"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Copyright / Direitos Reservados
                    </label>
                    <input
                      type="text"
                      value={editForm.copyright}
                      onChange={(e) => setEditForm({ ...editForm, copyright: e.target.value })}
                      placeholder="Ex: © 2026 Todos os direitos reservados"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Textos, Letra e Notas */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  3. Comentários & Letra da Música
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Comentário Adicional
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.comment}
                      onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                      placeholder="Observações adicionais ou notas de produção..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Letra da Música (Lyrics)
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.lyrics}
                      onChange={(e) => setEditForm({ ...editForm, lyrics: e.target.value })}
                      placeholder="Cole a letra completa da faixa aqui..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-[11px] text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Capa do Álbum / Artwork */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                  4. Capa do Álbum / Artwork
                </h4>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                    {coverArt?.dataUrl ? (
                      <img src={coverArt.dataUrl} alt="Capa" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 text-xs space-y-2 w-full text-center sm:text-left">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {coverArt ? "Capa Selecionada" : "Nenhuma Capa Inserida"}
                      </span>
                      <span className="text-slate-500">
                        {coverArt
                          ? `${coverArt.mimeType} (${(coverArt.sizeBytes / 1024).toFixed(1)} KB)`
                          : "Formatos recomendados: JPG ou PNG (resolução quadrada)"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <input
                        ref={coverFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={handleCoverUpload}
                      />
                      <button
                        onClick={() => coverFileInputRef.current?.click()}
                        type="button"
                        className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 rounded-lg font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        {coverArt ? "Alterar Capa" : "Carregar Capa"}
                      </button>
                      {coverArt && (
                        <button
                          onClick={() => setCoverArt(null)}
                          type="button"
                          className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de Ações do Formulário */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500">
                  {!cleanedFile ? (
                    <span>⚠️ Salvar fica habilitado assim que a limpeza for executada.</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Pronto para gravar sobre o arquivo limpo.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!cleanedFile ? (
                    <button
                      disabled
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed"
                      title="Primeiro execute a limpeza no topo da página"
                    >
                      <Save className="w-4 h-4" />
                      LIMPE PRIMEIRO PARA SALVAR
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveNewMetadata}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      SALVAR MEUS METADADOS
                    </button>
                  )}

                  {finalEditedFile && (
                    <button
                      onClick={handleDownloadEdited}
                      className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Baixar Áudio com Meus Metadados
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faixa de Destaque & 5 Diferenciais */}
      <div className="space-y-4 pt-2">
        <MetadataHighlightBannerV2 />
        <MetadataDifferentialsV2 />
      </div>
    </div>
  );
};

export default AudioMetadataV2;

