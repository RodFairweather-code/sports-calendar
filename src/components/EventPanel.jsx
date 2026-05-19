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

function loadStaffCosts() {
  try {
    const s = JSON.parse(localStorage.getItem('admin_staff_costs') || '{}')
    return { defaults: s.defaults || {}, overrides: s.overrides || {} }
  } catch { return { defaults: {}, overrides: {} } }
}

function loadTechStack() {
  try { return JSON.parse(localStorage.getItem('admin_tech_stack') || '{}') }
  catch { return {} }
}

function persistAssignments(a) {
  localStorage.setItem('production_assignments', JSON.stringify(a))
}

function personCost(costs, roleKey, name) {
  if (!name) return 0
  const ov = costs.overrides[`${roleKey}|${name}`]
  return ov !== undefined ? ov : (costs.defaults[roleKey] ?? 0)
}

function fmt(n) {
  return '£' + n.toLocaleString('en-GB')
}

// ── Cost line builder ────────────────────────────────────────────────────────

function buildCostLines(asgn, tv, techBooth, staffCosts, techStack) {
  const lines = []

  // Individual named staff (single-person roles)
  const namedRoles = [
    { label: 'Director',          field: 'director',          roleKey: 'director' },
    { label: 'Prod. Manager',     field: 'productionManager', roleKey: 'onsiteProductionManager' },
    { label: 'Producer',          field: 'producer',          roleKey: 'producer' },
    { label: 'Commentator',       field: 'commentator',       roleKey: 'commentator' },
    { label: 'Graphics Operator', field: 'graphicsOperator',  roleKey: 'graphicsOperator' },
  ]
  namedRoles.forEach(({ label, field, roleKey }) => {
    const name = asgn[field]
    if (!name) return
    const uc = personCost(staffCosts, roleKey, name)
    lines.push({ section: 'Operational', label, note: name, qty: 1, unitCost: uc, total: uc })
  })

  // Crew quantities from tech pattern
  const crewItems = [
    { label: 'Cameramen',         qty: tv('techCameramen',       'cameramen'),       roleKey: 'cameramen' },
    { label: 'EVS Operators',     qty: tv('techEvsOperator',     'evsOperator'),     roleKey: 'evsOperator' },
    { label: 'Audio on Location', qty: tv('techAudioOnLocation', 'audioOnLocation'), roleKey: 'onsiteAudio' },
  ]
  crewItems.forEach(({ label, qty, roleKey }) => {
    if (!qty) return
    const uc = staffCosts.defaults[roleKey] ?? 0
    lines.push({ section: 'Operational', label, qty, unitCost: uc, total: qty * uc })
  })

  // Technical lines
  const lineItems = [
    { label: 'Video Incoming',    qty: tv('techIncomingVideoLines',    'incomingVideoLines'),    costKey: 'videoIncomingCost' },
    { label: 'Video Outgoing',    qty: tv('techOutgoingVideoLines',    'outgoingVideoLines'),    costKey: 'videoOutgoingCost' },
    { label: 'Audio Incoming',    qty: tv('techIncomingAudioLines',    'incomingAudioLines'),    costKey: 'audioIncomingCost' },
    { label: 'Talkback Incoming', qty: tv('techIncomingTalkbackLines', 'incomingTalkbackLines'), costKey: 'talkbackIncomingCost' },
    { label: 'Talkback Outgoing', qty: tv('techOutgoingTalkbackLines', 'outgoingTalkbackLines'), costKey: 'talkbackOutgoingCost' },
  ]
  lineItems.forEach(({ label, qty, costKey }) => {
    if (!qty) return
    const uc = techStack[costKey] ?? 0
    lines.push({ section: 'Lines', label, qty, unitCost: uc, total: qty * uc })
  })

  // Equipment
  if (techBooth) {
    const uc = techStack.productionBoothsCost ?? 0
    lines.push({ section: 'Equipment', label: 'Production Booth', qty: 1, unitCost: uc, total: uc })
  }

  return lines
}

// ── Cost view ────────────────────────────────────────────────────────────────

function CostView({ asgn, tv, techBooth, staffCosts, techStack }) {
  const lines = buildCostLines(asgn, tv, techBooth, staffCosts, techStack)
  const sections = ['Operational', 'Lines', 'Equipment']
  const grandTotal = lines.reduce((s, l) => s + l.total, 0)

  return (
    <div className="ep-cost-view">
      {sections.map(sec => {
        const rows = lines.filter(l => l.section === sec)
        if (!rows.length) return null
        return (
          <div key={sec} className="ep-cost-section">
            <div className="ep-cost-section-title">{sec}</div>
            {rows.map((row, i) => (
              <div key={i} className="ep-cost-row">
                <div className="ep-cost-label">
                  {row.label}
                  {row.note && <span className="ep-cost-note">{row.note}</span>}
                </div>
                <div className="ep-cost-calc">
                  {row.qty > 1 ? `${row.qty} × ${fmt(row.unitCost)}` : fmt(row.unitCost)}
                </div>
                <div className="ep-cost-total">{fmt(row.total)}</div>
              </div>
            ))}
          </div>
        )
      })}

      {lines.length === 0 && (
        <p className="ep-cost-empty">No resources assigned yet. Set a production type to calculate costs.</p>
      )}

      <div className="ep-cost-summary">
        <span className="ep-cost-summary-label">Total</span>
        <span className="ep-cost-summary-value">{fmt(grandTotal)}</span>
      </div>
    </div>
  )
}

// ── Resource view sub-components ─────────────────────────────────────────────

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

// ── Main panel ───────────────────────────────────────────────────────────────

function EventPanel({ event, onClose }) {
  const p = event.extendedProps

  const [assignments, setAssignmentsState] = useState(loadAssignments)
  const [patterns]        = useState(loadPatterns)
  const [staff]           = useState(loadStaff)
  const [defaultPatterns] = useState(loadDefaultPatterns)
  const [staffCosts]      = useState(loadStaffCosts)
  const [techStack]       = useState(loadTechStack)
  const [view, setView]   = useState('resources')

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

  function tv(techKey, patternKey) {
    if (asgn[techKey] !== undefined) return asgn[techKey]
    return pattern?.[patternKey] ?? 0
  }
  const techBooth = asgn.techProductionBooth !== undefined
    ? asgn.techProductionBooth
    : (pattern?.productionBooth ?? false)

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

          {/* ── View toggle ── */}
          <div className="ep-view-toggle">
            <button
              className={`ep-view-btn${view === 'resources' ? ' ep-view-btn--active' : ''}`}
              onClick={() => setView('resources')}
            >Resources</button>
            <button
              className={`ep-view-btn${view === 'costs' ? ' ep-view-btn--active' : ''}`}
              onClick={() => setView('costs')}
            >Costs</button>
          </div>

          {view === 'costs' ? (
            <CostView
              asgn={asgn}
              tv={tv}
              techBooth={techBooth}
              staffCosts={staffCosts}
              techStack={techStack}
            />
          ) : (
            <>
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
            </>
          )}

        </div>
      </aside>
    </>
  )
}

export default EventPanel
