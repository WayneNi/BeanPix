import { useState, useCallback, useMemo, useRef } from 'react';
import { getPalette } from './config/colorPalette';
import {
  calculatePixelGrid,
  mergeSimilarColors,
  autoRemoveBackground,
  recalculateColorStats,
  PixelationMode,
} from './utils/pixelation';
import { paintSinglePixel, floodFillErase, replaceColor } from './utils/pixelEditingUtils';
import { importCsvData } from './utils/imageDownloader';
import { SettingsPanel } from './components/SettingsPanel';
import { PixelatedPreviewCanvas } from './components/PixelatedPreviewCanvas';
import { ColorPanel } from './components/ColorPanel';
import { GridTooltip } from './components/GridTooltip';
import { FloatingToolbar } from './components/FloatingToolbar';
import { FloatingColorPalette } from './components/FloatingColorPalette';
import { AIOptimizeModal } from './components/AIOptimizeModal';
import { ImageCropperModal } from './components/ImageCropperModal';
import { DownloadSettingsModal } from './components/DownloadSettingsModal';
import { MagnifierTool } from './components/MagnifierTool';
import { CustomPaletteEditor } from './components/CustomPaletteEditor';
import { FocusMode } from './components/FocusMode';

function App() {
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [granularity, setGranularity] = useState(32);
  const [pixelationMode, setPixelationMode] = useState(PixelationMode.Dominant);
  const [paletteId, setPaletteId] = useState('full');
  const [colorSystem, setColorSystem] = useState('MARD');
  const [similarityThreshold, setSimilarityThreshold] = useState(15);
  const [mappedPixelData, setMappedPixelData] = useState(null);
  const [gridDimensions, setGridDimensions] = useState(null);
  const [colorCounts, setColorCounts] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [excludedKeys, setExcludedKeys] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const [showGridLines, setShowGridLines] = useState(true);
  const [showColorKeys, setShowColorKeys] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isEraseMode, setIsEraseMode] = useState(false);
  const [selectedEditColor, setSelectedEditColor] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [showCustomPalette, setShowCustomPalette] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [customPalette, setCustomPalette] = useState(null);

  const imgRef = useRef(null);

  const activePalette = useMemo(() => {
    if (customPalette && paletteId === 'custom') return customPalette;
    return getPalette(paletteId, colorSystem);
  }, [paletteId, colorSystem, customPalette]);

  const updateGridAndStats = useCallback((newGrid) => {
    setMappedPixelData(newGrid);
    const stats = recalculateColorStats(newGrid);
    setColorCounts(stats.colorCounts);
    setTotalCount(stats.totalCount);
  }, []);

  const pushUndo = useCallback((grid) => {
    setUndoStack((prev) => [...prev.slice(-20), grid]);
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      updateGridAndStats(last);
      return prev.slice(0, -1);
    });
  }, [updateGridAndStats]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const { grid, dimensions } = importCsvData(ev.target.result);
          setMappedPixelData(grid);
          setGridDimensions(dimensions);
          const stats = recalculateColorStats(grid);
          setColorCounts(stats.colorCounts);
          setTotalCount(stats.totalCount);
          setUndoStack([]);
        } catch (err) {
          alert(`CSV 导入失败: ${err.message}`);
        }
      };
      reader.readAsText(file);
      return;
    }
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setOriginalImageUrl(ev.target.result);
      setMappedPixelData(null);
      setGridDimensions(null);
      setColorCounts(null);
      setUndoStack([]);
      setIsEditMode(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAiApply = useCallback((dataUrl) => {
    setOriginalImageUrl(dataUrl);
    setShowAiModal(false);
    setMappedPixelData(null);
  }, []);

  const handleCropApply = useCallback((dataUrl) => {
    setOriginalImageUrl(dataUrl);
    setShowCropModal(false);
    setMappedPixelData(null);
  }, []);

  const handleCustomPaletteApply = useCallback((palette) => {
    setCustomPalette(palette);
    setPaletteId('custom');
    setShowCustomPalette(false);
  }, []);

  const processImage = useCallback(
    (imgSrc) => {
      const src = imgSrc || originalImageUrl;
      if (!src) return;
      setProcessing(true);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgRef.current = img;
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const N = granularity;
        const M = Math.max(1, Math.round((img.height / img.width) * N));

        let filteredPalette = activePalette;
        if (excludedKeys.size > 0) {
          filteredPalette = activePalette.filter((c) => !excludedKeys.has(c.key));
        }
        if (filteredPalette.length === 0) filteredPalette = activePalette;

        let grid = calculatePixelGrid(ctx, img.width, img.height, N, M, filteredPalette, pixelationMode);
        grid = mergeSimilarColors(grid, filteredPalette, similarityThreshold);

        setMappedPixelData(grid);
        setGridDimensions({ N, M });
        const stats = recalculateColorStats(grid);
        setColorCounts(stats.colorCounts);
        setTotalCount(stats.totalCount);
        setUndoStack([]);
        setProcessing(false);
      };
      img.onerror = () => setProcessing(false);
      img.src = src;
    },
    [originalImageUrl, granularity, pixelationMode, activePalette, similarityThreshold, excludedKeys]
  );

  const handleAutoRemoveBg = useCallback(() => {
    if (!mappedPixelData) return;
    pushUndo(mappedPixelData);
    updateGridAndStats(autoRemoveBackground(mappedPixelData));
  }, [mappedPixelData, pushUndo, updateGridAndStats]);

  const handleToggleExclude = useCallback((key) => {
    setExcludedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleCellClick = useCallback(
    (data) => {
      if (!isEditMode || !mappedPixelData || !gridDimensions || !data) return;
      pushUndo(mappedPixelData);

      if (isEraseMode) {
        const cell = data.cell;
        if (cell && !cell.isExternal) {
          const newGrid = floodFillErase(mappedPixelData, gridDimensions, data.j, data.i, cell.key);
          updateGridAndStats(newGrid);
        }
      } else if (selectedEditColor) {
        const { newPixelData, hasChange } = paintSinglePixel(
          mappedPixelData, data.j, data.i,
          { key: selectedEditColor.key, color: selectedEditColor.hex, isExternal: false }
        );
        if (hasChange) updateGridAndStats(newPixelData);
      }
    },
    [isEditMode, isEraseMode, selectedEditColor, mappedPixelData, gridDimensions, pushUndo, updateGridAndStats]
  );

  const handleColorReplace = useCallback(() => {
    if (!mappedPixelData || !gridDimensions) return;
    const srcHex = prompt('请输入要替换的颜色HEX值（如 #FF0000）:');
    const tgtHex = prompt('请输入目标颜色HEX值:');
    if (!srcHex || !tgtHex) return;

    const srcPc = activePalette.find((p) => p.hex.toUpperCase() === srcHex.toUpperCase());
    const tgtPc = activePalette.find((p) => p.hex.toUpperCase() === tgtHex.toUpperCase());
    if (!srcPc || !tgtPc) { alert('未在当前色板中找到该颜色'); return; }

    pushUndo(mappedPixelData);
    const { newPixelData, replaceCount } = replaceColor(
      mappedPixelData, gridDimensions,
      { key: srcPc.key, color: srcPc.hex },
      { key: tgtPc.key, color: tgtPc.hex }
    );
    updateGridAndStats(newPixelData);
    alert(`已替换 ${replaceCount} 个像素`);
  }, [mappedPixelData, gridDimensions, activePalette, pushUndo, updateGridAndStats]);

  if (showFocusMode && mappedPixelData && gridDimensions) {
    return (
      <FocusMode
        mappedPixelData={mappedPixelData}
        gridDimensions={gridDimensions}
        colorSystem={colorSystem}
        onExit={() => setShowFocusMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-800">拼豆图纸生成器</h1>
            <p className="text-xs text-stone-400">上传图片 → 智能像素化 → 导出拼豆图纸</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mappedPixelData && (
              <>
                <label className="flex items-center gap-1 text-xs text-stone-500">
                  <input type="checkbox" checked={showGridLines} onChange={(e) => setShowGridLines(e.target.checked)} />
                  网格线
                </label>
                <label className="flex items-center gap-1 text-xs text-stone-500">
                  <input type="checkbox" checked={showColorKeys} onChange={(e) => setShowColorKeys(e.target.checked)} />
                  色号
                </label>
                <label className="flex items-center gap-1 text-xs text-stone-500">
                  <input type="checkbox" checked={showMagnifier} onChange={(e) => setShowMagnifier(e.target.checked)} />
                  放大镜
                </label>
                <button onClick={() => setShowDownloadModal(true)} className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600">
                  下载图纸
                </button>
                <button onClick={() => setShowFocusMode(true)} className="rounded-lg border border-green-400 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100">
                  专心拼豆
                </button>
                <button onClick={() => setShowCustomPalette(true)} className="rounded-lg border border-stone-300 px-3 py-1 text-xs text-stone-600 hover:bg-stone-50">
                  自定义色板
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl gap-4 p-4">
        <aside className="w-64 flex-shrink-0">
          <SettingsPanel
            hasImage={!!originalImageUrl}
            originalImageUrl={originalImageUrl}
            onFileUpload={handleFileUpload}
            granularity={granularity}
            onGranularityChange={setGranularity}
            pixelationMode={pixelationMode}
            onPixelationModeChange={setPixelationMode}
            paletteId={paletteId}
            onPaletteChange={setPaletteId}
            colorSystem={colorSystem}
            onColorSystemChange={setColorSystem}
            similarityThreshold={similarityThreshold}
            onSimilarityThresholdChange={setSimilarityThreshold}
            onAutoRemoveBg={handleAutoRemoveBg}
            onProcessImage={() => processImage()}
            processing={processing}
            onAiOptimize={() => setShowAiModal(true)}
            onCropImage={() => setShowCropModal(true)}
          />
        </aside>

        <section className="flex-1">
          {!mappedPixelData && !processing && (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl bg-white shadow-sm">
              <p className="text-sm text-stone-400">
                {originalImageUrl ? '调整参数后点击「生成拼豆图纸」' : '请先上传一张图片（支持 JPG/PNG/CSV）'}
              </p>
            </div>
          )}
          {processing && (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl bg-white shadow-sm">
              <div className="text-center">
                <div className="mb-2 text-2xl animate-pulse">⏳</div>
                <p className="text-sm text-stone-500">正在处理图像…</p>
              </div>
            </div>
          )}
          {mappedPixelData && !processing && (
            <div className="overflow-auto rounded-xl bg-white p-4 shadow-sm">
              <PixelatedPreviewCanvas
                mappedPixelData={mappedPixelData}
                gridDimensions={gridDimensions}
                showGridLines={showGridLines}
                showColorKeys={showColorKeys}
                onCellHover={setTooltipData}
                onCellClick={handleCellClick}
                colorSystem={colorSystem}
              />
            </div>
          )}
        </section>

        <aside className="w-64 flex-shrink-0">
          <ColorPanel
            colorCounts={colorCounts}
            totalCount={totalCount}
            excludedKeys={excludedKeys}
            onToggleExclude={handleToggleExclude}
            colorSystem={colorSystem}
          />
        </aside>
      </main>

      <GridTooltip data={tooltipData} />

      {showMagnifier && (
        <MagnifierTool
          mappedPixelData={mappedPixelData}
          gridDimensions={gridDimensions}
          visible={showMagnifier && !!tooltipData}
          position={tooltipData}
          colorSystem={colorSystem}
        />
      )}

      {mappedPixelData && (
        <FloatingToolbar
          isEditMode={isEditMode}
          onToggleEditMode={() => { setIsEditMode((v) => !v); setIsEraseMode(false); }}
          isEraseMode={isEraseMode}
          onToggleEraseMode={() => setIsEraseMode((v) => !v)}
          onColorReplace={handleColorReplace}
          onUndo={handleUndo}
          canUndo={undoStack.length > 0}
        />
      )}

      {isEditMode && (
        <FloatingColorPalette
          palette={activePalette}
          selectedColor={selectedEditColor}
          onSelectColor={setSelectedEditColor}
          colorSystem={colorSystem}
        />
      )}

      {showAiModal && originalImageUrl && (
        <AIOptimizeModal imageSrc={originalImageUrl} onApply={handleAiApply} onClose={() => setShowAiModal(false)} />
      )}
      {showCropModal && originalImageUrl && (
        <ImageCropperModal imageSrc={originalImageUrl} onCrop={handleCropApply} onClose={() => setShowCropModal(false)} />
      )}
      {showDownloadModal && mappedPixelData && (
        <DownloadSettingsModal
          mappedPixelData={mappedPixelData}
          gridDimensions={gridDimensions}
          colorSystem={colorSystem}
          onClose={() => setShowDownloadModal(false)}
        />
      )}
      {showCustomPalette && (
        <CustomPaletteEditor
          currentColorSystem={colorSystem}
          onApply={handleCustomPaletteApply}
          onClose={() => setShowCustomPalette(false)}
        />
      )}

      <footer className="border-t border-stone-200 bg-white px-4 py-3 text-center text-xs text-stone-400">
        拼豆图纸生成器 BeanPix · React + Vite + Tailwind CSS
      </footer>
    </div>
  );
}

export default App;
