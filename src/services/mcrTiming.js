import { addHours } from './bookingTime'
import { addMinutesToLocalDatetime } from './excelImport'

export function splitDateTime(value) {
  if (!value || value.length < 16) return null
  return { date: value.slice(0, 10), time: value.slice(11, 16) }
}

export function formatOffsetResult(resultDatetime, baseDate) {
  const resultDate = resultDatetime.slice(0, 10)
  const resultTime = resultDatetime.slice(11, 16)
  const dayTag = resultDate === baseDate ? '' : (resultDate > baseDate ? ' (+1d)' : ' (-1d)')
  return `${resultTime}${dayTag}`
}

// A category's real booking window: the pattern's "From start" offset
// applied to the event's start time, and "Until end" applied to its end
// time. Most events here have no recorded end time, so it falls back to
// the start time — the window then just reflects the Until offset alone.
// A pre-match show pulls the window earlier by preMatchMin (minutes); a
// post-match show pushes it later by postMatchMin — both on top of the
// pattern's own hour offsets, since the kit has to be up for the extra
// programming either side of the match itself.
export function timeWindow(event, fromOffset, untilOffset, preMatchMin = 0, postMatchMin = 0) {
  const isTimed = !!event.start && event.start.length >= 16
  if (!isTimed) return { label: '—', sortMin: -Infinity }

  const startTime = event.start.slice(11, 16)
  const endTime = (event.end && event.end.length >= 16) ? event.end.slice(11, 16) : startTime

  const from = addHours(startTime, fromOffset - (preMatchMin || 0) / 60)
  const until = addHours(endTime, untilOffset + (postMatchMin || 0) / 60)

  const tag = off => off ? ` (${off > 0 ? '+' : ''}${off}d)` : ''
  const sameInstant = from.time === until.time && from.dayOffset === until.dayOffset
  const label = sameInstant
    ? `${from.time}${tag(from.dayOffset)}`
    : `${from.time}${tag(from.dayOffset)} – ${until.time}${tag(until.dayOffset)}`

  const [fh, fm] = from.time.split(':').map(Number)
  const sortMin = from.dayOffset * 1440 + fh * 60 + fm

  return { label, sortMin }
}

// MCR control-room timings for an event, from the competition's default
// offsets (minutes):
// - Lines up  = match start − Lines-up duration − pre-match show duration.
// - Live Feed = Lines up + Lineup duration (i.e. when the lines become
//   available to production).
// - Match End = match start + the competition's default duration (minutes,
//   including half time) — not any recorded event.end, since most fixtures
//   don't have one.
// - Lines Down = Match End + Lines-down duration + post-match show duration
//   (i.e. when the lines stop being needed).
// - Lines Booking spans Lines up through Lines Down (the full booked window).
// - Available for Production spans Live Feed through Lines Down minus 5
//   minutes (the last 5 minutes of the booking are teardown, not usable).
// OB crew milestone times for an event, from the competition's default OB
// offsets (minutes). Rig-related steps count back from the Lineup time (which
// already includes any pre-match show); the rest count back from Match Start.
export function computeObCrewTimes(event, timing, preMatchMin = 0) {
  const startDT = splitDateTime(event.start)
  if (!startDT) return null

  const lineupMin = (timing?.lineup || 0) + (preMatchMin || 0)
  const lineupDT  = addMinutesToLocalDatetime(startDT.date, startDT.time, -lineupMin)
  const lineupDate = lineupDT.slice(0, 10)
  const lineupTime = lineupDT.slice(11, 16)

  const beforeLineup = mins =>
    formatOffsetResult(addMinutesToLocalDatetime(lineupDate, lineupTime, -(mins || 0)), startDT.date)
  const beforeStart = mins =>
    formatOffsetResult(addMinutesToLocalDatetime(startDT.date, startDT.time, -(mins || 0)), startDT.date)

  return {
    rigCrew:              beforeLineup(timing?.obRigCrewCall),
    productionCrewCall:   beforeStart(timing?.obStaff),
    obPoweredUp:          beforeLineup(timing?.obTruckPoweredUp),
    engineeringRigCheck:  beforeLineup(timing?.obEngineeringRigCheck),
    technicalRehearsal:   beforeStart(timing?.obTechnicalRehearsal),
    evsReplayCheck:       beforeStart(timing?.obEvsReplayCheck),
    commsCheck:           beforeStart(timing?.obCommsCheck),
  }
}

export function computeControlTimes(event, timing, preMatchMin = 0, postMatchMin = 0) {
  const startDT = splitDateTime(event.start)
  if (!startDT) {
    return {
      start: '—', lineup: '—', availableForProduction: '—', liveFeed: '—',
      matchEnd: '—', teardown: '—', linesDown: '—', linesBooking: '—',
    }
  }

  const lineupMin = (timing?.lineup || 0) + (preMatchMin || 0)
  const lineupDurationMin = timing?.liveFeed || 0
  const linesDownMin = (timing?.autoTeardown || 0) + (postMatchMin || 0)
  const durationMin = timing?.duration || 0

  const lineupDatetime = addMinutesToLocalDatetime(startDT.date, startDT.time, -lineupMin)
  const liveFeedDatetime = addMinutesToLocalDatetime(lineupDatetime.slice(0, 10), lineupDatetime.slice(11, 16), lineupDurationMin)
  const endDatetime = addMinutesToLocalDatetime(startDT.date, startDT.time, durationMin)
  const linesDownDatetime = addMinutesToLocalDatetime(endDatetime.slice(0, 10), endDatetime.slice(11, 16), linesDownMin)
  const availableEndDatetime = addMinutesToLocalDatetime(linesDownDatetime.slice(0, 10), linesDownDatetime.slice(11, 16), -5)

  return {
    start: startDT.time,
    lineup: formatOffsetResult(lineupDatetime, startDT.date),
    liveFeed: formatOffsetResult(liveFeedDatetime, startDT.date),
    availableForProduction: `${formatOffsetResult(liveFeedDatetime, startDT.date)} – ${formatOffsetResult(availableEndDatetime, startDT.date)}`,
    matchEnd: formatOffsetResult(endDatetime, startDT.date),
    teardown: formatOffsetResult(linesDownDatetime, startDT.date),
    linesDown: formatOffsetResult(linesDownDatetime, startDT.date),
    linesBooking: `${formatOffsetResult(lineupDatetime, startDT.date)} – ${formatOffsetResult(linesDownDatetime, startDT.date)}`,
  }
}
