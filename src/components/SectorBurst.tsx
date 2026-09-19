import { useEffect, useId, useMemo, useState } from 'react'
import { AnimalMark } from './AnimalMark'
import {
  CLASS_LABEL,
  type Animal,
  type Region,
} from '../data/animals'
import type { FieldWeather } from '../utils/weather'
import type { BirdSighting, WildlifeFeeds } from '../utils/wildlifeFeeds'

type Props = {
  region: Region
  weather: FieldWeather | null
  weatherError: string | null
  wildlife: WildlifeFeeds | null
  localTime: string
  localDate: string
}

type PanelTab = 'conditions' | 'forecast' | 'birds' | 'tracking' | 'terrain'

type AnimalSlot = {
  animal: Animal
  side: 'left' | 'right'
  /** Vertical center of the chip in %, for leader lines */
  y: number
  /** Horizontal anchor of the chip edge facing the globe, in % */
  x: number
}

/** Split species into left/right rails with even vertical spacing (no overlap). */
function layoutAnimals(animals: Animal[]): AnimalSlot[] {
  const leftCount = Math.ceil(animals.length / 2)
  const rightCount = animals.length - leftCount
  const bandTop = 12
  const bandBottom = 88

  const slotY = (index: number, count: number) => {
    if (count <= 0) return 50
    if (count === 1) return (bandTop + bandBottom) / 2
    const t = (index + 0.5) / count
    return bandTop + t * (bandBottom - bandTop)
  }

  return animals.map((animal, i) => {
    const onLeft = i < leftCount
    const localIndex = onLeft ? i : i - leftCount
    const count = onLeft ? leftCount : rightCount
    return {
      animal,
      side: onLeft ? 'left' : 'right',
      y: slotY(localIndex, count),
      x: onLeft ? 18 : 82,
    }
  })
}

export function SectorBurst({
  region,
  weather,
  weatherError,
  wildlife,
  localTime,
  localDate,
}: Props) {
  const slots = useMemo(() => layoutAnimals(region.animals), [region])
  const origin = { x: 50, y: 48 }
  const leftSlots = slots.filter((s) => s.side === 'left')
  const rightSlots = slots.filter((s) => s.side === 'right')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tab, setTab] = useState<PanelTab>('conditions')
  const [panelOpen, setPanelOpen] = useState(true)
  const [selectedBird, setSelectedBird] = useState<BirdSighting | null>(null)
  const [selectedDay, setSelectedDay] = useState(0)
  const tabsId = useId()

  useEffect(() => {
    setExpandedId(null)
    setTab('conditions')
    setPanelOpen(true)
    setSelectedBird(null)
    setSelectedDay(0)
  }, [region.id])

  useEffect(() => {
    if (!wildlife?.birds.length) {
      setSelectedBird(null)
      return
    }
    setSelectedBird((prev) => {
      if (
        prev &&
        wildlife.birds.some(
          (b) =>
            b.sciName === prev.sciName &&
            b.obsDt === prev.obsDt &&
            b.locName === prev.locName,
        )
      ) {
        return prev
      }
      return wildlife.birds[0] ?? null
    })
  }, [wildlife])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const birdCount = wildlife?.birds.length ?? 0
  const studyCount = wildlife?.studies.length ?? 0
  const selectedForecast = weather?.daily[selectedDay] ?? null

  const tabs: Array<{ id: PanelTab; label: string; badge?: string }> = [
    { id: 'conditions', label: 'Now' },
    { id: 'forecast', label: 'Forecast', badge: weather ? '5d' : undefined },
    {
      id: 'birds',
      label: 'Birds',
      badge: birdCount ? String(birdCount) : undefined,
    },
    {
      id: 'tracking',
      label: 'Tracks',
      badge: studyCount ? String(studyCount) : undefined,
    },
    { id: 'terrain', label: 'Terrain' },
  ]

  return (
    <div className="sector-burst" aria-live="polite">
      <div className="burst-sky">
        <svg className="burst-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {slots.map((slot) => {
            const midX = slot.side === 'left' ? origin.x - 14 : origin.x + 14
            const endX = slot.side === 'left' ? slot.x : slot.x
            return (
              <path
                key={slot.animal.id}
                className="burst-path"
                d={`M ${origin.x} ${origin.y} Q ${midX} ${slot.y} ${endX} ${slot.y}`}
                style={{ animationDelay: `${120}ms` }}
              />
            )
          })}
          <circle className="burst-origin" cx={origin.x} cy={origin.y} r="1.2" />
        </svg>

        <div className="burst-animals">
          <ul className="burst-rail burst-rail-left" aria-label="Species left">
            {leftSlots.map((slot, i) => {
              const open = expandedId === slot.animal.id
              return (
                <li
                  key={slot.animal.id}
                  className={`burst-node burst-left${open ? ' is-expanded' : ''}${
                    expandedId && !open ? ' is-dimmed' : ''
                  }`}
                  style={{
                    animationDelay: `${160 + i * 60}ms`,
                    zIndex: open ? 20 : 5,
                  }}
                >
                  <AnimalChip
                    animal={slot.animal}
                    expanded={open}
                    onToggle={() =>
                      setExpandedId((prev) => (prev === slot.animal.id ? null : slot.animal.id))
                    }
                  />
                </li>
              )
            })}
          </ul>
          <ul className="burst-rail burst-rail-right" aria-label="Species right">
            {rightSlots.map((slot, i) => {
              const open = expandedId === slot.animal.id
              return (
                <li
                  key={slot.animal.id}
                  className={`burst-node burst-right${open ? ' is-expanded' : ''}${
                    expandedId && !open ? ' is-dimmed' : ''
                  }`}
                  style={{
                    animationDelay: `${200 + i * 60}ms`,
                    zIndex: open ? 20 : 5,
                  }}
                >
                  <AnimalChip
                    animal={slot.animal}
                    expanded={open}
                    onToggle={() =>
                      setExpandedId((prev) => (prev === slot.animal.id ? null : slot.animal.id))
                    }
                  />
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <aside className={`field-panel${panelOpen ? ' is-open' : ' is-collapsed'}`}>
        <div className="field-panel-head">
          <div className="field-panel-title">
            <span className="field-kicker">Sector lock · live intel</span>
            <h2>{region.name}</h2>
            <p>{region.blurb}</p>
          </div>
          <button
            type="button"
            className="panel-toggle"
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
          >
            {panelOpen ? 'Minimize' : 'Open intel'}
          </button>
        </div>

        <div className="field-grid">
          <button
            type="button"
            className={`field-cell is-button${tab === 'conditions' ? ' is-active' : ''}`}
            onClick={() => {
              setTab('conditions')
              setPanelOpen(true)
            }}
          >
            <span className="field-label">Local time</span>
            <strong>{localTime}</strong>
            <span className="field-sub">{localDate}</span>
          </button>
          <button
            type="button"
            className={`field-cell is-button${tab === 'conditions' ? ' is-active' : ''}`}
            onClick={() => {
              setTab('conditions')
              setPanelOpen(true)
            }}
          >
            <span className="field-label">Conditions</span>
            <strong>{weather ? `${weather.tempF}°F` : '—'}</strong>
            <span className="field-sub">
              {weather
                ? `${weather.condition} · feels ${weather.feelsF}°`
                : weatherError ?? 'Reading Open-Meteo…'}
            </span>
          </button>
          <button
            type="button"
            className={`field-cell is-button${tab === 'forecast' ? ' is-active' : ''}`}
            onClick={() => {
              setTab('forecast')
              setPanelOpen(true)
            }}
          >
            <span className="field-label">Wind</span>
            <strong>{weather ? `${weather.windMph} mph` : '—'}</strong>
            <span className="field-sub">
              {weather
                ? `${weather.windDir}${
                    weather.windGustMph != null ? ` · gust ${weather.windGustMph}` : ''
                  } · ${weather.humidity}% RH`
                : '—'}
            </span>
          </button>
          <button
            type="button"
            className={`field-cell is-button${tab === 'birds' ? ' is-active' : ''}`}
            onClick={() => {
              setTab('birds')
              setPanelOpen(true)
            }}
          >
            <span className="field-label">Precip / Birds</span>
            <strong>{weather ? `${weather.precipProb}%` : '—'}</strong>
            <span className="field-sub">
              {birdCount ? `${birdCount} eBird hits nearby` : 'Tap for bird intel'}
            </span>
          </button>
        </div>

        {panelOpen ? (
          <>
            <div className="panel-tabs" role="tablist" aria-label="Field intel sections">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`${tabsId}-${t.id}`}
                  aria-selected={tab === t.id}
                  className={`panel-tab${tab === t.id ? ' is-active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.badge ? <span className="tab-badge">{t.badge}</span> : null}
                </button>
              ))}
            </div>

            <div className="panel-body" role="tabpanel" aria-labelledby={`${tabsId}-${tab}`}>
              {tab === 'conditions' ? (
                <div className="tab-pane">
                  {weather ? (
                    <>
                      <p className="intel-callout">{weather.huntTip}</p>
                      <div className="weather-meta weather-meta--roomy">
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
                        {weather.visibilityMi != null ? (
                          <span>
                            Visibility <strong>{weather.visibilityMi} mi</strong>
                          </span>
                        ) : null}
                      </div>
                      <p className="pane-hint">Tap Forecast for the 5-day hunt window.</p>
                    </>
                  ) : (
                    <p className="feed-empty">{weatherError ?? 'Loading conditions…'}</p>
                  )}
                </div>
              ) : null}

              {tab === 'forecast' ? (
                <div className="tab-pane">
                  {weather?.daily.length ? (
                    <>
                      <ul className="forecast-row forecast-row--interactive">
                        {weather.daily.map((day, i) => (
                          <li key={day.date}>
                            <button
                              type="button"
                              className={`forecast-day-btn${selectedDay === i ? ' is-active' : ''}`}
                              onClick={() => setSelectedDay(i)}
                            >
                              <span className="forecast-day">{day.label}</span>
                              <strong>
                                {day.highF}° / {day.lowF}°
                              </strong>
                              <span className="forecast-cond">{day.condition}</span>
                              <span className="forecast-extra">
                                {day.precipProb}% · {day.windMph} mph
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                      {selectedForecast ? (
                        <div className="intel-detail">
                          <h3>{selectedForecast.label}</h3>
                          <p>
                            High {selectedForecast.highF}°F / Low {selectedForecast.lowF}°F ·{' '}
                            {selectedForecast.condition}. Precip chance {selectedForecast.precipProb}
                            %, winds to {selectedForecast.windMph} mph.
                          </p>
                          <p className="pane-hint">
                            Plan stands around the cooler end of the day when swings are wide.
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="feed-empty">Forecast loading from Open-Meteo…</p>
                  )}
                </div>
              ) : null}

              {tab === 'birds' ? (
                <div className="tab-pane">
                  {!wildlife ? (
                    <p className="feed-empty">Pulling nearby eBird checklists…</p>
                  ) : wildlife.birdError && !wildlife.birds.length ? (
                    <p className="feed-empty">{wildlife.birdError}</p>
                  ) : wildlife.birds.length ? (
                    <div className="feed-split">
                      <ul className="feed-list feed-list--tall">
                        {wildlife.birds.map((b) => {
                          const active =
                            selectedBird?.sciName === b.sciName &&
                            selectedBird.obsDt === b.obsDt &&
                            selectedBird.locName === b.locName
                          return (
                            <li key={`${b.sciName}-${b.obsDt}-${b.locName}`}>
                              <button
                                type="button"
                                className={`feed-item-btn${active ? ' is-active' : ''}`}
                                onClick={() => setSelectedBird(b)}
                              >
                                <strong>{b.name}</strong>
                                <span>
                                  {b.howMany != null ? `${b.howMany} · ` : ''}
                                  {b.obsDt}
                                </span>
                                <span className="feed-loc">{b.locName}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                      <div className="intel-detail">
                        {selectedBird ? (
                          <>
                            <h3>{selectedBird.name}</h3>
                            <p className="sci">{selectedBird.sciName}</p>
                            <p>
                              Last reported {selectedBird.obsDt}
                              {selectedBird.howMany != null
                                ? ` · count ${selectedBird.howMany}`
                                : ''}
                              .
                            </p>
                            <p>{selectedBird.locName}</p>
                            <p className="pane-hint">
                              Use nearby wetlands, roost timber, and field edges for cam placement.
                            </p>
                          </>
                        ) : (
                          <p className="pane-hint">Select a bird for location detail.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="feed-empty">No recent public sightings in range.</p>
                  )}
                </div>
              ) : null}

              {tab === 'tracking' ? (
                <div className="tab-pane">
                  {!wildlife ? (
                    <p className="feed-empty">Scanning Movebank public studies…</p>
                  ) : (
                    <>
                      {wildlife.studyError ? <p className="feed-note">{wildlife.studyError}</p> : null}
                      {wildlife.studies.length ? (
                        <ul className="feed-list feed-list--tall study-list">
                          {wildlife.studies.map((s) => (
                            <li key={s.id}>
                              <a className="study-card" href={s.url} target="_blank" rel="noreferrer">
                                <strong>{s.name}</strong>
                                <span>
                                  {s.taxa} · {s.distanceKm} km away
                                  {s.individuals != null ? ` · ${s.individuals} animals` : ''}
                                </span>
                                <span className="study-cta">Open on Movebank →</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="feed-empty">No public studies near this sector.</p>
                      )}
                    </>
                  )}
                </div>
              ) : null}

              {tab === 'terrain' ? (
                <div className="tab-pane">
                  <div className="topo-block topo-block--flush">
                    <span className="field-label">Topography</span>
                    <p>{region.topography}</p>
                    <div className="topo-tags">
                      {region.terrain.map((t) => (
                        <span key={t} className="topo-tag">
                          {t}
                        </span>
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
                  <div className="hunt-notes hunt-notes--flush">
                    <span className="field-label">Hunt notes</span>
                    <ul>
                      {region.huntNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <p className="pane-hint pane-hint--collapsed">
            Tap a snapshot tile or Open intel to dig into weather, birds, tracks, and terrain.
          </p>
        )}
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
        {expanded ? <p className="is-full">{animal.tip}</p> : null}
        <div className="chip-foot">
          <span className="chip-peak">Peak {animal.peak}</span>
          <span className="chip-expand-hint">{expanded ? 'Close' : 'Tap'}</span>
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
            <strong>Face trails at chest height; check cards after cold fronts.</strong>
          </div>
        </div>
      ) : null}
    </button>
  )
}
