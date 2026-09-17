/* ==========================================================================
   Colour maths for token derivation.
   --------------------------------------------------------------------------
   No dependencies. Everything here is used by both the token generator and,
   via the studio API, the live editor — so a colour you pick in the UI and a
   colour written to tokens.css are computed by the same code.

   The important function is `solidFor`. Picking a brand accent and using it as
   a button fill is how a primary button lands at 3.5:1. Instead of asking the
   designer to hand-pick a second, darker accent, we derive one: walk the
   lightness down until it actually clears the contrast target. A global colour
   change then cannot break contrast, because the derived roles adapt.
   ========================================================================== */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const hexToRgb = (hex) => {
  let h = String(hex).trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = Number.parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

export const rgbToHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

export const rgbToHsl = ({ r, g, b }) => {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === R) h = ((G - B) / d + (G < B ? 6 : 0));
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
};

export const hslToRgb = ({ h, s, l }) => {
  const H = ((h % 360) + 360) % 360, S = clamp(s, 0, 100) / 100, L = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = L - c / 2;
  const seg = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(H / 60) % 6];
  return { r: (seg[0] + m) * 255, g: (seg[1] + m) * 255, b: (seg[2] + m) * 255 };
};

export const relLuminance = ({ r, g, b }) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export const contrast = (a, b) => {
  const [hi, lo] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Same hue and saturation, a specific lightness. */
export const atLightness = (hex, l) => {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ ...hsl, l }));
};

export const shift = (hex, deltaL, deltaS = 0) => {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ h: hsl.h, s: clamp(hsl.s + deltaS, 0, 100), l: clamp(hsl.l + deltaL, 0, 100) }));
};

/**
 * Darken `hex` until it reaches `target` contrast against `against`.
 * Used for fills that carry white text. Returns the lightest colour that
 * still passes, so the result stays as close to the chosen brand colour as
 * contrast allows rather than jumping to near-black.
 */
export const solidFor = (hex, against = { r: 255, g: 255, b: 255 }, target = 4.5) => {
  const hsl = rgbToHsl(hexToRgb(hex));
  for (let l = hsl.l; l >= 0; l -= 0.5) {
    const candidate = hslToRgb({ ...hsl, l });
    if (contrast(candidate, against) >= target) return rgbToHex(candidate);
  }
  return "#000000";
};

/**
 * Lighten `hex` until it reaches `target` contrast against `against`.
 * Used for status and accent TEXT sitting on a dark surface or tinted chip.
 */
export const fgFor = (hex, against, target = 4.5) => {
  const hsl = rgbToHsl(hexToRgb(hex));
  const goingLighter = relLuminance(hexToRgb(hex)) < relLuminance(against) ? false : true;
  const step = goingLighter ? 0.5 : -0.5;
  for (let i = 0; i <= 200; i += 1) {
    const l = clamp(hsl.l + step * i, 0, 100);
    const candidate = hslToRgb({ ...hsl, l });
    if (contrast(candidate, against) >= target) return rgbToHex(candidate);
    if (l === 0 || l === 100) break;
  }
  // Fall back to whichever extreme actually reads against this background.
  return relLuminance(against) > 0.4 ? "#000000" : "#ffffff";
};

/** A neutral ramp at a given hue.
 *
 *  Saturation is held constant across the ramp rather than tapered toward the
 *  ends. HSL already collapses the absolute channel spread at extreme
 *  lightness — at 4% lightness even 18% saturation is only a few points of
 *  difference between channels — so tapering on top of that produces flat grey
 *  darks and loses the tint the hue was chosen for. */
export const neutralRamp = (hue, chroma = 18) => {
  const stops = {
    950: 4, 900: 7, 850: 10, 800: 13, 700: 20,
    600: 29, 500: 40, 400: 54, 300: 70, 200: 84, 100: 92, "050": 97,
  };
  const out = {};
  for (const [key, l] of Object.entries(stops)) {
    out[key] = rgbToHex(hslToRgb({ h: hue, s: clamp(chroma, 0, 100), l }));
  }
  return out;
};

/** An accent ramp around a chosen colour, keyed the same way as the palette. */
export const accentRamp = (hex) => {
  const { h, s } = rgbToHsl(hexToRgb(hex));
  const at = (l) => rgbToHex(hslToRgb({ h, s, l }));
  const base = rgbToHsl(hexToRgb(hex)).l;
  return {
    300: at(clamp(base + 22, 0, 92)),
    400: at(clamp(base + 11, 0, 88)),
    500: rgbToHex(hexToRgb(hex)),
    600: at(clamp(base - 12, 6, 100)),
    650: at(clamp(base - 7, 6, 100)),
    700: at(clamp(base - 20, 4, 100)),
  };
};

export const rgbaString = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${alpha})`;
};
