import React, { useState, useEffect } from "react";
import { 
  SEO_PAGES_REGISTRY, 
  SeoRouteKeyV2, 
  PageSeoMetadata 
} from "../../seo/seoPages";
import { SITE_URL, SEO_DEFAULTS } from "../../seo/seoConfig";
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs 
} from "firebase/firestore";
import { db } from "../../../firebase";
import { 
  Globe, 
  Save, 
  RotateCcw, 
  Search, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Sparkles,
  Info,
  Check,
  Smartphone,
  Monitor
} from "lucide-react";

interface RouteOption {
  key: SeoRouteKeyV2;
  label: string;
  category: "Geral" | "Áudio" | "PDF" | "Imagens" | "Documentos";
  path: string;
}

const ROUTE_OPTIONS: RouteOption[] = [
  { key: "home", label: "Página Inicial (Home)", category: "Geral", path: "/" },
  { key: "comoFunciona", label: "Como Funciona", category: "Geral", path: "/#como-funciona" },
  { key: "audio", label: "Conversor de Áudio", category: "Áudio", path: "/audio" },
  { key: "audioMetadata", label: "Editor de Metadados de Áudio", category: "Áudio", path: "/audio/editor-metadados" },
  { key: "videoToAudio", label: "Extrair Áudio de Vídeo", category: "Áudio", path: "/video-para-audio" },
  { key: "pdf", label: "Hub de Ferramentas PDF", category: "PDF", path: "/pdf" },
  { key: "pdfMerge", label: "Juntar PDFs", category: "PDF", path: "/pdf/juntar" },
  { key: "pdfCompress", label: "Comprimir PDF", category: "PDF", path: "/pdf/comprimir" },
  { key: "image", label: "Hub de Ferramentas de Imagem", category: "Imagens", path: "/imagem" },
  { key: "imageConvert", label: "Converter Imagens", category: "Imagens", path: "/imagem/converter" },
  { key: "imageCompress", label: "Comprimir Imagens", category: "Imagens", path: "/imagem/comprimir" },
  { key: "imageResize", label: "Redimensionar Imagens", category: "Imagens", path: "/imagem/redimensionar" },
  { key: "imageCrop", label: "Cortar Imagens", category: "Imagens", path: "/imagem/cortar" },
  { key: "imageMetadata", label: "Metadados & Limpeza de Imagem", category: "Imagens", path: "/imagem/metadados" },
  { key: "document", label: "Hub de Documentos", category: "Documentos", path: "/documento" },
];

export const SeoManagerV2: React.FC = () => {
  const [selectedRouteKey, setSelectedRouteKey] = useState<SeoRouteKeyV2>("home");
  const [overridesMap, setOverridesMap] = useState<Record<string, Partial<PageSeoMetadata>>>({});
  const [formData, setFormData] = useState<PageSeoMetadata>(SEO_PAGES_REGISTRY.home);
  const [keywordsText, setKeywordsText] = useState<string>("");
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewTab, setPreviewTab] = useState<"google" | "social">("google");

  // Carrega todos os overrides salvos no Firestore
  const loadOverrides = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "seo_configs"));
      const map: Record<string, Partial<PageSeoMetadata>> = {};
      snap.forEach((d) => {
        map[d.id] = d.data() as Partial<PageSeoMetadata>;
      });
      setOverridesMap(map);
    } catch (err) {
      console.error("[SeoManagerV2] Erro ao carregar overrides de SEO:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverrides();
  }, []);

  // Quando muda a rota selecionada ou os overrides carregam, atualiza o form
  useEffect(() => {
    const defaultData = SEO_PAGES_REGISTRY[selectedRouteKey] || SEO_PAGES_REGISTRY.home;
    const currentOverride = overridesMap[selectedRouteKey];
    const effectiveData: PageSeoMetadata = {
      ...defaultData,
      ...(currentOverride || {})
    };

    setFormData(effectiveData);
    setKeywordsText(effectiveData.keywords ? effectiveData.keywords.join(", ") : "");
    setStatusMessage(null);
  }, [selectedRouteKey, overridesMap]);

  const hasOverride = !!overridesMap[selectedRouteKey];

  const handleInputChange = (field: keyof PageSeoMetadata, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const parsedKeywords = keywordsText
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const toSave: Partial<PageSeoMetadata> & { updatedAt: string } = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        canonicalPath: formData.canonicalPath.trim(),
        h1: formData.h1.trim(),
        keywords: parsedKeywords,
        robots: formData.robots || SEO_DEFAULTS.defaultRobots,
        ogType: formData.ogType || "website",
        ogTitle: (formData.ogTitle || "").trim(),
        ogDescription: (formData.ogDescription || "").trim(),
        ogImage: (formData.ogImage || "").trim(),
        twitterCard: formData.twitterCard || "summary_large_image",
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, "seo_configs", selectedRouteKey);
      await setDoc(docRef, toSave, { merge: true });

      setOverridesMap((prev) => ({
        ...prev,
        [selectedRouteKey]: toSave
      }));

      setStatusMessage({
        type: "success",
        text: `Configurações de SEO para "${ROUTE_OPTIONS.find(r => r.key === selectedRouteKey)?.label}" salvas com sucesso!`
      });

      // Remove mensagem após 4s
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error("[SeoManagerV2] Erro ao salvar SEO:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Erro ao salvar as configurações de SEO no banco de dados."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefault = async () => {
    if (!window.confirm(`Tem certeza que deseja restaurar as configurações padrão de SEO para "${ROUTE_OPTIONS.find(r => r.key === selectedRouteKey)?.label}"? Os overrides salvos serão removidos.`)) {
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const docRef = doc(db, "seo_configs", selectedRouteKey);
      await deleteDoc(docRef);

      const nextMap = { ...overridesMap };
      delete nextMap[selectedRouteKey];
      setOverridesMap(nextMap);

      const defaultData = SEO_PAGES_REGISTRY[selectedRouteKey] || SEO_PAGES_REGISTRY.home;
      setFormData(defaultData);
      setKeywordsText(defaultData.keywords ? defaultData.keywords.join(", ") : "");

      setStatusMessage({
        type: "success",
        text: "Configurações restauradas para o padrão nativo do código!"
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error("[SeoManagerV2] Erro ao restaurar padrão:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Erro ao remover override de SEO."
      });
    } finally {
      setSaving(false);
    }
  };

  const currentRouteInfo = ROUTE_OPTIONS.find((r) => r.key === selectedRouteKey) || ROUTE_OPTIONS[0];

  // Cálculos de caracteres
  const titleLength = formData.title.length;
  const descLength = formData.description.length;

  const getTitleStatus = () => {
    if (titleLength >= 45 && titleLength <= 65) return { label: "Ideal (45-65)", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (titleLength < 45) return { label: "Curto (<45)", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { label: "Longo (>65)", color: "text-rose-600 bg-rose-50 border-rose-200" };
  };

  const getDescStatus = () => {
    if (descLength >= 120 && descLength <= 160) return { label: "Ideal (120-160)", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (descLength < 120) return { label: "Curto (<120)", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { label: "Longo (>160)", color: "text-rose-600 bg-rose-50 border-rose-200" };
  };

  const titleStatus = getTitleStatus();
  const descStatus = getDescStatus();

  return (
    <div className="space-y-6" id="v2-admin-seo-manager">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Gerenciamento de SEO & Metadados
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Controle títulos, descrições, tags Open Graph e indexação de cada rota pública com persistência real.
            </p>
          </div>
        </div>

        {/* Global Stats / Status */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {Object.keys(overridesMap).length} de {ROUTE_OPTIONS.length} rotas personalizadas
          </div>
        </div>
      </div>

      {/* Route Selector Chips / Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Selecione a Rota para Editar:
          </label>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Personalizado
            <span className="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 ml-2" /> Padrão Nativo
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {ROUTE_OPTIONS.map((route) => {
            const isSelected = selectedRouteKey === route.key;
            const isOverridden = !!overridesMap[route.key];

            return (
              <button
                key={route.key}
                type="button"
                onClick={() => setSelectedRouteKey(route.key)}
                className={`flex flex-col text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-900 dark:text-sky-200 font-bold shadow-xs ring-2 ring-sky-500/20"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
                id={`v2-seo-tab-${route.key}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold truncate">{route.label}</span>
                  {isOverridden ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Personalizado no Firestore" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" title="Padrão do Código" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-1">
                  {route.path}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Message Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 transition-all ${
          statusMessage.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
            : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
        }`}>
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Two-Column Layout: Form Editor (Left) & Live SERP Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Editor (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            {/* Header of Active Route Form */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  {currentRouteInfo.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentRouteInfo.label}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {hasOverride ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Override Ativo
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Padrão do Código
                  </span>
                )}
              </div>
            </div>

            {/* Field 1: Page Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Título da Página (Tag &lt;title&gt;)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${titleStatus.color}`}>
                  {titleLength} caracteres • {titleStatus.label}
                </span>
              </div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                placeholder="Ex: Conversor de Áudio Online | MP3, WAV e Mais"
                id="v2-seo-input-title"
              />
              <p className="text-[11px] text-slate-500">
                Título exibido na aba do navegador e no resultado de busca do Google.
              </p>
            </div>

            {/* Field 2: Meta Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Meta Description</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${descStatus.color}`}>
                  {descLength} caracteres • {descStatus.label}
                </span>
              </div>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all leading-relaxed"
                placeholder="Descreva o conteúdo e valor da ferramenta para os usuários..."
                id="v2-seo-input-desc"
              />
              <p className="text-[11px] text-slate-500">
                Resumo sucinto exibido nos snippets do Google. Recomenda-se entre 120 e 160 caracteres.
              </p>
            </div>

            {/* Field 3: H1 da Página & Canonical Path */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  H1 Semântico da Página
                </label>
                <input
                  type="text"
                  value={formData.h1}
                  onChange={(e) => handleInputChange("h1", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  placeholder="Título H1 Principal"
                  id="v2-seo-input-h1"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Caminho Canônico (Canonical Path)
                </label>
                <input
                  type="text"
                  value={formData.canonicalPath}
                  onChange={(e) => handleInputChange("canonicalPath", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-mono focus:outline-hidden"
                  placeholder="/rota"
                  id="v2-seo-input-canonical"
                />
              </div>
            </div>

            {/* Field 4: Keywords & Robots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Palavras-chave (Separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  placeholder="conversor mp3, converter audio, wav para mp3"
                  id="v2-seo-input-keywords"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Diretiva Meta Robots
                </label>
                <select
                  value={formData.robots || "index, follow"}
                  onChange={(e) => handleInputChange("robots", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden"
                  id="v2-seo-input-robots"
                >
                  <option value="index, follow">index, follow (Padrão Indexável)</option>
                  <option value="noindex, follow">noindex, follow</option>
                  <option value="noindex, nofollow">noindex, nofollow (Privado / Oculto)</option>
                  <option value="index, nofollow">index, nofollow</option>
                </select>
              </div>
            </div>

            {/* Open Graph & Social Fields Accordion/Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Share2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Configurações de Redes Sociais & Open Graph (WhatsApp, Facebook, Twitter)</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    OG Title (Opcional — usa o título principal se vazio)
                  </label>
                  <input
                    type="text"
                    value={formData.ogTitle || ""}
                    onChange={(e) => handleInputChange("ogTitle", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    placeholder="Título para redes sociais"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    OG Description (Opcional — usa a descrição principal se vazio)
                  </label>
                  <input
                    type="text"
                    value={formData.ogDescription || ""}
                    onChange={(e) => handleInputChange("ogDescription", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    placeholder="Descrição para redes sociais"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      URL da Imagem OG (og:image)
                    </label>
                    <input
                      type="text"
                      value={formData.ogImage || ""}
                      onChange={(e) => handleInputChange("ogImage", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      placeholder="/og-cover.png ou https://..."
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Twitter Card
                    </label>
                    <select
                      value={formData.twitterCard || "summary_large_image"}
                      onChange={(e) => handleInputChange("twitterCard", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="summary_large_image">summary_large_image (Card Grande)</option>
                      <option value="summary">summary (Card Compacto)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-3">
              <button
                type="button"
                onClick={handleRestoreDefault}
                disabled={saving || !hasOverride}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                id="v2-seo-btn-restore"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão do Código</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                id="v2-seo-btn-save"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando SEO...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Configuração de SEO</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Interactive SERP & Social Previews (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preview Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Pré-visualização em Tempo Real
                </h4>
              </div>

              {/* Tabs: Google vs Social */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewTab("google")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    previewTab === "google"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  Google Search
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("social")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    previewTab === "social"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  Card Social
                </button>
              </div>
            </div>

            {/* TAB 1: Google SERP Preview */}
            {previewTab === "google" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Simulação de resultado na busca do Google:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`p-1 rounded-md ${previewDevice === "desktop" ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white" : "text-slate-400"}`}
                      title="Desktop Preview"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`p-1 rounded-md ${previewDevice === "mobile" ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white" : "text-slate-400"}`}
                      title="Mobile Preview"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Google Snippet Card */}
                <div className={`p-4 rounded-2xl bg-white border border-slate-200 shadow-xs font-sans text-left space-y-1.5 ${
                  previewDevice === "mobile" ? "max-w-[340px] mx-auto" : "w-full"
                }`}>
                  {/* URL Header */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-[10px] shrink-0">
                      CA
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] text-[#202124] font-medium leading-none truncate">
                        Conversor de Áudio & Mídia
                      </div>
                      <div className="text-[11px] text-[#4d5156] leading-none mt-0.5 truncate font-mono">
                        {SITE_URL}{currentRouteInfo.path}
                      </div>
                    </div>
                  </div>

                  {/* Title Link */}
                  <h5 className="text-[17px] md:text-[18px] text-[#1a0dab] hover:underline leading-snug font-medium line-clamp-2 cursor-pointer pt-0.5">
                    {formData.title || "Título da Página"}
                  </h5>

                  {/* Description */}
                  <p className="text-[13px] text-[#4d5156] leading-relaxed line-clamp-3">
                    {formData.description || "Descrição da página exibida nos resultados de pesquisa."}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Social Card Preview (Open Graph) */}
            {previewTab === "social" && (
              <div className="space-y-3 text-left">
                <span className="text-[11px] text-slate-500 block">
                  Simulação de compartilhamento no WhatsApp, Facebook ou Twitter/X:
                </span>

                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-xs max-w-sm mx-auto">
                  {/* OG Image Cover */}
                  <div className="w-full h-40 bg-gradient-to-br from-sky-600 to-indigo-900 flex items-center justify-center text-white relative overflow-hidden">
                    {formData.ogImage ? (
                      <img
                        src={formData.ogImage}
                        alt="OG Cover"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="p-4 text-center space-y-1">
                        <Globe className="w-8 h-8 mx-auto opacity-70" />
                        <span className="text-xs font-bold block">{SEO_DEFAULTS.siteName}</span>
                        <span className="text-[10px] opacity-75 block">Imagem Padrão de Compartilhamento</span>
                      </div>
                    )}
                  </div>

                  {/* Content snippet */}
                  <div className="p-3.5 bg-white space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block truncate">
                      {SITE_URL.replace("https://", "")}
                    </span>
                    <h6 className="text-xs font-bold text-slate-900 line-clamp-2">
                      {formData.ogTitle || formData.title}
                    </h6>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {formData.ogDescription || formData.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
                <span>Como funciona a aplicação no site:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-sky-800/90 dark:text-sky-300/90">
                O hook central de SEO (<code className="font-mono bg-sky-100/80 dark:bg-sky-900/60 px-1 py-0.5 rounded-sm">useSeoV2</code>) prioriza os dados salvos nesta tela. Se a rota não possuir override, ela utilizará automaticamente o padrão otimizado do código.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
