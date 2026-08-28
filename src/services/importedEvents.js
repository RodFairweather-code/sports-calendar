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

export function addImportedEvents(events) {
  const next = [...loadImportedEvents(), ...events]
  saveToStorage(KEY, next)
  return next
}

export function removeImportedEvent(id) {
  const next = loadImportedEvents().filter(e => e.id !== id)
  saveToStorage(KEY, next)
  return next
}

export function removeImportedEvents(ids) {
  const idSet = new Set(ids)
  const next = loadImportedEvents().filter(e => !idSet.has(e.id))
  saveToStorage(KEY, next)
  return next
}
