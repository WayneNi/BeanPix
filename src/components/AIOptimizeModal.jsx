import { useState } from 'react';
import { optimizeImageWithAI, downloadImageAsDataURL, DEFAULT_PROMPT } from '../utils/aiService';

export function AIOptimizeModal({ imageSrc, onApply, onClose }) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [useDefault, setUseDefault] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setResultUrl(null);

    const result = await optimizeImageWithAI(imageSrc, {
      customPrompt: useDefault ? undefined : customPrompt,
      onProgress: setProgress,
    });

    if (result.success && result.imageUrl) {
      try {
        const dataUrl = result.imageUrl.startsWith('data:')
          ? result.imageUrl
          : await downloadImageAsDataURL(result.imageUrl);
        setResultUrl(dataUrl);
      } catch (e) {
        setError('下载AI结果图片失败');
      }
    } else {
      setError(result.error || 'AI 优化失败');
    }
    setLoading(false);
  };

  const handleApply = () => {
    if (resultUrl) onApply(resultUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">AI 优化图片</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">✕</button>
        </div>

        <div className="mb-4">
          <label className="mb-2 flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" checked={useDefault} onChange={() => setUseDefault(!useDefault)} />
            使用默认提示词（chibi + 像素风）
          </label>
          {!useDefault && (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="请输入自定义提示词…"
              className="w-full rounded-lg border border-stone-300 p-2 text-sm"
              rows={3}
            />
          )}
          {useDefault && (
            <p className="rounded-lg bg-stone-50 p-2 text-xs text-stone-400">{DEFAULT_PROMPT}</p>
          )}
        </div>

        {loading && (
          <div className="mb-4">
            <div className="mb-1 text-xs text-stone-500">AI 正在处理… {progress}%</div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-200">
              <div className="h-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && <div className="mb-4 rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</div>}

        {resultUrl && (
          <div className="mb-4">
            <p className="mb-1 text-xs text-stone-500">AI 优化结果：</p>
            <img src={resultUrl} alt="AI result" className="max-h-48 rounded-lg border" />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50">
            取消
          </button>
          {!resultUrl ? (
            <button
              onClick={handleOptimize} disabled={loading}
              className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? '处理中…' : '开始优化'}
            </button>
          ) : (
            <button
              onClick={handleApply}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
            >
              应用结果
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
