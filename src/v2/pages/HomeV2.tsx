import React from "react";
import { AppRouteV2 } from "../routes";
import { HomeBannerCarouselV2 } from "../components/HomeBannerCarouselV2";
import { HeroBannersV2 } from "../components/HeroBannersV2";
import { BenefitsBarV2 } from "../components/BenefitsBarV2";
import { ToolsGridV2 } from "../components/ToolsGridV2";
import { FinalBannerV2 } from "../components/FinalBannerV2";

interface HomeV2Props {
  onNavigate: (route: AppRouteV2) => void;
}

export const HomeV2: React.FC<HomeV2Props> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12 pb-4" id="v2-home-view">
      {/* 1. Carrossel de Banners da Home (Padrão Oficial 1320x323) */}
      <HomeBannerCarouselV2 onNavigate={onNavigate} />

      {/* 2. Hero Principal Reposicionado (Converta, edite e organize seus arquivos de áudio) */}
      <HeroBannersV2 onNavigate={onNavigate} />

      {/* 3. Faixa Horizontal de 5 Benefícios */}
      <BenefitsBarV2 />

      {/* 4. Seção Ferramentas Principais com Grade de 6 Cards */}
      <ToolsGridV2 onNavigate={onNavigate} />

      {/* 5. Faixa Final: Chamada para Ação */}
      <FinalBannerV2 onNavigate={onNavigate} />
    </div>
  );
};

