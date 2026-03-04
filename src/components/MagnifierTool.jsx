import { useRef, useEffect, useCallback, useState } from 'react';

export function MagnifierTool({ mappedPixelData, gridDimensions, visible, position, zoomLevel = 4, colorSystem }) {
  const canvasRef = useRef(null);
  const viewSize = 160;
  const cellSize = 20;

  useEffect(() => {
    if (!visible || !mappedPixelData || !position || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { N, M } = gridDimensions;
    const { i: ci, j: cj } = position;

    const visibleCells = Math.floor(viewSize / (cellSize * (zoomLevel / 2)));
    const halfV = Math.floor(visibleCells / 2);
    canvas.width = viewSize;
    canvas.height = viewSize;
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(0, 0, viewSize, viewSize);

    const zoomedCellSize = cellSize * (zoomLevel / 2);

    for (let dj = -halfV; dj <= halfV; dj++) {
      for (let di = -halfV; di <= halfV; di++) {
        const gi = ci + di;
        const gj = cj + dj;
        const px = (di + halfV) * zoomedCellSize;
        const py = (dj + halfV) * zoomedCellSize;

        if (gi >= 0 && gi < N && gj >= 0 && gj < M) {
          const cell = mappedPixelData[gj][gi];
          ctx.fillStyle = cell?.isExternal ? '#F5F5F5' : (cell?.color || '#F5F5F5');
          ctx.fillRect(px, py, zoomedCellSize, zoomedCellSize);
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, zoomedCellSize, zoomedCellSize);

          if (!cell?.isExternal && zoomedCellSize > 14) {
            const luma = getLumaFn(cell.color);
            ctx.fillStyle = luma > 0.5 ? '#000' : '#FFF';
            ctx.font = `${Math.max(7, zoomedCellSize * 0.3)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cell.key, px + zoomedCellSize / 2, py + zoomedCellSize / 2, zoomedCellSize - 2);
          }
        }
      }
    }

    const centerPx = halfV * zoomedCellSize;
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerPx, centerPx, zoomedCellSize, zoomedCellSize);
  }, [visible, mappedPixelData, gridDimensions, position, zoomLevel, colorSystem]);

  if (!visible || !position) return null;

  return (
    <div
      className="pointer-events-none fixed z-40 overflow-hidden rounded-xl border-2 border-stone-300 bg-white shadow-xl"
      style={{ left: (position.clientX || 0) + 20, top: (position.clientY || 0) - viewSize / 2, width: viewSize, height: viewSize }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

function getLumaFn(hex) {
  if (!hex || hex.length < 7) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
