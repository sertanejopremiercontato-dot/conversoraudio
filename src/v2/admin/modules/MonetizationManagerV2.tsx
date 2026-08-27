import React, { useState, useEffect, useCallback } from "react";
import { MonetizationConfigV2 } from "../types";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { getAuth } from "firebase/auth";
import { 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Save, 
  ShieldCheck, 
  Code, 
  FileText,
  Loader2,
  RefreshCw,
  ExternalLink,
  Info,
  Sparkles,
  Layers,
  HelpCircle,
  Activity,
  AlertTriangle,
  Target
} from "lucide-react";
import { GoogleAdsTagSection } from "./GoogleAdsTagSection";

interface MonetizationManagerV2Props {
  monetization: MonetizationConfigV2 | null;
  onRefresh: () => void;
}

const OFFICIAL_PUB_ID = "ca-pub-8846628306821055";
const OFFICIAL_DOMAIN = "https://www.conversoraudio.com.br";
const OFFICIAL_SNIPPET = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8846628306821055" crossorigin="anonymous"></script>`;
const OFFICIAL_METATAG = `<meta name="google-adsense-account" content="ca-pub-8846628306821055">`;
const OFFICIAL_ADS_TXT = `google.com, pub-8846628306821055, DIRECT, f08c47fec0942fa0`;

interface DiagnosticState {
  script: {
    installed: boolean;
    duplicated: boolean;
    detectedId: string | null;
    count: number;
  };
  metaTag: {
    installed: boolean;
    detectedId: string | null;
  };
  adsTxt: {
    status: number | null;
    accessible: boolean;
    contentType: string | null;
    content: string;
    hasCorrectId: boolean;
    isPlainText: boolean;
    lastTested: string | null;
    checking: boolean;
    error: string | null;
  };
}

export const MonetizationManagerV2: React.FC<MonetizationManagerV2Props> = ({
  monetization,
  onRefresh
}) => {
  // Navigation Sub-Tabs: "adsense" | "google_ads"
  const [activeSubTab, setActiveSubTab] = useState<"adsense" | "google_ads">("adsense");

  // Global settings
  const [adsenseEnabled, setAdsenseEnabled] = useState(monetization?.adsenseEnabled ?? true);
  const [publisherId, setPublisherId] = useState(monetization?.publisherId || OFFICIAL_PUB_ID);
  const [domain, setDomain] = useState(monetization?.domain || OFFICIAL_DOMAIN);
  const [notes, setNotes] = useState(monetization?.notes || "");

  // 3 Config Blocks State
  const [scriptCode, setScriptCode] = useState(
    monetization?.customSnippet || monetization?.verificationSnippet || OFFICIAL_SNIPPET
  );
  const [metaTagCode, setMetaTagCode] = useState(
    monetization?.customMetaTag || monetization?.verificationMetaTag || OFFICIAL_METATAG
  );
  const [adsTxtContent, setAdsTxtContent] = useState(
    monetization?.adsTxtContent || monetization?.verificationAdsTxtLine || OFFICIAL_ADS_TXT
  );

  // Status & Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savingBlock, setSavingBlock] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Technical Diagnostics
  const [diagnostics, setDiagnostics] = useState<DiagnosticState>({
    script: { installed: false, duplicated: false, detectedId: null, count: 0 },
    metaTag: { installed: false, detectedId: null },
    adsTxt: {
      status: null,
      accessible: false,
      contentType: null,
      content: "",
      hasCorrectId: false,
      isPlainText: false,
      lastTested: null,
      checking: false,
      error: null
    }
  });

  // Helper to format Publisher ID correctly
  const normalizePublisherId = (input: string): string => {
    const raw = input.trim();
    if (!raw) return OFFICIAL_PUB_ID;
    if (raw.startsWith("ca-pub-")) return raw;
    if (raw.startsWith("pub-")) return `ca-${raw}`;
    return `ca-pub-${raw}`;
  };

  // Sync state when monetization prop updates
  useEffect(() => {
    if (monetization) {
      setAdsenseEnabled(monetization.adsenseEnabled !== undefined ? monetization.adsenseEnabled : true);
      if (monetization.publisherId) setPublisherId(monetization.publisherId);
      if (monetization.domain) setDomain(monetization.domain);
      if (monetization.notes) setNotes(monetization.notes);

      if (monetization.customSnippet) {
        setScriptCode(monetization.customSnippet);
      } else if (monetization.verificationSnippet) {
        setScriptCode(monetization.verificationSnippet);
      }

      if (monetization.customMetaTag) {
        setMetaTagCode(monetization.customMetaTag);
      } else if (monetization.verificationMetaTag) {
        setMetaTagCode(monetization.verificationMetaTag);
      }

      if (monetization.adsTxtContent) {
        setAdsTxtContent(monetization.adsTxtContent);
      } else if (monetization.verificationAdsTxtLine) {
        setAdsTxtContent(monetization.verificationAdsTxtLine);
      }
    }
  }, [monetization]);

  // Run DOM & Diagnostics Audit
  const runDiagnostics = useCallback(async () => {
    if (typeof document === "undefined") return;

    // 1. Audit Script tag in <head>
    const scripts = document.querySelectorAll('script[src*="pagead2.googlesyndication.com"], script[src*="adsbygoogle.js"]');
    const scriptCount = scripts.length;
    let detectedScriptId: string | null = null;

    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const match = src.match(/client=(ca-pub-\d+)/);
      if (match) detectedScriptId = match[1];
    });

    // 2. Audit Meta Tag in <head>
    const metaTag = document.querySelector('meta[name="google-adsense-account"]');
    const detectedMetaId = metaTag ? metaTag.getAttribute("content") : null;

    // Update script and meta tag diagnostics immediately
    setDiagnostics(prev => ({
      ...prev,
      script: {
        installed: scriptCount > 0,
        duplicated: scriptCount > 1,
        detectedId: detectedScriptId,
        count: scriptCount
      },
      metaTag: {
        installed: !!metaTag,
        detectedId: detectedMetaId
      }
    }));

    // 3. Audit /ads.txt file
    await checkAdsTxtFile();
  }, [publisherId]);

  // Verify /ads.txt public file via fetch
  const checkAdsTxtFile = async () => {
    setDiagnostics(prev => ({
      ...prev,
      adsTxt: { ...prev.adsTxt, checking: true, error: null }
    }));

    try {
      const res = await fetch(`/ads.txt?t=${Date.now()}`, { cache: "no-store" });
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      const cleanPub = normalizePublisherId(publisherId).replace("ca-", "");
      const hasCorrectId = text.includes(cleanPub) || text.includes(OFFICIAL_PUB_ID.replace("ca-", ""));
      const isPlainText = contentType.includes("text/plain") || (!text.includes("<html") && !text.includes("<body"));

      setDiagnostics(prev => ({
        ...prev,
        adsTxt: {
          status: res.status,
          accessible: res.ok,
          contentType: contentType || "text/plain",
          content: text.trim(),
          hasCorrectId,
          isPlainText,
          lastTested: new Date().toLocaleTimeString("pt-BR"),
          checking: false,
          error: res.ok ? null : `Erro HTTP ${res.status}`
        }
      }));
    } catch (err: any) {
      setDiagnostics(prev => ({
        ...prev,
        adsTxt: {
          status: null,
          accessible: false,
          contentType: null,
          content: "",
          hasCorrectId: false,
          isPlainText: false,
          lastTested: new Date().toLocaleTimeString("pt-BR"),
          checking: false,
          error: err.message || "Falha de conexão ao testar /ads.txt"
        }
      }));
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Synchronize runtime DOM without duplicating tags
  const syncHeadDom = (newPubId: string, newSnippet: string, newMeta: string) => {
    if (typeof document === "undefined" || !document.head) return;

    try {
      // 1. Update or create Meta Tag
      let metaEl = document.querySelector('meta[name="google-adsense-account"]');
      if (!metaEl) {
        metaEl = document.createElement("meta");
        metaEl.setAttribute("name", "google-adsense-account");
        document.head.appendChild(metaEl);
      }
      metaEl.setAttribute("content", newPubId);

      // 2. Update existing script src if Publisher ID changes, avoid duplicates
      const existingScripts = document.querySelectorAll('script[src*="pagead2.googlesyndication.com"], script[src*="adsbygoogle.js"]');
      if (existingScripts.length > 0) {
        const firstScript = existingScripts[0] as HTMLScriptElement;
        const currentSrc = firstScript.src;
        const expectedSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${newPubId}`;
        if (currentSrc !== expectedSrc) {
          firstScript.src = expectedSrc;
        }
        // If there are duplicate scripts created by accident, clean them up
        for (let i = 1; i < existingScripts.length; i++) {
          existingScripts[i].remove();
        }
      }
    } catch (e) {
      console.warn("[ADSENSE] DOM sync notice:", e);
    }
  };

  // Sync ads.txt with server backend filesystem
  const syncServerAdsTxt = async (content: string) => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      await fetch("/api/admin/adsense/sync-adstxt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ adsTxtContent: content })
      });
    } catch (e) {
      console.warn("[ADSENSE] Server ads.txt sync note:", e);
    }
  };

  // Save all settings or a single block
  const handleSave = async (blockName?: "script" | "metaTag" | "adsTxt") => {
    setError(null);
    setSuccess(null);

    const cleanPubId = normalizePublisherId(publisherId);

    try {
      if (blockName) {
        setSavingBlock(blockName);
      } else {
        setSavingAll(true);
      }

      const docRef = doc(db, "site_settings", "adsense");
      const payload = {
        adsenseEnabled,
        publisherId: cleanPubId,
        domain: domain.trim() || OFFICIAL_DOMAIN,
        notes: notes.trim(),
        customSnippet: scriptCode.trim(),
        customMetaTag: metaTagCode.trim(),
        adsTxtContent: adsTxtContent.trim(),
        verificationSnippet: scriptCode.trim(),
        verificationMetaTag: metaTagCode.trim(),
        verificationAdsTxtLine: adsTxtContent.trim(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, payload, { merge: true });

      // Apply runtime updates to DOM without duplicates
      syncHeadDom(cleanPubId, scriptCode, metaTagCode);

      // Sync backend ads.txt
      await syncServerAdsTxt(adsTxtContent);

      // Re-run diagnostics
      await runDiagnostics();
      onRefresh();

      if (blockName === "script") {
        setSuccess("Código global do Google AdSense salvo com sucesso!");
      } else if (blockName === "metaTag") {
        setSuccess("Metatag de verificação salva com sucesso!");
      } else if (blockName === "adsTxt") {
        setSuccess("Arquivo ads.txt salvo e sincronizado com sucesso!");
      } else {
        setSuccess("Todas as configurações de Monetização & AdSense foram salvas com sucesso!");
      }
    } catch (err: any) {
      console.error("[ADSENSE] Erro ao salvar:", err);
      setError(err.message || "Erro ao salvar dados no Firestore.");
    } finally {
      setSavingBlock(null);
      setSavingAll(false);
    }
  };

  // Restore Official defaults
  const handleRestoreOfficial = (target: "script" | "metaTag" | "adsTxt" | "all") => {
    if (target === "script" || target === "all") {
      setScriptCode(OFFICIAL_SNIPPET);
    }
    if (target === "metaTag" || target === "all") {
      setMetaTagCode(OFFICIAL_METATAG);
    }
    if (target === "adsTxt" || target === "all") {
      setAdsTxtContent(OFFICIAL_ADS_TXT);
    }
    if (target === "all") {
      setPublisherId(OFFICIAL_PUB_ID);
      setDomain(OFFICIAL_DOMAIN);
    }
  };

  // Calculate technical readiness status
  const isTechnicalSetupComplete = 
    diagnostics.script.installed && 
    !diagnostics.script.duplicated &&
    diagnostics.metaTag.installed && 
    diagnostics.adsTxt.accessible && 
    diagnostics.adsTxt.hasCorrectId;

  return (
    <div className="space-y-6 max-w-5xl" id="v2-admin-monetization-manager">
      {/* Sub-Tab Navigation Bar: AdSense vs Google Ads */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("adsense")}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === "adsense"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Google AdSense (Monetização)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ca-pub-8846...
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("google_ads")}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === "google_ads"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Google Ads & Tag do Google</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Tag do Google
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 px-3 hidden md:block">
          {activeSubTab === "adsense" ? "Serviço de exibição de anúncios" : "Serviço de medição de campanhas"}
        </div>
      </div>

      {/* RENDER GOOGLE ADS TAG SECTION */}
      {activeSubTab === "google_ads" && (
        <GoogleAdsTagSection onRefresh={onRefresh} />
      )}

      {/* RENDER GOOGLE ADSENSE SECTION */}
      {activeSubTab === "adsense" && (
        <>
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                  <span>Google AdSense & Monetização</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Central Oficial
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Gerencie a instalação do script, metatag de verificação e arquivo ads.txt da plataforma
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => runDiagnostics()}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Recarregar diagnóstico técnico"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Auditar Status</span>
              </button>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isTechnicalSetupComplete
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              }`}>
                {isTechnicalSetupComplete ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Configuração Técnica Concluída</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Configuração Técnica Pendente</span>
                  </>
                )}
              </span>
            </div>
          </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Account Parameters Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Parâmetros da Conta Google AdSense
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Validação oficial vinculada ao domínio
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Publisher ID (ID do Editor)</span>
              <span className="text-[10px] text-slate-400 font-mono">Formato ca-pub-XXXXXXXXXXXXXXXX</span>
            </label>
            <input
              type="text"
              required
              value={publisherId}
              onChange={(e) => setPublisherId(e.target.value)}
              placeholder="ca-pub-8846628306821055"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Domínio Registrado no AdSense</span>
              <span className="text-[10px] text-slate-400 font-mono">Domínio de produção</span>
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="https://www.conversoraudio.com.br"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="adsense-active-toggle-main"
            checked={adsenseEnabled}
            onChange={(e) => setAdsenseEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
          />
          <label htmlFor="adsense-active-toggle-main" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
            Habilitar veiculação e carregamento automático de anúncios AdSense no site
          </label>
        </div>
      </div>

      {/* Technical Diagnostics Live Dashboard */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Diagnóstico Técnico em Tempo Real
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            {diagnostics.adsTxt.lastTested ? `Última verificação: ${diagnostics.adsTxt.lastTested}` : "Auditado no carregamento"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Script Diagnostic */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                <span>Script no &lt;head&gt;</span>
              </span>
              {diagnostics.script.installed && !diagnostics.script.duplicated ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Instalado (1x)
                </span>
              ) : diagnostics.script.duplicated ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                  Duplicado ({diagnostics.script.count}x)
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  Não detectado
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-400 break-all">
              {diagnostics.script.detectedId ? `ID: ${diagnostics.script.detectedId}` : "Nenhum ID ativo"}
            </div>
          </div>

          {/* Meta Tag Diagnostic */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-sky-400" />
                <span>Meta Tag no &lt;head&gt;</span>
              </span>
              {diagnostics.metaTag.installed ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Instalada
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  Não detectada
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-400 break-all">
              {diagnostics.metaTag.detectedId ? `ID: ${diagnostics.metaTag.detectedId}` : "Nenhum ID ativo"}
            </div>
          </div>

          {/* ads.txt Diagnostic */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Arquivo /ads.txt</span>
              </span>
              {diagnostics.adsTxt.accessible && diagnostics.adsTxt.hasCorrectId ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  HTTP 200 OK
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  {diagnostics.adsTxt.status ? `HTTP ${diagnostics.adsTxt.status}` : "Pendente"}
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Tipo: {diagnostics.adsTxt.isPlainText ? "text/plain" : "HTML/Outro"}</span>
              <span className={diagnostics.adsTxt.hasCorrectId ? "text-emerald-400 font-bold" : "text-amber-400"}>
                {diagnostics.adsTxt.hasCorrectId ? "ID Verificado" : "ID Ausente"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BLOCO 1: Código global do Google AdSense                */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Bloco 1 — Código Global do Google AdSense
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Destino: <strong className="text-slate-700 dark:text-slate-300 font-mono">&lt;head&gt; do site</strong> (Carregamento assíncrono oficial)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              diagnostics.script.installed && !diagnostics.script.duplicated
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            }`}>
              {diagnostics.script.installed && !diagnostics.script.duplicated ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Configurado no &lt;head&gt;</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Requer validação</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Snippet JavaScript do AdSense:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRestoreOfficial("script")}
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Restaurar Código Oficial</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => copyToClipboard(scriptCode, "script")}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "script" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === "script" ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>

          <textarea
            rows={3}
            value={scriptCode}
            onChange={(e) => setScriptCode(e.target.value)}
            placeholder="<script async src=... crossorigin=anonymous></script>"
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 text-emerald-400 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none resize-y"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span>Anti-duplicação: O sistema gerencia uma única instância no &lt;head&gt;.</span>
            <button
              type="button"
              disabled={savingBlock === "script" || savingAll}
              onClick={() => handleSave("script")}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {savingBlock === "script" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Salvar Código</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BLOCO 2: Metatag de verificação do AdSense              */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Bloco 2 — Metatag de Verificação de Propriedade
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Destino: <strong className="text-slate-700 dark:text-slate-300 font-mono">&lt;head&gt; do site</strong> (Identificador oficial google-adsense-account)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              diagnostics.metaTag.installed
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            }`}>
              {diagnostics.metaTag.installed ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Instalada no &lt;head&gt;</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Não detectada</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Tag Meta HTML:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRestoreOfficial("metaTag")}
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Restaurar Metatag Oficial</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => copyToClipboard(metaTagCode, "metatag")}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "metatag" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === "metatag" ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>

          <textarea
            rows={2}
            value={metaTagCode}
            onChange={(e) => setMetaTagCode(e.target.value)}
            placeholder='<meta name="google-adsense-account" content="ca-pub-...">>'
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 text-emerald-400 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none resize-y"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span>Usada pelo rastreador do Google para verificação de propriedade do domínio.</span>
            <button
              type="button"
              disabled={savingBlock === "metaTag" || savingAll}
              onClick={() => handleSave("metaTag")}
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {savingBlock === "metaTag" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Salvar Metatag</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BLOCO 3: Arquivo ads.txt                                */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Bloco 3 — Arquivo ads.txt
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Destino: <strong className="text-slate-700 dark:text-slate-300 font-mono">/ads.txt na raiz do domínio</strong> (Servido como texto puro / plain text)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              diagnostics.adsTxt.accessible && diagnostics.adsTxt.hasCorrectId
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            }`}>
              {diagnostics.adsTxt.accessible && diagnostics.adsTxt.hasCorrectId ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Ativo e Válido (HTTP 200)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Pendente de verificação</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Conteúdo do Arquivo ads.txt:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRestoreOfficial("adsTxt")}
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Restaurar Linha Oficial</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => copyToClipboard(adsTxtContent, "adstxt")}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "adstxt" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === "adstxt" ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>

          <textarea
            rows={3}
            value={adsTxtContent}
            onChange={(e) => setAdsTxtContent(e.target.value)}
            placeholder="google.com, pub-8846628306821055, DIRECT, f08c47fec0942fa0"
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 text-emerald-400 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none resize-y"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={diagnostics.adsTxt.checking}
                onClick={() => checkAdsTxtFile()}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {diagnostics.adsTxt.checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Verificar Arquivo Público</span>
              </button>

              <a
                href="/ads.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir /ads.txt</span>
              </a>
            </div>

            <button
              type="button"
              disabled={savingBlock === "adsTxt" || savingAll}
              onClick={() => handleSave("adsTxt")}
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {savingBlock === "adsTxt" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Salvar ads.txt</span>
            </button>
          </div>
        </div>
      </div>

          {/* Global Actions Footer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Info className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>As alterações são sincronizadas no Firestore e no servidor Node/Express em tempo real.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleRestoreOfficial("all")}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Restaurar Todos os Padrões
              </button>

              <button
                type="button"
                disabled={savingAll || !!savingBlock}
                onClick={() => handleSave()}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Salvar Todas as Configurações</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
