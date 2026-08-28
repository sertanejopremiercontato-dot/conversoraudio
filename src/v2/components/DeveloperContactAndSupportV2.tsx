import React, { useState } from "react";
import { useSupportQrV2 } from "../config/useSupportQrV2";
import { 
  Mail, 
  Send, 
  Sparkles, 
  Heart, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Lightbulb, 
  Bug, 
  Handshake, 
  MessageSquare,
  QrCode,
  ShieldCheck,
  Loader2
} from "lucide-react";

export const DeveloperContactAndSupportV2: React.FC = () => {
  const { supportQr } = useSupportQrV2();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactType, setContactType] = useState("Sugerir nova ferramenta");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const contactOptions = [
    { value: "Sugerir nova ferramenta", label: "Sugerir nova ferramenta", icon: <Lightbulb className="w-4 h-4 text-[#1D68F2]" /> },
    { value: "Relatar um problema", label: "Relatar um problema", icon: <Bug className="w-4 h-4 text-[#EF4444]" /> },
    { value: "Dúvida", label: "Dúvida", icon: <HelpCircle className="w-4 h-4 text-[#F59E0B]" /> },
    { value: "Sugestão", label: "Sugestão", icon: <MessageSquare className="w-4 h-4 text-[#10B981]" /> },
    { value: "Parceria", label: "Parceria", icon: <Handshake className="w-4 h-4 text-[#8B5CF6]" /> },
    { value: "Outro", label: "Outro", icon: <Mail className="w-4 h-4 text-[#64748B]" /> }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !subject.trim() || !message.trim()) {
      setStatus("error");
      setFeedbackMessage("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    setStatus("loading");
    setFeedbackMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          type: contactType,
          subject: subject.trim(),
          message: message.trim(),
          honeypot: honeypot.trim(),
          page: "Como Funciona"
        })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.ok) {
        setStatus("success");
        setFeedbackMessage(data.message || "Mensagem enviada com sucesso! Obrigado pelo contato.");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setHoneypot("");
      } else {
        setStatus("error");
        setFeedbackMessage(data?.message || "Não foi possível enviar sua mensagem agora. Tente novamente em alguns instantes.");
      }
    } catch {
      setStatus("error");
      setFeedbackMessage("Não foi possível enviar sua mensagem agora. Tente novamente em alguns instantes.");
    }
  };

  const isSuggestingTool = contactType === "Sugerir nova ferramenta";

  return (
    <section className="space-y-6 pt-2 pb-6" id="contato">
      {/* Header da Seção */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1D68F2]/10 border border-[#BFDBFE] text-[#1D68F2] text-[11px] font-extrabold tracking-wider uppercase shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CANAL DIRETO</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F44] tracking-tight">
          Fale com o Desenvolvedor
        </h2>

        <p className="text-xs sm:text-sm text-[#5C6F84] font-medium leading-relaxed max-w-2xl mx-auto">
          Tem uma sugestão, encontrou algum problema ou gostaria de ver uma nova ferramenta no Conversor Audio? Envie sua mensagem.
        </p>
      </div>

      {/* Grid 2 Colunas: Esquerda (Formulário) | Direita (Apoio) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ========================================================
            COLUNA ESQUERDA: CONTATO E SUGESTÕES (lg:col-span-7)
           ======================================================== */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-[24px] md:rounded-[28px] p-6 sm:p-8 shadow-[0_2px_16px_rgba(11,31,68,0.03)] space-y-6">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1D68F2]">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0B1F44]">
                  Contato e Sugestões
                </h3>
                <p className="text-xs text-[#5C6F84]">
                  Sua mensagem será respondida o mais breve possível
                </p>
              </div>
            </div>
          </div>

          {/* Destaque para Pedir Nova Ferramenta */}
          {isSuggestingTool && (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 flex items-start gap-3 text-left">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#BFDBFE] flex items-center justify-center text-[#1D68F2] shrink-0 mt-0.5 shadow-2xs">
                <Lightbulb className="w-4 h-4 text-[#1D68F2]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#1E40AF]">
                  Não encontrou a ferramenta que precisa?
                </h4>
                <p className="text-xs text-[#1D4ED8] leading-relaxed">
                  Conte para nós o que gostaria de ver por aqui e como gostaria que funcionasse.
                </p>
              </div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Honeypot invisível para proteção anti-spam */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website-hp">Não preencha este campo:</label>
              <input
                id="website-hp"
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Nome e E-mail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0B1F44]">
                  Nome <span className="text-[#94A3B8] font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#1D68F2] focus:ring-2 focus:ring-[#1D68F2]/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0B1F44]">
                  Seu E-mail <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#1D68F2] focus:ring-2 focus:ring-[#1D68F2]/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Tipo de Contato */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0B1F44]">
                Tipo de Contato <span className="text-[#EF4444]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {contactOptions.map((opt) => {
                  const isSelected = contactType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setContactType(opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer text-left ${
                        isSelected
                          ? "bg-[#EFF6FF] border-[#1D68F2] text-[#1D68F2] shadow-2xs"
                          : "bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white hover:border-[#CBD5E1]"
                      }`}
                    >
                      {opt.icon}
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assunto */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0B1F44]">
                Assunto <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isSuggestingTool ? "Qual ferramenta você gostaria de sugerir?" : "Resumo do contato"}
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#1D68F2] focus:ring-2 focus:ring-[#1D68F2]/20 outline-none transition-all"
              />
            </div>

            {/* Mensagem */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0B1F44]">
                Mensagem <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isSuggestingTool
                    ? "Conte qual ferramenta você gostaria de encontrar no Conversor Audio e explique como gostaria que ela funcionasse."
                    : "Escreva detalhadamente sua mensagem..."
                }
                maxLength={5000}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#1D68F2] focus:ring-2 focus:ring-[#1D68F2]/20 outline-none transition-all resize-y"
              />
              <div className="flex justify-between items-center text-[11px] text-[#94A3B8]">
                <span>Privacidade garantida. Nenhum dado é repassado a terceiros.</span>
                <span>{message.length}/5000</span>
              </div>
            </div>

            {/* Mensagens de Feedback */}
            {status === "success" && (
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-[#065F46] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            {status === "error" && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-[#991B1B] font-bold">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3.5 rounded-xl bg-[#1D68F2] hover:bg-[#1554C7] disabled:bg-[#94A3B8] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(29,104,242,0.3)] hover:shadow-[0_6px_20px_rgba(29,104,242,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Mensagem</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ========================================================
            COLUNA DIREITA: AJUDE O DESENVOLVEDOR (lg:col-span-5)
           ======================================================== */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-[24px] md:rounded-[28px] p-6 sm:p-8 shadow-[0_2px_16px_rgba(11,31,68,0.03)] space-y-5 text-center">
          
          {/* Header do Card */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#EF4444]/15 to-[#F43F5E]/15 border border-[#FECDD3] flex items-center justify-center text-[#E11D48] shadow-2xs">
              <Heart className="w-6 h-6 fill-[#E11D48]" />
            </div>
            
            <h3 className="text-lg font-black text-[#0B1F44] tracking-tight">
              Ajude o Desenvolvedor
            </h3>

            <p className="text-xs text-[#5C6F84] leading-relaxed max-w-sm">
              O Conversor Audio é desenvolvido e mantido continuamente. Se as ferramentas foram úteis para você, seu apoio ajuda a manter o projeto online e desenvolver novos recursos.
            </p>
          </div>

          {/* Destaques de Contribuição */}
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-3.5 space-y-1 text-center">
            <p className="text-xs font-black text-[#92400E]">
              Contribua com qualquer valor.
            </p>
            <p className="text-[11.5px] text-[#B45309]">
              Todo apoio ajuda no desenvolvimento de novas ferramentas.
            </p>
          </div>

          {/* Área do QR Code Oficial */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
            {/* QR Container */}
            <div className="w-44 h-44 bg-white border border-[#CBD5E1] rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-xs overflow-hidden">
              {supportQr.supportQrUrl ? (
                <img
                  src={supportQr.supportQrUrl}
                  alt="QR Code de Apoio ao Desenvolvedor"
                  className="w-full h-full object-contain rounded-xl"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full border border-dashed border-[#94A3B8] rounded-xl flex flex-col items-center justify-center p-3 text-center bg-[#FAFAFA]">
                  <QrCode className="w-12 h-12 text-[#94A3B8] stroke-1 mb-1.5" />
                  <span className="text-[11px] font-bold text-[#64748B] leading-tight">
                    QR Code de apoio será disponibilizado em breve.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-0.5 text-center">
              <p className="text-xs font-bold text-[#0B1F44]">
                Escaneie o QR Code para apoiar o projeto.
              </p>
              <p className="text-[11px] text-[#64748B]">
                Contribua com o valor que desejar.
              </p>
            </div>
          </div>

          {/* Selo de Segurança */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#059669]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Doação 100% direta e voluntária</span>
          </div>

        </div>

      </div>
    </section>
  );
};
