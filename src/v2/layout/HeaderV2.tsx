import React, { useState } from "react";
import { AppRouteV2, NAV_ITEMS_V2 } from "../routes";
import { useBrandingV2 } from "../config/useBrandingV2";
import { 
  Volume2, 
  Menu, 
  X
} from "lucide-react";

interface HeaderV2Props {
  currentRoute: AppRouteV2;
  onNavigate: (route: AppRouteV2) => void;
  onNavigateToV1?: () => void;
}

export const HeaderV2: React.FC<HeaderV2Props> = ({
  currentRoute,
  onNavigate
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { branding } = useBrandingV2();

  const handleLinkClick = (route: AppRouteV2) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  const hasCustomLogo = !!branding.logoUrl;

  return (
    <header className="sticky top-0 z-50 w-full pt-3 pb-2 px-4 md:px-8 pointer-events-none" id="v2-main-header">
      <div className="max-w-[1440px] mx-auto pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md border border-[#E4ECF7] rounded-[20px] px-6 md:px-8 py-3.5 shadow-[0_2px_16px_rgba(11,31,68,0.04)] flex items-center justify-between gap-6 min-h-[74px]">
          
          {/* Brand Area: Logo / Nome / Subtítulo */}
          <div 
            onClick={() => handleLinkClick("home")}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            id="v2-brand-logo"
          >
            {hasCustomLogo ? (
              /* Logo Oficial Persistida */
              <div className="flex items-center justify-center">
                {/* Desktop Version */}
                <img 
                  src={branding.logoUrl} 
                  alt={branding.logoAlt || branding.siteName} 
                  style={{
                    maxWidth: `${branding.logoDesktopWidth || 220}px`,
                    maxHeight: `${branding.logoDesktopMaxHeight || 64}px`,
                    objectFit: "contain"
                  }}
                  className="hidden md:block transition-transform duration-200 group-hover:scale-102"
                />
                {/* Mobile Version */}
                <img 
                  src={branding.logoUrl} 
                  alt={branding.logoAlt || branding.siteName} 
                  style={{
                    maxWidth: `${branding.logoMobileWidth || 160}px`,
                    maxHeight: `${branding.logoMobileMaxHeight || 48}px`,
                    objectFit: "contain"
                  }}
                  className="block md:hidden transition-transform duration-200 group-hover:scale-102"
                />
              </div>
            ) : (
              /* Fallback Padrão quando sem logo */
              <>
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-tr from-[#1D68F2] to-[#3B82F6] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200 overflow-hidden shrink-0">
                  <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-extrabold text-[20px] md:text-[21px] text-[#0B1F44] tracking-tight">
                      Conversor
                    </span>
                    <span className="font-extrabold text-[20px] md:text-[21px] text-[#1D68F2] tracking-tight">
                      Audio
                    </span>
                  </div>
                  <span className="text-[11px] text-[#5C6F84] font-medium tracking-tight mt-1 max-w-[240px] hidden sm:block leading-tight">
                    Documentos, imagens, MP3 e muito mais
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Desktop Navigation Menu */}
          <nav className="hidden xl:flex items-center justify-end gap-6 2xl:gap-8 flex-1" id="v2-desktop-nav">
            {NAV_ITEMS_V2.map((item) => {
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleLinkClick(item.id)}
                  className={`text-[13.5px] font-semibold transition-colors cursor-pointer relative py-2 whitespace-nowrap ${
                    isActive
                      ? "text-[#1D68F2] font-bold"
                      : "text-[#5C6F84] hover:text-[#0B1F44]"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1D68F2] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="xl:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-[#E4ECF7] text-[#5C6F84] hover:text-[#0B1F44] hover:bg-[#F4F8FD] transition-colors cursor-pointer"
              aria-label="Abrir menu"
              id="v2-mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-[#0B1F44]" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="xl:hidden mt-2 border border-[#E4ECF7] bg-white rounded-2xl p-3 space-y-1 shadow-xl" id="v2-mobile-nav">
            {NAV_ITEMS_V2.map((item) => {
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleLinkClick(item.id)}
                  className={`w-full text-left px-4 py-3 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                    isActive
                      ? "bg-[#1D68F2]/10 text-[#1D68F2] font-bold"
                      : "text-[#5C6F84] hover:bg-[#F4F8FD] hover:text-[#0B1F44]"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <div className="w-2 h-2 rounded-full bg-[#1D68F2]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
