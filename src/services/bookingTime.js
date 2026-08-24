// Shared HH:MM time arithmetic for asset bookings (start time + duration → end time).

export const DEFAULT_DURATION = 8

// Older bookings predate the duration field, and an asset's duration can
// change after a booking was made — fall back through both before using
// the app-wide default.
export function bookingDuration(booking, assets) {
  if (booking.duration) return booking.duration
  const asset = assets.find(a => a.id === booking.assetId)
  return asset?.duration ?? DEFAULT_DURATION
}

export function formatDateLabel(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function addHours(time, hours) {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + Math.round(hours * 60)
  const dayOffset = Math.floor(totalMinutes / 1440)
  const normMinutes = ((totalMinutes % 1440) + 1440) % 1440
  const hh = String(Math.floor(normMinutes / 60)).padStart(2, '0')
  const mm = String(normMinutes % 60).padStart(2, '0')
  return { time: `${hh}:${mm}`, dayOffset }
}

export function formatRange(startTime, duration) {
  const end = addHours(startTime, duration)
  const dayTag = end.dayOffset > 0 ? ` (+${end.dayOffset}d)` : ''
  return `${startTime}–${end.time}${dayTag}`
}

// Hours between a start date+time and an end date+time — supports spans of
// any length, so a booking can run across several days, not just within 24h.
export function combinedDuration(startDate, startTime, endDate, endTime) {
  const start = new Date(`${startDate}T${startTime}:00`).getTime()
  const end = new Date(`${endDate}T${endTime}:00`).getTime()
  return Math.max(0.5, (end - start) / 3600000)
}

// Every calendar date (local) that a booking's interval touches, so
// multi-day bookings can be shown on each day they occupy, not just the
// start date.
export function bookingSpanDates(date, time, durationHours) {
  const { start, end } = bookingInterval(date, time, durationHours)
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const dates = []
  while (cursor.getTime() < end) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

// Real start/end instants (ms) for a booking, so overlap checks work correctly
// even when a duration carries a booking past midnight.
export function bookingInterval(date, time, durationHours) {
  const start = new Date(`${date}T${time}:00`).getTime()
  const end = start + durationHours * 3600 * 1000
  return { start, end }
}

export function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

export function formatTimeOfDay(ms) {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Finds existing bookings for the same asset+unit whose interval overlaps the
// candidate's. `excludeIds` lets callers exclude the booking(s) being edited.
export function findConflicts({ assetId, unit, date, time, duration }, bookings, assets, excludeIds = new Set()) {
  if (!assetId || !unit || !date || !time) return []
  const candidate = bookingInterval(date, time, duration)

  return bookings
    .filter(b => b.assetId === assetId && String(b.unit) === String(unit) && !excludeIds.has(b.id))
    .map(b => {
      const existing = bookingInterval(b.date, b.time, bookingDuration(b, assets))
      if (!intervalsOverlap(candidate.start, candidate.end, existing.start, existing.end)) return null
      return {
        booking: b,
        overlapStart: Math.max(candidate.start, existing.start),
        overlapEnd: Math.min(candidate.end, existing.end),
      }
    })
    .filter(Boolean)
}
