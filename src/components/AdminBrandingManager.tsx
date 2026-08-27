import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  Image,
  Upload,
  RotateCcw,
  Check,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Tag,
  Monitor,
  Smartphone,
  Sliders,
  Menu,
  Save
} from "lucide-react";

interface BrandingConfig {
  logoUrl: string;
  logoStoragePath: string;
  logoAlt: string;
  logoDesktopWidth?: number;
  logoDesktopMaxHeight?: number;
  logoMobileWidth?: number;
  logoMobileMaxHeight?: number;
  updatedAt?: string;
}

const DEFAULT_LOGO_PATH = "";
const DEFAULT_ALT_TEXT = "Conversor Áudio";
const DEFAULT_DESKTOP_WIDTH = 240;
const DEFAULT_DESKTOP_MAX_HEIGHT = 72;
const DEFAULT_MOBILE_WIDTH = 180;
const DEFAULT_MOBILE_MAX_HEIGHT = 56;

export default function AdminBrandingManager() {
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>({
    logoUrl: "",
    logoStoragePath: "",
    logoAlt: DEFAULT_ALT_TEXT,
    logoDesktopWidth: DEFAULT_DESKTOP_WIDTH,
    logoDesktopMaxHeight: DEFAULT_DESKTOP_MAX_HEIGHT,
    logoMobileWidth: DEFAULT_MOBILE_WIDTH,
    logoMobileMaxHeight: DEFAULT_MOBILE_MAX_HEIGHT
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoAlt, setLogoAlt] = useState<string>(DEFAULT_ALT_TEXT);

  // Editable dimension states
  const [logoDesktopWidth, setLogoDesktopWidth] = useState<number>(DEFAULT_DESKTOP_WIDTH);
  const [logoDesktopMaxHeight, setLogoDesktopMaxHeight] = useState<number>(DEFAULT_DESKTOP_MAX_HEIGHT);
  const [logoMobileWidth, setLogoMobileWidth] = useState<number>(DEFAULT_MOBILE_WIDTH);
  const [logoMobileMaxHeight, setLogoMobileMaxHeight] = useState<number>(DEFAULT_MOBILE_MAX_HEIGHT);

  // Preview device selector tab
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Subscribe to real-time branding config from Firestore
  useEffect(() => {
    setLoading(true);
    const docRef = doc(db, "site_settings", "branding");

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as BrandingConfig;
          setBrandingConfig({
            logoUrl: data.logoUrl || "",
            logoStoragePath: data.logoStoragePath || "",
            logoAlt: data.logoAlt || DEFAULT_ALT_TEXT,
            logoDesktopWidth: typeof data.logoDesktopWidth === "number" ? data.logoDesktopWidth : DEFAULT_DESKTOP_WIDTH,
            logoDesktopMaxHeight: typeof data.logoDesktopMaxHeight === "number" ? data.logoDesktopMaxHeight : DEFAULT_DESKTOP_MAX_HEIGHT,
            logoMobileWidth: typeof data.logoMobileWidth === "number" ? data.logoMobileWidth : DEFAULT_MOBILE_WIDTH,
            logoMobileMaxHeight: typeof data.logoMobileMaxHeight === "number" ? data.logoMobileMaxHeight : DEFAULT_MOBILE_MAX_HEIGHT,
            updatedAt: data.updatedAt
          });

          setLogoAlt(data.logoAlt || DEFAULT_ALT_TEXT);
          setLogoDesktopWidth(typeof data.logoDesktopWidth === "number" ? data.logoDesktopWidth : DEFAULT_DESKTOP_WIDTH);
          setLogoDesktopMaxHeight(typeof data.logoDesktopMaxHeight === "number" ? data.logoDesktopMaxHeight : DEFAULT_DESKTOP_MAX_HEIGHT);
          setLogoMobileWidth(typeof data.logoMobileWidth === "number" ? data.logoMobileWidth : DEFAULT_MOBILE_WIDTH);
          setLogoMobileMaxHeight(typeof data.logoMobileMaxHeight === "number" ? data.logoMobileMaxHeight : DEFAULT_MOBILE_MAX_HEIGHT);
        } else {
          // If branding doc doesn't exist, try loading from legacy site_settings/seo or default
          getDoc(doc(db, "site_settings", "seo")).then((seoSnap) => {
            if (seoSnap.exists()) {
              const seoData = seoSnap.data();
              if (seoData.siteLogoUrl) {
                setBrandingConfig((prev) => ({
                  ...prev,
                  logoUrl: seoData.siteLogoUrl
                }));
              }
            }
          }).catch(() => {});
        }
        setLoading(false);
      },
      (err) => {
        console.error("[BRANDING MANAGER] Error listening to branding config:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper to upload file to Cloudflare R2
  const uploadToR2 = async (file: File, destinationPath: string, onProgress?: (pct: number) => void) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Sessão expirada ou usuário não autenticado no cliente.");
    }

    const idToken = await currentUser.getIdToken();

    if (onProgress) onProgress(15);
    const presignedResponse = await fetch("/api/ads-presigned-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({
        storagePath: destinationPath,
        contentType: file.type
      })
    });

    if (onProgress) onProgress(40);
    if (!presignedResponse.ok) {
      const errorData = await presignedResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `Falha ao obter URL de envio (${presignedResponse.status})`);
    }

    const { uploadUrl, storagePath } = await presignedResponse.json();
    if (onProgress) onProgress(60);

    let uploadResult;
    try {
      uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type
        }
      });
    } catch (directErr) {
      console.warn("[CLIENT] Direct R2 PUT blocked by CORS or network, falling back to server proxy upload...", directErr);
      const proxyUrl = `/api/ads-upload-proxy?token=${encodeURIComponent(idToken)}&storagePath=${encodeURIComponent(storagePath)}&contentType=${encodeURIComponent(file.type)}`;
      uploadResult = await fetch(proxyUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type
        }
      });
    }

    if (onProgress) onProgress(90);
    if (!uploadResult.ok) {
      const errorText = await uploadResult.text().catch(() => "");
      throw new Error(`Upload falhou com status ${uploadResult.status}: ${errorText}`);
    }

    if (onProgress) onProgress(100);

    // Build standard public proxy URL for R2 object
    const finalPublicUrl = `/api/ads-public-image?path=${encodeURIComponent(storagePath)}`;
    return { publicUrl: finalPublicUrl, storagePath };
  };

  // Helper to delete object from Cloudflare R2
  const deleteFromR2 = async (storagePath: string) => {
    if (!storagePath || !storagePath.startsWith("branding/")) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken(true);

      await fetch("/api/ads-delete-object", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ storagePath })
      });
    } catch (err) {
      console.warn("[CLIENT] Error deleting previous logo from R2:", err);
    }
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate format: PNG, JPG, JPEG, WEBP, SVG
    const validMimes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    const isSvgExt = file.name.toLowerCase().endsWith(".svg");
    if (!validMimes.includes(file.type) && !isSvgExt) {
      setErrorMessage("Formato inválido. Por favor envie uma imagem transparente nos formatos PNG, WEBP ou SVG.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate size: max 2 MB
    if (file.size > 2 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(`O arquivo selecionado (${fileSizeMB} MB) excede o limite máximo permitido de 2 MB.`);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);

    // Preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPreviewUrl(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save all logo settings (upload file if selected + dimensions + alt text)
  const handleSaveLogoSettings = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let finalLogoUrl = brandingConfig.logoUrl;
      let finalStoragePath = brandingConfig.logoStoragePath;
      const oldStoragePath = brandingConfig.logoStoragePath;

      // 1. Upload new image file if selected
      if (selectedFile) {
        setUploading(true);
        setUploadProgress(10);

        const ext = selectedFile.name.split('.').pop() || 'png';
        const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
        const timestamp = Date.now();
        const destinationPath = `branding/logo-site-${timestamp}.${cleanExt}`;

        const { publicUrl, storagePath } = await uploadToR2(selectedFile, destinationPath, (pct) => {
          setUploadProgress(pct);
        });

        if (!publicUrl || !storagePath) {
          throw new Error("Não foi possível confirmar o salvamento da imagem no Cloudflare R2.");
        }

        finalLogoUrl = publicUrl;
        finalStoragePath = storagePath;
      }

      // 2. Prepare payload
      const updatedData: BrandingConfig = {
        logoUrl: finalLogoUrl,
        logoStoragePath: finalStoragePath,
        logoAlt: logoAlt.trim() || DEFAULT_ALT_TEXT,
        logoDesktopWidth: Number(logoDesktopWidth) || DEFAULT_DESKTOP_WIDTH,
        logoDesktopMaxHeight: Number(logoDesktopMaxHeight) || DEFAULT_DESKTOP_MAX_HEIGHT,
        logoMobileWidth: Number(logoMobileWidth) || DEFAULT_MOBILE_WIDTH,
        logoMobileMaxHeight: Number(logoMobileMaxHeight) || DEFAULT_MOBILE_MAX_HEIGHT,
        updatedAt: new Date().toISOString()
      };

      // 3. Save to Firestore `site_settings/branding`
      await setDoc(doc(db, "site_settings", "branding"), updatedData, { merge: true });

      // Sync site_settings/seo
      if (finalLogoUrl) {
        await setDoc(doc(db, "site_settings", "seo"), {
          siteLogoUrl: finalLogoUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }

      // 4. Delete old custom logo from R2 if replaced
      if (selectedFile && oldStoragePath && oldStoragePath !== finalStoragePath && oldStoragePath.startsWith("branding/")) {
        await deleteFromR2(oldStoragePath);
      }

      setBrandingConfig(updatedData);
      setSelectedFile(null);
      setPreviewUrl(null);
      setSuccessMessage("Configurações e dimensões da logo salvas com sucesso!");
      setTimeout(() => setSuccessMessage(null), 4000);

    } catch (err: any) {
      console.error("[BRANDING MANAGER] Error saving logo settings:", err);
      setErrorMessage("Erro ao salvar configurações da logo: " + (err.message || String(err)));
    } finally {
      setSaving(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Restore default logo and dimensions
  const handleRestoreDefault = async () => {
    if (!window.confirm("Deseja realmente remover a logo personalizada e restaurar todos os tamanhos padrão do sistema (240x72px desktop / 180x56px celular)?")) {
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const oldStoragePath = brandingConfig.logoStoragePath;

      const defaultData: BrandingConfig = {
        logoUrl: "",
        logoStoragePath: "",
        logoAlt: DEFAULT_ALT_TEXT,
        logoDesktopWidth: DEFAULT_DESKTOP_WIDTH,
        logoDesktopMaxHeight: DEFAULT_DESKTOP_MAX_HEIGHT,
        logoMobileWidth: DEFAULT_MOBILE_WIDTH,
        logoMobileMaxHeight: DEFAULT_MOBILE_MAX_HEIGHT,
        updatedAt: new Date().toISOString()
      };

      // Update Firestore
      await setDoc(doc(db, "site_settings", "branding"), defaultData);

      // Sync site_settings/seo
      await setDoc(doc(db, "site_settings", "seo"), {
        siteLogoUrl: "",
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});

      // Delete old logo from R2
      if (oldStoragePath && oldStoragePath.startsWith("branding/")) {
        await deleteFromR2(oldStoragePath);
      }

      setBrandingConfig(defaultData);
      setLogoAlt(DEFAULT_ALT_TEXT);
      setLogoDesktopWidth(DEFAULT_DESKTOP_WIDTH);
      setLogoDesktopMaxHeight(DEFAULT_DESKTOP_MAX_HEIGHT);
      setLogoMobileWidth(DEFAULT_MOBILE_WIDTH);
      setLogoMobileMaxHeight(DEFAULT_MOBILE_MAX_HEIGHT);
      setSelectedFile(null);
      setPreviewUrl(null);

      setSuccessMessage("Logo e tamanhos padrão restaurados com sucesso!");
      setTimeout(() => setSuccessMessage(null), 4000);

    } catch (err: any) {
      console.error("[BRANDING MANAGER] Error restoring defaults:", err);
      setErrorMessage("Erro ao restaurar logo padrão: " + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  // Active image source for preview
  const activeLogoSrc = previewUrl
    ? previewUrl
    : brandingConfig.logoUrl
      ? brandingConfig.logoUrl
      : brandingConfig.logoStoragePath
        ? `/api/ads-public-image?path=${encodeURIComponent(brandingConfig.logoStoragePath)}`
        : DEFAULT_LOGO_PATH;

  const isCustomLogoActive = !!(brandingConfig.logoUrl || brandingConfig.logoStoragePath);

  if (loading) {
    return (
      <div className="bg-bg-sec border border-border-main p-8 rounded-2xl flex items-center justify-center gap-3 text-text-muted font-bold text-xs">
        <RefreshCw className="h-5 w-5 animate-spin text-green-primary" />
        <span>Carregando configurações da Logo do Cabeçalho...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* HEADER TITLE */}
      <div className="border-b border-border-main pb-4">
        <h2 className="font-display font-extrabold text-[#F5F7F8] text-base uppercase tracking-wider flex items-center gap-2">
          <Image className="h-5 w-5 text-green-primary" />
          <span>Configuração da Logo do Cabeçalho</span>
        </h2>
        <p className="text-[11px] text-text-muted font-medium mt-1">
          Gerencie a imagem principal do logotipo <strong className="text-text-sec">Conversor Áudio</strong>, faça upload de imagens PNG transparentes e ajuste os tamanhos e limites de altura para computador e celular.
        </p>
      </div>

      {/* NOTIFICATION MESSAGES */}
      {errorMessage && (
        <div className="p-3.5 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300 text-xs font-bold flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2.5">
          <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* LIVE HEADER PREVIEW BOX */}
      <div className="bg-bg-sec border border-border-main p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-main pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-primary" />
            <h3 className="font-extrabold text-xs text-[#F5F7F8] uppercase tracking-wider">
              Visualização da Logo no Cabeçalho do Site
            </h3>
          </div>

          {/* DESKTOP / MOBILE TOGGLE BUTTONS */}
          <div className="flex items-center gap-1.5 bg-card-main p-1 rounded-xl border border-border-main self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPreviewMode("desktop")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewMode === "desktop"
                  ? "bg-green-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop ({logoDesktopWidth} × {logoDesktopMaxHeight}px)</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("mobile")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewMode === "mobile"
                  ? "bg-green-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Celular ({logoMobileWidth} × {logoMobileMaxHeight}px)</span>
            </button>
          </div>
        </div>

        {/* SIMULATED SITE HEADER CONTAINER */}
        <div className="bg-[#0D0F12] border border-border-main rounded-xl p-4 md:p-6 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-text-muted uppercase tracking-wider font-extrabold border-b border-border-main/40 pb-2 mb-3">
            <span>Prévia em Tempo Real ({previewMode === "desktop" ? "Computador / Desktop" : "Dispositivo Móvel / Celular"})</span>
            {isCustomLogoActive ? (
              <span className="text-emerald-400 font-bold">● Logo Personalizada</span>
            ) : (
              <span className="text-text-muted">● Logo Padrão Local</span>
            )}
          </div>

          <div className="flex items-center justify-center min-h-[100px] py-2">
            {previewMode === "desktop" ? (
              /* DESKTOP SIMULATED HEADER BAR */
              <div className="w-full bg-[#14181D] border border-border-main/80 rounded-xl px-5 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center">
                  <img
                    src={activeLogoSrc}
                    alt={logoAlt || DEFAULT_ALT_TEXT}
                    style={{
                      width: `${logoDesktopWidth}px`,
                      maxHeight: `${logoDesktopMaxHeight}px`,
                      height: "auto",
                      objectFit: "contain",
                      maxWidth: "100%",
                      display: "block"
                    }}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_LOGO_PATH;
                    }}
                  />
                </div>

                <div className="hidden sm:flex items-center space-x-4 text-[11px] font-extrabold uppercase tracking-wider text-text-sec">
                  <span className="text-green-light border-b-2 border-green-primary pb-0.5">Início</span>
                  <span>Converter Áudio</span>
                  <span>Ferramentas PDF</span>
                  <span>Ferramentas Imagem</span>
                </div>
              </div>
            ) : (
              /* MOBILE SIMULATED HEADER BAR */
              <div className="w-full max-w-[360px] bg-[#14181D] border border-border-main/80 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg mx-auto">
                <div className="flex items-center overflow-hidden">
                  <img
                    src={activeLogoSrc}
                    alt={logoAlt || DEFAULT_ALT_TEXT}
                    style={{
                      width: `${logoMobileWidth}px`,
                      maxHeight: `${logoMobileMaxHeight}px`,
                      height: "auto",
                      objectFit: "contain",
                      maxWidth: "100%",
                      display: "block"
                    }}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_LOGO_PATH;
                    }}
                  />
                </div>

                <div className="p-1.5 bg-card-inner rounded-lg text-text-sec">
                  <Menu className="h-4 w-4" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTROLS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DESKTOP DIMENSIONS BOX */}
        <div className="bg-bg-sec border border-border-main p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-border-main pb-3">
            <Monitor className="h-4 w-4 text-green-primary" />
            <h3 className="font-extrabold text-xs text-[#F5F7F8] uppercase tracking-wider">
              Tamanho no Desktop (Computador)
            </h3>
          </div>

          <div className="space-y-4">
            {/* DESKTOP WIDTH */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-text-main">
                <label className="text-[11px] text-text-sec uppercase tracking-wider">
                  Largura no Desktop:
                </label>
                <div className="flex items-center gap-1 bg-card-main border border-border-main px-2 py-1 rounded-lg">
                  <input
                    type="number"
                    min={120}
                    max={420}
                    value={logoDesktopWidth}
                    onChange={(e) => {
                      const val = Math.min(420, Math.max(120, Number(e.target.value) || 120));
                      setLogoDesktopWidth(val);
                    }}
                    className="w-14 bg-transparent text-right font-mono font-bold text-xs text-green-primary outline-none"
                  />
                  <span className="text-[10px] text-text-muted font-mono">px</span>
                </div>
              </div>

              <input
                type="range"
                min={120}
                max={420}
                step={1}
                value={logoDesktopWidth}
                onChange={(e) => setLogoDesktopWidth(Number(e.target.value))}
                className="w-full accent-green-primary cursor-pointer h-2 bg-card-main rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-text-muted font-mono">
                <span>120 px</span>
                <span>Padrão: 240 px</span>
                <span>420 px</span>
              </div>
            </div>

            {/* DESKTOP MAX HEIGHT */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs font-bold text-text-main">
                <label className="text-[11px] text-text-sec uppercase tracking-wider">
                  Altura Máxima no Desktop:
                </label>
                <div className="flex items-center gap-1 bg-card-main border border-border-main px-2 py-1 rounded-lg">
                  <input
                    type="number"
                    min={32}
                    max={120}
                    value={logoDesktopMaxHeight}
                    onChange={(e) => {
                      const val = Math.min(120, Math.max(32, Number(e.target.value) || 32));
                      setLogoDesktopMaxHeight(val);
                    }}
                    className="w-14 bg-transparent text-right font-mono font-bold text-xs text-green-primary outline-none"
                  />
                  <span className="text-[10px] text-text-muted font-mono">px</span>
                </div>
              </div>

              <input
                type="range"
                min={32}
                max={120}
                step={1}
                value={logoDesktopMaxHeight}
                onChange={(e) => setLogoDesktopMaxHeight(Number(e.target.value))}
                className="w-full accent-green-primary cursor-pointer h-2 bg-card-main rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-text-muted font-mono">
                <span>32 px</span>
                <span>Padrão: 72 px</span>
                <span>120 px</span>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE DIMENSIONS BOX */}
        <div className="bg-bg-sec border border-border-main p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-border-main pb-3">
            <Smartphone className="h-4 w-4 text-green-primary" />
            <h3 className="font-extrabold text-xs text-[#F5F7F8] uppercase tracking-wider">
              Tamanho no Celular (Dispositivos Móveis)
            </h3>
          </div>

          <div className="space-y-4">
            {/* MOBILE WIDTH */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-text-main">
                <label className="text-[11px] text-text-sec uppercase tracking-wider">
                  Largura no Celular:
                </label>
                <div className="flex items-center gap-1 bg-card-main border border-border-main px-2 py-1 rounded-lg">
                  <input
                    type="number"
                    min={100}
                    max={260}
                    value={logoMobileWidth}
                    onChange={(e) => {
                      const val = Math.min(260, Math.max(100, Number(e.target.value) || 100));
                      setLogoMobileWidth(val);
                    }}
                    className="w-14 bg-transparent text-right font-mono font-bold text-xs text-green-primary outline-none"
                  />
                  <span className="text-[10px] text-text-muted font-mono">px</span>
                </div>
              </div>

              <input
                type="range"
                min={100}
                max={260}
                step={1}
                value={logoMobileWidth}
                onChange={(e) => setLogoMobileWidth(Number(e.target.value))}
                className="w-full accent-green-primary cursor-pointer h-2 bg-card-main rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-text-muted font-mono">
                <span>100 px</span>
                <span>Padrão: 180 px</span>
                <span>260 px</span>
              </div>
            </div>

            {/* MOBILE MAX HEIGHT */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs font-bold text-text-main">
                <label className="text-[11px] text-text-sec uppercase tracking-wider">
                  Altura Máxima no Celular:
                </label>
                <div className="flex items-center gap-1 bg-card-main border border-border-main px-2 py-1 rounded-lg">
                  <input
                    type="number"
                    min={28}
                    max={90}
                    value={logoMobileMaxHeight}
                    onChange={(e) => {
                      const val = Math.min(90, Math.max(28, Number(e.target.value) || 28));
                      setLogoMobileMaxHeight(val);
                    }}
                    className="w-14 bg-transparent text-right font-mono font-bold text-xs text-green-primary outline-none"
                  />
                  <span className="text-[10px] text-text-muted font-mono">px</span>
                </div>
              </div>

              <input
                type="range"
                min={28}
                max={90}
                step={1}
                value={logoMobileMaxHeight}
                onChange={(e) => setLogoMobileMaxHeight(Number(e.target.value))}
                className="w-full accent-green-primary cursor-pointer h-2 bg-card-main rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-text-muted font-mono">
                <span>28 px</span>
                <span>Padrão: 56 px</span>
                <span>90 px</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPLOAD & ALT TEXT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPLOAD LOGO FILE */}
        <div className="bg-bg-sec border border-border-main p-5 rounded-2xl space-y-4">
          <div className="border-b border-border-main pb-3">
            <h3 className="font-extrabold text-xs text-[#F5F7F8] uppercase tracking-wider flex items-center gap-2">
              <Upload className="h-4 w-4 text-green-primary" />
              <span>Enviar Nova Logo Transparente</span>
            </h3>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                onChange={handleFileChange}
                disabled={uploading || saving}
                className="hidden"
                id="branding-logo-file-input"
              />
              <label
                htmlFor="branding-logo-file-input"
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-card-inner hover:bg-card-selected border border-border-main hover:border-green-primary/40 rounded-xl text-xs font-bold text-text-main cursor-pointer transition-all w-full text-center shadow-sm"
              >
                <Upload className="h-4 w-4 text-green-primary" />
                <span>{selectedFile ? `Substituir arquivo (${selectedFile.name})` : "Escolher Imagem (PNG transparente, WEBP, SVG)..."}</span>
              </label>
            </div>

            <p className="text-[10px] text-text-muted font-medium">
              Recomendado: Imagem horizontal PNG com fundo transparente. A imagem será usada sem cortes, bordas ou sombras adicionais.
            </p>

            {uploading && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-bold text-green-primary">
                  <span>Enviando para o Cloudflare R2...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-card-main rounded-full h-2 overflow-hidden border border-border-main">
                  <div
                    className="bg-green-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ALT TEXT FIELD */}
        <div className="bg-bg-sec border border-border-main p-5 rounded-2xl space-y-4">
          <div className="border-b border-border-main pb-3">
            <h3 className="font-extrabold text-xs text-[#F5F7F8] uppercase tracking-wider flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-primary" />
              <span>Texto Alternativo (Alt Text)</span>
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-text-sec uppercase tracking-wider block">
              Texto alternativo para Acessibilidade e SEO:
            </label>
            <input
              type="text"
              value={logoAlt}
              onChange={(e) => setLogoAlt(e.target.value)}
              placeholder="Conversor Áudio"
              className="w-full bg-card-main border border-border-main focus:border-green-primary/50 text-text-main text-xs rounded-xl px-3.5 py-2.5 font-bold outline-none transition-colors"
            />
            <p className="text-[10px] text-text-muted">
              Valor padrão: <span className="font-mono text-text-sec">Conversor Áudio</span>
            </p>
          </div>
        </div>
      </div>

      {/* FINAL ACTION BUTTONS BAR */}
      <div className="bg-bg-sec border border-border-main p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <p className="text-xs font-bold text-text-main">
            Salvar e Aplicar Alterações no Cabeçalho
          </p>
          <p className="text-[10px] text-text-muted">
            Salva os novos tamanhos, texto alternativo e imagem da logo instantaneamente para todos os visitantes do site.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleRestoreDefault}
            disabled={saving || uploading}
            className="flex-1 sm:flex-none py-3 px-4 bg-card-inner hover:bg-red-950/30 text-text-sec hover:text-red-300 border border-border-main hover:border-red-800/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={handleSaveLogoSettings}
            disabled={saving || uploading}
            className="flex-1 sm:flex-none py-3 px-6 bg-green-primary hover:bg-green-dark disabled:opacity-50 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Salvar Configurações da Logo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* R2 & FIRESTORE INFO BOX */}
      <div className="bg-bg-sec border border-border-main p-5 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-green-primary font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4" />
          <span>Informações de Armazenamento & Persistência</span>
        </div>

        <ul className="text-[11px] text-text-muted space-y-2 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-green-primary font-bold">•</span>
            <span>
              <strong className="text-text-main">Persistência no Firestore:</strong> Todas as dimensões (<code className="bg-card-main px-1.5 py-0.5 rounded text-green-light">logoDesktopWidth</code>, <code className="bg-card-main px-1.5 py-0.5 rounded text-green-light">logoDesktopMaxHeight</code>, <code className="bg-card-main px-1.5 py-0.5 rounded text-green-light">logoMobileWidth</code>, <code className="bg-card-main px-1.5 py-0.5 rounded text-green-light">logoMobileMaxHeight</code>) são salvas em <code className="bg-card-main px-1.5 py-0.5 rounded text-green-light">site_settings/branding</code>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-primary font-bold">•</span>
            <span>
              <strong className="text-text-main">Cloudflare R2:</strong> Logotipos personalizados enviados são armazenados na pasta <code className="bg-card-main px-1.5 py-0.5 rounded text-green-light">branding/</code> no R2.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-primary font-bold">•</span>
            <span>
              <strong className="text-text-main">Logo Padrão Nativa:</strong> Caso nenhuma logo personalizada seja enviada, o sistema exibe o logotipo textual estilizado padrão do <strong className="text-text-main">Conversor Áudio</strong>.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
