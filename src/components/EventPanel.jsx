import { useEffect, useRef, useState } from 'react'
import { saveToStorage } from '../services/storage'
import { loadTechStack } from '../services/techStack'
import { loadLocks, persistLocks, isRoleLocked, withRoleLock } from '../services/staffLocks'
import { bookingDuration, formatDateLabel, formatRange } from '../services/bookingTime'
import { hasPermission } from '../services/roles'
import { loadDefaultTimings } from '../services/defaultTimings'
import { computeControlTimes } from '../services/mcrTiming'

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

function loadProfiles() {
  try { return JSON.parse(localStorage.getItem('admin_staff_profiles') || '{}') }
  catch { return {} }
}

function loadBookings() {
  try { return JSON.parse(localStorage.getItem('staff_bookings') || '{}') }
  catch { return {} }
}

function persistBookings(b) {
  saveToStorage('staff_bookings', b)
}

function loadBookableAssets() {
  try { return JSON.parse(localStorage.getItem('bookable_assets') || '[]') }
  catch { return [] }
}

function loadAssetBookings() {
  try { return JSON.parse(localStorage.getItem('asset_bookings') || '[]') }
  catch { return [] }
}

const ROLE_LABELS = {
  director:          'Director',
  productionManager: 'Production Manager',
  producer:          'Producer',
  commentator:       'Commentator',
  cameraman:         'Cameraman',
  evsOperator:       'EVS Operator',
  onsiteAudio:       'Onsite Audio',
  graphicsOperator:  'Graphics Operator',
}

const STAFF_KEY_MAP = {
  director:          'director',
  productionManager: 'onsiteProductionManager',
  producer:          'producer',
  commentator:       'commentator',
  cameraman:         'cameramen',
  evsOperator:       'evsOperator',
  onsiteAudio:       'onsiteAudio',
  graphicsOperator:  'graphicsOperator',
}

function bookingStatus(name, field, eventId, profiles, bookings) {
  if (!name) return null
  const staffKey = STAFF_KEY_MAP[field]
  const isStaff = profiles[staffKey]?.[name]?.isStaff ?? false
  if (isStaff) return 'confirmed'
  const status = bookings[eventId]?.[field] || ''
  return status === 'confirmed' ? 'confirmed' : status === 'offered' ? 'offered' : 'unbooked'
}

function persistAssignments(a) {
  saveToStorage('production_assignments', a)
  window.dispatchEvent(new CustomEvent('assignments-updated'))
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

function buildCostLines(asgn, tv, techBooth, techStudio, techObUnit, staffCosts, techStack, linkedAssetBookings, bookableAssets) {
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
  if (techStudio) {
    const uc = techStack.studiosCost ?? 0
    lines.push({ section: 'Equipment', label: 'Studio', qty: 1, unitCost: uc, total: uc })
  }
  if (techObUnit) {
    const uc = techStack.obUnitsCost ?? 0
    lines.push({ section: 'Equipment', label: 'OB Unit', qty: 1, unitCost: uc, total: uc })
  }

  // Bookable assets booked for this event
  linkedAssetBookings.forEach(b => {
    const uc = bookableAssets.find(a => a.id === b.assetId)?.cost ?? 0
    lines.push({ section: 'Equipment', label: `${b.assetName} ${b.unit}`, note: formatDateLabel(b.date), qty: 1, unitCost: uc, total: uc })
  })

  // Pre-production cost — a flat figure entered when the event was created/edited
  const preProdCost = Number(asgn.preProductionCost) || 0
  if (preProdCost > 0) {
    lines.push({ section: 'Pre-Production', label: 'Pre-Production Cost', qty: 1, unitCost: preProdCost, total: preProdCost })
  }

  return lines
}

// ── Cost view ────────────────────────────────────────────────────────────────

function CostView({ asgn, tv, techBooth, techStudio, techObUnit, staffCosts, techStack, linkedAssetBookings, bookableAssets }) {
  const lines = buildCostLines(asgn, tv, techBooth, techStudio, techObUnit, staffCosts, techStack, linkedAssetBookings, bookableAssets)
  const sections = ['Pre-Production', 'Operational', 'Lines', 'Equipment']
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

// ── Timings view ─────────────────────────────────────────────────────────────

function TimingsView({ event, timing, asgn, onChange, readOnly }) {
  const extendedMinutes = asgn.extendedMinutes || 0
  const postMatchTotal = (asgn.postMatchShowDuration || 0) + extendedMinutes
  const controlTimes = computeControlTimes(event, timing, asgn.preMatchShowDuration, postMatchTotal)
  const extendedHours = extendedMinutes / 60

  function handleExtend() {
    onChange('extendedMinutes', extendedMinutes + 60)
  }

  return (
    <div className="ep-timings-view">
      <div className="ep-section">
        <span className="ep-section-title">Timings</span>
      </div>
      <dl className="ep-details">
        <dt>Lines Booking</dt><dd>{controlTimes.linesBooking}</dd>
        <dt>Lineup</dt><dd>{controlTimes.lineup}</dd>
        <dt>Available for Production</dt><dd>{controlTimes.availableForProduction}</dd>
        <dt>Match Start</dt><dd>{controlTimes.start}</dd>
        <dt>Match End</dt><dd>{controlTimes.matchEnd}</dd>
        <dt>Lines Down</dt><dd>{controlTimes.linesDown}</dd>
      </dl>

      <div className="ep-section">
        <span className="ep-section-title">Surrounding Programming</span>
      </div>
      <div className="ep-fields">
        <TechNumField
          label="Pre-match show duration (mins)"
          value={asgn.preMatchShowDuration || 0}
          field="preMatchShowDuration"
          onChange={onChange}
          readOnly={readOnly}
        />
        <TechNumField
          label="Post-match show duration (mins)"
          value={asgn.postMatchShowDuration || 0}
          field="postMatchShowDuration"
          onChange={onChange}
          readOnly={readOnly}
        />
      </div>

      <button
        type="button"
        className="ep-extend-timings-btn"
        disabled={readOnly}
        title={readOnly ? "Your role doesn't have permission to edit events" : undefined}
        onClick={handleExtend}
      >
        URGENT: Extend timings
      </button>
      {extendedHours > 0 && (
        <p className="ep-extend-timings-note">
          All internal facilities have been extended by {extendedHours === 1 ? 'an hour' : `${extendedHours} hours`},
          and external lines providers have had an urgent request to extend the booking.
        </p>
      )}
    </div>
  )
}

// ── Resource view sub-components ─────────────────────────────────────────────

function StaffSelect({ label, value, options, field, onChange, status, onStatusChange, locked, onToggleLock, readOnly }) {
  const statusCls = status === 'confirmed' ? ' ep-field--confirmed'
                  : status === 'offered'   ? ' ep-field--offered'
                  : status === 'unbooked'  ? ' ep-field--unbooked'
                  : ''
  return (
    <div className={`ep-field${statusCls}${locked ? ' ep-field--locked' : ''}`}>
      <span className="ep-field-label">{label}</span>
      <select
        className={`ep-select${value ? ' ep-select--set' : ''}`}
        value={value || ''}
        disabled={locked || readOnly}
        title={readOnly ? "Your role doesn't have permission to edit events" : undefined}
        onChange={e => onChange(field, e.target.value)}
      >
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {!locked && !readOnly && status === 'unbooked' && (
        <button className="ep-booking-btn ep-booking-btn--offer" onClick={() => onStatusChange('offered')}>
          Offer job
        </button>
      )}
      {!locked && !readOnly && status === 'offered' && (
        <button className="ep-booking-btn ep-booking-btn--accept" onClick={() => onStatusChange('confirmed')}>
          Confirm
        </button>
      )}
      {value && value !== 'Freelance required' && (
        <button
          type="button"
          className={`ep-lock-btn${locked ? ' ep-lock-btn--locked' : ''}`}
          disabled={readOnly}
          title={readOnly ? "Your role doesn't have permission to edit events" : (locked ? 'Unlock to make changes' : 'Lock this booking')}
          onClick={onToggleLock}
        >
          {locked ? 'Locked' : 'Lock'}
        </button>
      )}
    </div>
  )
}

function TechNumField({ label, value, field, onChange, overridden, readOnly }) {
  return (
    <div className={`ep-field${overridden ? ' ep-field--overridden' : ''}`}>
      <span className="ep-field-label">{label}</span>
      <input
        className="ep-num-input"
        type="number"
        min="0"
        max="999"
        value={value}
        disabled={readOnly}
        title={readOnly ? "Your role doesn't have permission to edit events" : undefined}
        onChange={e => onChange(field, Math.max(0, parseInt(e.target.value, 10) || 0))}
      />
    </div>
  )
}

function TechToggleField({ label, value, field, onChange, overridden, readOnly }) {
  return (
    <div className={`ep-field${overridden ? ' ep-field--overridden' : ''}`}>
      <span className="ep-field-label">{label}</span>
      <label className="pf-toggle">
        <input
          type="checkbox"
          checked={!!value}
          disabled={readOnly}
          title={readOnly ? "Your role doesn't have permission to edit events" : undefined}
          onChange={e => onChange(field, e.target.checked)}
        />
        <span className="pf-toggle-track"><span className="pf-toggle-thumb" /></span>
        <span className="pf-toggle-text">{value ? 'Yes' : 'No'}</span>
      </label>
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────────────

function EventPanel({ event, onClose, onDeleteEvent, onAddBookableAssets, role }) {
  const p = event.extendedProps
  const canUpdate = hasPermission(role, 'events', 'update')
  const canDelete = hasPermission(role, 'events', 'delete')
  const canAddAssets = hasPermission(role, 'technicalAssets', 'create')

  const [assignments, setAssignmentsState] = useState(loadAssignments)
  const [patterns]        = useState(loadPatterns)
  const [staff]           = useState(loadStaff)
  const [defaultPatterns] = useState(loadDefaultPatterns)
  const [staffCosts]      = useState(loadStaffCosts)
  const [techStack]       = useState(loadTechStack)
  const [profiles]        = useState(loadProfiles)
  const [bookings, setBookings] = useState(loadBookings)
  const [locks, setLocks]       = useState(loadLocks)
  const [bookableAssets]        = useState(loadBookableAssets)
  const [assetBookings, setAssetBookings] = useState(loadAssetBookings)
  const [defaultTimings]  = useState(loadDefaultTimings)
  const [view, setView]   = useState('resources')
  const [notice, setNotice] = useState(null)
  const noticeTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(noticeTimerRef.current), [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    function onUpdate() { setLocks(loadLocks()) }
    window.addEventListener('locks-updated', onUpdate)
    return () => window.removeEventListener('locks-updated', onUpdate)
  }, [])

  useEffect(() => {
    function onUpdate() { setAssetBookings(loadAssetBookings()) }
    window.addEventListener('asset-bookings-updated', onUpdate)
    return () => window.removeEventListener('asset-bookings-updated', onUpdate)
  }, [])

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
  const techStudio = asgn.techStudio !== undefined
    ? asgn.techStudio
    : (pattern?.studio ?? false)
  const techObUnit = asgn.techObUnit !== undefined
    ? asgn.techObUnit
    : (pattern?.obUnit ?? false)
  const techPassthrough = asgn.techPassthrough !== undefined
    ? asgn.techPassthrough
    : (pattern?.passthrough ?? false)

  function isOverridden(techKey, patternKey) {
    const saved = asgn[techKey]
    if (saved === undefined) return false
    return saved !== (pattern?.[patternKey] ?? 0)
  }
  const boothOverridden = asgn.techProductionBooth !== undefined &&
    asgn.techProductionBooth !== (pattern?.productionBooth ?? false)
  const studioOverridden = asgn.techStudio !== undefined &&
    asgn.techStudio !== (pattern?.studio ?? false)
  const obUnitOverridden = asgn.techObUnit !== undefined &&
    asgn.techObUnit !== (pattern?.obUnit ?? false)
  const passthroughOverridden = asgn.techPassthrough !== undefined &&
    asgn.techPassthrough !== (pattern?.passthrough ?? false)

  function setBookingStatus(field, newStatus, name) {
    setBookings(prev => {
      const next = { ...prev, [event.id]: { ...prev[event.id], [field]: newStatus } }
      persistBookings(next)
      window.dispatchEvent(new CustomEvent('bookings-updated'))
      return next
    })
    // A confirmed freelancer is booking-final — pencil becomes locked automatically.
    if (newStatus === 'confirmed') {
      setLocks(prev => {
        const next = withRoleLock(prev, event.id, field, true)
        persistLocks(next)
        return next
      })
    }
    if (newStatus === 'offered' && name) {
      const timeStr = timePart ? ` at ${timePart}` : ''
      const dateSuffix = dateStr ? ` on ${dateStr}` : ''
      clearTimeout(noticeTimerRef.current)
      setNotice(`${name} has been offered ${ROLE_LABELS[field] || field} for ${event.title}${dateSuffix}${timeStr}. A calendar invite has also been sent out.`)
      noticeTimerRef.current = setTimeout(() => setNotice(null), 8000)
    }
  }

  function handleDeleteEvent() {
    if (!window.confirm(
      `Delete "${event.title}"? This removes it and every related staff booking, editorial decision, and production assignment. This cannot be undone.`
    )) return
    onDeleteEvent(event)
  }

  function toggleLock(field) {
    setLocks(prev => {
      const next = withRoleLock(prev, event.id, field, !isRoleLocked(prev, event.id, field))
      persistLocks(next)
      return next
    })
  }

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
        update.techStudio                = newPat.studio                ?? false
        update.techObUnit                = newPat.obUnit                ?? false
        update.techPassthrough           = newPat.passthrough           ?? false
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

  const linkedAssetBookings = assetBookings
    .filter(b => b.eventId === event.id)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} aria-hidden="true" />

      {notice && <div className="ep-toast">{notice}</div>}

      <aside className="event-panel" role="dialog" aria-modal="true" aria-label={event.title}>

        <div className="ep-accent" style={{ background: event.backgroundColor }} />

        <div className="ep-header">
          <div className="ep-header-meta">
            <span className="ep-comp-dot" style={{ background: event.backgroundColor }} />
            <span className="ep-comp-name">{p.competitionName}</span>
            <span className="ep-sport-badge">{p.sport}</span>
          </div>
          <div className="ep-header-actions">
            <button
              className="ba-delete-btn"
              disabled={!canDelete}
              title={!canDelete ? "Your role doesn't have permission to delete events" : undefined}
              onClick={handleDeleteEvent}
            >
              Delete Event
            </button>
            <button className="ep-close" onClick={onClose} aria-label="Close panel">
              &#x2715;
            </button>
          </div>
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
            <button
              className={`ep-view-btn${view === 'timings' ? ' ep-view-btn--active' : ''}`}
              onClick={() => setView('timings')}
            >Timings</button>
          </div>

          {view === 'timings' ? (
            <TimingsView
              event={event}
              timing={defaultTimings[p.competitionId]}
              asgn={asgn}
              onChange={setField}
              readOnly={!canUpdate}
            />
          ) : view === 'costs' ? (
            <CostView
              asgn={asgn}
              tv={tv}
              techBooth={techBooth}
              techStudio={techStudio}
              techObUnit={techObUnit}
              staffCosts={staffCosts}
              techStack={techStack}
              linkedAssetBookings={linkedAssetBookings}
              bookableAssets={bookableAssets}
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
                    disabled={!canUpdate}
                    title={!canUpdate ? "Your role doesn't have permission to edit events" : undefined}
                    onChange={e => setPatternType(e.target.value)}
                  >
                    <option value="">—</option>
                    {patterns.map(pat => <option key={pat.id} value={pat.id}>{pat.name}</option>)}
                  </select>
                </div>
                <StaffSelect label="Director"    value={asgn.director}          options={staff.director}                field="director"          onChange={setField} status={bookingStatus(asgn.director,          'director',          event.id, profiles, bookings)} onStatusChange={s => setBookingStatus('director',          s, asgn.director)} locked={isRoleLocked(locks, event.id, 'director')}          onToggleLock={() => toggleLock('director')} readOnly={!canUpdate} />
                <StaffSelect label="Prod. Mgr"   value={asgn.productionManager} options={staff.onsiteProductionManager} field="productionManager"  onChange={setField} status={bookingStatus(asgn.productionManager, 'productionManager',  event.id, profiles, bookings)} onStatusChange={s => setBookingStatus('productionManager',  s, asgn.productionManager)} locked={isRoleLocked(locks, event.id, 'productionManager')} onToggleLock={() => toggleLock('productionManager')} readOnly={!canUpdate} />
                <StaffSelect label="Producer"    value={asgn.producer}          options={staff.producer}                field="producer"          onChange={setField} status={bookingStatus(asgn.producer,          'producer',          event.id, profiles, bookings)} onStatusChange={s => setBookingStatus('producer',          s, asgn.producer)} locked={isRoleLocked(locks, event.id, 'producer')}          onToggleLock={() => toggleLock('producer')} readOnly={!canUpdate} />
                <StaffSelect label="Commentator" value={asgn.commentator}       options={staff.commentator}             field="commentator"       onChange={setField} status={bookingStatus(asgn.commentator,       'commentator',       event.id, profiles, bookings)} onStatusChange={s => setBookingStatus('commentator',       s, asgn.commentator)} locked={isRoleLocked(locks, event.id, 'commentator')}       onToggleLock={() => toggleLock('commentator')} readOnly={!canUpdate} />
                <StaffSelect label="Cameraman"   value={asgn.cameraman}         options={staff.cameramen}               field="cameraman"         onChange={setField} status={bookingStatus(asgn.cameraman,         'cameraman',         event.id, profiles, bookings)} onStatusChange={s => setBookingStatus('cameraman',         s, asgn.cameraman)} locked={isRoleLocked(locks, event.id, 'cameraman')}         onToggleLock={() => toggleLock('cameraman')} readOnly={!canUpdate} />
                <StaffSelect label="EVS"         value={asgn.evsOperator}       options={staff.evsOperator}             field="evsOperator"       onChange={setField} status={bookingStatus(asgn.evsOperator,       'evsOperator',       event.id, profiles, bookings)} onStatusChange={s => setBookingStatus('evsOperator',       s, asgn.evsOperator)} locked={isRoleLocked(locks, event.id, 'evsOperator')}       onToggleLock={() => toggleLock('evsOperator')} readOnly={!canUpdate} />
                <StaffSelect label="Audio"       value={asgn.onsiteAudio}       options={staff.onsiteAudio}             field="onsiteAudio"       onChange={setField} status={bookingStatus(asgn.onsiteAudio,       'onsiteAudio',       event.id, profiles, bookings)} onStatusChange={s => setBookingStatus('onsiteAudio',       s, asgn.onsiteAudio)} locked={isRoleLocked(locks, event.id, 'onsiteAudio')}       onToggleLock={() => toggleLock('onsiteAudio')} readOnly={!canUpdate} />
                <StaffSelect label="Graphics"    value={asgn.graphicsOperator}  options={staff.graphicsOperator}        field="graphicsOperator"  onChange={setField} status={bookingStatus(asgn.graphicsOperator,  'graphicsOperator',  event.id, profiles, bookings)} onStatusChange={s => setBookingStatus('graphicsOperator',  s, asgn.graphicsOperator)} locked={isRoleLocked(locks, event.id, 'graphicsOperator')}  onToggleLock={() => toggleLock('graphicsOperator')} readOnly={!canUpdate} />
              </div>

              {/* ── Bookable Assets ── */}
              <div className="ep-section">
                <span className="ep-section-title">Bookable Assets</span>
                <button
                  className="ep-add-assets-btn"
                  disabled={!canAddAssets}
                  title={!canAddAssets ? "Your role doesn't have permission to book assets" : undefined}
                  onClick={() => onAddBookableAssets(event)}
                >
                  + Add Bookable Assets
                </button>
              </div>
              {linkedAssetBookings.length > 0 ? (
                <div className="ep-asset-bookings">
                  {linkedAssetBookings.map(b => (
                    <div key={b.id} className="ep-asset-booking-row">
                      <span className="ep-asset-booking-name">{b.assetName} {b.unit}</span>
                      <span className="ep-asset-booking-when">
                        {formatDateLabel(b.date)} · {formatRange(b.time, bookingDuration(b, bookableAssets))}
                      </span>
                      {b.bookedBy && <span className="ep-asset-booking-by">Booked by {b.bookedBy}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ep-asset-bookings-empty">No assets booked for this event yet.</p>
              )}

              {/* ── Technical Resources ── */}
              <div className="ep-section">
                <span className="ep-section-title">Technical Resources</span>
                {pattern && <span className="ep-section-hint">{pattern.name}</span>}
              </div>
              <div className="ep-fields">
                <span className="ep-field-group-label">Crew</span>
                <TechNumField label="Cameramen"     value={tv('techCameramen',            'cameramen')}             field="techCameramen"             onChange={setField} overridden={isOverridden('techCameramen',            'cameramen')} readOnly={!canUpdate} />
                <TechNumField label="EVS Operators" value={tv('techEvsOperator',          'evsOperator')}           field="techEvsOperator"           onChange={setField} overridden={isOverridden('techEvsOperator',          'evsOperator')} readOnly={!canUpdate} />
                <TechNumField label="Audio on loc"  value={tv('techAudioOnLocation',      'audioOnLocation')}       field="techAudioOnLocation"       onChange={setField} overridden={isOverridden('techAudioOnLocation',      'audioOnLocation')} readOnly={!canUpdate} />
                <span className="ep-field-group-label">Video Lines</span>
                <TechNumField label="Incoming"      value={tv('techIncomingVideoLines',    'incomingVideoLines')}    field="techIncomingVideoLines"    onChange={setField} overridden={isOverridden('techIncomingVideoLines',    'incomingVideoLines')} readOnly={!canUpdate} />
                <TechNumField label="Outgoing"      value={tv('techOutgoingVideoLines',    'outgoingVideoLines')}    field="techOutgoingVideoLines"    onChange={setField} overridden={isOverridden('techOutgoingVideoLines',    'outgoingVideoLines')} readOnly={!canUpdate} />
                <span className="ep-field-group-label">Audio &amp; Talkback</span>
                <TechNumField label="Audio in"      value={tv('techIncomingAudioLines',    'incomingAudioLines')}    field="techIncomingAudioLines"    onChange={setField} overridden={isOverridden('techIncomingAudioLines',    'incomingAudioLines')} readOnly={!canUpdate} />
                <TechNumField label="Talkback in"   value={tv('techIncomingTalkbackLines', 'incomingTalkbackLines')} field="techIncomingTalkbackLines" onChange={setField} overridden={isOverridden('techIncomingTalkbackLines', 'incomingTalkbackLines')} readOnly={!canUpdate} />
                <TechNumField label="Talkback out"  value={tv('techOutgoingTalkbackLines', 'outgoingTalkbackLines')} field="techOutgoingTalkbackLines" onChange={setField} overridden={isOverridden('techOutgoingTalkbackLines', 'outgoingTalkbackLines')} readOnly={!canUpdate} />
                <span className="ep-field-group-label">Production</span>
                <TechToggleField label="Prod. Booth" value={techBooth} field="techProductionBooth" onChange={setField} overridden={boothOverridden} readOnly={!canUpdate} />
                <TechToggleField label="Studio" value={techStudio} field="techStudio" onChange={setField} overridden={studioOverridden} readOnly={!canUpdate} />
                <TechToggleField label="OB Unit" value={techObUnit} field="techObUnit" onChange={setField} overridden={obUnitOverridden} readOnly={!canUpdate} />
                <TechToggleField label="Passthrough" value={techPassthrough} field="techPassthrough" onChange={setField} overridden={passthroughOverridden} readOnly={!canUpdate} />
              </div>
            </>
          )}

        </div>
      </aside>
    </>
  )
}

export default EventPanel
