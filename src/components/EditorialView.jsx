import { useRef, useState } from 'react'

function formatDateRange(start, end) {
  if (!start) return '—'
  const s = new Date(start.slice(0, 10) + 'T12:00:00')
  const dateOpts = { day: 'numeric', month: 'short', year: 'numeric' }
  const dayOpts  = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }

  if (!end) {
    return s.toLocaleDateString('en-GB', dayOpts)
  }
  const e = new Date(end.slice(0, 10) + 'T12:00:00')
  e.setDate(e.getDate() - 1)
  const sStr = s.toLocaleDateString('en-GB', dateOpts)
  const eStr = e.toLocaleDateString('en-GB', dateOpts)
  return sStr === eStr ? sStr : `${sStr} – ${eStr}`
}

function loadDecisions() {
  try { return JSON.parse(localStorage.getItem('editorial_decisions') || '{}') }
  catch { return {} }
}

function persistDecisions(d) {
  localStorage.setItem('editorial_decisions', JSON.stringify(d))
}

function loadPlatforms() {
  try { return JSON.parse(localStorage.getItem('admin_platforms') || '[]') }
  catch { return [] }
}

function loadRights() {
  try { return JSON.parse(localStorage.getItem('rights_matrix') || '{}') }
  catch { return {} }
}

// Cycles: empty → Y → P → empty. Keyboard Y/P also work directly.
function DecisionCell({ value, eventId, platformId, onChange }) {
  const state = value || ''

  function handleClick(e) {
    e.stopPropagation()
    const next = state === '' ? 'Y' : state === 'Y' ? 'P' : ''
    onChange(eventId, platformId, next)
  }

  function handleKeyDown(e) {
    e.stopPropagation()
    const k = e.key.toUpperCase()
    if (k === 'P') { e.preventDefault(); onChange(eventId, platformId, state === 'P' ? '' : 'P') }
    else if (k === 'Y') { e.preventDefault(); onChange(eventId, platformId, state === 'Y' ? '' : 'Y') }
    else if (k === 'DELETE' || k === 'BACKSPACE') { e.preventDefault(); onChange(eventId, platformId, '') }
  }

  const cls = state === 'Y' ? 'decision-cell decision-cell--yes'
            : state === 'P' ? 'decision-cell decision-cell--plan'
            : 'decision-cell decision-cell--empty'

  return (
    <div
      className={cls}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Coverage ${state || 'none'}`}
    >
      {state}
    </div>
  )
}

function EditorialView({ events, onEventClick }) {
  const rowRefs = useRef({})
  const [selectedDate, setSelectedDate] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(null)
  const [decisions, setDecisions] = useState(loadDecisions)
  const [platforms] = useState(loadPlatforms)
  const [rights] = useState(loadRights)
  const [rightsConflict, setRightsConflict] = useState(null)
  const todayStr = new Date().toISOString().slice(0, 10)

  const sorted = [...events].sort((a, b) => {
    if (!a.start) return 1
    if (!b.start) return -1
    return a.start.localeCompare(b.start)
  })

  const todayIndex = sorted.findIndex(e => e.start >= todayStr)

  function scrollToIndex(index) {
    rowRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function handleDateChange(e) {
    const dateStr = e.target.value
    setSelectedDate(dateStr)
    if (!dateStr) { setHighlightedIndex(null); return }
    const idx = sorted.findIndex(ev => ev.start >= dateStr)
    if (idx !== -1) { setHighlightedIndex(idx); scrollToIndex(idx) }
    else setHighlightedIndex(null)
  }

  function setDecision(eventId, platformId, value) {
    setDecisions(prev => {
      const next = { ...prev, [eventId]: { ...prev[eventId], [platformId]: value } }
      persistDecisions(next)
      return next
    })
  }

  function handleDecision(eventId, platformId, value) {
    if (value === 'Y' || value === 'P') {
      const competitionId = eventId.split('|')[0]
      if (rights[competitionId]?.[platformId] === 'N') {
        setRightsConflict({ eventId, platformId, value })
        return
      }
    }
    setDecision(eventId, platformId, value)
  }

  function confirmRightsOverride() {
    if (rightsConflict) {
      setDecision(rightsConflict.eventId, rightsConflict.platformId, rightsConflict.value)
    }
    setRightsConflict(null)
  }

  function cancelRightsOverride() {
    setRightsConflict(null)
  }

  function toggleInitProduction(eventId, e) {
    e.stopPropagation()
    setDecisions(prev => {
      const next = {
        ...prev,
        [eventId]: { ...prev[eventId], initProduction: !prev[eventId]?.initProduction },
      }
      persistDecisions(next)
      return next
    })
  }

  return (
    <div className="editorial-view">

      {rightsConflict && (
        <div className="unsaved-backdrop" onClick={cancelRightsOverride}>
          <div className="unsaved-dialog" onClick={e => e.stopPropagation()}>
            <p className="unsaved-dialog-msg">
              <strong>No rights for this selection</strong>
              You do not have the rights for this selection. Continue anyway?
            </p>
            <div className="unsaved-dialog-actions">
              <button className="unsaved-btn unsaved-btn--save" onClick={confirmRightsOverride}>
                Yes, continue and log that I have made this decision
              </button>
              <button className="unsaved-btn unsaved-btn--cancel" onClick={cancelRightsOverride}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="editorial-toolbar">
        <div className="ed-toolbar-right">
          <label className="ed-date-label" htmlFor="ed-date-picker">Go to date</label>
          <input
            id="ed-date-picker"
            type="date"
            className="ed-date-input"
            value={selectedDate}
            min="2025-01-01"
            max="2026-12-31"
            onChange={handleDateChange}
          />
          <button
            className="ed-today-btn"
            onClick={() => scrollToIndex(todayIndex)}
            disabled={todayIndex === -1}
            title={todayIndex === -1 ? 'No upcoming events' : 'Jump to today'}
          >
            Today
          </button>
        </div>
      </div>

      <div className="editorial-scroll">
        <table className="editorial-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Sport</th>
              <th>Competition</th>
              <th>Event</th>
              <th>Venue</th>
              {platforms.map(p => (
                <th key={p.id} className="ed-platform-th" title={p.name}>{p.name}</th>
              ))}
              <th className="ed-initprod-th">Init Production</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((event, i) => {
              const ep = event.extendedProps
              const isAllDay = event.allDay || !event.start || event.start.length === 10
              const dateStr = formatDateRange(event.start, isAllDay ? event.end : null)
              const timeStr = isAllDay ? '' : (event.start?.slice(11, 16) ?? '—')
              const isToday = i === todayIndex
              const isHighlighted = i === highlightedIndex
              const eventDecisions = decisions[event.id] || {}
              const platDecisions = platforms.map(p => eventDecisions[p.id] || '')
              const isPossibleOnly = platDecisions.some(d => d === 'P') && !platDecisions.some(d => d === 'Y')

              return (
                <tr
                  key={event.id}
                  ref={el => { if (el) rowRefs.current[i] = el; else delete rowRefs.current[i] }}
                  onClick={() => onEventClick(event)}
                  className={`ed-row${isToday ? ' ed-row--today' : ''}${isHighlighted ? ' ed-row--highlight' : ''}${isPossibleOnly ? ' ed-row--possible' : ''}`}
                >
                  <td className="ed-date">{dateStr}</td>
                  <td className="ed-time">{timeStr}</td>
                  <td className="ed-sport">{ep.sport}</td>
                  <td className="ed-comp">
                    <span className="ed-dot" style={{ background: event.backgroundColor }} />
                    {ep.competitionName}
                  </td>
                  <td className="ed-event">{event.title}</td>
                  <td className="ed-venue">{ep.venue || '—'}</td>
                  {platforms.map(p => {
                    const rightsState = rights[ep.competitionId]?.[p.id] || ''
                    const tdClass = rightsState === 'Y' ? ' ed-platform-td--rights-yes'
                                 : rightsState === 'N' ? ' ed-platform-td--rights-no'
                                 : ''
                    return (
                      <td key={p.id} className={`ed-platform-td${tdClass}`}>
                        {rightsState === 'N' && <span className="rights-no-cross" aria-hidden="true">✕</span>}
                        <DecisionCell
                          value={eventDecisions[p.id] || ''}
                          eventId={event.id}
                          platformId={p.id}
                          onChange={handleDecision}
                        />
                      </td>
                    )
                  })}
                  <td className="ed-initprod-td">
                    <input
                      type="checkbox"
                      className="ed-initprod-cb"
                      checked={!!eventDecisions.initProduction}
                      onChange={e => toggleInitProduction(event.id, e)}
                      onClick={e => e.stopPropagation()}
                      title="Initialise production planning"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default EditorialView
