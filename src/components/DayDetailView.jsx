import { bookingDuration, bookingSpanDates, formatDateLabel, formatRange } from '../services/bookingTime'

function DayDetailView({ date, bookings, assets, onEditBooking, onBookThisDay, onBack }) {
  const dayBookings = bookings
    .filter(b => bookingSpanDates(b.date, b.time, bookingDuration(b, assets)).includes(date))
    .sort((a, b) => (a.assetName + a.unit).localeCompare(b.assetName + b.unit) || a.time.localeCompare(b.time))

  return (
    <div className="day-detail-container">
      <div className="day-detail-toolbar">
        <button className="day-detail-back-btn" onClick={onBack}>‹ Back</button>
        <span className="day-detail-title">{formatDateLabel(date)}</span>
        <div className="ed-toolbar-right">
          <button className="ba-create-btn" onClick={() => onBookThisDay(date)}>+ Book Asset</button>
        </div>
      </div>

      <div className="day-detail-body">
        {dayBookings.length === 0 ? (
          <div className="ba-empty">
            <p>No bookings on this day.</p>
            <span>Click <strong>+ Book Asset</strong> to reserve one.</span>
          </div>
        ) : (
          <div className="ba-booking-list">
            {dayBookings.map(b => (
              <div key={b.id} className="ba-booking-row ba-booking-row--clickable" onClick={() => onEditBooking(b)}>
                <div className="ba-booking-main">
                  <span className="ba-booking-asset">{b.assetName} {b.unit}</span>
                  <span className="ba-booking-when">{formatRange(b.time, bookingDuration(b, assets))}</span>
                  {b.date !== date && <span className="ba-booking-tag">Continues from {formatDateLabel(b.date)}</span>}
                  {b.bookedBy && <span className="ba-booking-by">Booked by {b.bookedBy}</span>}
                  {b.production && <span className="ba-booking-notes">Production: {b.production}</span>}
                  {b.contractNumber && <span className="ba-booking-notes">Contract: {b.contractNumber}</span>}
                  {b.programme && <span className="ba-booking-notes">Programme: {b.programme}</span>}
                  {b.notes && <span className="ba-booking-notes">{b.notes}</span>}
                  {b.seriesId && <span className="ba-booking-tag">Recurring</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DayDetailView
