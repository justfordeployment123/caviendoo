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

const POP_W = 360;
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

  const popW = Math.min(POP_W, containerWidth - 20);
  const spaceAbove = cy + OFFSET_Y;
  const spaceBelow = containerHeight - cy - 24;
  const maxPopH = 480;
  const rawTop = cy + OFFSET_Y - Math.min(maxPopH, spaceAbove - 8);
  const top = spaceAbove > 160 ? Math.max(8, rawTop) : cy + 24;
  const maxH = spaceAbove > 160
    ? Math.min(maxPopH, spaceAbove - 8)
    : Math.min(maxPopH, spaceBelow - 8);
  const rawLeft = cx - popW / 2;
  const left = Math.max(8, Math.min(rawLeft, containerWidth - popW - 8));

  const chipClass = getAquiferChipClass(gov.aquiferStressPct);
  const isAbove = spaceAbove > 160;

  return (
    <div
      ref={popupRef}
      className="absolute z-20 animate-fade-in"
      style={{ top, left, width: popW, maxHeight: maxH }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-surface border border-border rounded-xl shadow-panel-dark flex flex-col overflow-hidden" style={{ maxHeight: maxH }}>
        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-border sticky top-0 bg-surface z-10 shrink-0">
          <div>
            <h3 className="text-cream font-serif text-xl font-semibold leading-tight">
              {gov.shapeName}
            </h3>
            <p className="text-muted text-xs mt-0.5 font-mono">{gov.shapeISO}</p>
          </div>
          <button
            onClick={() => setSelectedGovernorate(null)}
            className="text-muted hover:text-cream transition-colors mt-0.5 p-1.5 -me-1 rounded-lg hover:bg-ink/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>

        {/* Description */}
        {gov.description && (
          <div className="px-4 pt-3 pb-2">
            <p className="text-sm text-muted leading-relaxed">
              {gov.description}
            </p>
          </div>
        )}

        {/* Data chips */}
        <div className="flex gap-2 px-4 py-3 border-b border-border flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised text-sm text-cream border border-border">
            <Leaf size={12} className="text-gold" />
            <span className="font-mono font-semibold">{gov.fruitCount}</span>
            <span className="text-muted">fruits</span>
          </span>

          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm badge ${chipClass}`}>
            <Droplets size={12} />
            <span className="font-mono font-semibold">{gov.aquiferStressPct}%</span>
            <span className="opacity-80">{getAquiferLabel(gov.aquiferStressPct)}</span>
          </span>

          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border font-mono font-semibold ${
            gov.uvPeak >= 8
              ? 'bg-amber-100 border-amber-300 text-amber-800'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            {gov.uvPeak >= 8
              ? <TriangleAlert size={12} />
              : <Sun size={12} />
            }
            UV {gov.uvPeak}
          </span>
          {gov.soilPhTypical != null && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised border border-border text-sm text-cream">
              <span className="text-xs">🪨</span>
              <span className="font-mono font-semibold">pH {gov.soilPhTypical}</span>
              {gov.soilTexture && <span className="opacity-60 capitalize text-muted">{gov.soilTexture}</span>}
            </span>
          )}
        </div>

        {/* UV alert banner */}
        {gov.uvPeak >= 8 && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border-b border-amber-200">
            <TriangleAlert size={15} className="text-amber-500 shrink-0 mt-px" />
            <div>
              <p className="text-sm font-semibold text-amber-800">High UV Zone — Index {gov.uvPeak}</p>
              <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                Very high UV stress during harvest season. Shade management recommended for sensitive crops.
              </p>
            </div>
          </div>
        )}

        {/* Live weather */}
        <WeatherWidget shapeName={gov.shapeName} />

        {/* Fruit chips */}
        {fruits.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs text-muted uppercase tracking-widest mb-2 font-semibold">{tMap('fruitsLabel')}</p>
            <div className="flex flex-wrap gap-2">
              {fruits.slice(0, 6).map((fruit) => (
                <button
                  key={fruit.id}
                  onClick={() => {
                    setSelectedFruitId(fruit.id);
                    setSelectedGovernorate(null);
                  }}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors bg-surface-raised border border-border text-cream hover:border-gold hover:text-gold"
                >
                  {fruit.name[locale]}
                </button>
              ))}
              {fruits.length === 7 && (
                <span className="px-3 py-1 text-xs text-muted">+more</span>
              )}
            </div>
          </div>
        )}

        {/* Comparable regions button */}
        {selectedFruitId && gov.id != null && onOpenComparablePanel && (
          <div className="border-t border-border">
            <button
              onClick={onOpenComparablePanel}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted hover:text-gold hover:bg-surface-raised transition-colors"
            >
              <GitCompare size={14} className="shrink-0" />
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
            bottom: -7,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '7px solid #A8CA6A',
          }}
        />
      )}
    </div>
  );
}
