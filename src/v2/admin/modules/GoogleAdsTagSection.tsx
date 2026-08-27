import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Save, 
  Trash2, 
  RotateCcw, 
  Activity, 
  ShieldCheck, 
  Code, 
  Loader2, 
  RefreshCw, 
  Info, 
  AlertTriangle, 
  Globe,
  Layers,
  FileCode,
  Edit3
} from "lucide-react";
import { getAuth } from "firebase/auth";
import {
  GoogleAdsTagConfig,
  GoogleTagDiagnostics,
  extractGoogleAdsTagIdFromSnippet,
  getGoogleAdsTagConfig,
  saveGoogleAdsTagConfig,
  deleteGoogleAdsTagConfig,
  runGoogleTagDiagnostics
} from "../../../services/googleAdsTagService";

interface GoogleAdsTagSectionProps {
  onRefresh?: () => void;
}

export const GoogleAdsTagSection: React.FC<GoogleAdsTagSectionProps> = ({ onRefresh }) => {
  // State from Firestore
  const [savedConfig, setSavedConfig] = useState<GoogleAdsTagConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form Fields (Snippet is the primary and only manual input required)
  const [snippetInput, setSnippetInput] = useState("");
  const [tagEnabled, setTagEnabled] = useState(true);
  const [notesInput, setNotesInput] = useState("");

  // Diagnostics & Status
  const [diagnostics, setDiagnostics] = useState<GoogleTagDiagnostics>({
    status: "NÃO CONFIGURADA",
    statusLabel: "Não configurada",
    configuredTagId: null,
    detectedTagId: null,
    scriptPresent: false,
    scriptCount: 0,
    dataLayerActive: false,
    gtagFunctionActive: false,
    idMatches: false,
    instancesCount: 0,
    applicationScope: "Todas as páginas públicas",
    loadingMode: "Global",
    details: [],
    lastChecked: ""
  });
  const [isTesting, setIsTesting] = useState(false);
  const [showDiagnosticsDetail, setShowDiagnosticsDetail] = useState(false);

  // Actions & UI Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Real-time analysis of the currently typed snippet
  const liveExtraction = useMemo(() => {
    const clean = snippetInput.trim();
    if (!clean) return { hasInput: false, isValid: false, extractedId: null, error: null };
    const analysis = extractGoogleAdsTagIdFromSnippet(clean);
    return {
      hasInput: true,
      isValid: analysis.isValid,
      extractedId: analysis.extractedId || null,
      error: analysis.error || null
    };
  }, [snippetInput]);

  // Load config on mount
  const loadConfiguration = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const cfg = await getGoogleAdsTagConfig();
      setSavedConfig(cfg);
      if (cfg) {
        setSnippetInput(cfg.snippet || "");
        setTagEnabled(cfg.enabled !== undefined ? cfg.enabled : true);
        setNotesInput(cfg.notes || "");
      } else {
        setSnippetInput("");
        setTagEnabled(true);
        setNotesInput("");
      }
      // Run technical diagnostics
      const diag = runGoogleTagDiagnostics(cfg?.tagId || null);
      setDiagnostics(diag);
    } catch (err) {
      console.error("[GoogleAdsTagSection] Error loading config:", err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  // Handle Full Snippet Change
  const handleSnippetChange = (value: string) => {
    setSnippetInput(value);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Copy detected/configured Tag ID
  const handleCopyTagId = () => {
    const idToCopy = liveExtraction.extractedId || savedConfig?.tagId;
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Run Test Verification (Auditoria Técnica Real)
  const handleTestConfiguration = () => {
    setIsTesting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowDiagnosticsDetail(true);

    setTimeout(() => {
      const targetId = savedConfig?.tagId || liveExtraction.extractedId || null;
      const diag = runGoogleTagDiagnostics(targetId);
      setDiagnostics(diag);
      setIsTesting(false);

      if (diag.status === "CARREGADA") {
        setSuccessMsg("Tag carregada corretamente! Script oficial, dataLayer e função gtag() estão ativos e verificados na aplicação.");
      } else if (diag.status === "CONFIGURADA") {
        setSuccessMsg("Tag configurada no banco de dados. Preparada para carregamento global no site.");
      } else if (diag.status === "DUPLICADA") {
        setErrorMsg("Atenção: Mais de uma instalação da Google Tag detectada no navegador.");
      } else if (diag.status === "NÃO CONFIGURADA") {
        setErrorMsg("Tag não encontrada no site. Cole o código completo e clique em 'Salvar Tag Google'.");
      } else {
        setErrorMsg(diag.errorMessage || "Tag não encontrada no site ou não pôde ser completamente validada.");
      }
    }, 450);
  };

  // Save Configuration
  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanSnippet = snippetInput.trim();
    if (!cleanSnippet) {
      setErrorMsg("Por favor, cole a Tag do Google fornecida pela sua conta do Google Ads.");
      return;
    }

    // Validate Snippet & Extract ID
    const snippetCheck = extractGoogleAdsTagIdFromSnippet(cleanSnippet);
    if (!snippetCheck.isValid || !snippetCheck.extractedId) {
      setErrorMsg(snippetCheck.error || "Código não reconhecido como uma Tag oficial do Google.");
      return;
    }

    setIsSaving(true);
    try {
      const auth = getAuth();
      const currentUserEmail = auth.currentUser?.email || "admin";

      const res = await saveGoogleAdsTagConfig({
        snippet: cleanSnippet,
        tagId: snippetCheck.extractedId,
        enabled: tagEnabled,
        notes: notesInput.trim(),
        userEmail: currentUserEmail
      });

      if (!res.success) {
        setErrorMsg(res.error || "Erro ao salvar Tag do Google.");
        return;
      }

      setSuccessMsg(`Tag do Google (${snippetCheck.extractedId}) validada, salva e instalada com sucesso em todo o site!`);
      await loadConfiguration();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("[GoogleAdsTagSection] Error saving:", err);
      setErrorMsg(err.message || "Erro inesperado ao salvar configuração.");
    } finally {
      setIsSaving(false);
    }
  };

  // Remove Tag
  const handleRemove = async () => {
    if (!window.confirm("Deseja realmente remover a Tag do Google? A medição de campanhas e conversões do Google Ads será desativada.")) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsRemoving(true);

    try {
      const res = await deleteGoogleAdsTagConfig();
      if (!res.success) {
        setErrorMsg(res.error || "Erro ao remover Tag do Google.");
        return;
      }

      setSavedConfig(null);
      setSnippetInput("");
      setNotesInput("");
      setSuccessMsg("Tag do Google removida com sucesso de todo o site.");
      
      const diag = runGoogleTagDiagnostics(null);
      setDiagnostics(diag);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("[GoogleAdsTagSection] Error removing:", err);
      setErrorMsg(err.message || "Erro ao remover Tag do Google.");
    } finally {
      setIsRemoving(false);
    }
  };

  // Clear Form Fields
  const handleClearFields = () => {
    setSnippetInput("");
    setNotesInput("");
    setErrorMsg(null);
    setSuccessMsg("Editor limpo. (A configuração salva no banco de dados não foi alterada até que você clique em 'Salvar Tag Google').");
  };

  // Restore Saved Code in Editor
  const handleRestoreSaved = () => {
    if (savedConfig?.snippet) {
      setSnippetInput(savedConfig.snippet);
      setErrorMsg(null);
      setSuccessMsg("Código salvo restaurado no editor.");
    }
  };

  const currentActiveTagId = liveExtraction.extractedId || savedConfig?.tagId || null;

  return (
    <div className="space-y-6" id="v2-admin-google-ads-tag-section">
      {/* Main Section Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                Google Ads & Tag do Google
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Campanhas & Conversões
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instale a Tag do Google para medição de conversões, remarketing e campanhas do Google Ads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={handleTestConfiguration}
            disabled={isTesting}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            title="Executar auditoria técnica real da Tag no site público"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Testar Tag</span>
          </button>
        </div>
      </div>

      {/* Distinction Warning Banner (AdSense vs Google Ads) */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900 dark:text-amber-200">
            Aviso de Separação de Serviços (Google AdSense vs Google Ads):
          </p>
          <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
            A <strong>Tag do Google Ads</strong> é utilizada para <em>medição e acompanhamento de campanhas e conversões</em> (identificadores oficiais como <code className="font-mono px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded">AW-XXXXXXXXX</code> ou <code className="font-mono px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded">GT-XXXXXX</code>). 
            O <strong>Google AdSense</strong> é destinado exclusivamente à <em>exibição de anúncios remunerados</em> (usando o Publisher ID <code className="font-mono px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded">ca-pub-8846628306821055</code>). 
            Códigos do AdSense são rejeitados neste editor para evitar conflitos de medição.
          </p>
        </div>
      </div>

      {/* Messages Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* Status & Current Tag Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status da Tag do Google Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Status da Tag do Google
            </span>
            <span className="text-[11px] text-slate-400">Auditoria técnica</span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              diagnostics.status === "CARREGADA"
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : diagnostics.status === "CONFIGURADA"
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                  : diagnostics.status === "DUPLICADA"
                    ? "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                    : diagnostics.status === "ERRO"
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}>
              {diagnostics.status === "CARREGADA" && <ShieldCheck className="w-5 h-5" />}
              {diagnostics.status === "CONFIGURADA" && <CheckCircle2 className="w-5 h-5" />}
              {diagnostics.status === "DUPLICADA" && <AlertTriangle className="w-5 h-5" />}
              {diagnostics.status === "ERRO" && <AlertCircle className="w-5 h-5" />}
              {diagnostics.status === "NÃO CONFIGURADA" && <Info className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {diagnostics.status === "CARREGADA" && "CARREGADA"}
                  {diagnostics.status === "CONFIGURADA" && "CONFIGURADA"}
                  {diagnostics.status === "NÃO CONFIGURADA" && "NÃO CONFIGURADA"}
                  {diagnostics.status === "ERRO" && "ERRO"}
                  {diagnostics.status === "DUPLICADA" && "DUPLICADA"}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  diagnostics.status === "CARREGADA"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : diagnostics.status === "CONFIGURADA"
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      : diagnostics.status === "DUPLICADA"
                        ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                        : diagnostics.status === "ERRO"
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}>
                  {diagnostics.status === "CARREGADA" && "Ativa no site"}
                  {diagnostics.status === "CONFIGURADA" && "Pronta"}
                  {diagnostics.status === "NÃO CONFIGURADA" && "Sem código"}
                  {diagnostics.status === "ERRO" && "Verificar"}
                  {diagnostics.status === "DUPLICADA" && "Duplicada"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {diagnostics.status === "CARREGADA" && "A Tag foi encontrada carregada na aplicação atual (dataLayer e gtag prontos)."}
                {diagnostics.status === "CONFIGURADA" && "Snippet válido salvo no Firestore e instalação preparada."}
                {diagnostics.status === "NÃO CONFIGURADA" && "Nenhum código ou Tag do Google salvo no momento."}
                {diagnostics.status === "ERRO" && (diagnostics.errorMessage || "Configuração inválida ou falha de carregamento.")}
                {diagnostics.status === "DUPLICADA" && "Mais de uma instalação da mesma infraestrutura foi detectada."}
              </p>
            </div>
          </div>
        </div>

        {/* Instalação & Identificador Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Onde está Instalada
            </span>
            <span className="text-[11px] text-slate-400">Escopo da Tag</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Aplicação:</span>
              </span>
              <strong className="text-slate-900 dark:text-white font-medium">todas as páginas públicas</strong>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Carregamento:</span>
              </span>
              <strong className="text-slate-900 dark:text-white font-medium">global</strong>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-500" />
                <span>Instâncias detectadas:</span>
              </span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {diagnostics.scriptCount > 0 ? diagnostics.scriptCount : (savedConfig?.tagId ? "1 (preparada)" : "0")}
              </strong>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                <span>Identificador:</span>
              </span>
              <strong className="text-blue-600 dark:text-blue-400 font-mono font-bold">
                {currentActiveTagId || "Nenhum detectado"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostics Live Checklist Panel */}
      {showDiagnosticsDetail && (
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Resultado do Teste Técnico da Tag
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {diagnostics.lastChecked ? `Auditado às ${diagnostics.lastChecked}` : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              {diagnostics.configuredTagId ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>Configuração salva: <strong className="font-mono text-white">{diagnostics.configuredTagId || "Nenhuma"}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              {diagnostics.detectedTagId ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>Identificador extraído: <strong className="font-mono text-white">{diagnostics.detectedTagId || "Nenhum"}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              {diagnostics.scriptPresent && diagnostics.scriptCount === 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : diagnostics.scriptCount > 1 ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>Script carregado: <strong className="text-white">{diagnostics.scriptCount} tag(s) no DOM</strong></span>
            </div>

            <div className="flex items-center gap-2">
              {diagnostics.dataLayerActive ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>window.dataLayer: <strong className="text-white">{diagnostics.dataLayerActive ? "Ativo (Array)" : "Inativo"}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              {diagnostics.gtagFunctionActive ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>Função window.gtag: <strong className="text-white">{diagnostics.gtagFunctionActive ? "Ativa (Function)" : "Não encontrada"}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              {diagnostics.scriptCount <= 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>Ausência de duplicação: <strong className="text-white">{diagnostics.scriptCount <= 1 ? "1 Instância única (OK)" : "Duplicada!"}</strong></span>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Presença no site público: <strong className="text-white">Carregamento global configurado em todas as rotas públicas</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN EDITOR CARD: Tag do Google — Código Completo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Tag do Google — Código Completo
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Método Principal de Configuração
          </span>
        </div>

        {/* Textarea: Large Editor */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Cole aqui exatamente a Tag do Google fornecida pela sua conta do Google Ads:</span>
            {savedConfig?.snippet && snippetInput !== savedConfig.snippet && (
              <button
                type="button"
                onClick={handleRestoreSaved}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-normal"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar código salvo</span>
              </button>
            )}
          </label>

          <textarea
            rows={8}
            value={snippetInput}
            onChange={(e) => handleSnippetChange(e.target.value)}
            placeholder="Cole aqui o código completo fornecido pelo Google Ads..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 text-blue-300 font-mono text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-y placeholder:text-slate-600 shadow-inner"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Copie o código completo diretamente da sua conta do Google Ads (ex: <code>&lt;script async src="https://www.googletagmanager.com/gtag/js?id=..."&gt;</code>) e cole no editor acima. O sistema analisa a tag com segurança, extrai o identificador automaticamente e realiza a instalação global no site.
          </p>
        </div>

        {/* DETECTED IDENTIFIER (READ-ONLY) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Identificador detectado</span>
            </span>
            {currentActiveTagId && (
              <button
                type="button"
                onClick={handleCopyTagId}
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copiado!" : "Copiar"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentActiveTagId || ""}
              placeholder="Nenhum identificador detectado ainda. Cole o código acima."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold focus:outline-none cursor-default"
            />
            {currentActiveTagId && (
              <span className="px-2.5 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-200 dark:border-emerald-800 shrink-0 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>VÁLIDO</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Identificador extraído automaticamente do código acima. Não é necessário digitar manualmente.
          </p>
        </div>

        {/* Optional Internal Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Anotações / Observações Internas (Opcional)
          </label>
          <input
            type="text"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Ex.: Tag oficial de conversão Google Ads da conta principal"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleClearFields}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar editor</span>
            </button>

            {savedConfig?.tagId && (
              <button
                type="button"
                disabled={isRemoving}
                onClick={handleRemove}
                className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Remover Tag</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{savedConfig?.tagId ? "Salvar alterações" : "Salvar Tag Google"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
