import { useState } from 'react'
import { deriveRequiredCap, capable } from '../services/staffCapabilities'

const FREELANCE_STORED = 'Freelance required'

const BOOTH_ROLES = [
  { field: 'director',         label: 'Director' },
  { field: 'evsOperator',      label: 'EVS Operator' },
  { field: 'graphicsOperator', label: 'Graphics Operator' },
]

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) }
  catch { return fallback }
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// An event is "active" (tracked for resource planning) if it has a production
// assignment entry or has been flagged for production.
function isActive(eventId, assignments, decisions) {
  if (decisions[eventId]?.initProduction) return true
  const asgn = assignments[eventId]
  if (!asgn) return false
  return Object.keys(asgn).length > 0
}

// Returns { date → { gaps: [...], covered: [...] } } for all active dates.
function computeDayStatus(allEvents, assignments, decisions, patterns, staff, profiles, defaultPatterns) {
  const patternMap   = Object.fromEntries(patterns.map(p => [p.id, p]))
  const allDirectors = staff.director || []

  const eventsByDate = {}
  for (const e of allEvents) {
    const d = e.start?.slice(0, 10)
    if (d) { if (!eventsByDate[d]) eventsByDate[d] = []; eventsByDate[d].push(e) }
  }

  const dayStatus = {}  // date → { gaps: [], covered: [] }

  const sorted = [...allEvents].sort((a, b) => (a.start || '').localeCompare(b.start || ''))

  for (const event of sorted) {
    const eventDate = event.start?.slice(0, 10)
    if (!eventDate) continue
    if (!isActive(event.id, assignments, decisions)) continue

    if (!dayStatus[eventDate]) dayStatus[eventDate] = { gaps: [], covered: [] }

    const asgn          = assignments[event.id] || {}
    const patternId     = asgn.patternId ?? defaultPatterns[event.extendedProps?.competitionId] ?? ''
    const patternName   = patternMap[patternId]?.name ?? null
    const missingRoles  = []

    // 1 — Stored "Freelance required" from Booths auto-allocation
    for (const { field, label } of BOOTH_ROLES) {
      if (asgn[field] === FREELANCE_STORED) missingRoles.push(label)
    }

    // 2 — Production view: pattern assigned but no capable director available that day
    if (decisions[event.id]?.initProduction && !missingRoles.includes('Director')) {
      const pattern = patternMap[patternId]
      if (pattern && allDirectors.length > 0 && !asgn.director) {
        const reqCap    = deriveRequiredCap(pattern)
        const busyToday = new Set(
          (eventsByDate[eventDate] || [])
            .filter(e => e.id !== event.id)
            .map(e => assignments[e.id]?.director)
            .filter(Boolean)
        )
        const available = capable(allDirectors, profiles, 'director', reqCap)
          .filter(n => !busyToday.has(n))
        if (available.length === 0) missingRoles.push('Director')
      }
    }

    const entry = { event, patternName }
    if (missingRoles.length > 0) {
      dayStatus[eventDate].gaps.push({ ...entry, missingRoles })
    } else {
      dayStatus[eventDate].covered.push(entry)
    }
  }

  return dayStatus
}

function ResourceGapsView({ allEvents, onEventClick }) {
  const [assignments]     = useState(() => load('production_assignments',   {}))
  const [decisions]       = useState(() => load('editorial_decisions',      {}))
  const [patterns]        = useState(() => load('admin_patterns',           []))
  const [staff]           = useState(() => load('admin_staff',              {}))
  const [profiles]        = useState(() => load('admin_staff_profiles',     {}))
  const [defaultPatterns] = useState(() => load('rights_default_patterns',  {}))

  const dayStatus   = computeDayStatus(allEvents, assignments, decisions, patterns, staff, profiles, defaultPatterns)
  const sortedDates = Object.keys(dayStatus).sort()

  const totalGapEvents = sortedDates.reduce((n, d) => n + dayStatus[d].gaps.length, 0)
  const gapDays        = sortedDates.filter(d => dayStatus[d].gaps.length > 0).length

  return (
    <div className="rg-view">
      <div className="rg-header">
        <h2 className="rg-title">Resource Gaps</h2>
        <span className="rg-summary">
          {sortedDates.length === 0
            ? 'No active events'
            : totalGapEvents === 0
              ? `${sortedDates.length} day${sortedDates.length !== 1 ? 's' : ''} — all resources available`
              : `${totalGapEvents} gap${totalGapEvents !== 1 ? 's' : ''} across ${gapDays} day${gapDays !== 1 ? 's' : ''}`
          }
        </span>
      </div>

      <div className="rg-body">
        {sortedDates.length === 0 ? (
          <div className="rg-empty"><p>No production events have been set up yet.</p></div>
        ) : (
          sortedDates.map(date => {
            const { gaps, covered } = dayStatus[date]
            const allClear = gaps.length === 0
            return (
              <div key={date} className="rg-date-group">
                <div className={`rg-date-header${allClear ? ' rg-date-header--clear' : ''}`}>
                  {formatDate(date)}
                </div>

                {allClear ? (
                  <>
                    <div className="rg-all-clear">
                      All required resources are available
                    </div>
                    {covered.map(({ event, patternName }) => (
                      <div
                        key={event.id}
                        className="rg-gap-row rg-gap-row--clear"
                        onClick={() => onEventClick?.(event)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="rg-event-info">
                          <span className="rg-event-dot" style={{ background: event.backgroundColor }} />
                          <span className="rg-event-name">{event.title}</span>
                          {event.start?.length > 10 && (
                            <span className="rg-event-time">{event.start.slice(11, 16)}</span>
                          )}
                          {patternName && (
                            <span className="rg-pattern-name">{patternName}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  gaps.map(({ event, missingRoles, patternName }) => (
                    <div
                      key={event.id}
                      className="rg-gap-row"
                      onClick={() => onEventClick?.(event)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="rg-event-info">
                        <span className="rg-event-dot" style={{ background: event.backgroundColor }} />
                        <span className="rg-event-name">{event.title}</span>
                        {event.start?.length > 10 && (
                          <span className="rg-event-time">{event.start.slice(11, 16)}</span>
                        )}
                        {patternName && (
                          <span className="rg-pattern-name">{patternName}</span>
                        )}
                      </div>
                      <div className="rg-missing-roles">
                        {missingRoles.map(role => (
                          <span key={role} className="rg-role-badge">{role}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ResourceGapsView
