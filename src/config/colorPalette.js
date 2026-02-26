/**
 * 拼豆标准色卡 - 真实可采购色号
 *
 * 数据来源：参考 MARD/COCO 色卡标准（可从实体店或网购按色号购买）
 * 数据结构：{ code: 色号, hex: 十六进制, name: 中文名, r/g/b: RGB 值 }
 *
 * 扩展说明：
 * - 可将完整 144 色或 288 色色表复制到此数组，覆盖或追加即可
 * - 保持每项包含 code、hex、name、r、g、b 字段
 */

export const COLOR_PALETTE = [
  // 白色 / 黑色
  { code: 'M01', hex: '#FFFFFF', name: '纯白', r: 255, g: 255, b: 255 },
  { code: 'M02', hex: '#000000', name: '纯黑', r: 0, g: 0, b: 0 },

  // A 黄色系
  { code: 'E02', hex: '#FFF8DC', name: '奶油黄', r: 255, g: 248, b: 220 },
  { code: 'D03', hex: '#FFD700', name: '金黄', r: 255, g: 215, b: 0 },
  { code: 'K09', hex: '#FFB347', name: '杏黄', r: 255, g: 179, b: 71 },

  // C 蓝色系
  { code: 'G01', hex: '#87CEEB', name: '天蓝', r: 135, g: 206, b: 235 },
  { code: 'H23', hex: '#1E90FF', name: '道奇蓝', r: 30, g: 144, b: 255 },
  { code: 'H31', hex: '#00008B', name: '深蓝', r: 0, g: 0, b: 139 },

  // F 红色系
  { code: 'K08', hex: '#E63946', name: '大红', r: 230, g: 57, b: 70 },
  { code: 'C01', hex: '#8B0000', name: '深红', r: 139, g: 0, b: 0 },
  { code: 'K33', hex: '#C71585', name: '洋红', r: 199, g: 21, b: 133 },

  // B 绿色系
  { code: 'F05', hex: '#90EE90', name: '浅绿', r: 144, g: 238, b: 144 },
  { code: 'G03', hex: '#32CD32', name: '柠檬绿', r: 50, g: 205, b: 50 },
  { code: 'G08', hex: '#228B22', name: '森林绿', r: 34, g: 139, b: 34 },

  // D 紫色系
  { code: 'J07', hex: '#E6E6FA', name: '薰衣草', r: 230, g: 230, b: 250 },
  { code: 'J14', hex: '#9370DB', name: '中紫', r: 147, g: 112, b: 219 },
  { code: 'J17', hex: '#4B0082', name: '靛青', r: 75, g: 0, b: 130 },

  // E 肤色系
  { code: 'K03', hex: '#FFE4C4', name: '蜜桃', r: 255, g: 228, b: 196 },
  { code: 'K24', hex: '#DEB887', name: '裸粉', r: 222, g: 184, b: 135 },
  { code: 'K30', hex: '#BC8F8F', name: '玫瑰褐', r: 188, g: 143, b: 143 },

  // G 棕色系
  { code: 'Z02', hex: '#F5DEB3', name: '小麦', r: 245, g: 222, b: 179 },
  { code: 'Z15', hex: '#8B4513', name: '马鞍棕', r: 139, g: 69, b: 19 },
  { code: 'Z19', hex: '#3E2723', name: '深棕', r: 62, g: 39, b: 35 },

  // H 灰色系
  { code: 'A05', hex: '#F5F5F5', name: '浅灰', r: 245, g: 245, b: 245 },
  { code: 'B08', hex: '#808080', name: '中灰', r: 128, g: 128, b: 128 },
  { code: 'B11', hex: '#404040', name: '深灰', r: 64, g: 64, b: 64 },

  // M 暗色系
  { code: 'Y01', hex: '#2F4F4F', name: '墨绿灰', r: 47, g: 79, b: 79 },
  { code: 'Y06', hex: '#2E7D32', name: '暗绿', r: 46, g: 125, b: 50 },

  // 橙色
  { code: 'F01', hex: '#FF8C00', name: '深橙', r: 255, g: 140, b: 0 },
  { code: 'K05', hex: '#FFA07A', name: '浅鲑', r: 255, g: 160, b: 122 },

  // 粉色
  { code: 'C02', hex: '#FFB6C1', name: '粉红', r: 255, g: 182, b: 193 },
  { code: 'K12', hex: '#FF69B4', name: '热粉', r: 255, g: 105, b: 180 },
];
