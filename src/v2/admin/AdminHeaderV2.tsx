import React from "react";
import { AdminTabV2 } from "./types";
import { 
  LayoutDashboard, 
  Megaphone, 
  Palette, 
  DollarSign, 
  BarChart3, 
  Settings,
  Menu,
  Moon,
  Sun
} from "lucide-react";

interface AdminHeaderV2Props {
  activeTab: AdminTabV2;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const TAB_TITLES: Record<AdminTabV2, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Painel de Controle",
    subtitle: "Visão consolidada do status da plataforma, anúncios e monetização"
  },
  ads: {
    title: "Gerenciador de Anúncios",
    subtitle: "Controle de banners internos, formatos, posições e métricas de clique"
  },
  branding: {
    title: "Identidade Visual & Marca",
    subtitle: "Configuração do logotipo oficial, dimensões e nome público"
  },
  monetization: {
    title: "Monetização Google AdSense",
    subtitle: "Gerenciamento de publisher ID, status de verificação e conformidade"
  },
  analytics: {
    title: "Métricas & Acessos",
    subtitle: "Visualização consolidada de tráfego e interações dos usuários"
  },
  seo: {
    title: "SEO & Metadados",
    subtitle: "Controle de indexação, títulos, descrições, Open Graph e Schema.org por rota"
  },
  settings: {
    title: "Configurações da Plataforma",
    subtitle: "Parâmetros gerais, limites operacionais e diagnóstico da V2"
  }
};

export const AdminHeaderV2: React.FC<AdminHeaderV2Props> = ({
  activeTab,
  isMobileMenuOpen,
  onToggleMobileMenu,
  isDark,
  onToggleTheme
}) => {
  const current = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {current.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
