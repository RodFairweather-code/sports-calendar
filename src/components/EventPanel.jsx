import { useEffect } from 'react'

function EventPanel({ event, onClose }) {
  const p = event.extendedProps

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Parse date/time from stored London-local string (avoid timezone shift)
  const datePart = event.start?.slice(0, 10)
  const timePart = !event.allDay && event.start?.length > 10 ? event.start.slice(11, 16) : null

  const dateStr = datePart
    ? new Date(datePart + 'T12:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  // Multi-day end (ATP tournaments) — end is exclusive
  const endDateStr = event.end && event.allDay
    ? (() => {
        const d = new Date(event.end.slice(0, 10) + 'T12:00:00')
        d.setDate(d.getDate() - 1)
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      })()
    : null

  const hasScore =
    p.homeScore !== null && p.homeScore !== undefined && p.homeScore !== '' &&
    p.awayScore !== null && p.awayScore !== undefined && p.awayScore !== ''

  const kickoffLabel = p.sport === 'Rugby Union' ? 'Kick-off' : p.sport === 'Tennis' ? 'Starts' : 'Kick-off'

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} aria-hidden="true" />

      <aside className="event-panel" role="dialog" aria-modal="true" aria-label={event.title}>

        {/* Coloured accent bar */}
        <div className="ep-accent" style={{ background: event.backgroundColor }} />

        {/* Header row */}
        <div className="ep-header">
          <div className="ep-header-meta">
            <span className="ep-comp-dot" style={{ background: event.backgroundColor }} />
            <span className="ep-comp-name">{p.competitionName}</span>
            <span className="ep-sport-badge">{p.sport}</span>
          </div>
          <button className="ep-close" onClick={onClose} aria-label="Close panel">
            &#x2715;
          </button>
        </div>

        {/* Scrollable body */}
        <div className="ep-body">

          <h2 className="ep-title">{event.title}</h2>

          {/* Teams / score block (football & rugby) */}
          {p.homeTeam && p.awayTeam && (
            <div className="ep-teams">
              <span className="ep-team">{p.homeTeam}</span>
              <span className="ep-score-vs">
                {hasScore ? `${p.homeScore} – ${p.awayScore}` : 'vs'}
              </span>
              <span className="ep-team ep-team-away">{p.awayTeam}</span>
            </div>
          )}

          {/* Detail rows */}
          <dl className="ep-details">
            {p.round && (
              <>
                <dt>Round</dt>
                <dd>{p.round}</dd>
              </>
            )}
            {dateStr && !endDateStr && (
              <>
                <dt>Date</dt>
                <dd>{dateStr}</dd>
              </>
            )}
            {dateStr && endDateStr && (
              <>
                <dt>Dates</dt>
                <dd>{dateStr} – {endDateStr}</dd>
              </>
            )}
            {timePart && (
              <>
                <dt>{kickoffLabel}</dt>
                <dd>{timePart} (London)</dd>
              </>
            )}
            {p.venue && (
              <>
                <dt>Venue</dt>
                <dd>{p.venue}</dd>
              </>
            )}
            {p.governingBody && (
              <>
                <dt>Organisation</dt>
                <dd>{p.governingBody}</dd>
              </>
            )}
            {hasScore && (
              <>
                <dt>Result</dt>
                <dd className="ep-result">{p.homeScore} – {p.awayScore}</dd>
              </>
            )}
          </dl>

        </div>
      </aside>
    </>
  )
}

export default EventPanel
