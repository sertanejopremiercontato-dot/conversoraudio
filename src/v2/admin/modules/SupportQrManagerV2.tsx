import React, { useState, useEffect, useRef } from "react";
import { 
  QrCode, 
  Upload, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  Heart,
  ImageIcon
} from "lucide-react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../firebase";

export interface SupportQrData {
  supportQrUrl: string;
  supportQrStoragePath?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const SupportQrManagerV2: React.FC = () => {
  const [qrData, setQrData] = useState<SupportQrData>({
    supportQrUrl: "",
    supportQrStoragePath: "",
    updatedAt: "",
    updatedBy: ""
  });

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Escuta em tempo real o documento site_settings/support
  useEffect(() => {
    setLoading(true);
    const docRef = doc(db, "site_settings", "support");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setQrData({
            supportQrUrl: data.supportQrUrl || "",
            supportQrStoragePath: data.supportQrStoragePath || "",
            updatedAt: data.updatedAt || "",
            updatedBy: data.updatedBy || ""
          });
        } else {
          setQrData({
            supportQrUrl: "",
            supportQrStoragePath: "",
            updatedAt: "",
            updatedBy: ""
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("[SupportQrManagerV2] Erro ao carregar QR Code do Firestore:", err);
        setError("Não foi possível carregar as configurações do QR Code.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Limpa mensagens após 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Manipula seleção e upload real do arquivo de imagem
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input para permitir selecionar o mesmo arquivo novamente se necessário
    e.target.value = "";

    // Validação de tipo de arquivo
    const validMimes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validMimes.includes(file.type)) {
      setError("Formato inválido. Por favor, envie uma imagem PNG, JPG ou WEBP (preferencialmente PNG).");
      return;
    }

    // Validação de tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. O tamanho máximo permitido é 10 MB.");
      return;
    }

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      // 1. Obter Token de Autenticação do Admin
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Você precisa estar autenticado como administrador para enviar imagens.");
      }

      const idToken = await currentUser.getIdToken(true);

      // 2. Ler arquivo como base64 / Data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Erro ao ler o arquivo selecionado."));
        reader.readAsDataURL(file);
      });

      // 3. Chamar endpoint de upload real do backend (/api/admin/support-qr-upload ou /api/support-qr-upload)
      let uploadResult: { url: string; storagePath: string } | null = null;

      try {
        const res = await fetch("/api/admin/support-qr-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            dataUrl,
            fileName: file.name,
            contentType: file.type
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.url) {
            uploadResult = { url: data.url, storagePath: data.storagePath || "" };
          }
        }
      } catch (uploadErr) {
        console.warn("[SupportQrManagerV2] Erro na rota primária de upload, tentando rota alternativa:", uploadErr);
      }

      // Fallback para rota serverless se a primária falhou
      if (!uploadResult) {
        const fallbackRes = await fetch("/api/support-qr-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            dataUrl,
            fileName: file.name,
            contentType: file.type
          })
        });

        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({}));
          throw new Error(errData.message || "Erro no servidor ao processar o upload do QR Code.");
        }

        const fallbackData = await fallbackRes.json();
        if (!fallbackData.success || !fallbackData.url) {
          throw new Error("Resposta inválida do servidor de upload.");
        }

        uploadResult = { url: fallbackData.url, storagePath: fallbackData.storagePath || "" };
      }

      // 4. Persistir a URL no Firestore `site_settings/support`
      const nowIso = new Date().toISOString();
      const docRef = doc(db, "site_settings", "support");
      
      await setDoc(docRef, {
        supportQrUrl: uploadResult.url,
        supportQrStoragePath: uploadResult.storagePath,
        updatedAt: nowIso,
        updatedBy: currentUser.email || "admin"
      }, { merge: true });

      setSuccess("QR Code de Apoio atualizado com sucesso! A imagem já está visível na página Como Funciona.");
    } catch (err: any) {
      console.error("[SupportQrManagerV2] Erro no upload do QR Code:", err);
      setError(err.message || "Ocorreu um erro ao enviar o QR Code. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  // Remover QR Code
  const handleRemoveQr = async () => {
    setIsDeleteModalOpen(false);
    setError(null);
    setSuccess(null);
    setDeleting(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Você precisa estar autenticado como administrador para remover o QR Code.");
      }

      const idToken = await currentUser.getIdToken(true);
      const currentStoragePath = qrData.supportQrStoragePath;

      // 1. Tenta deletar o arquivo do storage se existir
      if (currentStoragePath && currentStoragePath.startsWith("support/")) {
        try {
          await fetch("/api/ads-delete-object", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({ storagePath: currentStoragePath })
          });
        } catch (delStorageErr) {
          console.warn("[SupportQrManagerV2] Aviso ao excluir objeto do storage:", delStorageErr);
        }
      }

      // 2. Atualiza o documento no Firestore limpando a URL
      const nowIso = new Date().toISOString();
      const docRef = doc(db, "site_settings", "support");

      await setDoc(docRef, {
        supportQrUrl: "",
        supportQrStoragePath: "",
        updatedAt: nowIso,
        updatedBy: currentUser.email || "admin"
      }, { merge: true });

      setSuccess("QR Code de Apoio removido com sucesso. A página Como Funciona agora exibirá a mensagem padrão.");
    } catch (err: any) {
      console.error("[SupportQrManagerV2] Erro ao remover QR Code:", err);
      setError(err.message || "Ocorreu um erro ao remover o QR Code.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6" id="v2-admin-support-qr-section">
      
      {/* Header da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
            <Heart className="w-5 h-5 fill-rose-600 dark:fill-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Ajude o Desenvolvedor
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
                Como Funciona
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gerencie a imagem do QR Code de apoio exibida na página pública Como Funciona.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {loading ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Carregando...</span>
            </div>
          ) : qrData.supportQrUrl ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>QR Ativo</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800/60">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Sem QR configurado</span>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input File Escondido */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Grid Principal: Preview + Ações e Informações */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Coluna Esquerda: Preview da Imagem (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[240px] aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
            {loading ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                <span className="text-xs">Verificando QR Code...</span>
              </div>
            ) : qrData.supportQrUrl ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl p-2 shadow-xs border border-slate-200 dark:border-slate-800 relative">
                <img
                  src={qrData.supportQrUrl}
                  alt="QR Code de Apoio Oficial"
                  className="w-full h-full object-contain rounded-lg"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xs flex flex-col items-center justify-center rounded-xl gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Enviando novo QR...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-3 space-y-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <QrCode className="w-6 h-6 stroke-1" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Nenhum QR Code configurado
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Envie uma imagem para disponibilizar o apoio.
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2.5">
            Preview do QR Code de Apoio
          </p>
        </div>

        {/* Coluna Direita: Controles e Diretrizes (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              QR Code de Apoio
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Esta imagem será exibida na página <strong className="text-slate-700 dark:text-slate-300">Como Funciona</strong>, na seção <strong className="text-slate-700 dark:text-slate-300">Ajude o Desenvolvedor</strong>.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!qrData.supportQrUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || loading}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.99] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando Imagem...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Enviar QR Code</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || deleting || loading}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.99] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Trocando QR...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Trocar QR Code</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={uploading || deleting || loading}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Removendo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Remover QR Code</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Dicas e Requisitos Técnicos */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Especificações Recomendadas</span>
            </div>
            <ul className="text-[11.5px] text-slate-500 dark:text-slate-400 space-y-1 pl-4 list-disc">
              <li><strong>Formatos aceitos:</strong> PNG, JPG, JPEG ou WEBP (recomendamos <strong className="text-slate-700 dark:text-slate-300">PNG</strong> com fundo branco).</li>
              <li><strong>Resolução ideal:</strong> Imagem quadrada (ex: 500x500 px ou 800x800 px) para máxima legibilidade no escaneamento mobile.</li>
              <li><strong>Persistência:</strong> Armazenamento e URL gravados em tempo real no banco e storage.</li>
            </ul>
          </div>

          {/* Informações de Última Modificação */}
          {qrData.updatedAt && (
            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              Última atualização: <strong className="text-slate-600 dark:text-slate-300">{new Date(qrData.updatedAt).toLocaleString("pt-BR")}</strong>
              {qrData.updatedBy && <span> por {qrData.updatedBy}</span>}
            </div>
          )}

        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Remover QR Code de Apoio?
              </h4>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Ao remover o QR Code, a página <strong className="text-slate-900 dark:text-white">Como Funciona</strong> passará a exibir a mensagem padrão: <em>&quot;QR Code de apoio será disponibilizado em breve.&quot;</em> Você pode enviar uma nova imagem a qualquer momento.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRemoveQr}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
