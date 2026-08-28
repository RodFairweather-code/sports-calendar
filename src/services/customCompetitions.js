import { saveToStorage } from './storage'

const KEY = 'custom_competitions'

export function loadCustomCompetitions() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function addCustomCompetition(competition) {
  const next = [...loadCustomCompetitions(), competition]
  saveToStorage(KEY, next)
  return next
}

export function removeCustomCompetitions(ids) {
  const idSet = new Set(ids)
  const next = loadCustomCompetitions().filter(c => !idSet.has(c.id))
  saveToStorage(KEY, next)
  return next
}
