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

function EditorialView({ events, onEventClick }) {
  const rowRefs = useRef({})
  const [selectedDate, setSelectedDate] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(null)
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

  return (
    <div className="editorial-view">

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
              <th>Round</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((event, i) => {
              const ep = event.extendedProps
              const isAllDay = event.allDay || !event.start || event.start.length === 10
              const dateStr = formatDateRange(event.start, isAllDay ? event.end : null)
              const timeStr = isAllDay ? '' : (event.start?.slice(11, 16) ?? '—')
              const hasScore = ep.homeScore != null && ep.awayScore != null
              const score = hasScore ? `${ep.homeScore} – ${ep.awayScore}` : null
              const isToday = i === todayIndex
              const isHighlighted = i === highlightedIndex

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
                  <td className="ed-round">{ep.round || '—'}</td>
                  <td className="ed-score">
                    {score ?? <span className="ed-tbc">TBC</span>}
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
