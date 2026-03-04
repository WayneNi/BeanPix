import { useState, useRef, useCallback } from 'react';

export function ImageCropperModal({ imageSrc, onCrop, onClose }) {
  const canvasRef = useRef(null);
  const [cropRect, setCropRect] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const imgRef = useRef(null);

  const handleImageLoad = useCallback((e) => {
    imgRef.current = e.target;
  }, []);

  const handleMouseDown = useCallback((e) => {
    const rect = e.target.getBoundingClientRect();
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragging(true);
    setCropRect(null);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !startPos) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropRect({
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      w: Math.abs(x - startPos.x),
      h: Math.abs(y - startPos.y),
    });
  }, [dragging, startPos]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const handleCrop = useCallback(() => {
    if (!cropRect || !imgRef.current) return;
    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const canvas = document.createElement('canvas');
    canvas.width = cropRect.w * scaleX;
    canvas.height = cropRect.h * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img,
      cropRect.x * scaleX, cropRect.y * scaleY, canvas.width, canvas.height,
      0, 0, canvas.width, canvas.height
    );
    onCrop(canvas.toDataURL('image/png'));
  }, [cropRect, onCrop]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">裁剪图片</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">✕</button>
        </div>

        <div className="relative mb-4 inline-block">
          <img
            src={imageSrc} alt="crop"
            onLoad={handleImageLoad}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="max-h-96 max-w-full cursor-crosshair select-none rounded"
            draggable={false}
          />
          {cropRect && (
            <div
              className="pointer-events-none absolute border-2 border-dashed border-amber-500 bg-amber-500/10"
              style={{ left: cropRect.x, top: cropRect.y, width: cropRect.w, height: cropRect.h }}
            />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600">取消</button>
          <button onClick={handleCrop} disabled={!cropRect}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            确认裁剪
          </button>
        </div>
      </div>
    </div>
  );
}
