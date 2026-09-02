import { useState, useEffect } from 'react'
import { saveToStorage } from '../services/storage'
import { hasPermission } from '../services/roles'
import { GALLERY_ROLES, GALLERY_LOCATIONS, galleryField } from '../services/galleryRoles'

const ROLES = [
  { key: 'cameramen',               label: 'Cameramen' },
  { key: 'onsiteAudio',             label: 'Onsite Audio' },
  { key: 'onsiteProductionManager', label: 'Onsite Production Manager' },
  { key: 'director',                label: 'Director' },
  { key: 'producer',                label: 'Producer' },
  { key: 'commentator',             label: 'Commentator' },
  { key: 'evsOperator',             label: 'EVS Operator' },
  { key: 'graphicsOperator',        label: 'Graphics Operator' },
  { key: 'mamCheckers',             label: 'MAM Checkers' },
]

const MAM_CHECKER_DEFAULTS = ['Yes (CS)', 'Yes (JS)', 'Yes (RF)']

const CAPS = [
  { key: 'cam2',     label: '2 Cam' },
  { key: 'cam4',     label: '4 Cam' },
  { key: 'cam8plus', label: '8 Cam+' },
  { key: 'studio',   label: 'Studio' },
  { key: 'tennis',   label: 'Tennis' },
  { key: 'rugby',    label: 'Rugby' },
]

const EMPTY_STAFF = Object.fromEntries(ROLES.map(r => [r.key, []]))

function defaultProfile() {
  return {
    isStaff: true,
    email: '',
    phone: '',
    seniority: 1,
    caps: Object.fromEntries(CAPS.map(c => [c.key, false])),
  }
}

function mergedProfile(stored) {
  const def = defaultProfile()
  if (!stored) return def
  return { ...def, ...stored, caps: { ...def.caps, ...(stored.caps || {}) } }
}

function loadStaff() {
  try {
    const stored = { ...EMPTY_STAFF, ...JSON.parse(localStorage.getItem('admin_staff') || '{}') }
    if (!stored.mamCheckers || stored.mamCheckers.length === 0) {
      stored.mamCheckers = [...MAM_CHECKER_DEFAULTS]
      localStorage.setItem('admin_staff', JSON.stringify(stored))
    }
    return stored
  } catch { return { ...EMPTY_STAFF } }
}

function persist(staff) {
  saveToStorage('admin_staff', staff)
}

function loadStaffCosts() {
  try {
    const raw = localStorage.getItem('admin_staff_costs')
    const stored = JSON.parse(raw || '{}')
    const defaults = { ...(stored.defaults || {}) }
    if (defaults.mamCheckers === undefined) {
      defaults.mamCheckers = 50
      localStorage.setItem('admin_staff_costs', JSON.stringify({ ...stored, defaults }))
    }
    return { defaults, overrides: stored.overrides || {} }
  } catch { return { defaults: { mamCheckers: 50 }, overrides: {} } }
}

function persistCosts(costs) {
  saveToStorage('admin_staff_costs', costs)
}

function loadAllProfiles() {
  try { return JSON.parse(localStorage.getItem('admin_staff_profiles') || '{}') }
  catch { return {} }
}

function persistProfiles(all) {
  saveToStorage('admin_staff_profiles', all)
}

function overrideKey(roleKey, name) { return `${roleKey}|${name}` }

export function getStaffForRole(roleKey) {
  try { return JSON.parse(localStorage.getItem('admin_staff') || '{}')[roleKey] ?? [] }
  catch { return [] }
}

// ── Role detail page ─────────────────────────────────────────────────────────

function nameToEmail(name) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? `${parts[0]}.${parts[parts.length - 1]}@fakeemail.com`
    : `${parts[0]}@fakeemail.com`
}

const GALLERY_ROLE_LABELS = { director: 'Director', evsOperator: 'EVS Operator', graphicsOperator: 'Graphics Operator' }

const ASSIGN_ROLES = [
  { field: 'productionManager', label: 'Production Manager' },
  // Gallery roles — one field per physical location.
  ...GALLERY_LOCATIONS.flatMap(loc =>
    GALLERY_ROLES.map(r => ({
      field: galleryField(loc.key, r.role),
      label: `${GALLERY_ROLE_LABELS[r.role]} (${loc.label})`,
    }))
  ),
]

function getPersonSchedule(name, allEvents) {
  try {
    const assignments = JSON.parse(localStorage.getItem('production_assignments') || '{}')
    const results = []
    for (const [eventId, asgn] of Object.entries(assignments)) {
      const roles = ASSIGN_ROLES.filter(r => asgn[r.field] === name).map(r => r.label)
      if (!roles.length) continue
      const event = allEvents.find(e => e.id === eventId)
      if (event) results.push({ event, roles })
    }
    return results.sort((a, b) => (a.event.start || '').localeCompare(b.event.start || ''))
  } catch { return [] }
}

function formatDate(start) {
  if (!start) return '—'
  const d = new Date(start.slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function StaffRoleDetail({ role, names, allProfiles, allEvents, onUpdate, onBack, canUpdate }) {
  const roleProfiles = allProfiles[role.key] || {}

  function getProfile(name) {
    return mergedProfile(roleProfiles[name])
  }

  const sortedNames = [...names].sort((a, b) => {
    const aStaff = mergedProfile(roleProfiles[a]).isStaff !== false ? 1 : 0
    const bStaff = mergedProfile(roleProfiles[b]).isStaff !== false ? 1 : 0
    if (bStaff !== aStaff) return bStaff - aStaff
    return a.localeCompare(b)
  })

  // The allocations panel is always on screen — start it on the first person.
  const [selectedPerson, setSelectedPerson] = useState(() => sortedNames[0] || null)

  useEffect(() => {
    names.forEach(name => {
      if (!mergedProfile(roleProfiles[name]).email) {
        onUpdate(role.key, name, 'email', nameToEmail(name))
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep a valid selection if the roster changes (person removed).
  useEffect(() => {
    if (names.length && !names.includes(selectedPerson)) {
      setSelectedPerson(sortedNames[0] || null)
    }
  }, [names]) // eslint-disable-line react-hooks/exhaustive-deps

  const schedule = selectedPerson ? getPersonSchedule(selectedPerson, allEvents) : []

  return (
    <div className="staff-role-detail">
      <div className="staff-role-detail-header">
        <button className="staff-role-back-btn" onClick={onBack}>← Back</button>
        <h2 className="staff-role-detail-title">{role.label}</h2>
        <span className="staff-role-detail-count">{names.length} {names.length === 1 ? 'person' : 'people'}</span>
      </div>

      {names.length === 0 ? (
        <p className="staff-empty" style={{ padding: '20px' }}>
          No staff added to this role yet. Add names from the main Staff page first.
        </p>
      ) : (
        <div className="srt-body">
          <div className="staff-role-table-wrap">
          <table className="staff-role-table">
            <thead>
              <tr>
                <th className="srt-th srt-name">Name</th>
                <th className="srt-th srt-stafffl">Staff / FL</th>
                <th className="srt-th srt-email">Email</th>
                <th className="srt-th srt-phone">Phone</th>
                {CAPS.map(c => (
                  <th key={c.key} className="srt-th srt-cap">{c.label}</th>
                ))}
                <th className="srt-th srt-seniority">Seniority</th>
              </tr>
            </thead>
            <tbody>
              {sortedNames.map((name, i) => {
                const p = getProfile(name)
                const isSelected = name === selectedPerson
                return (
                  <tr
                    key={name}
                    className={`${i % 2 === 0 ? 'srt-row-even' : 'srt-row-odd'}${isSelected ? ' srt-row-selected' : ''}`}
                    onClick={() => setSelectedPerson(name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="srt-td srt-name">{name}</td>

                    <td className="srt-td srt-stafffl" onClick={e => e.stopPropagation()}>
                      <span
                        className={p.isStaff ? 'srt-staff-tag srt-tag-btn' : 'srt-fl-tag srt-tag-btn'}
                        role="button"
                        tabIndex={canUpdate ? 0 : -1}
                        aria-disabled={!canUpdate}
                        title={canUpdate ? 'Click to toggle Staff / Freelance' : "Your role doesn't have permission to edit staff"}
                        onClick={() => canUpdate && onUpdate(role.key, name, 'isStaff', !p.isStaff)}
                        onKeyDown={e => canUpdate && e.key === 'Enter' && onUpdate(role.key, name, 'isStaff', !p.isStaff)}
                      >
                        {p.isStaff ? 'Staff' : 'Freelance'}
                      </span>
                    </td>

                    <td className="srt-td srt-email" onClick={e => e.stopPropagation()}>
                      <input
                        type="email"
                        className="srt-email-input"
                        value={p.email}
                        placeholder="email@example.com"
                        disabled={!canUpdate}
                        onChange={e => onUpdate(role.key, name, 'email', e.target.value)}
                      />
                    </td>

                    <td className="srt-td srt-phone" onClick={e => e.stopPropagation()}>
                      <input
                        type="tel"
                        className="srt-phone-input"
                        value={p.phone || ''}
                        placeholder="07700 000000"
                        disabled={!canUpdate}
                        onChange={e => onUpdate(role.key, name, 'phone', e.target.value)}
                      />
                    </td>

                    {CAPS.map(c => (
                      <td key={c.key} className="srt-td srt-cap" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="srt-cap-check"
                          checked={p.caps[c.key] || false}
                          disabled={!canUpdate}
                          onChange={e => onUpdate(role.key, name, `caps.${c.key}`, e.target.checked)}
                        />
                      </td>
                    ))}

                    <td className="srt-td srt-seniority" onClick={e => e.stopPropagation()}>
                      <input
                        type="number"
                        className="srt-seniority-input"
                        min="1"
                        max="5"
                        value={p.seniority}
                        disabled={!canUpdate}
                        onChange={e => {
                          const v = Math.min(5, Math.max(1, parseInt(e.target.value, 10) || 1))
                          onUpdate(role.key, name, 'seniority', v)
                        }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>

          <div className="srt-sidebar">
            <div className="srt-sidebar-header">
              <span className="srt-sidebar-title">{selectedPerson || 'Allocations'}</span>
            </div>
            <div className="srt-sidebar-body">
              {!selectedPerson ? (
                <p className="srt-sidebar-empty">Select a person to see their allocations.</p>
              ) : schedule.length === 0 ? (
                <p className="srt-sidebar-empty">No allocations found in the schedule.</p>
              ) : (
                schedule.map(({ event, roles }, i) => (
                  <div key={i} className="srt-sidebar-item">
                    <div className="srt-sidebar-date">{formatDate(event.start)}</div>
                    <div className="srt-sidebar-event">{event.title}</div>
                    <div className="srt-sidebar-roles">{roles.join(', ')}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Staff view (cards grid) ─────────────────────────────────────────────

function StaffView({ allEvents = [], role }) {
  const canCreate = hasPermission(role, 'humanAssets', 'create')
  const canUpdate = hasPermission(role, 'humanAssets', 'update')
  const canDelete = hasPermission(role, 'humanAssets', 'delete')
  const [staff, setStaff]           = useState(loadStaff)
  const [costs, setCosts]           = useState(loadStaffCosts)
  const [inputs, setInputs]         = useState(Object.fromEntries(ROLES.map(r => [r.key, ''])))
  const [allProfiles, setAllProfiles] = useState(loadAllProfiles)
  const [selectedRole, setSelectedRole] = useState(null)

  function updateProfile(roleKey, name, field, value) {
    setAllProfiles(prev => {
      const roleData = { ...(prev[roleKey] || {}) }
      const person = mergedProfile(roleData[name])
      if (field.startsWith('caps.')) {
        person.caps = { ...person.caps, [field.slice(5)]: value }
      } else {
        person[field] = value
      }
      roleData[name] = person
      const next = { ...prev, [roleKey]: roleData }
      persistProfiles(next)
      return next
    })
  }

  function addPerson(roleKey) {
    if (!canCreate) return
    const name = inputs[roleKey].trim()
    if (!name) return
    const list = staff[roleKey]
    if (list.includes(name)) return
    const updated = { ...staff, [roleKey]: [...list, name].sort((a, b) => a.localeCompare(b)) }
    setStaff(updated)
    persist(updated)
    setInputs(prev => ({ ...prev, [roleKey]: '' }))
  }

  function removePerson(roleKey, name) {
    if (!canDelete) return
    const updated = { ...staff, [roleKey]: staff[roleKey].filter(n => n !== name) }
    setStaff(updated)
    persist(updated)

    const key = overrideKey(roleKey, name)
    if (costs.overrides[key] !== undefined) {
      const next = { ...costs, overrides: { ...costs.overrides } }
      delete next.overrides[key]
      setCosts(next)
      persistCosts(next)
    }

    if (allProfiles[roleKey]?.[name]) {
      const nextProfiles = { ...allProfiles, [roleKey]: { ...allProfiles[roleKey] } }
      delete nextProfiles[roleKey][name]
      setAllProfiles(nextProfiles)
      persistProfiles(nextProfiles)
    }
  }

  function setDefaultCost(roleKey, value) {
    if (!canUpdate) return
    const next = { ...costs, defaults: { ...costs.defaults, [roleKey]: value } }
    setCosts(next)
    persistCosts(next)
  }

  function setPersonCost(roleKey, name, rawValue) {
    if (!canUpdate) return
    const key = overrideKey(roleKey, name)
    const next = { ...costs, overrides: { ...costs.overrides } }
    if (rawValue === '' || rawValue === null) {
      delete next.overrides[key]
    } else {
      next.overrides[key] = Math.max(0, parseInt(rawValue, 10) || 0)
    }
    setCosts(next)
    persistCosts(next)
  }

  function effectiveCost(roleKey, name) {
    const key = overrideKey(roleKey, name)
    const ov = costs.overrides[key]
    return ov !== undefined ? ov : (costs.defaults[roleKey] ?? 0)
  }

  function onKey(e, roleKey) {
    if (e.key === 'Enter') addPerson(roleKey)
  }

  // Drill into role detail
  if (selectedRole) {
    const role = ROLES.find(r => r.key === selectedRole)
    return (
      <StaffRoleDetail
        role={role}
        names={staff[selectedRole]}
        allProfiles={allProfiles}
        allEvents={allEvents}
        onUpdate={updateProfile}
        onBack={() => setSelectedRole(null)}
        canUpdate={canUpdate}
      />
    )
  }

  return (
    <div className="staff-view">
      <div className="staff-grid">
        {ROLES.map(role => {
          const defaultCost = costs.defaults[role.key] ?? 0
          return (
            <div key={role.key} className="staff-card">
              <div
                className="staff-card-header staff-card-header--link"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRole(role.key)}
                onKeyDown={e => e.key === 'Enter' && setSelectedRole(role.key)}
              >
                <span className="staff-card-title">{role.label}</span>
                <span className="staff-card-count">{staff[role.key].length}</span>
                <span className="staff-card-chevron">›</span>
              </div>

              <div className="staff-default-cost">
                <span className="staff-default-cost-label">Default cost</span>
                <span className="staff-cost-sym">£</span>
                <input
                  className="staff-cost-input"
                  type="number" min="0"
                  value={defaultCost}
                  disabled={!canUpdate}
                  onChange={e => setDefaultCost(role.key, Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </div>

              <div className="staff-card-list">
                {staff[role.key].length === 0 ? (
                  <p className="staff-empty">No names added yet.</p>
                ) : (
                  staff[role.key].map(name => {
                    const key = overrideKey(role.key, name)
                    const hasOverride = costs.overrides[key] !== undefined
                    const overrideVal = hasOverride ? costs.overrides[key] : ''
                    return (
                      <div key={name} className="staff-person">
                        <span className="staff-person-name">{name}</span>
                        <div className="staff-person-cost">
                          <span className="staff-cost-sym">£</span>
                          <input
                            className="staff-cost-input"
                            type="number" min="0"
                            value={overrideVal}
                            placeholder={String(defaultCost)}
                            disabled={!canUpdate}
                            onChange={e => setPersonCost(role.key, name, e.target.value)}
                          />
                        </div>
                        <button
                          className="staff-remove-btn"
                          disabled={!canDelete}
                          title={canDelete ? `Remove ${name}` : "Your role doesn't have permission to remove staff"}
                          onClick={() => removePerson(role.key, name)}
                        >✕</button>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="staff-card-add">
                <input
                  className="staff-add-input"
                  type="text"
                  placeholder="Full name…"
                  value={inputs[role.key]}
                  disabled={!canCreate}
                  onChange={e => setInputs(prev => ({ ...prev, [role.key]: e.target.value }))}
                  onKeyDown={e => onKey(e, role.key)}
                />
                <button
                  className="staff-add-btn"
                  onClick={() => addPerson(role.key)}
                  disabled={!canCreate || !inputs[role.key].trim()}
                  title={!canCreate ? "Your role doesn't have permission to add staff" : undefined}
                >
                  Add
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StaffView
