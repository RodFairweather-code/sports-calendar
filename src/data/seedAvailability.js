// Staff Availability — dev seed data.
//
// Availability is stored per department per person as a map of the days they are
// NOT available (an absent day means available). Stored under `staff_availability`:
//   { from: 'YYYY-MM-DD', days: 28, unavailable: { [deptKey]: { [name]: { 'YYYY-MM-DD': 1 } } } }
//
// The seed is generated relative to "today" the first time the Staff Availability
// screen is opened. During development it fills the window with plausible time
// off: two random days a week for everyone, plus a two-week block for roughly
// one person in twelve.

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

// `n` consecutive date strings starting at `from` (a Date).
export function dateWindow(from, n) {
  const d = new Date(from)
  d.setHours(12, 0, 0, 0)
  const out = []
  for (let i = 0; i < n; i++) {
    out.push(isoDate(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

// Two distinct indices in [0, max).
function twoDistinct(max) {
  const a = Math.floor(Math.random() * max)
  let b = Math.floor(Math.random() * max)
  if (b === a) b = (b + 1) % max
  return [a, b]
}

export function generateAvailability(staffByDept, from, days = 28) {
  const window = dateWindow(from, days)
  const unavailable = {}

  for (const [deptKey, names] of Object.entries(staffByDept || {})) {
    if (!Array.isArray(names) || names.length === 0) continue
    unavailable[deptKey] = {}
    for (const name of names) {
      const off = new Set()

      // Two random days off in each 7-day week of the window.
      for (let w = 0; w < days; w += 7) {
        const weekLen = Math.min(7, days - w)
        if (weekLen < 2) continue
        const [i, j] = twoDistinct(weekLen)
        off.add(window[w + i])
        off.add(window[w + j])
      }

      // ~1 in 12 people also take a contiguous two-week block off.
      if (days >= 14 && Math.random() < 1 / 12) {
        const start = Math.floor(Math.random() * (days - 14 + 1))
        for (let k = 0; k < 14; k++) off.add(window[start + k])
      }

      unavailable[deptKey][name] = Object.fromEntries([...off].map(d => [d, 1]))
    }
  }

  return { from: window[0], days, unavailable }
}
