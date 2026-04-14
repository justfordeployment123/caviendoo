'use client';

import type { Governorate, OverlayMode } from '@/types';
import { getAquiferLabel } from './mapColors';

interface MapTooltipProps {
  governorate: Governorate;
  overlayMode: OverlayMode;
}

export function MapTooltip({ governorate: gov, overlayMode }: MapTooltipProps) {
  function getPrimaryLine(): string {
    switch (overlayMode) {
      case 'recoltes':        return `${gov.fruitCount} fruit${gov.fruitCount !== 1 ? 's' : ''}`;
      case 'stress-hydrique': return `Aquifer: ${gov.aquiferStressPct}%`;
      case 'indice-uv':       return `UV Peak: ${gov.uvPeak}`;
    }
  }

  function getSecondaryLine(): string {
    switch (overlayMode) {
      case 'recoltes':        return gov.waterLabel;
      case 'stress-hydrique': return getAquiferLabel(gov.aquiferStressPct) + ' stress';
      case 'indice-uv':       return gov.uvLabel;
    }
  }

  return (
    <div className="bg-surface border border-border rounded px-3 py-2 shadow-panel-dark">
      <p className="text-ink text-xs font-medium mb-0.5">{gov.shapeName}</p>
      <p className="text-gold font-mono text-sm font-medium leading-tight">
        {getPrimaryLine()}
      </p>
      <p className="text-muted text-2xs mt-0.5">{getSecondaryLine()}</p>
      {/* Caret */}
      <div
        className="absolute w-0 h-0"
        style={{
          bottom: -5,
          left: 12,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '5px solid #D4EAAA',
        }}
      />
    </div>
  );
}
