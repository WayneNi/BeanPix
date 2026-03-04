import colorSystemMapping from '../config/colorSystemMapping.json';

export const COLOR_SYSTEMS = ['MARD', 'COCO', '漫漫', '盼盼', '咪小窝'];

export const colorSystemOptions = [
  { key: 'MARD', name: 'MARD' },
  { key: 'COCO', name: 'COCO' },
  { key: '漫漫', name: '漫漫' },
  { key: '盼盼', name: '盼盼' },
  { key: '咪小窝', name: '咪小窝' },
];

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

export function getAllHexValues() {
  return Object.keys(colorSystemMapping);
}

export function getMardToHexMapping() {
  const mapping = {};
  for (const [hex, data] of Object.entries(colorSystemMapping)) {
    if (data.MARD) mapping[data.MARD] = hex;
  }
  return mapping;
}

export function buildFullPalette(colorSystem = 'MARD') {
  return Object.entries(colorSystemMapping).map(([hex, data]) => {
    const rgb = hexToRgb(hex);
    return {
      key: data[colorSystem] || data.MARD,
      hex: hex.toUpperCase(),
      rgb: rgb || { r: 0, g: 0, b: 0 },
    };
  });
}

export function buildPaletteSubset(mardKeys, colorSystem = 'MARD') {
  const mardMap = getMardToHexMapping();
  return mardKeys
    .filter((k) => mardMap[k])
    .map((mardKey) => {
      const hex = mardMap[mardKey];
      const data = colorSystemMapping[hex];
      const rgb = hexToRgb(hex);
      return {
        key: data[colorSystem] || mardKey,
        hex: hex.toUpperCase(),
        rgb: rgb || { r: 0, g: 0, b: 0 },
      };
    });
}

export function convertPaletteToColorSystem(palette, colorSystem) {
  return palette.map((color) => {
    const data = colorSystemMapping[color.hex] || colorSystemMapping[color.hex.toUpperCase()];
    if (data && data[colorSystem]) {
      return { ...color, key: data[colorSystem] };
    }
    return color;
  });
}

export function getDisplayColorKey(hexValue, colorSystem) {
  if (!hexValue || hexValue === 'ERASE' || hexValue === '?') return hexValue || '?';
  const norm = hexValue.toUpperCase();
  const data = colorSystemMapping[norm];
  return data && data[colorSystem] ? data[colorSystem] : '?';
}

export function getColorKeyByHex(hexValue, colorSystem) {
  return getDisplayColorKey(hexValue, colorSystem);
}

export function convertColorKeyToHex(displayKey, colorSystem) {
  if (displayKey.startsWith('#') && displayKey.length === 7) return displayKey.toUpperCase();
  for (const [hex, mapping] of Object.entries(colorSystemMapping)) {
    if (mapping[colorSystem] === displayKey) return hex;
  }
  return displayKey;
}

function hexToHsl(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    switch (max) {
      case r: h = ((g - b) / diff + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / diff + 2) / 6; break;
      case b: h = ((r - g) / diff + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function sortColorsByHue(colors) {
  return colors.slice().sort((a, b) => {
    const hslA = hexToHsl(a.color || a.hex);
    const hslB = hexToHsl(b.color || b.hex);
    if (Math.abs(hslA.h - hslB.h) > 5) return hslA.h - hslB.h;
    if (Math.abs(hslA.l - hslB.l) > 3) return hslB.l - hslA.l;
    return hslB.s - hslA.s;
  });
}
