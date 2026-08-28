import { useState } from 'react'
import { saveToStorage } from '../services/storage'
import { buildImportedEventFromRow, colorForName } from '../services/excelImport'
import ImportExcelModal from './ImportExcelModal'
import ImportOptaModal from './ImportOptaModal'
import ImportCompetitionOrganiserModal from './ImportCompetitionOrganiserModal'
import { hasPermission } from '../services/roles'

const NEW_COMPETITION = '__new_competition__'
const NEW_SPORT = '__new_sport__'
const NEW_DEPARTMENT = '__new_department__'
const MAX_REPEAT_OCCURRENCES = 366

const EMPTY_FORM = {
  eventType: 'sport',

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
  startTime: '09:00',
  endDate: '',

  programmeTitle: '',
  departmentId: '',
  newDepartmentName: '',
  repeat: 'none',
  repeatCustomDays: 7,
  repeatEndType: 'occurrences',
  repeatOccurrences: 4,
  repeatEndDate: '',

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

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// Expands a repeat rule into one or more dated occurrences.
function buildRepeatDates(form) {
  if (form.repeat === 'none') return [form.startDate]

  const step = form.repeat === 'daily' ? 1
    : form.repeat === 'weekly' ? 7
    : Math.max(1, parseInt(form.repeatCustomDays, 10) || 1)

  const dates = []
  let current = form.startDate

  if (form.repeatEndType === 'occurrences') {
    const count = Math.max(1, parseInt(form.repeatOccurrences, 10) || 1)
    for (let i = 0; i < count && i < MAX_REPEAT_OCCURRENCES; i++) {
      dates.push(current)
      current = addDays(current, step)
    }
  } else {
    let i = 0
    while (current <= form.repeatEndDate && i < MAX_REPEAT_OCCURRENCES) {
      dates.push(current)
      current = addDays(current, step)
      i++
    }
  }

  return dates
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

function buildProgrammeEvent(form, department, date) {
  const title = form.programmeTitle.trim() || 'Untitled Programme'

  return {
    id: `imported|${crypto.randomUUID()}`,
    title,
    start: `${date}T${form.startTime}`,
    end: undefined,
    allDay: false,
    backgroundColor: department.color,
    borderColor: department.color,
    extendedProps: {
      competitionId: department.id,
      competitionName: department.name,
      governingBody: department.governingBody,
      sport: department.sport,
      homeTeam: null,
      awayTeam: null,
      homeScore: null,
      awayScore: null,
      venue: null,
      round: null,
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

function ImportEventsView({ competitions, onAdd, onAddBatch, onAddCompetition, role }) {
  const canCreate = hasPermission(role, 'events', 'create')
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState('')
  const [staff] = useState(loadStaff)
  const [patterns] = useState(loadPatterns)
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [showOptaModal, setShowOptaModal] = useState(false)
  const [showCompOrgModal, setShowCompOrgModal] = useState(false)

  const sports = [...new Set(competitions.map(c => c.sport))].sort()
  const isNewCompetition = form.competitionId === NEW_COMPETITION
  const departments = competitions.filter(c => c.sport === 'Programme')
  const isNewDepartment = form.departmentId === NEW_DEPARTMENT

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function patternDefaults(pattern) {
    if (!pattern) return {}
    return {
      techCameramen:             pattern.cameramen             ?? 0,
      techEvsOperator:           pattern.evsOperator           ?? 0,
      techAudioOnLocation:       pattern.audioOnLocation       ?? 0,
      techIncomingVideoLines:    pattern.incomingVideoLines    ?? 0,
      techOutgoingVideoLines:    pattern.outgoingVideoLines    ?? 0,
      techIncomingAudioLines:    pattern.incomingAudioLines    ?? 0,
      techIncomingTalkbackLines: pattern.incomingTalkbackLines ?? 0,
      techOutgoingTalkbackLines: pattern.outgoingTalkbackLines ?? 0,
      techProductionBooth:       pattern.productionBooth       ?? false,
      techStudio:                pattern.studio                ?? false,
      techObUnit:                pattern.obUnit                ?? false,
      techPassthrough:           pattern.passthrough            ?? false,
    }
  }

  function handleEventTypeChange(eventType) {
    let next = { ...EMPTY_FORM, eventType }
    if (eventType === 'programme') {
      const studioPattern = patterns.find(p => p.name === 'Studio Show')
      next.techStudio = true
      if (studioPattern) {
        next = { ...next, patternId: studioPattern.id, ...patternDefaults(studioPattern) }
      }
    }
    setForm(next)
    setErrors({})
    setSuccessMsg('')
  }

  function handlePatternChange(patternId) {
    const pattern = patterns.find(p => p.id === patternId)
    setForm(prev => {
      const next = { ...prev, patternId, ...patternDefaults(pattern) }
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

  function validateProgramme() {
    const next = {}
    if (!form.programmeTitle.trim()) next.programmeTitle = 'Enter a programme title'
    if (!form.departmentId) next.departmentId = 'Choose a department'
    if (isNewDepartment && !form.newDepartmentName.trim()) next.newDepartmentName = 'Enter a department name'
    if (!form.startDate) next.startDate = 'Start date is required'
    if (!form.startTime) next.startTime = 'Start time is required'
    if (form.repeat !== 'none' && form.repeatEndType === 'date' &&
        (!form.repeatEndDate || form.repeatEndDate < form.startDate)) {
      next.repeatEndDate = 'Enter an end date on or after the start date'
    }
    return next
  }

  function handleSubmit(e) {
    if (form.eventType === 'programme') handleProgrammeSubmit(e)
    else handleSportSubmit(e)
  }

  function handleSportSubmit(e) {
    e.preventDefault()
    if (!canCreate) return
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

  function handleProgrammeSubmit(e) {
    e.preventDefault()
    if (!canCreate) return
    const validation = validateProgramme()
    setErrors(validation)
    if (Object.keys(validation).length > 0) { setSuccessMsg(''); return }

    let department
    if (isNewDepartment) {
      const name = form.newDepartmentName.trim()
      department = {
        id: `custom_${crypto.randomUUID()}`,
        name,
        shortName: name,
        sport: 'Programme',
        governingBody: name,
        color: colorForName(name),
      }
      onAddCompetition(department)
    } else {
      department = competitions.find(c => c.id === form.departmentId)
    }

    const dates = buildRepeatDates(form)
    const events = dates.map(date => buildProgrammeEvent(form, department, date))

    if (events.length === 1) onAdd(events[0])
    else onAddBatch(events)

    const assignment = buildAssignment(form)
    if (Object.keys(assignment).length > 0) {
      events.forEach(ev => saveAssignment(ev.id, assignment))
    }

    setSuccessMsg(
      `"${events[0].title}" was added${events.length > 1 ? ` (${events.length} occurrences)` : ''}. ` +
      `Toggle ${department.name} on in the competition bar to see it on the calendar.`
    )
    const studioPattern = patterns.find(p => p.name === 'Studio Show')
    let resetForm = { ...EMPTY_FORM, eventType: 'programme', techStudio: true, departmentId: department.id }
    if (studioPattern) {
      resetForm = { ...resetForm, patternId: studioPattern.id, ...patternDefaults(studioPattern) }
    }
    setForm(resetForm)
    setErrors({})
  }

  function handleExcelAccept({ sportName, competitionName, rows }) {
    if (!canCreate) return
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

  function handleOptaConnect({ accountId }) {
    setShowOptaModal(false)
    setSuccessMsg(`Opta account "${accountId}" saved. Opta sync isn't wired up yet, so nothing has been imported.`)
  }

  function handleCompOrgSelect(competition) {
    setShowCompOrgModal(false)
    setForm({ ...EMPTY_FORM, eventType: 'sport', competitionId: competition.id })
    setErrors({})
    setSuccessMsg(`${competition.name} (${competition.governingBody}) selected. Fill in the event details below to import from ${competition.name}.`)
  }

  return (
    <div className="import-page">
    <div className="import-view">
      <form className="import-card" onSubmit={handleSubmit}>
        <h2>Import Event</h2>
        <p className="import-hint">Fill in the details below to add a new event to the calendar.</p>

        <div className="ep-view-toggle">
          <button
            type="button"
            className={`ep-view-btn${form.eventType === 'sport' ? ' ep-view-btn--active' : ''}`}
            onClick={() => handleEventTypeChange('sport')}
          >Sport Event</button>
          <button
            type="button"
            className={`ep-view-btn${form.eventType === 'programme' ? ' ep-view-btn--active' : ''}`}
            onClick={() => handleEventTypeChange('programme')}
          >Programme Event</button>
        </div>

        {successMsg && <div className="import-success">{successMsg}</div>}

        {form.eventType === 'sport' ? (
        <>
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
        </>
        ) : (
        <>
        <div className="import-grid">
          <div className={`import-field${errors.programmeTitle ? ' import-field--error' : ''}`}>
            <label htmlFor="imp-prog-title">Programme Title</label>
            <input
              id="imp-prog-title"
              type="text"
              value={form.programmeTitle}
              onChange={e => setField('programmeTitle', e.target.value)}
            />
            {errors.programmeTitle && <span className="import-field-error-msg">{errors.programmeTitle}</span>}
          </div>

          <div className={`import-field${errors.departmentId ? ' import-field--error' : ''}`}>
            <label htmlFor="imp-department">Department</label>
            <select
              id="imp-department"
              value={form.departmentId}
              onChange={e => setField('departmentId', e.target.value)}
            >
              <option value="">— select department —</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
              <option value={NEW_DEPARTMENT}>+ Add new department…</option>
            </select>
            {errors.departmentId && <span className="import-field-error-msg">{errors.departmentId}</span>}
          </div>

          {isNewDepartment && (
            <div className={`import-field${errors.newDepartmentName ? ' import-field--error' : ''}`}>
              <label htmlFor="imp-new-dept-name">New Department Name</label>
              <input
                id="imp-new-dept-name"
                type="text"
                value={form.newDepartmentName}
                onChange={e => setField('newDepartmentName', e.target.value)}
              />
              {errors.newDepartmentName && <span className="import-field-error-msg">{errors.newDepartmentName}</span>}
            </div>
          )}

          <div className={`import-field${errors.startDate ? ' import-field--error' : ''}`}>
            <label htmlFor="imp-prog-start-date">Start Date</label>
            <input
              id="imp-prog-start-date"
              type="date"
              value={form.startDate}
              onChange={e => setField('startDate', e.target.value)}
            />
            {errors.startDate && <span className="import-field-error-msg">{errors.startDate}</span>}
          </div>

          <div className={`import-field${errors.startTime ? ' import-field--error' : ''}`}>
            <label htmlFor="imp-prog-start-time">Start Time</label>
            <input
              id="imp-prog-start-time"
              type="time"
              value={form.startTime}
              onChange={e => setField('startTime', e.target.value)}
            />
            {errors.startTime && <span className="import-field-error-msg">{errors.startTime}</span>}
          </div>
        </div>

        <div className="import-section-title">Repeat</div>
        <div className="ba-radio-row">
          {[
            { key: 'none',   label: 'Does not repeat' },
            { key: 'daily',  label: 'Daily' },
            { key: 'weekly', label: 'Weekly' },
            { key: 'custom', label: 'Custom interval' },
          ].map(opt => (
            <label key={opt.key} className="ba-radio-option">
              <input type="radio" name="imp-prog-repeat" checked={form.repeat === opt.key} onChange={() => setField('repeat', opt.key)} />
              {opt.label}
            </label>
          ))}
        </div>

        {form.repeat === 'custom' && (
          <div className="import-field ba-inline-field">
            <label htmlFor="imp-prog-interval">Every</label>
            <input
              id="imp-prog-interval"
              type="number"
              min="1"
              max="365"
              value={form.repeatCustomDays}
              onChange={e => setField('repeatCustomDays', Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
            <span>day(s)</span>
          </div>
        )}

        {form.repeat !== 'none' && (
          <>
            <div className="import-section-title">Ends</div>
            <div className="ba-radio-row">
              <label className="ba-radio-option">
                <input type="radio" name="imp-prog-endtype" checked={form.repeatEndType === 'occurrences'} onChange={() => setField('repeatEndType', 'occurrences')} />
                After
                <input
                  type="number"
                  min="1"
                  max="366"
                  className="ba-inline-number"
                  disabled={form.repeatEndType !== 'occurrences'}
                  value={form.repeatOccurrences}
                  onChange={e => setField('repeatOccurrences', Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
                occasion(s)
              </label>
              <label className="ba-radio-option">
                <input type="radio" name="imp-prog-endtype" checked={form.repeatEndType === 'date'} onChange={() => setField('repeatEndType', 'date')} />
                Until
                <input
                  type="date"
                  className="ba-inline-date"
                  disabled={form.repeatEndType !== 'date'}
                  value={form.repeatEndDate}
                  onChange={e => setField('repeatEndDate', e.target.value)}
                />
              </label>
            </div>
            {errors.repeatEndDate && <span className="import-field-error-msg">{errors.repeatEndDate}</span>}
          </>
        )}

        <div className="import-section-title">Production <span className="import-section-hint">(optional)</span></div>
        <div className="import-grid">
          <div className="import-field">
            <label htmlFor="imp-prog-pattern">Production Type</label>
            <select
              id="imp-prog-pattern"
              value={form.patternId}
              onChange={e => handlePatternChange(e.target.value)}
            >
              <option value="">— none —</option>
              {patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="import-field-hint">Defaults to Studio Show; selecting a type pre-fills the technical resources below.</span>
          </div>
          <StaffField label="Director"          value={form.director}          options={staff.director}                onChange={v => setField('director', v)} />
          <StaffField label="Production Manager" value={form.productionManager} options={staff.onsiteProductionManager} onChange={v => setField('productionManager', v)} />
          <StaffField label="Producer"          value={form.producer}          options={staff.producer}                onChange={v => setField('producer', v)} />
        </div>

        <div className="import-section-title">Technical Resources <span className="import-section-hint">(optional)</span></div>
        <div className="import-grid">
          <TechField label="Cameramen"          value={form.techCameramen}          onChange={v => setField('techCameramen', v)} />
          <TechField label="EVS Operators"      value={form.techEvsOperator}        onChange={v => setField('techEvsOperator', v)} />
          <TechField label="Studio Sound"       value={form.techAudioOnLocation}    onChange={v => setField('techAudioOnLocation', v)} />
          <TechField label="Video Lines In"     value={form.techIncomingVideoLines} onChange={v => setField('techIncomingVideoLines', v)} />
          <TechField label="Video Lines Out"    value={form.techOutgoingVideoLines} onChange={v => setField('techOutgoingVideoLines', v)} />
          <TechField label="Audio Lines In"     value={form.techIncomingAudioLines} onChange={v => setField('techIncomingAudioLines', v)} />
          <TechField label="Audio Lines Out"    value={form.techOutgoingAudioLines} onChange={v => setField('techOutgoingAudioLines', v)} />
          <TechField label="Talkback In"        value={form.techIncomingTalkbackLines} onChange={v => setField('techIncomingTalkbackLines', v)} />
          <TechField label="Talkback Out"       value={form.techOutgoingTalkbackLines} onChange={v => setField('techOutgoingTalkbackLines', v)} />
          <TechToggle label="Studio"            checked={form.techStudio}          onChange={v => setField('techStudio', v)} />
          <TechToggle label="Passthrough"       checked={form.techPassthrough}     onChange={v => setField('techPassthrough', v)} />
        </div>

        <div className="import-section-title">Costs <span className="import-section-hint">(optional)</span></div>
        <div className="import-grid">
          <div className="import-field">
            <label htmlFor="imp-studio-cost">Fixed Studio Cost (£)</label>
            <input
              id="imp-studio-cost"
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
        </>
        )}

        <div className="import-actions">
          <button
            type="submit"
            className="import-save-btn"
            disabled={!canCreate}
            title={!canCreate ? "Your role doesn't have permission to create events" : undefined}
          >
            Save
          </button>
        </div>
      </form>
    </div>

      <div className="import-bottom-bar">
        <button
          className="import-excel-btn import-opta-btn"
          disabled={!canCreate}
          title={!canCreate ? "Your role doesn't have permission to create events" : undefined}
          onClick={() => setShowOptaModal(true)}
        >
          Import from Opta
        </button>
        <button
          className="import-excel-btn"
          disabled={!canCreate}
          title={!canCreate ? "Your role doesn't have permission to create events" : undefined}
          onClick={() => setShowExcelModal(true)}
        >
          Import from Excel
        </button>
        <button
          className="import-excel-btn import-comporg-btn"
          disabled={!canCreate}
          title={!canCreate ? "Your role doesn't have permission to create events" : undefined}
          onClick={() => setShowCompOrgModal(true)}
        >
          Import from Competition Organiser
        </button>
      </div>

      {showExcelModal && (
        <ImportExcelModal
          onAccept={handleExcelAccept}
          onClose={() => setShowExcelModal(false)}
        />
      )}

      {showOptaModal && (
        <ImportOptaModal
          onConnect={handleOptaConnect}
          onClose={() => setShowOptaModal(false)}
        />
      )}

      {showCompOrgModal && (
        <ImportCompetitionOrganiserModal
          competitions={competitions}
          onSelect={handleCompOrgSelect}
          onClose={() => setShowCompOrgModal(false)}
        />
      )}
    </div>
  )
}

export default ImportEventsView
