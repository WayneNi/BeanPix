import { useState, useMemo } from 'react';
import { buildFullPalette } from '../utils/colorSystemUtils';

const STORAGE_KEY = 'beanpix_custom_palette';

export function loadCustomPalette() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveCustomPalette(palette) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(palette));
}

export function CustomPaletteEditor({ currentColorSystem, onApply, onClose }) {
  const fullPalette = useMemo(() => buildFullPalette(currentColorSystem), [currentColorSystem]);
  const [selected, setSelected] = useState(() => {
    const existing = loadCustomPalette();
    return existing ? new Set(existing.map((c) => c.hex)) : new Set(fullPalette.map((c) => c.hex));
  });

  const toggle = (hex) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(hex)) next.delete(hex);
      else next.add(hex);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(fullPalette.map((c) => c.hex)));
  const clearAll = () => setSelected(new Set());

  const handleApply = () => {
    const palette = fullPalette.filter((c) => selected.has(c.hex));
    saveCustomPalette(palette);
    onApply(palette);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">自定义色板</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">✕</button>
        </div>

        <div className="mb-3 flex gap-2">
          <button onClick={selectAll} className="rounded-lg bg-stone-100 px-3 py-1 text-xs text-stone-600 hover:bg-stone-200">
            全选
          </button>
          <button onClick={clearAll} className="rounded-lg bg-stone-100 px-3 py-1 text-xs text-stone-600 hover:bg-stone-200">
            清空
          </button>
          <span className="ml-auto text-xs text-stone-400">
            已选 {selected.size} / {fullPalette.length} 色
          </span>
        </div>

        <div className="grid max-h-[50vh] grid-cols-12 gap-1 overflow-y-auto rounded-lg border border-stone-200 p-2">
          {fullPalette.map((c) => (
            <button
              key={c.hex} type="button"
              onClick={() => toggle(c.hex)}
              title={`${c.key} ${c.hex}`}
              className={`flex h-8 w-8 items-center justify-center rounded border text-[6px] transition ${
                selected.has(c.hex) ? 'border-2 border-amber-500 ring-1 ring-amber-200' : 'border-stone-200 opacity-40'
              }`}
              style={{ backgroundColor: c.hex, color: getLumaFn(c.hex) > 0.5 ? '#000' : '#FFF' }}
            >
              {selected.has(c.hex) ? c.key : ''}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600">取消</button>
          <button onClick={handleApply} disabled={selected.size === 0}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
            应用色板 ({selected.size} 色)
          </button>
        </div>
      </div>
    </div>
  );
}

function getLumaFn(hex) {
  if (!hex || hex.length < 7) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
