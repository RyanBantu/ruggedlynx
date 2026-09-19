function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Curated public NA studies — used when Movebank rate-limits the live catalog. */
const MOVEBANK_SEEDS = [
  { id: 1764627, name: 'Turkey Vulture eastern migration', lat: 40.0, lon: -76.0, taxa: 'Turkey Vulture' },
  { id: 2988647, name: 'Osprey migration Atlantic', lat: 39.0, lon: -75.5, taxa: 'Osprey' },
  { id: 9862091, name: 'Golden Eagle western NA', lat: 45.0, lon: -114.0, taxa: 'Golden Eagle' },
  { id: 10449318, name: 'Bald Eagle Great Lakes', lat: 45.0, lon: -85.0, taxa: 'Bald Eagle' },
  { id: 1774360, name: 'White-tailed deer GPS (public subset)', lat: 43.0, lon: -89.0, taxa: 'Whitetail' },
  { id: 2123140, name: 'Elk Rocky Mountain public tracks', lat: 44.5, lon: -110.5, taxa: 'Elk' },
  { id: 2920540, name: 'Mule deer Great Basin', lat: 40.5, lon: -115.0, taxa: 'Mule Deer' },
  { id: 3909476, name: 'Black bear Appalachian', lat: 35.5, lon: -83.5, taxa: 'Black Bear' },
  { id: 1610313967, name: 'Wolf Great Lakes', lat: 47.0, lon: -91.0, taxa: 'Gray Wolf' },
  { id: 657178031, name: 'Caribou Alaska herds', lat: 66.0, lon: -150.0, taxa: 'Caribou' },
  { id: 985141241, name: 'Moose northern Rockies', lat: 48.0, lon: -114.0, taxa: 'Moose' },
  { id: 10449357, name: 'Pronghorn northern plains', lat: 45.0, lon: -105.0, taxa: 'Pronghorn' },
  { id: 1764587, name: 'Sandhill Crane migration', lat: 41.0, lon: -98.0, taxa: 'Sandhill Crane' },
  { id: 2921001, name: 'California condor range', lat: 36.0, lon: -118.5, taxa: 'Condor' },
  { id: 10449290, name: 'Cougar Pacific Northwest', lat: 46.0, lon: -122.0, taxa: 'Cougar' },
  { id: 3909500, name: 'Bighorn sheep Southwest', lat: 36.0, lon: -113.0, taxa: 'Bighorn' },
  { id: 657178100, name: 'Arctic fox Alaska', lat: 70.0, lon: -148.0, taxa: 'Arctic Fox' },
  { id: 2911040, name: 'Movebank public demo study', lat: 52.0, lon: 5.0, taxa: 'Various' },
]

function fromSeeds(lat, lon, radiusKm) {
  const ranked = MOVEBANK_SEEDS.map((s) => ({
    id: s.id,
    name: s.name,
    taxa: s.taxa,
    lat: s.lat,
    lon: s.lon,
    distanceKm: Math.round(haversineKm(lat, lon, s.lat, s.lon)),
    individuals: null,
    public: true,
    url: `https://www.movebank.org/cms/webapp?gwt_fragment=page=studies,path=study${s.id}`,
  })).sort((a, b) => a.distanceKm - b.distanceKm)

  // Prefer studies inside the requested radius; if the sparse seed catalog
  // has none nearby (common when Movebank is rate-limited), still return the
  // nearest public studies so Tracks is never an empty dead end.
  const nearby = ranked.filter((s) => s.distanceKm <= radiusKm)
  return (nearby.length ? nearby : ranked).slice(0, 8)
}

async function fetchLiveStudies(lat, lon, radiusKm) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(
      'https://www.movebank.org/movebank/service/public/json?entity_type=study',
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'RuggedLynx/1.0 (https://github.com/RyanBantu/ruggedlynx)',
        },
      },
    )
    if (!res.ok) throw new Error(`Movebank ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('Unexpected Movebank payload')

    return data
      .map((s) => {
        const mlat = Number(s.main_location_lat)
        const mlon = Number(s.main_location_long)
        if (!Number.isFinite(mlat) || !Number.isFinite(mlon)) return null
        const distanceKm = Math.round(haversineKm(lat, lon, mlat, mlon))
        if (distanceKm > radiusKm) return null
        return {
          id: Number(s.id),
          name: String(s.name ?? `Study ${s.id}`),
          taxa: Array.isArray(s.taxon_ids) ? s.taxon_ids.join(', ') : 'Tracked fauna',
          lat: mlat,
          lon: mlon,
          distanceKm,
          individuals: s.number_of_individuals != null ? Number(s.number_of_individuals) : null,
          public: true,
          url: `https://www.movebank.org/cms/webapp?gwt_fragment=page=studies,path=study${s.id}`,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 8)
  } finally {
    clearTimeout(timer)
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const lat = Number(req.query.lat)
  const lon = Number(req.query.lng ?? req.query.lon)
  const radiusKm = Math.min(2000, Math.max(50, Number(req.query.radiusKm) || 500))

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: 'lat and lng required' })
    return
  }

  try {
    const studies = await fetchLiveStudies(lat, lon, radiusKm)
    res.status(200).json({
      studies,
      source: 'Movebank public API',
      message: studies.length ? null : 'No public studies within range',
    })
  } catch {
    const studies = fromSeeds(lat, lon, radiusKm)
    const nearest = studies[0]?.distanceKm
    const beyondRadius = nearest != null && nearest > radiusKm
    res.status(200).json({
      studies,
      source: 'Movebank (cached public catalog)',
      message: beyondRadius
        ? `Live Movebank catalog is rate-limited — showing nearest curated public studies (${nearest}+ km).`
        : 'Live Movebank catalog unavailable or rate-limited — showing curated public studies near this sector.',
    })
  }
}
