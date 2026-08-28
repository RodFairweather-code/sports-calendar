import { saveToStorage } from './storage'

// Built-in competitions (COMPETITIONS in data/competitions.js) can't be
// removed at the source — instead we track deleted ids here and filter
// them out at render time, same pattern as deletedEvents.js.
const KEY = 'deleted_competition_ids'

export function loadDeletedCompetitionIds() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function addDeletedCompetitionIds(ids) {
  const next = [...new Set([...loadDeletedCompetitionIds(), ...ids])]
  saveToStorage(KEY, next)
  return next
}
