import React, { useState, useEffect, useRef } from "react";
import { BrandingConfigV2 } from "../types";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { 
  Palette, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  Monitor, 
  Smartphone,
  Loader2,
  UploadCloud,
  RefreshCw,
  Trash2,
  FileCheck,
  Sparkles,
  Info
} from "lucide-react";

interface BrandingManagerV2Props {
  branding: BrandingConfigV2 | null;
  onRefresh: () => void;
}

interface SelectedFileInfo {
  file: File | null;
  name: string;
  sizeFormatted: string;
  type: string;
  naturalWidth: number;
  naturalHeight: number;
  previewUrl: string;
}

/**
 * Converte e otimiza imagem com fundo transparente (PNG/SVG/WebP)
 * para persistência segura e ultraleve, mantendo qualidade cristalina.
 */
const optimizeLogoImage = (
  file: File,
  maxWidth = 800,
  maxHeight = 300
): Promise<{ dataUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    // Se for SVG, lê diretamente como texto/dataURI para preservar 100% dos vetores
    if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const svgContent = (e.target?.result as string) || "";
        resolve({ dataUrl: svgContent, width: 220, height: 64 });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl: src, width, height });
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Gera PNG preservando canal alpha transparente
        let dataUrl = canvas.toDataURL("image/png");
        resolve({ dataUrl, width, height });
      };
      img.onerror = () => resolve({ dataUrl: src, width: 220, height: 64 });
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const BrandingManagerV2: React.FC<BrandingManagerV2Props> = ({
  branding,
  onRefresh
}) => {
  const [siteName, setSiteName] = useState(branding?.siteName || "Conversor de Áudio & Mídia");
  const [currentLogoUrl, setCurrentLogoUrl] = useState(branding?.logoUrl || "");
  const [logoAlt, setLogoAlt] = useState(branding?.logoAlt || "Conversor de Áudio Online");
  const [logoDesktopWidth, setLogoDesktopWidth] = useState(branding?.logoDesktopWidth || 220);
  const [logoDesktopMaxHeight, setLogoDesktopMaxHeight] = useState(branding?.logoDesktopMaxHeight || 64);
  const [logoMobileWidth, setLogoMobileWidth] = useState(branding?.logoMobileWidth || 160);
  const [logoMobileMaxHeight, setLogoMobileMaxHeight] = useState(branding?.logoMobileMaxHeight || 48);

  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (branding) {
      if (branding.siteName) setSiteName(branding.siteName);
      if (branding.logoUrl !== undefined) setCurrentLogoUrl(branding.logoUrl);
      if (branding.logoAlt) setLogoAlt(branding.logoAlt);
      if (branding.logoDesktopWidth) setLogoDesktopWidth(branding.logoDesktopWidth);
      if (branding.logoDesktopMaxHeight) setLogoDesktopMaxHeight(branding.logoDesktopMaxHeight);
      if (branding.logoMobileWidth) setLogoMobileWidth(branding.logoMobileWidth);
      if (branding.logoMobileMaxHeight) setLogoMobileMaxHeight(branding.logoMobileMaxHeight);
    }
  }, [branding]);

  // Formata tamanho em KB ou MB
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Trata seleção de novo arquivo de logo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida tipo
    const allowedTypes = ["image/png", "image/svg+xml", "image/webp", "image/jpeg"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(png|svg|webp|jpg|jpeg)$/i)) {
      setError("Formato inválido. Por favor, selecione um arquivo PNG, SVG ou WebP.");
      return;
    }

    try {
      setIsProcessingFile(true);
      setError(null);
      setSuccess(null);

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        setSelectedFile({
          file,
          name: file.name,
          sizeFormatted: formatFileSize(file.size),
          type: file.type || (file.name.endsWith(".svg") ? "image/svg+xml" : "image/png"),
          naturalWidth: img.naturalWidth || 220,
          naturalHeight: img.naturalHeight || 64,
          previewUrl: objectUrl
        });
        setIsProcessingFile(false);
      };

      img.onerror = () => {
        setSelectedFile({
          file,
          name: file.name,
          sizeFormatted: formatFileSize(file.size),
          type: file.type || "image/png",
          naturalWidth: 220,
          naturalHeight: 64,
          previewUrl: objectUrl
        });
        setIsProcessingFile(false);
      };

      img.src = objectUrl;
    } catch (err: any) {
      console.error("Erro ao carregar prévia do arquivo:", err);
      setError("Erro ao ler o arquivo selecionado.");
      setIsProcessingFile(false);
    }
  };

  // Remove a logo selecionada ou cadastrada
  const handleRemoveLogo = () => {
    setSelectedFile(null);
    setCurrentLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSaving(true);
      let finalLogoUrl = currentLogoUrl;

      // Se há um novo arquivo selecionado, fazemos o upload/otimização real
      if (selectedFile?.file) {
        try {
          const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : "";
          const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase() || "png";
          const storagePath = `branding/logo-site-${Date.now()}.${fileExtension}`;

          let uploadSuccess = false;

          // 1. Tenta upload via proxy R2 se backend e token estiverem disponíveis
          if (idToken) {
            try {
              const proxyUrl = `/api/ads-upload-proxy?token=${encodeURIComponent(idToken)}&storagePath=${encodeURIComponent(storagePath)}&contentType=${encodeURIComponent(selectedFile.type)}`;
              const uploadRes = await fetch(proxyUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": selectedFile.type,
                },
                body: selectedFile.file
              });

              if (uploadRes.ok) {
                finalLogoUrl = `/api/ads-public-image?path=${encodeURIComponent(storagePath)}`;
                uploadSuccess = true;
              }
            } catch (r2Err) {
              console.warn("[BrandingManagerV2] Upload R2 não disponível, aplicando otimização persistente:", r2Err);
            }
          }

          // 2. Se R2 não estiver configurado no ambiente, gera versão otimizada preservando transparência
          if (!uploadSuccess) {
            const { dataUrl } = await optimizeLogoImage(selectedFile.file, 800, 300);
            finalLogoUrl = dataUrl;
          }
        } catch (uploadErr) {
          console.error("Falha no upload da logo:", uploadErr);
          setError("Não foi possível enviar a logo. A identidade anterior foi mantida.");
          setSaving(false);
          return;
        }
      }

      // Persistência segura no Firestore
      const docRef = doc(db, "site_settings", "branding");
      const payload = {
        siteName: siteName.trim(),
        logoUrl: finalLogoUrl,
        logoAlt: logoAlt.trim(),
        logoDesktopWidth: Number(logoDesktopWidth) || 220,
        logoDesktopMaxHeight: Number(logoDesktopMaxHeight) || 64,
        logoMobileWidth: Number(logoMobileWidth) || 160,
        logoMobileMaxHeight: Number(logoMobileMaxHeight) || 48,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, payload, { merge: true });
      
      // Atualiza o estado local
      setCurrentLogoUrl(finalLogoUrl);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Salva no localStorage para consistência imediata
      try {
        localStorage.setItem("conversor_audio_v2_branding", JSON.stringify(payload));
      } catch (e) {}

      onRefresh();
      setSuccess("Identidade visual salva e sincronizada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar branding no Firestore:", err);
      setError("Não foi possível enviar a logo. A identidade anterior foi mantida.");
    } finally {
      setSaving(false);
    }
  };

  const previewSource = selectedFile?.previewUrl || currentLogoUrl;

  return (
    <div className="space-y-6 max-w-3xl" id="v2-admin-branding-manager">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Identidade Visual & Logotipo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gerenciamento oficial da marca, logotipo do Header/Footer e dimensões
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xs">
        
        {/* Site Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Nome Público da Plataforma
          </label>
          <input
            type="text"
            required
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Conversor de Áudio & Mídia"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
          />
        </div>

        {/* LOGOTIPO OFICIAL (UPLOAD REAL) */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>LOGOTIPO OFICIAL</span>
            </label>
            {previewSource && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedFile ? "Nova logo pronta para salvar" : "Logotipo ativo no site"}
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/svg+xml, image/webp, image/jpeg"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile && !currentLogoUrl ? (
            /* Área de Upload Inicial */
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-sky-300 dark:border-slate-700 hover:border-sky-500 bg-sky-50/40 dark:bg-slate-800/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
            >
              <UploadCloud className="w-8 h-8 text-sky-600 dark:text-sky-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>SELECIONAR LOGO</span>
                </button>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  PNG, SVG ou WebP • Preferencialmente com fundo transparente
                </p>
              </div>
            </div>
          ) : (
            /* Card com a Logo Atual ou Nova Selecionada */
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Visualizador da Logo */}
                <div className="w-full sm:w-48 h-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                  {previewSource ? (
                    <img
                      src={previewSource}
                      alt={logoAlt || "Prévia do Logotipo"}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  )}
                  {selectedFile && (
                    <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                      Não Salvo
                    </span>
                  )}
                </div>

                {/* Detalhes do Arquivo */}
                <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {selectedFile ? selectedFile.name : "logotipo-oficial"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold uppercase">
                      {selectedFile ? selectedFile.type.split("/")[1] || "imagem" : "Ativo"}
                    </span>
                  </div>
                  
                  {selectedFile && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tamanho: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedFile.sizeFormatted}</span> • Dimensões: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedFile.naturalWidth} × {selectedFile.naturalHeight} px</span>
                    </p>
                  )}

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedFile 
                      ? "Arquivo pronto. Clique em Salvar Identidade para persistir em toda a plataforma." 
                      : "Esta imagem está sendo exibida automaticamente no Header e no Footer."}
                  </p>

                  {/* Ações: Trocar / Remover */}
                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingFile || saving}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Trocar Logo</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={isProcessingFile || saving}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alt Text */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Texto Alternativo da Imagem (Alt Text)
          </label>
          <input
            type="text"
            value={logoAlt}
            onChange={(e) => setLogoAlt(e.target.value)}
            placeholder="Conversor de Áudio Online"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
          />
        </div>

        {/* Dimension Controls */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-sky-500" />
            <span>Dimensões de Exibição (Desktop)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 dark:text-slate-400">Largura Máx. (px)</label>
              <input
                type="number"
                min={80}
                max={500}
                value={logoDesktopWidth}
                onChange={(e) => setLogoDesktopWidth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 dark:text-slate-400">Altura Máx. (px)</label>
              <input
                type="number"
                min={24}
                max={150}
                value={logoDesktopMaxHeight}
                onChange={(e) => setLogoDesktopMaxHeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-sky-500" />
            <span>Dimensões de Exibição (Mobile)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 dark:text-slate-400">Largura Mobile (px)</label>
              <input
                type="number"
                min={60}
                max={300}
                value={logoMobileWidth}
                onChange={(e) => setLogoMobileWidth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 dark:text-slate-400">Altura Mobile (px)</label>
              <input
                type="number"
                min={20}
                max={100}
                value={logoMobileMaxHeight}
                onChange={(e) => setLogoMobileMaxHeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Logo Preview Box */}
        {previewSource && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Simulação de Renderização no Header (Desktop):
            </span>
            <div className="p-4 rounded-xl bg-[#0B1F44] flex items-center justify-center border border-slate-700">
              <img
                src={previewSource}
                alt={logoAlt}
                style={{ 
                  maxWidth: `${logoDesktopWidth}px`, 
                  maxHeight: `${logoDesktopMaxHeight}px`,
                  objectFit: "contain" 
                }}
                className="transition-all"
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving || isProcessingFile}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Identidade</span>
          </button>
        </div>
      </form>
    </div>
  );
};
