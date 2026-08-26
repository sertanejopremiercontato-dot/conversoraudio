/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Volume2, 
  Video, 
  FileText, 
  FileSpreadsheet,
  ShieldCheck, 
  ArrowRight, 
  Music, 
  Sparkles,
  Info
} from "lucide-react";
import { motion } from "motion/react";

interface HomeProps {
  onNavigate: (path: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <div className="space-y-10 py-4">
      {/* Hero Welcome Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 bg-[#E0F2FE] border border-[#BAE6FD] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0284C7]"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Ferramentas Online Grátis</span>
        </motion.div>
        
        <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A]" id="home-title">
          Conversor de Áudio e Ferramentas Online Grátis
        </h2>
        
        <p className="text-xs md:text-sm text-[#475569] leading-relaxed max-w-xl mx-auto font-medium" id="home-subtitle">
          Converta arquivos de áudio, extraia o som de vídeos, converta planilhas Excel em PDF e organize documentos de forma rápida, fácil e sem cadastro.
        </p>

        {/* Highlights Badges */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {[
            "Ferramentas gratuitas",
            "Conversão rápida",
            "Diversos formatos",
            "Sem necessidade de cadastro",
            "Baixe o resultado na hora",
            "Seus arquivos não ficam salvos"
          ].map((highlight, idx) => (
            <span key={idx} className="bg-white border border-[#E2E8F0] text-[#475569] text-[11px] font-semibold px-3 py-1 rounded-full shadow-xs">
              ✓ {highlight}
            </span>
          ))}
        </div>
      </div>

      {/* Grid structure for main cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto" id="categories-grid">
        {/* Card 1: Audio Converter */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white rounded-3xl border border-[#E2E8F0] hover:border-[#0284C7]/50 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group cursor-pointer transition-all"
          onClick={() => onNavigate("audio")}
          id="card-audio-converter"
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#E0F2FE] rounded-2xl border border-[#BAE6FD] text-[#0284C7] inline-block group-hover:scale-105 transition-transform">
              <Music className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-1.5 group-hover:text-[#0284C7] transition-colors">
                <span>Conversor de Áudio</span>
              </h3>
              <p className="text-xs text-[#475569] mt-1.5 leading-relaxed font-medium">
                Converta seus arquivos para MP3, WAV, AAC, FLAC e OGG com qualidade personalizada.
              </p>
            </div>
            <ul className="text-[11px] text-[#475569] space-y-1.5 pt-2 font-medium">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Conversão em lote
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Várias opções de qualidade
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Download imediato
              </li>
            </ul>
          </div>

          <div className="pt-6 flex items-center justify-between text-xs font-bold text-[#0284C7] group-hover:translate-x-1 transition-transform">
            <span>Acessar</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>

        {/* Card 2: Vídeo para Áudio */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white rounded-3xl border border-[#E2E8F0] hover:border-[#0284C7]/50 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group cursor-pointer transition-all"
          onClick={() => onNavigate("videoToAudio")}
          id="card-extract-audio"
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#E0F2FE] rounded-2xl border border-[#BAE6FD] text-[#0284C7] inline-block group-hover:scale-105 transition-transform">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-1.5 group-hover:text-[#0284C7] transition-colors">
                <span>Vídeo para Áudio</span>
              </h3>
              <p className="text-xs text-[#475569] mt-1.5 leading-relaxed font-medium">
                Extraia o áudio de vídeos MP4, MOV, M4V e WebM e baixe em MP3 ou WAV.
              </p>
            </div>
            <ul className="text-[11px] text-[#475569] space-y-1.5 pt-2 font-medium">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                MP3 ou WAV
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Escolha de qualidade
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Download na hora
              </li>
            </ul>
          </div>

          <div className="pt-6 flex items-center justify-between text-xs font-bold text-[#0284C7] group-hover:translate-x-1 transition-transform">
            <span>Acessar</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>

        {/* Card 3: Excel para PDF (DOCUMENTOS) */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white rounded-3xl border border-[#E2E8F0] hover:border-[#0284C7]/50 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group cursor-pointer transition-all"
          onClick={() => onNavigate("/documento/excel-para-pdf")}
          id="card-excel-to-pdf-home"
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#E0F2FE] rounded-2xl border border-[#BAE6FD] text-[#0284C7] inline-block group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-block px-2.5 py-0.5 bg-[#E0F2FE] text-[#0284C7] font-bold text-[9px] rounded-full uppercase tracking-wider mb-1">
                Novo
              </div>
              <h3 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-1.5 group-hover:text-[#0284C7] transition-colors">
                <span>Excel para PDF</span>
              </h3>
              <p className="text-xs text-[#475569] mt-1.5 leading-relaxed font-medium">
                Converta planilhas Excel em PDF, escolha as abas e ajuste a impressão sem cortes.
              </p>
            </div>
            <ul className="text-[11px] text-[#475569] space-y-1.5 pt-2 font-medium">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                XLSX, XLS e CSV
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Ajuste automático de colunas
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Múltiplas abas
              </li>
            </ul>
          </div>

          <div className="pt-6 flex items-center justify-between text-xs font-bold text-[#0284C7] group-hover:translate-x-1 transition-transform">
            <span>Converter Excel</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>

        {/* Card 4: Ferramentas PDF */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white rounded-3xl border border-[#E2E8F0] hover:border-[#0284C7]/50 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group cursor-pointer transition-all"
          onClick={() => onNavigate("pdf")}
          id="card-pdf-tools"
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#E0F2FE] rounded-2xl border border-[#BAE6FD] text-[#0284C7] inline-block group-hover:scale-105 transition-transform">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-1.5 group-hover:text-[#0284C7] transition-colors">
                <span>Ferramentas PDF Grátis</span>
              </h3>
              <p className="text-xs text-[#475569] mt-1.5 leading-relaxed font-medium">
                Junte, organize, gire, exclua páginas e compacte seus arquivos PDF.
              </p>
            </div>
            <ul className="text-[11px] text-[#475569] space-y-1.5 pt-2 font-medium">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Juntar PDFs
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Organizar páginas
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Extrair texto de PDF
              </li>
            </ul>
          </div>

          <div className="pt-6 flex items-center justify-between text-xs font-bold text-[#0284C7] group-hover:translate-x-1 transition-transform">
            <span>Acessar</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>
      </div>

      {/* Info Warning */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center justify-center space-x-3 max-w-3xl mx-auto text-center shadow-xs" id="local-security-card">
        <ShieldCheck className="h-5 w-5 text-[#0284C7] shrink-0" id="info-icon" />
        <p className="text-xs text-[#475569] font-medium leading-relaxed" id="security-disclaimer">
          Não guardamos seus arquivos. Ao fechar ou atualizar a página, o conteúdo da conversão é descartado.
        </p>
      </div>
    </div>
  );
}
