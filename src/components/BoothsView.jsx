import { useEffect, useRef, useState } from 'react'
import { deriveRequiredCap, capable, orderByLoad } from '../services/staffCapabilities'
import { saveToStorage } from '../services/storage'
import { loadTechStack } from '../services/techStack'
import { loadLocks, persistLocks, isRoleLocked, withRoleLock, withEventLock, isEventFullyLocked } from '../services/staffLocks'
import {
  GALLERY_ROLES, GALLERY_LOCATIONS, galleryField,
  needsBooth, needsStudio, needsObUnit, galleryLocationsForEvent,
} from '../services/galleryRoles'

// Re-exported for TechnicalBookedView, which imports them from here.
export { needsBooth, needsStudio }

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


// Every (location, role) pair that gets its own person, as
// { field, staffKey, role, location } — field is the assignment/booking/lock key.
const GALLERY_SLOTS = GALLERY_LOCATIONS.flatMap(loc =>
  GALLERY_ROLES.map(r => ({
    field:    galleryField(loc.key, r.role),
    staffKey: r.staffKey,
    role:     r.role,
    location: loc.key,
  }))
)

// For the given event IDs, counts accepted/offered freelancers being cleared
// and returns updated bookings with those statuses wiped. Locked roles are
// left untouched entirely — locking means "don't clear this".
function computeClear(eventIds, assignments, profiles, bookings, locks) {
  let accepted = 0
  let offered  = 0
  const nextBookings = { ...bookings }

  for (const id of eventIds) {
    const asgn       = assignments[id] || {}
    const evtBookings = { ...(nextBookings[id] || {}) }
    let changed = false

    for (const { field, staffKey } of GALLERY_SLOTS) {
      if (isRoleLocked(locks, id, field)) continue
      const name = asgn[field]
      if (!name || name === 'Freelance required') continue
      if (profiles[staffKey]?.[name]?.isStaff ?? false) continue

      const status = evtBookings[field] || ''
      if (status === 'confirmed') accepted++
      else if (status === 'offered') offered++

      if (evtBookings[field]) { delete evtBookings[field]; changed = true }
    }

    if (changed) nextBookings[id] = evtBookings
  }

  return { accepted, offered, nextBookings }
}

// Strips the auto-allocated gallery roles (every location) from an assignment,
// but leaves any that are locked in place.
function stripUnlockedRoles(asgn, id, locks) {
  const next = { ...asgn }
  for (const { field } of GALLERY_SLOTS) {
    if (!isRoleLocked(locks, id, field)) delete next[field]
  }
  return next
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

// How many jobs each person already holds in a role across the whole working
// set of assignments, counting every location variant of that role together.
// Drives even spreading in auto-allocation.
function roleLoad(assignments, roleFields) {
  const m = new Map()
  for (const id in assignments) {
    for (const f of roleFields) {
      const n = assignments[id]?.[f]
      if (n && n !== 'Freelance required') m.set(n, (m.get(n) || 0) + 1)
    }
  }
  return m
}

// Allocate TBA gallery roles (director/EVS/graphics) across a single day's
// booth, studio and OB-unit events. Each facility an event uses gets its own
// crew. An operational staff member can only do one job a day, so once a person
// is booked for any gallery slot that day — in any facility, on any event — they
// are unavailable for every other slot that day. They must also have the
// pattern's required capability. Within each capability tier the least-loaded
// person is picked first so the work rotates evenly. Falls back to
// 'Freelance required' when the qualified pool is exhausted.
// Events are processed in priority tiers: definite (Y) → possible (P) → unscheduled.
// Each tier's existing assignments are locked in before that tier's TBA slots are filled,
// so possible-event staff never block definite events from getting first pick.
function autoAllocateDay(dateEvents, assignments, staff, patternMap, defaultPatterns, profiles, decisions = {}, locks = {}) {
  const next = { ...assignments }
  // One person = one job per day, across every role and every facility.
  const dayUsed = new Set()
  // Running job counts per role (all facilities pooled), seeded from every
  // existing assignment and bumped as we allocate, so balance carries across
  // events, facilities, tiers and days.
  const load = {}
  for (const r of GALLERY_ROLES) {
    load[r.role] = roleLoad(next, GALLERY_LOCATIONS.map(l => galleryField(l.key, r.role)))
  }

  const tiers = ['definite', 'possible', 'unscheduled'].map(status =>
    dateEvents.filter(e => eventStatus(e.id, decisions) === status)
  )

  for (const tier of tiers) {
    // Lock existing assignments for this tier before filling any TBA in it
    tier.forEach(event => {
      const asgn = next[event.id] || {}
      for (const { field } of GALLERY_SLOTS) {
        if (asgn[field] && asgn[field] !== 'Freelance required') dayUsed.add(asgn[field])
      }
    })

    // Fill TBA slots for this tier
    tier.forEach(event => {
      const asgn     = { ...(next[event.id] || {}) }
      const pattern  = getPatternFor(event, next, patternMap, defaultPatterns)
      const evsCount = tv(asgn, pattern, 'techEvsOperator', 'evsOperator')
      const reqCap   = deriveRequiredCap(pattern)
      const locations = galleryLocationsForEvent(event, next, patternMap, defaultPatterns)
      let changed = false

      for (const location of locations) {
        for (const { role, staffKey } of GALLERY_ROLES) {
          if (role === 'evsOperator' && !(evsCount > 0)) continue
          const field = galleryField(location, role)
          if (asgn[field] || isRoleLocked(locks, event.id, field)) continue

          const pool   = orderByLoad(capable(staff[staffKey], profiles, staffKey, reqCap), profiles, staffKey, load[role])
          const person = pool.find(n => !dayUsed.has(n))
          asgn[field] = person ?? 'Freelance required'
          if (person) { dayUsed.add(person); load[role].set(person, (load[role].get(person) || 0) + 1) }
          changed = true
        }
      }

      if (changed) next[event.id] = asgn
    })
  }

  return next
}

// Only a real, named allocation is lockable — not an empty (TBA) or
// unfulfilled (Freelance required) slot.
function isNamedAllocation(text) {
  return text !== 'TBA' && text !== 'Freelance required'
}

function EventLockButton({ locked, onClick }) {
  return (
    <button
      className={`booth-lock-btn${locked ? ' booth-lock-btn--locked' : ''}`}
      onClick={e => { e.stopPropagation(); onClick() }}
      title={locked ? 'Unlock event' : 'Lock event'}
    >
      {locked ? 'Locked' : 'Lock event'}
    </button>
  )
}

function RoleLockBadge({ locked, onClick }) {
  return (
    <button
      className={`booth-role-lock-btn${locked ? ' booth-role-lock-btn--locked' : ''}`}
      onClick={e => { e.stopPropagation(); onClick() }}
      title={locked ? 'Unlock to make changes' : 'Lock this person'}
    >
      {locked ? 'Locked' : 'Lock'}
    </button>
  )
}

function staffDisplay(name, eventId, roleKey, staffKey, profiles, bookings, locked) {
  const rowLockCls = locked ? ' booth-staff-row--locked' : ''
  if (!name)                         return { text: 'TBA',               cls: 'booth-staff-tba',      rowCls: rowLockCls }
  if (name === 'Freelance required') return { text: 'Freelance required', cls: 'booth-staff-freelance', rowCls: `booth-staff-row--freelance${rowLockCls}` }
  const isStaff = profiles[staffKey]?.[name]?.isStaff ?? false
  const storedStatus = bookings[eventId]?.[roleKey] || ''
  const effectiveStatus = isStaff ? 'confirmed' : storedStatus
  const cls = effectiveStatus === 'confirmed' ? 'booth-staff-name--confirmed'
            : effectiveStatus === 'offered'   ? 'booth-staff-name--offered'
            :                                   'booth-staff-name--unbooked'
  return { text: name, cls, rowCls: rowLockCls }
}

// One card in the Booths / Studios / OB Units section. `location` picks which
// gallery crew (via galleryField) it reads and locks — each facility an event
// uses gets its own director/EVS/graphics.
function BoothCard({ event, idx, location, numberLabel, overCapacity = false, ctx }) {
  const { assignments, patternMap, defaultPatterns, decisions, profiles, bookings, locks,
          onEventClick, toggleRoleLock, toggleEventLock } = ctx
  const p          = event.extendedProps
  const asgn       = assignments[event.id] || {}
  const pattern    = getPatternFor(event, assignments, patternMap, defaultPatterns)
  const timePart   = !event.allDay && event.start.length > 10 ? event.start.slice(11, 16) : null
  const evsCount   = tv(asgn, pattern, 'techEvsOperator', 'evsOperator')
  const isPossible  = eventStatus(event.id, decisions) === 'possible'

  const slots = GALLERY_ROLES
    .filter(r => r.role !== 'evsOperator' || evsCount > 0)
    .map(r => ({ ...r, field: galleryField(location, r.role) }))
  const roleKeys    = slots.map(s => s.field)
  const fullyLocked = isEventFullyLocked(locks, event.id, roleKeys)

  return (
    <div
      className={`booth-card${overCapacity ? ' booth-card--over-capacity' : ''}`}
      onClick={() => onEventClick?.(event)}
      style={{ cursor: 'pointer' }}
    >
      <div className="booth-card-header" style={{ background: event.backgroundColor }}>
        <span className="booth-number">{numberLabel}</span>
        {overCapacity && <span className="booth-over-label">Over capacity</span>}
        <EventLockButton locked={fullyLocked} onClick={() => toggleEventLock(event.id, roleKeys)} />
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
          {slots.map(s => {
            const d = staffDisplay(
              asgn[s.field], event.id, s.field, s.staffKey, profiles, bookings,
              isRoleLocked(locks, event.id, s.field),
            )
            return (
              <div key={s.field} className={`booth-staff-row ${d.rowCls}`}>
                <span className="booth-staff-role">{s.label}</span>
                <span className={`booth-staff-name ${d.cls}`}>{d.text}</span>
                {isNamedAllocation(d.text) && (
                  <RoleLockBadge
                    locked={isRoleLocked(locks, event.id, s.field)}
                    onClick={() => toggleRoleLock(event.id, s.field)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BoothsView({ events, onEventClick }) {
  const [assignments, setAssignmentsRaw] = useState(loadAssignments)
  const [patterns]        = useState(loadPatterns)
  const [defaultPatterns] = useState(loadDefaultPatterns)
  const [techStack]       = useState(loadTechStack)
  const [staff]           = useState(loadStaff)
  const [profiles]        = useState(loadProfiles)
  const [bookings, setBookings] = useState(loadBookings)
  const [locks, setLocks]       = useState(loadLocks)
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
    function onUpdate() { setLocks(loadLocks()) }
    window.addEventListener('locks-updated', onUpdate)
    return () => window.removeEventListener('locks-updated', onUpdate)
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
    if (!saveToStorage('production_assignments', next)) return
    setAssignmentsRaw(next)
  }

  function saveBookings(next) {
    if (!saveToStorage('staff_bookings', next)) return
    setBookings(next)
    window.dispatchEvent(new CustomEvent('bookings-updated'))
  }

  function toggleRoleLock(eventId, roleKey) {
    const next = withRoleLock(locks, eventId, roleKey, !isRoleLocked(locks, eventId, roleKey))
    persistLocks(next)
    setLocks(next)
  }

  function toggleEventLock(eventId, roleKeys) {
    const next = withEventLock(locks, eventId, roleKeys, !isEventFullyLocked(locks, eventId, roleKeys))
    persistLocks(next)
    setLocks(next)
  }

  // Every named gallery allocation (real person, not TBA / Freelance required)
  // across a day's booth, studio and OB events.
  function dayLockTargets(date) {
    return (byDateAll[date] || []).flatMap(e => {
      const asgn = assignments[e.id] || {}
      return GALLERY_SLOTS
        .filter(s => isNamedAllocation(asgn[s.field] ?? 'TBA'))
        .map(s => ({ id: e.id, field: s.field }))
    })
  }

  function toggleDayLock(date) {
    const targets = dayLockTargets(date)
    if (targets.length === 0) return
    const lock = !targets.every(t => isRoleLocked(locks, t.id, t.field))
    let next = locks
    for (const t of targets) next = withRoleLock(next, t.id, t.field, lock)
    persistLocks(next)
    setLocks(next)
  }

  function showClearNotice(accepted, offered) {
    if (accepted === 0 && offered === 0) return
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    setClearNotice({ accepted, offered })
    clearTimerRef.current = setTimeout(() => setClearNotice(null), 5000)
  }

  // One-time move of legacy flat gallery allocations to their real facility.
  // Before per-location crews, a studio-only / OB-only event kept its crew in
  // the bare director/evsOperator/graphicsOperator fields; those now mean "the
  // booth crew", so relocate them for events that don't use a booth.
  useEffect(() => {
    if (localStorage.getItem('assignments_gallery_locations_v1')) return
    try {
      const asg = JSON.parse(localStorage.getItem('production_assignments') || '{}')
      const bk  = JSON.parse(localStorage.getItem('staff_bookings') || '{}')
      const lk  = JSON.parse(localStorage.getItem('staff_locks') || '{}')
      const pm  = Object.fromEntries(JSON.parse(localStorage.getItem('admin_patterns') || '[]').map(p => [p.id, p]))
      const dp  = JSON.parse(localStorage.getItem('rights_default_patterns') || '{}')
      const evById = Object.fromEntries(events.map(e => [e.id, e]))
      let changed = false
      for (const [id, a] of Object.entries(asg)) {
        const ev = evById[id]
        if (!ev) continue
        const locs = galleryLocationsForEvent(ev, asg, pm, dp)
        if (locs.includes('booth') || locs.length === 0) continue  // booth keeps the bare fields
        const target = locs[0]
        for (const r of GALLERY_ROLES) {
          const dest = galleryField(target, r.role)
          if (a[r.role] !== undefined && a[dest] === undefined) {
            a[dest] = a[r.role]; delete a[r.role]; changed = true
            if (bk[id]?.[r.role] !== undefined) { bk[id][dest] = bk[id][r.role]; delete bk[id][r.role] }
            if (lk[id]?.[r.role] !== undefined) { lk[id][dest] = lk[id][r.role]; delete lk[id][r.role] }
          }
        }
      }
      localStorage.setItem('assignments_gallery_locations_v1', '1')
      if (changed) {
        saveToStorage('production_assignments', asg)
        saveToStorage('staff_bookings', bk)
        saveToStorage('staff_locks', lk)
        setAssignmentsRaw(asg)
        setBookings(bk)
        setLocks(lk)
      }
    } catch { /* leave existing data untouched */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cardCtx = {
    assignments, patternMap, defaultPatterns, decisions, profiles, bookings, locks,
    onEventClick, toggleRoleLock, toggleEventLock,
  }

  const initEvents = events.filter(e => decisions[e.id]?.initProduction)

  const boothEvents  = initEvents.filter(e => needsBooth(e, assignments, patternMap, defaultPatterns))
  const studioEvents = initEvents.filter(e => needsStudio(e, assignments, patternMap, defaultPatterns))
  const obUnitEvents = initEvents.filter(e => needsObUnit(e, assignments, patternMap, defaultPatterns))

  const byDate = {}
  boothEvents.forEach(event => {
    const date = event.start.slice(0, 10)
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(event)
  })

  const byDateStudio = {}
  studioEvents.forEach(event => {
    const date = event.start.slice(0, 10)
    if (!byDateStudio[date]) byDateStudio[date] = []
    byDateStudio[date].push(event)
  })

  const byDateObUnit = {}
  obUnitEvents.forEach(event => {
    const date = event.start.slice(0, 10)
    if (!byDateObUnit[date]) byDateObUnit[date] = []
    byDateObUnit[date].push(event)
  })

  const sortedDates = Array.from(new Set([...Object.keys(byDate), ...Object.keys(byDateStudio), ...Object.keys(byDateObUnit)])).sort()
  sortedDates.forEach(date => {
    if (byDate[date])       byDate[date].sort((a, b) => a.start.localeCompare(b.start))
    if (byDateStudio[date]) byDateStudio[date].sort((a, b) => a.start.localeCompare(b.start))
    if (byDateObUnit[date]) byDateObUnit[date].sort((a, b) => a.start.localeCompare(b.start))
  })

  // Booth + studio + OB unit events share the same director/EVS/graphics staff
  // pool per day, so allocation and clearing must operate on the combined,
  // deduplicated set.
  const byDateAll = {}
  sortedDates.forEach(date => {
    const seen = new Set()
    byDateAll[date] = [...(byDate[date] || []), ...(byDateStudio[date] || []), ...(byDateObUnit[date] || [])]
      .filter(e => (seen.has(e.id) ? false : (seen.add(e.id), true)))
  })

  if (sortedDates.length === 0) {
    return (
      <div className="booths-container">
        <div className="booths-toolbar"><div className="ed-toolbar-right" /></div>
        <div className="booths-view">
          <div className="booths-empty">
            <p>No booth, studio or OB unit events found.</p>
            <span>Events get a booth, studio or OB unit when their production pattern has that resource set to Yes, or when it is manually enabled in the Event Inspector.</span>
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
              if (!window.confirm('Clear all allocated staff from every booth? Locked assignments are left untouched. This cannot be undone.')) return
              const allIds = Object.keys(assignments)
              const { accepted, offered, nextBookings } = computeClear(allIds, assignments, profiles, bookings, locks)
              const nextAssignments = Object.fromEntries(
                Object.entries(assignments).map(([id, asgn]) => [id, stripUnlockedRoles(asgn, id, locks)])
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
                next = autoAllocateDay(byDateAll[date], next, staff, patternMap, defaultPatterns, profiles, decisions, locks)
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
        const dayTargets = dayLockTargets(date)
        const dayFullyLocked = dayTargets.length > 0 &&
          dayTargets.every(t => isRoleLocked(locks, t.id, t.field))
        return (
          <div key={date} ref={el => { groupRefs.current[date] = el }} className="booths-date-group">
            <div className="booths-date-header-row">
              <h2 className="booths-date-header">{dateLabel}</h2>
              <button
                className={`booths-lock-day-btn${dayFullyLocked ? ' booths-lock-day-btn--locked' : ''}`}
                disabled={dayTargets.length === 0}
                onClick={() => toggleDayLock(date)}
              >
                {dayFullyLocked ? 'Unlock day' : 'Lock day'}
              </button>
              <div className="booths-header-buttons">
                <div className="booths-btn-group">
                  <button
                    className="booths-clear-day-btn"
                    onClick={() => {
                      const dayIds = new Set(byDateAll[date].map(e => e.id))
                      const { accepted, offered, nextBookings } = computeClear([...dayIds], assignments, profiles, bookings, locks)
                      const nextAssignments = Object.fromEntries(
                        Object.entries(assignments).map(([id, asgn]) =>
                          dayIds.has(id) ? [id, stripUnlockedRoles(asgn, id, locks)] : [id, asgn]
                        )
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
                      autoAllocateDay(byDateAll[date], assignments, staff, patternMap, defaultPatterns, profiles, decisions, locks)
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
                      const forwardIds = new Set(forwardDates.flatMap(d => byDateAll[d].map(e => e.id)))
                      const { accepted, offered, nextBookings } = computeClear([...forwardIds], assignments, profiles, bookings, locks)
                      const nextAssignments = Object.fromEntries(
                        Object.entries(assignments).map(([id, asgn]) =>
                          forwardIds.has(id) ? [id, stripUnlockedRoles(asgn, id, locks)] : [id, asgn]
                        )
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
                        next = autoAllocateDay(byDateAll[d], next, staff, patternMap, defaultPatterns, profiles, decisions, locks)
                      }
                      saveAssignments(next)
                    }}
                  >
                    Allocate forward
                  </button>
                </div>
              </div>
            </div>

            {byDate[date] && (
            <div className="booths-row">
              {byDate[date].map((event, idx) => (
                <BoothCard
                  key={event.id}
                  event={event}
                  idx={idx}
                  location="booth"
                  numberLabel={`Booth ${idx + 1}`}
                  overCapacity={maxBooths > 0 && (idx + 1) > maxBooths}
                  ctx={cardCtx}
                />
              ))}
            </div>
            )}

            {byDateStudio[date] && (
            <>
              <div className="studios-section-label">Studios</div>
              <div className="booths-row studios-row">
                {byDateStudio[date].map((event, idx) => (
                  <BoothCard
                    key={event.id}
                    event={event}
                    idx={idx}
                    location="studio"
                    numberLabel={`Studio ${idx + 1}`}
                    ctx={cardCtx}
                  />
                ))}
              </div>
            </>
            )}

            {byDateObUnit[date] && (
            <>
              <div className="studios-section-label">OB Units</div>
              <div className="booths-row studios-row">
                {byDateObUnit[date].map((event, idx) => (
                  <BoothCard
                    key={event.id}
                    event={event}
                    idx={idx}
                    location="ob"
                    numberLabel={`OB Unit ${idx + 1}`}
                    ctx={cardCtx}
                  />
                ))}
              </div>
            </>
            )}
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
