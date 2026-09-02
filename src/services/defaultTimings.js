import { saveToStorage } from './storage'

// Per-competition MCR timing offsets, in minutes. Shape:
// { [competitionId]: { lineup, liveFeed, duration, autoTeardown,
//                      obStaff, studioStaff, boothStaff,
//                      obRigCrewCall, obTruckPoweredUp, obEngineeringRigCheck,
//                      obTechnicalRehearsal, obCommsCheck, obEvsReplayCheck: number } }
// The reserved id below holds the "Default events" fallback row.
const KEY = 'admin_default_timings'

export const DEFAULT_TIMINGS_ID = '__default__'

export function loadDefaultTimings() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
}

export function persistDefaultTimings(timings) {
  saveToStorage(KEY, timings)
}

// A competition's own timings win field-by-field; any field it hasn't set
// falls back to the "Default events" row.
export function resolveTimings(timings, competitionId) {
  return {
    ...(timings?.[DEFAULT_TIMINGS_ID] || {}),
    ...(timings?.[competitionId] || {}),
  }
}
