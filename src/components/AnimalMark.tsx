type Glyph =
  | 'deer'
  | 'bear'
  | 'turkey'
  | 'canid'
  | 'felid'
  | 'boar'
  | 'alligator'
  | 'bird'
  | 'elk'
  | 'fox'
  | 'raccoon'
  | 'small'

const GLYPH_BY_ID: Record<string, Glyph> = {
  whitetail: 'deer',
  muledeer: 'deer',
  blacktail: 'deer',
  coues: 'deer',
  caribou: 'deer',
  pronghorn: 'deer',
  blackbear: 'bear',
  brownbear: 'bear',
  turkey: 'turkey',
  coyote: 'canid',
  wolf: 'canid',
  fox: 'fox',
  bobcat: 'felid',
  mtnlion: 'felid',
  cougar: 'felid',
  boar: 'boar',
  javelina: 'boar',
  alligator: 'alligator',
  grouse: 'bird',
  pheasant: 'bird',
  quail: 'bird',
  dove: 'bird',
  duck: 'bird',
  goose: 'bird',
  elk: 'elk',
  moose: 'elk',
  raccoon: 'raccoon',
  rabbit: 'small',
  squirrel: 'small',
  nutria: 'small',
}

/** Minimal geometric marks — telemetry aesthetic, not cartoon mascots */
function GlyphSvg({ glyph }: { glyph: Glyph }) {
  switch (glyph) {
    case 'deer':
      return (
        <path
          d="M12 5l1.2 3.2H16l-2.4 1.8.9 3-2.5-1.7L9.5 13l.9-3L8 8.2h2.8L12 5zM9 16.5h6M10.5 16.5V19M13.5 16.5V19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'bear':
      return (
        <path
          d="M8 10.5a2 2 0 114 0M12 10.5a2 2 0 114 0M7.5 13.5c0 3 2 5 4.5 5s4.5-2 4.5-5c0-1.5-1-3.5-4.5-3.5S7.5 12 7.5 13.5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'turkey':
      return (
        <path
          d="M12 7c2.5.8 5 3.2 5.5 6.5-1.8.6-3.5.9-5.5.9S8.3 14.1 6.5 13.5C7 10.2 9.5 7.8 12 7zM12 14.4V18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'canid':
    case 'fox':
      return (
        <path
          d="M5 13l3.2-4.5L12 11l3.8-2.5L19 13l-1.5 1.5H6.5L5 13zM9 14.5V18M15 14.5V18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'felid':
      return (
        <path
          d="M6 12.5l2-4 2.2 1.5h3.6L16 8.5l2 4-1 1.5H7l-1-1.5zM9 15.5V18M15 15.5V18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'boar':
      return (
        <path
          d="M4.5 13.5c1.2-3.2 3.8-5 7.5-5s6.3 1.8 7.5 5c0 1.4-.9 2.5-2 2.5H6.5c-1.1 0-2-1.1-2-2.5zM8 12h1.5M14.5 12H16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'alligator':
      return (
        <path
          d="M3 14c2.5-.9 5-1.5 8-1.5s5.2.7 10 1.5c0 .8-2.2 1.5-5.5 1.5H8C5 15.5 3 14.8 3 14zM7 12.8c.4-1 1.5-1.8 3-1.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'bird':
      return (
        <path
          d="M5 15c2.5-1.5 4.2-4.5 5-7 1.5 1.8 4 3.5 9 4.5-2.5.8-4.5 2.4-5.5 4.5H5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'elk':
      return (
        <path
          d="M7 9l-2-3 2 .8 1-2 .9 2 2-.8-.8 2.5c1.8-.7 3.5-.7 5.2-.5l-.8-2.5 2 .8.9-2 1 2 2-.8-2 3c1.6.9 2.6 2.6 2.6 4.8h-1.5c0-1.6-.7-3-2.2-3.8L14.5 18h-1.5l.4-4.2c-1.2.7-2.4 1.6-3.2 3L9.2 19H7.8l.8-3.2C7.5 13.5 7 11.5 7 9z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'raccoon':
      return (
        <path
          d="M6 12c.8-2.5 2.8-4 6-4s5.2 1.5 6 4c0 .9-.5 1.7-1.4 2.1L16 17.5H8l-.6-3.4C6.5 13.7 6 12.9 6 12zM9.5 12.2h2M12.5 12.2h2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    default:
      return (
        <circle
          cx="12"
          cy="12"
          r="5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
      )
  }
}

export function AnimalMark({ id, label }: { id: string; label: string }) {
  const glyph = GLYPH_BY_ID[id] ?? 'small'
  return (
    <span className="animal-mark" title={label} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="animal-mark-svg">
        <GlyphSvg glyph={glyph} />
      </svg>
    </span>
  )
}
