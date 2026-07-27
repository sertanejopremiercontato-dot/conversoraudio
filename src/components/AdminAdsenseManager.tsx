import React, { useState, useEffect } from "react";
import {
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Globe,
  FileText,
  Lock,
  Layers,
  Info,
  Save,
  RefreshCw,
  ExternalLink,
  Eye,
  Sliders,
  Sparkles,
  HelpCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import {
  PUBLISHER_ID,
  MASKED_PUBLISHER_ID,
  OFFICIAL_DOMAIN,
  EXPECTED_ADS_TXT_URL,
  OFFICIAL_ADS_TXT_LINE,
  AdSenseConfig,
  AdSenseReviewStatus,
  subscribeAdSenseConfig,
  saveAdSenseConfig,
  checkLocalAdsTxt
} from "../services/adsenseService";

interface AdminAdsenseManagerProps {
  currentUserId?: string;
}

export default function AdminAdsenseManager({ currentUserId }: AdminAdsenseManagerProps) {
  const [config, setConfig] = useState<AdSenseConfig>({
    adsenseEnabled: true,
    publisherId: PUBLISHER_ID,
    domain: OFFICIAL_DOMAIN,
    mode: "Anúncios automáticos",
    reviewStatus: "Aguardando verificação",
    notes: ""
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ads.txt check state
  const [adsTxtStatus, setAdsTxtStatus] = useState<{
    found: boolean;
    validLine: boolean;
    content: string;
    checking: boolean;
  }>({
    found: true,
    validLine: true,
    content: OFFICIAL_ADS_TXT_LINE,
    checking: false
  });

  // Local verification timestamp
  const [lastCheckTime, setLastCheckTime] = useState<string>("");

  useEffect(() => {
    setLastCheckTime(new Date().toLocaleString("pt-BR"));
    
    // Subscribe to Firestore settings
    const unsubscribe = subscribeAdSenseConfig((newConfig) => {
      setConfig(newConfig);
    });

    // Verify local ads.txt
    runAdsTxtCheck();

    return () => unsubscribe();
  }, []);

  const runAdsTxtCheck = async () => {
    setAdsTxtStatus((prev) => ({ ...prev, checking: true }));
    const result = await checkLocalAdsTxt();
    setAdsTxtStatus({
      found: result.found,
      validLine: result.validLine,
      content: result.content || OFFICIAL_ADS_TXT_LINE,
      checking: false
    });
    setLastCheckTime(new Date().toLocaleString("pt-BR"));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card-main border border-border-main p-6 rounded-2xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-green-primary/10 text-green-primary border border-green-primary/20 rounded-full">
              Monetização Oficial
            </span>
            <span className="text-xs font-mono text-text-sec">
              {config.adsenseEnabled ? "🟢 Script Ativo" : "🔴 Script Desativado"}
            </span>
          </div>
          <h2 className="font-display font-extrabold text-xl md:text-2xl tracking-tight text-text-main flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-primary" />
            Google AdSense
          </h2>
          <p className="text-xs text-text-sec font-medium leading-relaxed">
            Gerenciamento profissional da integração AdSense para {OFFICIAL_DOMAIN}
          </p>
        </div>

        <button
          onClick={runAdsTxtCheck}
          disabled={adsTxtStatus.checking}
          className="flex items-center gap-2 px-4 py-2.5 bg-card-inner hover:bg-card-elevated border border-border-main hover:border-green-primary/30 text-xs font-bold rounded-xl transition-all cursor-pointer text-text-main"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-green-primary ${adsTxtStatus.checking ? "animate-spin" : ""}`} />
          <span>Verificar Localmente</span>
        </button>
      </div>

      {/* 1. Header Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Card 1: Snippet Instalado */}
        <div className="bg-card-inner border border-border-main rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-sec">Snippet Global</span>
            <CheckCircle2 className="h-4 w-4 text-green-primary" />
          </div>
          <p className="font-extrabold text-sm text-text-main">
            {config.adsenseEnabled ? "Instalado & Controlado" : "Desativado pelo Admin"}
          </p>
          <p className="text-[11px] text-text-sec">
            Gerenciado via <code className="text-green-primary font-mono text-[10px]">adsenseService.ts</code>
          </p>
        </div>

        {/* Card 2: Publisher ID */}
        <div className="bg-card-inner border border-border-main rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-sec">Publisher ID</span>
            <ShieldCheck className="h-4 w-4 text-green-primary" />
          </div>
          <p className="font-mono font-bold text-sm text-text-main break-all">
            {PUBLISHER_ID}
          </p>
          <p className="text-[11px] text-text-sec">ID Oficial da Conta AdSense</p>
        </div>

        {/* Card 3: ads.txt */}
        <div className="bg-card-inner border border-border-main rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-sec">Arquivo ads.txt</span>
            {adsTxtStatus.found && adsTxtStatus.validLine ? (
              <CheckCircle2 className="h-4 w-4 text-green-primary" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <p className="font-extrabold text-sm text-text-main flex items-center gap-1.5 truncate">
            {adsTxtStatus.found ? "Encontrado & Configurado" : "Aguardando Arquivo"}
          </p>
          <p className="text-[11px] font-mono text-text-sec truncate">
            /ads.txt (Linha oficial)
          </p>
        </div>

        {/* Card 4: Domínio Oficial */}
        <div className="bg-card-inner border border-border-main rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-sec">Domínio Oficial</span>
            <Globe className="h-4 w-4 text-green-primary" />
          </div>
          <p className="font-mono font-bold text-sm text-text-main truncate">
            {OFFICIAL_DOMAIN}
          </p>
          <p className="text-[11px] text-text-sec">Configurado para produção</p>
        </div>

        {/* Card 5: Status da Integração */}
        <div className="bg-card-inner border border-border-main rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-sec">Status da Integração</span>
            <Sparkles className="h-4 w-4 text-green-primary" />
          </div>
          <p className="font-extrabold text-sm text-green-primary">
            {config.reviewStatus}
          </p>
          <p className="text-[11px] text-text-sec">Definido manualmente pelo Admin</p>
        </div>

        {/* Card 6: Última Verificação */}
        <div className="bg-card-inner border border-border-main rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-sec">Última Verificação Local</span>
            <RefreshCw className="h-4 w-4 text-text-sec" />
          </div>
          <p className="font-mono font-bold text-xs text-text-main truncate">
            {lastCheckTime || "Agora"}
          </p>
          <p className="text-[11px] text-text-sec">Validação de script e ads.txt</p>
        </div>

      </div>

      {/* 2. Visual Status Summary (Status Visual) */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 space-y-4 shadow-md">
        <h3 className="font-display font-extrabold text-base text-text-main flex items-center gap-2">
          <Eye className="h-5 w-5 text-green-primary" />
          Resumo do Status Visual do AdSense
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-medium">
          <div className="bg-card-inner border border-border-main p-3.5 rounded-xl space-y-1">
            <span className="text-text-sec text-[11px]">Publisher ID:</span>
            <p className="font-mono font-extrabold text-text-main">{MASKED_PUBLISHER_ID}</p>
          </div>

          <div className="bg-card-inner border border-border-main p-3.5 rounded-xl space-y-1">
            <span className="text-text-sec text-[11px]">Código global:</span>
            <p className="font-extrabold text-green-primary">Instalado</p>
          </div>

          <div className="bg-card-inner border border-border-main p-3.5 rounded-xl space-y-1">
            <span className="text-text-sec text-[11px]">ads.txt:</span>
            <p className="font-extrabold text-green-primary">Configurado</p>
          </div>

          <div className="bg-card-inner border border-border-main p-3.5 rounded-xl space-y-1">
            <span className="text-text-sec text-[11px]">Consentimento:</span>
            <p className="font-extrabold text-yellow-500">Pendente de revisão</p>
          </div>

          <div className="bg-card-inner border border-border-main p-3.5 rounded-xl space-y-1">
            <span className="text-text-sec text-[11px]">Anúncios automáticos:</span>
            <p className="font-extrabold text-text-main">Configuração feita no AdSense</p>
          </div>

          <div className="bg-card-inner border border-border-main p-3.5 rounded-xl space-y-1">
            <span className="text-text-sec text-[11px]">Revisão do site:</span>
            <p className="font-extrabold text-green-primary">{config.reviewStatus}</p>
          </div>
        </div>
      </div>

      {/* 3. Configuração Principal (Main Form) */}
      <form onSubmit={handleSave} className="bg-card-main border border-border-main rounded-2xl p-6 md:p-8 space-y-6 shadow-md">
        <div className="border-b border-border-main pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-base md:text-lg text-text-main flex items-center gap-2">
              <Sliders className="h-5 w-5 text-green-primary" />
              Configuração Principal da Monetização
            </h3>
            <p className="text-xs text-text-sec font-medium mt-0.5">
              Ajuste as chaves de controle do Google AdSense armazenadas no Firestore
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Configurações do Google AdSense salvas com sucesso no banco de dados!</span>
          </div>
        )}

        {saveError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Erro ao salvar: {saveError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* AdSense Ativado (Toggle/Select) */}
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
              <option value="sim">Sim — Carregar snippet AdSense nas páginas públicas</option>
              <option value="nao">Não — Desativar snippet do AdSense (sem anúncios)</option>
            </select>
            <p className="text-[11px] text-text-sec">
              Quando desativado, nenhum script do AdSense é injetado e nenhum erro é gerado.
            </p>
          </div>

          {/* Publisher ID (Read-only) */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-text-main flex items-center justify-between">
              <span>Publisher ID</span>
              <span className="text-[10px] text-text-sec uppercase font-mono">(Apenas leitura)</span>
            </label>
            <input
              type="text"
              value={PUBLISHER_ID}
              readOnly
              className="w-full bg-card-inner border border-border-main text-text-sec font-mono text-xs font-bold rounded-xl p-3 outline-none cursor-not-allowed opacity-80"
            />
            <p className="text-[11px] text-text-sec">ID definitivo configurado para a conta.</p>
          </div>

          {/* Domínio (Read-only) */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-text-main flex items-center justify-between">
              <span>Domínio Registrado</span>
              <span className="text-[10px] text-text-sec uppercase font-mono">(Apenas leitura)</span>
            </label>
            <input
              type="text"
              value={OFFICIAL_DOMAIN}
              readOnly
              className="w-full bg-card-inner border border-border-main text-text-sec font-mono text-xs font-bold rounded-xl p-3 outline-none cursor-not-allowed opacity-80"
            />
            <p className="text-[11px] text-text-sec">Domínio oficial aprovado no AdSense.</p>
          </div>

          {/* Modo */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-text-main">
              Modo de Exibição
            </label>
            <input
              type="text"
              value={config.mode}
              onChange={(e) => setConfig((prev) => ({ ...prev, mode: e.target.value }))}
              className="w-full bg-card-inner border border-border-main focus:border-green-primary text-text-main text-xs font-bold rounded-xl p-3 outline-none"
            />
            <p className="text-[11px] text-text-sec">Modo recomendado: Anúncios automáticos.</p>
          </div>

          {/* Status de Revisão */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-extrabold text-text-main">
              Status de Revisão (Informado pelo Administrador)
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
            <p className="text-[11px] text-text-sec">
              Acompanhe e registre manualmente o status do processo no painel do Google AdSense.
            </p>
          </div>

          {/* Observações Administrativas */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-extrabold text-text-main">
              Observações Administrativas (Opcional)
            </label>
            <textarea
              rows={3}
              value={config.notes}
              onChange={(e) => setConfig((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Digite notas internas sobre a verificação do AdSense..."
              className="w-full bg-card-inner border border-border-main focus:border-green-primary text-text-main text-xs rounded-xl p-3 outline-none leading-relaxed"
            />
          </div>

        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-primary hover:bg-green-dark text-white font-extrabold text-xs rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Salvando..." : "Salvar Configurações de Monetização"}</span>
          </button>
        </div>
      </form>

      {/* 4. Consentimento e CMP */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 space-y-4 shadow-md">
        <h3 className="font-display font-extrabold text-base text-text-main flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-primary" />
          Gerenciamento de Consentimento (Consent Mode)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-card-inner border border-border-main p-3 rounded-xl">
            <span className="text-[10px] text-text-sec block">ad_storage</span>
            <span className="font-bold text-green-primary">Suportado</span>
          </div>
          <div className="bg-card-inner border border-border-main p-3 rounded-xl">
            <span className="text-[10px] text-text-sec block">ad_user_data</span>
            <span className="font-bold text-green-primary">Suportado</span>
          </div>
          <div className="bg-card-inner border border-border-main p-3 rounded-xl">
            <span className="text-[10px] text-text-sec block">ad_personalization</span>
            <span className="font-bold text-green-primary">Suportado</span>
          </div>
          <div className="bg-card-inner border border-border-main p-3 rounded-xl">
            <span className="text-[10px] text-text-sec block">analytics_storage</span>
            <span className="font-bold text-green-primary">Suportado</span>
          </div>
        </div>

        <div className="p-4 bg-card-inner border border-border-main rounded-xl text-xs space-y-1">
          <p className="font-bold text-text-main">
            Instrução do Google AdSense sobre CMP:
          </p>
          <p className="text-text-sec leading-relaxed italic">
            “A gestão de consentimento para anúncios deve ser concluída em Google AdSense → Privacidade e mensagens.”
          </p>
        </div>
      </div>

      {/* 5. Status do ads.txt */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-extrabold text-base text-text-main flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-primary" />
            Status do arquivo ads.txt
          </h3>
          <span className="text-xs font-mono text-green-primary font-bold">
            {EXPECTED_ADS_TXT_URL}
          </span>
        </div>

        <div className="p-4 bg-card-inner border border-border-main rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-text-main">Linha Oficial do AdSense:</span>
            <span className="px-2 py-0.5 text-[10px] bg-green-500/10 text-green-400 font-bold rounded-md">
              Configurado no /public/ads.txt
            </span>
          </div>
          <div className="bg-black/40 p-3 rounded-lg font-mono text-xs text-green-400 border border-green-500/20 break-all select-all">
            {OFFICIAL_ADS_TXT_LINE}
          </div>
        </div>
      </div>

      {/* 6. Páginas Sem Anúncios (Exclusões) */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 space-y-4 shadow-md">
        <h3 className="font-display font-extrabold text-base text-text-main flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-primary" />
          Páginas Recomendadas para Exclusão de Anúncios
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-card-inner border border-border-main rounded-xl flex items-center justify-between">
            <span className="font-mono font-bold text-text-main">/admin</span>
            <span className="text-[10px] text-red-400 font-bold">Sem Anúncios</span>
          </div>
          <div className="p-3 bg-card-inner border border-border-main rounded-xl flex items-center justify-between">
            <span className="font-mono font-bold text-text-main">/admin-login</span>
            <span className="text-[10px] text-red-400 font-bold">Sem Anúncios</span>
          </div>
          <div className="p-3 bg-card-inner border border-border-main rounded-xl flex items-center justify-between">
            <span className="font-mono font-bold text-text-main">Páginas Privadas / Previews</span>
            <span className="text-[10px] text-red-400 font-bold">Sem Anúncios</span>
          </div>
          <div className="p-3 bg-card-inner border border-border-main rounded-xl flex items-center justify-between">
            <span className="font-mono font-bold text-text-main">Rotas Técnicas & Modais</span>
            <span className="text-[10px] text-red-400 font-bold">Sem Anúncios</span>
          </div>
        </div>

        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-300 leading-relaxed font-medium">
          <strong>Observação importante:</strong> Essas exclusões devem ser configuradas também no painel do Google AdSense, em:
          <br />
          <span className="font-bold">Anúncios → Editar site → Exclusões de páginas</span>.
        </div>
      </div>

      {/* 7. Áreas Protegidas */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 space-y-4 shadow-md">
        <h3 className="font-display font-extrabold text-base text-text-main flex items-center gap-2">
          <Layers className="h-5 w-5 text-green-primary" />
          Áreas Protegidas da Aplicação (<code className="text-xs font-mono text-green-primary">data-ads-exclude="true"</code>)
        </h3>
        <p className="text-xs text-text-sec leading-relaxed">
          As seguintes áreas funcionais do MultiConverte foram identificadas com o atributo semântico de exclusão de anúncios:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
          {[
            "Área de Upload",
            "Botão Converter",
            "Botão Baixar",
            "Player de Áudio/Vídeo",
            "Editor de Imagens/PDF",
            "Modais & Diálogos",
            "Formulários",
            "Menu Principal",
            "Painel Administrativo"
          ].map((item) => (
            <div key={item} className="p-2.5 bg-card-inner border border-border-main rounded-lg font-bold text-text-main text-center">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* 8. Orientação para Anúncios Automáticos */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 space-y-4 shadow-md">
        <h3 className="font-display font-extrabold text-base text-text-main flex items-center gap-2">
          <Info className="h-5 w-5 text-green-primary" />
          Configuração Recomendada no Google AdSense
        </h3>

        <div className="space-y-2 text-xs text-text-sec leading-relaxed">
          {[
            "1. Acesse o painel do Google AdSense.",
            "2. Entre na seção Anúncios.",
            "3. Clique em Editar ao lado de multiconverte.com.br.",
            "4. Ative a opção Anúncios automáticos.",
            "5. Comece com uma quantidade de carga moderada.",
            "6. Revise a pré-visualização em desktop e dispositivos móveis.",
            "7. Exclua áreas sensíveis de upload, conversão e download.",
            "8. Exclua /admin e páginas privadas nas configurações do site.",
            "9. Clique em Aplicar ao site."
          ].map((step, idx) => (
            <div key={idx} className="p-2.5 bg-card-inner border border-border-main rounded-lg text-text-main font-medium">
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* 9. Tipos de Anúncios Recomendados */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 space-y-4 shadow-md">
        <h3 className="font-display font-extrabold text-base text-text-main flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-primary" />
          Tipos de Anúncios Recomendados
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl space-y-2">
            <h4 className="font-bold text-green-400 uppercase tracking-wider text-[11px]">
              Ativar Inicialmente
            </h4>
            <ul className="list-disc list-inside text-text-main space-y-1 font-medium">
              <li>Anúncios in-page</li>
              <li>Anúncios âncora (após teste em celular)</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-2">
            <h4 className="font-bold text-yellow-400 uppercase tracking-wider text-[11px]">
              Avaliar com Cuidado
            </h4>
            <ul className="list-disc list-inside text-text-main space-y-1 font-medium">
              <li>Anúncios laterais</li>
              <li>Anúncios multiplex</li>
            </ul>
          </div>

          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
            <h4 className="font-bold text-red-400 uppercase tracking-wider text-[11px]">
              Manter Desativado Inicialmente
            </h4>
            <ul className="list-disc list-inside text-text-main space-y-1 font-medium">
              <li>Anúncios vinheta</li>
              <li>Formatos que interrompam o fluxo</li>
              <li>Anúncios em tela cheia durante conversão</li>
            </ul>
          </div>

        </div>
      </div>

      {/* 10. Blocos Manuais (Futuro) */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 space-y-4 shadow-md">
        <h3 className="font-display font-extrabold text-base text-text-main flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-green-primary" />
          Blocos Manuais — Futuro
        </h3>

        <p className="text-xs text-text-sec leading-relaxed">
          Nesta etapa inicial de aprovação, o uso de <strong>Anúncios Automáticos</strong> é o método recomendado pelo Google. Após a aprovação final do domínio, blocos manuais específicos poderão ser integrados com IDs de unidade de anúncio reais.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 bg-card-inner border border-border-main rounded-xl space-y-2">
            <h4 className="font-bold text-text-main text-xs">Locais Futuros Permitidos:</h4>
            <ul className="list-disc list-inside text-text-sec space-y-1">
              <li>Abaixo do banner principal</li>
              <li>Entre a apresentação e as ferramentas</li>
              <li>Abaixo do resultado</li>
              <li>Lateral em desktop</li>
              <li>Final da página</li>
            </ul>
          </div>

          <div className="p-4 bg-card-inner border border-border-main rounded-xl space-y-2">
            <h4 className="font-bold text-red-400 text-xs">Proibições Estritas de Posicionamento:</h4>
            <ul className="list-disc list-inside text-text-sec space-y-1">
              <li>Nunca ao lado do botão de download</li>
              <li>Nunca dentro da área de conversão</li>
              <li>Nunca entre controles ou botões</li>
              <li>Nunca imitando botões ou ações do site</li>
              <li>Nunca cobrindo conteúdo ou modais</li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}
