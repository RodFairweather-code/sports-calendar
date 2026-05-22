import { useState } from 'react'
import { getStaffForRole } from './StaffView'

function loadData() {
  try { return JSON.parse(localStorage.getItem('asset_management') || '{}') }
  catch { return {} }
}

function persistData(d) {
  localStorage.setItem('asset_management', JSON.stringify(d))
}

function loadPlatforms() {
  try { return JSON.parse(localStorage.getItem('admin_platforms') || '[]') }
  catch { return [] }
}

function loadRecordPortCount() {
  try {
    const ts = JSON.parse(localStorage.getItem('admin_tech_stack') || '{}')
    return ts.recordPorts !== undefined ? ts.recordPorts : 25
  } catch { return 25 }
}

function assignPortNumbers(sortedEvents) {
  const dayCounts = {}
  const portMap = {}
  for (const event of sortedEvents) {
    const day = event.start ? event.start.slice(0, 10) : 'unknown'
    dayCounts[day] = (dayCounts[day] || 0) + 1
    portMap[event.id] = dayCounts[day]
  }
  return portMap
}

function loadDecisions() {
  try { return JSON.parse(localStorage.getItem('editorial_decisions') || '{}') }
  catch { return {} }
}

function getSeason(dateStr) {
  const d = new Date(dateStr.slice(0, 10) + 'T12:00:00')
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  if (month >= 9) {
    return `${String(year).slice(-2)}_${String(year + 1).slice(-2)}`
  } else {
    return `${String(year - 1).slice(-2)}_${String(year).slice(-2)}`
  }
}

const COMP_PREFIX = {
  premier_league: 'EPL_',
  championship:   'EFL_',
  league_one:     'LG1_',
  league_two:     'LG2_',
}

function buildFilename(event) {
  const { competitionId, homeTeam, awayTeam } = event.extendedProps
  const prefix = COMP_PREFIX[competitionId]
  if (!prefix || !homeTeam || !awayTeam) return '—'
  const season = getSeason(event.start)
  const home = homeTeam.slice(0, 3).toUpperCase()
  const away = awayTeam.slice(0, 3).toUpperCase()
  return `${prefix}${season}_${home}_${away}_CLEAN`
}

function buildHlFilename(recFilename) {
  if (!recFilename || recFilename === '—') return '—'
  return recFilename.slice(0, 20) + '10HL_CLEAN'
}

function formatDate(start) {
  if (!start) return '—'
  const d = new Date(start.slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(start) {
  if (!start || start.length === 10) return ''
  return start.slice(11, 16)
}

const EMPTY_ROW = {
  nlCheck: false,
  logSheet: false,
  logOnViz: false,
  vizCheck: '',
  metadataFilled: '',
  hlNlCheck: false,
  hlVizCheck: false,
  hlMetadata: '',
  notes: '',
}

function CheckCell({ checked, onChange }) {
  return (
    <td className="at-td at-check">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    </td>
  )
}

function DropCell({ value, options, onChange }) {
  return (
    <td className="at-td at-drop">
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </td>
  )
}

function AssetsView({ events = [] }) {
  const [data, setData] = useState(loadData)

  const platforms       = loadPlatforms()
  const decisions       = loadDecisions()
  const mamCheckers     = getStaffForRole('mamCheckers')
  const totalRecordPorts = loadRecordPortCount()

  const tamsPlatform = platforms.find(p => p.name?.toLowerCase() === 'tams')

  const tamsEvents = tamsPlatform
    ? events
        .filter(e => {
          const dec = decisions[e.id]
          return dec && (dec[tamsPlatform.id] === 'Y' || dec[tamsPlatform.id] === 'P')
        })
        .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
    : []

  const portMap = assignPortNumbers(tamsEvents)

  function update(id, field, value) {
    setData(prev => {
      const row = { ...EMPTY_ROW, ...(prev[id] || {}) }
      const next = { ...prev, [id]: { ...row, [field]: value } }
      persistData(next)
      return next
    })
  }

  if (!tamsPlatform) {
    return (
      <div className="assets-view">
        <div className="assets-empty">
          No platform named "TAMS" found. Add it in Admin → Platforms first.
        </div>
      </div>
    )
  }

  if (tamsEvents.length === 0) {
    return (
      <div className="assets-view">
        <div className="assets-empty">
          No events have TAMS selected in Editorial Decisions.
        </div>
      </div>
    )
  }

  return (
    <div className="assets-view">
      <div className="assets-scroll">
        <table className="assets-table">
          <thead>
            <tr>
              <th className="at-th at-date">Date</th>
              <th className="at-th at-time">Time</th>
              <th className="at-th at-comp">Competition</th>
              <th className="at-th at-event">Event</th>
              <th className="at-th at-venue">Venue</th>
              <th className="at-th at-filename">Rec Filename</th>
              <th className="at-th at-check">NL Check</th>
              <th className="at-th at-check">Log Sheet</th>
              <th className="at-th at-check">Log on Viz</th>
              <th className="at-th at-drop">Viz Check</th>
              <th className="at-th at-drop">Metadata Filled</th>
              <th className="at-th at-filename">HL Rec Filename</th>
              <th className="at-th at-check">HL NL Check</th>
              <th className="at-th at-check">HL Viz Check</th>
              <th className="at-th at-drop">HL Metadata</th>
              <th className="at-th at-notes">Notes</th>
              <th className="at-th at-port">Record Port</th>
            </tr>
          </thead>
          <tbody>
            {tamsEvents.map((event, i) => {
              const row        = { ...EMPTY_ROW, ...(data[event.id] || {}) }
              const filename   = buildFilename(event)
              const hlFilename = buildHlFilename(filename)
              const portNum    = portMap[event.id]
              const portOver   = portNum > totalRecordPorts
              const upd    = (field, val) => update(event.id, field, val)
              return (
                <tr key={event.id} className={i % 2 === 0 ? 'at-row-even' : 'at-row-odd'}>
                  <td className="at-td at-date">{formatDate(event.start)}</td>
                  <td className="at-td at-time">{formatTime(event.start)}</td>
                  <td className="at-td at-comp">{event.extendedProps.competitionName}</td>
                  <td className="at-td at-event">{event.title}</td>
                  <td className="at-td at-venue">{event.extendedProps.venue || '—'}</td>

                  <td className="at-td at-filename">
                    <span className="at-filename-text">{filename}</span>
                  </td>

                  <CheckCell checked={row.nlCheck}   onChange={v => upd('nlCheck', v)} />
                  <CheckCell checked={row.logSheet}  onChange={v => upd('logSheet', v)} />
                  <CheckCell checked={row.logOnViz}  onChange={v => upd('logOnViz', v)} />
                  <DropCell  value={row.vizCheck}    options={mamCheckers} onChange={v => upd('vizCheck', v)} />
                  <DropCell  value={row.metadataFilled} options={mamCheckers} onChange={v => upd('metadataFilled', v)} />

                  <td className="at-td at-filename">
                    <span className="at-filename-text">{hlFilename}</span>
                  </td>

                  <CheckCell checked={row.hlNlCheck}  onChange={v => upd('hlNlCheck', v)} />
                  <CheckCell checked={row.hlVizCheck} onChange={v => upd('hlVizCheck', v)} />
                  <DropCell  value={row.hlMetadata}   options={mamCheckers} onChange={v => upd('hlMetadata', v)} />

                  <td className="at-td at-notes">
                    <input
                      type="text"
                      className="at-notes-input"
                      value={row.notes}
                      onChange={e => upd('notes', e.target.value)}
                      placeholder="Notes…"
                    />
                  </td>

                  <td className={`at-td at-port${portOver ? ' at-port--over' : ''}`}>
                    {portOver ? 'Unavailable' : portNum}
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

export default AssetsView
