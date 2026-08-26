import { useState } from 'react'
import { saveToStorage } from '../services/storage'
import {
  addHours, combinedDuration, DEFAULT_DURATION, bookingDuration,
  findConflicts, formatTimeOfDay, formatDateLabel, formatRange,
} from '../services/bookingTime'
import AssetTimelineView from './AssetTimelineView'
import DayDetailView from './DayDetailView'
import { hasPermission } from '../services/roles'

function describeBooking(b) {
  const parts = []
  if (b.bookedBy) parts.push(`booked by ${b.bookedBy}`)
  if (b.production) parts.push(`production ${b.production}`)
  if (b.programme) parts.push(`programme ${b.programme}`)
  return parts.length ? parts.join(', ') : 'already booked (no name recorded)'
}

function buildConflictDetails(rawConflicts, assets) {
  return rawConflicts.map(({ date, booking, overlapStart, overlapEnd }) => ({
    date,
    assetName: booking.assetName,
    unit: booking.unit,
    existingRange: formatRange(booking.time, bookingDuration(booking, assets)),
    overlapRange: `${formatTimeOfDay(overlapStart)}–${formatTimeOfDay(overlapEnd)}`,
    detail: describeBooking(booking),
  }))
}

function ConflictWarning({ conflicts }) {
  if (conflicts.length === 0) return null
  const shown = conflicts.slice(0, 5)
  const extra = conflicts.length - shown.length

  return (
    <div className="ba-conflict-warning">
      <p className="ba-conflict-title">
        Not available — this clashes with {conflicts.length === 1 ? 'an existing booking' : `${conflicts.length} existing bookings`}:
      </p>
      <ul>
        {shown.map((c, i) => (
          <li key={i}>
            {formatDateLabel(c.date)} — {c.assetName} {c.unit} is {c.detail}, {c.existingRange}. Clashing hours: {c.overlapRange}.
          </li>
        ))}
      </ul>
      {extra > 0 && <p className="ba-conflict-more">+{extra} more conflicting occurrence{extra > 1 ? 's' : ''}</p>}
    </div>
  )
}

function loadAssets() {
  try { return JSON.parse(localStorage.getItem('bookable_assets') || '[]') }
  catch { return [] }
}

function loadBookings() {
  try { return JSON.parse(localStorage.getItem('asset_bookings') || '[]') }
  catch { return [] }
}

function persistBookings(bookings) {
  saveToStorage('asset_bookings', bookings)
  window.dispatchEvent(new CustomEvent('asset-bookings-updated'))
}

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const MAX_OCCURRENCES = 366

// Expands a booking form into one or more dated occurrences based on the
// chosen repeat rule. Returns [] if the rule produces nothing bookable.
function buildOccurrenceDates(form) {
  if (form.repeat === 'none') return [form.date]

  const step = form.repeat === 'daily' ? 1
    : form.repeat === 'weekly' ? 7
    : Math.max(1, parseInt(form.customDays, 10) || 1)

  const dates = []
  let current = form.date

  if (form.endType === 'occurrences') {
    const count = Math.max(1, parseInt(form.occurrences, 10) || 1)
    for (let i = 0; i < count && i < MAX_OCCURRENCES; i++) {
      dates.push(current)
      current = addDays(current, step)
    }
  } else {
    let i = 0
    while (current <= form.endDate && i < MAX_OCCURRENCES) {
      dates.push(current)
      current = addDays(current, step)
      i++
    }
  }

  return dates
}

const EMPTY_FORM = {
  assetId: '',
  unit: '',
  date: '',
  time: '09:00',
  duration: DEFAULT_DURATION,
  repeat: 'none',
  customDays: 7,
  endType: 'occurrences',
  endDate: '',
  occurrences: 4,
  bookedBy: '',
  notes: '',
  production: '',
  contractNumber: '',
  programme: '',
}

function ProductionFields({ idPrefix, production, contractNumber, programme, onChange }) {
  return (
    <>
      <div className="import-field">
        <label htmlFor={`${idPrefix}-production`}>Production</label>
        <input id={`${idPrefix}-production`} type="text" placeholder="Optional" value={production} onChange={e => onChange('production', e.target.value)} />
      </div>

      <div className="import-field">
        <label htmlFor={`${idPrefix}-contract`}>Contract number</label>
        <input id={`${idPrefix}-contract`} type="text" placeholder="Optional" value={contractNumber} onChange={e => onChange('contractNumber', e.target.value)} />
      </div>

      <div className="import-field">
        <label htmlFor={`${idPrefix}-programme`}>Programme</label>
        <input id={`${idPrefix}-programme`} type="text" placeholder="Optional" value={programme} onChange={e => onChange('programme', e.target.value)} />
      </div>
    </>
  )
}

function DurationEndTimeFields({ idPrefix, date, time, duration, onDurationChange, onEndChange }) {
  const end = time ? addHours(time, duration) : null
  const endDate = date ? addDays(date, end ? end.dayOffset : 0) : ''

  function handleEndDateChange(newEndDate) {
    if (!newEndDate || (date && newEndDate < date)) return
    onEndChange(newEndDate, end ? end.time : time)
  }

  return (
    <>
      <div className="import-field">
        <label htmlFor={`${idPrefix}-duration`}>Duration (hours)</label>
        <input
          id={`${idPrefix}-duration`}
          type="number"
          min="0.5"
          step="0.5"
          value={duration}
          onChange={e => onDurationChange(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
        />
      </div>

      <div className="import-field">
        <label htmlFor={`${idPrefix}-enddate`}>End date</label>
        <input
          id={`${idPrefix}-enddate`}
          type="date"
          min={date || undefined}
          disabled={!date}
          value={endDate}
          onChange={e => handleEndDateChange(e.target.value)}
        />
        <span className="import-field-hint">Needed for more than one day? Push this forward.</span>
      </div>

      <div className="import-field">
        <label htmlFor={`${idPrefix}-endtime`}>End time</label>
        <input
          id={`${idPrefix}-endtime`}
          type="time"
          disabled={!time}
          value={end ? end.time : ''}
          onChange={e => onEndChange(endDate, e.target.value)}
        />
      </div>
    </>
  )
}

function BookingForm({ assets, bookings, initial, onCreate, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = { ...EMPTY_FORM, ...initial }
    const initialAsset = assets.find(a => a.id === base.assetId)
    return { ...base, duration: initialAsset?.duration ?? base.duration }
  })

  const asset = assets.find(a => a.id === form.assetId)
  const units = asset ? Array.from({ length: asset.quantity }, (_, i) => i + 1) : []

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleAssetChange(assetId) {
    const found = assets.find(a => a.id === assetId)
    setForm(prev => ({ ...prev, assetId, unit: '', duration: found?.duration ?? DEFAULT_DURATION }))
  }

  function handleEndChange(newEndDate, newEndTime) {
    if (!form.date || !form.time || !newEndDate || !newEndTime) return
    setField('duration', combinedDuration(form.date, form.time, newEndDate, newEndTime))
  }

  const datesValid = form.repeat === 'none' || form.endType === 'occurrences' || form.endDate >= form.date
  const occurrenceDates = (form.assetId && form.unit && form.date && form.time && datesValid)
    ? buildOccurrenceDates(form) : []
  const conflicts = buildConflictDetails(
    occurrenceDates.flatMap(date => findConflicts(
      { assetId: form.assetId, unit: form.unit, date, time: form.time, duration: form.duration },
      bookings, assets,
    ).map(c => ({ date, ...c }))),
    assets,
  )

  const canSubmit = form.assetId && form.unit && form.date && form.time && datesValid && conflicts.length === 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onCreate(form, asset)
  }

  return (
    <div className="ba-modal-backdrop">
      <div className="ba-modal-dialog ba-booking-dialog">
        <h3>Book an Asset</h3>
        <form onSubmit={handleSubmit}>
          <div className="import-grid">
            <div className="import-field">
              <label htmlFor="bk-asset">Asset</label>
              <select id="bk-asset" value={form.assetId} onChange={e => handleAssetChange(e.target.value)}>
                <option value="">— select —</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="import-field">
              <label htmlFor="bk-unit">Which one</label>
              <select id="bk-unit" value={form.unit} disabled={!asset} onChange={e => setField('unit', e.target.value)}>
                <option value="">— select —</option>
                {units.map(u => <option key={u} value={u}>{asset.name} {u}</option>)}
              </select>
            </div>

            <div className="import-field">
              <label htmlFor="bk-date">Date</label>
              <input id="bk-date" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
            </div>

            <div className="import-field">
              <label htmlFor="bk-time">Start time</label>
              <input id="bk-time" type="time" value={form.time} onChange={e => setField('time', e.target.value)} />
            </div>

            <DurationEndTimeFields
              idPrefix="bk"
              date={form.date}
              time={form.time}
              duration={form.duration}
              onDurationChange={v => setField('duration', v)}
              onEndChange={handleEndChange}
            />

            <div className="import-field">
              <label htmlFor="bk-by">Booked by</label>
              <input id="bk-by" type="text" placeholder="Name (optional)" value={form.bookedBy} onChange={e => setField('bookedBy', e.target.value)} />
            </div>

            <div className="import-field">
              <label htmlFor="bk-notes">Notes</label>
              <input id="bk-notes" type="text" placeholder="Optional" value={form.notes} onChange={e => setField('notes', e.target.value)} />
            </div>

            <ProductionFields
              idPrefix="bk"
              production={form.production}
              contractNumber={form.contractNumber}
              programme={form.programme}
              onChange={setField}
            />
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
                <input type="radio" name="bk-repeat" checked={form.repeat === opt.key} onChange={() => setField('repeat', opt.key)} />
                {opt.label}
              </label>
            ))}
          </div>

          {form.repeat === 'custom' && (
            <div className="import-field ba-inline-field">
              <label htmlFor="bk-interval">Every</label>
              <input
                id="bk-interval"
                type="number"
                min="1"
                max="365"
                value={form.customDays}
                onChange={e => setField('customDays', Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <span>day(s)</span>
            </div>
          )}

          {form.repeat !== 'none' && (
            <>
              <div className="import-section-title">Ends</div>
              <div className="ba-radio-row">
                <label className="ba-radio-option">
                  <input type="radio" name="bk-endtype" checked={form.endType === 'occurrences'} onChange={() => setField('endType', 'occurrences')} />
                  After
                  <input
                    type="number"
                    min="1"
                    max="366"
                    className="ba-inline-number"
                    disabled={form.endType !== 'occurrences'}
                    value={form.occurrences}
                    onChange={e => setField('occurrences', Math.max(1, parseInt(e.target.value, 10) || 1))}
                  />
                  occasion(s)
                </label>
                <label className="ba-radio-option">
                  <input type="radio" name="bk-endtype" checked={form.endType === 'date'} onChange={() => setField('endType', 'date')} />
                  Until
                  <input
                    type="date"
                    className="ba-inline-date"
                    disabled={form.endType !== 'date'}
                    value={form.endDate}
                    onChange={e => setField('endDate', e.target.value)}
                  />
                </label>
              </div>
            </>
          )}

          <ConflictWarning conflicts={conflicts} />

          <div className="ba-modal-actions">
            <button type="button" className="unsaved-btn unsaved-btn--cancel" onClick={onCancel}>Cancel</button>
            <button type="submit" className="unsaved-btn unsaved-btn--save" disabled={!canSubmit}>Book</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditBookingForm({ booking, assets, bookings, onSave, onDelete, onDeleteSeries, onCancel, canUpdate, canDelete }) {
  const [form, setForm] = useState(() => ({
    assetId: booking.assetId,
    unit: booking.unit,
    date: booking.date,
    time: booking.time,
    duration: bookingDuration(booking, assets),
    bookedBy: booking.bookedBy || '',
    notes: booking.notes || '',
    production: booking.production || '',
    contractNumber: booking.contractNumber || '',
    programme: booking.programme || '',
  }))
  const [applyToSeries, setApplyToSeries] = useState(false)

  const asset = assets.find(a => a.id === form.assetId)
  const units = asset ? Array.from({ length: asset.quantity }, (_, i) => i + 1) : []

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleAssetChange(assetId) {
    const found = assets.find(a => a.id === assetId)
    setForm(prev => ({ ...prev, assetId, unit: '', duration: found?.duration ?? DEFAULT_DURATION }))
  }

  function handleEndChange(newEndDate, newEndTime) {
    if (!form.date || !form.time || !newEndDate || !newEndTime) return
    setField('duration', combinedDuration(form.date, form.time, newEndDate, newEndTime))
  }

  const seriesBookings = booking.seriesId ? bookings.filter(b => b.seriesId === booking.seriesId) : [booking]
  const excludeIds = new Set(applyToSeries ? seriesBookings.map(b => b.id) : [booking.id])
  const candidateDates = applyToSeries ? seriesBookings.map(b => b.date) : [form.date]

  const conflicts = buildConflictDetails(
    (form.assetId && form.unit && form.time)
      ? candidateDates.flatMap(date => findConflicts(
          { assetId: form.assetId, unit: form.unit, date, time: form.time, duration: form.duration },
          bookings, assets, excludeIds,
        ).map(c => ({ date, ...c })))
      : [],
    assets,
  )

  const canSubmit = canUpdate && form.assetId && form.unit && form.date && form.time && conflicts.length === 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSave(booking.id, form, asset, applyToSeries)
  }

  function handleDelete() {
    if (!canDelete) return
    if (!window.confirm(`Delete this booking of ${booking.assetName} ${booking.unit} on ${booking.date} at ${booking.time}?`)) return
    onDelete(booking.id)
  }

  function handleDeleteSeries() {
    if (!canDelete) return
    if (!window.confirm('Delete every occurrence in this recurring series? This cannot be undone.')) return
    onDeleteSeries(booking.seriesId)
  }

  return (
    <div className="ba-modal-backdrop">
      <div className="ba-modal-dialog ba-booking-dialog">
        <h3>Edit Booking</h3>
        <form onSubmit={handleSubmit}>
          <div className="import-grid">
            <div className="import-field">
              <label htmlFor="ebk-asset">Asset</label>
              <select id="ebk-asset" value={form.assetId} onChange={e => handleAssetChange(e.target.value)}>
                <option value="">— select —</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="import-field">
              <label htmlFor="ebk-unit">Which one</label>
              <select id="ebk-unit" value={form.unit} disabled={!asset} onChange={e => setField('unit', e.target.value)}>
                <option value="">— select —</option>
                {units.map(u => <option key={u} value={u}>{asset.name} {u}</option>)}
              </select>
            </div>

            <div className="import-field">
              <label htmlFor="ebk-date">Date</label>
              <input
                id="ebk-date"
                type="date"
                disabled={applyToSeries}
                value={form.date}
                onChange={e => setField('date', e.target.value)}
              />
              {applyToSeries && <span className="import-field-hint">Each occurrence keeps its own date</span>}
            </div>

            <div className="import-field">
              <label htmlFor="ebk-time">Start time</label>
              <input id="ebk-time" type="time" value={form.time} onChange={e => setField('time', e.target.value)} />
            </div>

            <DurationEndTimeFields
              idPrefix="ebk"
              date={form.date}
              time={form.time}
              duration={form.duration}
              onDurationChange={v => setField('duration', v)}
              onEndChange={handleEndChange}
            />

            <div className="import-field">
              <label htmlFor="ebk-by">Booked by</label>
              <input id="ebk-by" type="text" placeholder="Name (optional)" value={form.bookedBy} onChange={e => setField('bookedBy', e.target.value)} />
            </div>

            <div className="import-field">
              <label htmlFor="ebk-notes">Notes</label>
              <input id="ebk-notes" type="text" placeholder="Optional" value={form.notes} onChange={e => setField('notes', e.target.value)} />
            </div>

            <ProductionFields
              idPrefix="ebk"
              production={form.production}
              contractNumber={form.contractNumber}
              programme={form.programme}
              onChange={setField}
            />
          </div>

          {booking.seriesId && (
            <div className="ba-edit-series-note">
              <p>This booking is part of a recurring series.</p>
              <label className="ba-apply-series-option">
                <input
                  type="checkbox"
                  checked={applyToSeries}
                  onChange={e => setApplyToSeries(e.target.checked)}
                />
                Apply these changes to every occurrence in the series
              </label>
            </div>
          )}

          <ConflictWarning conflicts={conflicts} />

          <div className="ba-modal-actions ba-modal-actions--split">
            <div className="ba-modal-actions-left">
              <button
                type="button"
                className="ba-delete-btn"
                disabled={!canDelete}
                title={!canDelete ? "Your role doesn't have permission to delete bookings" : undefined}
                onClick={handleDelete}
              >
                Delete booking
              </button>
              {booking.seriesId && (
                <button
                  type="button"
                  className="ba-cancel-series-btn"
                  disabled={!canDelete}
                  title={!canDelete ? "Your role doesn't have permission to delete bookings" : undefined}
                  onClick={handleDeleteSeries}
                >
                  Delete series
                </button>
              )}
            </div>
            <div className="ba-modal-actions-right">
              <button type="button" className="unsaved-btn unsaved-btn--cancel" onClick={onCancel}>Cancel</button>
              <button
                type="submit"
                className="unsaved-btn unsaved-btn--save"
                disabled={!canSubmit}
                title={!canUpdate ? "Your role doesn't have permission to edit bookings" : undefined}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function BookAssetsView({ eventContext, onDone, role }) {
  const canCreate = hasPermission(role, 'technicalAssets', 'create')
  const canUpdate = hasPermission(role, 'technicalAssets', 'update')
  const canDelete = hasPermission(role, 'technicalAssets', 'delete')
  const [assets] = useState(loadAssets)
  const [bookings, setBookings] = useState(loadBookings)
  const [showForm, setShowForm] = useState(false)
  const [formPrefill, setFormPrefill] = useState(null)
  const [editingBooking, setEditingBooking] = useState(null)
  const [mode, setMode] = useState('timeline')
  const [dayViewDate, setDayViewDate] = useState(null)

  function openBookingForm(prefill) {
    if (!canCreate) return
    setFormPrefill(prefill || null)
    setShowForm(true)
  }

  function handleBookThisDay(date) {
    openBookingForm({ date })
  }

  function handleCreate(form, asset) {
    const dates = buildOccurrenceDates(form)
    if (dates.length === 0) return

    const seriesId = dates.length > 1 ? newId('series') : null
    const created = dates.map(date => ({
      id: newId('booking'),
      seriesId,
      assetId: asset.id,
      assetName: asset.name,
      unit: form.unit,
      date,
      time: form.time,
      duration: form.duration,
      bookedBy: form.bookedBy.trim(),
      notes: form.notes.trim(),
      production: form.production.trim(),
      contractNumber: form.contractNumber.trim(),
      programme: form.programme.trim(),
      eventId: eventContext?.id ?? null,
    }))

    const updated = [...bookings, ...created]
    setBookings(updated)
    persistBookings(updated)
    setShowForm(false)
  }

  function handleDelete(id) {
    if (!canDelete) return
    const updated = bookings.filter(b => b.id !== id)
    setBookings(updated)
    persistBookings(updated)
  }

  function handleDeleteSeries(seriesId) {
    if (!canDelete) return
    const updated = bookings.filter(b => b.seriesId !== seriesId)
    setBookings(updated)
    persistBookings(updated)
  }

  function handleUpdateBooking(id, form, asset, applyToSeries) {
    if (!canUpdate) return
    const original = bookings.find(b => b.id === id)
    const seriesId = original?.seriesId

    const sharedFields = {
      assetId: form.assetId,
      assetName: asset.name,
      unit: form.unit,
      time: form.time,
      duration: form.duration,
      bookedBy: form.bookedBy.trim(),
      notes: form.notes.trim(),
      production: form.production.trim(),
      contractNumber: form.contractNumber.trim(),
      programme: form.programme.trim(),
    }

    const updated = bookings.map(b => {
      if (applyToSeries && seriesId && b.seriesId === seriesId) return { ...b, ...sharedFields }
      if (b.id === id) return { ...b, ...sharedFields, date: form.date }
      return b
    })
    setBookings(updated)
    persistBookings(updated)
    setEditingBooking(null)
  }

  function handleDeleteFromEdit(id) {
    handleDelete(id)
    setEditingBooking(null)
  }

  function handleDeleteSeriesFromEdit(seriesId) {
    handleDeleteSeries(seriesId)
    setEditingBooking(null)
  }

  const sorted = [...bookings].sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time)
  )

  return (
    <div className="ba-container">
      {eventContext && (
        <div className="ba-event-context-banner">
          <span>
            Booking assets for <strong>{eventContext.title}</strong>
            {eventContext.start && ` · ${eventContext.start.slice(0, 10)}`}
          </span>
          <button onClick={onDone}>Done — back to event</button>
        </div>
      )}
      {dayViewDate ? (
        <DayDetailView
          date={dayViewDate}
          bookings={bookings}
          assets={assets}
          onEditBooking={setEditingBooking}
          onBookThisDay={handleBookThisDay}
          onBack={() => setDayViewDate(null)}
        />
      ) : (
        <>
          <div className="ba-toolbar">
            <div className="ba-mode-toggle">
              <button className={`ba-mode-btn${mode === 'list' ? ' active' : ''}`} onClick={() => setMode('list')}>List</button>
              <button className={`ba-mode-btn${mode === 'timeline' ? ' active' : ''}`} onClick={() => setMode('timeline')}>Timeline</button>
            </div>
            <div className="ed-toolbar-right">
              <button
                className="ba-create-btn"
                disabled={assets.length === 0 || !canCreate}
                title={
                  !canCreate ? "Your role doesn't have permission to book assets"
                    : assets.length === 0 ? 'No bookable assets exist yet — add some in Admin → Bookable Assets'
                    : ''
                }
                onClick={() => openBookingForm(null)}
              >
                + Book Asset
              </button>
            </div>
          </div>

          {mode === 'timeline' ? (
            <AssetTimelineView
              assets={assets}
              bookings={bookings}
              onOpenBooking={openBookingForm}
              onEditBooking={setEditingBooking}
              onDayClick={setDayViewDate}
            />
          ) : (
            <div className="ba-view">
              {assets.length === 0 ? (
                <div className="ba-empty">
                  <p>No bookable assets have been defined yet.</p>
                  <span>Go to Admin → Bookable Assets to create asset types (e.g. "Edit Suites") before booking them out.</span>
                </div>
              ) : sorted.length === 0 ? (
                <div className="ba-empty">
                  <p>No bookings yet.</p>
                  <span>Click <strong>+ Book Asset</strong> to reserve a date and time.</span>
                </div>
              ) : (
                <div className="ba-booking-list">
                  {sorted.map(b => (
                    <div key={b.id} className="ba-booking-row ba-booking-row--clickable" onClick={() => setEditingBooking(b)}>
                      <div className="ba-booking-main">
                        <span className="ba-booking-asset">{b.assetName} {b.unit}</span>
                        <span className="ba-booking-when">{formatDateLabel(b.date)} · {formatRange(b.time, bookingDuration(b, assets))}</span>
                        {b.bookedBy && <span className="ba-booking-by">Booked by {b.bookedBy}</span>}
                        {b.production && <span className="ba-booking-notes">Production: {b.production}</span>}
                        {b.contractNumber && <span className="ba-booking-notes">Contract: {b.contractNumber}</span>}
                        {b.programme && <span className="ba-booking-notes">Programme: {b.programme}</span>}
                        {b.notes && <span className="ba-booking-notes">{b.notes}</span>}
                        {b.seriesId && <span className="ba-booking-tag">Recurring</span>}
                      </div>
                      <div className="ba-booking-actions">
                        <button
                          className="ba-booking-del"
                          disabled={!canDelete}
                          title={canDelete ? 'Delete this booking' : "Your role doesn't have permission to delete bookings"}
                          onClick={e => { e.stopPropagation(); handleDelete(b.id) }}
                        >✕</button>
                        {b.seriesId && (
                          <button
                            className="ba-cancel-series-btn"
                            disabled={!canDelete}
                            title={!canDelete ? "Your role doesn't have permission to delete bookings" : undefined}
                            onClick={e => { e.stopPropagation(); handleDeleteSeries(b.seriesId) }}
                          >
                            Cancel series
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showForm && (
        <BookingForm
          assets={assets}
          bookings={bookings}
          initial={formPrefill}
          onCreate={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingBooking && (
        <EditBookingForm
          booking={editingBooking}
          assets={assets}
          bookings={bookings}
          onSave={handleUpdateBooking}
          onDelete={handleDeleteFromEdit}
          onDeleteSeries={handleDeleteSeriesFromEdit}
          onCancel={() => setEditingBooking(null)}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      )}
    </div>
  )
}

export default BookAssetsView
