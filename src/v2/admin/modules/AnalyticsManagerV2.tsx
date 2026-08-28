import React, { useState } from "react";
import { 
  BarChart3, 
  Users, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp,
  FileText,
  Wrench,
  CheckCircle2,
  Download,
  Flame,
  LayoutGrid,
  Globe2,
  Smartphone,
  Compass,
  Percent,
  Laptop,
  Monitor,
  Tablet,
  MousePointerClick,
  Layers,
  MapPin,
  ExternalLink,
  Tag,
  ArrowRight,
  ShieldCheck,
  Activity
} from "lucide-react";
import { useAnalyticsV2, AnalyticsPeriodV2, AnalyticsBannerItemV2 } from "../hooks/useAnalyticsV2";

export const AnalyticsManagerV2: React.FC = () => {
  const {
    period,
    data,
    loading,
    error,
    changePeriod,
    refresh
  } = useAnalyticsV2();

  const [techTab, setTechTab] = useState<"devices" | "browsers" | "os">("devices");
  const [geoTab, setGeoTab] = useState<"cities" | "regions" | "countries">("cities");

  const periodLabels: Record<AnalyticsPeriodV2, string> = {
    today: "Hoje",
    "7daysAgo": "Últimos 7 dias",
    "30daysAgo": "Últimos 30 dias",
    total: "Todo o período"
  };

  const hasData = Boolean(
    data?.summary && (
      data.summary.pageViews > 0 || 
      data.summary.conversions > 0 || 
      data.summary.downloads > 0 ||
      data.summary.sessions > 0
    )
  );

  const bannersList: AnalyticsBannerItemV2[] = data?.banners || data?.bannersRanking || [];
  const funnel = data?.funnel;

  return (
    <div className="space-y-6" id="v2-admin-analytics-manager">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/50">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Painel Unificado de Métricas & Analytics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tráfego oficial via Google Analytics 4 integrado à telemetria de eventos nativa (<code className="font-mono">site_metrics</code>)
            </p>
          </div>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(["today", "7daysAgo", "30daysAgo", "total"] as AnalyticsPeriodV2[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => changePeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  period === p
                    ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Atualizar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Status Badges: GA4 & Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* GA4 Status */}
        <div className="bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 rounded-2xl px-4 py-3 flex items-center justify-between gap-2 text-xs text-sky-900 dark:text-sky-200">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${data?.ga4Configured ? "bg-sky-500 animate-pulse" : "bg-amber-400"} shrink-0`} />
            <span>
              <strong>Google Analytics 4:</strong> {data?.ga4Configured ? "Conectado (Fonte Oficial de Tráfego)" : "Sincronizando dados..."}
            </span>
          </div>
          <span className="text-[11px] bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-md font-medium">
            GA4 REST
          </span>
        </div>

        {/* Telemetry Status */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl px-4 py-3 flex items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              <strong>Telemetria de Eventos:</strong> Ativa (Ferramentas, Conversões, Downloads & Banners)
            </span>
          </div>
          <span className="text-[11px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium">
            Firestore
          </span>
        </div>
      </div>

      {/* Error Warning */}
      {error && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">Aviso sobre o Relatório</p>
            <p className="text-amber-700 dark:text-amber-400">{error}</p>
          </div>
        </div>
      )}

      {/* ========================================================
          TOP 5 KPI CARDS
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* Active Users (GA4) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Usuários Ativos</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : (data?.summary?.activeUsers ?? 0).toLocaleString("pt-BR")}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Pessoas únicas</span>
            <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded">
              GA4
            </span>
          </div>
        </div>

        {/* Sessions (GA4) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Sessões</span>
            <Compass className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : (data?.summary?.sessions ?? 0).toLocaleString("pt-BR")}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Visitas à plataforma</span>
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 px-1.5 py-0.5 rounded">
              GA4
            </span>
          </div>
        </div>

        {/* Pageviews (GA4) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Visualizações</span>
            <Eye className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : (data?.summary?.pageViews ?? 0).toLocaleString("pt-BR")}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Páginas visualizadas</span>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
              GA4
            </span>
          </div>
        </div>

        {/* Conversions (Firestore Telemetry) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Conversões</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : (data?.summary?.conversions ?? 0).toLocaleString("pt-BR")}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Processamentos com êxito</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
              Telemetria
            </span>
          </div>
        </div>

        {/* Downloads (Firestore Telemetry) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Downloads</span>
            <Download className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : (data?.summary?.downloads ?? 0).toLocaleString("pt-BR")}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Arquivos baixados</span>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
              Telemetria
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          FUNIL DE USO DA PLATAFORMA
          ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4" id="v2-admin-funnel-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-500" />
              <span>Funil de Uso do Usuário</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Taxa de progressão desde a visita inicial até a conclusão do download
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Step 1: Sessions */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">1. Sessões (GA4)</span>
              <Compass className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {(funnel?.sessions ?? data?.summary?.sessions ?? 0).toLocaleString("pt-BR")}
            </div>
            <p className="text-[11px] text-slate-400">Total de visitas à plataforma</p>
          </div>

          {/* Step 2: Tool Opens */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">2. Abertura de Ferramentas</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {(funnel?.toolOpens ?? 0).toLocaleString("pt-BR")}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-violet-600 dark:text-violet-400 font-semibold">
              <span>{funnel?.openRate || "0%"}</span>
              <span className="text-slate-400 font-normal">taxa de abertura</span>
            </div>
          </div>

          {/* Step 3: Conversions */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">3. Conversões Concluídas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {(funnel?.conversions ?? data?.summary?.conversions ?? 0).toLocaleString("pt-BR")}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>{funnel?.conversionRate || "0%"}</span>
              <span className="text-slate-400 font-normal">taxa de conclusão</span>
            </div>
          </div>

          {/* Step 4: Downloads */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">4. Downloads Realizados</span>
              <Download className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {(funnel?.downloads ?? data?.summary?.downloads ?? 0).toLocaleString("pt-BR")}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
              <span>{funnel?.downloadRate || "0%"}</span>
              <span className="text-slate-400 font-normal">taxa de download</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          DESEMPENHO DE BANNERS & ANÚNCIOS (FIRESTORE)
          ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4" id="v2-admin-banner-performance-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-500" />
              <span>Desempenho de Banners & Anúncios (Telemetria Interna)</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Impressões reais (visibilidade ≥50% por 1s) e cliques vinculados ao ID de cada banner.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg font-medium">
              Total de Banners: {bannersList.length}
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Carregando métricas dos banners...</p>
        ) : bannersList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="py-3 px-3">Banner</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Posição</th>
                  <th className="py-3 px-3 text-right">Impressões Reais</th>
                  <th className="py-3 px-3 text-right">Cliques</th>
                  <th className="py-3 px-3 text-right">CTR (%)</th>
                  <th className="py-3 px-3 text-right">Última Atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bannersList.map((banner) => {
                  const lastTs = banner.lastClickAt || banner.lastImpressionAt;
                  const formattedLastTs = lastTs ? new Date(lastTs).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
                  
                  return (
                    <tr key={banner.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {banner.imageUrl ? (
                            <img 
                              src={banner.imageUrl} 
                              alt={banner.name} 
                              className="w-14 h-8 object-cover rounded-md border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                            />
                          ) : (
                            <div className="w-14 h-8 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                              <LayoutGrid className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[260px]">
                              {banner.name || "Banner"}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                              ID: {banner.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {banner.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Inativo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                        {banner.placement || "Carrossel Principal"}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {banner.impressions.toLocaleString("pt-BR")}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-sky-600 dark:text-sky-400">
                        {banner.clicks.toLocaleString("pt-BR")}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {banner.ctr.toFixed(2)}%
                      </td>

                      <td className="py-3 px-3 text-right text-[11px] text-slate-400">
                        {formattedLastTs}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 space-y-1">
            <p>Nenhum banner cadastrado no momento.</p>
            <p className="text-[11px] text-slate-500">Cadastre banners na aba Banners & Anúncios para acompanhar impressões e cliques.</p>
          </div>
        )}
      </div>

      {/* ========================================================
          DESEMPENHO POR FERRAMENTA (FIRESTORE)
          ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Desempenho por Ferramenta (Telemetria Interna)</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">
            Aberturas, conversões e downloads
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">Carregando ferramentas...</p>
        ) : data?.toolsRanking && data.toolsRanking.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="py-2.5 px-3">Ferramenta</th>
                  <th className="py-2.5 px-3 text-right">Aberturas</th>
                  <th className="py-2.5 px-3 text-right">Conversões</th>
                  <th className="py-2.5 px-3 text-right">Downloads</th>
                  <th className="py-2.5 px-3 text-right">Taxa Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.toolsRanking.map((tool, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {tool.toolName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {tool.views.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {tool.conversions.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-sky-600 dark:text-sky-400">
                      {tool.downloads.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-teal-600 dark:text-teal-400">
                      {tool.conversionRate || (tool.views > 0 ? `${((tool.conversions / tool.views) * 100).toFixed(1)}%` : "0%")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 space-y-1">
            <p>Nenhuma conversão registrada neste período.</p>
            <p className="text-[11px] text-slate-500">Conforme os usuários convertem e baixam arquivos, o ranking é populado automaticamente.</p>
          </div>
        )}
      </div>

      {/* ========================================================
          GRID: ORIGEM DE TRÁFEGO, DISPOSITIVOS & LOCALIZAÇÃO (GA4)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Origem de Tráfego [GA4] */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-violet-500" />
              <span>Origem do Tráfego</span>
            </h4>
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 px-1.5 py-0.5 rounded">
              GA4
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-3 text-center">Carregando...</p>
          ) : data?.trafficSources && data.trafficSources.length > 0 ? (
            <div className="space-y-2.5">
              {data.trafficSources.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.source}</p>
                      <p className="text-[10px] text-slate-400">{item.medium}</p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white shrink-0">{item.sessions} sessões ({item.percentage || "100%"})</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-violet-500 h-full rounded-full" 
                      style={{ width: item.percentage || "100%" }} 
                    />
                  </div>
                </div>
              ))}

              {data.utms && data.utms.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-sky-500" />
                    <span>Campanhas UTM</span>
                  </p>
                  {data.utms.map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{u.campaign}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{u.count} sessões</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">Sem dados de tráfego no período.</p>
          )}
        </div>

        {/* Dispositivos e Tecnologia [GA4] */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Tecnologia & Dispositivos</span>
            </h4>
            
            {/* Sub-tabs for Tech */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-medium">
              <button 
                type="button" 
                onClick={() => setTechTab("devices")}
                className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${techTab === "devices" ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs" : "text-slate-500"}`}
              >
                Dispositivo
              </button>
              <button 
                type="button" 
                onClick={() => setTechTab("browsers")}
                className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${techTab === "browsers" ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs" : "text-slate-500"}`}
              >
                Navegador
              </button>
              <button 
                type="button" 
                onClick={() => setTechTab("os")}
                className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${techTab === "os" ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs" : "text-slate-500"}`}
              >
                Sistema
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-3 text-center">Carregando...</p>
          ) : techTab === "devices" ? (
            <div className="space-y-2.5">
              {data?.devices && data.devices.length > 0 ? (
                data.devices.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {item.category === "Desktop" ? <Laptop className="w-3.5 h-3.5 text-slate-500" /> : item.category === "Tablet" ? <Tablet className="w-3.5 h-3.5 text-slate-500" /> : <Smartphone className="w-3.5 h-3.5 text-slate-500" />}
                        {item.category}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.sessions || item.count} ({item.percentage})</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: item.percentage }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">Sem dados de dispositivos.</p>
              )}
            </div>
          ) : techTab === "browsers" ? (
            <div className="space-y-2.5">
              {data?.browsers && data.browsers.length > 0 ? (
                data.browsers.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.browser}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.sessions || item.count} ({item.percentage})</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: item.percentage }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">Sem dados de navegadores.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {data?.operatingSystems && data.operatingSystems.length > 0 ? (
                data.operatingSystems.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.os}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.sessions || item.count} ({item.percentage})</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: item.percentage }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">Sem dados de sistemas operacionais.</p>
              )}
            </div>
          )}
        </div>

        {/* Localização [GA4] */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-sky-500" />
              <span>Localização Geográfica</span>
            </h4>
            
            {/* Sub-tabs for Geo */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-medium">
              <button 
                type="button" 
                onClick={() => setGeoTab("cities")}
                className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${geoTab === "cities" ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs" : "text-slate-500"}`}
              >
                Cidades
              </button>
              <button 
                type="button" 
                onClick={() => setGeoTab("regions")}
                className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${geoTab === "regions" ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs" : "text-slate-500"}`}
              >
                Estados
              </button>
              <button 
                type="button" 
                onClick={() => setGeoTab("countries")}
                className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${geoTab === "countries" ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs" : "text-slate-500"}`}
              >
                Países
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-3 text-center">Carregando...</p>
          ) : geoTab === "cities" ? (
            <div className="space-y-2">
              {data?.locations?.cities && data.locations.cities.length > 0 ? (
                data.locations.cities.map((ct, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{ct.city} ({ct.country})</span>
                      <span className="font-bold text-slate-900 dark:text-white">{ct.users || ct.count} usuários ({ct.percentage || "100%"})</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: ct.percentage || "100%" }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">Sem dados de cidades.</p>
              )}
            </div>
          ) : geoTab === "regions" ? (
            <div className="space-y-2">
              {data?.locations?.regions && data.locations.regions.length > 0 ? (
                data.locations.regions.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{r.region} ({r.country})</span>
                      <span className="font-bold text-slate-900 dark:text-white">{r.users || r.count} usuários ({r.percentage || "100%"})</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: r.percentage || "100%" }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">Sem dados de estados.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.locations?.countries && data.locations.countries.length > 0 ? (
                data.locations.countries.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.country}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{c.users || c.count} usuários ({c.percentage})</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: c.percentage }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">Sem dados de países.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          PÁGINAS MAIS ACESSADAS [GA4]
          ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-500" />
            <span>Páginas Mais Acessadas</span>
          </h4>
          <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded">
            GA4
          </span>
        </div>
        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">Carregando páginas...</p>
        ) : data?.topPages && data.topPages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="py-2.5 px-3">Rota / URL</th>
                  <th className="py-2.5 px-3 text-right">Visualizações</th>
                  <th className="py-2.5 px-3 text-right">Usuários Ativos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.topPages.map((page, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">{page.path}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">{page.views.toLocaleString("pt-BR")}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{page.users.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">Aguardando acessos em rotas públicas.</p>
        )}
      </div>

      {/* ========================================================
          TENDÊNCIA DIÁRIA (GA4 + TELEMETRIA)
          ======================================================== */}
      {data?.dailyTrend && data.dailyTrend.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-500" />
              <span>Tendência Diária Unificada</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Tráfego (GA4) e Operações (Telemetria) por Dia
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3 text-right">Usuários (GA4)</th>
                  <th className="py-2.5 px-3 text-right">Sessões (GA4)</th>
                  <th className="py-2.5 px-3 text-right">Views (GA4)</th>
                  <th className="py-2.5 px-3 text-right">Conversões (Telemetria)</th>
                  <th className="py-2.5 px-3 text-right">Downloads (Telemetria)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.dailyTrend.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{item.date}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-sky-600 dark:text-sky-400">{(item.users || 0).toLocaleString("pt-BR")}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-violet-600 dark:text-violet-400">{(item.sessions || 0).toLocaleString("pt-BR")}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">{(item.views || 0).toLocaleString("pt-BR")}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{(item.conversions || 0).toLocaleString("pt-BR")}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-600 dark:text-amber-400">{(item.downloads || 0).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          EVENTOS TÉCNICOS REGISTRADOS (TELEMETRIA FIRESTORE)
          ======================================================== */}
      {data?.events && data.events.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Eventos Técnicos Registrados (Telemetria)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ações e gatilhos instrumentados na aplicação
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {data.events.map((ev, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{ev.name}</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {ev.count.toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
