import { saveToStorage } from './storage'

function removeEventKey(storageKey, eventId) {
  let data
  try { data = JSON.parse(localStorage.getItem(storageKey) || '{}') }
  catch { data = {} }
  if (!(eventId in data)) return
  const { [eventId]: _removed, ...rest } = data
  saveToStorage(storageKey, rest)
}

// Deleting an event should leave no trace behind — clears its production
// assignment, editorial decision, staff booking, and staff-lock records,
// then tells every open view holding a copy of that state to reload it.
export function clearEventReferences(eventId) {
  removeEventKey('production_assignments', eventId)
  removeEventKey('editorial_decisions', eventId)
  removeEventKey('staff_bookings', eventId)
  removeEventKey('staff_locks', eventId)

  window.dispatchEvent(new CustomEvent('assignments-updated'))
  window.dispatchEvent(new CustomEvent('bookings-updated'))
  window.dispatchEvent(new CustomEvent('locks-updated'))
}
