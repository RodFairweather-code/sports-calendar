import { useState } from 'react'

const ROLES = [
  { key: 'cameramen',               label: 'Cameramen' },
  { key: 'onsiteAudio',             label: 'Onsite Audio' },
  { key: 'onsiteProductionManager', label: 'Onsite Production Manager' },
  { key: 'director',                label: 'Director' },
  { key: 'producer',                label: 'Producer' },
  { key: 'commentator',             label: 'Commentator' },
  { key: 'evsOperator',             label: 'EVS Operator' },
  { key: 'graphicsOperator',        label: 'Graphics Operator' },
]

const EMPTY_STAFF = Object.fromEntries(ROLES.map(r => [r.key, []]))

function loadStaff() {
  try { return { ...EMPTY_STAFF, ...JSON.parse(localStorage.getItem('admin_staff') || '{}') } }
  catch { return { ...EMPTY_STAFF } }
}

function persist(staff) {
  localStorage.setItem('admin_staff', JSON.stringify(staff))
}

function loadStaffCosts() {
  try {
    const stored = JSON.parse(localStorage.getItem('admin_staff_costs') || '{}')
    return {
      defaults:  stored.defaults  || {},
      overrides: stored.overrides || {},
    }
  } catch { return { defaults: {}, overrides: {} } }
}

function persistCosts(costs) {
  localStorage.setItem('admin_staff_costs', JSON.stringify(costs))
}

// Key used in overrides map — role-scoped to avoid collisions
function overrideKey(roleKey, name) { return `${roleKey}|${name}` }

export function getStaffForRole(roleKey) {
  try { return JSON.parse(localStorage.getItem('admin_staff') || '{}')[roleKey] ?? [] }
  catch { return [] }
}

function StaffView() {
  const [staff, setStaff]           = useState(loadStaff)
  const [costs, setCosts]           = useState(loadStaffCosts)
  const [inputs, setInputs]         = useState(Object.fromEntries(ROLES.map(r => [r.key, ''])))

  function addPerson(roleKey) {
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
    const updated = { ...staff, [roleKey]: staff[roleKey].filter(n => n !== name) }
    setStaff(updated)
    persist(updated)
    // clean up any cost override for this person
    const key = overrideKey(roleKey, name)
    if (costs.overrides[key] !== undefined) {
      const next = { ...costs, overrides: { ...costs.overrides } }
      delete next.overrides[key]
      setCosts(next)
      persistCosts(next)
    }
  }

  function setDefaultCost(roleKey, value) {
    const next = { ...costs, defaults: { ...costs.defaults, [roleKey]: value } }
    setCosts(next)
    persistCosts(next)
  }

  function setPersonCost(roleKey, name, rawValue) {
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

  return (
    <div className="staff-view">
      <div className="staff-grid">
        {ROLES.map(role => {
          const defaultCost = costs.defaults[role.key] ?? 0
          return (
            <div key={role.key} className="staff-card">
              <div className="staff-card-header">
                <span className="staff-card-title">{role.label}</span>
                <span className="staff-card-count">{staff[role.key].length}</span>
              </div>

              {/* Default cost row */}
              <div className="staff-default-cost">
                <span className="staff-default-cost-label">Default cost</span>
                <span className="staff-cost-sym">£</span>
                <input
                  className="staff-cost-input"
                  type="number" min="0"
                  value={defaultCost}
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
                            onChange={e => setPersonCost(role.key, name, e.target.value)}
                          />
                        </div>
                        <button
                          className="staff-remove-btn"
                          onClick={() => removePerson(role.key, name)}
                          title={`Remove ${name}`}
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
                  onChange={e => setInputs(prev => ({ ...prev, [role.key]: e.target.value }))}
                  onKeyDown={e => onKey(e, role.key)}
                />
                <button
                  className="staff-add-btn"
                  onClick={() => addPerson(role.key)}
                  disabled={!inputs[role.key].trim()}
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
