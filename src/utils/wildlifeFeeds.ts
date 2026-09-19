export type BirdSighting = {
  name: string
  sciName: string
  count: number | null
  locName: string
  obsDt: string
  lat: number
  lng: number
  howMany: number | null
}

export type MovementStudy = {
  id: number
  name: string
  taxa: string
  lat: number
  lon: number
  distanceKm: number
  individuals: number | null
  public: boolean
  url: string
}

export type WildlifeFeeds = {
  birds: BirdSighting[]
  birdError: string | null
  birdSource: string
  studies: MovementStudy[]
  studyError: string | null
  studySource: string
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export { haversineKm }

export async function fetchWildlifeFeeds(lat: number, lon: number): Promise<WildlifeFeeds> {
  const qs = `lat=${lat.toFixed(4)}&lng=${lon.toFixed(4)}`
  const [birdsRes, moveRes] = await Promise.allSettled([
    fetch(`/api/ebird?${qs}&dist=40&back=14&maxResults=12`),
    fetch(`/api/movebank?${qs}&radiusKm=1609`),
  ])

  let birds: BirdSighting[] = []
  let birdError: string | null = null
  let birdSource = 'eBird'

  if (birdsRes.status === 'fulfilled' && birdsRes.value.ok) {
    const data = await birdsRes.value.json()
    birds = Array.isArray(data.observations) ? data.observations : []
    if (data.message) birdError = data.message
    if (data.source) birdSource = data.source
  } else {
    birdError =
      birdsRes.status === 'fulfilled'
        ? `eBird ${birdsRes.value.status}`
        : 'eBird unreachable'
  }

  let studies: MovementStudy[] = []
  let studyError: string | null = null
  let studySource = 'Movebank'

  if (moveRes.status === 'fulfilled' && moveRes.value.ok) {
    const data = await moveRes.value.json()
    studies = Array.isArray(data.studies) ? data.studies : []
    if (data.message) studyError = data.message
    if (data.source) studySource = data.source
  } else {
    studyError =
      moveRes.status === 'fulfilled'
        ? `Movebank ${moveRes.value.status}`
        : 'Movebank unreachable'
  }

  return { birds, birdError, birdSource, studies, studyError, studySource }
}
