/**
 * 拼豆颜色匹配逻辑
 * 色卡数据来自 colorPalette.js，使用欧几里得距离进行最近色匹配
 */

import { COLOR_PALETTE } from '../config/colorPalette';

/** 白色（用于透明像素映射） */
export const WHITE_BEAD = COLOR_PALETTE[0];

/**
 * 计算两个颜色之间的欧几里得距离（用于找最接近的颜色）
 */
function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
}

/**
 * 将 RGB 颜色映射到最接近的拼豆色卡颜色
 * 使用欧几里得距离公式，找到色卡中距离最近的真实色号
 *
 * @param {number} r - 红 (0-255)
 * @param {number} g - 绿 (0-255)
 * @param {number} b - 蓝 (0-255)
 * @returns {Object} 色卡项 { code, hex, name, r, g, b }
 */
export function mapToBeadColor(r, g, b) {
  let minDistance = Infinity;
  let closestColor = COLOR_PALETTE[0];

  for (const color of COLOR_PALETTE) {
    const distance = colorDistance(r, g, b, color.r, color.g, color.b);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor;
}
