import { useEffect, useRef, useState } from 'react'
import { deriveRequiredCap, capable, staffFirst } from '../services/staffCapabilities'

function loadAssignments() {
  try { return JSON.parse(localStorage.getItem('production_assignments') || '{}') }
  catch { return {} }
}

function loadPatterns() {
  try { return JSON.parse(localStorage.getItem('admin_patterns') || '[]') }
  catch { return [] }
}

function loadDefaultPatterns() {
  try { return JSON.parse(localStorage.getItem('rights_default_patterns') || '{}') }
  catch { return {} }
}

function loadTechStack() {
  try { return JSON.parse(localStorage.getItem('admin_tech_stack') || '{}') }
  catch { return {} }
}

function loadStaff() {
  const empty = {
    cameramen: [], onsiteAudio: [], onsiteProductionManager: [],
    director: [], producer: [], commentator: [], evsOperator: [], graphicsOperator: [],
  }
  try { return { ...empty, ...JSON.parse(localStorage.getItem('admin_staff') || '{}') } }
  catch { return empty }
}

function loadProfiles() {
  try { return JSON.parse(localStorage.getItem('admin_staff_profiles') || '{}') }
  catch { return {} }
}

function loadBookings() {
  try { return JSON.parse(localStorage.getItem('staff_bookings') || '{}') }
  catch { return {} }
}

function loadDecisions() {
  try { return JSON.parse(localStorage.getItem('editorial_decisions') || '{}') }
  catch { return {} }
}

// 'definite' = any platform Y, 'possible' = no Y but some P, otherwise 'unscheduled'
function eventStatus(eventId, decisions) {
  const vals = Object.values(decisions[eventId] || {})
  if (vals.includes('Y')) return 'definite'
  if (vals.includes('P')) return 'possible'
  return 'unscheduled'
}


const BOOTH_ROLES = [
  { asgnKey: 'director',         staffKey: 'director' },
  { asgnKey: 'evsOperator',      staffKey: 'evsOperator' },
  { asgnKey: 'graphicsOperator', staffKey: 'graphicsOperator' },
]

// For the given event IDs, counts accepted/offered freelancers being cleared
// and returns updated bookings with those statuses wiped.
function computeClear(eventIds, assignments, profiles, bookings) {
  let accepted = 0
  let offered  = 0
  const nextBookings = { ...bookings }

  for (const id of eventIds) {
    const asgn       = assignments[id] || {}
    const evtBookings = { ...(nextBookings[id] || {}) }
    let changed = false

    for (const { asgnKey, staffKey } of BOOTH_ROLES) {
      const name = asgn[asgnKey]
      if (!name || name === 'Freelance required') continue
      if (profiles[staffKey]?.[name]?.isStaff ?? false) continue

      const status = evtBookings[asgnKey] || ''
      if (status === 'confirmed') accepted++
      else if (status === 'offered') offered++

      if (evtBookings[asgnKey]) { delete evtBookings[asgnKey]; changed = true }
    }

    if (changed) nextBookings[id] = evtBookings
  }

  return { accepted, offered, nextBookings }
}

function needsBooth(event, assignments, patternMap, defaultPatterns) {
  const asgn = assignments[event.id] || {}
  if (asgn.techProductionBooth !== undefined) return asgn.techProductionBooth
  const patternId = asgn.patternId ?? defaultPatterns[event.extendedProps.competitionId]
  if (!patternId) return false
  return patternMap[patternId]?.productionBooth ?? false
}

function getPatternFor(event, assignments, patternMap, defaultPatterns) {
  const asgn = assignments[event.id] || {}
  const patternId = asgn.patternId ?? defaultPatterns[event.extendedProps.competitionId]
  return patternId ? (patternMap[patternId] ?? null) : null
}

function tv(asgn, pattern, techKey, patternKey) {
  if (asgn[techKey] !== undefined) return asgn[techKey]
  return pattern?.[patternKey] ?? 0
}

// Allocate TBA director/EVS/graphics across a single day's booth events.
// One person = one job per day, and they must have the pattern's required capability.
// Falls back to 'Freelance required' when the qualified pool is exhausted.
// Events are processed in priority tiers: definite (Y) → possible (P) → unscheduled.
// Each tier's existing assignments are locked in before that tier's TBA slots are filled,
// so possible-event staff never block definite events from getting first pick.
function autoAllocateDay(dateEvents, assignments, staff, patternMap, defaultPatterns, profiles, decisions = {}) {
  const next = { ...assignments }
  const dayUsed = {
    director:         new Set(),
    evsOperator:      new Set(),
    graphicsOperator: new Set(),
  }

  const tiers = ['definite', 'possible', 'unscheduled'].map(status =>
    dateEvents.filter(e => eventStatus(e.id, decisions) === status)
  )

  for (const tier of tiers) {
    // Lock existing assignments for this tier before filling any TBA in it
    tier.forEach(event => {
      const asgn = next[event.id] || {}
      if (asgn.director         && asgn.director         !== 'Freelance required') dayUsed.director.add(asgn.director)
      if (asgn.evsOperator      && asgn.evsOperator      !== 'Freelance required') dayUsed.evsOperator.add(asgn.evsOperator)
      if (asgn.graphicsOperator && asgn.graphicsOperator !== 'Freelance required') dayUsed.graphicsOperator.add(asgn.graphicsOperator)
    })

    // Fill TBA slots for this tier
    tier.forEach(event => {
      const asgn     = { ...(next[event.id] || {}) }
      const pattern  = getPatternFor(event, next, patternMap, defaultPatterns)
      const evsCount = tv(asgn, pattern, 'techEvsOperator', 'evsOperator')
      const reqCap   = deriveRequiredCap(pattern)
      let changed = false

      if (!asgn.director) {
        const pool   = staffFirst(capable(staff.director, profiles, 'director', reqCap), profiles, 'director')
        const person = pool.find(n => !dayUsed.director.has(n))
        asgn.director = person ?? 'Freelance required'
        if (person) dayUsed.director.add(person)
        changed = true
      }

      if (evsCount > 0 && !asgn.evsOperator) {
        const pool   = staffFirst(capable(staff.evsOperator, profiles, 'evsOperator', reqCap), profiles, 'evsOperator')
        const person = pool.find(n => !dayUsed.evsOperator.has(n))
        asgn.evsOperator = person ?? 'Freelance required'
        if (person) dayUsed.evsOperator.add(person)
        changed = true
      }

      if (!asgn.graphicsOperator) {
        const pool   = staffFirst(capable(staff.graphicsOperator, profiles, 'graphicsOperator', reqCap), profiles, 'graphicsOperator')
        const person = pool.find(n => !dayUsed.graphicsOperator.has(n))
        asgn.graphicsOperator = person ?? 'Freelance required'
        if (person) dayUsed.graphicsOperator.add(person)
        changed = true
      }

      if (changed) next[event.id] = asgn
    })
  }

  return next
}

function staffDisplay(name, eventId, roleKey, staffKey, profiles, bookings) {
  if (!name)                         return { text: 'TBA',               cls: 'booth-staff-tba',      rowCls: '' }
  if (name === 'Freelance required') return { text: 'Freelance required', cls: 'booth-staff-freelance', rowCls: 'booth-staff-row--freelance' }
  const isStaff = profiles[staffKey]?.[name]?.isStaff ?? false
  const storedStatus = bookings[eventId]?.[roleKey] || ''
  const effectiveStatus = isStaff ? 'confirmed' : storedStatus
  const cls = effectiveStatus === 'confirmed' ? 'booth-staff-name--confirmed'
            : effectiveStatus === 'offered'   ? 'booth-staff-name--offered'
            :                                   'booth-staff-name--unbooked'
  return { text: name, cls, rowCls: '' }
}

function BoothsView({ events, onEventClick }) {
  const [assignments, setAssignmentsRaw] = useState(loadAssignments)
  const [patterns]        = useState(loadPatterns)
  const [defaultPatterns] = useState(loadDefaultPatterns)
  const [techStack]       = useState(loadTechStack)
  const [staff]           = useState(loadStaff)
  const [profiles]        = useState(loadProfiles)
  const [bookings, setBookings] = useState(loadBookings)
  const [decisions]       = useState(loadDecisions)
  const [selectedDate, setSelectedDate] = useState('')
  const [clearNotice, setClearNotice]   = useState(null)
  const groupRefs    = useRef({})
  const clearTimerRef = useRef(null)

  useEffect(() => {
    function onUpdate() { setAssignmentsRaw(loadAssignments()) }
    window.addEventListener('assignments-updated', onUpdate)
    return () => window.removeEventListener('assignments-updated', onUpdate)
  }, [])

  useEffect(() => {
    function onUpdate() { setBookings(loadBookings()) }
    window.addEventListener('bookings-updated', onUpdate)
    return () => window.removeEventListener('bookings-updated', onUpdate)
  }, [])

  useEffect(() => {
    if (sortedDates.some(d => d >= todayStr)) scrollToDate(todayStr)
  }, [])

  const patternMap = Object.fromEntries(patterns.map(p => [p.id, p]))
  const maxBooths  = techStack.productionBooths ?? 0
  const todayStr   = new Date().toISOString().slice(0, 10)

  function scrollToDate(dateStr) {
    const target = sortedDates.find(d => d >= dateStr)
    if (target) groupRefs.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleDateChange(e) {
    setSelectedDate(e.target.value)
    if (e.target.value) scrollToDate(e.target.value)
  }

  function saveAssignments(next) {
    localStorage.setItem('production_assignments', JSON.stringify(next))
    setAssignmentsRaw(next)
  }

  function saveBookings(next) {
    localStorage.setItem('staff_bookings', JSON.stringify(next))
    setBookings(next)
    window.dispatchEvent(new CustomEvent('bookings-updated'))
  }

  function showClearNotice(accepted, offered) {
    if (accepted === 0 && offered === 0) return
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    setClearNotice({ accepted, offered })
    clearTimerRef.current = setTimeout(() => setClearNotice(null), 5000)
  }

  const boothEvents = events.filter(e => needsBooth(e, assignments, patternMap, defaultPatterns))

  const byDate = {}
  boothEvents.forEach(event => {
    const date = event.start.slice(0, 10)
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(event)
  })

  const sortedDates = Object.keys(byDate).sort()
  sortedDates.forEach(date => {
    byDate[date].sort((a, b) => a.start.localeCompare(b.start))
  })

  if (sortedDates.length === 0) {
    return (
      <div className="booths-container">
        <div className="booths-toolbar"><div className="ed-toolbar-right" /></div>
        <div className="booths-view">
          <div className="booths-empty">
            <p>No booth events found.</p>
            <span>Events get a booth when their production pattern has "Production Booth" set to Yes, or when it is manually enabled in the Event Inspector.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="booths-container">
      <div className="booths-toolbar">
        <div className="ed-toolbar-right">
          <button
            className="booths-clear-btn"
            onClick={() => {
              if (!window.confirm('Clear all allocated staff from every booth? This cannot be undone.')) return
              const allIds = Object.keys(assignments)
              const { accepted, offered, nextBookings } = computeClear(allIds, assignments, profiles, bookings)
              const nextAssignments = Object.fromEntries(
                Object.entries(assignments).map(([id, asgn]) => {
                  const { director, evsOperator, graphicsOperator, ...rest } = asgn
                  return [id, rest]
                })
              )
              saveAssignments(nextAssignments)
              saveBookings(nextBookings)
              showClearNotice(accepted, offered)
            }}
          >
            Clear all staff
          </button>
          <button
            className="booths-allocate-all-btn"
            onClick={() => {
              let next = { ...assignments }
              for (const date of sortedDates) {
                next = autoAllocateDay(byDate[date], next, staff, patternMap, defaultPatterns, profiles, decisions)
              }
              saveAssignments(next)
            }}
          >
            Allocate Everything
          </button>
          <label className="ed-date-label" htmlFor="booths-date-picker">Go to date</label>
          <input
            id="booths-date-picker"
            type="date"
            className="ed-date-input"
            value={selectedDate}
            min="2025-01-01"
            max="2026-12-31"
            onChange={handleDateChange}
          />
          <button
            className="ed-today-btn"
            onClick={() => scrollToDate(todayStr)}
            disabled={!sortedDates.some(d => d >= todayStr)}
            title="Jump to today"
          >
            Today
          </button>
        </div>
      </div>

      <div className="booths-view">
      {sortedDates.map(date => {
        const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
        return (
          <div key={date} ref={el => { groupRefs.current[date] = el }} className="booths-date-group">
            <div className="booths-date-header-row">
              <h2 className="booths-date-header">{dateLabel}</h2>
              <div className="booths-header-buttons">
                <div className="booths-btn-group">
                  <button
                    className="booths-clear-day-btn"
                    onClick={() => {
                      const dayIds = new Set(byDate[date].map(e => e.id))
                      const { accepted, offered, nextBookings } = computeClear([...dayIds], assignments, profiles, bookings)
                      const nextAssignments = Object.fromEntries(
                        Object.entries(assignments).map(([id, asgn]) => {
                          if (!dayIds.has(id)) return [id, asgn]
                          const { director, evsOperator, graphicsOperator, ...rest } = asgn
                          return [id, rest]
                        })
                      )
                      saveAssignments(nextAssignments)
                      saveBookings(nextBookings)
                      showClearNotice(accepted, offered)
                    }}
                  >
                    Clear this day
                  </button>
                  <button
                    className="booths-auto-btn"
                    onClick={() => saveAssignments(
                      autoAllocateDay(byDate[date], assignments, staff, patternMap, defaultPatterns, profiles, decisions)
                    )}
                  >
                    Auto allocate this day
                  </button>
                </div>
                <div className="booths-btn-group">
                  <button
                    className="booths-clear-forward-btn"
                    onClick={() => {
                      const forwardDates = sortedDates.filter(d => d >= date)
                      const forwardIds = new Set(forwardDates.flatMap(d => byDate[d].map(e => e.id)))
                      const { accepted, offered, nextBookings } = computeClear([...forwardIds], assignments, profiles, bookings)
                      const nextAssignments = Object.fromEntries(
                        Object.entries(assignments).map(([id, asgn]) => {
                          if (!forwardIds.has(id)) return [id, asgn]
                          const { director, evsOperator, graphicsOperator, ...rest } = asgn
                          return [id, rest]
                        })
                      )
                      saveAssignments(nextAssignments)
                      saveBookings(nextBookings)
                      showClearNotice(accepted, offered)
                    }}
                  >
                    Clear allocation forward
                  </button>
                  <button
                    className="booths-allocate-forward-btn"
                    onClick={() => {
                      const forwardDates = sortedDates.filter(d => d >= date)
                      let next = { ...assignments }
                      for (const d of forwardDates) {
                        next = autoAllocateDay(byDate[d], next, staff, patternMap, defaultPatterns, profiles, decisions)
                      }
                      saveAssignments(next)
                    }}
                  >
                    Allocate forward
                  </button>
                </div>
              </div>
            </div>

            <div className="booths-row">
              {byDate[date].map((event, idx) => {
                const p            = event.extendedProps
                const asgn         = assignments[event.id] || {}
                const pattern      = getPatternFor(event, assignments, patternMap, defaultPatterns)
                const timePart     = !event.allDay && event.start.length > 10
                  ? event.start.slice(11, 16) : null
                const evsCount     = tv(asgn, pattern, 'techEvsOperator', 'evsOperator')
                const overCapacity = maxBooths > 0 && (idx + 1) > maxBooths
                const isPossible   = eventStatus(event.id, decisions) === 'possible'

                const dir = staffDisplay(asgn.director,         event.id, 'director',         'director',         profiles, bookings)
                const evs = evsCount > 0 ? staffDisplay(asgn.evsOperator,      event.id, 'evsOperator',      'evsOperator',      profiles, bookings) : null
                const gfx = staffDisplay(asgn.graphicsOperator, event.id, 'graphicsOperator', 'graphicsOperator', profiles, bookings)

                return (
                  <div
                    key={event.id}
                    className={`booth-card${overCapacity ? ' booth-card--over-capacity' : ''}`}
                    onClick={() => onEventClick?.(event)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="booth-card-header" style={{ background: event.backgroundColor }}>
                      <span className="booth-number">Booth {idx + 1}</span>
                      {overCapacity && <span className="booth-over-label">Over capacity</span>}
                    </div>
                    {isPossible && <div className="booth-possible-label">Possible event</div>}
                    <div className="booth-card-body">
                      <div className="booth-comp">
                        <span className="booth-comp-dot" style={{ background: event.backgroundColor }} />
                        <span className="booth-comp-name">{p.competitionName}</span>
                      </div>
                      <div className="booth-event-title">{event.title}</div>
                      {timePart && <div className="booth-time">{timePart}</div>}
                      {p.venue  && <div className="booth-venue">{p.venue}</div>}
                      {p.sport  && <div className="booth-sport">{p.sport}</div>}
                      {pattern  && <div className="booth-pattern">{pattern.name}</div>}
                      <div className="booth-staff">
                        <div className={`booth-staff-row ${dir.rowCls}`}>
                          <span className="booth-staff-role">Director</span>
                          <span className={`booth-staff-name ${dir.cls}`}>{dir.text}</span>
                        </div>
                        {evs && (
                          <div className={`booth-staff-row ${evs.rowCls}`}>
                            <span className="booth-staff-role">EVS</span>
                            <span className={`booth-staff-name ${evs.cls}`}>{evs.text}</span>
                          </div>
                        )}
                        <div className={`booth-staff-row ${gfx.rowCls}`}>
                          <span className="booth-staff-role">Graphics</span>
                          <span className={`booth-staff-name ${gfx.cls}`}>{gfx.text}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      </div>

      {clearNotice && (
        <div className="booths-clear-notice">
          <span className="booths-clear-notice-title">Staff cleared</span>
          {clearNotice.accepted > 0 && (
            <span>{clearNotice.accepted} accepted freelancer{clearNotice.accepted !== 1 ? 's' : ''} reset to not offered</span>
          )}
          {clearNotice.offered > 0 && (
            <span>{clearNotice.offered} offered freelancer{clearNotice.offered !== 1 ? 's' : ''} reset to not offered</span>
          )}
        </div>
      )}
    </div>
  )
}

export default BoothsView
