import { useEffect, useId, useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import { Globe } from './components/Globe'
import { SectorBurst } from './components/SectorBurst'
import { lookupRegionByZip, type Region } from './data/animals'
import {
  fetchFieldWeather,
  formatLocalDate,
  formatLocalTime,
  type FieldWeather,
} from './utils/weather'
import './App.css'

export default function App() {
  const [zip, setZip] = useState('')
  const [region, setRegion] = useState<Region | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [weather, setWeather] = useState<FieldWeather | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [clock, setClock] = useState(() => Date.now())
  const inputId = useId()

  useEffect(() => {
    if (!region) return
    const id = window.setInterval(() => setClock(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [region])

  useEffect(() => {
    if (!region) {
      setWeather(null)
      setWeatherError(null)
      return
    }

    let cancelled = false
    setWeather(null)
    setWeatherError(null)

    void fetchFieldWeather(region.lat, region.lon)
      .then((w) => {
        if (!cancelled) setWeather(w)
      })
      .catch(() => {
        if (!cancelled) setWeatherError('Weather feed offline')
      })

    return () => {
      cancelled = true
    }
  }, [region])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const cleaned = zip.replace(/\D/g, '').slice(0, 5)
    if (cleaned.length < 5) {
      setError('Enter a valid 5-digit U.S. ZIP.')
      setRegion(null)
      return
    }

    startTransition(() => {
      const found = lookupRegionByZip(cleaned)
      if (!found) {
        setError('No sector match for that ZIP. Try an adjacent code.')
        setRegion(null)
        return
      }
      setError('')
      setRegion(found)
    })
  }

  const clearSector = () => {
    setRegion(null)
    setError('')
  }

  const now = new Date(clock)
  const localTime = region ? formatLocalTime(region.timezone, now) : ''
  const localDate = region ? formatLocalDate(region.timezone, now) : ''

  const globeStatus = region
    ? `TARGET LOCK · ${region.lat.toFixed(1)}°N · ${Math.abs(region.lon).toFixed(1)}°W`
    : 'ORBITAL SCAN · STANDING BY'

  return (
    <div className={`page ${region ? 'is-locked' : ''}`}>
      <div className="atmosphere" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />

      <header className="topbar">
        <a className="logo" href="#top">
          <span className="logo-mark" aria-hidden="true" />
          <span className="logo-text">
            RuggedLynx
            <span className="logo-sub">FIELD SYSTEMS</span>
          </span>
        </a>
        <nav className="top-nav">
          <span className="sys-chip">{region ? 'SECTOR · LOCKED' : 'SYS · ONLINE'}</span>
          {region ? (
            <button type="button" className="top-link top-btn" onClick={clearSector}>
              Clear sector
            </button>
          ) : null}
        </nav>
      </header>

      <main id="top" className="viewport">
        <section className="hero">
          <div className="hero-copy">
            <p className="brand-signal">RuggedLynx</p>
            <h1>{region ? 'Sector acquired.' : 'Geospatial intel for the stand.'}</h1>
            <p className="lede">
              {region
                ? 'Game profiles radiate from your pin — weather, time, and terrain update live.'
                : 'Enter a ZIP. The globe locks on, then species and field conditions pop from the hit.'}
            </p>

            <form className="zip-form" onSubmit={onSubmit}>
              <div className="zip-field">
                <label htmlFor={inputId}>Sector ZIP</label>
                <input
                  id={inputId}
                  className="zip-input"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000"
                  maxLength={5}
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                />
              </div>
              <button className="zip-btn" type="submit" disabled={isPending}>
                {isPending ? 'Acquiring…' : region ? 'Re-acquire' : 'Acquire sector'}
              </button>
            </form>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
          </div>

          <div className="hero-globe">
            <Globe
              target={region ? { lat: region.lat, lon: region.lon } : null}
              highlight={Boolean(region)}
              statusLabel={globeStatus}
            />
            {region ? (
              <SectorBurst
                region={region}
                weather={weather}
                weatherError={weatherError}
                localTime={localTime}
                localDate={localDate}
              />
            ) : null}
          </div>
        </section>
      </main>

      <footer className="footer">
        <span className="logo footer-logo">
          <span className="logo-mark" aria-hidden="true" />
          RuggedLynx
        </span>
        <p>Trail imaging · sector intelligence · made for hunters.</p>
      </footer>
    </div>
  )
}
