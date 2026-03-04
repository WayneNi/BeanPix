import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { recalculateColorStats } from '../utils/pixelation';

export function FocusMode({ mappedPixelData, gridDimensions, colorSystem, onExit }) {
  const { N, M } = gridDimensions;
  const canvasRef = useRef(null);
  const [completed, setCompleted] = useState(() => Array.from({ length: M }, () => new Array(N).fill(false)));
  const [highlightColor, setHighlightColor] = useState(null);
  const [totalCompleted, setTotalCompleted] = useState(0);

  const { colorCounts, totalCount } = useMemo(() => recalculateColorStats(mappedPixelData), [mappedPixelData]);
  const colorList = useMemo(() => {
    return Object.entries(colorCounts)
      .map(([hex, data]) => ({ hex, key: data.key, count: data.count }))
      .sort((a, b) => b.count - a.count);
  }, [colorCounts]);

  const totalNonExternal = totalCount;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = Math.max(8, Math.min(28, Math.floor(Math.min(800 / N, 600 / M))));
    canvas.width = N * cellSize;
    canvas.height = M * cellSize;
    const ctx = canvas.getContext('2d');

    for (let j = 0; j < M; j++) {
      for (let i = 0; i < N; i++) {
        const cell = mappedPixelData[j][i];
        if (cell.isExternal) {
          ctx.fillStyle = '#F5F5F5';
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          continue;
        }

        if (completed[j][i]) {
          ctx.fillStyle = cell.color;
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#00FF00';
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          ctx.globalAlpha = 1;
        } else if (highlightColor && cell.color.toUpperCase() === highlightColor.toUpperCase()) {
          ctx.fillStyle = cell.color;
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          ctx.strokeRect(i * cellSize + 1, j * cellSize + 1, cellSize - 2, cellSize - 2);
        } else {
          ctx.fillStyle = highlightColor ? '#E0E0E0' : cell.color;
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }, [mappedPixelData, N, M, completed, highlightColor]);

  useEffect(() => { draw(); }, [draw]);

  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cellSize = canvas.width / N;
    const i = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width / cellSize);
    const j = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height / (canvas.height / M));
    if (i >= 0 && i < N && j >= 0 && j < M && !mappedPixelData[j][i].isExternal) {
      setCompleted((prev) => {
        const next = prev.map((row) => [...row]);
        next[j][i] = !next[j][i];
        let count = 0;
        for (const r of next) for (const c of r) if (c) count++;
        setTotalCompleted(count);
        return next;
      });
    }
  }, [N, M, mappedPixelData]);

  const completePct = totalNonExternal > 0 ? Math.round((totalCompleted / totalNonExternal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-100">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div>
          <h2 className="text-lg font-bold text-stone-800">专心拼豆模式</h2>
          <p className="text-xs text-stone-400">点击格子标记已完成 · 点击右侧颜色高亮引导</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-stone-600">
            进度：<span className="font-bold text-amber-600">{completePct}%</span>
            <span className="ml-1 text-stone-400">({totalCompleted}/{totalNonExternal})</span>
          </div>
          <button onClick={onExit} className="rounded-lg bg-stone-200 px-4 py-1.5 text-sm text-stone-700 hover:bg-stone-300">
            退出
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 mb-4">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${completePct}%` }} />
          </div>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-pointer rounded border border-stone-200"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <aside className="w-56 overflow-y-auto border-l bg-white p-3">
          <h3 className="mb-2 text-sm font-semibold text-stone-700">颜色引导</h3>
          <button
            onClick={() => setHighlightColor(null)}
            className={`mb-2 w-full rounded-lg border px-2 py-1 text-left text-xs ${
              !highlightColor ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-500'
            }`}
          >
            显示全部
          </button>
          {colorList.map((c) => (
            <button
              key={c.hex}
              onClick={() => setHighlightColor(highlightColor === c.hex ? null : c.hex)}
              className={`mb-1 flex w-full items-center gap-2 rounded-lg border px-2 py-1 text-left text-xs transition ${
                highlightColor === c.hex
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-stone-100 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span className="h-3 w-3 rounded border border-stone-200" style={{ backgroundColor: c.hex }} />
              <span className="font-mono">{c.key}</span>
              <span className="ml-auto text-stone-400">{c.count}</span>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
