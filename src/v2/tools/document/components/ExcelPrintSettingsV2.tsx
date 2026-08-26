import React from "react";
import {
  PrintSettings,
  PageSizeOption,
  OrientationOption,
  MarginOption,
  ScalingModeOption,
  calculateSmartSettings
} from "../../../../utils/document/excelPrintSettings";
import { ParsedSheet } from "../../../../services/document/excelReaderService";
import { Sliders, Sparkles, Layout, Maximize2 } from "lucide-react";

interface ExcelPrintSettingsV2Props {
  settings: PrintSettings;
  onChange: (updatedSettings: PrintSettings) => void;
  activeSheet?: ParsedSheet;
}

export const ExcelPrintSettingsV2: React.FC<ExcelPrintSettingsV2Props> = ({
  settings,
  onChange,
  activeSheet
}) => {
  const smartSuggestion = activeSheet ? calculateSmartSettings(activeSheet, settings.pageSize, settings.margin) : null;

  const applySmartSettings = () => {
    if (!smartSuggestion) return;
    onChange({
      ...settings,
      orientation: smartSuggestion.suggestedOrientation,
      scalingMode: smartSuggestion.suggestedScalingMode,
      repeatHeader: {
        ...settings.repeatHeader,
        enabled: smartSuggestion.suggestedRepeatHeader
      }
    });
  };

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <Sliders className="h-5 w-5 text-[#0284C7]" />
          <h4 className="font-display font-bold text-sm sm:text-base text-[#0F172A]">
            Configurações de Impressão & Layout PDF
          </h4>
        </div>

        {smartSuggestion && (
          <button
            type="button"
            onClick={applySmartSettings}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Aplicar Ajuste Inteligente</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orientation */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
            <Layout className="h-3.5 w-3.5 text-[#0284C7]" />
            Orientação
          </label>
          <select
            value={settings.orientation}
            onChange={(e) => updateSetting("orientation", e.target.value as OrientationOption)}
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#0284C7]"
          >
            <option value="auto">Automático (Detectar)</option>
            <option value="portrait">Retrato (Vertical)</option>
            <option value="landscape">Paisagem (Horizontal)</option>
          </select>
        </div>

        {/* Page Size */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0F172A]">
            Tamanho da Página
          </label>
          <select
            value={settings.pageSize}
            onChange={(e) => updateSetting("pageSize", e.target.value as PageSizeOption)}
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#0284C7]"
          >
            <option value="A4">A4 (Padrão)</option>
            <option value="Carta">Carta (Letter)</option>
            <option value="Oficio">Ofício (Legal)</option>
            <option value="A3">A3</option>
          </select>
        </div>

        {/* Scaling Mode */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5 text-[#0284C7]" />
            Ajuste de Escala
          </label>
          <select
            value={settings.scalingMode}
            onChange={(e) => updateSetting("scalingMode", e.target.value as ScalingModeOption)}
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#0284C7]"
          >
            <option value="fit_columns">Ajustar Todas Colunas na Largura</option>
            <option value="fit_sheet">Ajustar Planilha Inteira em 1 Página</option>
            <option value="real">Tamanho Real (Sem Escala)</option>
          </select>
        </div>

        {/* Margins */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0F172A]">
            Margens do Documento
          </label>
          <select
            value={settings.margin}
            onChange={(e) => updateSetting("margin", e.target.value as MarginOption)}
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#0284C7]"
          >
            <option value="small">Estreita (8mm) - Mais espaço</option>
            <option value="normal">Normal (15mm) - Padrão</option>
            <option value="large">Larga (25mm)</option>
          </select>
        </div>
      </div>

      {/* Checkbox Options */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-[#E2E8F0]">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.repeatHeader.enabled}
            onChange={(e) =>
              updateSetting("repeatHeader", {
                ...settings.repeatHeader,
                enabled: e.target.checked
              })
            }
            className="rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]"
          />
          <span className="text-xs font-semibold text-[#475569]">
            Repetir linha de cabeçalho em todas as páginas
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.headerFooter.enabled && settings.headerFooter.showPageNumber}
            onChange={(e) =>
              updateSetting("headerFooter", {
                ...settings.headerFooter,
                enabled: true,
                showPageNumber: e.target.checked
              })
            }
            className="rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]"
          />
          <span className="text-xs font-semibold text-[#475569]">
            Inserir numeração de página no rodapé
          </span>
        </label>
      </div>
    </div>
  );
};
