export function getConnectedRegion(mappedPixelData, startRow, startCol, targetColor) {
  if (!mappedPixelData?.[startRow]?.[startCol]) return [];
  const M = mappedPixelData.length;
  const N = mappedPixelData[0].length;
  const visited = Array.from({ length: M }, () => new Array(N).fill(false));
  const region = [];
  const stack = [{ row: startRow, col: startCol }];

  while (stack.length > 0) {
    const { row, col } = stack.pop();
    if (row < 0 || row >= M || col < 0 || col >= N || visited[row][col]) continue;
    const cell = mappedPixelData[row][col];
    if (!cell || cell.isExternal || cell.color !== targetColor) continue;
    visited[row][col] = true;
    region.push({ row, col });
    stack.push({ row: row - 1, col }, { row: row + 1, col }, { row, col: col - 1 }, { row, col: col + 1 });
  }
  return region;
}

export function getAllConnectedRegions(mappedPixelData, targetColor) {
  if (!mappedPixelData?.length) return [];
  const M = mappedPixelData.length;
  const N = mappedPixelData[0].length;
  const visited = Array.from({ length: M }, () => new Array(N).fill(false));
  const regions = [];

  for (let row = 0; row < M; row++) {
    for (let col = 0; col < N; col++) {
      if (!visited[row][col]) {
        const cell = mappedPixelData[row][col];
        if (cell && !cell.isExternal && cell.color === targetColor) {
          const region = getConnectedRegion(mappedPixelData, row, col, targetColor);
          if (region.length > 0) {
            regions.push(region);
            for (const { row: r, col: c } of region) visited[r][c] = true;
          }
        }
      }
    }
  }
  return regions;
}
