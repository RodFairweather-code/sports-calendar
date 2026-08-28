import { useState } from 'react'
import { COMPETITIONS } from '../data/competitions'
import { loadDefaultTimings, persistDefaultTimings } from '../services/defaultTimings'

const FIELDS = [
  { key: 'lineup',        label: 'Lineup',                          unit: 'mins', step: '1', min: '0' },
  { key: 'liveFeed',      label: 'Live Feed',                       unit: 'mins', step: '1', min: '0' },
  { key: 'duration',      label: 'Event Duration (incl. half time)', unit: 'mins', step: '1', min: '0' },
  { key: 'autoTeardown',  label: 'Auto Teardown',                   unit: 'mins', step: '1', min: '0' },
]

function DefaultTimingsView() {
  const [timings, setTimings] = useState(loadDefaultTimings)

  function setField(compId, field, value) {
    setTimings(prev => {
      const next = { ...prev, [compId]: { ...prev[compId], [field]: Number(value) || 0 } }
      persistDefaultTimings(next)
      return next
    })
  }

  return (
    <div className="rights-view">
      <div className="rights-legend">
        <span className="rights-legend-hint">
          Minutes to offset from an event's start (Lineup, Live Feed) or end (Auto Teardown), and the
          competition's typical duration in minutes, including half time (used to work out that end time).
          Used by the MCR page to work out each event's control-room timings.
        </span>
      </div>

      <div className="rights-scroll">
        <table className="rights-table">
          <thead>
            <tr>
              <th className="rights-th-comp">Competition</th>
              {FIELDS.map(f => (
                <th key={f.key} className="rights-th-plat">{f.label} ({f.unit})</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPETITIONS.map(comp => {
              const compTimings = timings[comp.id] || {}
              return (
                <tr key={comp.id} className="rights-row">
                  <td className="rights-td-comp">
                    <span className="rights-comp-dot" style={{ background: comp.color }} />
                    {comp.name}
                  </td>
                  {FIELDS.map(f => (
                    <td key={f.key} className="rights-td-pattern">
                      <input
                        className="dt-input"
                        type="number"
                        min={f.min}
                        step={f.step}
                        value={compTimings[f.key] || 0}
                        onChange={e => setField(comp.id, f.key, e.target.value)}
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

export default DefaultTimingsView
