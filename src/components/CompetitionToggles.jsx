import { useState } from 'react'

function CompetitionToggles({ competitions, governingBodies, activeComps, onToggle, onToggleBody }) {
  const [selectedSport, setSelectedSport] = useState(null)

  const sports = [...new Set(competitions.map(c => c.sport))]

  const visibleBodies = selectedSport
    ? governingBodies.filter(b =>
        competitions.some(c => c.sport === selectedSport && c.governingBody === b.id)
      )
    : []

  const visibleComps = selectedSport
    ? competitions.filter(c => c.sport === selectedSport)
    : competitions

  function handleSportClick(sport) {
    setSelectedSport(prev => prev === sport ? null : sport)
  }

  return (
    <div className="competition-toggles">

      {/* Layer 1: Sport */}
      <div className="toggle-layer">
        <span className="toggle-layer-label">Sport</span>
        {sports.map(sport => (
          <button
            key={sport}
            className={`toggle-btn toggle-btn--sport${selectedSport === sport ? ' active' : ''}`}
            onClick={() => handleSportClick(sport)}
            aria-pressed={selectedSport === sport}
          >
            <span className="toggle-name">{sport}</span>
          </button>
        ))}
      </div>

      {/* Layer 2: Governing body — only visible once a sport is selected */}
      {selectedSport && (
        <div className="toggle-layer">
          <span className="toggle-layer-label">Organisation</span>
          {visibleBodies.map(body => {
            const allActive = body.competitionIds.every(id => activeComps.has(id))
            const anyActive = body.competitionIds.some(id => activeComps.has(id))
            const partial = anyActive && !allActive
            return (
              <button
                key={body.id}
                className={`toggle-btn toggle-btn--body${allActive ? ' active' : ''}${partial ? ' partial' : ''}`}
                style={{ '--comp-color': body.color }}
                onClick={() => onToggleBody(body.id)}
                aria-pressed={allActive}
                title={allActive ? `Hide all ${body.name}` : `Show all ${body.name}`}
              >
                <span className="toggle-dot" />
                <span className="toggle-name">{body.id}</span>
                <span className="toggle-label">All</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Layer 3: Individual competitions (filtered to selected sport, or all if none selected) */}
      <div className="toggle-layer">
        <span className="toggle-layer-label">Competition</span>
        {visibleComps.map(comp => {
          const active = activeComps.has(comp.id)
          return (
            <button
              key={comp.id}
              className={`toggle-btn${active ? ' active' : ''}`}
              style={{ '--comp-color': comp.color }}
              onClick={() => onToggle(comp.id)}
              aria-pressed={active}
            >
              <span className="toggle-dot" />
              <span className="toggle-name">{comp.name}</span>
            </button>
          )
        })}
      </div>

    </div>
  )
}

export default CompetitionToggles
