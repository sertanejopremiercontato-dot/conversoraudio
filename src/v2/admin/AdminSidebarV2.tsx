import React from "react";
import { 
  AdminTabV2 
} from "./types";
import { 
  LayoutDashboard, 
  Megaphone, 
  Layers,
  Palette, 
  DollarSign, 
  BarChart3, 
  Globe,
  Settings, 
  LogOut, 
  ExternalLink,
  Shield
} from "lucide-react";

interface AdminSidebarV2Props {
  activeTab: AdminTabV2;
  onTabChange: (tab: AdminTabV2) => void;
  onLogout: () => void;
  onViewSite: () => void;
  adminEmail?: string | null;
}

export const AdminSidebarV2: React.FC<AdminSidebarV2Props> = ({
  activeTab,
  onTabChange,
  onLogout,
  onViewSite,
  adminEmail
}) => {
  const navItems: { id: AdminTabV2; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { id: "ads", label: "Banners da Home", icon: Layers },
    { id: "branding", label: "Identidade Visual", icon: Palette },
    { id: "monetization", label: "Monetização / AdSense", icon: DollarSign },
    { id: "seo", label: "SEO & Metadados", icon: Globe },
    { id: "analytics", label: "Métricas & Acessos", icon: BarChart3 },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0" id="v2-admin-sidebar">
      {/* Brand & Navigation */}
      <div className="p-4 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">
              Painel Admin V2
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
              {adminEmail || "Administrador"}
            </p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                  isActive
                    ? "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-bold border border-sky-200/60 dark:border-sky-800/60 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button
          type="button"
          onClick={onViewSite}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ExternalLink className="w-4 h-4 text-slate-400" />
          <span>Ver Site Público</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </aside>
  );
};
