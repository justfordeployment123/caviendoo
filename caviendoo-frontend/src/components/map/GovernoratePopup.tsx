'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Droplets, Sun, Leaf, GitCompare, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAtlasStore } from '@/store';
import { getFruitsByGovernorate, getFruitById } from '@/services/dataService';
import { getAquiferChipClass, getAquiferLabel } from './mapColors';
import { WeatherWidget } from './WeatherWidget';
import type { Fruit, Governorate } from '@/types';

interface GovernoratePopupProps {
  governorate: Governorate;
  cx: number;
  cy: number;
  containerWidth: number;
  containerHeight: number;
  onOpenComparablePanel?: () => void;
}

const POP_W = 272;
const OFFSET_Y = -16;

export function GovernoratePopup({
  governorate: gov,
  cx,
  cy,
  containerWidth,
  containerHeight,
  onOpenComparablePanel,
}: GovernoratePopupProps) {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [selectedFruitName, setSelectedFruitName] = useState<string>('');
  const popupRef = useRef<HTMLDivElement>(null);

  const tMap = useTranslations('map');
  const setSelectedFruitId = useAtlasStore((s) => s.setSelectedFruitId);
  const setSelectedGovernorate = useAtlasStore((s) => s.setSelectedGovernorate);
  const locale = useAtlasStore((s) => s.locale);
  const selectedFruitId = useAtlasStore((s) => s.selectedFruitId);

  useEffect(() => {
    getFruitsByGovernorate(gov.shapeName).then((list) =>
      setFruits(list.slice(0, 7))
    );
  }, [gov.shapeName]);

  useEffect(() => {
    if (!selectedFruitId) { setSelectedFruitName(''); return; }
    getFruitById(selectedFruitId).then((f) => {
      setSelectedFruitName(f ? (f.name[locale] || f.name.en) : selectedFruitId);
    });
  }, [selectedFruitId, locale]);

  const popW = Math.min(POP_W, containerWidth - 16);
  const spaceAbove = cy + OFFSET_Y;
  const spaceBelow = containerHeight - cy - 24;
  const maxPopH = 520;
  const rawTop = cy + OFFSET_Y - Math.min(maxPopH, spaceAbove - 8);
  const top = spaceAbove > 120 ? Math.max(8, rawTop) : cy + 24;
  const maxH = spaceAbove > 120
    ? Math.min(maxPopH, spaceAbove - 8)
    : Math.min(maxPopH, spaceBelow - 8);
  const rawLeft = cx - popW / 2;
  const left = Math.max(8, Math.min(rawLeft, containerWidth - popW - 8));

  const chipClass = getAquiferChipClass(gov.aquiferStressPct);
  const isAbove = spaceAbove > 120;

  return (
    <div
      ref={popupRef}
      className="absolute z-20 animate-fade-in"
      style={{ top, left, width: popW, maxHeight: maxH }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-surface border border-border rounded-lg shadow-panel-dark flex flex-col overflow-hidden" style={{ maxHeight: maxH }}>
        {/* Header — sticky so it stays visible while scrolling */}
        <div className="flex items-start justify-between px-3 pt-3 pb-2 border-b border-border sticky top-0 bg-surface z-10 shrink-0">
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

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>

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

          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-mono font-medium ${
            gov.uvPeak >= 8
              ? 'bg-amber-100 border-amber-300 text-amber-800'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            {gov.uvPeak >= 8
              ? <TriangleAlert size={10} />
              : <Sun size={10} />
            }
            UV {gov.uvPeak}
          </span>
          {gov.soilPhTypical != null && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-raised border border-border text-xs text-ink">
              <span className="text-2xs">🪨</span>
              <span className="font-mono font-medium">pH {gov.soilPhTypical}</span>
              {gov.soilTexture && <span className="opacity-60 capitalize">{gov.soilTexture}</span>}
            </span>
          )}
        </div>

        {/* UV alert banner — only for high-stress governorates */}
        {gov.uvPeak >= 8 && (
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200">
            <TriangleAlert size={13} className="text-amber-500 shrink-0 mt-px" />
            <div>
              <p className="text-2xs font-semibold text-amber-800">High UV Zone — Index {gov.uvPeak}</p>
              <p className="text-2xs text-amber-700 leading-relaxed mt-0.5">
                Very high UV stress during harvest season. Shade management recommended for sensitive crops.
              </p>
            </div>
          </div>
        )}

        {/* Live weather */}
        <WeatherWidget shapeName={gov.shapeName} />

        {/* Fruit chips */}
        {fruits.length > 0 && (
          <div className="px-3 py-2">
            <p className="text-2xs text-muted uppercase tracking-widest mb-1.5 font-medium">{tMap('fruitsLabel')}</p>
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

        {/* Comparable regions button — shown when a fruit is selected and live API is available */}
        {selectedFruitId && gov.id != null && onOpenComparablePanel && (
          <div className="border-t border-border">
            <button
              onClick={onOpenComparablePanel}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-muted hover:text-gold hover:bg-surface-raised transition-colors"
            >
              <GitCompare size={12} className="shrink-0" />
              <span>Comparable regions for {selectedFruitName || selectedFruitId}</span>
            </button>
          </div>
        )}

        </div>{/* end scrollable body */}
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
