import { useState } from 'react'

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
// No person is assigned to two events at the same start time.
// Falls back to 'Freelance required' when the pool is exhausted.
function autoAllocateDay(dateEvents, assignments, staff, patternMap, defaultPatterns) {
  const next = { ...assignments }

  // slot → role → Set<name> — tracks who is already committed per time slot
  const slotAllocated = {}
  function ensureSlot(slot) {
    if (!slotAllocated[slot]) slotAllocated[slot] = {
      director: new Set(), evsOperator: new Set(), graphicsOperator: new Set(),
    }
    return slotAllocated[slot]
  }

  // First pass: register existing (non-TBA, non-freelance) assignments
  dateEvents.forEach(event => {
    const slot = event.allDay ? 'allDay' : event.start
    const sl = ensureSlot(slot)
    const asgn = next[event.id] || {}
    if (asgn.director        && asgn.director        !== 'Freelance required') sl.director.add(asgn.director)
    if (asgn.evsOperator     && asgn.evsOperator     !== 'Freelance required') sl.evsOperator.add(asgn.evsOperator)
    if (asgn.graphicsOperator && asgn.graphicsOperator !== 'Freelance required') sl.graphicsOperator.add(asgn.graphicsOperator)
  })

  // Second pass: fill TBA slots
  dateEvents.forEach(event => {
    const slot = event.allDay ? 'allDay' : event.start
    const sl = ensureSlot(slot)
    const asgn = { ...(next[event.id] || {}) }
    const pattern = getPatternFor(event, next, patternMap, defaultPatterns)
    const evsCount = tv(asgn, pattern, 'techEvsOperator', 'evsOperator')
    let changed = false

    if (!asgn.director) {
      const person = staff.director.find(n => !sl.director.has(n))
      asgn.director = person ?? 'Freelance required'
      if (person) sl.director.add(person)
      changed = true
    }

    if (evsCount > 0 && !asgn.evsOperator) {
      const person = staff.evsOperator.find(n => !sl.evsOperator.has(n))
      asgn.evsOperator = person ?? 'Freelance required'
      if (person) sl.evsOperator.add(person)
      changed = true
    }

    if (!asgn.graphicsOperator) {
      const person = staff.graphicsOperator.find(n => !sl.graphicsOperator.has(n))
      asgn.graphicsOperator = person ?? 'Freelance required'
      if (person) sl.graphicsOperator.add(person)
      changed = true
    }

    if (changed) next[event.id] = asgn
  })

  return next
}

function staffDisplay(name) {
  if (!name)                         return { text: 'TBA',               cls: 'booth-staff-tba',      rowCls: '' }
  if (name === 'Freelance required') return { text: 'Freelance required', cls: 'booth-staff-freelance', rowCls: 'booth-staff-row--freelance' }
  return { text: name, cls: '', rowCls: '' }
}

function BoothsView({ events }) {
  const [assignments, setAssignmentsRaw] = useState(loadAssignments)
  const [patterns]        = useState(loadPatterns)
  const [defaultPatterns] = useState(loadDefaultPatterns)
  const [techStack]       = useState(loadTechStack)
  const [staff]           = useState(loadStaff)

  const patternMap = Object.fromEntries(patterns.map(p => [p.id, p]))
  const maxBooths  = techStack.productionBooths ?? 0

  function saveAssignments(next) {
    localStorage.setItem('production_assignments', JSON.stringify(next))
    setAssignmentsRaw(next)
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
      <div className="booths-view">
        <div className="booths-empty">
          <p>No booth events found.</p>
          <span>Events get a booth when their production pattern has "Production Booth" set to Yes, or when it is manually enabled in the Event Inspector.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="booths-view">
      {sortedDates.map(date => {
        const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
        return (
          <div key={date} className="booths-date-group">
            <div className="booths-date-header-row">
              <h2 className="booths-date-header">{dateLabel}</h2>
              <button
                className="booths-auto-btn"
                onClick={() => saveAssignments(
                  autoAllocateDay(byDate[date], assignments, staff, patternMap, defaultPatterns)
                )}
              >
                Auto allocate
              </button>
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

                const dir = staffDisplay(asgn.director)
                const evs = evsCount > 0 ? staffDisplay(asgn.evsOperator) : null
                const gfx = staffDisplay(asgn.graphicsOperator)

                return (
                  <div
                    key={event.id}
                    className={`booth-card${overCapacity ? ' booth-card--over-capacity' : ''}`}
                  >
                    <div className="booth-card-header" style={{ background: event.backgroundColor }}>
                      <span className="booth-number">Booth {idx + 1}</span>
                      {overCapacity && <span className="booth-over-label">Over capacity</span>}
                    </div>
                    <div className="booth-card-body">
                      <div className="booth-comp">
                        <span className="booth-comp-dot" style={{ background: event.backgroundColor }} />
                        <span className="booth-comp-name">{p.competitionName}</span>
                      </div>
                      <div className="booth-event-title">{event.title}</div>
                      {timePart && <div className="booth-time">{timePart}</div>}
                      {p.venue  && <div className="booth-venue">{p.venue}</div>}
                      {p.sport  && <div className="booth-sport">{p.sport}</div>}
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
  )
}

export default BoothsView
