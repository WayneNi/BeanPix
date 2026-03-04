import { useState } from 'react';
import { downloadImage, exportCsvData } from '../utils/imageDownloader';

export function DownloadSettingsModal({ mappedPixelData, gridDimensions, colorSystem, onClose }) {
  const [settings, setSettings] = useState({
    cellSize: 30,
    showGrid: true,
    showCoords: true,
    showKeys: true,
    showStats: true,
    title: '拼豆图纸',
    gridLineWidth: 1,
  });

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const handleDownloadPNG = () => {
    downloadImage(mappedPixelData, gridDimensions, { ...settings, colorSystem });
    onClose();
  };

  const handleDownloadCSV = () => {
    exportCsvData(mappedPixelData, gridDimensions, colorSystem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">下载设置</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">✕</button>
        </div>

        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-stone-500">图纸标题</label>
            <input
              type="text" value={settings.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">
              格子大小：<span className="font-semibold">{settings.cellSize}px</span>
            </label>
            <input
              type="range" min="10" max="60" step="2"
              value={settings.cellSize} onChange={(e) => update('cellSize', Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">
              网格线粗细：<span className="font-semibold">{settings.gridLineWidth}px</span>
            </label>
            <input
              type="range" min="0.5" max="3" step="0.5"
              value={settings.gridLineWidth} onChange={(e) => update('gridLineWidth', Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-stone-600">
            {[
              { key: 'showGrid', label: '网格线' },
              { key: 'showCoords', label: '坐标轴' },
              { key: 'showKeys', label: '色号标注' },
              { key: 'showStats', label: '统计区域' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1">
                <input type="checkbox" checked={settings[key]} onChange={(e) => update(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={handleDownloadCSV} className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50">
            导出 CSV
          </button>
          <button onClick={handleDownloadPNG} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
            下载 PNG
          </button>
        </div>
      </div>
    </div>
  );
}
