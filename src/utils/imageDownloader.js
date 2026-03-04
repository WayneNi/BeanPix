import { getDisplayColorKey } from './colorSystemUtils';

function getLuma(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastColor(hex) {
  return getLuma(hex) > 0.5 ? '#000000' : '#FFFFFF';
}

export function downloadImage(mappedPixelData, gridDimensions, options = {}) {
  const {
    colorSystem = 'MARD',
    cellSize = 30,
    showGrid = true,
    showCoords = true,
    showKeys = true,
    showStats = true,
    title = '拼豆图纸',
    gridLineWidth = 1,
  } = options;

  const { N, M } = gridDimensions;

  const coordMargin = showCoords ? 30 : 0;
  const titleHeight = title ? 40 : 0;

  const colorStats = {};
  let totalBeads = 0;
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const cell = mappedPixelData[j][i];
      if (cell && !cell.isExternal) {
        const hex = cell.color.toUpperCase();
        if (!colorStats[hex]) colorStats[hex] = { hex, key: cell.key, count: 0 };
        colorStats[hex].count++;
        totalBeads++;
      }
    }
  }

  const sortedStats = Object.values(colorStats).sort((a, b) => b.count - a.count);
  const statsPerRow = 4;
  const statsRowH = 22;
  const statsHeight = showStats
    ? 40 + Math.ceil(sortedStats.length / statsPerRow) * statsRowH + 20
    : 0;

  const canvasW = coordMargin + N * cellSize + coordMargin;
  const canvasH = titleHeight + coordMargin + M * cellSize + coordMargin + statsHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasW, canvasH);

  if (title) {
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, canvasW / 2, titleHeight / 2);
  }

  const gridX = coordMargin;
  const gridY = titleHeight + coordMargin;

  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const cell = mappedPixelData[j][i];
      if (!cell || cell.isExternal) {
        ctx.fillStyle = '#F5F5F5';
      } else {
        ctx.fillStyle = cell.color;
      }
      ctx.fillRect(gridX + i * cellSize, gridY + j * cellSize, cellSize, cellSize);
    }
  }

  if (showGrid) {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = gridLineWidth;
    for (let i = 0; i <= N; i++) {
      ctx.beginPath();
      ctx.moveTo(gridX + i * cellSize, gridY);
      ctx.lineTo(gridX + i * cellSize, gridY + M * cellSize);
      ctx.stroke();
    }
    for (let j = 0; j <= M; j++) {
      ctx.beginPath();
      ctx.moveTo(gridX, gridY + j * cellSize);
      ctx.lineTo(gridX + N * cellSize, gridY + j * cellSize);
      ctx.stroke();
    }
  }

  if (showKeys) {
    const fontSize = Math.max(6, Math.floor(cellSize * 0.35));
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < N; i++) {
        const cell = mappedPixelData[j][i];
        if (!cell || cell.isExternal) continue;
        ctx.fillStyle = getContrastColor(cell.color);
        const displayKey = getDisplayColorKey(cell.color, colorSystem);
        ctx.fillText(
          displayKey,
          gridX + i * cellSize + cellSize / 2,
          gridY + j * cellSize + cellSize / 2,
          cellSize - 2
        );
      }
    }
  }

  if (showCoords) {
    ctx.fillStyle = '#666666';
    const coordFont = Math.max(8, Math.floor(coordMargin * 0.4));
    ctx.font = `${coordFont}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < N; i++) {
      const x = gridX + i * cellSize + cellSize / 2;
      ctx.fillText(String(i + 1), x, titleHeight + coordMargin / 2);
      ctx.fillText(String(i + 1), x, gridY + M * cellSize + coordMargin / 2);
    }
    for (let j = 0; j < M; j++) {
      const y = gridY + j * cellSize + cellSize / 2;
      ctx.fillText(String(j + 1), coordMargin / 2, y);
      ctx.fillText(String(j + 1), gridX + N * cellSize + coordMargin / 2, y);
    }
  }

  if (showStats && sortedStats.length > 0) {
    const statsY = gridY + M * cellSize + coordMargin + 10;
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`颜色统计（${sortedStats.length} 色 · ${totalBeads} 粒）`, gridX, statsY + 10);

    const colW = Math.floor((N * cellSize) / statsPerRow);
    sortedStats.forEach((stat, idx) => {
      const col = idx % statsPerRow;
      const row = Math.floor(idx / statsPerRow);
      const sx = gridX + col * colW;
      const sy = statsY + 28 + row * statsRowH;

      ctx.fillStyle = stat.hex;
      ctx.fillRect(sx, sy, 14, 14);
      ctx.strokeStyle = '#CCC';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(sx, sy, 14, 14);

      ctx.fillStyle = '#333';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const displayKey = getDisplayColorKey(stat.hex, colorSystem);
      ctx.fillText(`${displayKey}  ×${stat.count}`, sx + 18, sy + 7);
    });
  }

  const link = document.createElement('a');
  link.download = `${title || 'bead-pattern'}-${N}x${M}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function exportCsvData(mappedPixelData, gridDimensions, colorSystem = 'MARD') {
  const { N, M } = gridDimensions;
  const header = ['row/col', ...Array.from({ length: N }, (_, i) => String(i + 1))].join(',');
  const rows = [header];
  for (let j = 0; j < M; j++) {
    const row = [String(j + 1)];
    for (let i = 0; i < N; i++) {
      const cell = mappedPixelData[j][i];
      if (cell.isExternal) row.push('TRANSPARENT');
      else row.push(getDisplayColorKey(cell.color, colorSystem));
    }
    rows.push(row.join(','));
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `bead-pattern-${N}x${M}-${colorSystem}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function importCsvData(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV 格式错误：至少需要标题行和一行数据');
  const firstLine = lines[0].split(',');
  const hasHeader = isNaN(firstLine[0]) || firstLine[0].includes('/');
  const startIdx = hasHeader ? 1 : 0;
  const grid = [];
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const startCol = hasHeader ? 1 : 0;
    const row = [];
    for (let k = startCol; k < cols.length; k++) {
      const val = cols[k].trim();
      if (val === 'TRANSPARENT' || val === '') {
        row.push({ key: 'ERASE', color: '#FFFFFF', isExternal: true });
      } else if (val.startsWith('#')) {
        row.push({ key: '?', color: val.toUpperCase(), isExternal: false });
      } else {
        row.push({ key: val, color: '#CCCCCC', isExternal: false });
      }
    }
    grid.push(row);
  }
  const M = grid.length;
  const N = grid[0]?.length || 0;
  return { grid, dimensions: { N, M } };
}
