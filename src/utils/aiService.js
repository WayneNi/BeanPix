const DEFAULT_PROMPT = '图片修改为：chibi画风，背景白底。pixel art style, 16-bit, retro game aesthetic, sharp focus, high contrast, clean lines, detailed pixel art, masterpiece, best quality';

function resizeImage(img, maxW = 2048, maxH = 2048) {
  const canvas = document.createElement('canvas');
  let w = img.width, h = img.height;
  if (w > maxW || h > maxH) {
    const ratio = Math.min(maxW / w, maxH / h);
    w = Math.floor(w * ratio);
    h = Math.floor(h * ratio);
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function canvasToBase64(canvas, maxSizeKB = 4096) {
  let base64 = canvas.toDataURL('image/png');
  let sizeKB = Math.round((base64.length * 3) / 4 / 1024);
  if (sizeKB > maxSizeKB) {
    let quality = 0.9;
    while (sizeKB > maxSizeKB && quality > 0.3) {
      base64 = canvas.toDataURL('image/jpeg', quality);
      sizeKB = Math.round((base64.length * 3) / 4 / 1024);
      quality -= 0.1;
    }
  }
  if (sizeKB > maxSizeKB) {
    const scale = Math.sqrt(maxSizeKB / sizeKB) * 0.9;
    const nc = document.createElement('canvas');
    nc.width = Math.floor(canvas.width * scale);
    nc.height = Math.floor(canvas.height * scale);
    const nctx = nc.getContext('2d');
    nctx.imageSmoothingEnabled = true;
    nctx.imageSmoothingQuality = 'high';
    nctx.drawImage(canvas, 0, 0, nc.width, nc.height);
    return canvasToBase64(nc, maxSizeKB);
  }
  return base64;
}

export function imageToBase64(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = resizeImage(img, 2048, 2048);
        resolve(canvasToBase64(canvas, 4096));
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}

export async function optimizeImageWithAI(imageSrc, options = {}) {
  try {
    const { customPrompt, onProgress } = options;
    onProgress?.(10);
    const base64 = await imageToBase64(imageSrc);
    onProgress?.(30);

    const res = await fetch('/api/ai-optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, prompt: customPrompt || DEFAULT_PROMPT }),
    });
    onProgress?.(80);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `API error: ${res.status}`);
    }
    const result = await res.json();
    onProgress?.(100);
    if (result.success && result.imageUrl) return { success: true, imageUrl: result.imageUrl };
    throw new Error(result.error || 'Unknown error');
  } catch (err) {
    return { success: false, error: err.message || 'AI optimization failed' };
  }
}

export async function downloadImageAsDataURL(imageUrl) {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Convert failed'));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export { DEFAULT_PROMPT };
