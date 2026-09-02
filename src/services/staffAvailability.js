// Reads the per-department day-off records set on the Staff Availability screen
// (localStorage `staff_availability`), so allocation and staff pickers can skip
// people who are not available on the event's date.
//
// Shape: { from, days, unavailable: { [staffKey]: { [name]: { 'YYYY-MM-DD': 1 } } } }
// An absent day (or an event outside the seeded window) means available.

export function loadStaffAvailability() {
  try {
    const stored = JSON.parse(localStorage.getItem('staff_availability') || 'null')
    if (stored && stored.unavailable) return stored
  } catch { /* fall through */ }
  return { unavailable: {} }
}

// Can this person work on `dateIso` in role `staffKey`?
export function isAvailableOn(availability, staffKey, name, dateIso) {
  if (!name || !dateIso) return true
  return !availability?.unavailable?.[staffKey]?.[name]?.[dateIso]
}

// Filter a list of names to those available on `dateIso` in role `staffKey`.
export function availableNames(availability, staffKey, dateIso, names) {
  if (!dateIso) return names
  return names.filter(n => isAvailableOn(availability, staffKey, n, dateIso))
}
