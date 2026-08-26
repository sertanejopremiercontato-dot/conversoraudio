import React from "react";
import { 
  FileText, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Layers,
  Lock,
  CloudOff,
  Star,
  Search,
  Files,
  FileCode,
  File,
  Laptop,
  Infinity,
  Check
} from "lucide-react";
import { AppRouteV2 } from "../../routes";

interface DocumentHubV2Props {
  onNavigate?: (route: AppRouteV2 | string) => void;
  onBack?: () => void;
}

export const DocumentHubV2: React.FC<DocumentHubV2Props> = ({ onNavigate }) => {
  const handleNavigateTool = (routeOrPath: string) => {
    if (onNavigate) {
      onNavigate(routeOrPath);
    }
  };

  return (
    <div className="space-y-8 md:space-y-10" id="v2-document-hub-view">
      
      {/* ========================================================
          1. HERO PRINCIPAL DA PÁGINA /DOCUMENTOS
         ======================================================== */}
      <section 
        className="relative overflow-hidden rounded-[28px] md:rounded-[32px] bg-gradient-to-r from-[#F0F5FF] via-[#F5F3FF] to-[#FAF5FF] border border-[#E0EBFB] p-6 sm:p-8 md:p-12 shadow-[0_4px_24px_rgba(29,104,242,0.05)]"
        id="v2-doc-hero"
      >
        {/* Background glow accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1D68F2]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center relative z-10">
          
          {/* Lado Esquerdo: Conteúdo Textual */}
          <div className="lg:col-span-7 space-y-5 text-left">
            
            {/* Badge superior */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-xs border border-[#BFDBFE] text-[#1D68F2] text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#1D68F2]" />
              <span>Hub de Ferramentas de Documentos</span>
            </div>

            {/* Título Grande */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0B1F44] tracking-tight leading-[1.12]">
              Ferramentas de <br className="hidden sm:inline" />
              <span className="text-[#1D68F2]">Documentos</span> Online Grátis
            </h1>

            {/* Subtítulo */}
            <p className="text-sm sm:text-base text-[#5C6F84] max-w-xl font-medium leading-relaxed">
              Converta, extraia e organize arquivos de documentos com ferramentas simples, rápidas e 100% privadas diretamente na memória do seu navegador.
            </p>

            {/* 3 Selos / Chips Horizontais Elegantes */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Chip 1: Processamento Local */}
              <div className="bg-white/90 backdrop-blur-xs border border-[#E2E8F0] rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="font-extrabold text-[12px] text-[#0B1F44] leading-tight truncate">
                    Processamento Local
                  </p>
                  <p className="text-[10.5px] text-[#64748B] leading-tight">
                    Seus arquivos não saem do seu dispositivo
                  </p>
                </div>
              </div>

              {/* Chip 2: Sem Upload para Nuvem */}
              <div className="bg-white/90 backdrop-blur-xs border border-[#E2E8F0] rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D68F2] flex items-center justify-center shrink-0 mt-0.5">
                  <CloudOff className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="font-extrabold text-[12px] text-[#0B1F44] leading-tight truncate">
                    Sem Upload para Nuvem
                  </p>
                  <p className="text-[10.5px] text-[#64748B] leading-tight">
                    Mais privacidade e segurança
                  </p>
                </div>
              </div>

              {/* Chip 3: Segurança de Dados */}
              <div className="bg-white/90 backdrop-blur-xs border border-[#E2E8F0] rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#8B5CF6] flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="font-extrabold text-[12px] text-[#0B1F44] leading-tight truncate">
                    Segurança de Dados
                  </p>
                  <p className="text-[10.5px] text-[#64748B] leading-tight">
                    100% privado e confiável
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Lado Direito: Ilustração Visual Doc Studio em 3D / Perspectiva */}
          <div className="lg:col-span-5 flex items-center justify-center relative min-h-[300px] lg:min-h-[360px]">
            <div className="relative w-full max-w-[380px] select-none">
              
              {/* Backing Floating Sheets */}
              <div className="absolute -top-4 left-6 w-60 h-44 bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl shadow-lg -rotate-6 transition-transform" />
              <div className="absolute top-2 right-4 w-52 h-40 bg-white/80 backdrop-blur-sm border border-white/90 rounded-2xl shadow-md rotate-3 transition-transform" />

              {/* Main Doc Studio Card */}
              <div className="relative z-10 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-[24px] p-5 shadow-[0_12px_32px_rgba(11,31,68,0.12)] space-y-4">
                
                {/* Header of Doc Studio window */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  </div>
                  <div className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase">
                    Document Suite
                  </div>
                </div>

                {/* Studio content */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1D68F2] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5 flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-[#0B1F44] text-[15px] leading-tight">
                        Doc Studio
                      </p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[9.5px] font-extrabold border border-[#A7F3D0]">
                        <Check className="w-2.5 h-2.5" />
                        <span>Seguro e Local</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] font-medium">
                      Organização & Conversão
                    </p>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-1.5 bg-[#F8FAFD] rounded-xl p-3 border border-[#E4ECF7]">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#0B1F44]">Processamento</span>
                    <span className="text-[#1D68F2]">100% Local</span>
                  </div>
                  <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#1D68F2] to-[#8B5CF6] rounded-full w-full animate-pulse" />
                  </div>
                </div>

                {/* Bottom stats / graphics inside card */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-[#EFF6FF] rounded-lg p-2 text-center border border-[#BFDBFE]">
                    <span className="block text-[9px] font-extrabold text-[#1D68F2] uppercase">Formatos</span>
                    <span className="font-black text-[#0B1F44] text-xs">PDF • DOC</span>
                  </div>
                  <div className="bg-[#F5F3FF] rounded-lg p-2 text-center border border-[#DDD6FE]">
                    <span className="block text-[9px] font-extrabold text-[#8B5CF6] uppercase">Velocidade</span>
                    <span className="font-black text-[#0B1F44] text-xs">Instantânea</span>
                  </div>
                  <div className="bg-[#ECFDF5] rounded-lg p-2 text-center border border-[#A7F3D0]">
                    <span className="block text-[9px] font-extrabold text-[#059669] uppercase">Privacidade</span>
                    <span className="font-black text-[#0B1F44] text-xs">Zero Nuvem</span>
                  </div>
                </div>

              </div>

              {/* Floating Format Badges around */}
              {/* TXT Top-Left */}
              <div className="absolute -top-3 -left-4 z-20 px-3 py-1 rounded-xl bg-[#0284C7] text-white font-extrabold text-[11px] shadow-lg shadow-sky-500/30 rotate-[-8deg] border border-white flex items-center gap-1">
                <FileCode className="w-3 h-3" />
                <span>TXT</span>
              </div>

              {/* PDF Top-Right */}
              <div className="absolute -top-2 -right-3 z-20 px-3.5 py-1 rounded-xl bg-[#EF4444] text-white font-extrabold text-[11px] shadow-lg shadow-red-500/30 rotate-[6deg] border border-white flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </div>

              {/* XLSX Bottom-Left */}
              <div className="absolute -bottom-3 -left-3 z-20 px-3.5 py-1 rounded-xl bg-[#10B981] text-white font-extrabold text-[11px] shadow-lg shadow-emerald-500/30 rotate-[6deg] border border-white flex items-center gap-1">
                <Files className="w-3 h-3" />
                <span>XLSX</span>
              </div>

              {/* DOC Bottom-Right */}
              <div className="absolute -bottom-3 -right-2 z-20 px-3.5 py-1 rounded-xl bg-[#8B5CF6] text-white font-extrabold text-[11px] shadow-lg shadow-purple-500/30 rotate-[-6deg] border border-white flex items-center gap-1">
                <File className="w-3 h-3" />
                <span>DOC</span>
              </div>

              {/* Blue Shield Floating on Base */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-30 w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1D68F2] to-[#2563EB] text-white flex items-center justify-center shadow-xl shadow-blue-600/35 border-2 border-white">
                <ShieldCheck className="w-6 h-6" />
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          2. SEÇÃO PRINCIPAL DE FERRAMENTAS (3 CARDS)
         ======================================================== */}
      <section className="space-y-5" id="v2-document-tools-grid">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1D68F2]/10 border border-[#1D68F2]/20 flex items-center justify-center text-[#1D68F2] shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#0B1F44] tracking-tight">
                Escolha uma Solução de Documentos
              </h2>
              <p className="text-xs text-[#5C6F84]">
                Acesse as ferramentas dedicadas para manipulação e extração de dados.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D68F2] text-xs font-bold w-fit shadow-2xs">
            <Star className="w-3.5 h-3.5 fill-[#1D68F2]" />
            <span>100% Gratuito</span>
          </div>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ========================================================
              CARD 1: Extrair Texto de PDF
             ======================================================== */}
          <div
            onClick={() => handleNavigateTool("/pdf/extrair-texto")}
            className="bg-white border border-[#E4ECF7] hover:border-[#1D68F2]/50 rounded-[28px] p-6 flex flex-col justify-between space-y-6 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-[0_2px_14px_rgba(11,31,68,0.03)] hover:shadow-[0_12px_28px_rgba(29,104,242,0.1)] hover:-translate-y-1 text-left"
            id="v2-doc-card-extract-text"
          >
            <div className="space-y-4">
              
              {/* Header do Card */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D68F2] text-[10.5px] font-extrabold uppercase tracking-wide">
                  PDF → TEXTO
                </span>
              </div>

              {/* Título & Descrição */}
              <div>
                <h3 className="text-lg font-extrabold text-[#0B1F44] group-hover:text-[#1D68F2] transition-colors leading-snug">
                  Extrair Texto de PDF
                </h3>
                <p className="text-xs text-[#5C6F84] mt-1.5 leading-relaxed font-medium">
                  Extraia o texto contido em documentos PDF por página de forma rápida, com opção de cópia imediata e exportação.
                </p>
              </div>

              {/* Mini Ilustração & Checklist Lado a Lado */}
              <div className="grid grid-cols-12 gap-3 items-center pt-2">
                {/* Checklist (col 8) */}
                <div className="col-span-8 space-y-2 text-[11.5px] font-semibold text-[#475569]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1D68F2] shrink-0" />
                    <span>Visualização organizada por página</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1D68F2] shrink-0" />
                    <span>Cópia rápida de trechos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1D68F2] shrink-0" />
                    <span>Download em formato TXT simples</span>
                  </div>
                </div>

                {/* Mini Ilustração PDF com Lupa (col 4) */}
                <div className="col-span-4 flex items-center justify-center">
                  <div className="relative w-16 h-20 bg-[#F8FAFD] border border-[#E2E8F0] rounded-xl p-2 flex flex-col justify-between shadow-2xs group-hover:border-[#1D68F2]/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                      <span className="text-[8px] font-extrabold text-[#EF4444]">PDF</span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-1 bg-[#CBD5E1] rounded-full" />
                      <div className="w-3/4 h-1 bg-[#CBD5E1] rounded-full" />
                      <div className="w-full h-1 bg-[#CBD5E1] rounded-full" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1D68F2] text-white flex items-center justify-center shadow-xs">
                      <Search className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Botão Inferior em Azul */}
            <div className="pt-2">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#1D68F2] to-[#2563EB] hover:from-[#1554C7] hover:to-[#1D4ED8] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(29,104,242,0.25)] transition-all cursor-pointer group-hover:scale-[1.01]"
              >
                <span>Extrair Texto Agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ========================================================
              CARD 2: Ferramentas PDF
             ======================================================== */}
          <div
            onClick={() => handleNavigateTool("pdf")}
            className="bg-white border border-[#E4ECF7] hover:border-[#EF4444]/50 rounded-[28px] p-6 flex flex-col justify-between space-y-6 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-[0_2px_14px_rgba(11,31,68,0.03)] hover:shadow-[0_12px_28px_rgba(239,68,68,0.1)] hover:-translate-y-1 text-left"
            id="v2-doc-card-pdf-suite"
          >
            <div className="space-y-4">
              
              {/* Header do Card */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#EF4444] to-[#F87171] text-white flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-[10.5px] font-extrabold uppercase tracking-wide">
                  SUÍTE COMPLETA
                </span>
              </div>

              {/* Título & Descrição */}
              <div>
                <h3 className="text-lg font-extrabold text-[#0B1F44] group-hover:text-[#EF4444] transition-colors leading-snug">
                  Ferramentas PDF
                </h3>
                <p className="text-xs text-[#5C6F84] mt-1.5 leading-relaxed font-medium">
                  Junte, comprima, organize, divida e converta imagens em PDF diretamente no seu navegador.
                </p>
              </div>

              {/* Mini Ilustração & Checklist Lado a Lado */}
              <div className="grid grid-cols-12 gap-3 items-center pt-2">
                {/* Checklist (col 8) */}
                <div className="col-span-8 space-y-2 text-[11.5px] font-semibold text-[#475569]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Juntar e organizar arquivos PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Comprimir tamanho sem perda de nitidez</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Converter fotos e imagens em PDF</span>
                  </div>
                </div>

                {/* Mini Ilustração Folhas PDF (col 4) */}
                <div className="col-span-4 flex items-center justify-center">
                  <div className="relative w-16 h-20 select-none">
                    <div className="absolute top-0 right-1 w-12 h-16 bg-[#FEF2F2] border border-[#FECACA] rounded-xl rotate-6" />
                    <div className="relative z-10 w-14 h-18 bg-white border border-[#E2E8F0] rounded-xl p-2 flex flex-col justify-between shadow-xs">
                      <div className="w-4 h-4 rounded bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center font-extrabold text-[8px]">
                        A
                      </div>
                      <div className="bg-[#EF4444] text-white text-[8px] font-extrabold px-1 py-0.5 rounded text-center">
                        PDF
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Botão Inferior em Vermelho */}
            <div className="pt-2">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(239,68,68,0.25)] transition-all cursor-pointer group-hover:scale-[1.01]"
              >
                <span>Acessar Ferramentas PDF</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ========================================================
              CARD 3: Converter para TXT / DOC
             ======================================================== */}
          <div
            onClick={() => handleNavigateTool("/pdf/extrair-texto")}
            className="bg-white border border-[#E4ECF7] hover:border-[#8B5CF6]/50 rounded-[28px] p-6 flex flex-col justify-between space-y-6 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-[0_2px_14px_rgba(11,31,68,0.03)] hover:shadow-[0_12px_28px_rgba(139,92,246,0.1)] hover:-translate-y-1 text-left"
            id="v2-doc-card-convert-doc"
          >
            <div className="space-y-4">
              
              {/* Header do Card */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#A78BFA] text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] text-[#8B5CF6] text-[10.5px] font-extrabold uppercase tracking-wide">
                  PDF → OUTROS
                </span>
              </div>

              {/* Título & Descrição */}
              <div>
                <h3 className="text-lg font-extrabold text-[#0B1F44] group-hover:text-[#8B5CF6] transition-colors leading-snug">
                  Converter para TXT / DOC
                </h3>
                <p className="text-xs text-[#5C6F84] mt-1.5 leading-relaxed font-medium">
                  Converta documentos PDF para TXT ou DOC mantendo a estrutura do texto de forma inteligente.
                </p>
              </div>

              {/* Mini Ilustração & Checklist Lado a Lado */}
              <div className="grid grid-cols-12 gap-3 items-center pt-2">
                {/* Checklist (col 8) */}
                <div className="col-span-8 space-y-2 text-[11.5px] font-semibold text-[#475569]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                    <span>Conversão para TXT ou DOCX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                    <span>Preserva quebras de linha e parágrafos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                    <span>Rápido, leve e 100% local</span>
                  </div>
                </div>

                {/* Mini Ilustração Conversão PDF -> TXT / DOC (col 4) */}
                <div className="col-span-4 flex items-center justify-center">
                  <div className="flex items-center gap-1 bg-[#F8FAFD] border border-[#E2E8F0] rounded-xl p-1.5 shadow-2xs">
                    <div className="w-7 h-10 bg-[#FEF2F2] border border-[#FECACA] rounded-md flex flex-col items-center justify-center text-[7px] font-black text-[#EF4444]">
                      PDF
                    </div>
                    <div className="flex flex-col gap-0.5 text-[#1D68F2]">
                      <ArrowRight className="w-2.5 h-2.5" />
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="px-1 py-0.5 bg-[#0284C7] text-white rounded text-[7px] font-bold">
                        TXT
                      </div>
                      <div className="px-1 py-0.5 bg-[#8B5CF6] text-white rounded text-[7px] font-bold">
                        DOCX
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Botão Inferior em Roxo */}
            <div className="pt-2">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(139,92,246,0.25)] transition-all cursor-pointer group-hover:scale-[1.01]"
              >
                <span>Converter Agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          3. BARRA INFERIOR DE BENEFÍCIOS (5 BLOCOS)
         ======================================================== */}
      <section 
        className="bg-white border border-[#E4ECF7] rounded-[24px] p-5 sm:p-6 shadow-[0_2px_14px_rgba(11,31,68,0.03)]"
        id="v2-doc-benefits-bar"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-0 lg:divide-x lg:divide-[#F1F5F9]">
          
          {/* Bloco 1: Privacidade */}
          <div className="flex items-center gap-3 lg:px-4 first:lg:pl-0 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D68F2] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="font-extrabold text-[12.5px] text-[#0B1F44] leading-tight">
                Privacidade é nossa prioridade
              </p>
              <p className="text-[11px] text-[#5C6F84] leading-tight">
                Seus documentos estão 100% seguros.
              </p>
            </div>
          </div>

          {/* Bloco 2: 100% Local */}
          <div className="flex items-center gap-3 lg:px-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D68F2] flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="font-extrabold text-[12.5px] text-[#0B1F44] leading-tight">
                100% Local
              </p>
              <p className="text-[11px] text-[#5C6F84] leading-tight">
                Processamento acontece apenas no seu dispositivo
              </p>
            </div>
          </div>

          {/* Bloco 3: Sem Upload */}
          <div className="flex items-center gap-3 lg:px-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D68F2] flex items-center justify-center shrink-0">
              <CloudOff className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="font-extrabold text-[12.5px] text-[#0B1F44] leading-tight">
                Sem Upload
              </p>
              <p className="text-[11px] text-[#5C6F84] leading-tight">
                Nenhum arquivo é enviado para servidores ou nuvem
              </p>
            </div>
          </div>

          {/* Bloco 4: Máxima Segurança */}
          <div className="flex items-center gap-3 lg:px-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D68F2] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="font-extrabold text-[12.5px] text-[#0B1F44] leading-tight">
                Máxima Segurança
              </p>
              <p className="text-[11px] text-[#5C6F84] leading-tight">
                Seus dados permanecem privados e protegidos
              </p>
            </div>
          </div>

          {/* Bloco 5: Gratuito e ilimitado */}
          <div className="flex items-center gap-3 lg:px-4 last:lg:pr-0 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D68F2] flex items-center justify-center shrink-0">
              <Infinity className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="font-extrabold text-[12.5px] text-[#0B1F44] leading-tight">
                Gratuito e ilimitado
              </p>
              <p className="text-[11px] text-[#5C6F84] leading-tight">
                Use todas as ferramentas sem limites ou cadastros
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
