import { paletteOptions } from '../config/colorPalette';
import { colorSystemOptions } from '../utils/colorSystemUtils';
import { PixelationMode } from '../utils/pixelation';

export function SettingsPanel({
  hasImage,
  originalImageUrl,
  onFileUpload,
  granularity,
  onGranularityChange,
  pixelationMode,
  onPixelationModeChange,
  paletteId,
  onPaletteChange,
  colorSystem,
  onColorSystemChange,
  similarityThreshold,
  onSimilarityThresholdChange,
  onAutoRemoveBg,
  onProcessImage,
  processing,
  onAiOptimize,
  onCropImage,
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-stone-700">上传图片</h3>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-6 transition hover:border-amber-500 hover:bg-amber-50">
          <input type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
          {originalImageUrl ? (
            <img src={originalImageUrl} alt="原图" className="max-h-32 rounded object-contain" />
          ) : (
            <>
              <span className="mb-1 text-3xl">📷</span>
              <span className="text-xs text-stone-500">点击或拖拽上传 JPG / PNG</span>
            </>
          )}
        </label>
      </div>

      {hasImage && (
        <>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-stone-700">解析设置</h3>

            <label className="mb-2 block text-xs text-stone-500">
              粒度（横向格数）：<span className="font-semibold text-amber-600">{granularity}</span>
            </label>
            <input
              type="range" min="8" max="80" step="1"
              value={granularity} onChange={(e) => onGranularityChange(Number(e.target.value))}
              className="mb-3 w-full accent-amber-500"
            />

            <label className="mb-1 block text-xs text-stone-500">解析模式</label>
            <div className="mb-3 flex gap-2">
              {[
                { value: PixelationMode.Dominant, label: '卡通模式' },
                { value: PixelationMode.Average, label: '真实模式' },
              ].map((opt) => (
                <button
                  key={opt.value} type="button"
                  onClick={() => onPixelationModeChange(opt.value)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition ${
                    pixelationMode === opt.value
                      ? 'border-amber-500 bg-amber-50 font-semibold text-amber-700'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label className="mb-1 block text-xs text-stone-500">
              颜色合并阈值：<span className="font-semibold text-amber-600">{similarityThreshold}</span>
            </label>
            <input
              type="range" min="0" max="100" step="1"
              value={similarityThreshold}
              onChange={(e) => onSimilarityThresholdChange(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-stone-700">色板选择</h3>
            <div className="mb-3 space-y-1">
              {paletteOptions.map((opt) => (
                <button
                  key={opt.id} type="button"
                  onClick={() => onPaletteChange(opt.id)}
                  className={`block w-full rounded-lg border px-3 py-1.5 text-left text-xs transition ${
                    paletteId === opt.id
                      ? 'border-amber-500 bg-amber-50 font-semibold text-amber-700'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
            <label className="mb-1 block text-xs text-stone-500">色号系统</label>
            <select
              value={colorSystem} onChange={(e) => onColorSystemChange(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs"
            >
              {colorSystemOptions.map((s) => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button" onClick={onProcessImage} disabled={processing}
              className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-amber-600 disabled:opacity-50"
            >
              {processing ? '处理中…' : '生成拼豆图纸'}
            </button>
            <button
              type="button" onClick={onAutoRemoveBg}
              className="w-full rounded-xl border border-stone-300 bg-white py-2 text-xs text-stone-600 transition hover:bg-stone-50"
            >
              一键去背景
            </button>
            {onCropImage && (
              <button
                type="button" onClick={onCropImage}
                className="w-full rounded-xl border border-stone-300 bg-white py-2 text-xs text-stone-600 transition hover:bg-stone-50"
              >
                裁剪图片
              </button>
            )}
            {onAiOptimize && (
              <button
                type="button" onClick={onAiOptimize}
                className="w-full rounded-xl border border-purple-300 bg-purple-50 py-2 text-xs text-purple-700 transition hover:bg-purple-100"
              >
                AI 优化图片
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
