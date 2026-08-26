import React from "react";
import { Edit3, Eraser, Trash2, Image as ImageIcon, ArrowRight, ShieldCheck } from "lucide-react";

export type ActionMode = "edit" | "clean" | "wipe" | "cover";

interface MetadataActionSelectorProps {
  onSelectAction: (mode: ActionMode) => void;
  hasCover: boolean;
}

export const MetadataActionSelector: React.FC<MetadataActionSelectorProps> = ({
  onSelectAction,
  hasCover
}) => {
  return (
    <div className="w-full bg-card-main border border-border-main rounded-3xl p-6 shadow-lg space-y-5">
      <div className="text-center sm:text-left space-y-1">
        <h3 className="text-xl font-black text-text-main flex items-center justify-center sm:justify-start gap-2">
          <ShieldCheck className="h-5 w-5 text-green-primary" /> O que você deseja fazer com este arquivo?
        </h3>
        <p className="text-xs text-text-sec font-medium">
          Escolha uma das ações abaixo. A edição é configurada em tela antes da etapa de processamento final.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ACTION 1: EDITAR METADADOS */}
        <button
          type="button"
          onClick={() => onSelectAction("edit")}
          className="p-5 rounded-2xl bg-card-inner border border-border-main hover:border-green-primary hover:bg-card-main text-left transition-all duration-200 group flex flex-col justify-between space-y-4 cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-green-primary/10 text-green-primary border border-green-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-text-main group-hover:text-green-primary transition-colors">
                Editar Metadados
              </h4>
              <p className="text-xs text-text-sec mt-1 leading-relaxed">
                Altere título, artista, álbum, ano, gênero, compositor, comentários e mais com formulário preenchido.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-green-primary pt-2 border-t border-border-main/50">
            <span>Editar campos</span> <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* ACTION 2: LIMPAR METADADOS (SELETIVO) */}
        <button
          type="button"
          onClick={() => onSelectAction("clean")}
          className="p-5 rounded-2xl bg-card-inner border border-border-main hover:border-amber-500 hover:bg-card-main text-left transition-all duration-200 group flex flex-col justify-between space-y-4 cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Eraser className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-text-main group-hover:text-amber-500 transition-colors">
                Limpar Metadados Seletivos
              </h4>
              <p className="text-xs text-text-sec mt-1 leading-relaxed">
                Escolha exatamente quais tags sensíveis ou de privacidade deseja apagar (software, ano, ID3 extras).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 pt-2 border-t border-border-main/50">
            <span>Seleção personalizada</span> <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* ACTION 3: LIMPEZA COMPLETA (TOTAL PRIVACY WIPE) */}
        <button
          type="button"
          onClick={() => onSelectAction("wipe")}
          className="p-5 rounded-2xl bg-card-inner border border-border-main hover:border-red-500 hover:bg-card-main text-left transition-all duration-200 group flex flex-col justify-between space-y-4 cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-text-main group-hover:text-red-500 transition-colors">
                Limpeza Completa (1 Clique)
              </h4>
              <p className="text-xs text-text-sec mt-1 leading-relaxed">
                Apague 100% de todos os metadados, comentários e tags de identificação, deixando apenas o áudio puro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 pt-2 border-t border-border-main/50">
            <span>Remover tudo</span> <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* ACTION 4: TROCAR / REMOVER CAPA */}
        <button
          type="button"
          onClick={() => onSelectAction("cover")}
          className="p-5 rounded-2xl bg-card-inner border border-border-main hover:border-blue-500 hover:bg-card-main text-left transition-all duration-200 group flex flex-col justify-between space-y-4 cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-text-main group-hover:text-blue-500 transition-colors">
                {hasCover ? "Trocar ou Remover Capa" : "Adicionar Capa da Música"}
              </h4>
              <p className="text-xs text-text-sec mt-1 leading-relaxed">
                {hasCover
                  ? "Substitua a arte do álbum por uma nova imagem JPG/PNG ou remova a capa para reduzir o arquivo."
                  : "Adicione uma imagem personalizada como capa oficial para o seu arquivo de áudio."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 pt-2 border-t border-border-main/50">
            <span>Gerenciar capa</span> <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
};
