import React from "react";
import { AppRouteV2 } from "../routes";
import { HeaderV2 } from "./HeaderV2";
import { FooterV2 } from "./FooterV2";

interface MainLayoutV2Props {
  currentRoute: AppRouteV2;
  onNavigate: (route: AppRouteV2) => void;
  onNavigateToV1?: () => void;
  onNavigateToAdmin?: () => void;
  children: React.ReactNode;
}

export const MainLayoutV2: React.FC<MainLayoutV2Props> = ({
  currentRoute,
  onNavigate,
  onNavigateToV1,
  onNavigateToAdmin,
  children
}) => {
  return (
    <div className="min-h-screen bg-[#F4F8FD] text-[#0B1F44] flex flex-col justify-between font-sans antialiased selection:bg-[#E0F2FE] selection:text-[#1D68F2]" id="v2-root-container">
      <HeaderV2
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        onNavigateToV1={onNavigateToV1}
      />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4 md:py-8 space-y-6">
        {children}
      </main>
      <FooterV2
        onNavigate={onNavigate}
        onNavigateToV1={onNavigateToV1}
        onNavigateToAdmin={onNavigateToAdmin}
      />
    </div>
  );
};
