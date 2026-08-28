function groupBySport(competitions) {
  const bySport = new Map()
  competitions.forEach(c => {
    if (!bySport.has(c.sport)) bySport.set(c.sport, [])
    bySport.get(c.sport).push(c)
  })
  return [...bySport.entries()]
    .map(([sport, comps]) => [sport, comps.slice().sort((a, b) => a.name.localeCompare(b.name))])
    .sort((a, b) => a[0].localeCompare(b[0]))
}

function ManageCompetitionsModal({ competitions, allEvents, onDeleteCompetitions, onClose }) {
  const sports = groupBySport(competitions)

  function eventCount(competitionId) {
    return allEvents.filter(e => e.extendedProps.competitionId === competitionId).length
  }

  function handleDeleteCompetition(comp) {
    const count = eventCount(comp.id)
    const eventsPhrase = count === 1 ? '1 event' : `${count} events`
    if (!window.confirm(
      `Delete "${comp.name}"? This removes the competition and ${eventsPhrase}, along with every ` +
      `related staff booking, editorial decision, and production assignment. This cannot be undone.`
    )) return
    onDeleteCompetitions([comp.id])
  }

  function handleDeleteSport(sport, comps) {
    const totalEvents = comps.reduce((sum, c) => sum + eventCount(c.id), 0)
    const compsPhrase = comps.length === 1 ? '1 competition' : `${comps.length} competitions`
    const eventsPhrase = totalEvents === 1 ? '1 event' : `${totalEvents} events`
    if (!window.confirm(
      `Delete all of "${sport}"? This removes ${compsPhrase} and ${eventsPhrase}, along with every ` +
      `related staff booking, editorial decision, and production assignment. This cannot be undone.`
    )) return
    onDeleteCompetitions(comps.map(c => c.id))
  }

  return (
    <div className="ba-modal-backdrop" onClick={onClose}>
      <div className="ba-modal-dialog manage-comps-dialog" onClick={e => e.stopPropagation()}>
        <h3>Manage Competitions</h3>
        <p className="assume-role-hint">
          Delete a competition, or an entire sport, along with every event and reference to it.
          This cannot be undone.
        </p>

        <div className="comporg-scroll manage-comps-scroll">
          {sports.map(([sport, comps]) => (
            <div key={sport} className="comporg-group">
              <div className="manage-comps-sport-row">
                <span className="comporg-org-name">{sport}</span>
                <button
                  type="button"
                  className="manage-comps-del-btn manage-comps-del-btn--sport"
                  onClick={() => handleDeleteSport(sport, comps)}
                >
                  Delete Sport
                </button>
              </div>
              {comps.map(c => (
                <div key={c.id} className="manage-comps-row">
                  <div>
                    <span className="comporg-competition-name">{c.name}</span>
                    <span className="manage-comps-count"> — {eventCount(c.id)} event(s)</span>
                    <div className="comporg-competition-sport">{c.governingBody}</div>
                  </div>
                  <button
                    type="button"
                    className="manage-comps-del-btn"
                    onClick={() => handleDeleteCompetition(c)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ))}
          {sports.length === 0 && (
            <div className="import-hint">No competitions are currently configured.</div>
          )}
        </div>

        <div className="ba-modal-actions">
          <button type="button" className="unsaved-btn unsaved-btn--cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default ManageCompetitionsModal
