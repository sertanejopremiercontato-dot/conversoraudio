import React from "react";
import { 
  Play, 
  Music, 
  Sparkles, 
  Cloud, 
  Volume2,
  Video,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Tag,
  Scissors,
  FileSpreadsheet,
  Film,
  Minimize2,
  CheckCircle2,
  Lock,
  Layers
} from "lucide-react";

export type HeroIllustrationType = 
  | "home" 
  | "audio" 
  | "metadata" 
  | "video" 
  | "pdf" 
  | "image" 
  | "document";

interface HeroIllustration3DProps {
  type?: HeroIllustrationType;
}

export const HeroIllustration3D: React.FC<HeroIllustration3DProps> = ({ type = "home" }) => {
  // Render Custom 3D Illustration per Module
  if (type === "metadata") {
    return (
      <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] h-[260px] sm:h-[290px] md:h-[310px] flex items-center justify-center select-none" id="hero-3d-scene-metadata">
        {/* Background Soft Glows (Rose / Coral) */}
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#FDA4AF]/25 via-[#E11D48]/15 to-transparent blur-3xl -z-10 pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full bg-[#FB7185]/20 blur-2xl -z-10 pointer-events-none -top-4" />

        <div className="relative w-full h-full flex items-center justify-center">
          {/* Base Pedestal (Rose/Coral) */}
          <div className="absolute bottom-2 sm:bottom-4 w-56 sm:w-64 md:w-72 h-14 sm:h-16 flex items-center justify-center">
            <div className="absolute -bottom-2 w-48 sm:w-56 h-8 bg-[#881337]/15 rounded-full blur-md" />
            <div className="w-56 sm:w-64 md:w-72 h-14 sm:h-16 rounded-[100%] bg-gradient-to-b from-[#F43F5E] via-[#E11D48] to-[#9F1239] shadow-[0_12px_24px_rgba(225,29,72,0.35)] border-t border-white/60 flex items-center justify-center p-1.5" />
            <div className="absolute top-1 sm:top-1.5 w-52 sm:w-60 md:w-68 h-11 sm:h-13 rounded-[100%] bg-gradient-to-tr from-[#FB7185] via-[#FECDD3] to-[#FFF1F2] border border-white/80 shadow-inner" />
          </div>

          {/* Floating Shield & Cloud Above */}
          <div className="absolute -top-2 sm:top-1 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center animate-bounce duration-1000">
            <div className="relative w-16 h-10 sm:w-20 sm:h-12 flex items-center justify-center filter drop-shadow-[0_8px_16px_rgba(225,29,72,0.2)]">
              <div className="absolute w-12 h-8 sm:w-14 sm:h-9 bg-white/95 rounded-full" />
              <div className="absolute -top-2 left-2 w-7 h-7 sm:w-9 sm:h-9 bg-white rounded-full shadow-xs" />
              <div className="absolute -top-1 right-2 w-6 h-6 sm:w-8 sm:h-8 bg-white/90 rounded-full shadow-xs" />
              <div className="absolute -top-1 -right-2 text-[#E11D48] animate-pulse">
                <Sparkles className="w-4 h-4 fill-[#E11D48]" />
              </div>
            </div>
          </div>

          {/* Main 3D Forensics Shield Card */}
          <div className="relative z-10 w-52 sm:w-60 md:w-64 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border-2 border-white shadow-[0_20px_40px_rgba(225,29,72,0.2),0_4px_12px_rgba(11,31,68,0.06)] transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center gap-1.5 pb-2.5 sm:pb-3 border-b border-[#F1F5F9]">
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#EF4444]" />
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#F59E0B]" />
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#10B981]" />
            </div>

            <div className="py-3 flex items-center justify-between gap-3 px-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#E11D48] via-[#F43F5E] to-[#FDA4AF] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(225,29,72,0.4)] border-2 border-white shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1 text-left flex-1">
                <span className="text-[11px] font-black text-[#0B1F44] block">Audit Forense</span>
                <span className="text-[10px] text-[#E11D48] font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                  SHA-256 Validado
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-[#64748B] font-bold">
              <span>Limpeza Bit-a-Bit</span>
              <span className="text-[#E11D48]">Zero Rastros</span>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="absolute -top-1 -left-2 sm:-left-4 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#E11D48] to-[#FB7185] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform -rotate-6">
            <span>ID3v2</span>
          </div>
          <div className="absolute top-2 -right-2 sm:-right-4 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform rotate-6">
            <span>SHA-256</span>
          </div>
          <div className="absolute bottom-10 -left-3 sm:-left-6 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#818CF8] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform 3">
            <span>ISRC</span>
          </div>
          <div className="absolute bottom-8 -right-3 sm:-right-5 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#D97706] to-[#F59E0B] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform -rotate-3">
            <span>RIFF</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] h-[260px] sm:h-[290px] md:h-[310px] flex items-center justify-center select-none" id="hero-3d-scene-video">
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#A855F7]/25 via-[#1D68F2]/15 to-transparent blur-3xl -z-10 pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full bg-[#38BDF8]/20 blur-2xl -z-10 pointer-events-none -top-4" />

        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute bottom-2 sm:bottom-4 w-56 sm:w-64 md:w-72 h-14 sm:h-16 flex items-center justify-center">
            <div className="absolute -bottom-2 w-48 sm:w-56 h-8 bg-[#0B1F44]/15 rounded-full blur-md" />
            <div className="w-56 sm:w-64 md:w-72 h-14 sm:h-16 rounded-[100%] bg-gradient-to-b from-[#7C3AED] via-[#1D68F2] to-[#1E40AF] shadow-[0_12px_24px_rgba(29,104,242,0.35)] border-t border-white/60 flex items-center justify-center p-1.5" />
            <div className="absolute top-1 sm:top-1.5 w-52 sm:w-60 md:w-68 h-11 sm:h-13 rounded-[100%] bg-gradient-to-tr from-[#A78BFA] via-[#93C5FD] to-[#EFF6FF] border border-white/80 shadow-inner" />
          </div>

          <div className="relative z-10 w-52 sm:w-60 md:w-64 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border-2 border-white shadow-[0_20px_40px_rgba(124,58,237,0.2),0_4px_12px_rgba(11,31,68,0.06)] transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center gap-1.5 pb-2.5 sm:pb-3 border-b border-[#F1F5F9]">
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#EF4444]" />
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#F59E0B]" />
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#10B981]" />
            </div>

            <div className="py-3 flex items-center justify-between gap-3 px-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#1D68F2] to-[#38BDF8] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(124,58,237,0.4)] border-2 border-white shrink-0">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 h-10 flex-1 justify-center px-1">
                <span className="w-1.5 h-4 bg-[#A855F7] rounded-full animate-pulse" />
                <span className="w-1.5 h-8 bg-[#1D68F2] rounded-full animate-pulse" />
                <span className="w-1.5 h-10 bg-[#38BDF8] rounded-full animate-pulse" />
                <span className="w-1.5 h-6 bg-[#A855F7] rounded-full animate-pulse" />
                <span className="w-1.5 h-9 bg-[#1D68F2] rounded-full animate-pulse" />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-[#64748B] font-bold">
              <span className="text-[#10B981]">Stream Direta</span>
              <span className="text-[#1D68F2]">320 kbps HD</span>
            </div>
          </div>

          <div className="absolute -top-1 -left-2 sm:-left-4 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform -rotate-6">
            <span>MP4</span>
          </div>
          <div className="absolute top-2 -right-2 sm:-right-4 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#1D68F2] to-[#38BDF8] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform rotate-6">
            <span>MOV</span>
          </div>
          <div className="absolute bottom-10 -left-3 sm:-left-6 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform 3">
            <span>MKV</span>
          </div>
          <div className="absolute bottom-8 -right-3 sm:-right-5 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform -rotate-3">
            <span>MP3</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] h-[260px] sm:h-[290px] md:h-[310px] flex items-center justify-center select-none" id="hero-3d-scene-pdf">
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#EF4444]/25 via-[#F97316]/15 to-transparent blur-3xl -z-10 pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full bg-[#FCA5A5]/20 blur-2xl -z-10 pointer-events-none -top-4" />

        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute bottom-2 sm:bottom-4 w-56 sm:w-64 md:w-72 h-14 sm:h-16 flex items-center justify-center">
            <div className="absolute -bottom-2 w-48 sm:w-56 h-8 bg-[#7F1D1D]/15 rounded-full blur-md" />
            <div className="w-56 sm:w-64 md:w-72 h-14 sm:h-16 rounded-[100%] bg-gradient-to-b from-[#EF4444] via-[#DC2626] to-[#991B1B] shadow-[0_12px_24px_rgba(239,68,68,0.35)] border-t border-white/60 flex items-center justify-center p-1.5" />
            <div className="absolute top-1 sm:top-1.5 w-52 sm:w-60 md:w-68 h-11 sm:h-13 rounded-[100%] bg-gradient-to-tr from-[#F87171] via-[#FECACA] to-[#FEF2F2] border border-white/80 shadow-inner" />
          </div>

          <div className="relative z-10 w-52 sm:w-60 md:w-64 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border-2 border-white shadow-[0_20px_40px_rgba(239,68,68,0.2),0_4px_12px_rgba(11,31,68,0.06)] transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center gap-1.5 pb-2.5 sm:pb-3 border-b border-[#F1F5F9]">
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#EF4444]" />
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#F59E0B]" />
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#10B981]" />
            </div>

            <div className="py-3 flex items-center justify-between gap-3 px-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#EF4444] to-[#F87171] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(239,68,68,0.4)] border-2 border-white shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1 text-left flex-1">
                <span className="text-[11px] font-black text-[#0B1F44] block">Documento A4</span>
                <span className="text-[10px] text-[#EF4444] font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                  100% Vetorial
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-[#64748B] font-bold">
              <span>PDF Seguro</span>
              <span className="text-[#EF4444]">Otimizado</span>
            </div>
          </div>

          <div className="absolute -top-1 -left-2 sm:-left-4 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#DC2626] to-[#EF4444] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform -rotate-6">
            <span>PDF</span>
          </div>
          <div className="absolute top-2 -right-2 sm:-right-4 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform rotate-6">
            <span>JUNTAR</span>
          </div>
          <div className="absolute bottom-10 -left-3 sm:-left-6 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform 3">
            <span>COMPRIMIR</span>
          </div>
          <div className="absolute bottom-8 -right-3 sm:-right-5 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#1D68F2] to-[#38BDF8] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform -rotate-3">
            <span>A4</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] h-[260px] sm:h-[290px] md:h-[310px] flex items-center justify-center select-none" id="hero-3d-scene-image">
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#059669]/25 via-[#10B981]/15 to-transparent blur-3xl -z-10 pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full bg-[#34D399]/20 blur-2xl -z-10 pointer-events-none -top-4" />

        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute bottom-2 sm:bottom-4 w-56 sm:w-64 md:w-72 h-14 sm:h-16 flex items-center justify-center">
            <div className="absolute -bottom-2 w-48 sm:w-56 h-8 bg-[#064E3B]/15 rounded-full blur-md" />
            <div className="w-56 sm:w-64 md:w-72 h-14 sm:h-16 rounded-[100%] bg-gradient-to-b from-[#10B981] via-[#059669] to-[#047857] shadow-[0_12px_24px_rgba(5,150,105,0.35)] border-t border-white/60 flex items-center justify-center p-1.5" />
            <div className="absolute top-1 sm:top-1.5 w-52 sm:w-60 md:w-68 h-11 sm:h-13 rounded-[100%] bg-gradient-to-tr from-[#34D399] via-[#A7F3D0] to-[#ECFDF5] border border-white/80 shadow-inner" />
          </div>

          <div className="relative z-10 w-52 sm:w-60 md:w-64 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border-2 border-white shadow-[0_20px_40px_rgba(5,150,105,0.2),0_4px_12px_rgba(11,31,68,0.06)] transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center gap-1.5 pb-2.5 sm:pb-3 border-b border-[#F1F5F9]">
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#EF4444]" />
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#F59E0B]" />
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#10B981]" />
            </div>

            <div className="py-3 flex items-center justify-between gap-3 px-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#059669] to-[#34D399] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(5,150,105,0.4)] border-2 border-white shrink-0">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1 text-left flex-1">
                <span className="text-[11px] font-black text-[#0B1F44] block">Canvas HD</span>
                <span className="text-[10px] text-[#059669] font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                  95% Qualidade
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-[#64748B] font-bold">
              <span>Sem Perda</span>
              <span className="text-[#059669]">Ultra Nitidez</span>
            </div>
          </div>

          <div className="absolute -top-1 -left-2 sm:-left-4 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform -rotate-6">
            <span>JPG</span>
          </div>
          <div className="absolute top-2 -right-2 sm:-right-4 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform rotate-6">
            <span>PNG</span>
          </div>
          <div className="absolute bottom-10 -left-3 sm:-left-6 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform 3">
            <span>WEBP</span>
          </div>
          <div className="absolute bottom-8 -right-3 sm:-right-5 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform -rotate-3">
            <span>-75%</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "document") {
    return (
      <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] h-[260px] sm:h-[290px] md:h-[310px] flex items-center justify-center select-none" id="hero-3d-scene-document">
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#0284C7]/25 via-[#1D68F2]/15 to-transparent blur-3xl -z-10 pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full bg-[#38BDF8]/20 blur-2xl -z-10 pointer-events-none -top-4" />

        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute bottom-2 sm:bottom-4 w-56 sm:w-64 md:w-72 h-14 sm:h-16 flex items-center justify-center">
            <div className="absolute -bottom-2 w-48 sm:w-56 h-8 bg-[#0C4A6E]/15 rounded-full blur-md" />
            <div className="w-56 sm:w-64 md:w-72 h-14 sm:h-16 rounded-[100%] bg-gradient-to-b from-[#0284C7] via-[#0369A1] to-[#075985] shadow-[0_12px_24px_rgba(2,132,199,0.35)] border-t border-white/60 flex items-center justify-center p-1.5" />
            <div className="absolute top-1 sm:top-1.5 w-52 sm:w-60 md:w-68 h-11 sm:h-13 rounded-[100%] bg-gradient-to-tr from-[#38BDF8] via-[#BAE6FD] to-[#F0F9FF] border border-white/80 shadow-inner" />
          </div>

          <div className="relative z-10 w-52 sm:w-60 md:w-64 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border-2 border-white shadow-[0_20px_40px_rgba(2,132,199,0.2),0_4px_12px_rgba(11,31,68,0.06)] transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center gap-1.5 pb-2.5 sm:pb-3 border-b border-[#F1F5F9]">
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#EF4444]" />
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#F59E0B]" />
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#10B981]" />
            </div>

            <div className="py-3 flex items-center justify-between gap-3 px-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(2,132,199,0.4)] border-2 border-white shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1 text-left flex-1">
                <span className="text-[11px] font-black text-[#0B1F44] block">Doc Studio</span>
                <span className="text-[10px] text-[#0284C7] font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                  Extração TXT
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-[#64748B] font-bold">
              <span>Organização</span>
              <span className="text-[#0284C7]">100% Local</span>
            </div>
          </div>

          <div className="absolute -top-1 -left-2 sm:-left-4 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform -rotate-6">
            <span>TXT</span>
          </div>
          <div className="absolute top-2 -right-2 sm:-right-4 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#EF4444] to-[#F87171] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform rotate-6">
            <span>PDF</span>
          </div>
          <div className="absolute bottom-10 -left-3 sm:-left-6 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform 3">
            <span>XLSX</span>
          </div>
          <div className="absolute bottom-8 -right-3 sm:-right-5 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#818CF8] text-white text-xs sm:text-sm font-black shadow-lg border border-white/40 transform -rotate-3">
            <span>DOC</span>
          </div>
        </div>
      </div>
    );
  }

  // Default: Audio / Home
  return (
    <div className="relative w-full max-w-[360px] sm:max-w-[420px] md:max-w-[460px] h-[280px] sm:h-[320px] md:h-[340px] flex items-center justify-center select-none" id="hero-3d-scene">
      {/* Background Soft Glows & Ambient Lighting */}
      <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-[#38BDF8]/20 via-[#1D68F2]/15 to-[#8B5CF6]/15 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute w-56 h-56 rounded-full bg-[#93C5FD]/25 blur-2xl -z-10 pointer-events-none -top-6" />

      {/* 3D Scene Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* 1. Base Pedestal: Layered Concentric Glowing Ellipses */}
        <div className="absolute bottom-1 sm:bottom-2 w-64 sm:w-76 md:w-84 h-16 sm:h-20 flex items-center justify-center pointer-events-none">
          <div className="absolute -bottom-2 w-56 sm:w-68 h-10 bg-[#1D68F2]/15 rounded-full blur-lg" />
          {/* Outer Ring */}
          <div className="w-64 sm:w-76 md:w-84 h-16 sm:h-20 rounded-[100%] bg-gradient-to-b from-[#93C5FD] via-[#60A5FA] to-[#1D68F2] shadow-[0_16px_32px_rgba(29,104,242,0.25)] border-t border-white/70 flex items-center justify-center p-1.5" />
          {/* Middle Ring */}
          <div className="absolute top-1.5 sm:top-2 w-60 sm:w-72 md:w-80 h-13 sm:h-16 rounded-[100%] bg-gradient-to-tr from-[#BFDBFE] via-[#DBEAFE] to-[#EFF6FF] border border-white/90 shadow-inner flex items-center justify-center" />
          {/* Inner Glowing Plate */}
          <div className="absolute top-3 sm:top-4 w-52 sm:w-64 md:w-72 h-10 sm:h-12 rounded-[100%] bg-gradient-to-b from-white via-[#F0F9FF] to-[#DBEAFE] border border-white shadow-xs" />
        </div>

        {/* 2. Floating Cloud with Upload Arrow Above */}
        <div className="absolute -top-3 sm:-top-1 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center animate-bounce duration-1000">
          <div className="relative w-16 h-10 sm:w-20 sm:h-12 flex items-center justify-center filter drop-shadow-[0_8px_16px_rgba(29,104,242,0.2)]">
            <div className="absolute w-12 h-8 sm:w-14 sm:h-9 bg-white rounded-full shadow-xs" />
            <div className="absolute -top-2 left-2 w-7 h-7 sm:w-9 sm:h-9 bg-white rounded-full shadow-xs" />
            <div className="absolute -top-1 right-2 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full shadow-xs" />
            <div className="relative z-10 text-[#1D68F2] flex items-center justify-center">
              <Cloud className="w-5 h-5 sm:w-6 sm:h-6 fill-[#EFF6FF] text-[#1D68F2]" />
            </div>
            <div className="absolute -top-1 -right-2 text-[#38BDF8] animate-pulse">
              <Sparkles className="w-4 h-4 fill-[#38BDF8]" />
            </div>
          </div>
        </div>

        {/* 3. Main 3D Player Window / Card */}
        <div className="relative z-10 w-60 sm:w-68 md:w-74 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-white shadow-[0_20px_48px_rgba(29,104,242,0.18),0_4px_16px_rgba(11,31,68,0.06)] transform hover:scale-[1.02] transition-transform duration-300">
          {/* Top Window Dots */}
          <div className="flex items-center gap-1.5 pb-3 border-b border-[#F1F5F9]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          </div>

          {/* Middle: Play Button + Waveform */}
          <div className="py-3 sm:py-4 flex items-center justify-between gap-3 px-1">
            {/* Blue Circular Play Button */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#1D68F2] via-[#2563EB] to-[#38BDF8] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(29,104,242,0.4)] border-2 border-white shrink-0 hover:scale-105 transition-transform cursor-pointer">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white ml-0.5" />
            </div>

            {/* Sound Waveform Bars */}
            <div className="flex items-center gap-1 sm:gap-1.5 h-10 sm:h-12 flex-1 justify-center px-1">
              <span className="w-1 sm:w-1.5 h-3 bg-[#93C5FD] rounded-full" />
              <span className="w-1 sm:w-1.5 h-6 bg-[#60A5FA] rounded-full" />
              <span className="w-1 sm:w-1.5 h-9 bg-[#1D68F2] rounded-full" />
              <span className="w-1 sm:w-1.5 h-5 bg-[#3B82F6] rounded-full" />
              <span className="w-1 sm:w-1.5 h-8 bg-[#1D68F2] rounded-full" />
              <span className="w-1 sm:w-1.5 h-11 bg-[#2563EB] rounded-full" />
              <span className="w-1 sm:w-1.5 h-7 bg-[#1D68F2] rounded-full" />
              <span className="w-1 sm:w-1.5 h-10 bg-[#3B82F6] rounded-full" />
              <span className="w-1 sm:w-1.5 h-8 bg-[#60A5FA] rounded-full" />
              <span className="w-1 sm:w-1.5 h-4 bg-[#93C5FD] rounded-full" />
            </div>
          </div>

          {/* Status Row: Alta Fidelidade + 320 kbps */}
          <div className="pt-1 flex items-center justify-between text-[10.5px] sm:text-xs font-extrabold mb-2">
            <span className="flex items-center gap-1 text-[#059669]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Alta Fidelidade</span>
            </span>
            <span className="text-[#1D68F2] font-black">320 kbps</span>
          </div>

          {/* Scrub / Progress Bar */}
          <div className="relative w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-visible">
            <div className="absolute top-0 left-0 h-full w-[65%] bg-gradient-to-r from-[#1D68F2] to-[#38BDF8] rounded-full" />
            <div className="absolute top-1/2 left-[65%] -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#1D68F2] border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform" />
          </div>
        </div>

        {/* 4. Floating 3D Format Pills Around Card (As shown in top.png) */}
        {/* Top-Left: Purple MP3 */}
        <div className="absolute -top-2 -left-2 sm:-left-6 z-20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] text-white text-xs sm:text-sm font-black tracking-wide shadow-[0_10px_22px_rgba(109,40,217,0.35)] border border-white/40 transform -rotate-6 hover:scale-110 transition-transform cursor-default flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 fill-white" />
          <span>MP3</span>
        </div>

        {/* Top-Right: Green WAV */}
        <div className="absolute -top-1 -right-2 sm:-right-6 z-20 px-3.5 py-1.5 sm:px-4.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white text-xs sm:text-sm font-black tracking-wide shadow-[0_10px_22px_rgba(5,150,105,0.35)] border border-white/40 transform rotate-6 hover:scale-110 transition-transform cursor-default flex items-center gap-1.5">
          <span>WAV</span>
        </div>

        {/* Bottom-Left: Orange M4A */}
        <div className="absolute bottom-8 -left-3 sm:-left-8 z-20 px-3.5 py-1.5 sm:px-4.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white text-xs sm:text-sm font-black tracking-wide shadow-[0_10px_22px_rgba(234,88,12,0.35)] border border-white/40 transform 3 hover:scale-110 transition-transform cursor-default flex items-center gap-1.5">
          <span>M4A</span>
        </div>

        {/* Bottom-Right: Blue FLAC */}
        <div className="absolute bottom-6 -right-3 sm:-right-8 z-20 px-3.5 py-1.5 sm:px-4.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-[#2563EB] text-white text-xs sm:text-sm font-black tracking-wide shadow-[0_10px_22px_rgba(29,78,216,0.35)] border border-white/40 transform -rotate-3 hover:scale-110 transition-transform cursor-default flex items-center gap-1.5">
          <span>FLAC</span>
        </div>

      </div>
    </div>
  );
};
