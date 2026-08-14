import { useState } from 'react'
import { saveToStorage } from '../services/storage'
import { buildImportedEventFromRow, colorForName } from '../services/excelImport'
import ImportExcelModal from './ImportExcelModal'

const NEW_COMPETITION = '__new_competition__'
const NEW_SPORT = '__new_sport__'

const EMPTY_FORM = {
  competitionId: '',
  newCompetitionName: '',
  sport: '',
  newSportName: '',
  governingBody: '',
  color: '#3b82f6',
  title: '',
  homeTeam: '',
  awayTeam: '',
  round: '',
  venue: '',
  allDay: false,
  startDate: '',
  startTime: '',
  endDate: '',

  patternId: '',
  director: '',
  productionManager: '',
  producer: '',
  commentator: '',
  cameraman: '',
  evsOperator: '',
  onsiteAudio: '',
  graphicsOperator: '',

  techCameramen: 0,
  techEvsOperator: 0,
  techAudioOnLocation: 0,
  techIncomingVideoLines: 0,
  techOutgoingVideoLines: 0,
  techIncomingAudioLines: 0,
  techOutgoingAudioLines: 0,
  techIncomingTalkbackLines: 0,
  techOutgoingTalkbackLines: 0,
  techProductionBooth: false,
  techStudio: false,
  techObUnit: false,
  techPassthrough: false,

  techEncoders: 0,
  techDecoders: 0,
  techFrameRateConverters: 0,
  techAudioOffset: 0,
  techOutgoingIdents: 0,
  techRecordPorts: 0,

  preProductionCost: '',
}

function loadStaff() {
  const empty = {
    cameramen: [], onsiteAudio: [], onsiteProductionManager: [],
    director: [], producer: [], commentator: [], evsOperator: [], graphicsOperator: [],
  }
  try { return { ...empty, ...JSON.parse(localStorage.getItem('admin_staff') || '{}') } }
  catch { return empty }
}

function loadPatterns() {
  try { return JSON.parse(localStorage.getItem('admin_patterns') || '[]') }
  catch { return [] }
}

function loadAssignments() {
  try { return JSON.parse(localStorage.getItem('production_assignments') || '{}') }
  catch { return {} }
}

function saveAssignment(eventId, assignment) {
  const all = loadAssignments()
  all[eventId] = { ...(all[eventId] || {}), ...assignment }
  saveToStorage('production_assignments', all)
  window.dispatchEvent(new CustomEvent('assignments-updated'))
}

function buildEvent(form, competition) {
  const start = form.allDay ? form.startDate : `${form.startDate}T${form.startTime}`
  const end = form.allDay && form.endDate ? form.endDate : undefined
  const title = form.title.trim() || (form.homeTeam && form.awayTeam
    ? `${form.homeTeam} v ${form.awayTeam}`
    : 'Untitled Event')

  return {
    id: `imported|${crypto.randomUUID()}`,
    title,
    start,
    end,
    allDay: form.allDay,
    backgroundColor: competition.color,
    borderColor: competition.color,
    extendedProps: {
      competitionId: competition.id,
      competitionName: competition.name,
      governingBody: competition.governingBody,
      sport: competition.sport,
      homeTeam: form.homeTeam || null,
      awayTeam: form.awayTeam || null,
      homeScore: null,
      awayScore: null,
      venue: form.venue || null,
      round: form.round || null,
    },
  }
}

function buildAssignment(form) {
  const a = {}
  if (form.patternId) a.patternId = form.patternId
  if (form.director) a.director = form.director
  if (form.productionManager) a.productionManager = form.productionManager
  if (form.producer) a.producer = form.producer
  if (form.commentator) a.commentator = form.commentator
  if (form.cameraman) a.cameraman = form.cameraman
  if (form.evsOperator) a.evsOperator = form.evsOperator
  if (form.onsiteAudio) a.onsiteAudio = form.onsiteAudio
  if (form.graphicsOperator) a.graphicsOperator = form.graphicsOperator

  const hasTechData = form.patternId ||
    form.techCameramen || form.techEvsOperator || form.techAudioOnLocation ||
    form.techIncomingVideoLines || form.techOutgoingVideoLines ||
    form.techIncomingAudioLines || form.techOutgoingAudioLines ||
    form.techIncomingTalkbackLines || form.techOutgoingTalkbackLines ||
    form.techProductionBooth || form.techStudio || form.techObUnit || form.techPassthrough

  if (hasTechData) {
    a.techCameramen             = Number(form.techCameramen) || 0
    a.techEvsOperator           = Number(form.techEvsOperator) || 0
    a.techAudioOnLocation       = Number(form.techAudioOnLocation) || 0
    a.techIncomingVideoLines    = Number(form.techIncomingVideoLines) || 0
    a.techOutgoingVideoLines    = Number(form.techOutgoingVideoLines) || 0
    a.techIncomingAudioLines    = Number(form.techIncomingAudioLines) || 0
    a.techOutgoingAudioLines    = Number(form.techOutgoingAudioLines) || 0
    a.techIncomingTalkbackLines = Number(form.techIncomingTalkbackLines) || 0
    a.techOutgoingTalkbackLines = Number(form.techOutgoingTalkbackLines) || 0
    a.techProductionBooth       = !!form.techProductionBooth
    a.techStudio                = !!form.techStudio
    a.techObUnit                = !!form.techObUnit
    a.techPassthrough           = !!form.techPassthrough
  }

  const hasEquipData = form.techEncoders || form.techDecoders || form.techFrameRateConverters ||
    form.techAudioOffset || form.techOutgoingIdents || form.techRecordPorts

  if (hasEquipData) {
    a.techEncoders             = Number(form.techEncoders) || 0
    a.techDecoders             = Number(form.techDecoders) || 0
    a.techFrameRateConverters  = Number(form.techFrameRateConverters) || 0
    a.techAudioOffset          = Number(form.techAudioOffset) || 0
    a.techOutgoingIdents       = Number(form.techOutgoingIdents) || 0
    a.techRecordPorts          = Number(form.techRecordPorts) || 0
  }

  if (form.preProductionCost !== '' && Number(form.preProductionCost) > 0) {
    a.preProductionCost = Number(form.preProductionCost)
  }

  return a
}

function TechField({ label, value, onChange }) {
  return (
    <div className="import-field">
      <label>{label}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
      />
    </div>
  )
}

function TechToggle({ label, checked, onChange }) {
  return (
    <div className="import-field">
      <label>{label}</label>
      <label className="import-toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span>{checked ? 'Yes' : 'No'}</span>
      </label>
    </div>
  )
}

function StaffField({ label, value, options, onChange }) {
  return (
    <div className="import-field">
      <label>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}

function ImportEventsView({ competitions, onAdd, onAddBatch, onAddCompetition }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState('')
  const [staff] = useState(loadStaff)
  const [patterns] = useState(loadPatterns)
  const [showExcelModal, setShowExcelModal] = useState(false)

  const sports = [...new Set(competitions.map(c => c.sport))].sort()
  const isNewCompetition = form.competitionId === NEW_COMPETITION

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handlePatternChange(patternId) {
    const pattern = patterns.find(p => p.id === patternId)
    setForm(prev => {
      const next = { ...prev, patternId }
      if (pattern) {
        next.techCameramen             = pattern.cameramen             ?? 0
        next.techEvsOperator           = pattern.evsOperator           ?? 0
        next.techAudioOnLocation       = pattern.audioOnLocation       ?? 0
        next.techIncomingVideoLines    = pattern.incomingVideoLines    ?? 0
        next.techOutgoingVideoLines    = pattern.outgoingVideoLines    ?? 0
        next.techIncomingAudioLines    = pattern.incomingAudioLines    ?? 0
        next.techIncomingTalkbackLines = pattern.incomingTalkbackLines ?? 0
        next.techOutgoingTalkbackLines = pattern.outgoingTalkbackLines ?? 0
        next.techProductionBooth       = pattern.productionBooth       ?? false
        next.techStudio                = pattern.studio                ?? false
        next.techObUnit                = pattern.obUnit                ?? false
        next.techPassthrough           = pattern.passthrough           ?? false
      }
      return next
    })
  }

  function validate() {
    const next = {}
    if (!form.competitionId) next.competitionId = 'Choose a competition'
    if (isNewCompetition) {
      if (!form.newCompetitionName.trim()) next.newCompetitionName = 'Enter a competition name'
      if (!form.sport) next.sport = 'Choose a sport'
      if (form.sport === NEW_SPORT && !form.newSportName.trim()) next.newSportName = 'Enter a sport name'
    }
    if (!form.startDate) next.startDate = 'Start date is required'
    if (!form.allDay && !form.startTime) next.startTime = 'Start time is required'
    if (!form.title.trim() && !(form.homeTeam.trim() && form.awayTeam.trim())) {
      next.title = 'Enter a title, or both a home and away team'
    }
    return next
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validation = validate()
    setErrors(validation)
    if (Object.keys(validation).length > 0) { setSuccessMsg(''); return }

    let competition
    if (isNewCompetition) {
      const name = form.newCompetitionName.trim()
      const sportName = form.sport === NEW_SPORT ? form.newSportName.trim() : form.sport
      competition = {
        id: `custom_${crypto.randomUUID()}`,
        name,
        shortName: name,
        sport: sportName,
        governingBody: form.governingBody.trim() || name,
        color: form.color,
      }
      onAddCompetition(competition)
    } else {
      competition = competitions.find(c => c.id === form.competitionId)
    }

    const event = buildEvent(form, competition)
    onAdd(event)

    const assignment = buildAssignment(form)
    if (Object.keys(assignment).length > 0) saveAssignment(event.id, assignment)

    setSuccessMsg(`"${event.title}" was added. Toggle ${competition.name} on in the competition bar to see it on the calendar.`)
    setForm({ ...EMPTY_FORM, competitionId: competition.id })
    setErrors({})
  }

  function handleExcelAccept({ sportName, competitionName, rows }) {
    let competition = competitions.find(
      c => c.name.trim().toLowerCase() === competitionName.trim().toLowerCase()
    )
    if (!competition) {
      competition = {
        id: `custom_${crypto.randomUUID()}`,
        name: competitionName,
        shortName: competitionName,
        sport: sportName,
        governingBody: competitionName,
        color: colorForName(competitionName),
      }
      onAddCompetition(competition)
    }

    const events = rows.map(row => buildImportedEventFromRow(row, competition))
    onAddBatch(events)

    setShowExcelModal(false)
    setSuccessMsg(`Imported ${events.length} event(s) into ${competition.name}. Toggle ${competition.name} on in the competition bar to see them on the calendar.`)
  }

  return (
    <div className="import-page">
    <div className="import-view">
      <form className="import-card" onSubmit={handleSubmit}>
        <h2>Import Event</h2>
        <p className="import-hint">Fill in the details below to add a new event to the calendar.</p>

        {successMsg && <div className="import-success">{successMsg}</div>}

        <div className="import-grid">
          <div className={`import-field${errors.competitionId ? ' import-field--error' : ''}`}>
            <label htmlFor="imp-competition">Competition</label>
            <select
              id="imp-competition"
              value={form.competitionId}
              onChange={e => setField('competitionId', e.target.value)}
            >
              <option value="">— select competition —</option>
              {competitions.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value={NEW_COMPETITION}>+ Add new competition…</option>
            </select>
            {errors.competitionId && <span className="import-field-error-msg">{errors.competitionId}</span>}
          </div>

          {isNewCompetition && (
            <div className={`import-field${errors.newCompetitionName ? ' import-field--error' : ''}`}>
              <label htmlFor="imp-new-comp-name">New Competition Name</label>
              <input
                id="imp-new-comp-name"
                type="text"
                value={form.newCompetitionName}
                onChange={e => setField('newCompetitionName', e.target.value)}
              />
              {errors.newCompetitionName && <span className="import-field-error-msg">{errors.newCompetitionName}</span>}
            </div>
          )}

          {isNewCompetition && (
            <div className={`import-field${errors.sport ? ' import-field--error' : ''}`}>
              <label htmlFor="imp-sport">Sport</label>
              <select
                id="imp-sport"
                value={form.sport}
                onChange={e => setField('sport', e.target.value)}
              >
                <option value="">— select sport —</option>
                {sports.map(s => <option key={s} value={s}>{s}</option>)}
                <option value={NEW_SPORT}>+ Add new sport…</option>
              </select>
              {errors.sport && <span className="import-field-error-msg">{errors.sport}</span>}
            </div>
          )}

          {isNewCompetition && form.sport === NEW_SPORT && (
            <div className={`import-field${errors.newSportName ? ' import-field--error' : ''}`}>
              <label htmlFor="imp-new-sport-name">New Sport Name</label>
              <input
                id="imp-new-sport-name"
                type="text"
                placeholder="e.g. Cricket"
                value={form.newSportName}
                onChange={e => setField('newSportName', e.target.value)}
              />
              {errors.newSportName && <span className="import-field-error-msg">{errors.newSportName}</span>}
            </div>
          )}

          {isNewCompetition && (
            <div className="import-field">
              <label htmlFor="imp-governing-body">Governing Body</label>
              <input
                id="imp-governing-body"
                type="text"
                placeholder="Optional"
                value={form.governingBody}
                onChange={e => setField('governingBody', e.target.value)}
              />
            </div>
          )}

          {isNewCompetition && (
            <div className="import-field">
              <label htmlFor="imp-color">Colour</label>
              <input
                id="imp-color"
                type="color"
                value={form.color}
                onChange={e => setField('color', e.target.value)}
              />
            </div>
          )}

          <div className={`import-field${errors.title ? ' import-field--error' : ''}`}>
            <label htmlFor="imp-title">Event Title</label>
            <input
              id="imp-title"
              type="text"
              placeholder="Leave blank to auto-generate from teams"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
            />
            {errors.title && <span className="import-field-error-msg">{errors.title}</span>}
          </div>

          <div className="import-field">
            <label htmlFor="imp-home">Home Team</label>
            <input id="imp-home" type="text" value={form.homeTeam} onChange={e => setField('homeTeam', e.target.value)} />
          </div>

          <div className="import-field">
            <label htmlFor="imp-away">Away Team</label>
            <input id="imp-away" type="text" value={form.awayTeam} onChange={e => setField('awayTeam', e.target.value)} />
          </div>

          <div className="import-field">
            <label htmlFor="imp-round">Round</label>
            <input id="imp-round" type="text" value={form.round} onChange={e => setField('round', e.target.value)} />
          </div>

          <div className="import-field">
            <label htmlFor="imp-venue">Venue</label>
            <input id="imp-venue" type="text" value={form.venue} onChange={e => setField('venue', e.target.value)} />
          </div>

          <div className="import-checkbox-row">
            <input
              id="imp-allday"
              type="checkbox"
              checked={form.allDay}
              onChange={e => setField('allDay', e.target.checked)}
            />
            <label htmlFor="imp-allday">All-day event (e.g. multi-day tournament)</label>
          </div>

          <div className={`import-field${errors.startDate ? ' import-field--error' : ''}`}>
            <label htmlFor="imp-start-date">Start Date</label>
            <input
              id="imp-start-date"
              type="date"
              value={form.startDate}
              onChange={e => setField('startDate', e.target.value)}
            />
            {errors.startDate && <span className="import-field-error-msg">{errors.startDate}</span>}
          </div>

          {!form.allDay && (
            <div className={`import-field${errors.startTime ? ' import-field--error' : ''}`}>
              <label htmlFor="imp-start-time">Start Time</label>
              <input
                id="imp-start-time"
                type="time"
                value={form.startTime}
                onChange={e => setField('startTime', e.target.value)}
              />
              {errors.startTime && <span className="import-field-error-msg">{errors.startTime}</span>}
            </div>
          )}

          {form.allDay && (
            <div className="import-field">
              <label htmlFor="imp-end-date">End Date</label>
              <input
                id="imp-end-date"
                type="date"
                value={form.endDate}
                onChange={e => setField('endDate', e.target.value)}
              />
              <span className="import-field-hint">Leave blank for a single-day event. For multi-day, enter the day after it ends.</span>
            </div>
          )}
        </div>

        <div className="import-section-title">Production <span className="import-section-hint">(optional)</span></div>
        <div className="import-grid">
          <div className="import-field">
            <label htmlFor="imp-pattern">Production Type</label>
            <select
              id="imp-pattern"
              value={form.patternId}
              onChange={e => handlePatternChange(e.target.value)}
            >
              <option value="">— none —</option>
              {patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="import-field-hint">Selecting a type pre-fills the technical resources below.</span>
          </div>

          <StaffField label="Director"          value={form.director}          options={staff.director}                onChange={v => setField('director', v)} />
          <StaffField label="Production Manager" value={form.productionManager} options={staff.onsiteProductionManager} onChange={v => setField('productionManager', v)} />
          <StaffField label="Producer"          value={form.producer}          options={staff.producer}                onChange={v => setField('producer', v)} />
          <StaffField label="Commentator"       value={form.commentator}       options={staff.commentator}             onChange={v => setField('commentator', v)} />
          <StaffField label="Cameraman"         value={form.cameraman}         options={staff.cameramen}               onChange={v => setField('cameraman', v)} />
          <StaffField label="EVS Operator"      value={form.evsOperator}       options={staff.evsOperator}             onChange={v => setField('evsOperator', v)} />
          <StaffField label="Audio"             value={form.onsiteAudio}       options={staff.onsiteAudio}             onChange={v => setField('onsiteAudio', v)} />
          <StaffField label="Graphics Operator" value={form.graphicsOperator}  options={staff.graphicsOperator}        onChange={v => setField('graphicsOperator', v)} />
        </div>

        <div className="import-section-title">Technical Resources <span className="import-section-hint">(optional)</span></div>
        <div className="import-grid">
          <TechField label="Cameramen"          value={form.techCameramen}          onChange={v => setField('techCameramen', v)} />
          <TechField label="EVS Operators"      value={form.techEvsOperator}        onChange={v => setField('techEvsOperator', v)} />
          <TechField label="Audio on Location"  value={form.techAudioOnLocation}    onChange={v => setField('techAudioOnLocation', v)} />
          <TechField label="Video Lines In"     value={form.techIncomingVideoLines} onChange={v => setField('techIncomingVideoLines', v)} />
          <TechField label="Video Lines Out"    value={form.techOutgoingVideoLines} onChange={v => setField('techOutgoingVideoLines', v)} />
          <TechField label="Audio Lines In"     value={form.techIncomingAudioLines} onChange={v => setField('techIncomingAudioLines', v)} />
          <TechField label="Audio Lines Out"    value={form.techOutgoingAudioLines} onChange={v => setField('techOutgoingAudioLines', v)} />
          <TechField label="Talkback In"        value={form.techIncomingTalkbackLines} onChange={v => setField('techIncomingTalkbackLines', v)} />
          <TechField label="Talkback Out"       value={form.techOutgoingTalkbackLines} onChange={v => setField('techOutgoingTalkbackLines', v)} />
          <TechToggle label="Production Booth"  checked={form.techProductionBooth} onChange={v => setField('techProductionBooth', v)} />
          <TechToggle label="Studio"            checked={form.techStudio}          onChange={v => setField('techStudio', v)} />
          <TechToggle label="OB Unit"           checked={form.techObUnit}          onChange={v => setField('techObUnit', v)} />
          <TechToggle label="Passthrough"       checked={form.techPassthrough}     onChange={v => setField('techPassthrough', v)} />
        </div>

        <div className="import-section-title">Equipment <span className="import-section-hint">(optional — matches Admin → Tech Stack)</span></div>
        <div className="import-grid">
          <TechField label="Encoders"               value={form.techEncoders}              onChange={v => setField('techEncoders', v)} />
          <TechField label="Decoders"                value={form.techDecoders}              onChange={v => setField('techDecoders', v)} />
          <TechField label="Frame Rate Converters"   value={form.techFrameRateConverters}   onChange={v => setField('techFrameRateConverters', v)} />
          <TechField label="Audio Offset"            value={form.techAudioOffset}           onChange={v => setField('techAudioOffset', v)} />
          <TechField label="Outgoing Idents"         value={form.techOutgoingIdents}        onChange={v => setField('techOutgoingIdents', v)} />
          <TechField label="Record Ports"            value={form.techRecordPorts}           onChange={v => setField('techRecordPorts', v)} />
        </div>

        <div className="import-section-title">Costs <span className="import-section-hint">(optional)</span></div>
        <div className="import-grid">
          <div className="import-field">
            <label htmlFor="imp-preprod-cost">Pre-Production Cost (£)</label>
            <input
              id="imp-preprod-cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.preProductionCost}
              onChange={e => setField('preProductionCost', e.target.value)}
            />
            <span className="import-field-hint">Added to this event's costings in the Event Inspector.</span>
          </div>
        </div>

        <div className="import-actions">
          <button type="submit" className="import-save-btn">Save</button>
        </div>
      </form>
    </div>

      <div className="import-bottom-bar">
        <button className="import-excel-btn" onClick={() => setShowExcelModal(true)}>
          Import from Excel
        </button>
      </div>

      {showExcelModal && (
        <ImportExcelModal
          onAccept={handleExcelAccept}
          onClose={() => setShowExcelModal(false)}
        />
      )}
    </div>
  )
}

export default ImportEventsView
