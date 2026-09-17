export type FieldWeather = {
  tempF: number
  feelsF: number
  windMph: number
  windDir: string
  humidity: number
  condition: string
  precipProb: number
  visibilityMi: number | null
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

export async function fetchFieldWeather(lat: number, lon: number): Promise<FieldWeather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation',
  )
  url.searchParams.set('hourly', 'precipitation_probability,visibility')
  url.searchParams.set('forecast_days', '1')
  url.searchParams.set('temperature_unit', 'celsius')
  url.searchParams.set('wind_speed_unit', 'kmh')
  url.searchParams.set('timezone', 'auto')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Weather unavailable')
  const data = await res.json()
  const c = data.current

  const hourIdx = Array.isArray(data.hourly?.time)
    ? Math.min(
        data.hourly.time.findIndex((t: string) => t === data.current?.time) >= 0
          ? data.hourly.time.findIndex((t: string) => t === data.current?.time)
          : new Date().getHours(),
        (data.hourly.precipitation_probability?.length ?? 1) - 1,
      )
    : 0

  const precipProb = data.hourly?.precipitation_probability?.[hourIdx] ?? 0
  const visibilityM = data.hourly?.visibility?.[hourIdx]

  return {
    tempF: cToF(c.temperature_2m),
    feelsF: cToF(c.apparent_temperature),
    windMph: kmhToMph(c.wind_speed_10m),
    windDir: degToCompass(c.wind_direction_10m ?? 0),
    humidity: Math.round(c.relative_humidity_2m ?? 0),
    condition: WMO[c.weather_code as number] ?? 'Variable',
    precipProb: Math.round(precipProb),
    visibilityMi:
      typeof visibilityM === 'number' ? Math.round((visibilityM / 1609.34) * 10) / 10 : null,
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
