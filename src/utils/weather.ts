export type DayForecast = {
  date: string
  label: string
  highF: number
  lowF: number
  condition: string
  precipProb: number
  windMph: number
}

export type FieldWeather = {
  tempF: number
  feelsF: number
  windMph: number
  windDir: string
  windGustMph: number | null
  humidity: number
  condition: string
  precipProb: number
  precipIn: number
  visibilityMi: number | null
  cloudCover: number | null
  pressureInHg: number | null
  sunrise: string | null
  sunset: string | null
  huntTip: string
  daily: DayForecast[]
  source: string
}

const WMO: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm / hail',
  99: 'Thunderstorm / hail',
}

function degToCompass(deg: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function cToF(c: number) {
  return Math.round((c * 9) / 5 + 32)
}

function kmhToMph(kmh: number) {
  return Math.round(kmh * 0.621371)
}

function mmToIn(mm: number) {
  return Math.round((mm / 25.4) * 100) / 100
}

function hPaToInHg(hpa: number) {
  return Math.round(hpa * 0.02953 * 100) / 100
}

function formatSun(iso: string | null | undefined, timezone: string) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(iso))
  } catch {
    return null
  }
}

function dayLabel(isoDate: string, timezone: string, index: number) {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    }).format(new Date(`${isoDate}T12:00:00`))
  } catch {
    return isoDate
  }
}

function buildHuntTip(w: {
  tempF: number
  windMph: number
  precipProb: number
  condition: string
  cloudCover: number | null
}) {
  const tips: string[] = []
  if (w.windMph >= 15) tips.push('High wind — game holds tight; hunt lee edges and thick cover.')
  else if (w.windMph <= 5) tips.push('Light wind — scent cones long; play thermals carefully.')
  if (w.precipProb >= 60) tips.push('Wet period incoming — movement often spikes just before and after.')
  if (w.tempF <= 35) tips.push('Cold sit — expect midday scrapes and south-facing slopes.')
  if (w.tempF >= 75) tips.push('Heat stress — prioritize shade, water, and dawn/dusk only.')
  if (/fog/i.test(w.condition)) tips.push('Fog — sound carries; keep cam angles tight on funnels.')
  if ((w.cloudCover ?? 50) < 30 && w.tempF < 55)
    tips.push('Clear & cool — classic dawn/dusk traffic on open edges.')
  if (!tips.length) tips.push('Stable pattern — trust known trails and refresh cams after the next front.')
  return tips[0]
}

export async function fetchFieldWeather(lat: number, lon: number): Promise<FieldWeather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'precipitation',
      'cloud_cover',
      'surface_pressure',
    ].join(','),
  )
  url.searchParams.set(
    'hourly',
    'precipitation_probability,visibility,temperature_2m,weather_code',
  )
  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'sunrise',
      'sunset',
    ].join(','),
  )
  url.searchParams.set('forecast_days', '5')
  url.searchParams.set('temperature_unit', 'celsius')
  url.searchParams.set('wind_speed_unit', 'kmh')
  url.searchParams.set('timezone', 'auto')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Weather unavailable')
  const data = await res.json()
  const c = data.current
  const timezone: string = data.timezone ?? 'UTC'

  const hourIdx = Array.isArray(data.hourly?.time)
    ? Math.max(
        0,
        Math.min(
          data.hourly.time.findIndex((t: string) => t === data.current?.time) >= 0
            ? data.hourly.time.findIndex((t: string) => t === data.current?.time)
            : new Date().getHours(),
          (data.hourly.precipitation_probability?.length ?? 1) - 1,
        ),
      )
    : 0

  const precipProb = Math.round(data.hourly?.precipitation_probability?.[hourIdx] ?? 0)
  const visibilityM = data.hourly?.visibility?.[hourIdx]
  const tempF = cToF(c.temperature_2m)
  const windMph = kmhToMph(c.wind_speed_10m)
  const condition = WMO[c.weather_code as number] ?? 'Variable'
  const cloudCover =
    typeof c.cloud_cover === 'number' ? Math.round(c.cloud_cover) : null

  const daily: DayForecast[] = []
  const days = data.daily?.time?.length ?? 0
  for (let i = 0; i < Math.min(days, 5); i++) {
    daily.push({
      date: data.daily.time[i],
      label: dayLabel(data.daily.time[i], timezone, i),
      highF: cToF(data.daily.temperature_2m_max[i]),
      lowF: cToF(data.daily.temperature_2m_min[i]),
      condition: WMO[data.daily.weather_code[i] as number] ?? 'Variable',
      precipProb: Math.round(data.daily.precipitation_probability_max?.[i] ?? 0),
      windMph: kmhToMph(data.daily.wind_speed_10m_max?.[i] ?? 0),
    })
  }

  return {
    tempF,
    feelsF: cToF(c.apparent_temperature),
    windMph,
    windDir: degToCompass(c.wind_direction_10m ?? 0),
    windGustMph:
      typeof c.wind_gusts_10m === 'number' ? kmhToMph(c.wind_gusts_10m) : null,
    humidity: Math.round(c.relative_humidity_2m ?? 0),
    condition,
    precipProb,
    precipIn: mmToIn(c.precipitation ?? 0),
    visibilityMi:
      typeof visibilityM === 'number' ? Math.round((visibilityM / 1609.34) * 10) / 10 : null,
    cloudCover,
    pressureInHg:
      typeof c.surface_pressure === 'number' ? hPaToInHg(c.surface_pressure) : null,
    sunrise: formatSun(data.daily?.sunrise?.[0], timezone),
    sunset: formatSun(data.daily?.sunset?.[0], timezone),
    huntTip: buildHuntTip({ tempF, windMph, precipProb, condition, cloudCover }),
    daily,
    source: 'Open-Meteo',
  }
}

export function formatLocalTime(timezone: string, date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatLocalDate(timezone: string, date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
