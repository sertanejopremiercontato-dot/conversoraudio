import React, { useState, useEffect, useRef } from "react";
import { ImageMetadataHero } from "./components/ImageMetadataHero";
import { ImageMetadataUploadZone } from "./components/ImageMetadataUploadZone";
import { ImageMetadataPreviewCard } from "./components/ImageMetadataPreviewCard";
import { ImageMetadataInventory } from "./components/ImageMetadataInventory";
import { ImageMetadataCleanCard } from "./components/ImageMetadataCleanCard";
import { ImageMetadataEditorCard } from "./components/ImageMetadataEditorCard";
import {
  ImageMetadataAnalysisResult,
  ImageCleanReport,
  ImageWriteResult,
  ImageMetadataEditForm
} from "./types";
import { ImageMetadataReader } from "./services/imageMetadataReader";
import { ImageMetadataCleaner } from "./services/imageMetadataCleaner";
import { ImageMetadataWriter } from "./services/imageMetadataWriter";
import { JpegMetadataAdapter } from "./adapters/JpegMetadataAdapter";
import { computeImageSha256 } from "./services/imageMetadataVerifier";

interface ImageMetadataStudioV2Props {
  onBack?: () => void;
}

export const ImageMetadataStudioV2: React.FC<ImageMetadataStudioV2Props> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageMetadataAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanReport, setCleanReport] = useState<ImageCleanReport | null>(null);

  const [isWriting, setIsWriting] = useState(false);
  const [writeResult, setWriteResult] = useState<ImageWriteResult | null>(null);

  const operationIdRef = useRef<number>(0);

  const [editForm, setEditForm] = useState<ImageMetadataEditForm>({
    title: "",
    artist: "",
    description: "",
    copyright: "",
    keywords: "",
    comment: "",
    creationDate: ""
  });

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = async (file: File) => {
    operationIdRef.current++;
    const opId = operationIdRef.current;

    try {
      setIsAnalyzing(true);
      setCleanReport(null);
      setWriteResult(null);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);

      const result = await ImageMetadataReader.analyze(file);
      if (opId !== operationIdRef.current) return;
      setAnalysis(result);

      // Pre-fill fields from original if detected
      const findVal = (keyPattern: string) => {
        const item = result.items.find(i => i.key.toLowerCase().includes(keyPattern) || i.label.toLowerCase().includes(keyPattern));
        return item ? item.value : "";
      };

      setEditForm({
        title: findVal("title") || findVal("objectname") || "",
        artist: findVal("artist") || findVal("creator") || findVal("author") || findVal("byline") || "",
        description: findVal("description") || findVal("caption") || "",
        copyright: findVal("copyright") || "",
        keywords: findVal("keyword") || findVal("subject") || "",
        comment: findVal("comment") || findVal("usercomment") || "",
        creationDate: findVal("datetime") || findVal("createdate") || ""
      });
    } catch (err) {
      console.error("Erro ao analisar imagem:", err);
    } finally {
      if (opId === operationIdRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleClean = async () => {
    if (!selectedFile || !analysis) return;
    operationIdRef.current++;
    const opId = operationIdRef.current;

    try {
      setIsCleaning(true);
      const report = await ImageMetadataCleaner.clean(selectedFile, analysis);
      if (opId !== operationIdRef.current) return;
      setCleanReport(report);
    } catch (err) {
      console.error("Erro ao limpar imagem:", err);
    } finally {
      if (opId === operationIdRef.current) {
        setIsCleaning(false);
      }
    }
  };

  const handleWrite = async () => {
    if (!selectedFile || !analysis) return;
    operationIdRef.current++;
    const opId = operationIdRef.current;

    try {
      setIsWriting(true);
      setWriteResult(null); // Invalidar imediatamente resultado anterior

      // REGRA DE OURO: A gravação deve SEMPRE utilizar a versão limpa como base.
      let baseCleanFile: File;
      if (cleanReport?.cleanedFile) {
        baseCleanFile = cleanReport.cleanedFile;
      } else {
        const report = await ImageMetadataCleaner.clean(selectedFile, analysis);
        if (opId !== operationIdRef.current) return;
        setCleanReport(report);
        baseCleanFile = report.cleanedFile;
      }

      const result = await ImageMetadataWriter.write(baseCleanFile, editForm, selectedFile.name);
      if (opId !== operationIdRef.current) return;
      setWriteResult(result);
    } catch (err) {
      console.error("Erro ao gravar metadados:", err);
    } finally {
      if (opId === operationIdRef.current) {
        setIsWriting(false);
      }
    }
  };

  const handleDownloadClean = async () => {
    if (!cleanReport?.cleanedFile) return;
    const file = cleanReport.cleanedFile;
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const sha = await computeImageSha256(bytes);

    // Contagem física direta de chunks
    let itxtCount = 0;
    if (bytes.length > 8) {
      let offset = 8;
      while (offset + 8 <= bytes.length) {
        const len = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
        const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
        if (type === "iTXt") itxtCount++;
        offset += 12 + len;
      }
    }

    console.log("=== CLICKED_BUTTON: CLEAN ===");
    console.log("CLICK_SOURCE_SHA:", sha);
    console.log("CLICK_SOURCE_SIZE:", bytes.length);
    console.log("CLICK_SOURCE_iTXt:", itxtCount);

    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 3000);
  };

  const handleDownloadEdited = async (file: File) => {
    if (!file) {
      throw new Error("finalEditedFile ausente");
    }

    // 1. Capturar os bytes UMA ÚNICA VEZ diretamente do File recebido
    const sourceBuffer = await file.arrayBuffer();
    const sourceBytes = new Uint8Array(sourceBuffer);

    // 2. Validar assinatura de segurança se for PNG
    if (file.name.toLowerCase().endsWith(".png")) {
      const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      for (let i = 0; i < 8; i++) {
        if (sourceBytes[i] !== pngSig[i]) {
          throw new Error("DOWNLOAD ABORTADO: assinatura PNG corrompida.");
        }
      }
    }

    // 3. Calcular SHA diretamente desses bytes
    const sha = await computeImageSha256(sourceBytes);

    // Contagem física direta de chunks
    let itxtCount = 0;
    if (sourceBytes.length > 8) {
      let offset = 8;
      while (offset + 8 <= sourceBytes.length) {
        const len = (sourceBytes[offset] << 24) | (sourceBytes[offset + 1] << 16) | (sourceBytes[offset + 2] << 8) | sourceBytes[offset + 3];
        const type = String.fromCharCode(sourceBytes[offset + 4], sourceBytes[offset + 5], sourceBytes[offset + 6], sourceBytes[offset + 7]);
        if (type === "iTXt") itxtCount++;
        offset += 12 + len;
      }
    }

    console.log("=== CLICKED_BUTTON: EDITED ===");
    console.log("CLICK_SOURCE_SHA:", sha);
    console.log("CLICK_SOURCE_SIZE:", sourceBytes.length);
    console.log("CLICK_SOURCE_iTXt:", itxtCount);

    // 6. Criar o objeto de download APENAS desses bytes validados
    const downloadFile = new File(
      [sourceBytes],
      file.name,
      {
        type: file.type || "image/png",
        lastModified: file.lastModified || Date.now()
      }
    );

    // 7. Calcular SHA do downloadFile novamente para conferência rigorosa
    const downloadBuffer = await downloadFile.arrayBuffer();
    const downloadSha = await computeImageSha256(new Uint8Array(downloadBuffer));

    if (sha !== downloadSha) {
      throw new Error("DOWNLOAD ABORTADO: bytes divergentes entre fonte e objeto de download.");
    }

    // 8. Iniciar download com revogação segura e atrasada (3000ms)
    const url = URL.createObjectURL(downloadFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 3000);
  };

  const handlePrefillFromOriginal = () => {
    if (!analysis) return;
    const findVal = (keyPattern: string) => {
      const item = analysis.items.find(i => i.key.toLowerCase().includes(keyPattern) || i.label.toLowerCase().includes(keyPattern));
      return item ? item.value : "";
    };

    setEditForm({
      title: findVal("title") || findVal("objectname") || "",
      artist: findVal("artist") || findVal("creator") || findVal("author") || findVal("byline") || "",
      description: findVal("description") || findVal("caption") || "",
      copyright: findVal("copyright") || "",
      keywords: findVal("keyword") || findVal("subject") || "",
      comment: findVal("comment") || findVal("usercomment") || "",
      creationDate: findVal("datetime") || findVal("createdate") || ""
    });
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setCleanReport(null);
    setWriteResult(null);
  };

  // Helper para gerar imagem sintética de teste com metadados para teste instantâneo
  const handleGenerateTestImage = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fundo gradiente
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, "#0284c7");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    // Texto visual
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Imagem de Demonstração Forense", 40, 100);
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Contém metadados EXIF, Câmera, IPTC, XMP e Comentários embutidos", 40, 140);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const baseFile = new File([blob], "amostra_com_metadados.jpg", { type: "image/jpeg" });
      const arrayBuf = await baseFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);

      // Injeta metadados de teste ricos
      const testFileWithMeta = await JpegMetadataAdapter.writeMetadata(baseFile, bytes, {
        title: "Pôr do Sol na Praia do Rosa",
        artist: "Mônica Estevão",
        description: "Fotografia autoral de teste capturada para validação de metadados binários",
        copyright: "© 2026 Mônica Estevão. Todos os direitos reservados.",
        keywords: "praia, rosa, por do sol, teste, forensic",
        comment: "Tratamento de cores em sRGB D65",
        creationDate: "2026:08:25 18:45:00"
      });

      handleFileSelect(testFileWithMeta);
    }, "image/jpeg", 0.95);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16" id="image-metadata-studio-container">
      {/* 1. Hero Header */}
      <ImageMetadataHero onBack={onBack} />

      {/* 2. Upload Dropzone (quando nenhum arquivo estiver selecionado) */}
      {!selectedFile || !analysis ? (
        <ImageMetadataUploadZone
          onFileSelect={handleFileSelect}
          isLoading={isAnalyzing}
          onGenerateTestImage={handleGenerateTestImage}
        />
      ) : (
        /* 3. Imagem Carregada: Visualização, Análise, Limpeza e Edição */
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Card de Pré-visualização & Especificações Técnicas */}
          <ImageMetadataPreviewCard
            file={selectedFile}
            previewUrl={previewUrl || ""}
            analysis={analysis}
            onReset={handleReset}
            isCleanState={cleanReport?.isFullyClean}
          />

          {/* Inventário Detalhado dos Metadados Encontrados */}
          <ImageMetadataInventory analysis={analysis} />

          {/* Grid de 2 Colunas: Limpeza Física (Card 1) e Edição de Novos Metadados (Card 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Limpeza Física */}
            <ImageMetadataCleanCard
              analysis={analysis}
              cleanReport={cleanReport}
              isCleaning={isCleaning}
              onClean={handleClean}
              onDownloadClean={handleDownloadClean}
              onTestCleanedFile={handleFileSelect}
            />

            {/* Card 2: Editor de Novos Metadados */}
            <ImageMetadataEditorCard
              form={editForm}
              onChange={setEditForm}
              onWrite={handleWrite}
              onDownloadEdited={handleDownloadEdited}
              isWriting={isWriting}
              writeResult={writeResult}
              onPrefillFromOriginal={handlePrefillFromOriginal}
            />
          </div>
        </div>
      )}
    </div>
  );
};
