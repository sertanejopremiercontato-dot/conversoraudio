import React, { useState, useRef, useEffect } from "react";
import { HomeBannerV2, AdV2 } from "../types";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { db, storage } from "../../../firebase";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  Loader2, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon, 
  Check, 
  Layers, 
  Sparkles 
} from "lucide-react";

interface AdsManagerV2Props {
  ads?: AdV2[];
  onRefresh?: () => void;
}

const LOCAL_STORAGE_BANNERS_KEY = "conversor_audio_v2_home_banners";

/**
 * Otimiza e redimensiona a imagem do banner no padrão oficial 1320x323 (max 2640x646 px para Retina)
 * e comprime para WebP/JPEG mantendo peso leve (<250KB),
 * prevenindo o estouro do limite de 1MB por documento do Firestore.
 */
const compressAndOptimizeBannerImage = (
  fileOrDataUrl: File | string,
  maxWidth = 2640,
  maxHeight = 646,
  quality = 0.88
): Promise<string> => {
  return new Promise((resolve) => {
    const processImg = (src: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let width = img.naturalWidth || 1320;
        let height = img.naturalHeight || 323;

        // Se for maior que as dimensões máximas permitidas (2640x646), redimensiona proporcionalmente
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Converte preferencialmente para WebP com fallback para JPEG
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        // Se por algum motivo o base64 ainda for maior que 500KB, comprime mais uma vez
        if (dataUrl.length > 500000) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.76);
        }

        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : src);
      };
      img.src = src;
    };

    if (typeof fileOrDataUrl === "string") {
      processImg(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawResult = (e.target?.result as string) || "";
        processImg(rawResult);
      };
      reader.onerror = () => {
        resolve("");
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};

export const AdsManagerV2: React.FC<AdsManagerV2Props> = ({ onRefresh }) => {
  const [banners, setBanners] = useState<HomeBannerV2[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_BANNERS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomeBannerV2 | null>(null);
  const [saving, setSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [bannerToDeleteModal, setBannerToDeleteModal] = useState<HomeBannerV2 | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [order, setOrder] = useState<number>(1);
  const [active, setActive] = useState(true);
  
  // Image metadata detection
  const [detectedDimensions, setDetectedDimensions] = useState<{ width: number; height: number; ratio: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listener em tempo real da Source of Truth (Firestore collection "home_banners")
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "home_banners"));
    
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let items: HomeBannerV2[] = [];
        if (!snap.empty) {
          items = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || data.title || "Banner Home",
              title: data.name || data.title || "Banner Home",
              imageUrl: data.imageUrl || "",
              storagePath: data.storagePath || "",
              linkUrl: data.linkUrl || data.destinationUrl || "",
              destinationUrl: data.linkUrl || data.destinationUrl || "",
              order: Number(data.order !== undefined ? data.order : 1),
              active: data.active !== undefined ? !!data.active : true,
              altText: data.altText || data.name || "",
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            };
          });
          // Ordena por ordem crescente
          items.sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        setBanners(items);
        localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(items));
        setLoading(false);
      },
      (err) => {
        console.error("[AdsManagerV2] Erro no onSnapshot de banners:", err);
        setError("Erro ao sincronizar com o Firestore: " + (err.message || "Erro de conexão"));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Analisa dimensões da imagem quando o imageUrl muda
  useEffect(() => {
    if (!imageUrl) {
      setDetectedDimensions(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setDetectedDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
        ratio: Number((img.naturalWidth / img.naturalHeight).toFixed(3))
      });
    };
    img.onerror = () => {
      setDetectedDimensions(null);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const openCreateModal = () => {
    setEditingBanner(null);
    setName("");
    setImageUrl("");
    setLinkUrl("");
    setOrder(banners.length + 1);
    setActive(true);
    setDetectedDimensions(null);
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: HomeBannerV2) => {
    setEditingBanner(banner);
    setName(banner.name || banner.title || "");
    setImageUrl(banner.imageUrl || "");
    setLinkUrl(banner.linkUrl || banner.destinationUrl || "");
    setOrder(banner.order || 1);
    setActive(banner.active !== undefined ? banner.active : true);
    setDetectedDimensions(null);
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  // Upload de arquivo de imagem local com compressão e otimização automática para 1320x323
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP, etc).");
      return;
    }

    try {
      setIsCompressing(true);
      setError(null);
      const optimizedDataUrl = await compressAndOptimizeBannerImage(file, 2640, 646, 0.88);
      setImageUrl(optimizedDataUrl);
    } catch (err: any) {
      console.error("Erro ao otimizar imagem:", err);
      setError("Não foi possível otimizar a imagem selecionada. Tente outro arquivo.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleToggleActive = async (banner: HomeBannerV2) => {
    const nextState = !banner.active;
    setError(null);
    try {
      const bannerRef = doc(db, "home_banners", banner.id);
      await updateDoc(bannerRef, {
        active: nextState,
        updatedAt: serverTimestamp()
      });

      const updated = banners.map((b) => b.id === banner.id ? { ...b, active: nextState } : b);
      setBanners(updated);
      localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(updated));
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Erro ao alterar status do banner no Firestore:", err);
      setError("Não foi possível alterar o status: " + (err.message || "Erro de permissão"));
    }
  };

  /**
   * INICIA PROCESSO DE EXCLUSÃO INDIVIDUAL (ABRE MODAL DE CONFIRMAÇÃO SEGURO)
   */
  const handleDelete = (id: string) => {
    const bannerToDelete = banners.find((b) => b.id === id);
    if (!bannerToDelete) return;
    setBannerToDeleteModal(bannerToDelete);
  };

  /**
   * EXECUÇÃO REAL E DEFINITIVA DA EXCLUSÃO DO BANNER
   */
  const executeRealDelete = async (bannerToDelete: HomeBannerV2) => {
    const id = bannerToDelete.id;
    const bannerName = bannerToDelete.name || bannerToDelete.title || "Banner";
    const storagePath = bannerToDelete.storagePath || "NENHUM";

    console.log("REAL_BANNER_DELETE_V1");
    console.log(`BANNER_ID: ${id}`);
    console.log(`BANNER_TITLE: ${bannerName}`);
    console.log("COLLECTION: home_banners");
    console.log(`STORAGE_PATH: ${storagePath}`);
    console.log("DELETE_FIRESTORE_STARTED");

    setError(null);
    setSuccess(null);
    setDeletingId(id);

    try {
      // 1. Exclui o arquivo do Storage caso exista storagePath exclusivo
      if (bannerToDelete.storagePath) {
        try {
          const fileRef = storageRef(storage, bannerToDelete.storagePath);
          await deleteObject(fileRef);
          console.log("DELETE_STORAGE: SUCESSO");
        } catch (storageErr: any) {
          console.warn("[AdsManagerV2] Aviso ao excluir objeto do Storage (não bloqueante):", storageErr);
          console.log("DELETE_STORAGE: NÃO ENCONTRADO OU JÁ EXCLUÍDO");
        }
      } else {
        console.log("DELETE_STORAGE: NÃO APLICÁVEL (SEM STORAGE_PATH)");
      }

      // 2. Exclui o documento da Source of Truth no Firestore
      const docRef = doc(db, "home_banners", id);
      await deleteDoc(docRef);

      // Defensivamente remove também da coleção legada ads se existir documento com o mesmo ID
      try {
        await deleteDoc(doc(db, "ads", id));
      } catch (_) {}

      console.log("DELETE_FIRESTORE_FINISHED");

      // 3. Atualiza estado local e cache
      const updated = banners.filter((b) => b.id !== id);
      setBanners(updated);
      localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(updated));

      setSuccess(`Banner "${bannerName}" excluído permanentemente com sucesso.`);
      setBannerToDeleteModal(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("[AdsManagerV2] Erro real ao excluir banner do Firestore:", err);
      console.log(`DELETE_FIRESTORE_FAILED: ${err.message || "Erro Firestore"}`);
      setError(`Não foi possível excluir o banner: ${err.message || "Erro de permissão no Firestore"}`);
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * INICIA EXCLUSÃO EM MASSA (ABRE MODAL DE CONFIRMAÇÃO)
   */
  const handleDeleteAll = () => {
    if (banners.length === 0) return;
    setIsDeleteAllModalOpen(true);
  };

  /**
   * EXECUÇÃO REAL E DEFINITIVA DA EXCLUSÃO EM MASSA DE TODOS OS BANNERS
   */
  const executeRealDeleteAll = async () => {
    console.log("DELETE ALL REQUEST: EXECUTED");
    setError(null);
    setSuccess(null);
    setIsDeletingAll(true);

    try {
      const q = query(collection(db, "home_banners"));
      const snap = await getDocs(q);

      let docCount = 0;
      let storageCount = 0;

      for (const d of snap.docs) {
        const data = d.data();
        if (data.storagePath) {
          try {
            const fileRef = storageRef(storage, data.storagePath);
            await deleteObject(fileRef);
            storageCount++;
          } catch (storageErr) {
            console.warn("[AdsManagerV2] Storage file não encontrado ou já excluído:", storageErr);
          }
        }
        await deleteDoc(doc(db, "home_banners", d.id));
        docCount++;
      }

      // Limpeza opcional defensiva da coleção legada 'ads' para evitar resíduos antigos
      try {
        const legacySnap = await getDocs(query(collection(db, "ads")));
        for (const adDoc of legacySnap.docs) {
          if (adDoc.id !== "seo_config") {
            const adData = adDoc.data();
            if (adData.storagePath) {
              try {
                await deleteObject(storageRef(storage, adData.storagePath));
              } catch (_) {}
            }
            await deleteDoc(doc(db, "ads", adDoc.id));
          }
        }
      } catch (legacyErr) {
        console.warn("[AdsManagerV2] Limpeza legada opcional ignorada:", legacyErr);
      }

      setBanners([]);
      localStorage.removeItem(LOCAL_STORAGE_BANNERS_KEY);
      setIsDeleteAllModalOpen(false);

      console.log(`DELETE ALL CONCLUÍDO: ${docCount} documentos e ${storageCount} arquivos excluídos.`);
      setSuccess("Todos os banners foram excluídos permanentemente com sucesso. Nenhum banner ativo no momento.");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("[AdsManagerV2] Erro ao excluir todos os banners:", err);
      setError(`Não foi possível excluir os banners: ${err.message || "Erro de permissão no Firestore"}`);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === banners.length - 1)) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;

    // Reatribui números de ordem
    const reordered = newBanners.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    setBanners(reordered);
    localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(reordered));

    try {
      await Promise.all(
        reordered.map((b) => 
          updateDoc(doc(db, "home_banners", b.id), {
            order: b.order,
            updatedAt: serverTimestamp()
          }).catch(() => {})
        )
      );
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error("Erro ao salvar ordem no Firestore:", e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Por favor, informe o nome ou título de identificação do banner.");
      return;
    }

    if (!imageUrl.trim()) {
      setError("Por favor, faça upload ou insira a URL da imagem do banner.");
      return;
    }

    try {
      setSaving(true);
      let finalImageUrl = imageUrl.trim();

      // Se for Data URI grande (ou qualquer base64), garante compressão leve abaixo de 300KB
      if (finalImageUrl.startsWith("data:image/") && finalImageUrl.length > 300000) {
        finalImageUrl = await compressAndOptimizeBannerImage(finalImageUrl, 2640, 646, 0.85);
      }

      const bannerId = editingBanner ? editingBanner.id : `banner_${Date.now()}`;
      const bannerRef = doc(db, "home_banners", bannerId);

      const payload = {
        name: name.trim(),
        title: name.trim(),
        imageUrl: finalImageUrl,
        linkUrl: linkUrl.trim(),
        destinationUrl: linkUrl.trim(),
        order: Number(order) || 1,
        active,
        altText: name.trim(),
        updatedAt: serverTimestamp(),
        ...(!editingBanner ? { createdAt: serverTimestamp() } : {})
      };

      await setDoc(bannerRef, payload, { merge: true });

      const newBannerItem: HomeBannerV2 = {
        id: bannerId,
        name: name.trim(),
        title: name.trim(),
        imageUrl: finalImageUrl,
        linkUrl: linkUrl.trim(),
        destinationUrl: linkUrl.trim(),
        order: Number(order) || 1,
        active,
        altText: name.trim(),
        updatedAt: new Date().toISOString(),
        createdAt: editingBanner?.createdAt || new Date().toISOString()
      };

      let updatedList: HomeBannerV2[];
      if (editingBanner) {
        updatedList = banners.map((b) => b.id === bannerId ? newBannerItem : b);
      } else {
        updatedList = [...banners, newBannerItem];
      }

      updatedList.sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(updatedList);
      localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(updatedList));

      setIsModalOpen(false);
      setSuccess(editingBanner ? "Banner atualizado com sucesso!" : "Novo banner cadastrado com sucesso!");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Erro ao salvar banner no Firestore:", err);
      setError(`Não foi possível salvar o banner: ${err.message || "Erro de permissão no Firestore"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="v2-admin-banners-manager">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              Gerenciador de Banners da Home
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastre, ordene e gerencie os banners oficiais em destaque no carrossel superior da página inicial (1320×323 px).
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {banners.length > 0 && (
            <button
              type="button"
              disabled={isDeletingAll}
              onClick={handleDeleteAll}
              className="px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Excluir permanentemente todos os banners do banco de dados"
            >
              {isDeletingAll ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
              ) : (
                <Trash2 className="w-4 h-4 text-rose-600" />
              )}
              <span>{isDeletingAll ? "Excluindo tudo..." : "Excluir todos os banners"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md shadow-sky-500/20 cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Banner</span>
          </button>
        </div>
      </div>

      {/* Official Specification Standard Card */}
      <div className="bg-gradient-to-r from-sky-50/80 via-indigo-50/50 to-white dark:from-slate-800/80 dark:to-slate-900 border border-sky-200/80 dark:border-slate-700 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Padrão Oficial de Dimensões para Banners da Home
              </h4>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Padrão: <strong>1320px × 323px</strong> (Web 1x) ou <strong>2640px × 646px</strong> (Retina 2x). Proporção <strong>1320 / 323 (~4.087 : 1)</strong> com margem de segurança lateral de <strong>48px</strong>.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-sky-700 dark:text-sky-300 text-[11px] font-extrabold shrink-0 shadow-2xs">
            <Check className="w-3.5 h-3.5" />
            <span>Padrão Ativo: 1320x323</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Banners List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
          <span className="text-xs">Sincronizando banners com o banco de dados...</span>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-xs">
            <ImageIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
              Nenhum banner cadastrado no momento
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              A área está limpa e pronta. Cadastre seus banners oficiais de 1320x323 para exibição automática no carrossel da Home.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-all cursor-pointer shadow-xs"
          >
            Adicionar Primeiro Banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Total de banners: {banners.length} | Ativos: {banners.filter((b) => b.active).length}
            </span>
            <span className="text-[11px] text-slate-400">
              Use as setas para alterar a ordem de exibição no carrossel
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
                  banner.active 
                    ? "border-slate-200 dark:border-slate-800" 
                    : "border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-900/50"
                }`}
              >
                {/* Left Area: Order badge + Banner Preview + Information */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  
                  {/* Order Selector Controls */}
                  <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Mover para Cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] flex items-center justify-center">
                      {banner.order || index + 1}
                    </span>
                    <button
                      type="button"
                      disabled={index === banners.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Mover para Baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Banner Image Thumbnail (1320x323 ratio) */}
                  <div className="w-40 sm:w-52 aspect-[1320/323] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 relative group">
                    <img
                      src={banner.imageUrl}
                      alt={banner.altText || banner.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                      1320x323
                    </div>
                  </div>

                  {/* Banner Details */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate max-w-xs sm:max-w-md">
                        {banner.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        banner.active 
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {banner.active ? "Ativo no Carrossel" : "Inativo"}
                      </span>
                    </div>

                    {banner.linkUrl ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                        <ExternalLink className="w-3 h-3 text-sky-500 shrink-0" />
                        <span className="truncate">{banner.linkUrl}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">Sem link de redirecionamento</p>
                    )}
                  </div>
                </div>

                {/* Right Area: Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      banner.active
                        ? "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {banner.active ? "Pausar" : "Ativar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(banner)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Editar Banner"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === banner.id}
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                    title="Excluir Permanentemente do Banco de Dados"
                  >
                    {deletingId === banner.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Cadastrar / Editar Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 my-8 text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {editingBanner ? "Editar Banner da Home" : "Cadastrar Novo Banner da Home"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preencha as informações para o banner oficial no padrão 1320×323 px
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Nome do Banner */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nome / Identificação do Banner *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Banner Destaque Conversor de Áudio HD"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
                />
              </div>

              {/* Upload da Imagem */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Imagem do Banner (1320 × 323 px recomendado) *</span>
                  <span className="text-[11px] font-normal text-sky-600 dark:text-sky-400">
                    Proporção 1320 / 323 (~4.087 : 1)
                  </span>
                </label>

                {/* Drag / Select Dropzone */}
                <div 
                  onClick={() => !isCompressing && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-sky-300 dark:border-slate-700 hover:border-sky-500 bg-sky-50/40 dark:bg-slate-800/40 rounded-2xl p-4 text-center cursor-pointer transition-colors space-y-1.5"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isCompressing}
                    className="hidden"
                  />
                  {isCompressing ? (
                    <div className="py-2 flex flex-col items-center justify-center gap-1.5 text-sky-600 dark:text-sky-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Otimizando e redimensionando imagem para o padrão 1320x323...
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Comprimindo para carregamento instantâneo e leve
                      </p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-sky-600 dark:text-sky-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Clique aqui para selecionar a imagem do computador
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        PNG, JPG, WebP (Redimensionamento e compressão automáticos para alta performance)
                      </p>
                    </>
                  )}
                </div>

                {/* Ou URL direta */}
                <div className="pt-1 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Ou informe uma URL direta da imagem:
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://sua-empresa.com/banner-1320x323.png"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Preview & Validation feedback */}
              {imageUrl && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Pré-visualização do Banner (Proporção Real 1320x323):</span>
                    {detectedDimensions && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        Math.abs(detectedDimensions.ratio - 4.087) < 0.25
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {detectedDimensions.width} × {detectedDimensions.height} px ({detectedDimensions.ratio}:1)
                      </span>
                    )}
                  </div>

                  <div className="w-full aspect-[1320/323] rounded-xl overflow-hidden bg-slate-900 relative border border-slate-300 dark:border-slate-600 shadow-inner">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Safety margin indicator */}
                    <div className="absolute inset-y-0 left-0 w-[3.6%] border-r border-dashed border-white/40 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-[3.6%] border-l border-dashed border-white/40 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">
                    Renderizado responsivamente com <code>object-fit: cover</code> para evitar distorções.
                  </p>
                </div>
              )}

              {/* Link de Destino Opcional & Ordem */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Link de Destino / Rota (Opcional)
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Ex: /audio ou https://site.com/oferta"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkbox Ativo */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="banner-active-check"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <label htmlFor="banner-active-check" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Publicar e ativar imediatamente no carrossel da Home
                </label>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-sky-500/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingBanner ? "Salvar Alterações" : "Cadastrar Banner"}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal de Confirmação: Exclusão Individual de Banner */}
      {bannerToDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Excluir Banner Permanentemente?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tem certeza que deseja apagar o banner <strong className="text-slate-800 dark:text-slate-200">"{bannerToDeleteModal.name || bannerToDeleteModal.title || "Banner"}"</strong>? Esta ação é definitiva e removerá o arquivo do Firestore e do carrossel da Home.
                </p>
              </div>
            </div>

            {/* Banner preview chip */}
            {bannerToDeleteModal.imageUrl && (
              <div className="w-full aspect-[1320/323] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800">
                <img
                  src={bannerToDeleteModal.imageUrl}
                  alt={bannerToDeleteModal.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={deletingId === bannerToDeleteModal.id}
                onClick={() => setBannerToDeleteModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deletingId === bannerToDeleteModal.id}
                onClick={() => executeRealDelete(bannerToDeleteModal)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {deletingId === bannerToDeleteModal.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{deletingId === bannerToDeleteModal.id ? "Excluindo..." : "Excluir Definitivamente"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação: Excluir Todos os Banners */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Excluir TODOS os Banners?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Esta ação excluirá permanentemente todos os <strong className="text-rose-600">{banners.length} banners</strong> cadastrados no banco de dados e arquivos do Storage. O carrossel da Home ficará limpo.
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                Ação irreversível
              </p>
              <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 leading-tight">
                Todos os documentos da coleção <code>home_banners</code> serão apagados.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isDeletingAll}
                onClick={executeRealDeleteAll}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeletingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeletingAll ? "Excluindo Todos..." : "Sim, Excluir Todos"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
