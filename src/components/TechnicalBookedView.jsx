import { useEffect, useState, useRef, Fragment } from 'react'
import { addHours } from '../services/bookingTime'
import { addMinutesToLocalDatetime } from '../services/excelImport'
import { loadDefaultTimings } from '../services/defaultTimings'

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

// A category's real booking window: the pattern's "From start" offset
// applied to the event's start time, and "Until end" applied to its end
// time. Most events here have no recorded end time, so it falls back to
// the start time — the window then just reflects the Until offset alone.
function timeWindow(event, fromOffset, untilOffset) {
  const isTimed = !!event.start && event.start.length >= 16
  if (!isTimed) return { label: '—', sortMin: -Infinity }

  const startTime = event.start.slice(11, 16)
  const endTime = (event.end && event.end.length >= 16) ? event.end.slice(11, 16) : startTime

  const from = addHours(startTime, fromOffset)
  const until = addHours(endTime, untilOffset)

  const tag = off => off ? ` (${off > 0 ? '+' : ''}${off}d)` : ''
  const sameInstant = from.time === until.time && from.dayOffset === until.dayOffset
  const label = sameInstant
    ? `${from.time}${tag(from.dayOffset)}`
    : `${from.time}${tag(from.dayOffset)} – ${until.time}${tag(until.dayOffset)}`

  const [fh, fm] = from.time.split(':').map(Number)
  const sortMin = from.dayOffset * 1440 + fh * 60 + fm

  return { label, sortMin }
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

function splitDateTime(value) {
  if (!value || value.length < 16) return null
  return { date: value.slice(0, 10), time: value.slice(11, 16) }
}

function formatOffsetResult(resultDatetime, baseDate) {
  const resultDate = resultDatetime.slice(0, 10)
  const resultTime = resultDatetime.slice(11, 16)
  const dayTag = resultDate === baseDate ? '' : (resultDate > baseDate ? ' (+1d)' : ' (-1d)')
  return `${resultTime}${dayTag}`
}

// MCR control-room timings for an event, from the competition's default
// offsets (minutes): Lineup and Live Feed count back from the event's
// start, Auto Teardown counts forward from its end (or start, if no end
// is recorded).
function computeControlTimes(event, timing) {
  const startDT = splitDateTime(event.start)
  if (!startDT) return { lineup: '—', liveFeed: '—', teardown: '—' }

  const endDT = splitDateTime(event.end) || startDT
  const lineupMin = timing?.lineup || 0
  const liveFeedMin = timing?.liveFeed || 0
  const teardownMin = timing?.autoTeardown || 0

  return {
    lineup: formatOffsetResult(addMinutesToLocalDatetime(startDT.date, startDT.time, -lineupMin), startDT.date),
    liveFeed: formatOffsetResult(addMinutesToLocalDatetime(startDT.date, startDT.time, -liveFeedMin), startDT.date),
    teardown: formatOffsetResult(addMinutesToLocalDatetime(endDT.date, endDT.time, teardownMin), endDT.date),
  }
}

function TechnicalBookedView({ events }) {
  const [decisions]       = useState(loadDecisions)
  const [assignments, setAssignments] = useState(loadAssignments)
  const [defaultPatterns] = useState(loadDefaultPatterns)
  const [patterns]        = useState(loadPatterns)
  const [defaultTimings]  = useState(loadDefaultTimings)

  useEffect(() => {
    function onUpdate() { setAssignments(loadAssignments()) }
    window.addEventListener('assignments-updated', onUpdate)
    return () => window.removeEventListener('assignments-updated', onUpdate)
  }, [])

  useEffect(() => {
    if (todayIndex !== -1) scrollToDate(todayStr)
  }, [])

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
    const timing = defaultTimings[event.extendedProps.competitionId]
    const controlTimes = computeControlTimes(event, timing)

    CATEGORY_DEFS.forEach(def => {
      const value = def.isFlag
        ? flagValue(asgn, pattern, def.key, def.patternKey)
        : tv(asgn, pattern, def.key, def.patternKey)
      if (!value) return

      const fromOffset = def.fromKey ? ((pattern?.[def.fromKey]) || 0) : 0
      const untilOffset = def.untilKey ? ((pattern?.[def.untilKey]) || 0) : 0
      const { label: timeLabel, sortMin } = timeWindow(event, fromOffset, untilOffset)

      if (!dayMap[dateStr]) dayMap[dateStr] = {}
      if (!dayMap[dateStr][def.label]) dayMap[dateStr][def.label] = []
      dayMap[dateStr][def.label].push({
        timeLabel, sortMin, qty: def.isFlag ? null : value, event, status, controlTimes,
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
                            <li key={i} className="tv2-cat-row">
                              <div className="tv2-cat-item">
                                <span className="tv2-time-badge">{b.timeLabel}</span>
                                {b.qty != null && <span className="tv2-qty">{b.qty}</span>}
                                <span className="tv-dot" style={{ background: b.event.backgroundColor }} />
                                <span className="tv-event-name">{b.event.title}</span>
                                <span className={`tv-pill tv-pill--${b.status}`}>{b.status === 'confirmed' ? 'Confirmed' : 'Possible'}</span>
                              </div>
                              <div className="tv2-control-times">
                                <span className="tv2-control-badge">Lineup {b.controlTimes.lineup}</span>
                                <span className="tv2-control-badge">Live Feed {b.controlTimes.liveFeed}</span>
                                <span className="tv2-control-badge">Auto Teardown {b.controlTimes.teardown}</span>
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
    </div>
  )
}

export default TechnicalBookedView
