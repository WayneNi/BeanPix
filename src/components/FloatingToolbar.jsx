export function FloatingToolbar({
  isEditMode,
  onToggleEditMode,
  isEraseMode,
  onToggleEraseMode,
  onColorReplace,
  onUndo,
  canUndo,
}) {
  if (!isEditMode) {
    return (
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
        <button
          onClick={onToggleEditMode}
          className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-600"
        >
          手动编辑模式
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 shadow-xl border border-stone-200">
      <button
        onClick={onToggleEraseMode}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
          isEraseMode ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
        }`}
      >
        {isEraseMode ? '🧹 擦除中' : '🧹 擦除'}
      </button>
      <button
        onClick={onColorReplace}
        className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200"
      >
        🎨 颜色替换
      </button>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 disabled:opacity-30"
      >
        ↩ 撤销
      </button>
      <div className="mx-1 h-5 w-px bg-stone-200" />
      <button
        onClick={onToggleEditMode}
        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
      >
        退出编辑
      </button>
    </div>
  );
}
