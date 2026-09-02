import { useEffect, useState, useRef, Fragment } from 'react'
import { saveToStorage } from '../services/storage'
import { loadDefaultTimings, resolveTimings } from '../services/defaultTimings'
import { needsBooth, needsStudio } from './BoothsView'
import { timeWindow, computeControlTimes } from '../services/mcrTiming'

function loadDecisions() {
  try { return JSON.parse(localStorage.getItem('editorial_decisions') || '{}') }
  catch { return {} }
}

function loadAssignments() {
  try { return JSON.parse(localStorage.getItem('production_assignments') || '{}') }
  catch { return {} }
}

function loadDefaultPatterns() {
  try { return JSON.parse(localStorage.getItem('rights_default_patterns') || '{}') }
  catch { return {} }
}

function loadPatterns() {
  try { return JSON.parse(localStorage.getItem('admin_patterns') || '[]') }
  catch { return [] }
}

// Effective value for a technical field: an explicit per-event override
// wins, otherwise fall back to the event's production pattern (if any).
function tv(asgn, pattern, techKey, patternKey) {
  if (asgn[techKey] !== undefined) return asgn[techKey]
  return (patternKey && pattern?.[patternKey]) || 0
}

function flagValue(asgn, pattern, techKey, patternKey) {
  if (asgn[techKey] !== undefined) return asgn[techKey]
  return (patternKey && pattern?.[patternKey]) || false
}

// Every category the page can show, in display order. Quantity categories
// (isFlag: false) show a booked count; flag categories show a badge only.
// fromKey/untilKey point at the pattern's hour-offset fields for that
// category's window — categories with no such fields just show the
// event's own start (and end, if known).
const CATEGORY_DEFS = [
  { group: 'Video Lines',      key: 'techIncomingVideoLines',    patternKey: 'incomingVideoLines',    fromKey: 'videoFrom', untilKey: 'videoUntil', label: 'Video Lines In',  isFlag: false },
  { group: 'Video Lines',      key: 'techOutgoingVideoLines',    patternKey: 'outgoingVideoLines',    fromKey: 'videoFrom', untilKey: 'videoUntil', label: 'Video Lines Out', isFlag: false },
  { group: 'Audio & Talkback', key: 'techIncomingAudioLines',    patternKey: 'incomingAudioLines',    fromKey: 'audioFrom', untilKey: 'audioUntil', label: 'Audio Lines In',  isFlag: false },
  { group: 'Audio & Talkback', key: 'techOutgoingAudioLines',    patternKey: null,                    fromKey: 'audioFrom', untilKey: 'audioUntil', label: 'Audio Lines Out', isFlag: false },
  { group: 'Audio & Talkback', key: 'techIncomingTalkbackLines', patternKey: 'incomingTalkbackLines', fromKey: 'audioFrom', untilKey: 'audioUntil', label: 'Talkback In',     isFlag: false },
  { group: 'Audio & Talkback', key: 'techOutgoingTalkbackLines', patternKey: 'outgoingTalkbackLines', fromKey: 'audioFrom', untilKey: 'audioUntil', label: 'Talkback Out',    isFlag: false },
  { group: 'Equipment',        key: 'techEncoders',              patternKey: null, fromKey: null, untilKey: null, label: 'Encoders',              isFlag: false },
  { group: 'Equipment',        key: 'techDecoders',              patternKey: null, fromKey: null, untilKey: null, label: 'Decoders',              isFlag: false },
  { group: 'Equipment',        key: 'techFrameRateConverters',   patternKey: null, fromKey: null, untilKey: null, label: 'Frame Rate Converters', isFlag: false },
  { group: 'Equipment',        key: 'techAudioOffset',           patternKey: null, fromKey: null, untilKey: null, label: 'Audio Offset',          isFlag: false },
  { group: 'Equipment',        key: 'techOutgoingIdents',        patternKey: null, fromKey: null, untilKey: null, label: 'Outgoing Idents',       isFlag: false },
  { group: 'Equipment',        key: 'techRecordPorts',           patternKey: null, fromKey: null, untilKey: null, label: 'Record Ports',          isFlag: false },
  { group: 'Production',       key: 'techProductionBooth',       patternKey: 'productionBooth', fromKey: null, untilKey: null, label: 'Production Booth', isFlag: true },
  { group: 'Production',       key: 'techStudio',                patternKey: 'studio',          fromKey: null, untilKey: null, label: 'Studio',            isFlag: true },
  { group: 'Production',       key: 'techObUnit',                patternKey: 'obUnit',           fromKey: null, untilKey: null, label: 'OB Unit',           isFlag: true },
  { group: 'Production',       key: 'techPassthrough',           patternKey: 'passthrough',      fromKey: null, untilKey: null, label: 'Passthrough',       isFlag: true },
]

const GROUPS = ['Video Lines', 'Audio & Talkback', 'Equipment', 'Production']

function TechnicalBookedView({ events }) {
  const [decisions]       = useState(loadDecisions)
  const [assignments, setAssignments] = useState(loadAssignments)
  const [defaultPatterns] = useState(loadDefaultPatterns)
  const [patterns]        = useState(loadPatterns)
  const [defaultTimings]  = useState(loadDefaultTimings)
  const [extendTarget, setExtendTarget] = useState(null)

  useEffect(() => {
    function onUpdate() { setAssignments(loadAssignments()) }
    window.addEventListener('assignments-updated', onUpdate)
    return () => window.removeEventListener('assignments-updated', onUpdate)
  }, [])

  function updateAssignment(eventId, patch) {
    setAssignments(prev => {
      const current = prev[eventId] || {}
      const next = { ...prev, [eventId]: { ...current, ...patch } }
      saveToStorage('production_assignments', next)
      window.dispatchEvent(new CustomEvent('assignments-updated'))
      return next
    })
  }

  // Same action as the Inspector's "URGENT: Extend timings" button — adds
  // another hour on top of the post-match show duration for this event. A
  // fresh extension always needs re-confirming, even if a previous one had
  // already been signed off by the supplier.
  function handleExtend(eventId) {
    if (!window.confirm('Are you sure you want to extend the timings for this event by an hour?')) return
    const current = assignments[eventId] || {}
    updateAssignment(eventId, { extendedMinutes: (current.extendedMinutes || 0) + 60, extensionConfirmed: false })
  }

  function handleConfirmBySupplier(eventId) {
    updateAssignment(eventId, { extensionConfirmed: true })
    setExtendTarget(null)
  }

  // Reverts to the original (un-extended) Lines Down time entirely, rather
  // than just undoing the last +1hr press.
  function handleCancelExtension(eventId) {
    updateAssignment(eventId, { extendedMinutes: 0, extensionConfirmed: false })
    setExtendTarget(null)
  }

  // Runs after every render (no deps) but only actually scrolls once, the
  // first time today's date shows up in sortedDays — on plain mount that's
  // immediate, but if this view mounts before events/competitions are
  // ready, sortedDays starts empty and only fills in on a later render.
  const hasScrolledToday = useRef(false)
  useEffect(() => {
    if (hasScrolledToday.current) return
    if (todayIndex !== -1) {
      scrollToDate(todayStr)
      hasScrolledToday.current = true
    }
  })

  const dayRefs = useRef({})
  const [selectedDate, setSelectedDate] = useState('')
  const todayStr = new Date().toISOString().slice(0, 10)

  const patternMap = Object.fromEntries(patterns.map(p => [p.id, p]))

  function getPattern(event) {
    const asgn = assignments[event.id]
    const patId = asgn?.patternId !== undefined
      ? asgn.patternId
      : (defaultPatterns[event.extendedProps.competitionId] || '')
    return patId ? (patternMap[patId] || null) : null
  }

  // Booth numbers exactly as the Operations page assigns them: among
  // Init-Production events that need a booth, grouped by day and sorted by
  // start time, numbered 1-based within each day.
  const boothNumbers = {}
  const boothEventsByDate = events
    .filter(e => decisions[e.id]?.initProduction && needsBooth(e, assignments, patternMap, defaultPatterns))
    .reduce((byDate, event) => {
      const d = event.start.slice(0, 10)
      ;(byDate[d] ||= []).push(event)
      return byDate
    }, {})
  Object.values(boothEventsByDate).forEach(dayEvents => {
    dayEvents.sort((a, b) => a.start.localeCompare(b.start))
    dayEvents.forEach((event, idx) => { boothNumbers[event.id] = idx + 1 })
  })

  function allocationLabel(event) {
    const boothNumber = boothNumbers[event.id]
    if (boothNumber) return `Booth ${boothNumber}`
    if (needsStudio(event, assignments, patternMap, defaultPatterns)) return 'Studio'
    return null
  }

  // dateStr -> { [categoryLabel]: [ { timeLabel, sortMin, qty, event, status } ] }
  const dayMap = {}

  events.forEach(event => {
    const dec = decisions[event.id] || {}
    const vals = Object.values(dec).filter(v => v === 'Y' || v === 'P')
    const hasY = vals.includes('Y')
    const hasP = vals.includes('P')
    if (!hasY && !hasP) return

    const dateStr = event.start?.slice(0, 10)
    if (!dateStr) return

    const asgn = assignments[event.id] || {}
    const pattern = getPattern(event)
    const status = hasY ? 'confirmed' : 'possible'
    const timing = resolveTimings(defaultTimings, event.extendedProps.competitionId)
    // An "Extend Timings" press on the Inspector adds an extra hour on top
    // of the post-match show duration — it pushes every technical
    // resource's booking window later, same as a longer post-match show.
    const postMatchTotal = (asgn.postMatchShowDuration || 0) + (asgn.extendedMinutes || 0)
    const controlTimes = computeControlTimes(event, timing, asgn.preMatchShowDuration, postMatchTotal)
    const allocation = allocationLabel(event)
    const extended = (asgn.extendedMinutes || 0) > 0
    const extensionConfirmed = !!asgn.extensionConfirmed

    CATEGORY_DEFS.forEach(def => {
      const value = def.isFlag
        ? flagValue(asgn, pattern, def.key, def.patternKey)
        : tv(asgn, pattern, def.key, def.patternKey)
      if (!value) return

      const fromOffset = def.fromKey ? ((pattern?.[def.fromKey]) || 0) : 0
      const untilOffset = def.untilKey ? ((pattern?.[def.untilKey]) || 0) : 0
      const { label: timeLabel, sortMin } = timeWindow(
        event, fromOffset, untilOffset, asgn.preMatchShowDuration, postMatchTotal
      )

      if (!dayMap[dateStr]) dayMap[dateStr] = {}
      if (!dayMap[dateStr][def.label]) dayMap[dateStr][def.label] = []
      dayMap[dateStr][def.label].push({
        timeLabel, sortMin, qty: def.isFlag ? null : value, event, status, controlTimes, allocation, extended, extensionConfirmed,
      })
    })
  })

  Object.values(dayMap).forEach(categories => {
    Object.values(categories).forEach(list => {
      list.sort((a, b) => a.sortMin - b.sortMin || a.event.title.localeCompare(b.event.title))
    })
  })

  const sortedDays = Object.keys(dayMap).sort()

  function scrollToDate(dateStr) {
    const target = sortedDays.find(d => d >= dateStr) || sortedDays[sortedDays.length - 1]
    if (target) dayRefs.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleDateChange(e) {
    setSelectedDate(e.target.value)
    if (e.target.value) scrollToDate(e.target.value)
  }

  const todayIndex = sortedDays.findIndex(d => d >= todayStr)

  if (sortedDays.length === 0) {
    return (
      <div className="tv-view">
        <div className="tv-empty">
          <p>No events selected yet.</p>
          <span>Mark events Y or P on the Planning page to see booked equipment here.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="tv-view">

      <div className="editorial-toolbar">
        <div className="ed-toolbar-right">
          <label className="ed-date-label" htmlFor="tv2-date-picker">Go to date</label>
          <input
            id="tv2-date-picker"
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
            disabled={todayIndex === -1}
            title={todayIndex === -1 ? 'No upcoming events' : 'Jump to today'}
          >
            Today
          </button>
        </div>
      </div>

      <div className="tv-scroll">
        {sortedDays.map(dateStr => {
          const categories = dayMap[dateStr]
          const date = new Date(dateStr + 'T12:00:00')
          const dateLabel = date.toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })

          const groupsWithData = GROUPS.filter(g =>
            CATEGORY_DEFS.some(def => def.group === g && categories[def.label]?.length)
          )

          return (
            <div key={dateStr} ref={el => { if (el) dayRefs.current[dateStr] = el; else delete dayRefs.current[dateStr] }} className="tv-day">

              <div className="tv-day-header">{dateLabel}</div>

              {groupsWithData.length === 0 ? (
                <p className="tv-none tv2-booking-none">No technical equipment booked</p>
              ) : (
                groupsWithData.map(group => (
                  <Fragment key={group}>
                    <div className="tv2-group-header">{group}</div>
                    {CATEGORY_DEFS.filter(def => def.group === group && categories[def.label]?.length).map(def => (
                      <div key={def.label} className="tv2-cat-block">
                        <div className="tv2-cat-title">{def.label}</div>
                        <ul className="tv2-cat-list">
                          {categories[def.label].map((b, i) => (
                            <li key={i}>
                              <div className="tv2-row">
                                <span className="tv2-cell tv2-cell--time">
                                  <span className="tv2-time-badge">{b.timeLabel}</span>
                                </span>
                                <span className="tv2-cell tv2-cell--qty">{b.qty != null ? b.qty : ''}</span>
                                <span className="tv2-cell tv2-cell--comp">
                                  <span className="tv-dot" style={{ background: b.event.backgroundColor }} />
                                  <span className="tv2-comp-name">{b.event.extendedProps.competitionName}</span>
                                </span>
                                <span className="tv2-cell tv2-cell--event">{b.event.title}</span>
                                <span className="tv2-cell tv2-cell--venue">{b.event.extendedProps.venue || '—'}</span>
                                <span className="tv2-cell tv2-cell--booth">
                                  {b.allocation && (
                                    <span className={`tv2-booth-badge${b.allocation === 'Studio' ? ' tv2-booth-badge--studio' : ''}`}>{b.allocation}</span>
                                  )}
                                </span>
                                <span className="tv2-cell tv2-cell--lineup">
                                  <span className="tv2-control-badge">Lines up {b.controlTimes.lineup}</span>
                                </span>
                                <span className="tv2-cell tv2-cell--livefeed">
                                  <span className="tv2-control-badge">Production available {b.controlTimes.liveFeed}</span>
                                </span>
                                <span className="tv2-cell tv2-cell--start">
                                  <span className="tv2-control-badge tv2-control-badge--start">Match start {b.controlTimes.start}</span>
                                </span>
                                <span className="tv2-cell tv2-cell--teardown">
                                  <span className="tv2-control-badge">Lines Down {b.controlTimes.teardown}</span>
                                </span>
                                <span className="tv2-cell tv2-cell--status">
                                  <span className={`tv-pill tv-pill--${b.status}`}>{b.status === 'confirmed' ? 'Confirmed' : 'Possible'}</span>
                                </span>
                                <span className="tv2-cell tv2-cell--spacer" />
                                <span className="tv2-cell tv2-cell--extend">
                                  {b.extended && (
                                    <button
                                      type="button"
                                      className={`tv2-extend-requested${b.extensionConfirmed ? ' tv2-extend-requested--confirmed' : ''}`}
                                      onClick={() => setExtendTarget(b.event)}
                                    >
                                      Extension requested
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="tv2-urgent-extend-btn"
                                    onClick={() => handleExtend(b.event.id)}
                                  >
                                    URGENT: Extend
                                  </button>
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </Fragment>
                ))
              )}

            </div>
          )
        })}
      </div>

      {extendTarget && (
        <div className="ba-modal-backdrop" onClick={() => setExtendTarget(null)}>
          <div className="ba-modal-dialog" onClick={e => e.stopPropagation()}>
            <h3>Extension — {extendTarget.title}</h3>
            <p className="assume-role-hint">
              This event's lines were extended by an hour. What's the status?
            </p>
            <div className="assume-role-list">
              <button
                type="button"
                className="assume-role-option"
                onClick={() => handleConfirmBySupplier(extendTarget.id)}
              >
                Lines extended by supplier
              </button>
              <button
                type="button"
                className="assume-role-option"
                onClick={() => handleCancelExtension(extendTarget.id)}
              >
                Cancel Extension
              </button>
            </div>
            <div className="ba-modal-actions">
              <button type="button" className="unsaved-btn unsaved-btn--cancel" onClick={() => setExtendTarget(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TechnicalBookedView
