import { useEffect, useState, useRef } from 'react'

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

const QUANTITY_ITEMS = [
  { key: 'techCameramen',             patternKey: 'cameramen',             label: 'Cameramen' },
  { key: 'techEvsOperator',           patternKey: 'evsOperator',           label: 'EVS Operators' },
  { key: 'techAudioOnLocation',       patternKey: 'audioOnLocation',       label: 'Audio on Location' },
  { key: 'techIncomingVideoLines',    patternKey: 'incomingVideoLines',    label: 'Video Lines In' },
  { key: 'techOutgoingVideoLines',    patternKey: 'outgoingVideoLines',    label: 'Video Lines Out' },
  { key: 'techIncomingAudioLines',    patternKey: 'incomingAudioLines',    label: 'Audio Lines In' },
  { key: 'techOutgoingAudioLines',    patternKey: null,                    label: 'Audio Lines Out' },
  { key: 'techIncomingTalkbackLines', patternKey: 'incomingTalkbackLines', label: 'Talkback In' },
  { key: 'techOutgoingTalkbackLines', patternKey: 'outgoingTalkbackLines', label: 'Talkback Out' },
  { key: 'techEncoders',              patternKey: null,                    label: 'Encoders' },
  { key: 'techDecoders',              patternKey: null,                    label: 'Decoders' },
  { key: 'techFrameRateConverters',   patternKey: null,                    label: 'Frame Rate Converters' },
  { key: 'techAudioOffset',           patternKey: null,                    label: 'Audio Offset' },
  { key: 'techOutgoingIdents',        patternKey: null,                    label: 'Outgoing Idents' },
  { key: 'techRecordPorts',           patternKey: null,                    label: 'Record Ports' },
]

const FLAG_ITEMS = [
  { key: 'techProductionBooth', patternKey: 'productionBooth', label: 'Production Booth' },
  { key: 'techStudio',          patternKey: 'studio',          label: 'Studio' },
  { key: 'techObUnit',          patternKey: 'obUnit',          label: 'OB Unit' },
  { key: 'techPassthrough',     patternKey: 'passthrough',     label: 'Passthrough' },
]

function flagValue(asgn, pattern, techKey, patternKey) {
  if (asgn[techKey] !== undefined) return asgn[techKey]
  return pattern?.[patternKey] ?? false
}

function bookedItems(asgn, pattern) {
  const items = []
  QUANTITY_ITEMS.forEach(({ key, patternKey, label }) => {
    const qty = tv(asgn, pattern, key, patternKey)
    if (qty > 0) items.push(`${qty} ${label}`)
  })
  FLAG_ITEMS.forEach(({ key, patternKey, label }) => {
    if (flagValue(asgn, pattern, key, patternKey)) items.push(label)
  })
  return items
}

function TechnicalBookedView({ events }) {
  const [decisions]       = useState(loadDecisions)
  const [assignments, setAssignments] = useState(loadAssignments)
  const [defaultPatterns] = useState(loadDefaultPatterns)
  const [patterns]        = useState(loadPatterns)

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

  const dayMap = {}

  events.forEach(event => {
    const dec = decisions[event.id] || {}
    const vals = Object.values(dec).filter(v => v === 'Y' || v === 'P')
    const hasY = vals.includes('Y')
    const hasP = vals.includes('P')
    if (!hasY && !hasP) return

    const dateStr = event.start?.slice(0, 10)
    if (!dateStr) return

    if (!dayMap[dateStr]) dayMap[dateStr] = []

    const asgn = assignments[event.id] || {}
    const pattern = getPattern(event)
    dayMap[dateStr].push({
      event,
      status: hasY ? 'confirmed' : 'possible',
      items: bookedItems(asgn, pattern),
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
          const dayEvents = dayMap[dateStr]
          const date = new Date(dateStr + 'T12:00:00')
          const dateLabel = date.toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })

          return (
            <div key={dateStr} ref={el => { if (el) dayRefs.current[dateStr] = el; else delete dayRefs.current[dateStr] }} className="tv-day">

              <div className="tv-day-header">{dateLabel}</div>

              <ul className="tv2-booking-list">
                {dayEvents.map(({ event, status, items }) => (
                  <li key={event.id} className="tv2-booking-item">
                    <div className="tv2-booking-head">
                      <span className="tv-dot" style={{ background: event.backgroundColor }} />
                      <span className="tv-event-name">{event.title}</span>
                      <span className={`tv-pill tv-pill--${status}`}>{status === 'confirmed' ? 'Confirmed' : 'Possible'}</span>
                    </div>
                    {items.length === 0
                      ? <p className="tv-none tv2-booking-none">No technical equipment booked</p>
                      : (
                        <div className="tv2-chip-row">
                          {items.map(item => <span key={item} className="tv2-chip">{item}</span>)}
                        </div>
                      )
                    }
                  </li>
                ))}
              </ul>

            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TechnicalBookedView
