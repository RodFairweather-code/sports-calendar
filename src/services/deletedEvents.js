import { saveToStorage } from './storage'

// Built-in fixture events (ALL_EVENTS in App.jsx) are computed fresh from
// bundled JSON on every load, so they can't be removed at the source —
// instead we track their ids here and filter them out at render time.
const KEY = 'deleted_event_ids'

export function loadDeletedEventIds() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function addDeletedEventId(id) {
  const next = [...new Set([...loadDeletedEventIds(), id])]
  saveToStorage(KEY, next)
  return next
}
