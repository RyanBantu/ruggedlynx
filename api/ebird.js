export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const key = process.env.EBIRD_API_KEY || process.env.VITE_EBIRD_API_KEY
  if (!key) {
    res.status(200).json({
      observations: [],
      source: 'eBird',
      message:
        'Add a free eBird API key as EBIRD_API_KEY (get one at https://ebird.org/api/keygen).',
    })
    return
  }

  const lat = Number(req.query.lat)
  const lng = Number(req.query.lng ?? req.query.lon)
  const dist = Math.min(50, Math.max(1, Number(req.query.dist) || 40))
  const back = Math.min(30, Math.max(1, Number(req.query.back) || 14))
  const maxResults = Math.min(50, Math.max(1, Number(req.query.maxResults) || 12))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: 'lat and lng required' })
    return
  }

  const url = new URL('https://api.ebird.org/v2/data/obs/geo/recent')
  url.searchParams.set('lat', lat.toFixed(2))
  url.searchParams.set('lng', lng.toFixed(2))
  url.searchParams.set('dist', String(dist))
  url.searchParams.set('back', String(back))
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('sort', 'date')

  try {
    const upstream = await fetch(url.toString(), {
      headers: {
        'X-eBirdApiToken': key,
        Accept: 'application/json',
      },
    })
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      res.status(200).json({
        observations: [],
        source: 'eBird',
        message: `eBird returned ${upstream.status}${detail ? `: ${detail.slice(0, 120)}` : ''}`,
      })
      return
    }
    const raw = await upstream.json()
    const observations = (Array.isArray(raw) ? raw : []).map((o) => ({
      name: o.comName,
      sciName: o.sciName,
      count: o.howMany ?? null,
      locName: o.locName,
      obsDt: o.obsDt,
      lat: o.lat,
      lng: o.lng,
      howMany: o.howMany ?? null,
    }))
    res.status(200).json({ observations, source: 'eBird', message: null })
  } catch (err) {
    res.status(200).json({
      observations: [],
      source: 'eBird',
      message: `eBird request failed${err?.message ? `: ${err.message}` : ''}`,
    })
  }
}
