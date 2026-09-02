import { saveToStorage } from './storage'

// Per-competition MCR timing offsets, in minutes. Shape:
// { [competitionId]: { lineup, liveFeed, duration, autoTeardown,
//                      obStaff, studioStaff, boothStaff: number } }
const KEY = 'admin_default_timings'

export function loadDefaultTimings() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
}

export function persistDefaultTimings(timings) {
  saveToStorage(KEY, timings)
}
