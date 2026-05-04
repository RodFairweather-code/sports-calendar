import { useRef, useState } from 'react'

function formatDateRange(start, end) {
  if (!start) return '—'
  const s = new Date(start.slice(0, 10) + 'T12:00:00')
  const dateOpts = { day: 'numeric', month: 'short', year: 'numeric' }
  const dayOpts  = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
  if (!end) return s.toLocaleDateString('en-GB', dayOpts)
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

function loadPatterns() {
  try { return JSON.parse(localStorage.getItem('admin_patterns') || '[]') }
  catch { return [] }
}

function loadStaff() {
  const empty = {
    cameramen: [], onsiteAudio: [], onsiteProductionManager: [],
    director: [], producer: [], commentator: [], evsOperator: [], graphicsOperator: [],
  }
  try { return { ...empty, ...JSON.parse(localStorage.getItem('admin_staff') || '{}') } }
  catch { return empty }
}

function loadAssignments() {
  try { return JSON.parse(localStorage.getItem('production_assignments') || '{}') }
  catch { return {} }
}

function persistAssignments(a) {
  localStorage.setItem('production_assignments', JSON.stringify(a))
}

function AssignSelect({ value, options, emptyLabel, onChange }) {
  return (
    <select
      className={`prod-select${value ? ' prod-select--set' : ''}`}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onClick={e => e.stopPropagation()}
    >
      <option value="">{emptyLabel}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function ProductionView({ events, onEventClick }) {
  const rowRefs = useRef({})
  const [selectedDate, setSelectedDate] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(null)
  const [decisions]   = useState(loadDecisions)
  const [patterns]    = useState(loadPatterns)
  const [staff]       = useState(loadStaff)
  const [assignments, setAssignments] = useState(loadAssignments)

  const todayStr = new Date().toISOString().slice(0, 10)

  const sorted = [...events]
    .filter(e => decisions[e.id]?.initProduction)
    .sort((a, b) => {
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

  function setAssignment(eventId, field, value) {
    setAssignments(prev => {
      const next = { ...prev, [eventId]: { ...prev[eventId], [field]: value } }
      persistAssignments(next)
      return next
    })
  }

  const patternOptions = patterns.map(p => ({ value: p.id, label: p.name }))
  const directorOptions = (staff.director || []).map(n => ({ value: n, label: n }))
  const pmOptions = (staff.onsiteProductionManager || []).map(n => ({ value: n, label: n }))

  return (
    <div className="editorial-view">

      <div className="editorial-toolbar">
        <div className="ed-toolbar-right">
          <label className="ed-date-label" htmlFor="prod-date-picker">Go to date</label>
          <input
            id="prod-date-picker"
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
        {sorted.length === 0 ? (
          <div className="prod-empty">
            <p>No events are queued for production.</p>
            <span>
              Tick <strong>Init Production</strong> on the Editorial Decisions page
              to send events here.
            </span>
          </div>
        ) : (
          <table className="editorial-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Sport</th>
                <th>Competition</th>
                <th>Event</th>
                <th>Venue</th>
                <th className="prod-assign-th">Production Type</th>
                <th className="prod-assign-th">Director</th>
                <th className="prod-assign-th">Production Manager</th>
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
                const asgn = assignments[event.id] || {}

                return (
                  <tr
                    key={event.id}
                    ref={el => { if (el) rowRefs.current[i] = el; else delete rowRefs.current[i] }}
                    onClick={() => onEventClick(event)}
                    className={`ed-row${isToday ? ' ed-row--today' : ''}${isHighlighted ? ' ed-row--highlight' : ''}`}
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
                    <td className="prod-assign-td">
                      <AssignSelect
                        value={asgn.patternId}
                        options={patternOptions}
                        emptyLabel={patternOptions.length ? '— select pattern —' : '(no patterns set up)'}
                        onChange={v => setAssignment(event.id, 'patternId', v)}
                      />
                    </td>
                    <td className="prod-assign-td">
                      <AssignSelect
                        value={asgn.director}
                        options={directorOptions}
                        emptyLabel={directorOptions.length ? '— select director —' : '(no directors set up)'}
                        onChange={v => setAssignment(event.id, 'director', v)}
                      />
                    </td>
                    <td className="prod-assign-td">
                      <AssignSelect
                        value={asgn.productionManager}
                        options={pmOptions}
                        emptyLabel={pmOptions.length ? '— select PM —' : '(no PMs set up)'}
                        onChange={v => setAssignment(event.id, 'productionManager', v)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

export default ProductionView
