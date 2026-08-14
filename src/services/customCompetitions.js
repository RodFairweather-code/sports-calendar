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
