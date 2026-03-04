import { TRANSPARENT_KEY, transparentColorData } from './pixelation';

export function floodFillErase(pixelData, gridDimensions, startRow, startCol, targetKey) {
  const { N, M } = gridDimensions;
  const newData = pixelData.map((row) => row.map((cell) => ({ ...cell })));
  const visited = Array.from({ length: M }, () => new Array(N).fill(false));
  const stack = [{ row: startRow, col: startCol }];

  while (stack.length > 0) {
    const { row, col } = stack.pop();
    if (row < 0 || row >= M || col < 0 || col >= N || visited[row][col]) continue;
    const cell = newData[row][col];
    if (!cell || cell.isExternal || cell.key !== targetKey) continue;
    visited[row][col] = true;
    newData[row][col] = { ...transparentColorData };
    stack.push({ row: row - 1, col }, { row: row + 1, col }, { row, col: col - 1 }, { row, col: col + 1 });
  }
  return newData;
}

export function replaceColor(pixelData, gridDimensions, sourceColor, targetColor) {
  const { N, M } = gridDimensions;
  const newData = pixelData.map((row) => row.map((cell) => ({ ...cell })));
  let count = 0;
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const cell = newData[j][i];
      if (cell && !cell.isExternal && cell.color.toUpperCase() === sourceColor.color.toUpperCase()) {
        newData[j][i] = { key: targetColor.key, color: targetColor.color, isExternal: false };
        count++;
      }
    }
  }
  return { newPixelData: newData, replaceCount: count };
}

export function paintSinglePixel(pixelData, row, col, newColor) {
  const newData = pixelData.map((r) => r.map((c) => ({ ...c })));
  const current = newData[row]?.[col];
  if (!current) return { newPixelData: pixelData, hasChange: false };

  let newCell;
  if (newColor.key === TRANSPARENT_KEY) {
    newCell = { ...transparentColorData };
  } else {
    newCell = { ...newColor, isExternal: false };
  }

  const changed = newCell.key !== current.key || newCell.isExternal !== current.isExternal;
  if (changed) newData[row][col] = newCell;
  return { newPixelData: changed ? newData : pixelData, hasChange: changed };
}
