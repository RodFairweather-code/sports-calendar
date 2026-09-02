// Gallery crews per physical location.
//
// A production pattern can set `productionBooth`, `studio` and `obUnit`
// independently, and an event may use any combination. A Booth, a Studio and an
// OB Unit are in different places, so each one an event uses needs its own
// gallery crew. The gallery roles below are staffed per location; every other
// production role stays one-per-event.
//
// Field naming on `production_assignments[eventId]` (and the matching
// `staff_bookings` / `staff_locks` sub-keys): the booth keeps the original bare
// field names so existing data needs no migration; studio and OB get a prefix.

export const GALLERY_ROLES = [
  { role: 'director',         staffKey: 'director',         label: 'Director' },
  { role: 'evsOperator',      staffKey: 'evsOperator',      label: 'EVS' },
  { role: 'graphicsOperator', staffKey: 'graphicsOperator', label: 'Graphics' },
]

export const GALLERY_LOCATIONS = [
  { key: 'booth',  label: 'Booth'   },
  { key: 'studio', label: 'Studio'  },
  { key: 'ob',     label: 'OB Unit' },
]

// Field name for a (location, role) pair. Booth keeps the bare role name.
export function galleryField(location, role) {
  return location === 'booth' ? role : location + role[0].toUpperCase() + role.slice(1)
}

// Every location × role field name, e.g. ['director','studioDirector','obDirector', …].
export function allGalleryFields() {
  return GALLERY_LOCATIONS.flatMap(loc => GALLERY_ROLES.map(r => galleryField(loc.key, r.role)))
}

// ── "Does this event use facility X?" ───────────────────────────────────────
// Per-event tech override wins; otherwise fall back to the resolved pattern.

function patternFlag(event, assignments, patternMap, defaultPatterns, overrideKey, patternKey) {
  const asgn = assignments[event.id] || {}
  if (asgn[overrideKey] !== undefined) return asgn[overrideKey]
  const patternId = asgn.patternId ?? defaultPatterns[event.extendedProps.competitionId]
  if (!patternId) return false
  return patternMap[patternId]?.[patternKey] ?? false
}

export function needsBooth(event, assignments, patternMap, defaultPatterns) {
  return patternFlag(event, assignments, patternMap, defaultPatterns, 'techProductionBooth', 'productionBooth')
}

export function needsStudio(event, assignments, patternMap, defaultPatterns) {
  return patternFlag(event, assignments, patternMap, defaultPatterns, 'techStudio', 'studio')
}

export function needsObUnit(event, assignments, patternMap, defaultPatterns) {
  return patternFlag(event, assignments, patternMap, defaultPatterns, 'techObUnit', 'obUnit')
}

const LOCATION_NEEDS = {
  booth:  needsBooth,
  studio: needsStudio,
  ob:     needsObUnit,
}

// The subset of ['booth','studio','ob'] this event actually uses.
export function galleryLocationsForEvent(event, assignments, patternMap, defaultPatterns) {
  return GALLERY_LOCATIONS
    .map(l => l.key)
    .filter(key => LOCATION_NEEDS[key](event, assignments, patternMap, defaultPatterns))
}
