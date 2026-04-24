function EventModal({ event, onClose }) {
  const p = event.extendedProps

  const dateStr = event.start
    ? new Date(event.start).toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  const timeStr = event.start && !event.allDay
    ? new Date(event.start).toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
      })
    : null

  const hasScore =
    p.homeScore !== null && p.homeScore !== undefined && p.homeScore !== '' &&
    p.awayScore !== null && p.awayScore !== undefined && p.awayScore !== ''

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <p className="modal-meta">{p.competitionName} · {p.governingBody}</p>
        <h2 className="modal-title">{event.title}</h2>

        {p.homeTeam && p.awayTeam && (
          <div className="teams">
            <span className="team">{p.homeTeam}</span>
            <span className="score-vs">{hasScore ? `${p.homeScore} – ${p.awayScore}` : 'vs'}</span>
            <span className="team team-away">{p.awayTeam}</span>
          </div>
        )}

        <div className="modal-details">
          {p.round && <p><strong>Round:</strong> {p.round}</p>}
          {dateStr && <p><strong>Date:</strong> {dateStr}</p>}
          {timeStr && <p><strong>Kick-off:</strong> {timeStr} (London)</p>}
          {p.venue && <p><strong>Venue:</strong> {p.venue}</p>}
        </div>
      </div>
    </div>
  )
}

export default EventModal
