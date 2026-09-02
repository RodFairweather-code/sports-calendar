import { useState } from 'react'
import { COMPETITIONS } from '../data/competitions'
import { loadDefaultTimings, persistDefaultTimings, DEFAULT_TIMINGS_ID } from '../services/defaultTimings'

const MATCH_FIELDS = [
  { key: 'lineup',        label: 'Lines up',                        unit: 'mins before match start', step: '1', min: '0' },
  { key: 'liveFeed',      label: 'Lineup duration',                 unit: 'mins',                     step: '1', min: '0' },
  { key: 'duration',      label: 'Event Duration (incl. half time)', unit: 'mins', step: '1', min: '0' },
  { key: 'autoTeardown',  label: 'Lines down',                      unit: 'post match mins',          step: '1', min: '0' },
  { key: 'obStaff',       label: 'OB staff',                        unit: 'mins before match start', step: '1', min: '0' },
  { key: 'studioStaff',   label: 'Studio staff',                    unit: 'mins before match start', step: '1', min: '0' },
  { key: 'boothStaff',    label: 'Booth staff',                     unit: 'mins before match start', step: '1', min: '0' },
]

const OB_FIELDS = [
  { key: 'obRigCrewCall',         label: 'Rig Crew call',         unit: 'mins before lineup',      step: '1', min: '0' },
  { key: 'obTruckPoweredUp',      label: 'OB truck powered up',   unit: 'mins before lineup',      step: '1', min: '0' },
  { key: 'obEngineeringRigCheck', label: 'Engineering Rig Check', unit: 'mins before lineup',      step: '1', min: '0' },
  { key: 'obTechnicalRehearsal',  label: 'Technical rehearsal',   unit: 'mins before match start', step: '1', min: '0' },
  { key: 'obCommsCheck',          label: 'Comms check',           unit: 'mins before match start', step: '1', min: '0' },
  { key: 'obEvsReplayCheck',      label: 'EVS replay check',      unit: 'mins before match start', step: '1', min: '0' },
]

const SECTIONS = [
  { title: 'Match & Staff Timings', fields: MATCH_FIELDS },
  { title: 'OB Timings',            fields: OB_FIELDS },
]

// "Default events" first, then every competition. The default row's values are
// used for any field a competition hasn't set (see resolveTimings).
const ROWS = [
  { id: DEFAULT_TIMINGS_ID, name: 'Default events', isDefault: true },
  ...COMPETITIONS.map(c => ({ id: c.id, name: c.name, color: c.color })),
]

function TimingTable({ fields, timings, setField }) {
  return (
    <table className="rights-table">
      <thead>
        <tr>
          <th className="rights-th-comp">Competition</th>
          {fields.map(f => (
            <th key={f.key} className="rights-th-plat">{f.label} ({f.unit})</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map(row => {
          const rowTimings = timings[row.id] || {}
          return (
            <tr key={row.id} className={`rights-row${row.isDefault ? ' dt-row--default' : ''}`}>
              <td className="rights-td-comp">
                {row.isDefault
                  ? <span className="dt-default-label">Default events</span>
                  : <><span className="rights-comp-dot" style={{ background: row.color }} />{row.name}</>}
              </td>
              {fields.map(f => (
                <td key={f.key} className="rights-td-pattern">
                  <input
                    className="dt-input"
                    type="number"
                    min={f.min}
                    step={f.step}
                    value={rowTimings[f.key] || 0}
                    onChange={e => setField(row.id, f.key, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

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
          Minutes to offset from an event's start (Lines up, Lineup duration) or end (Lines down), and the
          competition's typical duration in minutes, including half time (used to work out that end time).
          Used by the MCR page to work out each event's control-room timings. OB / Studio / Booth staff are
          the call times, in minutes before match start, for each gallery's crew. OB Timings are the outside
          broadcast milestones, offset from either the lineup time or the event start. The <strong>Default
          events</strong> row supplies any value a competition hasn't set itself.
        </span>
      </div>

      <div className="rights-scroll">
        {SECTIONS.map(section => (
          <div key={section.title} className="dt-section">
            <h3 className="dt-section-title">{section.title}</h3>
            <TimingTable fields={section.fields} timings={timings} setField={setField} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default DefaultTimingsView
