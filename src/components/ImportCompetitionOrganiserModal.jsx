function groupByOrganisation(competitions) {
  const organisations = new Map()
  competitions
    .filter(c => c.sport !== 'Programme')
    .forEach(c => {
      const org = c.governingBody || 'Other'
      if (!organisations.has(org)) organisations.set(org, [])
      organisations.get(org).push(c)
    })
  return [...organisations.entries()]
    .map(([org, comps]) => [org, comps.slice().sort((a, b) => a.name.localeCompare(b.name))])
    .sort((a, b) => a[0].localeCompare(b[0]))
}

function ImportCompetitionOrganiserModal({ competitions, onSelect, onClose }) {
  const organisations = groupByOrganisation(competitions)

  return (
    <div className="excel-modal-backdrop" onClick={onClose}>
      <div className="excel-modal-dialog" onClick={e => e.stopPropagation()}>
        <h3>Import from Competition Organiser</h3>
        <p className="import-hint">
          Select the sports organisation and competition you want to import from.
        </p>

        <div className="excel-preview-scroll comporg-scroll">
          {organisations.map(([org, comps]) => (
            <div key={org} className="comporg-group">
              <div className="comporg-org-name">{org}</div>
              {comps.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className="comporg-competition-btn"
                  onClick={() => onSelect(c)}
                >
                  <span className="comporg-competition-name">{c.name}</span>
                  <span className="comporg-competition-sport">{c.sport}</span>
                </button>
              ))}
            </div>
          ))}
          {organisations.length === 0 && (
            <div className="import-hint">No sports organisations are currently configured.</div>
          )}
        </div>

        <div className="unsaved-dialog-actions">
          <button className="unsaved-btn unsaved-btn--cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default ImportCompetitionOrganiserModal
