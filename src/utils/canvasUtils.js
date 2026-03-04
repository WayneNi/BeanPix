export function clientToGridCoords(clientX, clientY, canvas, gridDimensions) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;

  const { N, M } = gridDimensions;
  const cellW = canvas.width / N;
  const cellH = canvas.height / M;

  const i = Math.floor(canvasX / cellW);
  const j = Math.floor(canvasY / cellH);

  if (i >= 0 && i < N && j >= 0 && j < M) return { i, j };
  return null;
}

export function isTouchMove(startPos, currentPos, threshold = 10) {
  return Math.abs(currentPos.x - startPos.x) > threshold || Math.abs(currentPos.y - startPos.y) > threshold;
}
