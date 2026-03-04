import { useMemo } from 'react';
import { sortColorsByHue } from '../utils/colorSystemUtils';

export function ColorPanel({
  colorCounts,
  totalCount,
  excludedKeys,
  onToggleExclude,
  colorSystem,
}) {
  const sortedColors = useMemo(() => {
    if (!colorCounts) return [];
    const arr = Object.entries(colorCounts).map(([hex, data]) => ({
      hex,
      key: data.key,
      color: data.color || hex,
      count: data.count,
    }));
    return sortColorsByHue(arr);
  }, [colorCounts]);

  if (!colorCounts || sortedColors.length === 0) {
    return (
      <div className="rounded-xl bg-white p-4 text-center text-xs text-stone-400 shadow-sm">
        暂无颜色数据，请先生成图纸
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-stone-700">
        颜色统计 <span className="font-normal text-stone-400">({sortedColors.length} 色 · {totalCount} 粒)</span>
      </h3>
      <div className="max-h-[50vh] overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-stone-100 text-stone-400">
              <th className="pb-1 text-left font-normal">色号</th>
              <th className="pb-1 text-left font-normal">颜色</th>
              <th className="pb-1 text-right font-normal">数量</th>
            </tr>
          </thead>
          <tbody>
            {sortedColors.map((c) => {
              const isExcluded = excludedKeys?.has(c.key);
              return (
                <tr
                  key={c.hex}
                  onClick={() => onToggleExclude?.(c.key, c.hex)}
                  className={`cursor-pointer border-b border-stone-50 transition hover:bg-stone-50 ${isExcluded ? 'opacity-30 line-through' : ''}`}
                >
                  <td className="py-1 font-mono">{c.key}</td>
                  <td className="py-1">
                    <span
                      className="mr-1 inline-block h-3 w-3 rounded border border-stone-200"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-stone-400">{c.hex}</span>
                  </td>
                  <td className="py-1 text-right font-mono">{c.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
