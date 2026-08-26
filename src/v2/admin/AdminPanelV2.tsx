import React, { useState, useEffect } from "react";
import { 
  AdminTabV2, 
  HomeBannerV2, 
  BrandingConfigV2, 
  MonetizationConfigV2 
} from "./types";
import { useAdminAuthV2 } from "./hooks/useAdminAuthV2";
import { AdminLoginV2 } from "./AdminLoginV2";
import { AdminSidebarV2 } from "./AdminSidebarV2";
import { AdminHeaderV2 } from "./AdminHeaderV2";
import { AdminDashboardV2 } from "./modules/AdminDashboardV2";
import { AdsManagerV2 } from "./modules/AdsManagerV2";
import { BrandingManagerV2 } from "./modules/BrandingManagerV2";
import { MonetizationManagerV2 } from "./modules/MonetizationManagerV2";
import { SeoManagerV2 } from "./modules/SeoManagerV2";
import { AnalyticsManagerV2 } from "./modules/AnalyticsManagerV2";
import { SettingsV2 } from "./modules/SettingsV2";

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../../firebase";
import { Loader2 } from "lucide-react";

interface AdminPanelV2Props {
  onNavigateSite: (path?: string) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const AdminPanelV2: React.FC<AdminPanelV2Props> = ({
  onNavigateSite,
  isDark = false,
  onToggleTheme = () => {}
}) => {
  const { adminUser, isAuthenticated, loading: authLoading, authError, login, logout } = useAdminAuthV2();
  const [activeTab, setActiveTab] = useState<AdminTabV2>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Firestore Data States for V2 Admin
  const [banners, setBanners] = useState<HomeBannerV2[]>([]);
  const [branding, setBranding] = useState<BrandingConfigV2 | null>(null);
  const [monetization, setMonetization] = useState<MonetizationConfigV2 | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Load Banners from Firestore collection 'home_banners'
  const loadBanners = async () => {
    try {
      const q = query(collection(db, "home_banners"));
      const snap = await getDocs(q);
      const items: HomeBannerV2[] = snap.docs.map((d) => {
        const data = d.data();
        const rawActive = data.active !== undefined ? data.active : true;
        const isActive = typeof rawActive === "string" ? rawActive === "true" : !!rawActive;

        return {
          id: d.id,
          name: data.name || data.title || "Banner",
          title: data.title || data.name || "Banner",
          imageUrl: data.imageUrl || "",
          storagePath: data.storagePath || "",
          linkUrl: data.linkUrl || data.destinationUrl || "",
          destinationUrl: data.destinationUrl || data.linkUrl || "",
          active: isActive,
          order: Number(data.order || 1),
          altText: data.altText || data.name || "Banner",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || ""),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || "")
        };
      });
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(items);
    } catch (err) {
      console.error("[V2 Admin] Erro ao carregar banners da home:", err);
    }
  };

  // Load Branding from Firestore doc 'site_settings/branding'
  const loadBranding = async () => {
    try {
      const docRef = doc(db, "site_settings", "branding");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setBranding({
          siteName: data.siteName || "Conversor de Áudio & Mídia",
          logoUrl: data.logoUrl || "",
          logoStoragePath: data.logoStoragePath || "",
          logoAlt: data.logoAlt || "Conversor de Áudio Online",
          logoDesktopWidth: data.logoDesktopWidth || 220,
          logoDesktopMaxHeight: data.logoDesktopMaxHeight || 64,
          logoMobileWidth: data.logoMobileWidth || 160,
          logoMobileMaxHeight: data.logoMobileMaxHeight || 48,
          updatedAt: data.updatedAt || ""
        });
      } else {
        // Padrão limpo V2
        setBranding({
          siteName: "Conversor de Áudio & Mídia",
          logoUrl: "",
          logoAlt: "Conversor de Áudio Online",
          logoDesktopWidth: 220,
          logoDesktopMaxHeight: 64,
          logoMobileWidth: 160,
          logoMobileMaxHeight: 48
        });
      }
    } catch (err) {
      console.error("[V2 Admin] Erro ao carregar branding:", err);
    }
  };

  // Load Monetization from Firestore doc 'site_settings/adsense'
  const loadMonetization = async () => {
    try {
      const docRef = doc(db, "site_settings", "adsense");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setMonetization({
          adsenseEnabled: data.adsenseEnabled !== undefined ? !!data.adsenseEnabled : true,
          publisherId: data.publisherId || "ca-pub-8846628306821055",
          domain: data.domain || "",
          mode: data.mode || "Anúncios automáticos",
          reviewStatus: data.reviewStatus || "Ativo",
          notes: data.notes || "",
          verificationSnippet: data.verificationSnippet,
          verificationMetaTag: data.verificationMetaTag,
          verificationAdsTxtLine: data.verificationAdsTxtLine,
          updatedAt: data.updatedAt
        });
      } else {
        setMonetization({
          adsenseEnabled: true,
          publisherId: "ca-pub-8846628306821055",
          domain: "",
          mode: "Anúncios automáticos",
          reviewStatus: "Ativo",
          notes: "Configuração padrão de monetização"
        });
      }
    } catch (err) {
      console.error("[V2 Admin] Erro ao carregar monetização:", err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    setDataLoading(true);

    Promise.all([loadBanners(), loadBranding(), loadMonetization()]).finally(() => {
      if (isMounted) setDataLoading(false);
    });

    // Realtime listener for home_banners collection
    const unsubBanners = onSnapshot(query(collection(db, "home_banners")), () => {
      loadBanners();
    });

    return () => {
      isMounted = false;
      unsubBanners();
    };
  }, [isAuthenticated]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600 dark:text-sky-400" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Verificando credenciais de acesso...
        </p>
      </div>
    );
  }

  // Unauthenticated: Show Login
  if (!isAuthenticated) {
    return (
      <AdminLoginV2
        onLogin={login}
        onBack={() => onNavigateSite("/v2")}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } lg:relative lg:translate-x-0 transition-transform duration-200 ease-in-out flex shrink-0`}>
        <AdminSidebarV2
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          onLogout={logout}
          onViewSite={() => onNavigateSite("/")}
          adminEmail={adminUser?.email}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeaderV2
          activeTab={activeTab}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {dataLoading ? (
            <div className="min-h-[50vh] flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <AdminDashboardV2
                  banners={banners}
                  branding={branding}
                  monetization={monetization}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === "ads" && (
                <AdsManagerV2
                  onRefresh={loadBanners}
                />
              )}

              {activeTab === "branding" && (
                <BrandingManagerV2
                  branding={branding}
                  onRefresh={loadBranding}
                />
              )}

              {activeTab === "monetization" && (
                <MonetizationManagerV2
                  monetization={monetization}
                  onRefresh={loadMonetization}
                />
              )}

              {activeTab === "seo" && (
                <SeoManagerV2 />
              )}

              {activeTab === "analytics" && (
                <AnalyticsManagerV2 />
              )}

              {activeTab === "settings" && (
                <SettingsV2 />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
