import { useState } from 'react'
import { COMPETITIONS } from '../data/competitions'

function loadRights() {
  try { return JSON.parse(localStorage.getItem('rights_matrix') || '{}') }
  catch { return {} }
}

function persistRights(r) {
  localStorage.setItem('rights_matrix', JSON.stringify(r))
}

function loadPlatforms() {
  try { return JSON.parse(localStorage.getItem('admin_platforms') || '[]') }
  catch { return [] }
}

function loadPatterns() {
  try { return JSON.parse(localStorage.getItem('admin_patterns') || '[]') }
  catch { return [] }
}

function loadDefaultPatterns() {
  try { return JSON.parse(localStorage.getItem('rights_default_patterns') || '{}') }
  catch { return {} }
}

function persistDefaultPatterns(d) {
  localStorage.setItem('rights_default_patterns', JSON.stringify(d))
}

function nextState(current) {
  if (!current) return 'Y'
  if (current === 'Y') return 'N'
  return ''
}

function RightsCell({ value, onChange }) {
  const cls = value === 'Y' ? 'rights-cell rights-cell--yes'
            : value === 'N' ? 'rights-cell rights-cell--no'
            : 'rights-cell rights-cell--unknown'
  const label = value === 'Y' ? 'Yes' : value === 'N' ? 'No' : 'Unknown'

  return (
    <button
      className={cls}
      onClick={onChange}
      title={label}
      aria-label={label}
    >
      {value || ''}
    </button>
  )
}

function RightsView() {
  const [platforms] = useState(loadPlatforms)
  const [patterns] = useState(loadPatterns)
  const [rights, setRights] = useState(loadRights)
  const [defaultPatterns, setDefaultPatterns] = useState(loadDefaultPatterns)

  function setDefaultPattern(compId, patternId) {
    setDefaultPatterns(prev => {
      const next = { ...prev, [compId]: patternId }
      persistDefaultPatterns(next)
      return next
    })
  }

  function toggleCell(compId, platId) {
    setRights(prev => {
      const compRights = prev[compId] || {}
      const current = compRights[platId] || ''
      const next = { ...prev, [compId]: { ...compRights, [platId]: nextState(current) } }
      persistRights(next)
      return next
    })
  }

  if (platforms.length === 0) {
    return (
      <div className="rights-view">
        <div className="rights-empty">
          <p>No platforms defined yet.</p>
          <span>Go to Admin to create platforms first, then return here to set rights.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rights-view">
      <div className="rights-legend">
        <span className="rights-legend-item">
          <span className="rights-legend-cell rights-legend-cell--yes">Y</span> Rights granted
        </span>
        <span className="rights-legend-item">
          <span className="rights-legend-cell rights-legend-cell--no">N</span> No rights
        </span>
        <span className="rights-legend-item">
          <span className="rights-legend-cell rights-legend-cell--unknown"></span> Unknown
        </span>
        <span className="rights-legend-hint">Click a cell to cycle: Unknown → Y → N → Unknown</span>
      </div>

      <div className="rights-scroll">
        <table className="rights-table">
          <thead>
            <tr>
              <th className="rights-th-comp">Competition</th>
              <th className="rights-th-pattern">Default Pattern</th>
              {platforms.map(p => (
                <th key={p.id} className="rights-th-plat" title={p.name}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPETITIONS.map(comp => {
              const compRights = rights[comp.id] || {}
              return (
                <tr key={comp.id} className="rights-row">
                  <td className="rights-td-comp">
                    <span className="rights-comp-dot" style={{ background: comp.color }} />
                    {comp.name}
                  </td>
                  <td className="rights-td-pattern">
                    <select
                      className="rights-pattern-select"
                      value={defaultPatterns[comp.id] || ''}
                      onChange={e => setDefaultPattern(comp.id, e.target.value)}
                    >
                      <option value="">— None —</option>
                      {patterns.map(pat => (
                        <option key={pat.id} value={pat.id}>{pat.name}</option>
                      ))}
                    </select>
                  </td>
                  {platforms.map(p => (
                    <td key={p.id} className="rights-td-cell">
                      <RightsCell
                        value={compRights[p.id] || ''}
                        onChange={() => toggleCell(comp.id, p.id)}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RightsView
