import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import {
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Globe,
  FileText,
  Lock,
  Layers,
  Save,
  RefreshCw,
  Sliders,
  Code,
  Tag,
  Check,
  AlertTriangle,
  UploadCloud,
  Search,
  RotateCcw,
  ExternalLink,
  Trash2
} from "lucide-react";
import {
  PUBLISHER_ID,
  MASKED_PUBLISHER_ID,
  OFFICIAL_DOMAIN,
  EXPECTED_ADS_TXT_URL,
  OFFICIAL_ADS_TXT_LINE,
  OFFICIAL_SNIPPET,
  OFFICIAL_METATAG,
  AdSenseConfig,
  AdSenseReviewStatus,
  subscribeAdSenseConfig,
  saveAdSenseConfig,
  validateAdSenseSnippet,
  validateAdSenseMetaTag,
  validateAdsTxtLine,
  checkDomainVerification,
  checkLocalAdsTxt,
  DEFAULT_ADSENSE_CONFIG
} from "../services/adsenseService";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ADSENSE MANAGER ERROR BOUNDARY]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-6 text-red-200 space-y-4 shadow-xl my-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <h3 className="font-extrabold text-base">
              Aviso na Seção do AdSense
            </h3>
          </div>
          <p className="text-xs text-red-300 leading-relaxed">
            Ocorreu um erro isolado no componente de gerenciamento do AdSense. As outras funções do painel administrativo continuam operando normalmente.
          </p>
          {this.state.error && (
            <div className="p-3 bg-black/50 border border-red-900/50 rounded-xl font-mono text-[11px] text-red-400 overflow-x-auto">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Tentar recarregar seção AdSense</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AdminAdsenseManagerProps {
  currentUserId?: string;
}

function AdminAdsenseManagerContent({ currentUserId }: AdminAdsenseManagerProps) {
  const [config, setConfig] = useState<AdSenseConfig>(DEFAULT_ADSENSE_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Messages for actions
  const [prepareSuccess, setPrepareSuccess] = useState<boolean>(false);
  const [prepareMessage, setPrepareMessage] = useState<string | null>(null);

  // Validation manually triggered messages
  const [manualValidationMsg, setManualValidationMsg] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Live Domain Check state
  const [domainCheck, setDomainCheck] = useState<{
    checking: boolean;
    accessible: boolean;
    publisherIdFound: boolean;
    methodFound: boolean;
    occurrences: number;
    inHead: boolean;
    location: string;
    timestamp: string;
  }>({
    checking: false,
    accessible: true,
    publisherIdFound: true,
    methodFound: true,
    occurrences: 1,
    inHead: true,
    location: "HTML público (Home)",
    timestamp: new Date().toLocaleString("pt-BR")
  });

  // Local ads.txt check state
  const [adsTxtCheck, setAdsTxtCheck] = useState<{
    checking: boolean;
    found: boolean;
    validLine: boolean;
    content: string;
    httpStatus: number;
  }>({
    checking: false,
    found: true,
    validLine: true,
    content: OFFICIAL_ADS_TXT_LINE,
    httpStatus: 200
  });

  // Validation computation helpers
  const snippetVal = validateAdSenseSnippet(config.verificationSnippet || "");
  const metaVal = validateAdSenseMetaTag(config.verificationMetaTag || "");
  const adsTxtVal = validateAdsTxtLine(config.verificationAdsTxtLine || "");

  useEffect(() => {
    let isMounted = true;
    setLoadingConfig(true);

    const unsubscribe = subscribeAdSenseConfig((newConfig) => {
      if (isMounted) {
        setConfig(newConfig);
        setLoadingConfig(false);
      }
    });

    // Run initial checks safely
    runDomainCheck();
    runAdsTxtCheck();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const runDomainCheck = async () => {
    setDomainCheck((prev) => ({ ...prev, checking: true }));
    try {
      const res = await checkDomainVerification();
      setDomainCheck({
        checking: false,
        accessible: res.accessible,
        publisherIdFound: res.publisherIdFound,
        methodFound: res.methodFound,
        occurrences: res.occurrences,
        inHead: res.inHead,
        location: res.location,
        timestamp: res.timestamp
      });
    } catch (err) {
      setDomainCheck((prev) => ({ ...prev, checking: false }));
    }
  };

  const runAdsTxtCheck = async () => {
    setAdsTxtCheck((prev) => ({ ...prev, checking: true }));
    try {
      const res = await checkLocalAdsTxt();
      setAdsTxtCheck({
        checking: false,
        found: res.found,
        validLine: res.validLine,
        content: res.content || OFFICIAL_ADS_TXT_LINE,
        httpStatus: res.httpStatus
      });
    } catch (err) {
      setAdsTxtCheck((prev) => ({ ...prev, checking: false }));
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await saveAdSenseConfig(config, currentUserId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("[ADSENSE ADMIN] Error saving config:", err);
      setSaveError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePrepareForPublication = async (methodName: string) => {
    setSaving(true);
    setPrepareSuccess(false);
    setPrepareMessage(null);

    try {
      const updated = {
        ...config,
        preparedForDeploy: true,
        lastVerificationCheck: new Date().toLocaleString("pt-BR")
      };
      setConfig(updated);
      await saveAdSenseConfig(updated, currentUserId);

      setPrepareSuccess(true);
      setPrepareMessage(
        `Configuração para "${methodName}" salva e preparada no Firestore. O script de pré-build automático aplicará esta configuração no próximo deploy.`
      );
    } catch (err: any) {
      setSaveError("Erro ao preparar publicação: " + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  const reviewStatusOptions: AdSenseReviewStatus[] = [
    "Não configurado",
    "Código instalado",
    "Aguardando verificação",
    "Aguardando revisão",
    "Aprovado",
    "Reprovado",
    "Verificação manual necessária"
  ];

  return (
    <div className="space-y-8 text-text-main font-sans">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card-main border border-border-main p-6 rounded-2xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-green-primary/10 text-green-primary border border-green-primary/20 rounded-full">
              Monetização Oficial
            </span>
            <span className="text-xs font-mono text-text-sec">
              {config.adsenseEnabled ? "🟢 AdSense Ativo" : "🔴 AdSense Desativado"}
            </span>
            {loadingConfig && (
              <span className="text-[10px] text-text-muted animate-pulse font-mono">
                Carregando dados...
              </span>
            )}
          </div>
          <h2 className="font-display font-extrabold text-xl md:text-2xl tracking-tight text-text-main flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-primary" />
            Monetização / Google AdSense
          </h2>
          <p className="text-xs text-text-sec font-medium leading-relaxed">
            Gerenciador real de verificação e monetização do Google AdSense do Conversor Áudio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runDomainCheck}
            disabled={domainCheck.checking}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-card-inner hover:bg-card-elevated border border-border-main hover:border-green-primary/30 text-xs font-bold rounded-xl transition-all cursor-pointer text-text-main"
            title="Verificar HTML público na Home"
          >
            <Search className={`h-3.5 w-3.5 text-green-primary ${domainCheck.checking ? "animate-spin" : ""}`} />
            <span>Verificar no Domínio</span>
          </button>

          <button
            onClick={runAdsTxtCheck}
            disabled={adsTxtCheck.checking}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-card-inner hover:bg-card-elevated border border-border-main hover:border-green-primary/30 text-xs font-bold rounded-xl transition-all cursor-pointer text-text-main"
            title="Verificar arquivo /ads.txt"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-green-primary ${adsTxtCheck.checking ? "animate-spin" : ""}`} />
            <span>Verificar ads.txt</span>
          </button>
        </div>
      </div>

      {/* 1. SECTION: VERIFICAÇÃO DA PROPRIEDADE NO GOOGLE ADSENSE */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 md:p-8 space-y-6 shadow-md">
        
        {/* Section Header */}
        <div className="border-b border-border-main pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-extrabold text-base md:text-lg text-text-main flex items-center gap-2 uppercase tracking-wide">
              <ShieldCheck className="h-5 w-5 text-green-primary" />
              VERIFICAÇÃO DA PROPRIEDADE NO GOOGLE ADSENSE
            </h3>
            <p className="text-xs text-text-sec font-medium mt-1">
              Valide e prepare as opções de verificação oficial da conta no AdSense
            </p>
          </div>
          <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-[11px] font-bold rounded-lg self-start md:self-auto">
            Publisher: {MASKED_PUBLISHER_ID}
          </span>
        </div>

        {/* REQUIRED NOTICE ABOVE TABS */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-blue-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Instruções de Verificação</span>
          </div>
          <p className="text-blue-200/90 leading-relaxed font-medium">
            Escolha apenas um método principal de verificação. Depois de preparar a configuração, será necessário baixar a nova versão e realizar um novo deploy na Vercel.
          </p>
        </div>

        {/* Three Tabs for Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Tab 1: Código do AdSense */}
          <button
            type="button"
            onClick={() => {
              setConfig((prev) => ({ ...prev, selectedVerificationMethod: "snippet" }));
              setManualValidationMsg(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 relative ${
              config.selectedVerificationMethod === "snippet"
                ? "bg-green-primary/10 border-green-primary text-text-main shadow-md"
                : "bg-card-inner border-border-main hover:border-text-sec/40 text-text-sec"
            }`}
          >
            <div className="flex items-center justify-between">
              <Code className="h-5 w-5 text-green-primary" />
              {config.selectedVerificationMethod === "snippet" && (
                <Check className="h-4 w-4 text-green-primary font-bold" />
              )}
            </div>
            <div>
              <p className="font-extrabold text-xs text-text-main">1. Código do AdSense</p>
              <p className="text-[10px] text-text-sec mt-0.5">Snippet JavaScript async</p>
            </div>
            <span className="inline-block text-[9px] font-mono uppercase font-bold text-green-primary">
              [ Código do AdSense ]
            </span>
          </button>

          {/* Tab 2: Arquivo ads.txt */}
          <button
            type="button"
            onClick={() => {
              setConfig((prev) => ({ ...prev, selectedVerificationMethod: "ads_txt" }));
              setManualValidationMsg(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 relative ${
              config.selectedVerificationMethod === "ads_txt"
                ? "bg-green-primary/10 border-green-primary text-text-main shadow-md"
                : "bg-card-inner border-border-main hover:border-text-sec/40 text-text-sec"
            }`}
          >
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-green-primary" />
              {config.selectedVerificationMethod === "ads_txt" && (
                <Check className="h-4 w-4 text-green-primary font-bold" />
              )}
            </div>
            <div>
              <p className="font-extrabold text-xs text-text-main">2. Arquivo ads.txt</p>
              <p className="text-[10px] text-text-sec mt-0.5">Linha oficial em /public/ads.txt</p>
            </div>
            <span className="inline-block text-[9px] font-mono uppercase font-bold text-green-primary">
              [ Arquivo ads.txt ]
            </span>
          </button>

          {/* Tab 3: Metatag */}
          <button
            type="button"
            onClick={() => {
              setConfig((prev) => ({ ...prev, selectedVerificationMethod: "metatag" }));
              setManualValidationMsg(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 relative ${
              config.selectedVerificationMethod === "metatag"
                ? "bg-green-primary/10 border-green-primary text-text-main shadow-md"
                : "bg-card-inner border-border-main hover:border-text-sec/40 text-text-sec"
            }`}
          >
            <div className="flex items-center justify-between">
              <Tag className="h-5 w-5 text-green-primary" />
              {config.selectedVerificationMethod === "metatag" && (
                <Check className="h-4 w-4 text-green-primary font-bold" />
              )}
            </div>
            <div>
              <p className="font-extrabold text-xs text-text-main">3. Metatag</p>
              <p className="text-[10px] text-text-sec mt-0.5">Tag &lt;meta&gt; da conta</p>
            </div>
            <span className="inline-block text-[9px] font-mono uppercase font-bold text-green-primary">
              [ Metatag ]
            </span>
          </button>

        </div>

        {/* TAB 1: CÓDIGO DO ADSENSE */}
        {config.selectedVerificationMethod === "snippet" && (
          <div className="bg-card-inner border border-border-main rounded-xl p-5 space-y-5">
            <div className="border-b border-border-main/60 pb-3">
              <h4 className="font-extrabold text-xs text-text-main flex items-center gap-2">
                <Code className="h-4 w-4 text-green-primary" />
                Cole aqui o snippet oficial fornecido pelo Google AdSense
              </h4>
              <p className="text-[11px] text-text-sec mt-0.5">
                Cole abaixo o script completo fornecido pelo Google. Ele será armazenado para verificação. O código colado é apenas analisado e nunca executado dentro deste painel.
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                rows={4}
                value={config.verificationSnippet}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, verificationSnippet: e.target.value }));
                  setManualValidationMsg(null);
                }}
                placeholder='<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8846628306821055" crossorigin="anonymous"></script>'
                className="w-full bg-black/50 border border-border-main focus:border-green-primary text-green-400 font-mono text-xs rounded-xl p-3 outline-none leading-relaxed"
              />

              {/* Validation Status Badge */}
              {snippetVal.isValid ? (
                <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                  <span>Snippet Válido — Publisher ID: {snippetVal.extractedPublisherId}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>Validação: {snippetVal.error}</span>
                </div>
              )}

              {/* Action Buttons for Tab 1 */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const val = validateAdSenseSnippet(config.verificationSnippet);
                    if (val.isValid) {
                      setManualValidationMsg({
                        type: "success",
                        text: `Snippet validado com sucesso! Publisher ID detectado: ${val.extractedPublisherId}`
                      });
                    } else {
                      setManualValidationMsg({
                        type: "error",
                        text: `Atenção: ${val.error}`
                      });
                    }
                  }}
                  className="px-4 py-2 bg-green-primary hover:bg-green-dark text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Validar código</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrepareForPublication("Código do AdSense")}
                  disabled={saving}
                  className="px-4 py-2 bg-card-main hover:bg-card-elevated border border-green-primary/30 text-green-primary font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Preparar para publicação</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({ ...prev, verificationSnippet: "" }));
                    setManualValidationMsg({
                      type: "info",
                      text: "Campo de snippet limpo."
                    });
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Limpar campo</span>
                </button>
              </div>

              {manualValidationMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  manualValidationMsg.type === "success"
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : manualValidationMsg.type === "error"
                    ? "bg-red-500/10 border border-red-500/30 text-red-400"
                    : "bg-blue-500/10 border border-blue-500/30 text-blue-300"
                }`}>
                  {manualValidationMsg.text}
                </div>
              )}
            </div>

            {/* Target information display */}
            <div className="pt-3 border-t border-border-main/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-card-main border border-border-main rounded-xl space-y-1">
                <span className="text-[10px] text-text-sec uppercase font-bold block">Destino:</span>
                <code className="text-xs font-mono font-bold text-green-primary">/index.html</code>
              </div>
              <div className="p-3 bg-card-main border border-border-main rounded-xl space-y-1">
                <span className="text-[10px] text-text-sec uppercase font-bold block">Local:</span>
                <span className="text-xs font-mono font-bold text-text-main">dentro da tag &lt;head&gt;</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ARQUIVO ADS.TXT */}
        {config.selectedVerificationMethod === "ads_txt" && (
          <div className="bg-card-inner border border-border-main rounded-xl p-5 space-y-5">
            <div className="border-b border-border-main/60 pb-3">
              <h4 className="font-extrabold text-xs text-text-main flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-primary" />
                Cole aqui a linha oficial do ads.txt
              </h4>
              <p className="text-[11px] text-text-sec mt-0.5">
                Exemplo estrutural: <code className="font-mono text-green-primary">google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0</code>
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={config.verificationAdsTxtLine}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, verificationAdsTxtLine: e.target.value }));
                  setManualValidationMsg(null);
                }}
                placeholder="google.com, pub-8846628306821055, DIRECT, f08c47fec0942fa0"
                className="w-full bg-black/50 border border-border-main focus:border-green-primary text-green-400 font-mono text-xs rounded-xl p-3 outline-none"
              />

              {/* Validation Status Badge */}
              {adsTxtVal.isValid ? (
                <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                  <span>Linha do ads.txt Válida — {adsTxtVal.extractedPublisherId}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>Erro na linha: {adsTxtVal.error}</span>
                </div>
              )}

              {/* Action Buttons for Tab 2 */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const val = validateAdsTxtLine(config.verificationAdsTxtLine);
                    if (val.isValid) {
                      setManualValidationMsg({
                        type: "success",
                        text: `Linha do ads.txt validada com sucesso! ${val.extractedPublisherId}`
                      });
                    } else {
                      setManualValidationMsg({
                        type: "error",
                        text: `Atenção: ${val.error}`
                      });
                    }
                  }}
                  className="px-4 py-2 bg-green-primary hover:bg-green-dark text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Validar linha</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrepareForPublication("Arquivo ads.txt")}
                  disabled={saving}
                  className="px-4 py-2 bg-card-main hover:bg-card-elevated border border-green-primary/30 text-green-primary font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Preparar ads.txt</span>
                </button>

                <button
                  type="button"
                  onClick={runAdsTxtCheck}
                  disabled={adsTxtCheck.checking}
                  className="px-4 py-2 bg-card-main hover:bg-card-elevated border border-border-main text-text-main font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-green-primary ${adsTxtCheck.checking ? "animate-spin" : ""}`} />
                  <span>Verificar no domínio</span>
                </button>
              </div>

              {manualValidationMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  manualValidationMsg.type === "success"
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : manualValidationMsg.type === "error"
                    ? "bg-red-500/10 border border-red-500/30 text-red-400"
                    : "bg-blue-500/10 border border-blue-500/30 text-blue-300"
                }`}>
                  {manualValidationMsg.text}
                </div>
              )}
            </div>

            {/* Target information display */}
            <div className="pt-3 border-t border-border-main/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-card-main border border-border-main rounded-xl space-y-1">
                <span className="text-[10px] text-text-sec uppercase font-bold block">Destino:</span>
                <code className="text-xs font-mono font-bold text-green-primary">/public/ads.txt</code>
              </div>
              <div className="p-3 bg-card-main border border-border-main rounded-xl space-y-1">
                <span className="text-[10px] text-text-sec uppercase font-bold block">URL:</span>
                <a
                  href={EXPECTED_ADS_TXT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono font-bold text-green-primary hover:underline flex items-center gap-1"
                >
                  <span>{EXPECTED_ADS_TXT_URL}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: METATAG */}
        {config.selectedVerificationMethod === "metatag" && (
          <div className="bg-card-inner border border-border-main rounded-xl p-5 space-y-5">
            <div className="border-b border-border-main/60 pb-3">
              <h4 className="font-extrabold text-xs text-text-main flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-primary" />
                Cole aqui a metatag oficial do Google AdSense
              </h4>
              <p className="text-[11px] text-text-sec mt-0.5">
                Formato esperado: <code className="font-mono text-green-primary">&lt;meta name="google-adsense-account" content="ca-pub-..."&gt;</code>
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={config.verificationMetaTag}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, verificationMetaTag: e.target.value }));
                  setManualValidationMsg(null);
                }}
                placeholder='<meta name="google-adsense-account" content="ca-pub-8846628306821055">'
                className="w-full bg-black/50 border border-border-main focus:border-green-primary text-green-400 font-mono text-xs rounded-xl p-3 outline-none"
              />

              {/* Validation Status Badge */}
              {metaVal.isValid ? (
                <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                  <span>Metatag Válida — ID: {metaVal.extractedPublisherId}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>Metatag Inválida: {metaVal.error}</span>
                </div>
              )}

              {/* Action Buttons for Tab 3 */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const val = validateAdSenseMetaTag(config.verificationMetaTag);
                    if (val.isValid) {
                      setManualValidationMsg({
                        type: "success",
                        text: `Metatag validada com sucesso! Publisher ID: ${val.extractedPublisherId}`
                      });
                    } else {
                      setManualValidationMsg({
                        type: "error",
                        text: `Atenção: ${val.error}`
                      });
                    }
                  }}
                  className="px-4 py-2 bg-green-primary hover:bg-green-dark text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Validar metatag</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrepareForPublication("Metatag")}
                  disabled={saving}
                  className="px-4 py-2 bg-card-main hover:bg-card-elevated border border-green-primary/30 text-green-primary font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Preparar para publicação</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({ ...prev, verificationMetaTag: "" }));
                    setManualValidationMsg({
                      type: "info",
                      text: "Campo de metatag limpo."
                    });
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Limpar campo</span>
                </button>
              </div>

              {manualValidationMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  manualValidationMsg.type === "success"
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : manualValidationMsg.type === "error"
                    ? "bg-red-500/10 border border-red-500/30 text-red-400"
                    : "bg-blue-500/10 border border-blue-500/30 text-blue-300"
                }`}>
                  {manualValidationMsg.text}
                </div>
              )}
            </div>

            {/* Target information display */}
            <div className="pt-3 border-t border-border-main/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-card-main border border-border-main rounded-xl space-y-1">
                <span className="text-[10px] text-text-sec uppercase font-bold block">Destino:</span>
                <code className="text-xs font-mono font-bold text-green-primary">/index.html</code>
              </div>
              <div className="p-3 bg-card-main border border-border-main rounded-xl space-y-1">
                <span className="text-[10px] text-text-sec uppercase font-bold block">Local:</span>
                <span className="text-xs font-mono font-bold text-text-main">dentro da tag &lt;head&gt;</span>
              </div>
            </div>
          </div>
        )}

        {/* Global Action Messages */}
        {prepareSuccess && prepareMessage && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
            <span>{prepareMessage}</span>
          </div>
        )}

        {saveError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{saveError}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
            <span>Configurações salvas no Firestore com sucesso!</span>
          </div>
        )}

      </div>

      {/* 2. LIVE DOMAIN VERIFICATION DETAILS */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-display font-extrabold text-base text-text-main flex items-center gap-2">
            <Search className="h-5 w-5 text-green-primary" />
            Validação do HTML Público no Domínio Oficial
          </h3>

          <span className="text-xs font-mono text-text-sec">
            Checagem: {domainCheck.timestamp}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          <div className="p-3 bg-card-inner border border-border-main rounded-xl space-y-1">
            <span className="text-[10px] text-text-sec block font-bold">Local da Consulta:</span>
            <p className="font-mono font-bold text-text-main truncate">{domainCheck.location}</p>
          </div>

          <div className="p-3 bg-card-inner border border-border-main rounded-xl space-y-1">
            <span className="text-[10px] text-text-sec block font-bold">Publisher ID Encontrado:</span>
            <p className={`font-mono font-bold ${domainCheck.publisherIdFound ? "text-green-primary" : "text-red-400"}`}>
              {domainCheck.publisherIdFound ? "Encontrado em HTML" : "Não encontrado"}
            </p>
          </div>

          <div className="p-3 bg-card-inner border border-border-main rounded-xl space-y-1">
            <span className="text-[10px] text-text-sec block font-bold">Ocorrências no HTML:</span>
            <p className="font-mono font-bold text-text-main">
              {domainCheck.occurrences} {domainCheck.occurrences === 1 ? "(1 Ocorrência)" : ""}
            </p>
          </div>

          <div className="p-3 bg-card-inner border border-border-main rounded-xl space-y-1">
            <span className="text-[10px] text-text-sec block font-bold">Posição no &lt;head&gt;:</span>
            <p className={`font-mono font-bold ${domainCheck.inHead ? "text-green-primary" : "text-yellow-400"}`}>
              {domainCheck.inHead ? "Sim (No <head>)" : "Não detectado no <head>"}
            </p>
          </div>

        </div>
      </div>

      {/* 3. CONFIGURAÇÕES GERAIS E OBSERVAÇÕES */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 md:p-8 space-y-6 shadow-md">
        <div className="border-b border-border-main pb-4">
          <h3 className="font-display font-extrabold text-base md:text-lg text-text-main flex items-center gap-2">
            <Sliders className="h-5 w-5 text-green-primary" />
            Configurações Gerais do AdSense
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Global Toggle: AdSense Enabled */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-text-main">
              AdSense Ativado (Script Global)
            </label>
            <select
              value={config.adsenseEnabled ? "sim" : "nao"}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  adsenseEnabled: e.target.value === "sim"
                }))
              }
              className="w-full bg-card-inner border border-border-main focus:border-green-primary text-text-main text-xs font-bold rounded-xl p-3 outline-none"
            >
              <option value="sim">Sim — Ativar anúncios automáticos</option>
              <option value="nao">Não — Desativar exibição de anúncios</option>
            </select>
          </div>

          {/* Review Status in AdSense Panel */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-text-main">
              Status Registrado no Google AdSense
            </label>
            <select
              value={config.reviewStatus}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  reviewStatus: e.target.value as AdSenseReviewStatus
                }))
              }
              className="w-full bg-card-inner border border-border-main focus:border-green-primary text-text-main text-xs font-bold rounded-xl p-3 outline-none"
            >
              {reviewStatusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Publisher ID */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-text-main flex items-center justify-between">
              <span>Publisher ID</span>
              <span className="text-[10px] text-text-sec uppercase font-mono">(Fixo Oficial)</span>
            </label>
            <input
              type="text"
              value={PUBLISHER_ID}
              readOnly
              className="w-full bg-card-inner border border-border-main text-text-sec font-mono text-xs font-bold rounded-xl p-3 outline-none cursor-not-allowed opacity-80"
            />
          </div>

          {/* Registered Domain */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-text-main flex items-center justify-between">
              <span>Domínio Registrado</span>
              <span className="text-[10px] text-text-sec uppercase font-mono">(Fixo Oficial)</span>
            </label>
            <input
              type="text"
              value={OFFICIAL_DOMAIN}
              readOnly
              className="w-full bg-card-inner border border-border-main text-text-sec font-mono text-xs font-bold rounded-xl p-3 outline-none cursor-not-allowed opacity-80"
            />
          </div>

          {/* Administrative Notes with MANDATORY WARNING */}
          <div className="space-y-2 md:col-span-2 pt-2">
            {/* REQUIRED NOTICE ABOVE NOTES FIELD */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>O campo Observações administrativas não instala códigos e não deve ser utilizado para verificação.</span>
            </div>

            <label className="block text-xs font-extrabold text-text-main pt-1">
              Observações administrativas
            </label>
            <textarea
              rows={3}
              value={config.notes}
              onChange={(e) => setConfig((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Anotações internas do administrador sobre a conta e o processo de verificação..."
              className="w-full bg-card-inner border border-border-main focus:border-green-primary text-text-main text-xs rounded-xl p-3 outline-none leading-relaxed"
            />
          </div>

        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-primary hover:bg-green-dark text-white font-extrabold text-xs rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Salvando..." : "Salvar Configurações no Firestore"}</span>
          </button>
        </div>
      </div>

      {/* 4. PROTECTED AREAS & AD EXCLUSIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recommended Excluded Pages */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 space-y-4 shadow-md">
          <h3 className="font-display font-extrabold text-sm text-text-main flex items-center gap-2">
            <Lock className="h-4 w-4 text-green-primary" />
            Páginas Recomendadas para Exclusão
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-card-inner border border-border-main rounded-lg text-text-main font-bold">/admin</div>
            <div className="p-2.5 bg-card-inner border border-border-main rounded-lg text-text-main font-bold">/admin-login</div>
            <div className="p-2.5 bg-card-inner border border-border-main rounded-lg text-text-main font-bold">Rotas Privadas</div>
            <div className="p-2.5 bg-card-inner border border-border-main rounded-lg text-text-main font-bold">Modais / Previews</div>
          </div>
        </div>

        {/* Protected Attributes */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 space-y-4 shadow-md">
          <h3 className="font-display font-extrabold text-sm text-text-main flex items-center gap-2">
            <Layers className="h-4 w-4 text-green-primary" />
            Áreas Protegidas (<code className="text-[10px] font-mono text-green-primary">data-ads-exclude="true"</code>)
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-card-inner border border-border-main rounded-lg text-center font-bold text-text-main">Header / Logo</div>
            <div className="p-2 bg-card-inner border border-border-main rounded-lg text-center font-bold text-text-main">Área de Upload</div>
            <div className="p-2 bg-card-inner border border-border-main rounded-lg text-center font-bold text-text-main">Botão Converter / Baixar</div>
            <div className="p-2 bg-card-inner border border-border-main rounded-lg text-center font-bold text-text-main">Footer / Rodapé</div>
          </div>
        </div>

      </div>

    </div>
  );
}

// Wrapper with SectionErrorBoundary
export default function AdminAdsenseManager(props: AdminAdsenseManagerProps) {
  return (
    <SectionErrorBoundary>
      <AdminAdsenseManagerContent {...props} />
    </SectionErrorBoundary>
  );
}
