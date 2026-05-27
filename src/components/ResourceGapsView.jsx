import { useEffect, useState } from 'react'
import { deriveRequiredCap, capable } from '../services/staffCapabilities'

const FREELANCE_STORED = 'Freelance required'

const BOOTH_ROLES = [
  { field: 'director',         label: 'Director' },
  { field: 'evsOperator',      label: 'EVS Operator' },
  { field: 'graphicsOperator', label: 'Graphics Operator' },
]

const ASSIGNED_ROLES = [
  { field: 'director',          staffKey: 'director' },
  { field: 'productionManager', staffKey: 'onsiteProductionManager' },
  { field: 'evsOperator',       staffKey: 'evsOperator' },
  { field: 'graphicsOperator',  staffKey: 'graphicsOperator' },
  { field: 'cameraman',         staffKey: 'cameramen' },
  { field: 'onsiteAudio',       staffKey: 'onsiteAudio' },
  { field: 'producer',          staffKey: 'producer' },
  { field: 'commentator',       staffKey: 'commentator' },
  { field: 'mamChecker',        staffKey: 'mamCheckers' },
]

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) }
  catch { return fallback }
}

function computeBookingCounts(eventId, assignments, profiles, bookings) {
  const asgn = assignments[eventId] || {}
  let confirmed = 0, offered = 0, notOffered = 0
  for (const { field, staffKey } of ASSIGNED_ROLES) {
    const name = asgn[field]
    if (!name || name === FREELANCE_STORED) continue
    const isStaff = profiles[staffKey]?.[name]?.isStaff ?? false
    if (isStaff) {
      confirmed++
    } else {
      const status = bookings[eventId]?.[field] || ''
      if (status === 'confirmed') confirmed++
      else if (status === 'offered') offered++
      else notOffered++
    }
  }
  return { confirmed, offered, notOffered }
}

function hasIncompleteBookings(eventId, assignments, profiles, bookings) {
  const asgn = assignments[eventId] || {}
  for (const { field, staffKey } of ASSIGNED_ROLES) {
    const name = asgn[field]
    if (!name || name === FREELANCE_STORED) continue
    const isStaff = profiles[staffKey]?.[name]?.isStaff ?? false
    if (isStaff) continue
    const status = bookings[eventId]?.[field] || ''
    if (status !== 'confirmed') return true
  }
  return false
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function isActive(eventId, assignments, decisions) {
  if (decisions[eventId]?.initProduction) return true
  const asgn = assignments[eventId]
  if (!asgn) return false
  return Object.keys(asgn).length > 0
}

function computeDayStatus(allEvents, assignments, decisions, patterns, staff, profiles, defaultPatterns) {
  const patternMap   = Object.fromEntries(patterns.map(p => [p.id, p]))
  const allDirectors = staff.director || []

  const eventsByDate = {}
  for (const e of allEvents) {
    const d = e.start?.slice(0, 10)
    if (d) { if (!eventsByDate[d]) eventsByDate[d] = []; eventsByDate[d].push(e) }
  }

  const dayStatus = {}
  const sorted = [...allEvents].sort((a, b) => (a.start || '').localeCompare(b.start || ''))

  for (const event of sorted) {
    const eventDate = event.start?.slice(0, 10)
    if (!eventDate) continue
    if (!isActive(event.id, assignments, decisions)) continue

    if (!dayStatus[eventDate]) dayStatus[eventDate] = { gaps: [], covered: [] }

    const asgn         = assignments[event.id] || {}
    const patternId    = asgn.patternId ?? defaultPatterns[event.extendedProps?.competitionId] ?? ''
    const patternName  = patternMap[patternId]?.name ?? null
    const missingRoles = []

    for (const { field, label } of BOOTH_ROLES) {
      if (asgn[field] === FREELANCE_STORED) missingRoles.push(label)
    }

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

function EventRow({ event, patternName, missingRoles, assignments, profiles, bookings, onEventClick, incomplete, allConfirmed }) {
  const { confirmed, offered, notOffered } = computeBookingCounts(event.id, assignments, profiles, bookings)
  const hasAny = confirmed + offered + notOffered > 0
  const allOffered = !allConfirmed && notOffered === 0 && offered > 0
  const cls = allConfirmed ? ' rg-gap-row--all-confirmed'
            : allOffered   ? ' rg-gap-row--all-offered'
            : incomplete   ? ' rg-gap-row--incomplete'
            : ''
  return (
    <div
      className={`rg-gap-row${cls}`}
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
      <div className="rg-booking-status">
        {hasAny && <>
          <span className="rg-bs-item rg-bs-confirmed">Confirmed = {confirmed}</span>
          <span className="rg-bs-item rg-bs-offered">Offered = {offered}</span>
          <span className="rg-bs-item rg-bs-unbooked">Not offered yet = {notOffered}</span>
        </>}
      </div>
      <div className="rg-missing-roles">
        {missingRoles.map(role => (
          <span key={role} className="rg-role-badge">{role}</span>
        ))}
      </div>
    </div>
  )
}

function ResourceGapsView({ allEvents, onEventClick }) {
  const [assignments]     = useState(() => load('production_assignments',   {}))
  const [decisions]       = useState(() => load('editorial_decisions',      {}))
  const [patterns]        = useState(() => load('admin_patterns',           []))
  const [staff]           = useState(() => load('admin_staff',              {}))
  const [profiles]        = useState(() => load('admin_staff_profiles',     {}))
  const [defaultPatterns] = useState(() => load('rights_default_patterns',  {}))
  const [bookings, setBookings] = useState(() => load('staff_bookings',     {}))
  const [filter, setFilter] = useState('unavailable')

  useEffect(() => {
    function onUpdate() { setBookings(load('staff_bookings', {})) }
    window.addEventListener('bookings-updated', onUpdate)
    return () => window.removeEventListener('bookings-updated', onUpdate)
  }, [])

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
            const incompleteRows = (filter === 'incomplete' || filter === 'all')
              ? covered.filter(({ event }) => hasIncompleteBookings(event.id, assignments, profiles, bookings))
              : []
            const confirmedRows = filter === 'all'
              ? covered.filter(({ event }) => !hasIncompleteBookings(event.id, assignments, profiles, bookings))
              : []
            const allClear = filter !== 'all' && gaps.length === 0 && incompleteRows.length === 0

            return (
              <div key={date} className="rg-date-group">
                <div className={`rg-date-header${allClear ? ' rg-date-header--clear' : ''}`}>
                  {formatDate(date)}
                </div>

                {allClear ? (
                  <div className="rg-all-clear">
                    All required resources are available
                  </div>
                ) : (
                  <>
                    {gaps.map(({ event, missingRoles, patternName }) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        patternName={patternName}
                        missingRoles={missingRoles}
                        assignments={assignments}
                        profiles={profiles}
                        bookings={bookings}
                        onEventClick={onEventClick}
                        incomplete={false}
                      />
                    ))}
                    {incompleteRows.map(({ event, patternName }) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        patternName={patternName}
                        missingRoles={[]}
                        assignments={assignments}
                        profiles={profiles}
                        bookings={bookings}
                        onEventClick={onEventClick}
                        incomplete={true}
                      />
                    ))}
                    {confirmedRows.map(({ event, patternName }) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        patternName={patternName}
                        missingRoles={[]}
                        assignments={assignments}
                        profiles={profiles}
                        bookings={bookings}
                        onEventClick={onEventClick}
                        allConfirmed={true}
                      />
                    ))}
                  </>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="rg-banner">
        <div className="rg-filter-btns">
          <button
            className={`rg-filter-btn${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`rg-filter-btn${filter === 'incomplete' ? ' active' : ''}`}
            onClick={() => setFilter('incomplete')}
          >
            Incomplete
          </button>
          <button
            className={`rg-filter-btn${filter === 'unavailable' ? ' active' : ''}`}
            onClick={() => setFilter('unavailable')}
          >
            Unavailable only
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResourceGapsView
