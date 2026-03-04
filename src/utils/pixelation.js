export const TRANSPARENT_KEY = 'ERASE';

export const transparentColorData = {
  key: TRANSPARENT_KEY,
  color: '#FFFFFF',
  isExternal: true,
};

export const PixelationMode = {
  Dominant: 'dominant',
  Average: 'average',
};

export function colorDistance(rgb1, rgb2) {
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function findClosestPaletteColor(targetRgb, palette) {
  if (!palette || palette.length === 0) {
    return { key: 'ERR', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } };
  }
  let minDist = Infinity;
  let closest = palette[0];
  for (const pc of palette) {
    const d = colorDistance(targetRgb, pc.rgb);
    if (d < minDist) {
      minDist = d;
      closest = pc;
    }
    if (d === 0) break;
  }
  return closest;
}

function calculateCellColor(imageData, startX, startY, width, height, mode) {
  const data = imageData.data;
  const imgW = imageData.width;
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  const colorCounts = {};
  let dominantRgb = null;
  let maxCount = 0;

  const endX = startX + width;
  const endY = startY + height;

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (y * imgW + x) * 4;
      if (data[idx + 3] < 128) continue;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      count++;
      if (mode === PixelationMode.Average) {
        rSum += r; gSum += g; bSum += b;
      } else {
        const ck = `${r},${g},${b}`;
        colorCounts[ck] = (colorCounts[ck] || 0) + 1;
        if (colorCounts[ck] > maxCount) {
          maxCount = colorCounts[ck];
          dominantRgb = { r, g, b };
        }
      }
    }
  }
  if (count === 0) return null;
  if (mode === PixelationMode.Average) {
    return { r: Math.round(rSum / count), g: Math.round(gSum / count), b: Math.round(bSum / count) };
  }
  return dominantRgb;
}

export function calculatePixelGrid(ctx, imgWidth, imgHeight, N, M, palette, mode) {
  const fallback = palette.find((p) => p.hex === '#FEFFFF' || p.hex === '#FFFFFF') || palette[0];
  const grid = Array.from({ length: M }, () =>
    Array.from({ length: N }, () => ({ key: fallback.key, color: fallback.hex }))
  );
  const cellW = imgWidth / N;
  const cellH = imgHeight / M;

  let fullData;
  try {
    fullData = ctx.getImageData(0, 0, imgWidth, imgHeight);
  } catch {
    return grid;
  }

  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const sx = Math.floor(i * cellW);
      const sy = Math.floor(j * cellH);
      const ex = Math.min(imgWidth, Math.ceil((i + 1) * cellW));
      const ey = Math.min(imgHeight, Math.ceil((j + 1) * cellH));
      const cw = Math.max(1, ex - sx);
      const ch = Math.max(1, ey - sy);

      const rgb = calculateCellColor(fullData, sx, sy, cw, ch, mode);
      if (rgb) {
        const closest = findClosestPaletteColor(rgb, palette);
        grid[j][i] = { key: closest.key, color: closest.hex };
      } else {
        grid[j][i] = { ...transparentColorData };
      }
    }
  }
  return grid;
}

export function mergeSimilarColors(grid, palette, threshold) {
  if (threshold <= 0) return grid;

  const colorFreq = {};
  for (const row of grid) {
    for (const cell of row) {
      if (!cell.isExternal) {
        colorFreq[cell.color] = (colorFreq[cell.color] || 0) + 1;
      }
    }
  }

  const sorted = Object.entries(colorFreq).sort((a, b) => b[1] - a[1]);
  const mergeMap = {};

  const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
  };

  for (let i = 0; i < sorted.length; i++) {
    const [hexA] = sorted[i];
    if (mergeMap[hexA]) continue;
    const rgbA = hexToRgb(hexA);
    if (!rgbA) continue;

    for (let k = i + 1; k < sorted.length; k++) {
      const [hexB] = sorted[k];
      if (mergeMap[hexB]) continue;
      const rgbB = hexToRgb(hexB);
      if (!rgbB) continue;
      if (colorDistance(rgbA, rgbB) < threshold) {
        mergeMap[hexB] = hexA;
      }
    }
  }

  if (Object.keys(mergeMap).length === 0) return grid;

  const paletteByHex = {};
  for (const p of palette) paletteByHex[p.hex] = p;

  return grid.map((row) =>
    row.map((cell) => {
      if (cell.isExternal) return cell;
      const target = mergeMap[cell.color];
      if (!target) return cell;
      const pc = paletteByHex[target];
      return pc ? { key: pc.key, color: pc.hex } : cell;
    })
  );
}

export function autoRemoveBackground(grid) {
  const M = grid.length;
  if (M === 0) return grid;
  const N = grid[0].length;

  const edgeColors = {};
  const addEdge = (j, i) => {
    const c = grid[j][i];
    if (c && !c.isExternal) edgeColors[c.color] = (edgeColors[c.color] || 0) + 1;
  };
  for (let i = 0; i < N; i++) { addEdge(0, i); addEdge(M - 1, i); }
  for (let j = 0; j < M; j++) { addEdge(j, 0); addEdge(j, N - 1); }

  let bgColor = null, maxCnt = 0;
  for (const [c, cnt] of Object.entries(edgeColors)) {
    if (cnt > maxCnt) { maxCnt = cnt; bgColor = c; }
  }
  if (!bgColor) return grid;

  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  const visited = Array.from({ length: M }, () => new Array(N).fill(false));
  const stack = [];

  for (let i = 0; i < N; i++) {
    if (newGrid[0][i].color === bgColor && !newGrid[0][i].isExternal) stack.push([0, i]);
    if (newGrid[M - 1][i].color === bgColor && !newGrid[M - 1][i].isExternal) stack.push([M - 1, i]);
  }
  for (let j = 1; j < M - 1; j++) {
    if (newGrid[j][0].color === bgColor && !newGrid[j][0].isExternal) stack.push([j, 0]);
    if (newGrid[j][N - 1].color === bgColor && !newGrid[j][N - 1].isExternal) stack.push([j, N - 1]);
  }

  while (stack.length > 0) {
    const [r, c] = stack.pop();
    if (r < 0 || r >= M || c < 0 || c >= N || visited[r][c]) continue;
    const cell = newGrid[r][c];
    if (cell.isExternal || cell.color !== bgColor) continue;
    visited[r][c] = true;
    newGrid[r][c] = { ...transparentColorData };
    stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }

  return newGrid;
}

export function recalculateColorStats(grid) {
  const colorCounts = {};
  let totalCount = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell && !cell.isExternal && cell.key !== TRANSPARENT_KEY) {
        const hex = cell.color.toUpperCase();
        if (!colorCounts[hex]) colorCounts[hex] = { count: 0, color: hex, key: cell.key };
        colorCounts[hex].count++;
        totalCount++;
      }
    }
  }
  return { colorCounts, totalCount };
}
