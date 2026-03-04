import { useState, useMemo } from 'react';

export function FloatingColorPalette({ palette, selectedColor, onSelectColor, colorSystem }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return palette;
    const q = search.toLowerCase();
    return palette.filter((c) => c.key.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q));
  }, [palette, search]);

  return (
    <div className="fixed right-4 top-1/2 z-40 w-48 -translate-y-1/2 rounded-xl border border-stone-200 bg-white p-3 shadow-xl">
      <h4 className="mb-2 text-xs font-semibold text-stone-600">选择颜色</h4>
      <input
        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索色号…"
        className="mb-2 w-full rounded-lg border border-stone-200 px-2 py-1 text-xs"
      />
      <div className="grid max-h-60 grid-cols-6 gap-1 overflow-y-auto">
        {filtered.map((c) => (
          <button
            key={c.hex} type="button"
            onClick={() => onSelectColor(c)}
            title={`${c.key} ${c.hex}`}
            className={`h-6 w-6 rounded border transition ${
              selectedColor?.hex === c.hex
                ? 'border-2 border-amber-500 ring-2 ring-amber-200'
                : 'border-stone-200 hover:border-stone-400'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
      {selectedColor && (
        <div className="mt-2 flex items-center gap-2 border-t border-stone-100 pt-2 text-xs text-stone-500">
          <span className="h-4 w-4 rounded border" style={{ backgroundColor: selectedColor.hex }} />
          <span className="font-mono">{selectedColor.key}</span>
        </div>
      )}
    </div>
  );
}
