/**
 * 将图片处理成拼豆网格数据
 * 使用块平均采样 + 最近邻映射，保留细节与色彩过渡
 */

import { mapToBeadColor, WHITE_BEAD } from './beadColors';

/**
 * 从图片 URL 生成拼豆网格数据
 * 使用块平均采样：将原图划分为 gridSize×gridSize 块，每块内取平均 RGB 再映射到色卡
 * 相比简单缩放，能保留更好的色彩过渡和轮廓
 *
 * @param {string} imageUrl - 图片的 data URL 或 URL
 * @param {number} gridSize - 网格尺寸（宽高均为 gridSize 个珠子）
 * @returns {Promise<{grid: Array<Array>, colorCounts: Object}>}
 */
export async function processImageToBeadGrid(imageUrl, gridSize) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const w = img.width;
        const h = img.height;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // 关闭默认插值，使用最近邻绘制原图以保持锐度
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        const grid = [];
        const colorCounts = {};

        const blockW = w / gridSize;
        const blockH = h / gridSize;

        for (let gy = 0; gy < gridSize; gy++) {
          const row = [];
          for (let gx = 0; gx < gridSize; gx++) {
            // 当前块在源图中的范围
            const sx = Math.floor(gx * blockW);
            const sy = Math.floor(gy * blockH);
            const ex = Math.min(Math.ceil((gx + 1) * blockW), w);
            const ey = Math.min(Math.ceil((gy + 1) * blockH), h);

            let rSum = 0;
            let gSum = 0;
            let bSum = 0;
            let alphaSum = 0;
            let count = 0;

            // 块内采样（取中心点 + 四角做平均，兼顾细节与抗锯齿）
            const samplePoints = [];
            for (let dy = sy; dy < ey; dy += Math.max(1, Math.floor((ey - sy) / 3))) {
              for (let dx = sx; dx < ex; dx += Math.max(1, Math.floor((ex - sx) / 3))) {
                samplePoints.push({ x: Math.min(dx, w - 1), y: Math.min(dy, h - 1) });
              }
            }
            if (samplePoints.length === 0) {
              samplePoints.push({ x: sx, y: sy });
            }

            for (const p of samplePoints) {
              const i = (p.y * w + p.x) * 4;
              const a = data[i + 3];
              if (a >= 128) {
                rSum += data[i];
                gSum += data[i + 1];
                bSum += data[i + 2];
                alphaSum += a;
                count++;
              }
            }

            let beadColor;
            if (count === 0) {
              beadColor = WHITE_BEAD;
            } else {
              const r = Math.round(rSum / count);
              const g = Math.round(gSum / count);
              const b = Math.round(bSum / count);
              beadColor = mapToBeadColor(r, g, b);
            }

            row.push(beadColor);

            const key = beadColor.code;
            colorCounts[key] = colorCounts[key] || { ...beadColor, count: 0 };
            colorCounts[key].count++;
          }
          grid.push(row);
        }

        resolve({ grid, colorCounts: Object.values(colorCounts) });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = imageUrl;
  });
}
