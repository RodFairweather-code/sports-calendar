// Wraps localStorage.setItem so a full quota doesn't throw an uncaught
// exception mid-handler (which silently aborts whatever the user just did).
// On failure it notifies listeners via a window event instead of throwing,
// so callers that don't care can ignore the return value.
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
      window.dispatchEvent(new CustomEvent('storage-quota-exceeded', { detail: { key } }))
      return false
    }
    throw err
  }
}
