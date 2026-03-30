

interface ShameEntry {
  repo: string
  displayName: string
  wasteKB: number
  totalKB: number
  worstPackage: string
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  description: string
}

const SHAME_DATA: ShameEntry[] = [
  {
    repo: 'facebook/create-react-app',
    displayName: 'create-react-app',
    wasteKB: 847,
    totalKB: 1240,
    worstPackage: 'moment.js',
    grade: 'F',
    description: 'Ships a time machine to display a clock',
  },
  {
    repo: 'vuejs/vue-cli',
    displayName: 'vue-cli',
    wasteKB: 612,
    totalKB: 980,
    worstPackage: 'lodash',
    grade: 'D',
    description: "Pulls a utility belt for 3 functions",
  },
  {
    repo: 'nestjs/nest',
    displayName: 'nestjs',
    wasteKB: 290,
    totalKB: 650,
    worstPackage: 'axios',
    grade: 'C',
    description: "fetch() exists. Nest didn't get the memo.",
  },
  {
    repo: 'storybookjs/storybook',
    displayName: 'storybook',
    wasteKB: 180,
    totalKB: 520,
    worstPackage: 'underscore',
    grade: 'B',
    description: 'Almost clean. underscore haunts it.',
  },
  {
    repo: 'vitejs/vite',
    displayName: 'vite',
    wasteKB: 12,
    totalKB: 310,
    worstPackage: 'none',
    grade: 'A',
    description: 'The benchmark. Ships only what it needs.',
  },
]

interface GradeMeta {
  border: string
  bgTint: string
  text: string
  badgeBg: string
  badgeColor: string
}

const GRADE_META: Record<string, GradeMeta> = {
  F: { border: '#E24B4A', bgTint: 'rgba(226,75,74,0.06)',   text: '#E24B4A', badgeBg: '#FCEBEB', badgeColor: '#791F1F' },
  D: { border: '#D85A30', bgTint: 'rgba(216,90,48,0.06)',   text: '#D85A30', badgeBg: '#FAECE7', badgeColor: '#712B13' },
  C: { border: '#EF9F27', bgTint: 'rgba(239,159,39,0.06)',  text: '#EF9F27', badgeBg: '#FAEEDA', badgeColor: '#633806' },
  B: { border: '#639922', bgTint: 'rgba(99,153,34,0.06)',   text: '#639922', badgeBg: '#EAF3DE', badgeColor: '#27500A' },
  A: { border: '#1D9E75', bgTint: 'rgba(29,158,117,0.06)',  text: '#1D9E75', badgeBg: '#E1F5EE', badgeColor: '#085041' },
}

interface Props {
  onSelect: (repo: string) => void
}

export function HallOfShame({ onSelect }: Props) {
  const totalWasteKB = SHAME_DATA.reduce((s, e) => s + e.wasteKB, 0).toLocaleString()
  const survivors = SHAME_DATA.filter(e => e.grade === 'A').length

  return (
    <section style={{ width: '100%', marginBottom: '32px' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#A32D2D',
            margin: '0 0 4px',
          }}>
            Hall of Shame
          </p>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#e8e8e8',
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}>
            Famous repos, X-rayed
          </h2>
          <p style={{
            fontSize: '12px',
            color: '#666',
            margin: '4px 0 0',
          }}>
            Click any card to run a live scan →
          </p>
        </div>

        {/* Stat strip */}
        <p style={{
          fontSize: '12px',
          color: '#555',
          fontFamily: '"JetBrains Mono", monospace',
          margin: 0,
          textAlign: 'right',
          lineHeight: 1.6,
        }}>
          5 repos audited · {totalWasteKB} KB total waste · {survivors} survivor
        </p>
      </div>

      {/* ── Cards: force 5 columns ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px',
      }}>
        {SHAME_DATA.map((entry) => {
          const m = GRADE_META[entry.grade]
          const isClean = entry.grade === 'A'
          const wastePct = Math.round((entry.wasteKB / entry.totalKB) * 100)
          const barWidth = isClean ? 3 : wastePct

          return (
            <button
              key={entry.repo}
              onClick={() => onSelect(entry.repo)}
              style={{
                all: 'unset',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                height: '160px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderTop: `3px solid ${m.border}`,
                borderRadius: '10px',
                padding: '10px 12px',
                cursor: 'pointer',
                boxSizing: 'border-box',
                overflow: 'hidden',
                transition: 'transform 0.15s ease, border-top-width 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.transform = 'scale(1.03)'
                el.style.borderTopWidth = '4px'
                el.style.background = m.bgTint
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.transform = 'scale(1)'
                el.style.borderTopWidth = '3px'
                el.style.background = '#1a1a1a'
              }}
            >
              {/* Row 1: Grade badge + arrow */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {/* Grade badge */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: m.badgeBg,
                    color: m.badgeColor,
                    fontSize: '17px',
                    fontWeight: 800,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}>
                    {entry.grade}
                  </div>
                  {/* Repo name */}
                  <span style={{
                    fontSize: '10px',
                    color: '#666',
                    fontFamily: '"JetBrains Mono", monospace',
                    maxWidth: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                  }}>
                    {entry.displayName}
                  </span>
                </div>

                {/* Arrow */}
                <span style={{
                  fontSize: '16px',
                  color: '#333',
                  marginTop: '2px',
                  flexShrink: 0,
                }}>
                  →
                </span>
              </div>

              {/* Row 2: Hero number */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: m.text,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  marginBottom: '3px',
                }}>
                  {isClean ? '✓' : `${entry.wasteKB} KB`}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#555',
                  marginBottom: '7px',
                }}>
                  {isClean ? 'zero waste' : `${wastePct}% of bundle`}
                </div>

                {/* Progress bar */}
                <div style={{
                  height: '2px',
                  background: '#2a2a2a',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${barWidth}%`,
                    background: m.border,
                    borderRadius: '2px',
                  }} />
                </div>
              </div>

              {/* Row 3: Worst offender pill */}
              <div style={{ flexShrink: 0 }}>
                {isClean ? (
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: m.badgeBg,
                    color: m.badgeColor,
                    fontSize: '10px',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 700,
                  }}>
                    clean ✓
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: m.badgeBg,
                    color: m.badgeColor,
                    fontSize: '10px',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 600,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {entry.worstPackage}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
