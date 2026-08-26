import React from "react";
import { AppRouteV2 } from "../routes";
import { useBrandingV2 } from "../config/useBrandingV2";
import { 
  Volume2, 
  ShieldCheck, 
  FileText, 
  Mail, 
  HelpCircle 
} from "lucide-react";

interface FooterV2Props {
  onNavigate: (route: AppRouteV2) => void;
  onNavigateToV1?: () => void;
  onNavigateToAdmin?: () => void;
}

export const FooterV2: React.FC<FooterV2Props> = ({
  onNavigate,
  onNavigateToAdmin
}) => {
  const { branding } = useBrandingV2();
  const hasCustomLogo = !!branding.logoUrl;

  return (
    <footer className="bg-white border-t border-[#E2E8F0] text-[#5C6F84] py-6 px-4 md:px-8 mt-12 shadow-xs" id="v2-main-footer">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium">
        
        {/* Lado Esquerdo: Logo Oficial ou Marca */}
        <div 
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {hasCustomLogo ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.logoAlt || branding.siteName} 
              style={{
                maxWidth: "180px",
                maxHeight: "38px",
                objectFit: "contain"
              }}
              className="transition-transform duration-200 group-hover:scale-102"
            />
          ) : (
            <>
              <div className="w-8 h-8 rounded-xl bg-[#1D68F2] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-[#0B1F44] text-[15px] tracking-tight">
                    Conversor
                  </span>
                  <span className="font-extrabold text-[#1D68F2] text-[15px] tracking-tight">
                    Audio
                  </span>
                </div>
                <p className="text-[11px] text-[#5C6F84] leading-none mt-0.5">
                  Ferramentas online completas
                </p>
              </div>
            </>
          )}
        </div>

        {/* Centro: Copyright & Hotspot Invisível de Acesso Administrativo */}
        <div className="flex flex-col items-center justify-center text-center space-y-1">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-[#64748B]">© 2026 {branding.siteName || "Conversor Audio"}. Todos os direitos reservados.</span>
            
            {/* Hotspot Oculto: Invisível por padrão, exibe apenas "AB" sob hover direto no desktop */}
            {onNavigateToAdmin && (
              <button
                type="button"
                onClick={onNavigateToAdmin}
                className="w-4 h-4 inline-flex items-center justify-center bg-transparent border-0 p-0 m-0 cursor-pointer select-none text-[9px] font-bold text-transparent hover:text-slate-400 focus:outline-none transition-colors"
                id="v2-admin-hidden-hotspot"
                tabIndex={0}
                aria-label="Área restrita"
              >
                AB
              </button>
            )}
          </div>
        </div>

        {/* Lado Direito: Links Simples com Ícones */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs text-[#5C6F84]">
          <button
            onClick={() => onNavigate("comoFunciona")}
            className="hover:text-[#1D68F2] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Privacidade</span>
          </button>

          <button
            onClick={() => onNavigate("comoFunciona")}
            className="hover:text-[#1D68F2] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Termos de Uso</span>
          </button>

          <button
            onClick={() => onNavigate("comoFunciona")}
            className="hover:text-[#1D68F2] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Contato</span>
          </button>

          <button
            onClick={() => onNavigate("comoFunciona")}
            className="hover:text-[#1D68F2] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Ajuda</span>
          </button>
        </div>

      </div>
    </footer>
  );
};
