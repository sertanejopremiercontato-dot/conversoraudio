import React, { useEffect, useState } from "react";
import {
  WatermarkSettings,
  WatermarkType,
  WatermarkPreset,
  DEFAULT_TEXT_CONFIG,
  DEFAULT_LOGO_CONFIG,
  DEFAULT_REPEAT_CONFIG
} from "../../../utils/imageWatermarkPresets";
import { ImageWatermarkPresets } from "./ImageWatermarkPresets";
import { ImageWatermarkTextSettings } from "./ImageWatermarkTextSettings";
import { ImageWatermarkLogoSettings } from "./ImageWatermarkLogoSettings";
import { ImageWatermarkRepeatSettings } from "./ImageWatermarkRepeatSettings";
import { ImageWatermarkPreview } from "./ImageWatermarkPreview";
import { ImageWatermarkBatch, BatchItem } from "./ImageWatermarkBatch";
import {
  Type,
  Image as ImageIcon,
  Grid,
  Shield,
  Crosshair,
  Save,
  Check,
  Play,
  RotateCcw
} from "lucide-react";

interface ImageWatermarkEditorProps {
  batchItems: BatchItem[];
  activeItemId: string | null;
  onSelectItemForPreview: (id: string) => void;
  onToggleItemSelection: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onInvertSelection: () => void;
  onRemoveItem: (id: string) => void;
  onApplyWatermark: (settings: WatermarkSettings) => void;
  isProcessing: boolean;
  progressPercent: number;
}

const MULTICONVERTE_LOCAL_STORAGE_KEY = "multiconverte_watermark_preferences";
const MULTICONVERT_LOCAL_STORAGE_KEY = "multiconvert_watermark_preferences";
const NEW_LOCAL_STORAGE_KEY = "convertauto_watermark_preferences";
const OLD_LOCAL_STORAGE_KEY = "somdrive_watermark_preferences";

export const ImageWatermarkEditor: React.FC<ImageWatermarkEditorProps> = ({
  batchItems,
  activeItemId,
  onSelectItemForPreview,
  onToggleItemSelection,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  onRemoveItem,
  onApplyWatermark,
  isProcessing,
  progressPercent
}) => {
  const activeItem = batchItems.find((i) => i.id === activeItemId) || batchItems[0];

  const [rememberConfig, setRememberConfig] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<WatermarkType>("text");
  const [settings, setSettings] = useState<WatermarkSettings>({
    watermarkType: "text",
    textConfig: DEFAULT_TEXT_CONFIG,
    logoConfig: DEFAULT_LOGO_CONFIG,
    repeatConfig: DEFAULT_REPEAT_CONFIG,
    protectionArea: {
      enabled: false,
      xPercent: 50,
      yPercent: 50,
      radiusPercent: 20
    },
    outputFormat: "original",
    qualitySetting: "max"
  });

  // Load saved preferences if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MULTICONVERTE_LOCAL_STORAGE_KEY) || localStorage.getItem(MULTICONVERT_LOCAL_STORAGE_KEY) || localStorage.getItem(NEW_LOCAL_STORAGE_KEY) || localStorage.getItem(OLD_LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          setSettings((prev) => ({
            ...prev,
            watermarkType: parsed.watermarkType || prev.watermarkType,
            textConfig: { ...prev.textConfig, ...parsed.textConfig },
            repeatConfig: { ...prev.repeatConfig, ...parsed.repeatConfig }
          }));
          setActiveTab(parsed.watermarkType || "text");
          setRememberConfig(true);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save preferences when toggle changes or settings change if active
  const handleRememberToggle = (enabled: boolean) => {
    setRememberConfig(enabled);
    if (enabled) {
      saveToLocalStorage(settings);
    } else {
      try {
        localStorage.removeItem(MULTICONVERTE_LOCAL_STORAGE_KEY);
        localStorage.removeItem(MULTICONVERT_LOCAL_STORAGE_KEY);
        localStorage.removeItem(NEW_LOCAL_STORAGE_KEY);
        localStorage.removeItem(OLD_LOCAL_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }
  };

  const saveToLocalStorage = (s: WatermarkSettings) => {
    try {
      const toSave = {
        watermarkType: s.watermarkType,
        textConfig: {
          text: s.textConfig.text,
          fontFamily: s.textConfig.fontFamily,
          fontSize: s.textConfig.fontSize,
          color: s.textConfig.color,
          opacity: s.textConfig.opacity,
          position: s.textConfig.position,
          hasOutline: s.textConfig.hasOutline,
          hasShadow: s.textConfig.hasShadow,
          hasBg: s.textConfig.hasBg
        },
        repeatConfig: {
          type: s.repeatConfig.type,
          text: s.repeatConfig.text,
          color: s.repeatConfig.color,
          opacity: s.repeatConfig.opacity,
          size: s.repeatConfig.size,
          pattern: s.repeatConfig.pattern
        }
      };
      localStorage.setItem(MULTICONVERTE_LOCAL_STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      // ignore
    }
  };

  const handleSelectPreset = (preset: WatermarkPreset) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        ...preset.settings,
        presetName: preset.id
      };
      if (preset.settings.watermarkType) {
        setActiveTab(preset.settings.watermarkType);
      }
      if (rememberConfig) saveToLocalStorage(updated);
      return updated;
    });
  };

  const updateSettings = (partial: Partial<WatermarkSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      if (rememberConfig) saveToLocalStorage(next);
      return next;
    });
  };

  const selectedCount = batchItems.filter((i) => i.selected).length;

  return (
    <div className="space-y-6">
      {/* Top Presets Bar */}
      <ImageWatermarkPresets
        activePresetId={settings.presetName}
        onSelectPreset={handleSelectPreset}
      />

      {/* Main Grid: Settings Column + Live Preview Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Watermark Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card-main border border-border-main rounded-2xl p-4 md:p-5 space-y-4">
            {/* Watermark Type Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-card-inner border border-border-main rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("text");
                  updateSettings({ watermarkType: "text" });
                }}
                className={`py-2 px-1 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "text"
                    ? "bg-green-primary text-bg-main shadow-sm"
                    : "text-text-sec hover:text-text-main"
                }`}
              >
                <Type className="h-3.5 w-3.5" /> Texto
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("logo");
                  updateSettings({ watermarkType: "logo" });
                }}
                className={`py-2 px-1 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "logo"
                    ? "bg-green-primary text-bg-main shadow-sm"
                    : "text-text-sec hover:text-text-main"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" /> Logotipo
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("repeat");
                  updateSettings({ watermarkType: "repeat" });
                }}
                className={`py-2 px-1 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "repeat"
                    ? "bg-green-primary text-bg-main shadow-sm"
                    : "text-text-sec hover:text-text-main"
                }`}
              >
                <Grid className="h-3.5 w-3.5" /> Repetida
              </button>
            </div>

            {/* Active Tab Settings */}
            {activeTab === "text" && (
              <ImageWatermarkTextSettings
                config={settings.textConfig}
                onChange={(textConfig) => updateSettings({ textConfig })}
              />
            )}

            {activeTab === "logo" && (
              <ImageWatermarkLogoSettings
                config={settings.logoConfig}
                onChange={(logoConfig) => updateSettings({ logoConfig })}
              />
            )}

            {activeTab === "repeat" && (
              <ImageWatermarkRepeatSettings
                config={settings.repeatConfig}
                logoConfig={settings.logoConfig}
                onChange={(repeatConfig) => updateSettings({ repeatConfig })}
              />
            )}

            {/* Feature: Protection Area */}
            <div className="pt-3 border-t border-border-main/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-text-main cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.protectionArea.enabled}
                    onChange={(e) =>
                      updateSettings({
                        protectionArea: {
                          ...settings.protectionArea,
                          enabled: e.target.checked
                        }
                      })
                    }
                    className="rounded accent-green-primary"
                  />
                  <Crosshair className="h-3.5 w-3.5 text-amber-400" />
                  Área de Proteção
                </label>
                {settings.protectionArea.enabled && (
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Ativa
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-muted leading-tight font-medium">
                Posicione a marca sobre uma área importante (rosto, produto, assinatura) para dificultar remoção simples por corte.
              </p>
            </div>

            {/* Output Format & Quality */}
            <div className="pt-3 border-t border-border-main/60 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-sec">Formato de Saída</label>
                  <select
                    value={settings.outputFormat}
                    onChange={(e: any) => updateSettings({ outputFormat: e.target.value })}
                    className="w-full bg-card-inner border border-border-main rounded-xl px-3 py-2 text-xs font-semibold text-text-main focus:outline-none focus:border-green-primary"
                  >
                    <option value="original">Manter Original</option>
                    <option value="JPG">JPG / JPEG</option>
                    <option value="PNG">PNG</option>
                    <option value="WEBP">WEBP</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-sec">Qualidade</label>
                  <select
                    value={settings.qualitySetting}
                    onChange={(e: any) => updateSettings({ qualitySetting: e.target.value })}
                    className="w-full bg-card-inner border border-border-main rounded-xl px-3 py-2 text-xs font-semibold text-text-main focus:outline-none focus:border-green-primary"
                  >
                    <option value="max">Máxima (98%)</option>
                    <option value="high">Alta (92%)</option>
                    <option value="rec">Recomendada (85%)</option>
                  </select>
                </div>
              </div>

              {/* LocalStorage option: "Lembrar minha configuração" */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberConfig}
                    onChange={(e) => handleRememberToggle(e.target.checked)}
                    className="rounded accent-green-primary"
                  />
                  Lembrar minha configuração visual
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Live Preview & Batch List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Live Preview */}
          {activeItem && (
            <div className="bg-card-main border border-border-main rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-text-main uppercase tracking-wider flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-primary" />
                  Prévia em Tempo Real ({activeItem.file.name})
                </h4>
              </div>

              <ImageWatermarkPreview
                imageFile={activeItem.file}
                settings={settings}
                onUpdateProtectionArea={(xPct, yPct) =>
                  updateSettings({
                    protectionArea: {
                      ...settings.protectionArea,
                      xPercent: xPct,
                      yPercent: yPct
                    }
                  })
                }
              />
            </div>
          )}

          {/* Batch Manager */}
          <ImageWatermarkBatch
            items={batchItems}
            activeItemId={activeItemId}
            onSelectItemForPreview={onSelectItemForPreview}
            onToggleItemSelection={onToggleItemSelection}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            onInvertSelection={onInvertSelection}
            onRemoveItem={onRemoveItem}
          />

          {/* Apply Action Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onApplyWatermark(settings)}
              disabled={isProcessing || selectedCount === 0}
              className="w-full py-4 bg-green-primary hover:bg-green-light text-bg-main font-bold text-base rounded-2xl transition-all shadow-lg hover:shadow-green-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="h-5 w-5 fill-bg-main" />
              <span>
                {isProcessing
                  ? `Aplicando marca d'água (${progressPercent}%)...`
                  : `Aplicar Marca d’Água em ${selectedCount} ${
                      selectedCount === 1 ? "imagem" : "imagens"
                    }`}
              </span>
            </button>

            {isProcessing && (
              <div className="w-full bg-card-inner rounded-full h-2 overflow-hidden border border-border-main">
                <div
                  className="bg-green-primary h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
