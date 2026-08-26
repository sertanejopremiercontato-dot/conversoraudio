import React from "react";
import { AdminTabV2, HomeBannerV2, BrandingConfigV2, MonetizationConfigV2 } from "../types";
import { 
  Megaphone, 
  DollarSign, 
  Palette, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Activity,
  Layers,
  Music,
  Globe,
  Check
} from "lucide-react";

interface AdminDashboardV2Props {
  banners: HomeBannerV2[];
  branding: BrandingConfigV2 | null;
  monetization: MonetizationConfigV2 | null;
  onNavigateTab: (tab: AdminTabV2) => void;
}

export const AdminDashboardV2: React.FC<AdminDashboardV2Props> = ({
  banners,
  branding,
  monetization,
  onNavigateTab
}) => {
  const activeBannersCount = banners.filter((b) => b.active).length;

  return (
    <div className="space-y-6" id="v2-admin-dashboard">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Banners */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Banners da Home</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {activeBannersCount} <span className="text-xs font-medium text-slate-400">/ {banners.length} total</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Padrão oficial 1320 × 323 px
            </p>
          </div>
        </div>

        {/* Metric 2: AdSense */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Google AdSense</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{monetization?.reviewStatus || "Ativo & Gerenciado"}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {monetization?.publisherId || "ca-pub-8846628306821055"}
            </p>
          </div>
        </div>

        {/* Metric 3: Ferramentas V2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ferramentas V2</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              7 Módulos
            </div>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
              Conversor de Áudio V2 operacional
            </p>
          </div>
        </div>

        {/* Metric 4: Privacidade */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Motor de Execução</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              100% Local / Web Audio
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              Zero tráfego de arquivos para servidores
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Banners Rápidos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Banners da Home Recentes
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("ads")}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Gerenciar</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum banner cadastrado no momento.</p>
              <button
                type="button"
                onClick={() => onNavigateTab("ads")}
                className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
              >
                + Cadastrar primeiro banner
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {banners.slice(0, 4).map((banner) => (
                <div key={banner.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                      <img
                        src={banner.imageUrl}
                        alt={banner.altText || banner.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {banner.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ordem: #{banner.order} • Padrão 1320×323 px
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    banner.active 
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {banner.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: Status do Sistema e Identidade */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Identidade Visual & Plataforma
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("branding")}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Editar</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Nome Oficial:</span>
              <strong className="text-slate-900 dark:text-white">{branding?.siteName || "Conversor de Áudio & Mídia"}</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Logo Personalizado:</span>
              <strong className="text-slate-900 dark:text-white">{branding?.logoUrl ? "Ativo" : "Padrão do Sistema"}</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Versão do Sistema:</span>
              <strong className="text-sky-600 dark:text-sky-400 font-bold">V2 Modular (Next-Gen)</strong>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">SEO & Metadados:</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("seo")}
                className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Configurar Rotas</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
