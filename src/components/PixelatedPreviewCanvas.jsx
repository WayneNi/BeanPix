import { useRef, useEffect, useCallback } from 'react';
import { clientToGridCoords } from '../utils/canvasUtils';

export function PixelatedPreviewCanvas({
  mappedPixelData,
  gridDimensions,
  showGridLines = true,
  showColorKeys = false,
  onCellHover,
  onCellClick,
  colorSystem,
}) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mappedPixelData || !gridDimensions) return;

    const { N, M } = gridDimensions;
    const cellSize = Math.max(6, Math.min(24, Math.floor(800 / Math.max(N, M))));
    canvas.width = N * cellSize;
    canvas.height = M * cellSize;
    const ctx = canvas.getContext('2d');

    for (let j = 0; j < M; j++) {
      for (let i = 0; i < N; i++) {
        const cell = mappedPixelData[j]?.[i];
        if (!cell) continue;

        if (cell.isExternal) {
          ctx.fillStyle = '#F0F0F0';
        } else {
          ctx.fillStyle = cell.color;
        }
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);

        if (showColorKeys && !cell.isExternal && cellSize >= 14) {
          const luma = getLuma(cell.color);
          ctx.fillStyle = luma > 0.5 ? '#000000' : '#FFFFFF';
          ctx.font = `${Math.max(6, cellSize * 0.4)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cell.key, i * cellSize + cellSize / 2, j * cellSize + cellSize / 2, cellSize - 2);
        }
      }
    }

    if (showGridLines) {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= N; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, M * cellSize);
        ctx.stroke();
      }
      for (let j = 0; j <= M; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * cellSize);
        ctx.lineTo(N * cellSize, j * cellSize);
        ctx.stroke();
      }
    }
  }, [mappedPixelData, gridDimensions, showGridLines, showColorKeys]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseMove = useCallback(
    (e) => {
      if (!onCellHover || !canvasRef.current || !gridDimensions) return;
      const coords = clientToGridCoords(e.clientX, e.clientY, canvasRef.current, gridDimensions);
      if (coords && mappedPixelData) {
        const cell = mappedPixelData[coords.j]?.[coords.i];
        onCellHover({ ...coords, cell, clientX: e.clientX, clientY: e.clientY });
      } else {
        onCellHover(null);
      }
    },
    [onCellHover, gridDimensions, mappedPixelData]
  );

  const handleClick = useCallback(
    (e) => {
      if (!onCellClick || !canvasRef.current || !gridDimensions) return;
      const coords = clientToGridCoords(e.clientX, e.clientY, canvasRef.current, gridDimensions);
      if (coords && mappedPixelData) {
        const cell = mappedPixelData[coords.j]?.[coords.i];
        onCellClick({ ...coords, cell });
      }
    },
    [onCellClick, gridDimensions, mappedPixelData]
  );

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onCellHover?.(null)}
      onClick={handleClick}
      className="max-w-full cursor-crosshair rounded border border-stone-200"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

function getLuma(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
