export function GridTooltip({ data }) {
  if (!data || !data.cell || data.cell.isExternal) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg"
      style={{ left: data.clientX + 12, top: data.clientY + 12 }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-4 w-4 rounded border border-stone-300"
          style={{ backgroundColor: data.cell.color }}
        />
        <span className="font-mono font-semibold">{data.cell.key}</span>
        <span className="text-stone-400">{data.cell.color}</span>
      </div>
      <div className="mt-0.5 text-stone-400">
        行 {data.j + 1} · 列 {data.i + 1}
      </div>
    </div>
  );
}
