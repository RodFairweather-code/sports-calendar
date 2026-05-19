import { useEffect, useState } from 'react'

function loadAssignments() {
  try { return JSON.parse(localStorage.getItem('production_assignments') || '{}') }
  catch { return {} }
}

function loadPatterns() {
  try { return JSON.parse(localStorage.getItem('admin_patterns') || '[]') }
  catch { return [] }
}

function loadStaff() {
  const empty = {
    cameramen: [], onsiteAudio: [], onsiteProductionManager: [],
    director: [], producer: [], commentator: [], evsOperator: [], graphicsOperator: [],
  }
  try { return { ...empty, ...JSON.parse(localStorage.getItem('admin_staff') || '{}') } }
  catch { return empty }
}

function loadDefaultPatterns() {
  try { return JSON.parse(localStorage.getItem('rights_default_patterns') || '{}') }
  catch { return {} }
}

function persistAssignments(a) {
  localStorage.setItem('production_assignments', JSON.stringify(a))
}

function StaffSelect({ label, value, options, field, onChange }) {
  return (
    <div className="ep-field">
      <span className="ep-field-label">{label}</span>
      <select
        className={`ep-select${value ? ' ep-select--set' : ''}`}
        value={value || ''}
        onChange={e => onChange(field, e.target.value)}
      >
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TechNumField({ label, value, field, onChange, overridden }) {
  return (
    <div className={`ep-field${overridden ? ' ep-field--overridden' : ''}`}>
      <span className="ep-field-label">{label}</span>
      <input
        className="ep-num-input"
        type="number"
        min="0"
        max="999"
        value={value}
        onChange={e => onChange(field, Math.max(0, parseInt(e.target.value, 10) || 0))}
      />
    </div>
  )
}

function TechToggleField({ label, value, field, onChange, overridden }) {
  return (
    <div className={`ep-field${overridden ? ' ep-field--overridden' : ''}`}>
      <span className="ep-field-label">{label}</span>
      <label className="pf-toggle">
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(field, e.target.checked)}
        />
        <span className="pf-toggle-track"><span className="pf-toggle-thumb" /></span>
        <span className="pf-toggle-text">{value ? 'Yes' : 'No'}</span>
      </label>
    </div>
  )
}

function EventPanel({ event, onClose }) {
  const p = event.extendedProps

  const [assignments, setAssignmentsState] = useState(loadAssignments)
  const [patterns]        = useState(loadPatterns)
  const [staff]           = useState(loadStaff)
  const [defaultPatterns] = useState(loadDefaultPatterns)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const asgn = assignments[event.id] || {}
  const patternId = asgn.patternId !== undefined
    ? asgn.patternId
    : (defaultPatterns[p.competitionId] || '')
  const patternMap = Object.fromEntries(patterns.map(pat => [pat.id, pat]))
  const pattern = patternId ? patternMap[patternId] || null : null

  // Effective tech value: saved override → pattern default → 0
  function tv(techKey, patternKey) {
    if (asgn[techKey] !== undefined) return asgn[techKey]
    return pattern?.[patternKey] ?? 0
  }
  const techBooth = asgn.techProductionBooth !== undefined
    ? asgn.techProductionBooth
    : (pattern?.productionBooth ?? false)

  // True when the saved value differs from the pattern default (or from 0 if no pattern)
  function isOverridden(techKey, patternKey) {
    const saved = asgn[techKey]
    if (saved === undefined) return false
    return saved !== (pattern?.[patternKey] ?? 0)
  }
  const boothOverridden = asgn.techProductionBooth !== undefined &&
    asgn.techProductionBooth !== (pattern?.productionBooth ?? false)

  function setField(field, value) {
    setAssignmentsState(prev => {
      const next = { ...prev, [event.id]: { ...prev[event.id], [field]: value } }
      persistAssignments(next)
      return next
    })
  }

  // When the pattern type changes, reset all tech fields to that pattern's defaults
  function setPatternType(value) {
    const newPat = value ? patternMap[value] || null : null
    setAssignmentsState(prev => {
      const update = { patternId: value }
      if (newPat) {
        update.techCameramen             = newPat.cameramen             ?? 0
        update.techEvsOperator           = newPat.evsOperator           ?? 0
        update.techAudioOnLocation       = newPat.audioOnLocation       ?? 0
        update.techIncomingVideoLines    = newPat.incomingVideoLines    ?? 0
        update.techOutgoingVideoLines    = newPat.outgoingVideoLines    ?? 0
        update.techIncomingAudioLines    = newPat.incomingAudioLines    ?? 0
        update.techIncomingTalkbackLines = newPat.incomingTalkbackLines ?? 0
        update.techOutgoingTalkbackLines = newPat.outgoingTalkbackLines ?? 0
        update.techProductionBooth       = newPat.productionBooth       ?? false
      }
      const next = { ...prev, [event.id]: { ...prev[event.id], ...update } }
      persistAssignments(next)
      return next
    })
  }

  // Parse date/time from stored London-local string (avoid timezone shift)
  const datePart = event.start?.slice(0, 10)
  const timePart = !event.allDay && event.start?.length > 10 ? event.start.slice(11, 16) : null

  const dateStr = datePart
    ? new Date(datePart + 'T12:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  const endDateStr = event.end && event.allDay
    ? (() => {
        const d = new Date(event.end.slice(0, 10) + 'T12:00:00')
        d.setDate(d.getDate() - 1)
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      })()
    : null

  const hasScore =
    p.homeScore !== null && p.homeScore !== undefined && p.homeScore !== '' &&
    p.awayScore !== null && p.awayScore !== undefined && p.awayScore !== ''

  const kickoffLabel = p.sport === 'Rugby Union' ? 'Kick-off' : p.sport === 'Tennis' ? 'Starts' : 'Kick-off'

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} aria-hidden="true" />

      <aside className="event-panel" role="dialog" aria-modal="true" aria-label={event.title}>

        <div className="ep-accent" style={{ background: event.backgroundColor }} />

        <div className="ep-header">
          <div className="ep-header-meta">
            <span className="ep-comp-dot" style={{ background: event.backgroundColor }} />
            <span className="ep-comp-name">{p.competitionName}</span>
            <span className="ep-sport-badge">{p.sport}</span>
          </div>
          <button className="ep-close" onClick={onClose} aria-label="Close panel">
            &#x2715;
          </button>
        </div>

        <div className="ep-body">

          <h2 className="ep-title">{event.title}</h2>

          {p.homeTeam && p.awayTeam && (
            <div className="ep-teams">
              <span className="ep-team">{p.homeTeam}</span>
              <span className="ep-score-vs">
                {hasScore ? `${p.homeScore} – ${p.awayScore}` : 'vs'}
              </span>
              <span className="ep-team ep-team-away">{p.awayTeam}</span>
            </div>
          )}

          <dl className="ep-details">
            {p.round && (<><dt>Round</dt><dd>{p.round}</dd></>)}
            {dateStr && !endDateStr && (<><dt>Date</dt><dd>{dateStr}</dd></>)}
            {dateStr && endDateStr && (<><dt>Dates</dt><dd>{dateStr} – {endDateStr}</dd></>)}
            {timePart && (<><dt>{kickoffLabel}</dt><dd>{timePart} (London)</dd></>)}
            {p.venue && (<><dt>Venue</dt><dd>{p.venue}</dd></>)}
            {p.governingBody && (<><dt>Organisation</dt><dd>{p.governingBody}</dd></>)}
            {hasScore && (<><dt>Result</dt><dd className="ep-result">{p.homeScore} – {p.awayScore}</dd></>)}
          </dl>

          {/* ── Production ── */}
          <div className="ep-section">
            <span className="ep-section-title">Production</span>
          </div>
          <div className="ep-fields">
            <div className="ep-field">
              <span className="ep-field-label">Type</span>
              <select
                className={`ep-select${patternId ? ' ep-select--set' : ''}`}
                value={patternId}
                onChange={e => setPatternType(e.target.value)}
              >
                <option value="">—</option>
                {patterns.map(pat => <option key={pat.id} value={pat.id}>{pat.name}</option>)}
              </select>
            </div>
            <StaffSelect label="Director"    value={asgn.director}          options={staff.director}                field="director"          onChange={setField} />
            <StaffSelect label="Prod. Mgr"   value={asgn.productionManager} options={staff.onsiteProductionManager} field="productionManager"  onChange={setField} />
            <StaffSelect label="Producer"    value={asgn.producer}          options={staff.producer}                field="producer"          onChange={setField} />
            <StaffSelect label="Commentator" value={asgn.commentator}       options={staff.commentator}             field="commentator"       onChange={setField} />
            <StaffSelect label="Cameraman"   value={asgn.cameraman}         options={staff.cameramen}               field="cameraman"         onChange={setField} />
            <StaffSelect label="EVS"         value={asgn.evsOperator}       options={staff.evsOperator}             field="evsOperator"       onChange={setField} />
            <StaffSelect label="Audio"       value={asgn.onsiteAudio}       options={staff.onsiteAudio}             field="onsiteAudio"       onChange={setField} />
            <StaffSelect label="Graphics"    value={asgn.graphicsOperator}  options={staff.graphicsOperator}        field="graphicsOperator"  onChange={setField} />
          </div>

          {/* ── Technical Resources ── */}
          <div className="ep-section">
            <span className="ep-section-title">Technical Resources</span>
            {pattern && <span className="ep-section-hint">{pattern.name}</span>}
          </div>
          <div className="ep-fields">
            <span className="ep-field-group-label">Crew</span>
            <TechNumField label="Cameramen"     value={tv('techCameramen',            'cameramen')}             field="techCameramen"             onChange={setField} overridden={isOverridden('techCameramen',            'cameramen')} />
            <TechNumField label="EVS Operators" value={tv('techEvsOperator',          'evsOperator')}           field="techEvsOperator"           onChange={setField} overridden={isOverridden('techEvsOperator',          'evsOperator')} />
            <TechNumField label="Audio on loc"  value={tv('techAudioOnLocation',      'audioOnLocation')}       field="techAudioOnLocation"       onChange={setField} overridden={isOverridden('techAudioOnLocation',      'audioOnLocation')} />
            <span className="ep-field-group-label">Video Lines</span>
            <TechNumField label="Incoming"      value={tv('techIncomingVideoLines',    'incomingVideoLines')}    field="techIncomingVideoLines"    onChange={setField} overridden={isOverridden('techIncomingVideoLines',    'incomingVideoLines')} />
            <TechNumField label="Outgoing"      value={tv('techOutgoingVideoLines',    'outgoingVideoLines')}    field="techOutgoingVideoLines"    onChange={setField} overridden={isOverridden('techOutgoingVideoLines',    'outgoingVideoLines')} />
            <span className="ep-field-group-label">Audio &amp; Talkback</span>
            <TechNumField label="Audio in"      value={tv('techIncomingAudioLines',    'incomingAudioLines')}    field="techIncomingAudioLines"    onChange={setField} overridden={isOverridden('techIncomingAudioLines',    'incomingAudioLines')} />
            <TechNumField label="Talkback in"   value={tv('techIncomingTalkbackLines', 'incomingTalkbackLines')} field="techIncomingTalkbackLines" onChange={setField} overridden={isOverridden('techIncomingTalkbackLines', 'incomingTalkbackLines')} />
            <TechNumField label="Talkback out"  value={tv('techOutgoingTalkbackLines', 'outgoingTalkbackLines')} field="techOutgoingTalkbackLines" onChange={setField} overridden={isOverridden('techOutgoingTalkbackLines', 'outgoingTalkbackLines')} />
            <span className="ep-field-group-label">Production</span>
            <TechToggleField label="Prod. Booth" value={techBooth} field="techProductionBooth" onChange={setField} overridden={boothOverridden} />
          </div>

        </div>
      </aside>
    </>
  )
}

export default EventPanel
