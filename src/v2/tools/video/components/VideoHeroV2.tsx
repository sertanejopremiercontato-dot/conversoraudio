import React from "react";
import { Zap, ShieldCheck, Sparkles, Play, Volume2, Shield } from "lucide-react";

interface VideoHeroV2Props {
  onBack?: () => void;
}

export const VideoHeroV2: React.FC<VideoHeroV2Props> = () => {
  return (
    <section 
      className="relative overflow-hidden bg-gradient-to-br from-[#F8FAFF] via-[#F3F6FF] to-[#FAF5FF] border border-[#E0E7FF] rounded-[24px] md:rounded-[28px] px-8 sm:px-12 lg:px-16 xl:px-20 py-10 sm:py-12 lg:py-14 shadow-[0_8px_30px_rgba(99,102,241,0.05)] min-h-[380px] lg:min-h-[410px] flex items-center"
      id="v2-video-hero"
    >
      {/* Background Subtle Ambient Lighting & Glows */}
      <div className="absolute top-0 right-1/4 w-[550px] h-[550px] rounded-full bg-[#818CF8]/15 blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[500px] rounded-full bg-[#C084FC]/15 blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-[#60A5FA]/10 blur-3xl pointer-events-none -z-0" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12 w-full">
        {/* Left Column: Pill, Big Title, Description, 3 Chips, Privacy Note (43% width on lg) */}
        <div className="space-y-6 max-w-xl text-center lg:text-left w-full lg:w-[43%]">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] text-[11px] font-black tracking-wider uppercase shadow-2xs">
            <span>EXTRAÇÃO DE ÁUDIO DE VÍDEOS</span>
          </div>

          {/* Big Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] xl:text-[62px] font-black tracking-tight leading-[1.06] text-[#0F172A]">
            Vídeo para{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#3B82F6]">
              Áudio
            </span>
          </h1>

          {/* Subtext (520px - 600px width) */}
          <p className="text-sm sm:text-[15.5px] text-[#475569] leading-relaxed max-w-[560px] mx-auto lg:mx-0 font-normal">
            Extraia o áudio dos seus vídeos em MP4, MOV, WebM, AVI ou MKV com máxima fidelidade sonora, diretamente no seu navegador.
          </p>

          {/* 3 Chips in one line */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
            {/* Chip 1: Processamento Local */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-[#1E293B] text-xs font-bold shadow-xs hover:border-[#CBD5E1] transition-all">
              <Zap className="w-3.5 h-3.5 text-[#6366F1] fill-[#6366F1]" />
              <span>Processamento Local</span>
            </div>

            {/* Chip 2: Sem Upload para Nuvem */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-[#1E293B] text-xs font-bold shadow-xs hover:border-[#CBD5E1] transition-all">
              <ShieldCheck className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Sem Upload para Nuvem</span>
            </div>

            {/* Chip 3: Alta Fidelidade */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-[#1E293B] text-xs font-bold shadow-xs hover:border-[#CBD5E1] transition-all">
              <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Alta Fidelidade</span>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-[#64748B] pt-1">
            <Shield className="w-4 h-4 text-[#6366F1] shrink-0" />
            <span>Seus arquivos não saem do seu dispositivo. 100% seguro e privado.</span>
          </div>
        </div>

        {/* Right Column: Hero Graphic Composition (57% width on lg) */}
        <div className="w-full lg:w-[57%] max-w-[660px] xl:max-w-[700px] select-none shrink-0">
          <div className="relative flex items-center justify-center py-4">
            
            {/* 3D Floating Format Badges */}
            {/* MOV pill top left */}
            <div className="absolute -top-4 left-[14%] z-30 px-4 py-1.5 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white text-xs font-black shadow-[0_8px_20px_rgba(37,99,235,0.45)] border border-white/20 transform -rotate-6">
              MOV
            </div>

            {/* MKV pill top right */}
            <div className="absolute -top-3 left-[52%] z-30 px-4 py-1.5 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white text-xs font-black shadow-[0_8px_20px_rgba(124,58,237,0.45)] border border-white/20 transform rotate-8">
              MKV
            </div>

            {/* WebM pill bottom left */}
            <div className="absolute -bottom-4 left-[6%] z-30 px-4 py-1.5 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E40AF] text-white text-xs font-black shadow-[0_8px_20px_rgba(37,99,235,0.4)] border border-white/20 transform -rotate-3">
              WebM
            </div>

            {/* Concentric Elliptical Glow Pedestal Behind Audio Card (Right side) */}
            <div className="absolute -right-6 -bottom-6 w-80 h-40 border-2 border-[#C084FC]/30 rounded-[100%] pointer-events-none -z-0 transform rotate-[-8deg] bg-gradient-to-t from-[#EDE9FE]/40 to-transparent" />
            <div className="absolute -right-2 -bottom-2 w-64 h-32 border border-[#A855F7]/35 rounded-[100%] pointer-events-none -z-0 transform rotate-[-8deg]" />
            <div className="absolute right-3 bottom-2 w-52 h-24 border border-[#8B5CF6]/40 rounded-[100%] pointer-events-none -z-0 transform rotate-[-8deg]" />

            {/* Main Visual Composition: Video Player + Big 3D Arrow + Audio Card */}
            <div className="relative flex items-center justify-between gap-3 sm:gap-4 w-full">
              
              {/* 1. Video Player Window (Large High-Impact Visual: 380px - 410px range) */}
              <div className="w-[52%] sm:w-[51%] bg-[#0F172A] border border-[#334155] rounded-[22px] overflow-hidden shadow-[0_20px_45px_rgba(15,23,42,0.35)] relative group z-10">
                {/* Window Header Dots */}
                <div className="h-6 bg-[#1E293B] px-3.5 flex items-center gap-1.5 border-b border-[#334155]">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                </div>

                {/* Video Preview Canvas with Scenic Mountain Sunset Artwork */}
                <div className="relative h-44 sm:h-48 bg-gradient-to-b from-[#1E1B4B] via-[#4338CA] to-[#0F172A] p-3.5 flex flex-col justify-between overflow-hidden">
                  {/* Sunset Sky Glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#831843]/30 to-[#312E81]/60 pointer-events-none" />
                  
                  {/* Mountain Silhouettes */}
                  <svg className="absolute bottom-7 left-0 right-0 w-full h-28 opacity-85" viewBox="0 0 300 100" preserveAspectRatio="none">
                    {/* Far Mountains */}
                    <polygon points="0,100 40,45 90,75 160,30 220,65 270,35 300,60 300,100" fill="#3B0764" opacity="0.6" />
                    {/* Mid Mountains */}
                    <polygon points="0,100 30,60 70,80 130,45 190,70 250,50 300,80 300,100" fill="#1E1B4B" opacity="0.8" />
                    {/* Foreground Mountains */}
                    <polygon points="0,100 60,70 120,85 180,60 240,75 300,65 300,100" fill="#0F172A" />
                  </svg>

                  {/* Sun Glow Behind Mountain Peak */}
                  <div className="absolute top-8 left-[52%] w-16 h-16 rounded-full bg-gradient-to-tr from-[#F43F5E] to-[#FBBF24] blur-sm opacity-80" />

                  {/* Centered Large Play Button (Glassmorphism) */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-13 h-13 rounded-full bg-white/25 backdrop-blur-md border border-white/50 flex items-center justify-center text-white shadow-[0_8px_25px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Timeline & Controls */}
                  <div className="relative z-20 mt-auto space-y-1.5">
                    {/* Progress Track */}
                    <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden">
                      <div className="w-[48%] h-full bg-[#6366F1] rounded-full shadow-[0_0_8px_#818CF8]" />
                    </div>
                    {/* Time readout */}
                    <div className="flex items-center justify-between text-[10px] text-white/90 font-mono">
                      <span>02:45 / 05:30</span>
                      <div className="flex items-center gap-1.5 opacity-80">
                        <Volume2 className="w-2.5 h-2.5" />
                        <span className="w-2.5 h-2.5 border border-white/80 rounded-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Big 3D Transformation Arrow */}
              <div className="shrink-0 flex items-center justify-center z-10 px-0.5">
                <div className="relative">
                  {/* Glowing backdrop behind arrow */}
                  <div className="absolute inset-0 bg-[#818CF8] blur-md opacity-60 rounded-full" />
                  <svg className="w-11 sm:w-14 h-9 sm:h-11 drop-shadow-[0_6px_16px_rgba(99,102,241,0.55)] transform" viewBox="0 0 48 36" fill="none">
                    <path
                      d="M2 14C2 11.7909 3.79086 10 6 10H24V4C24 2.22222 26.1543 1.33096 27.4142 2.58579L45.4142 16.5858C46.1953 17.3668 46.1953 18.6332 45.4142 19.4142L27.4142 33.4142C26.1543 34.669 24 33.7778 24 32V26H6C3.79086 26 2 24.2091 2 22V14Z"
                      fill="url(#arrow-gradient)"
                    />
                    <defs>
                      <linearGradient id="arrow-gradient" x1="2" y1="18" x2="46" y2="18" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#818CF8" />
                        <stop offset="0.5" stopColor="#6366F1" />
                        <stop offset="1" stopColor="#4F46E5" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* 3. Audio Result Card (Large: 300px - 340px range, Perspective Tilted, Waveform, 320 kbps) */}
              <div className="w-[44%] sm:w-[43%] relative z-20">
                {/* Multi-layered Soft Drop Shadow */}
                <div className="bg-white border border-[#E2E8F0] rounded-[22px] p-4 sm:p-5 shadow-[0_20px_45px_rgba(99,102,241,0.18),0_4px_16px_rgba(0,0,0,0.04)] space-y-3.5 transform rotate-[3deg] hover:rotate-0 transition-transform duration-300">
                  {/* Top Badge: MP3 */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-[11px] font-black uppercase tracking-wider shadow-2xs">
                      MP3
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                      <Volume2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Dense Colorful Waveform in Indigo & Purple */}
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-16 px-1 py-1">
                    <span className="w-1 sm:w-1.5 h-5 bg-[#C4B5FD] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-8 bg-[#A78BFA] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-12 bg-[#8B5CF6] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-7 bg-[#6366F1] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-14 bg-[#7C3AED] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-16 bg-[#4F46E5] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-10 bg-[#6366F1] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-14 bg-[#8B5CF6] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-9 bg-[#A78BFA] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-5 bg-[#C4B5FD] rounded-full" />
                  </div>

                  {/* Bottom: 320 kbps text */}
                  <div className="text-right pt-0.5">
                    <span className="text-xs sm:text-sm font-black text-[#4F46E5] tracking-tight">
                      320 kbps
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

