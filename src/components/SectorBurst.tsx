import { useEffect, useMemo, useState } from 'react'
import { AnimalMark } from './AnimalMark'
import {
  CLASS_LABEL,
  type Animal,
  type Region,
} from '../data/animals'
import type { FieldWeather } from '../utils/weather'
import type { WildlifeFeeds } from '../utils/wildlifeFeeds'

type Props = {
  region: Region
  weather: FieldWeather | null
  weatherError: string | null
  wildlife: WildlifeFeeds | null
  localTime: string
  localDate: string
}

/** Place animal nodes on left/right arcs so lines radiate from the pin (center). */
function layoutAnimals(count: number) {
  const left = Math.ceil(count / 2)
  const right = count - left
  const nodes: Array<{ x: number; y: number; side: 'left' | 'right' }> = []

  for (let i = 0; i < left; i++) {
    const t = left === 1 ? 0.5 : i / (left - 1)
    nodes.push({
      side: 'left',
      x: 4 + (i % 2) * 2.5,
      y: 8 + t * 52,
    })
  }
  for (let i = 0; i < right; i++) {
    const t = right === 1 ? 0.5 : i / (right - 1)
    nodes.push({
      side: 'right',
      x: 76 - (i % 2) * 2.5,
      y: 8 + t * 52,
    })
  }
  return nodes
}

export function SectorBurst({
  region,
  weather,
  weatherError,
  wildlife,
  localTime,
  localDate,
}: Props) {
  const animals = region.animals
  const positions = useMemo(() => layoutAnimals(animals.length), [animals.length])
  const origin = { x: 50, y: 48 }
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setExpandedId(null)
  }, [region.id])

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="sector-burst" aria-live="polite">
      <svg className="burst-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {positions.map((pos, i) => {
          const midX = pos.side === 'left' ? origin.x - 12 : origin.x + 12
          return (
            <path
              key={animals[i]?.id ?? i}
              className="burst-path"
              d={`M ${origin.x} ${origin.y} Q ${midX} ${pos.y} ${pos.x + (pos.side === 'left' ? 18 : 0)} ${pos.y}`}
              style={{ animationDelay: `${120 + i * 70}ms` }}
            />
          )
        })}
        <circle className="burst-origin" cx={origin.x} cy={origin.y} r="1.1" />
      </svg>

      <ul className="burst-animals">
        {animals.map((animal, i) => {
          const pos = positions[i]
          if (!pos) return null
          const open = expandedId === animal.id
          return (
            <li
              key={animal.id}
              className={`burst-node burst-${pos.side}${open ? ' is-expanded' : ''}${
                expandedId && !open ? ' is-dimmed' : ''
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                animationDelay: `${180 + i * 70}ms`,
                zIndex: open ? 20 : 5,
              }}
            >
              <AnimalChip
                animal={animal}
                expanded={open}
                onToggle={() => toggle(animal.id)}
              />
            </li>
          )
        })}
      </ul>

      <aside className="field-panel">
        <div className="field-panel-head">
          <span className="field-kicker">Sector lock</span>
          <h2>{region.name}</h2>
          <p>{region.blurb}</p>
        </div>

        <div className="field-grid">
          <div className="field-cell">
            <span className="field-label">Local time</span>
            <strong>{localTime}</strong>
            <span className="field-sub">{localDate}</span>
          </div>
          <div className="field-cell">
            <span className="field-label">Conditions</span>
            <strong>{weather ? `${weather.tempF}°F` : '—'}</strong>
            <span className="field-sub">
              {weather
                ? `${weather.condition} · feels ${weather.feelsF}°`
                : weatherError ?? 'Reading Open-Meteo…'}
            </span>
          </div>
          <div className="field-cell">
            <span className="field-label">Wind</span>
            <strong>{weather ? `${weather.windMph} mph` : '—'}</strong>
            <span className="field-sub">
              {weather
                ? `${weather.windDir}${
                    weather.windGustMph != null ? ` · gust ${weather.windGustMph}` : ''
                  } · ${weather.humidity}% RH`
                : '—'}
            </span>
          </div>
          <div className="field-cell">
            <span className="field-label">Precip</span>
            <strong>{weather ? `${weather.precipProb}%` : '—'}</strong>
            <span className="field-sub">
              {weather
                ? `${weather.precipIn}" now${
                    weather.visibilityMi != null ? ` · vis ${weather.visibilityMi} mi` : ''
                  }`
                : 'Chance next hour'}
            </span>
          </div>
        </div>

        {weather ? (
          <div className="weather-report">
            <div className="weather-report-head">
              <span className="field-label">Weather report</span>
              <span className="weather-source">{weather.source}</span>
            </div>
            <p className="weather-hunt-tip">{weather.huntTip}</p>
            <div className="weather-meta">
              {weather.sunrise ? (
                <span>
                  Sunrise <strong>{weather.sunrise}</strong>
                </span>
              ) : null}
              {weather.sunset ? (
                <span>
                  Sunset <strong>{weather.sunset}</strong>
                </span>
              ) : null}
              {weather.cloudCover != null ? (
                <span>
                  Clouds <strong>{weather.cloudCover}%</strong>
                </span>
              ) : null}
              {weather.pressureInHg != null ? (
                <span>
                  Pressure <strong>{weather.pressureInHg}"</strong>
                </span>
              ) : null}
            </div>
            {weather.daily.length ? (
              <ul className="forecast-row">
                {weather.daily.map((day) => (
                  <li key={day.date}>
                    <span className="forecast-day">{day.label}</span>
                    <strong>
                      {day.highF}° / {day.lowF}°
                    </strong>
                    <span className="forecast-cond">{day.condition}</span>
                    <span className="forecast-extra">
                      {day.precipProb}% · {day.windMph} mph
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="live-feeds">
          <div className="live-feed">
            <div className="weather-report-head">
              <span className="field-label">Recent birds · eBird</span>
              <span className="weather-source">{wildlife?.birdSource ?? 'eBird'}</span>
            </div>
            {!wildlife ? (
              <p className="feed-empty">Pulling nearby checklists…</p>
            ) : wildlife.birdError && !wildlife.birds.length ? (
              <p className="feed-empty">{wildlife.birdError}</p>
            ) : wildlife.birds.length ? (
              <ul className="feed-list">
                {wildlife.birds.map((b) => (
                  <li key={`${b.sciName}-${b.obsDt}-${b.locName}`}>
                    <strong>{b.name}</strong>
                    <span>
                      {b.howMany != null ? `${b.howMany} · ` : ''}
                      {b.obsDt}
                    </span>
                    <span className="feed-loc">{b.locName}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="feed-empty">No recent public sightings in range.</p>
            )}
          </div>

          <div className="live-feed">
            <div className="weather-report-head">
              <span className="field-label">Movement studies · Movebank</span>
              <span className="weather-source">{wildlife?.studySource ?? 'Movebank'}</span>
            </div>
            {!wildlife ? (
              <p className="feed-empty">Scanning public tracking studies…</p>
            ) : (
              <>
                {wildlife.studyError ? <p className="feed-note">{wildlife.studyError}</p> : null}
                {wildlife.studies.length ? (
                  <ul className="feed-list">
                    {wildlife.studies.map((s) => (
                      <li key={s.id}>
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.name}
                        </a>
                        <span>
                          {s.taxa} · {s.distanceKm} km
                          {s.individuals != null ? ` · ${s.individuals} animals` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="feed-empty">No public studies near this sector.</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="topo-block">
          <span className="field-label">Topography</span>
          <p>{region.topography}</p>
          <div className="topo-tags">
            {region.terrain.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <dl className="topo-meta">
            <div>
              <dt>Elevation</dt>
              <dd>{region.elevation}</dd>
            </div>
            <div>
              <dt>Cover</dt>
              <dd>{region.cover}</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>{region.access}</dd>
            </div>
          </dl>
        </div>

        <div className="hunt-notes">
          <span className="field-label">Hunt notes</span>
          <ul>
            {region.huntNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}

function AnimalChip({
  animal,
  expanded,
  onToggle,
}: {
  animal: Animal
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className={`animal-chip${expanded ? ' is-open' : ''}`}
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <div className="chip-top">
        <AnimalMark id={animal.id} label={animal.name} />
        <span className="chip-class">{CLASS_LABEL[animal.class]}</span>
      </div>
      <div className="chip-body">
        <div className="chip-title">
          <strong>{animal.name}</strong>
          <span>{animal.code}</span>
        </div>
        <p className={expanded ? 'is-full' : ''}>{animal.tip}</p>
        <div className="chip-foot">
          <span className="chip-peak">Peak {animal.peak}</span>
          <span className="chip-expand-hint">{expanded ? 'Collapse' : 'Expand'}</span>
        </div>
      </div>

      {expanded ? (
        <div className="chip-extra">
          <div className="chip-extra-row">
            <span>Class</span>
            <strong>{CLASS_LABEL[animal.class]}</strong>
          </div>
          <div className="chip-extra-row">
            <span>Peak window</span>
            <strong>{animal.peak}</strong>
          </div>
          <div className="chip-extra-row">
            <span>Cam tip</span>
            <strong>Face trails at chest height; check after cold fronts.</strong>
          </div>
        </div>
      ) : null}
    </button>
  )
}
