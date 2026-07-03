/**
 * color-utils.js — Craftora EDS shared color helpers.
 *
 * Palette DATA stays local to each block (product-detail and the customizer use
 * intentionally different swatch sets), but the lookup/formatting LOGIC is
 * shared here so it isn't duplicated.
 */

/**
 * Canonical product/design color palette (key → hex), shared by the product
 * detail color picker and the customizer so both offer the same swatches.
 */
/* eslint-disable object-curly-newline, object-property-newline */
export const COLOR_PALETTE = {
  pacificBlue: '#B0DDF7', angelBlue: '#A7BFE5', brightBlue: '#50C6F6',
  turquoiseBlue: '#22B1C2', happyBlue: '#2C91BF', royalBlue: '#0055B8',
  blueberry: '#2D2877', navyBlue: '#190850', iceBlue: '#C8E1E6',
  robinsBlue: '#92D6D3', happySky: '#7ACDE7', aquaBlue: '#54C1C4',
  aquaMint: '#4EBBAD', teal: '#1FAAAD', mediumTeal: '#2D8E95',
  darkTeal: '#237C7C', pastelGreen: '#CBE5BE', celeryGreen: '#B0D69A',
  pistachio: '#A5D49E', seafoam: '#ABC5C1', freshGreen: '#ACC636',
  greenGrass: '#8ECB3F', emerald: '#6EA864', forestGreen: '#4B7A47',
  pastelLilac: '#D0CFE7', lilac: '#BFBDE6', lavender: '#C7A2D0',
  plum: '#7B6AB0', violet: '#6D2B76', orchidPurple: '#94307D',
  blueViolet: '#4B2C76', eggplant: '#602058', pastelPink: '#F7D8E7',
  cottonCandy: '#F2B8D1', dustyRose: '#E599AC', sweetPink: '#F49ABB',
  rose: '#F1719B', hotPink: '#EE4791', mameyPink: '#F05778',
  fuschia: '#DC126B', palePeach: '#FDE0DA', peach: '#F7BCA4',
  lightCoral: '#F47B7D', honeysuckle: '#F07761', prettyRed: '#E12D3A',
  wineRed: '#A91E3E', burgundy: '#8E2D30', happyOrange: '#F79854',
  tangerine: '#F47F25', tango: '#F15B24', burntOrange: '#DC8720',
  pumpkin: '#DA5C29', rust: '#BF6227', leather: '#9B5B51',
  chocolate: '#644245', buttercup: '#FFF546', vanilla: '#FFF481',
  honey: '#F5E47D', brightYellow: '#FEF200', sunnyYellow: '#FDEB3F',
  mustardYellow: '#E3C34D', camel: '#D7C15F', sand: '#E1CF85',
  tan: '#D7CDB4', softTaupe: '#B3A99D', taupe: '#8B7D7D',
  darkBrown: '#4B3735', softGray: '#D0D2D4', slateGray: '#9A9C9F',
  charcoal: '#58585A', black: '#231F20',
};
/* eslint-enable object-curly-newline, object-property-newline */

/**
 * Perceived-lightness test (ITU-R BT.601 luma) for choosing swatch borders.
 * @param {string} hex e.g. "#B0DDF7"
 * @returns {boolean} true if the color reads as "light"
 */
export function isLightColor(hex) {
  const c = String(hex).replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}

/**
 * Convert a camelCase palette key into a display name ("hotPink" → "Hot Pink").
 * @param {string} key
 * @returns {string}
 */
export function formatColorName(key) {
  if (!key) return '';
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

/**
 * Find the palette key whose hex value matches `hex` (case-insensitive).
 * @param {string} hex
 * @param {object} palette map of key → hex
 * @returns {string|null}
 */
export function getColorKey(hex, palette) {
  const h = String(hex).toLowerCase();
  return Object.keys(palette).find((k) => String(palette[k]).toLowerCase() === h) || null;
}

/**
 * Resolve a hex value to a human display name using `palette`; falls back to
 * the raw hex when the color isn't in the palette.
 * @param {string} hex
 * @param {object} palette map of key → hex
 * @returns {string}
 */
export function getColorName(hex, palette) {
  const key = getColorKey(hex, palette);
  return key ? formatColorName(key) : hex;
}
