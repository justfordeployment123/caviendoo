/**
 * Open-Meteo weather service — free, no API key required.
 * https://open-meteo.com/en/docs
 */

export interface CurrentWeather {
  temperature:  number;
  humidity:     number;
  precipitation: number;
  weatherCode:  number;
  condition:    { en: string; fr: string; ar: string };
  windSpeed:    number;
  uvIndex:      number;
  soilMoisture: number;  // m³/m³
  timestamp:    string;  // ISO timestamp
}

const WMO: Record<number, { en: string; fr: string; ar: string }> = {
  0:  { en: 'Clear sky',              fr: 'Ciel dégagé',              ar: 'سماء صافية' },
  1:  { en: 'Mainly clear',           fr: 'Principalement dégagé',    ar: 'صافٍ في الغالب' },
  2:  { en: 'Partly cloudy',          fr: 'Partiellement nuageux',    ar: 'غائم جزئياً' },
  3:  { en: 'Overcast',               fr: 'Couvert',                  ar: 'ملبد بالغيوم' },
  45: { en: 'Fog',                    fr: 'Brouillard',               ar: 'ضبابي' },
  48: { en: 'Freezing fog',           fr: 'Brouillard givrant',       ar: 'ضباب متجمد' },
  51: { en: 'Light drizzle',          fr: 'Bruine légère',            ar: 'رذاذ خفيف' },
  53: { en: 'Moderate drizzle',       fr: 'Bruine modérée',           ar: 'رذاذ معتدل' },
  55: { en: 'Dense drizzle',          fr: 'Bruine dense',             ar: 'رذاذ كثيف' },
  61: { en: 'Slight rain',            fr: 'Pluie légère',             ar: 'مطر خفيف' },
  63: { en: 'Moderate rain',          fr: 'Pluie modérée',            ar: 'مطر معتدل' },
  65: { en: 'Heavy rain',             fr: 'Pluie forte',              ar: 'مطر غزير' },
  71: { en: 'Slight snowfall',        fr: 'Légère chute de neige',    ar: 'ثلج خفيف' },
  73: { en: 'Moderate snowfall',      fr: 'Chute de neige modérée',   ar: 'ثلج معتدل' },
  75: { en: 'Heavy snowfall',         fr: 'Forte chute de neige',     ar: 'ثلج كثيف' },
  80: { en: 'Slight rain showers',    fr: 'Légères averses',          ar: 'زخات خفيفة' },
  81: { en: 'Moderate rain showers',  fr: 'Averses modérées',         ar: 'زخات معتدلة' },
  82: { en: 'Violent rain showers',   fr: 'Averses violentes',        ar: 'زخات عنيفة' },
  85: { en: 'Slight snow showers',    fr: 'Légères averses de neige', ar: 'زخات ثلج خفيفة' },
  86: { en: 'Heavy snow showers',     fr: 'Fortes averses de neige',  ar: 'زخات ثلج كثيفة' },
  95: { en: 'Thunderstorm',           fr: 'Orage',                    ar: 'عاصفة رعدية' },
  96: { en: 'Thunderstorm with hail', fr: 'Orage avec grêle',         ar: 'عاصفة رعدية مع برد' },
  99: { en: 'Thunderstorm with heavy hail', fr: 'Orage avec forte grêle', ar: 'عاصفة مع برد كثيف' },
};

function wmoCondition(code: number): { en: string; fr: string; ar: string } {
  return WMO[code] ?? { en: 'Unknown', fr: 'Inconnu', ar: 'غير معروف' };
}

export async function getCurrentWeather(lat: number, lng: number): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude:  String(lat),
    longitude: String(lng),
    current:   'temperature_2m,relative_humidity_2m,precipitation,weathercode,wind_speed_10m,uv_index,soil_moisture_0_to_1cm',
    wind_speed_unit: 'kmh',
    timezone:  'auto',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);

  const json = await res.json() as any;
  const c    = json.current;

  return {
    temperature:  c.temperature_2m,
    humidity:     c.relative_humidity_2m,
    precipitation: c.precipitation,
    weatherCode:  c.weathercode,
    condition:    wmoCondition(c.weathercode),
    windSpeed:    c.wind_speed_10m,
    uvIndex:      c.uv_index ?? 0,
    soilMoisture: c.soil_moisture_0_to_1cm ?? 0,
    timestamp:    c.time,
  };
}
