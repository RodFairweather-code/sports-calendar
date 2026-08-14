import { saveToStorage } from './storage'

const KEY = 'imported_events'

export function loadImportedEvents() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function addImportedEvent(event) {
  const next = [...loadImportedEvents(), event]
  saveToStorage(KEY, next)
  return next
}
