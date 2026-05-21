import { useState, useEffect } from 'react'

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
  try { return { ...EMPTY_STAFF, ...JSON.parse(localStorage.getItem('admin_staff') || '{}') } }
  catch { return { ...EMPTY_STAFF } }
}

function persist(staff) {
  localStorage.setItem('admin_staff', JSON.stringify(staff))
}

function loadStaffCosts() {
  try {
    const stored = JSON.parse(localStorage.getItem('admin_staff_costs') || '{}')
    return { defaults: stored.defaults || {}, overrides: stored.overrides || {} }
  } catch { return { defaults: {}, overrides: {} } }
}

function persistCosts(costs) {
  localStorage.setItem('admin_staff_costs', JSON.stringify(costs))
}

function loadAllProfiles() {
  try { return JSON.parse(localStorage.getItem('admin_staff_profiles') || '{}') }
  catch { return {} }
}

function persistProfiles(all) {
  localStorage.setItem('admin_staff_profiles', JSON.stringify(all))
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

function StaffRoleDetail({ role, names, allProfiles, onUpdate, onBack }) {
  const roleProfiles = allProfiles[role.key] || {}

  function getProfile(name) {
    return mergedProfile(roleProfiles[name])
  }

  useEffect(() => {
    names.forEach(name => {
      if (!mergedProfile(roleProfiles[name]).email) {
        onUpdate(role.key, name, 'email', nameToEmail(name))
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="staff-role-table-wrap">
          <table className="staff-role-table">
            <thead>
              <tr>
                <th className="srt-th srt-name">Name</th>
                <th className="srt-th srt-stafffl">Staff / FL</th>
                <th className="srt-th srt-email">Email</th>
                {CAPS.map(c => (
                  <th key={c.key} className="srt-th srt-cap">{c.label}</th>
                ))}
                <th className="srt-th srt-seniority">Seniority</th>
              </tr>
            </thead>
            <tbody>
              {names.map((name, i) => {
                const p = getProfile(name)
                return (
                  <tr key={name} className={i % 2 === 0 ? 'srt-row-even' : 'srt-row-odd'}>
                    <td className="srt-td srt-name">{name}</td>

                    <td className="srt-td srt-stafffl">
                      <span
                        className={p.isStaff ? 'srt-staff-tag srt-tag-btn' : 'srt-fl-tag srt-tag-btn'}
                        role="button"
                        tabIndex={0}
                        title="Click to toggle Staff / Freelance"
                        onClick={() => onUpdate(role.key, name, 'isStaff', !p.isStaff)}
                        onKeyDown={e => e.key === 'Enter' && onUpdate(role.key, name, 'isStaff', !p.isStaff)}
                      >
                        {p.isStaff ? 'Staff' : 'Freelance'}
                      </span>
                    </td>

                    <td className="srt-td srt-email">
                      <input
                        type="email"
                        className="srt-email-input"
                        value={p.email}
                        placeholder="email@example.com"
                        onChange={e => onUpdate(role.key, name, 'email', e.target.value)}
                      />
                    </td>

                    {CAPS.map(c => (
                      <td key={c.key} className="srt-td srt-cap">
                        <input
                          type="checkbox"
                          className="srt-cap-check"
                          checked={p.caps[c.key] || false}
                          onChange={e => onUpdate(role.key, name, `caps.${c.key}`, e.target.checked)}
                        />
                      </td>
                    ))}

                    <td className="srt-td srt-seniority">
                      <input
                        type="number"
                        className="srt-seniority-input"
                        min="1"
                        max="5"
                        value={p.seniority}
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
      )}
    </div>
  )
}

// ── Main Staff view (cards grid) ─────────────────────────────────────────────

function StaffView() {
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

  // Drill into role detail
  if (selectedRole) {
    const role = ROLES.find(r => r.key === selectedRole)
    return (
      <StaffRoleDetail
        role={role}
        names={staff[selectedRole]}
        allProfiles={allProfiles}
        onUpdate={updateProfile}
        onBack={() => setSelectedRole(null)}
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
