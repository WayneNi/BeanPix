import { useState, useCallback, useEffect } from 'react';
import { processImageToBeadGrid } from './utils/imageProcessor';
import { cartoonizeImageWithAI } from './utils/aiClient';

/** 计算 RGB 相对亮度（用于选择文字颜色） */
function getLuminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** 拼豆网格预览（带色号显示） */
function BeadGridPreview({ grid, zoom = 1 }) {
  const cols = grid[0]?.length ?? 0;
  const rows = grid.length;
  const maxPreview = 700;
  const baseCellSize = Math.max(3, Math.min(24, Math.floor(maxPreview / Math.max(cols, rows))));
  const cellSize = Math.round(baseCellSize * zoom);
  const showCode = cellSize >= 10;
  const fontSize = Math.max(5, Math.min(cellSize - 2, 11));
  const fontWeight = cellSize >= 14 ? 'bold' : 'normal';

  return (
    <div
      className="overflow-auto rounded-lg border border-stone-200 bg-stone-50 p-4"
      style={{ maxHeight: '70vh' }}
    >
      <div
        className="inline-grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        }}
      >
        {grid.map((row, y) =>
          row.map((color, x) => {
            const code = color.code ?? '?';
            const luminance = getLuminance(color.r ?? 128, color.g ?? 128, color.b ?? 128);
            const textColor = luminance > 0.5 ? '#1a1a1a' : '#ffffff';
            const textShadow = luminance > 0.5
              ? '0 0 1px #fff, 0 1px 1px #fff'
              : '0 0 1px #000, 0 1px 1px #000';

            return (
              <div
                key={`${y}-${x}`}
                className="flex items-center justify-center overflow-hidden rounded-sm select-none"
                style={{
                  backgroundColor: color.hex,
                  minWidth: cellSize,
                  minHeight: cellSize,
                }}
                title={`${code} ${color.name} - (${x}, ${y})`}
              >
                {showCode && (
                  <span
                    className="leading-none"
                    style={{
                      color: textColor,
                      fontSize: `${fontSize}px`,
                      fontWeight,
                      textShadow,
                      lineHeight: 1,
                    }}
                  >
                    {code}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [cartoonImageUrl, setCartoonImageUrl] = useState(null);
  const [useAICartoon, setUseAICartoon] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [cartoonPrompt, setCartoonPrompt] = useState('');
  const [gridSize, setGridSize] = useState(32);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [beadData, setBeadData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件（支持 JPG、PNG、GIF 等格式）');
      return;
    }

    setError(null);
    setUploadedFile(file);
    setCartoonImageUrl(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const processImage = useCallback(async () => {
    const sourceUrl = useAICartoon ? cartoonImageUrl : imageUrl;
    if (!sourceUrl) return;

    setLoading(true);
    setError(null);
    try {
      const result = await processImageToBeadGrid(sourceUrl, gridSize);
      setBeadData(result);
    } catch (err) {
      setError(err.message || '图片处理失败');
      setBeadData(null);
    } finally {
      setLoading(false);
    }
  }, [imageUrl, cartoonImageUrl, useAICartoon, gridSize]);

  const handleAICartoonize = useCallback(async () => {
    if (!uploadedFile) {
      setError('请先上传照片');
      return;
    }

    setAiLoading(true);
    setError(null);
    try {
      const { imageUrl: generatedUrl } = await cartoonizeImageWithAI({
        file: uploadedFile,
        apiKey,
        prompt: cartoonPrompt,
      });
      setCartoonImageUrl(generatedUrl);
    } catch (err) {
      setCartoonImageUrl(null);
      setError(err.message || 'AI 卡通化失败');
    } finally {
      setAiLoading(false);
    }
  }, [uploadedFile, apiKey, cartoonPrompt]);

  useEffect(() => {
    const sourceUrl = useAICartoon ? cartoonImageUrl : imageUrl;
    if (sourceUrl) {
      processImage();
    } else {
      setBeadData(null);
    }
  }, [imageUrl, cartoonImageUrl, useAICartoon, gridSize, processImage]);

  const colorList = beadData?.colorCounts ?? [];
  const totalBeads = colorList.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-stone-800">拼豆图纸生成器</h1>
        <p className="mt-1 text-stone-600">上传图片，自动生成拼豆色格图与珠子用量清单</p>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        {/* 左侧：上传区域 */}
        <section className="w-full shrink-0 space-y-4 lg:w-64">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-stone-700">上传图片</h2>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-10 transition hover:border-amber-500 hover:bg-amber-50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="mb-2 text-4xl">📷</span>
              <span className="text-center text-sm text-stone-600">
                点击或拖拽上传
              </span>
              <span className="mt-1 text-xs text-stone-500">JPG / PNG / GIF</span>
            </label>

            <div className="mt-4">
              <div className="mb-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={useAICartoon}
                    onChange={(e) => setUseAICartoon(e.target.checked)}
                    className="h-4 w-4 accent-amber-500"
                  />
                  先用 AI 转卡通再生成拼豆图纸
                </label>

                {useAICartoon && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="输入 OpenAI API Key（仅保存在本页内存）"
                      className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
                    />
                    <textarea
                      value={cartoonPrompt}
                      onChange={(e) => setCartoonPrompt(e.target.value)}
                      placeholder="可选：自定义卡通风格提示词"
                      rows={3}
                      className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAICartoonize}
                      disabled={!uploadedFile || aiLoading}
                      className="w-full rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      {aiLoading ? 'AI 正在卡通化…' : '生成 AI 卡通图'}
                    </button>
                  </div>
                )}
              </div>

              <label className="mb-2 block text-sm font-medium text-stone-700">
                网格尺寸（珠子数量）
              </label>
              <input
                type="range"
                min="8"
                max="256"
                step="1"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="mt-1 flex justify-between text-sm text-stone-500">
                <span>8</span>
                <span className="font-semibold text-amber-600">{gridSize} × {gridSize}</span>
                <span>256</span>
              </div>
            </div>
          </div>
        </section>

        {/* 中间：像素格预览 */}
        <section className="flex-1">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-stone-700">拼豆图纸预览</h2>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {loading && (
              <div className="flex min-h-[320px] items-center justify-center text-stone-500">
                正在生成图纸…
              </div>
            )}
            {!loading && beadData && (
              <>
                {useAICartoon && cartoonImageUrl && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm text-stone-600">AI 卡通化结果</p>
                    <img
                      src={cartoonImageUrl}
                      alt="AI卡通图"
                      className="max-h-64 rounded-lg border border-stone-200"
                    />
                  </div>
                )}
                <div className="mb-3 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-stone-600">
                    <span>预览缩放：</span>
                    <select
                      value={previewZoom}
                      onChange={(e) => setPreviewZoom(Number(e.target.value))}
                      className="rounded border border-stone-300 bg-white px-2 py-1 text-stone-700"
                    >
                      <option value={0.5}>0.5×</option>
                      <option value={1}>1×</option>
                      <option value={2}>2×</option>
                      <option value={4}>4×</option>
                    </select>
                  </label>
                  <span className="text-xs text-stone-500">大网格时可放大查看色号</span>
                </div>
                <BeadGridPreview grid={beadData.grid} zoom={previewZoom} />
              </>
            )}
            {!imageUrl && !loading && (
              <div className="flex min-h-[320px] items-center justify-center rounded-lg border-2 border-dashed border-stone-200 text-stone-400">
                请先上传一张图片
              </div>
            )}
            {imageUrl && useAICartoon && !cartoonImageUrl && !loading && !aiLoading && (
              <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-6 text-center text-amber-700">
                已上传原图，请先点击“生成 AI 卡通图”，再自动生成拼豆图纸
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 下方：珠子用量清单 */}
      <section className="mt-6 rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold text-stone-700">珠子用量清单</h2>
        {colorList.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-stone-600">
              共需 <strong className="text-amber-600">{totalBeads}</strong> 颗珠子
            </p>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {colorList
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <div
                    key={item.code}
                    className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3"
                  >
                    <div
                      className="h-8 w-8 shrink-0 rounded-md border border-stone-300"
                      style={{ backgroundColor: item.hex }}
                    />
                    <div>
                      <div className="font-medium text-stone-800">
                        {item.code} {item.name}
                      </div>
                      <div className="text-sm text-stone-500">{item.count} 颗</div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        ) : (
          <p className="text-stone-500">上传图片并生成图纸后，将在此显示每种颜色的珠子用量</p>
        )}
      </section>

      <footer className="mt-8 text-center text-sm text-stone-500">
        拼豆图纸生成器 BeanPix · React + Vite + Tailwind CSS
      </footer>
    </div>
  );
}

export default App;
