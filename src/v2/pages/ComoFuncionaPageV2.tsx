import React from "react";
import { AppRouteV2 } from "../routes";
import { HomeBannerCarouselV2 } from "../components/HomeBannerCarouselV2";
import { HowItWorksStepsV2 } from "../components/HowItWorksStepsV2";
import { BenefitsBarV2 } from "../components/BenefitsBarV2";
import { DeveloperContactAndSupportV2 } from "../components/DeveloperContactAndSupportV2";
import { FinalBannerV2 } from "../components/FinalBannerV2";

interface ComoFuncionaPageV2Props {
  onNavigate: (route: AppRouteV2) => void;
}

export const ComoFuncionaPageV2: React.FC<ComoFuncionaPageV2Props> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12 pb-4" id="v2-como-funciona-view">
      {/* 1. Banners de Publicidade Atuais no Topo (100% Preservados com tracking) */}
      <HomeBannerCarouselV2 onNavigate={onNavigate} />

      {/* 2. Conteúdo Explicativo "Como Funciona" */}
      <HowItWorksStepsV2 />

      {/* 3. Faixa de 5 Benefícios (Seguro e Privado, Rápido, Qualidade, Dispositivo, Sem Instalação) */}
      <BenefitsBarV2 />

      {/* 4. Canal Direto: Fale com o Desenvolvedor (Contato/Sugestões + Ajude o Desenvolvedor) */}
      <DeveloperContactAndSupportV2 />

      {/* 5. Chamada de Ação Final */}
      <FinalBannerV2 onNavigate={onNavigate} />
    </div>
  );
};
