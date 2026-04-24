import { useState, useEffect } from 'react'
import { getAllSports, getLeaguesGroupedByCountry } from '../services/sportsdb'
import GOVERNING_BODIES from '../data/governingBodies'

function SearchPanel({ onAddLeague, activeLeagues, onRemoveLeague, loading, error }) {
  const [sports, setSports] = useState([])
  const [governingBodies, setGoverningBodies] = useState([])
  const [competitions, setCompetitions] = useState([])

  const [selectedSport, setSelectedSport] = useState('')
  const [selectedBody, setSelectedBody] = useState(null)
  const [selectedComp, setSelectedComp] = useState(null)

  const [loadingSports, setLoadingSports] = useState(true)
  const [loadingBodies, setLoadingBodies] = useState(false)

  useEffect(() => {
    getAllSports()
      .then(setSports)
      .catch(() => {})
      .finally(() => setLoadingSports(false))
  }, [])

  async function handleSportChange(e) {
    const sport = e.target.value
    setSelectedSport(sport)
    setSelectedBody(null)
    setSelectedComp(null)
    setGoverningBodies([])
    setCompetitions([])
    if (!sport) return

    const staticBodies = GOVERNING_BODIES[sport]
    if (staticBodies) {
      setGoverningBodies(staticBodies)
    } else {
      setLoadingBodies(true)
      const dynamic = await getLeaguesGroupedByCountry(sport)
      setGoverningBodies(dynamic)
      setLoadingBodies(false)
    }
  }

  function handleBodyChange(e) {
    const bodyName = e.target.value
    const body = governingBodies.find(b => b.name === bodyName) || null
    setSelectedBody(body)
    setSelectedComp(null)
    setCompetitions(body ? body.competitions : [])
  }

  function handleCompChange(e) {
    const comp = competitions.find(c => c.id === e.target.value) || null
    setSelectedComp(comp)
  }

  function handleAdd() {
    if (!selectedComp || !selectedSport || selectedComp.premium) return
    onAddLeague(
      {
        idLeague: selectedComp.id,
        strLeague: selectedComp.name,
        presetColor: selectedComp.color,
        lookupName: selectedComp.lookupName,
        country: selectedComp.country,
      },
      selectedSport,
    )
  }

  const effectiveId = selectedComp && (selectedComp.id || selectedComp.localData || selectedComp.slugs?.[0])
  const isAlreadyAdded = effectiveId &&
    activeLeagues.some(l => l.idLeague === effectiveId)

  return (
    <aside className="search-panel">
      <h2>Add to Calendar</h2>

      {/* Sport */}
      <div className="form-group">
        <label>Sport</label>
        <select value={selectedSport} onChange={handleSportChange} disabled={loadingSports}>
          <option value="">{loadingSports ? 'Loading…' : 'Select a sport'}</option>
          {sports.map(s => (
            <option key={s.idSport} value={s.strSport}>{s.strSport}</option>
          ))}
        </select>
      </div>

      {/* Governing Body */}
      <div className="form-group">
        <label>Governing Body</label>
        <select
          value={selectedBody?.name || ''}
          onChange={handleBodyChange}
          disabled={!selectedSport || loadingBodies}
        >
          <option value="">
            {loadingBodies
              ? 'Loading…'
              : !selectedSport
              ? 'Select a sport first'
              : 'Select a governing body'}
          </option>
          {governingBodies.map(b => (
            <option key={b.name} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Competition */}
      <div className="form-group">
        <label>Competition</label>
        <select
          value={selectedComp?.id || ''}
          onChange={handleCompChange}
          disabled={!selectedBody}
        >
          <option value="">
            {!selectedBody ? 'Select a governing body first' : 'Select a competition'}
          </option>
          {competitions.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <button
        className="btn-add"
        onClick={handleAdd}
        disabled={!selectedComp || !!isAlreadyAdded || loading}
      >
        {loading ? 'Fetching events…' : isAlreadyAdded ? 'Already on calendar' : 'Add to Calendar'}
      </button>

      {error && <p className="error-msg">{error}</p>}

      {activeLeagues.length > 0 && (
        <div className="active-leagues">
          <h3>On Calendar</h3>
          {activeLeagues.map(league => (
            <div key={league.idLeague} className="league-chip">
              <span
                className="league-color-dot"
                style={{ background: league.color }}
              />
              <div className="league-chip-text">
                <span className="league-name">{league.strLeague}</span>
                <span className="sport-label">{league.sport}</span>
              </div>
              <button
                className="btn-remove"
                onClick={() => onRemoveLeague(league.idLeague)}
                title="Remove from calendar"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

export default SearchPanel
