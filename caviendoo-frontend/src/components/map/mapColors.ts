import * as d3 from 'd3';
import type { OverlayMode } from '@/types';
import type { Governorate } from '@/types';

// ── Récoltes — fruit density (continuous d3 scale) ────────────────────────
// fruitCount range across governorates: 1–24.  0 = empty (light muted green).
const recoltesScale = d3.scaleSequential<string>()
  .domain([0, 25])
  .interpolator(
    d3.interpolateRgbBasis([
      '#C8D8A0', // 0   no crops — light muted green (neutral land)
      '#A8C278', // ~3  minimal
      '#7EAA50', // ~6  few crops
      '#50943A', // ~10 moderate — mid green
      '#2E7820', // ~15 high — vivid green
      '#1A6010', // ~20 very high
      '#0A4A08', // 25  peak — deep forest green
    ])
  );

export function getRecoltesFill(fruitCount: number): string {
  return recoltesScale(Math.max(0, Math.min(25, fruitCount)));
}

// ── Stress Hydrique — aquifer stress % (d3.scaleSequential) ──────────────
// 0% = deep green (#1a6a3a)  →  100% = deep red (#8a1010)
const stressScale = d3.scaleSequential<string>()
  .domain([0, 100])
  .interpolator(
    d3.interpolateRgbBasis([
      '#1a6a3a', // 0%   safe — bright green
      '#4a8a28', // ~20%  — yellow-green
      '#a09010', // ~40%  — olive yellow
      '#d07818', // ~60%  — orange
      '#d04020', // ~80%  — red-orange
      '#a01010', // 100%  critical — deep red
    ])
  );

export function getStressHydriqueFill(pct: number): string {
  return stressScale(Math.max(0, Math.min(100, pct)));
}

// ── Indice UV — UV peak during harvest (d3.scaleSequential) ──────────────
// UV 1 = pale yellow  →  UV 11 = deep red
const uvScale = d3.scaleSequential<string>()
  .domain([1, 11])
  .interpolator(
    d3.interpolateRgbBasis([
      '#f5f0c0', // UV 1–3  low
      '#f0c840', // UV 5    moderate
      '#e08020', // UV 7    high
      '#c04010', // UV 9    very high
      '#801010', // UV 11   extreme
    ])
  );

export function getIndiceUvFill(uvPeak: number): string {
  return uvScale(Math.max(1, Math.min(11, uvPeak)));
}

// ── Aquifer stress chip colour (for popup + detail panel) ─────────────────
export function getAquiferChipClass(pct: number): string {
  if (pct <= 33) return 'chip-stress-low';
  if (pct <= 66) return 'chip-stress-mod';
  return 'chip-stress-high';
}

export function getAquiferLabel(pct: number): string {
  if (pct <= 33) return 'Low';
  if (pct <= 66) return 'Moderate';
  if (pct <= 90) return 'High';
  return 'Critical';
}

// ── Master fill dispatcher ─────────────────────────────────────────────────
export function getGovernorateColor(gov: Governorate, mode: OverlayMode): string {
  switch (mode) {
    case 'recoltes':        return getRecoltesFill(gov.fruitCount);
    case 'stress-hydrique': return getStressHydriqueFill(gov.aquiferStressPct);
    case 'indice-uv':       return getIndiceUvFill(gov.uvPeak);
  }
}

// ── Stress glow CSS class for SVG path (stress-hydrique mode only) ────────
export function getStressGlowClass(gov: Governorate, mode: OverlayMode): string {
  if (mode !== 'stress-hydrique') return '';
  if (gov.aquiferStressPct >= 91) return 'stress-critical';
  if (gov.aquiferStressPct >= 76) return 'stress-extreme';
  if (gov.aquiferStressPct <= 20) return 'stress-safe';
  return '';
}
