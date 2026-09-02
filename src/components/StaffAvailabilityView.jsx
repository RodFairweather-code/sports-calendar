import { useMemo, useState } from 'react'
import { saveToStorage } from '../services/storage'
import { hasPermission } from '../services/roles'
import { generateAvailability, dateWindow } from '../data/seedAvailability'

const VIEW_DAYS = 56    // days visible in the grid at once
const SEED_DAYS  = 182  // days of dev seed generated ahead — the roll-forward range

// key = admin_staff / admin_staff_profiles key
const DEPARTMENTS = [
  { key: 'director',                label: 'Directors' },
  { key: 'onsiteProductionManager', label: 'Production Managers' },
  { key: 'producer',                label: 'Producers' },
  { key: 'commentator',             label: 'Commentators' },
  { key: 'cameramen',               label: 'Cameramen' },
  { key: 'evsOperator',             label: 'EVS Operators' },
  { key: 'onsiteAudio',             label: 'Onsite Audio' },
  { key: 'graphicsOperator',        label: 'Graphics Operators' },
  { key: 'mamCheckers',             label: 'MAM Checkers' },
]

function loadStaff() {
  try { return JSON.parse(localStorage.getItem('admin_staff') || '{}') }
  catch { return {} }
}

function loadProfiles() {
  try { return JSON.parse(localStorage.getItem('admin_staff_profiles') || '{}') }
  catch { return {} }
}

function todayIso() {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function addMonths(iso, n) {
  const d = new Date(iso + 'T12:00:00')
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}

// Dev seed covering SEED_DAYS from today, regenerated whenever that window
// changes (a new "today" or a change to SEED_DAYS).
function loadAvailability(staff) {
  try {
    const stored = JSON.parse(localStorage.getItem('staff_availability') || 'null')
    if (stored && stored.unavailable && stored.from === todayIso() && stored.days === SEED_DAYS) {
      return stored
    }
  } catch { /* regenerate below */ }
  const seed = generateAvailability(staff, new Date(), SEED_DAYS)
  saveToStorage('staff_availability', seed)
  return seed
}

function isWeekend(iso) {
  const day = new Date(iso + 'T12:00:00').getDay()
  return day === 0 || day === 6
}

function StaffAvailabilityView({ role }) {
  const canUpdate = hasPermission(role, 'humanAssets', 'update')
  const [staff]    = useState(loadStaff)
  const [profiles] = useState(loadProfiles)
  const [data, setData] = useState(() => loadAvailability(staff))

  const departments = DEPARTMENTS.filter(d => (staff[d.key] || []).length > 0)
  const [dept, setDept] = useState(departments[0]?.key || DEPARTMENTS[0].key)

  // Click a date header to highlight that whole column; click it again to clear.
  const [highlightDate, setHighlightDate] = useState(null)

  // Visible window: VIEW_DAYS days starting at `startIso`, rolled a month at a time.
  const [startIso, setStartIso] = useState(todayIso())
  const seedLastIso = useMemo(() => {
    const w = dateWindow(new Date(), SEED_DAYS)
    return w[w.length - 1]
  }, [])
  const days = useMemo(
    () => dateWindow(new Date(startIso + 'T12:00:00'), VIEW_DAYS),
    [startIso],
  )

  const canPrev = startIso > todayIso()
  const nextStartIso = addMonths(startIso, 1)
  const canNext =
    dateWindow(new Date(nextStartIso + 'T12:00:00'), VIEW_DAYS)[VIEW_DAYS - 1] <= seedLastIso

  function rollMonth(delta) {
    setStartIso(prev => {
      if (delta > 0) return canNext ? nextStartIso : prev
      const back = addMonths(prev, -1)
      const min = todayIso()
      return back < min ? min : back
    })
  }

  // Consecutive day columns grouped by calendar month, for the header row.
  const monthGroups = useMemo(() => {
    const groups = []
    for (const iso of days) {
      const d = new Date(iso + 'T12:00:00')
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const last = groups[groups.length - 1]
      if (last && last.key === key) last.span++
      else groups.push({
        key,
        label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        span: 1,
      })
    }
    return groups
  }, [days])

  const people = useMemo(() => {
    const rp = profiles[dept] || {}
    return [...(staff[dept] || [])].sort((a, b) => {
      const aStaff = (rp[a]?.isStaff ?? true) ? 0 : 1
      const bStaff = (rp[b]?.isStaff ?? true) ? 0 : 1
      return aStaff - bStaff || a.localeCompare(b)
    })
  }, [staff, profiles, dept])

  const isAvailable = (name, iso) => !data.unavailable?.[dept]?.[name]?.[iso]

  function toggle(name, iso) {
    if (!canUpdate) return
    setData(prev => {
      const unavailable = { ...prev.unavailable }
      const deptMap = { ...(unavailable[dept] || {}) }
      const personMap = { ...(deptMap[name] || {}) }
      if (personMap[iso]) delete personMap[iso]
      else personMap[iso] = 1
      deptMap[name] = personMap
      unavailable[dept] = deptMap
      const next = { ...prev, unavailable }
      saveToStorage('staff_availability', next)
      return next
    })
  }

  const deptLabel = departments.find(d => d.key === dept)?.label || 'Staff'

  return (
    <div className="book-staff-view">
      <div className="book-staff-scroll">
        <div className="sa-header-row">
          <h2 className="sa-title">{deptLabel} — availability</h2>
          <div className="sa-nav">
            <button className="sa-nav-btn" onClick={() => rollMonth(-1)} disabled={!canPrev}>◀ Month</button>
            <button className="sa-nav-btn" onClick={() => setStartIso(todayIso())} disabled={startIso === todayIso()}>Today</button>
            <button className="sa-nav-btn" onClick={() => rollMonth(1)} disabled={!canNext}>Month ▶</button>
            <span className="sa-range">
              {new Date(days[0] + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              {' – '}
              {new Date(days[days.length - 1] + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <span className="sa-hint">Ticked = available for that day.</span>
        </div>

        <div className="sa-grid-wrap">
          <table className="sa-grid">
            <thead>
              <tr>
                <th className="sa-name-col sa-name-corner" rowSpan={2}>Name</th>
                {monthGroups.map(m => (
                  <th key={m.key} className="sa-month-col" colSpan={m.span}>{m.label}</th>
                ))}
              </tr>
              <tr>
                {days.map(iso => {
                  const d = new Date(iso + 'T12:00:00')
                  const hl = highlightDate === iso
                  return (
                    <th
                      key={iso}
                      className={`sa-day-col sa-day-head${isWeekend(iso) ? ' sa-weekend' : ''}${hl ? ' sa-col-highlight' : ''}`}
                      onClick={() => setHighlightDate(prev => (prev === iso ? null : iso))}
                      title="Click to highlight this column"
                    >
                      <span className="sa-dow">{'SMTWTFS'[d.getDay()]}</span>
                      <span className="sa-dom">{d.getDate()}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {people.map(name => {
                const isStaff = profiles[dept]?.[name]?.isStaff ?? true
                return (
                  <tr key={name}>
                    <td className="sa-name-col">
                      <span className="sa-person-name">{name}</span>
                      <span className={`bs-badge bs-badge--${isStaff ? 'staff' : 'freelance'}`}>
                        {isStaff ? 'Staff' : 'FL'}
                      </span>
                    </td>
                    {days.map(iso => {
                      const avail = isAvailable(name, iso)
                      return (
                        <td
                          key={iso}
                          className={`sa-cell${isWeekend(iso) ? ' sa-weekend' : ''}${avail ? '' : ' sa-cell--off'}${highlightDate === iso ? ' sa-col-highlight' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={avail}
                            disabled={!canUpdate}
                            onChange={() => toggle(name, iso)}
                            aria-label={`${name} available on ${iso}`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {people.length === 0 && (
                <tr><td className="sa-empty" colSpan={VIEW_DAYS + 1}>No staff in this department.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="book-staff-banner">
        <div className="bs-role-tabs">
          {departments.map(d => (
            <button
              key={d.key}
              className={`bs-role-tab${dept === d.key ? ' active' : ''}`}
              onClick={() => setDept(d.key)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StaffAvailabilityView
