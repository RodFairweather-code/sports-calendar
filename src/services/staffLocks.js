import { saveToStorage } from './storage'

// "Pencil" (default) vs "locked" state for a per-event staff role assignment.
// Shape: { [eventId]: { [roleField]: true } } — absence/false means pencil.

export function loadLocks() {
  try { return JSON.parse(localStorage.getItem('staff_locks') || '{}') }
  catch { return {} }
}

export function persistLocks(locks) {
  saveToStorage('staff_locks', locks)
  window.dispatchEvent(new CustomEvent('locks-updated'))
}

export function isRoleLocked(locks, eventId, roleField) {
  return !!locks[eventId]?.[roleField]
}

export function withRoleLock(locks, eventId, roleField, value) {
  return { ...locks, [eventId]: { ...locks[eventId], [roleField]: value } }
}

export function withEventLock(locks, eventId, roleFields, value) {
  const eventLocks = { ...locks[eventId] }
  for (const field of roleFields) eventLocks[field] = value
  return { ...locks, [eventId]: eventLocks }
}

export function isEventFullyLocked(locks, eventId, roleFields) {
  return roleFields.length > 0 && roleFields.every(field => isRoleLocked(locks, eventId, field))
}
