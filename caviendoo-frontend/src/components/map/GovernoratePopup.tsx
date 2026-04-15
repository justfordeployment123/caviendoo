'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Droplets, Sun, Leaf } from 'lucide-react';
import { useAtlasStore } from '@/store';
import { getFruitsByGovernorate } from '@/services/dataService';
import { getAquiferChipClass, getAquiferLabel } from './mapColors';
import type { Fruit, Governorate } from '@/types';

interface GovernoratePopupProps {
  governorate: Governorate;
  cx: number;
  cy: number;
  containerWidth: number;
  containerHeight: number;
}

const POP_W = 272;
const POP_MAX_H = 360;
const OFFSET_Y = -16;

export function GovernoratePopup({
  governorate: gov,
  cx,
  cy,
  containerWidth,
  containerHeight,
}: GovernoratePopupProps) {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);

  const setSelectedFruitId = useAtlasStore((s) => s.setSelectedFruitId);
  const setSelectedGovernorate = useAtlasStore((s) => s.setSelectedGovernorate);
  const locale = useAtlasStore((s) => s.locale);

  useEffect(() => {
    getFruitsByGovernorate(gov.shapeName).then((list) =>
      setFruits(list.slice(0, 7))
    );
  }, [gov.shapeName]);

  const popW = Math.min(POP_W, containerWidth - 16);
  const popH = Math.min(POP_MAX_H, (gov.description ? 240 : 180) + fruits.length * 28);
  const rawTop = cy + OFFSET_Y - popH;
  const top = rawTop < 8 ? cy + 24 : rawTop;
  const rawLeft = cx - popW / 2;
  const left = Math.max(8, Math.min(rawLeft, containerWidth - popW - 8));

  const chipClass = getAquiferChipClass(gov.aquiferStressPct);
  const isAbove = cy + OFFSET_Y - popH >= 8;

  return (
    <div
      ref={popupRef}
      className="absolute z-20 animate-fade-in"
      style={{ top, left, width: popW }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-surface border border-border rounded-lg shadow-panel-dark overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-3 pt-3 pb-2 border-b border-border">
          <div>
            <h3 className="text-ink font-serif text-base font-semibold leading-tight">
              {gov.shapeName}
            </h3>
            <p className="text-muted text-2xs mt-0.5 font-mono">{gov.shapeISO}</p>
          </div>
          <button
            onClick={() => setSelectedGovernorate(null)}
            className="text-muted hover:text-ink transition-colors mt-0.5 p-1 -me-1 rounded hover:bg-ink/5"
          >
            <X size={14} />
          </button>
        </div>

        {/* Description */}
        {gov.description && (
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs text-ink-muted leading-relaxed">
              {gov.description}
            </p>
          </div>
        )}

        {/* Data chips */}
        <div className="flex gap-2 px-3 py-2 border-b border-border flex-wrap">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-raised text-xs text-ink border border-border">
            <Leaf size={10} className="text-gold" />
            <span className="font-mono font-medium">{gov.fruitCount}</span>
            <span className="text-muted">fruits</span>
          </span>

          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs badge ${chipClass}`}>
            <Droplets size={10} />
            <span className="font-mono font-medium">{gov.aquiferStressPct}%</span>
            <span className="opacity-80">{getAquiferLabel(gov.aquiferStressPct)}</span>
          </span>

          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700">
            <Sun size={10} />
            <span className="font-mono font-medium">UV {gov.uvPeak}</span>
          </span>
        </div>

        {/* Fruit chips */}
        {fruits.length > 0 && (
          <div className="px-3 py-2">
            <p className="text-2xs text-muted uppercase tracking-widest mb-1.5 font-medium">Fruits</p>
            <div className="flex flex-wrap gap-1.5">
              {fruits.slice(0, 6).map((fruit) => (
                <button
                  key={fruit.id}
                  onClick={() => {
                    setSelectedFruitId(fruit.id);
                    setSelectedGovernorate(null);
                  }}
                  className="px-2 py-0.5 rounded-full text-2xs font-medium transition-colors bg-surface-raised border border-border text-ink hover:border-gold hover:text-gold"
                >
                  {fruit.name[locale]}
                </button>
              ))}
              {fruits.length === 7 && (
                <span className="px-2 py-0.5 text-2xs text-muted">+more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Arrow pointing to centroid */}
      {isAbove && (
        <div
          className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            bottom: -6,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #A8CA6A',
          }}
        />
      )}
    </div>
  );
}
