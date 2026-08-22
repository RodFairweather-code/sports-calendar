import { Fragment, useState } from 'react'
import { addHours, bookingDuration } from '../services/bookingTime'

const WINDOW_DAYS = 14

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function dayHeader(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return {
    weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
    dayMonth: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  }
}

function buildRows(assets) {
  const rows = []
  for (const a of assets) {
    for (let u = 1; u <= a.quantity; u++) {
      rows.push({ key: `${a.id}|${u}`, assetId: a.id, assetName: a.name, unit: u })
    }
  }
  return rows
}

function buildBookingMap(bookings) {
  const map = {}
  for (const b of bookings) {
    const key = `${b.assetId}|${b.unit}|${b.date}`
    if (!map[key]) map[key] = []
    map[key].push(b)
  }
  return map
}

function AssetTimelineView({ assets, bookings, onOpenBooking, onEditBooking, onDayClick }) {
  const [startDate, setStartDate] = useState(todayStr)

  const rows = buildRows(assets)
  const bookingMap = buildBookingMap(bookings)
  const today = todayStr()
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(startDate, i))

  function handleDateChange(e) {
    if (e.target.value) setStartDate(e.target.value)
  }

  function handleChipClick(e, b) {
    e.stopPropagation()
    onEditBooking(b)
  }

  function handleRowClick(row) {
    onOpenBooking({ assetId: row.assetId, unit: String(row.unit) })
  }

  function handleCellClick(row, date) {
    onOpenBooking({ assetId: row.assetId, unit: String(row.unit), date })
  }

  if (rows.length === 0) {
    return (
      <div className="at-timeline-empty">
        <p>No bookable assets have been defined yet.</p>
        <span>Go to Admin → Bookable Assets to create asset types before viewing the timeline.</span>
      </div>
    )
  }

  return (
    <div className="at-timeline-container">
      <div className="at-timeline-toolbar">
        <button className="at-timeline-nav-btn" onClick={() => setStartDate(prev => addDays(prev, -WINDOW_DAYS))}>‹ Prev</button>
        <button className="at-timeline-nav-btn" onClick={() => setStartDate(todayStr())}>Today</button>
        <button className="at-timeline-nav-btn" onClick={() => setStartDate(prev => addDays(prev, WINDOW_DAYS))}>Next ›</button>
        <label className="at-timeline-goto-label" htmlFor="at-timeline-goto">Go to date</label>
        <input
          id="at-timeline-goto"
          type="date"
          className="at-timeline-goto-input"
          value={startDate}
          onChange={handleDateChange}
        />
      </div>

      <div className="at-timeline-scroll">
        <div className="at-timeline-grid" style={{ gridTemplateColumns: `160px repeat(${WINDOW_DAYS}, 1fr)` }}>
          <div className="at-tl-corner" />
          {days.map(date => {
            const { weekday, dayMonth } = dayHeader(date)
            return (
              <div
                key={date}
                className={`at-tl-daycol-header at-tl-daycol-header--clickable${date === today ? ' at-tl-today' : ''}`}
                title={`Show all bookings for ${date}`}
                onClick={() => onDayClick(date)}
              >
                <span className="at-tl-weekday">{weekday}</span>
                <span className="at-tl-daymonth">{dayMonth}</span>
              </div>
            )
          })}

          {rows.map(row => (
            <Fragment key={row.key}>
              <div
                className="at-tl-row-label at-tl-row-label--clickable"
                title={`Book ${row.assetName} ${row.unit}`}
                onClick={() => handleRowClick(row)}
              >
                {row.assetName} {row.unit}
              </div>
              {days.map(date => {
                const cellBookings = bookingMap[`${row.assetId}|${row.unit}|${date}`] || []
                return (
                  <div
                    key={`${row.key}-${date}`}
                    className={`at-tl-cell${date === today ? ' at-tl-today' : ''}`}
                    title={`Book ${row.assetName} ${row.unit} on ${date}`}
                    onClick={() => handleCellClick(row, date)}
                  >
                    {cellBookings
                      .slice()
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map(b => {
                        const end = addHours(b.time, bookingDuration(b, assets))
                        const range = `${b.time}–${end.time}${end.dayOffset > 0 ? ` (+${end.dayOffset}d)` : ''}`
                        return (
                          <div
                            key={b.id}
                            className="at-tl-chip"
                            title={[
                              range,
                              b.bookedBy && `Booked by ${b.bookedBy}`,
                              b.production && `Production: ${b.production}`,
                              b.contractNumber && `Contract: ${b.contractNumber}`,
                              b.programme && `Programme: ${b.programme}`,
                              b.notes,
                            ].filter(Boolean).join(' · ')}
                            onClick={e => handleChipClick(e, b)}
                          >
                            {range}
                          </div>
                        )
                      })}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AssetTimelineView
