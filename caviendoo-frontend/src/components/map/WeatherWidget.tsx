'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Thermometer, Droplets, Wind, Sun } from 'lucide-react';
import { getGovernorateWeather } from '@/services/dataService';
import { useAtlasStore } from '@/store';
import type { CurrentWeather, ClimateClimatology } from '@/types';

interface WeatherWidgetProps {
  shapeName: string;
}

export function WeatherWidget({ shapeName }: WeatherWidgetProps) {
  const t = useTranslations('weather');
  const locale = useAtlasStore((s) => s.locale);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [climate, setClimate] = useState<ClimateClimatology | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getGovernorateWeather(shapeName).then((data) => {
      if (data) {
        setWeather(data.weather);
        setClimate(data.climate);
      }
      setLoading(false);
    });
  }, [shapeName]);

  if (loading) {
    return (
      <div className="px-3 py-2 border-t border-border">
        <div className="flex gap-2 animate-pulse">
          <div className="h-3 w-16 bg-ink/8 rounded" />
          <div className="h-3 w-12 bg-ink/8 rounded" />
          <div className="h-3 w-14 bg-ink/8 rounded" />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const conditionText = weather.condition[locale] ?? weather.condition.en;

  return (
    <div className="px-3 py-2 border-t border-border">
      <p className="text-2xs text-muted uppercase tracking-widest mb-1.5 font-medium">{t('title')}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="flex items-center gap-1 text-xs text-ink">
          <Thermometer size={10} className="text-gold shrink-0" />
          <span className="font-mono font-medium">{weather.temperature}°C</span>
          <span className="text-muted text-2xs truncate">{conditionText}</span>
        </span>
        <span className="flex items-center gap-1 text-xs text-ink">
          <Droplets size={10} className="text-blue-500 shrink-0" />
          <span className="font-mono font-medium">{weather.humidity}%</span>
        </span>
        <span className="flex items-center gap-1 text-xs text-ink">
          <Wind size={10} className="text-slate-400 shrink-0" />
          <span className="font-mono font-medium">{weather.windSpeed} km/h</span>
        </span>
        <span className="flex items-center gap-1 text-xs text-ink">
          <Sun size={10} className="text-amber-500 shrink-0" />
          <span className="font-mono font-medium">UV {weather.uvIndex}</span>
        </span>
      </div>
      {climate && (
        <p className="text-2xs text-muted mt-1">
          {t('climateAvg')}: {climate.tempCMean.toFixed(1)}°C · {climate.precipMmYear.toFixed(0)} mm/yr
        </p>
      )}
    </div>
  );
}
