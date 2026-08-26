import React, { useState } from "react";
import { Lock, ShieldCheck, Zap, Download, Check, AlertCircle, QrCode, CreditCard, Sparkles } from "lucide-react";
import { AudioMetadataModel } from "../../../types/audioMetadata";

interface MetadataPaymentModalProps {
  model: AudioMetadataModel;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

export const MetadataPaymentModal: React.FC<MetadataPaymentModalProps> = ({
  model,
  onPaymentSuccess,
  onClose
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"pix" | "card">("pix");

  const handleConfirmAndPay = () => {
    setIsProcessingPayment(true);
    // Simulate payment authorization/verification
    setTimeout(() => {
      setIsProcessingPayment(false);
      onPaymentSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-card-main border border-border-main rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 overflow-hidden">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-green-primary/10 border border-green-primary/20 text-green-primary flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6" />
          </div>

          <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-green-primary/20 text-green-primary px-3 py-1 rounded-full border border-green-primary/30">
            ETAPA FINAL DE LIBERAÇÃO
          </span>

          <h3 className="text-xl font-black text-text-main">
            Liberar Download do Áudio Processado
          </h3>

          <p className="text-xs text-text-sec">
            Sua edição de metadados está pronta. Conclua o acesso para gerar o arquivo final sem perdas.
          </p>
        </div>

        {/* Selected File Summary Card */}
        <div className="p-4 rounded-2xl bg-card-inner border border-border-main space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-text-main">
            <span className="truncate max-w-[220px]">{model.filename}</span>
            <span className="text-green-primary font-black uppercase">{model.format}</span>
          </div>
          <div className="text-[11px] text-text-sec flex items-center justify-between">
            <span>Tamanho original: {(model.filesize / (1024 * 1024)).toFixed(2)} MB</span>
            <span className="text-green-primary font-bold">Sem recompresso</span>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="space-y-3">
          <label className="block text-xs font-black text-text-main uppercase tracking-wider">
            Escolha a forma de liberação:
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMethod("pix")}
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-extrabold transition-all cursor-pointer ${
                selectedMethod === "pix"
                  ? "bg-green-primary/10 border-green-primary text-green-primary shadow-sm"
                  : "bg-card-inner border-border-main text-text-sec hover:text-text-main"
              }`}
            >
              <QrCode className="h-4 w-4 shrink-0" />
              <span>PIX Instantâneo</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("card")}
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-extrabold transition-all cursor-pointer ${
                selectedMethod === "card"
                  ? "bg-green-primary/10 border-green-primary text-green-primary shadow-sm"
                  : "bg-card-inner border-border-main text-text-sec hover:text-text-main"
              }`}
            >
              <CreditCard className="h-4 w-4 shrink-0" />
              <span>Cartão / Crédito</span>
            </button>
          </div>
        </div>

        {/* Guarantees Box */}
        <div className="p-4 rounded-2xl bg-bg-main border border-border-main space-y-2 text-xs">
          <div className="flex items-center gap-2 text-green-primary font-bold">
            <ShieldCheck className="h-4 w-4" /> 100% Garantia de Auditoria SHA-256
          </div>
          <ul className="space-y-1 text-[11px] text-text-sec font-medium pl-6 list-disc">
            <li>Processamento instantâneo e local no seu navegador.</li>
            <li>Zero alteração na qualidade sonora da música.</li>
            <li>Validação com selo de integridade criptográfico.</li>
          </ul>
        </div>

        {/* Payment Button */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleConfirmAndPay}
            disabled={isProcessingPayment}
            className="w-full py-4 px-6 rounded-2xl bg-green-primary hover:bg-green-light text-bg-main font-black text-sm transition-all shadow-xl shadow-green-primary/30 flex items-center justify-center gap-3 cursor-pointer group"
          >
            {isProcessingPayment ? (
              <>
                <div className="w-5 h-5 border-3 border-bg-main border-t-transparent rounded-full animate-spin"></div>
                <span>Processando Liberação...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Confirmar e Gerar Download do Áudio</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessingPayment}
            className="w-full py-2.5 text-xs font-bold text-text-sec hover:text-text-main transition-colors cursor-pointer text-center"
          >
            Voltar e Alterar Edição
          </button>
        </div>
      </div>
    </div>
  );
};
