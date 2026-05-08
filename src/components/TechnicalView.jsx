import { useState, Fragment } from 'react'

function loadDecisions() {
  try { return JSON.parse(localStorage.getItem('editorial_decisions') || '{}') }
  catch { return {} }
}

function loadAssignments() {
  try { return JSON.parse(localStorage.getItem('production_assignments') || '{}') }
  catch { return {} }
}

function loadDefaultPatterns() {
  try { return JSON.parse(localStorage.getItem('rights_default_patterns') || '{}') }
  catch { return {} }
}

function loadPatterns() {
  try { return JSON.parse(localStorage.getItem('admin_patterns') || '[]') }
  catch { return [] }
}

const ZERO = {
  cameramen: 0, evsOperator: 0, audioOnLocation: 0,
  incomingVideoLines: 0, outgoingVideoLines: 0,
  incomingAudioLines: 0, incomingTalkbackLines: 0, outgoingTalkbackLines: 0,
}

function addResources(a, b) {
  return Object.fromEntries(Object.keys(ZERO).map(k => [k, (a[k] || 0) + (b[k] || 0)]))
}

function fromPattern(p) {
  if (!p) return { ...ZERO }
  return {
    cameramen:             p.cameramen             || 0,
    evsOperator:           p.evsOperator           || 0,
    audioOnLocation:       p.audioOnLocation       || 0,
    incomingVideoLines:    p.incomingVideoLines    || 0,
    outgoingVideoLines:    p.outgoingVideoLines    || 0,
    incomingAudioLines:    p.incomingAudioLines    || 0,
    incomingTalkbackLines: p.incomingTalkbackLines || 0,
    outgoingTalkbackLines: p.outgoingTalkbackLines || 0,
  }
}

const RESOURCE_ROWS = [
  { group: 'Crew',             key: 'cameramen',             label: 'Cameramen on Location' },
  { group: null,               key: 'evsOperator',           label: 'EVS Operators' },
  { group: null,               key: 'audioOnLocation',       label: 'Audio on Location' },
  { group: 'Video Lines',      key: 'incomingVideoLines',    label: 'Incoming Video Lines' },
  { group: null,               key: 'outgoingVideoLines',    label: 'Outgoing Video Lines' },
  { group: 'Audio & Talkback', key: 'incomingAudioLines',    label: 'Incoming Audio Lines' },
  { group: null,               key: 'incomingTalkbackLines', label: 'Incoming Talkback Lines' },
  { group: null,               key: 'outgoingTalkbackLines', label: 'Outgoing Talkback Lines' },
]

function TechnicalView({ events }) {
  const [decisions]       = useState(loadDecisions)
  const [assignments]     = useState(loadAssignments)
  const [defaultPatterns] = useState(loadDefaultPatterns)
  const [patterns]        = useState(loadPatterns)

  const patternMap = Object.fromEntries(patterns.map(p => [p.id, p]))

  function getPattern(event) {
    const asgn = assignments[event.id]
    const patId = asgn?.patternId !== undefined
      ? asgn.patternId
      : (defaultPatterns[event.extendedProps.competitionId] || '')
    return patId ? (patternMap[patId] || null) : null
  }

  const dayMap = {}

  events.forEach(event => {
    const dec = decisions[event.id] || {}
    const vals = Object.values(dec).filter(v => v === 'Y' || v === 'P')
    const hasY = vals.includes('Y')
    const hasP = vals.includes('P')
    if (!hasY && !hasP) return

    const dateStr = event.start?.slice(0, 10)
    if (!dateStr) return

    if (!dayMap[dateStr]) dayMap[dateStr] = { confirmed: [], possible: [] }

    const pattern = getPattern(event)
    const entry = { event, pattern, patternName: pattern?.name || '— no pattern —' }

    if (hasY) dayMap[dateStr].confirmed.push(entry)
    else      dayMap[dateStr].possible.push(entry)
  })

  const sortedDays = Object.keys(dayMap).sort()

  if (sortedDays.length === 0) {
    return (
      <div className="tv-view">
        <div className="tv-empty">
          <p>No events selected yet.</p>
          <span>Mark events Y or P on the Editorial Decisions page to see daily requirements here.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="tv-view">
      <div className="tv-scroll">
        {sortedDays.map(dateStr => {
          const { confirmed, possible } = dayMap[dateStr]

          const confirmedRes = confirmed.reduce((acc, { pattern }) => addResources(acc, fromPattern(pattern)), { ...ZERO })
          const possibleRes  = possible.reduce( (acc, { pattern }) => addResources(acc, fromPattern(pattern)), { ...ZERO })
          const combinedRes  = addResources(confirmedRes, possibleRes)

          const date = new Date(dateStr + 'T12:00:00')
          const dateLabel = date.toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })

          return (
            <div key={dateStr} className="tv-day">

              <div className="tv-day-header">{dateLabel}</div>

              {/* Event lists */}
              <div className="tv-events-row">
                <div className="tv-events-col tv-events-col--confirmed">
                  <div className="tv-col-title tv-col-title--confirmed">Confirmed</div>
                  {confirmed.length === 0
                    ? <p className="tv-none">None</p>
                    : <ul className="tv-event-list">
                        {confirmed.map(({ event, patternName }) => (
                          <li key={event.id} className="tv-event-item">
                            <span className="tv-dot" style={{ background: event.backgroundColor }} />
                            <span className="tv-event-name">{event.title}</span>
                            <span className="tv-pill tv-pill--confirmed">{patternName}</span>
                          </li>
                        ))}
                      </ul>
                  }
                </div>
                <div className="tv-events-col tv-events-col--possible">
                  <div className="tv-col-title tv-col-title--possible">Possible</div>
                  {possible.length === 0
                    ? <p className="tv-none">None</p>
                    : <ul className="tv-event-list">
                        {possible.map(({ event, patternName }) => (
                          <li key={event.id} className="tv-event-item">
                            <span className="tv-dot" style={{ background: event.backgroundColor }} />
                            <span className="tv-event-name">{event.title}</span>
                            <span className="tv-pill tv-pill--possible">{patternName}</span>
                          </li>
                        ))}
                      </ul>
                  }
                </div>
              </div>

              {/* Resource table */}
              <div className="tv-table-wrap">
                <table className="tv-table">
                  <thead>
                    <tr>
                      <th className="tv-th tv-th--label">Resource</th>
                      <th className="tv-th tv-th--confirmed">Confirmed</th>
                      <th className="tv-th tv-th--possible">Possible</th>
                      <th className="tv-th tv-th--combined">Combined Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RESOURCE_ROWS.map(({ group, key: rKey, label }) => (
                      <Fragment key={rKey}>
                        {group && (
                          <tr className="tv-tr-group">
                            <td className="tv-td-group" colSpan={4}>{group}</td>
                          </tr>
                        )}
                        <tr className="tv-tr-data">
                          <td className="tv-td-label">{label}</td>
                          <td className="tv-td-val tv-td-val--confirmed">{confirmedRes[rKey]}</td>
                          <td className="tv-td-val tv-td-val--possible">{possibleRes[rKey]}</td>
                          <td className="tv-td-val tv-td-val--combined">{combinedRes[rKey]}</td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TechnicalView
