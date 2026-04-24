/**
 * Color interpolation matching the frontend D3 scaleSequential+interpolateRgbBasis
 * scales defined in caviendoo-frontend/src/components/map/mapColors.ts.
 * Uses piecewise linear RGB interpolation between the same color stops.
 */

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function interpolateStops(stops: string[], t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped <= 0) return stops[0];
  if (clamped >= 1) return stops[stops.length - 1];
  const n = stops.length - 1;
  const i = Math.floor(clamped * n);
  const local = clamped * n - i;
  const [r1, g1, b1] = hexToRgb(stops[i]);
  const [r2, g2, b2] = hexToRgb(stops[i + 1]);
  return `rgb(${Math.round(r1 + (r2 - r1) * local)},${Math.round(g1 + (g2 - g1) * local)},${Math.round(b1 + (b2 - b1) * local)})`;
}

// Aquifer stress 0–100 % — green (safe) → red (critical)
// Mirrors: interpolateRgbBasis(['#1a6a3a','#4a8a28','#a09010','#d07818','#d04020','#a01010'])
const STRESS_STOPS = ['#1a6a3a', '#4a8a28', '#a09010', '#d07818', '#d04020', '#a01010'];

export function stressColor(pct: number): string {
  return interpolateStops(STRESS_STOPS, pct / 100);
}

// UV Index 1–11 — pale yellow (low) → deep red (extreme)
// Mirrors: interpolateRgbBasis(['#f5f0c0','#f0c840','#e08020','#c04010','#801010'])
const UV_STOPS = ['#f5f0c0', '#f0c840', '#e08020', '#c04010', '#801010'];

export function uvColor(uv: number): string {
  return interpolateStops(UV_STOPS, (Math.max(1, Math.min(11, uv)) - 1) / 10);
}

// Human-readable UV risk label matching WHO classification
export function uvLabel(uv: number): string {
  if (uv <= 2)  return 'Low';
  if (uv <= 5)  return 'Moderate';
  if (uv <= 7)  return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

// Human-readable stress label
export function stressLabel(pct: number): string {
  if (pct < 20)  return 'Low';
  if (pct < 40)  return 'Moderate';
  if (pct < 60)  return 'High';
  if (pct < 80)  return 'Very High';
  return 'Critical';
}
