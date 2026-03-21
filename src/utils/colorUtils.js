// utils/colorUtils.js
// Colour manipulation helpers used by the whiteboard canvas, element styling,
// and the board background-colour form field.
// Keeping these pure functions here avoids reimplementing hex/RGB conversion
// in multiple components.

/**
 * Validates that a string is a valid CSS hex colour.
 * Accepts both 3-digit (#abc) and 6-digit (#aabbcc) formats.
 *
 * @param {string} hex - The colour string to validate
 * @returns {boolean} True if the string is a valid hex colour
 */
export function isValidHex(hex) {
  if (typeof hex !== 'string') return false
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)
}

/**
 * Converts a 3-digit or 6-digit hex colour to an RGB object.
 * Returns null for invalid input.
 *
 * @param {string} hex - e.g. "#ff5733" or "#f53"
 * @returns {{ r: number, g: number, b: number }|null}
 */
export function hexToRgb(hex) {
  if (!isValidHex(hex)) return null

  // Expand short form (#abc -> #aabbcc) before parsing
  const expanded =
    hex.length === 4
      ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
      : hex

  const result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(expanded)
  if (!result) return null

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

/**
 * Converts RGB values to a hex colour string.
 *
 * @param {number} r - Red channel (0-255)
 * @param {number} g - Green channel (0-255)
 * @param {number} b - Blue channel (0-255)
 * @returns {string} Hex colour string like "#ff5733"
 */
export function rgbToHex(r, g, b) {
  // Clamp each channel to the valid 0-255 range before converting
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
  const toHex = (v) => clamp(v).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Computes an rgba() CSS string from a hex colour and opacity value.
 * Used when drawing transparent fills on the whiteboard canvas.
 *
 * @param {string} hex - Hex colour string
 * @param {number} alpha - Opacity between 0 and 1
 * @returns {string} CSS rgba() string or the original hex on parse failure
 */
export function hexToRgba(hex, alpha = 1) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

/**
 * Determines whether black or white text provides better contrast
 * against a given background colour.  Useful for labels on coloured chips.
 *
 * Uses the WCAG relative luminance formula.
 *
 * @param {string} hex - Background colour hex string
 * @returns {'#000000'|'#ffffff'} High-contrast foreground colour
 */
export function contrastColor(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#000000'

  // Convert sRGB to linear light values for luminance calculation
  const toLinear = (c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }

  const luminance =
    0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b)

  // Threshold of 0.179 is the standard WCAG cut-off
  return luminance > 0.179 ? '#000000' : '#ffffff'
}

/**
 * Returns a lighter version of a hex colour by blending it toward white.
 * Used for sticky-note backgrounds and selection highlights.
 *
 * @param {string} hex - Base colour
 * @param {number} amount - 0 (no change) to 1 (white)
 * @returns {string} Lightened hex colour
 */
export function lighten(hex, amount = 0.5) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const blend = (c) => Math.round(c + (255 - c) * amount)
  return rgbToHex(blend(rgb.r), blend(rgb.g), blend(rgb.b))
}
