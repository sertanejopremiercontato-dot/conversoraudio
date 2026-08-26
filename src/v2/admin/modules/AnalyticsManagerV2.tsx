import React from "react";
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
  Flame
} from "lucide-react";
import { useAnalyticsV2, AnalyticsPeriodV2 } from "../hooks/useAnalyticsV2";

export const AnalyticsManagerV2: React.FC = () => {
  const {
    period,
    data,
    loading,
    error,
    changePeriod,
    refresh
  } = useAnalyticsV2();

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
      data.summary.downloads > 0
    )
  );

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
              Métricas & Acessos da Plataforma
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Telemetria nativa agregada em tempo real e sem dados simulados
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

      {/* Telemetry Status Notice */}
      <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>
            <strong>Telemetria Nativa Ativa:</strong> Contabilização em tempo real via Firestore (<code className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-[11px] font-mono">site_metrics</code>). Eventos de páginas, conversões e downloads são incrementados de forma segura e privada.
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

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pageviews */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Visualizações de Páginas</span>
            <Eye className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : (data?.summary?.pageViews ?? 0).toLocaleString("pt-BR")}
          </div>
          <p className="text-[11px] text-slate-400">
            {hasData ? `Total de pageviews (${periodLabels[period]})` : "Aguardando acessos"}
          </p>
        </div>

        {/* Visitors */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Visitantes Estimados</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : (data?.summary?.activeUsers ?? 0).toLocaleString("pt-BR")}
          </div>
          <p className="text-[11px] text-slate-400">
            {hasData ? `Usuários estimados no período` : "Aguardando acessos"}
          </p>
        </div>

        {/* Conversions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Conversões Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : (data?.summary?.conversions ?? 0).toLocaleString("pt-BR")}
          </div>
          <p className="text-[11px] text-slate-400">
            {hasData ? `Processamentos com sucesso` : "Aguardando conversões"}
          </p>
        </div>

        {/* Downloads */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Downloads Gerados</span>
            <Download className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : (data?.summary?.downloads ?? 0).toLocaleString("pt-BR")}
          </div>
          <p className="text-[11px] text-slate-400">
            {hasData ? `Arquivos baixados por usuários` : "Aguardando downloads"}
          </p>
        </div>
      </div>

      {/* Ranking por Ferramentas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Desempenho por Ferramenta</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">
            Uso e conversões reais
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">Carregando ferramentas...</p>
        ) : data?.toolsRanking && data.toolsRanking.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Ferramenta</th>
                  <th className="py-2.5 px-3 text-right">Aberturas</th>
                  <th className="py-2.5 px-3 text-right">Conversões</th>
                  <th className="py-2.5 px-3 text-right">Downloads</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 space-y-1">
            <p>Nenhuma ferramenta executada neste período.</p>
            <p className="text-[11px] text-slate-500">Conforme os usuários convertem arquivos, o ranking é populado automaticamente.</p>
          </div>
        )}
      </div>

      {/* Top Pages Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-500" />
          <span>Páginas Mais Acessadas</span>
        </h4>
        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">Carregando páginas...</p>
        ) : data?.topPages && data.topPages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2 px-3">Rota</th>
                  <th className="py-2 px-3 text-right">Pageviews</th>
                  <th className="py-2 px-3 text-right">Usuários Estimados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.topPages.map((page, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">{page.path}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">{page.views.toLocaleString("pt-BR")}</td>
                    <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">{page.users.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">Aguardando novos acessos em rotas públicas.</p>
        )}
      </div>

      {/* Daily Trend Table */}
      {data?.dailyTrend && data.dailyTrend.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-500" />
            <span>Tendência Diária</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2 px-3">Data</th>
                  <th className="py-2 px-3 text-right">Visitantes</th>
                  <th className="py-2 px-3 text-right">Pageviews</th>
                  <th className="py-2 px-3 text-right">Conversões</th>
                  <th className="py-2 px-3 text-right">Downloads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.dailyTrend.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{item.date}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">{(item.users || 0).toLocaleString("pt-BR")}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">{(item.views || 0).toLocaleString("pt-BR")}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{(item.conversions || 0).toLocaleString("pt-BR")}</td>
                    <td className="py-2 px-3 text-right font-bold text-sky-600 dark:text-sky-400">{(item.downloads || 0).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw Events List */}
      {data?.events && data.events.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Eventos Técnicos Registrados
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro de ações instrumentadas na aplicação
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
