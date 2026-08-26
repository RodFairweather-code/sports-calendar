import { useState } from 'react'

// Must stay in sync with the VIEWS array in App.jsx — there's no shared
// module for it today since only this view needs the label text.
const VIEW_ROWS = [
  { id: 'calendar',      label: 'Calendar' },
  { id: 'editorial',     label: 'Planning' },
  { id: 'production',    label: 'Production' },
  { id: 'technical',     label: 'Technical' },
  { id: 'booths',        label: 'Operations' },
  { id: 'book-staff',    label: 'Book Staff' },
  { id: 'resource-gaps', label: 'Resource Gaps' },
  { id: 'assets',        label: 'Asset Management' },
  { id: 'book-assets',   label: 'Bookable Assets' },
  { id: 'import',        label: 'Import Events' },
  { id: 'admin',         label: 'Admin' },
]

const BUCKET_ROWS = [
  { key: 'events', label: 'Events' },
  { key: 'humanAssets', label: 'Human Assets (Staff)' },
  { key: 'technicalAssets', label: 'Technical Assets' },
]

const CRUD_COLS = [
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
]

const EMPTY_VIEWS = Object.fromEntries(VIEW_ROWS.map(v => [v.id, false]))
const EMPTY_PERMS = Object.fromEntries(
  BUCKET_ROWS.map(b => [b.key, { create: false, read: false, update: false, delete: false }])
)

function newId() {
  return `role_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function roleSummary(role) {
  const viewCount = Object.values(role.views || {}).filter(Boolean).length
  const bucketLabel = (bucket, label) => {
    const p = role.permissions?.[bucket] || {}
    const letters = CRUD_COLS.filter(c => p[c.key]).map(c => c.label[0]).join('')
    return `${label} ${letters || '–'}`
  }
  return `${viewCount}/${VIEW_ROWS.length} views · ${bucketLabel('events', 'Ev')} · ${bucketLabel('humanAssets', 'Staff')} · ${bucketLabel('technicalAssets', 'Tech')}`
}

function UserTypesView({ roles, onRolesChange }) {
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [isDirty, setIsDirty] = useState(false)

  function selectRole(id) {
    const r = roles.find(r => r.id === id)
    if (!r) return
    setSelectedId(id)
    setDraft({ ...r, views: { ...r.views }, permissions: {
      events: { ...r.permissions?.events },
      humanAssets: { ...r.permissions?.humanAssets },
      technicalAssets: { ...r.permissions?.technicalAssets },
    } })
    setIsDirty(false)
  }

  function newRole() {
    setSelectedId(null)
    setDraft({ name: '', views: { ...EMPTY_VIEWS }, permissions: {
      events: { ...EMPTY_PERMS.events },
      humanAssets: { ...EMPTY_PERMS.humanAssets },
      technicalAssets: { ...EMPTY_PERMS.technicalAssets },
    } })
    setIsDirty(true)
  }

  function deleteRole(id, e) {
    e.stopPropagation()
    const role = roles.find(r => r.id === id)
    if (!role) return
    if (!window.confirm(`Delete the "${role.name}" user type? Anyone currently assuming it will fall back to another role.`)) return
    onRolesChange(roles.filter(r => r.id !== id))
    if (selectedId === id) { setSelectedId(null); setDraft(null); setIsDirty(false) }
  }

  function setName(name) {
    setDraft(prev => ({ ...prev, name }))
    setIsDirty(true)
  }

  function toggleView(viewId) {
    setDraft(prev => ({ ...prev, views: { ...prev.views, [viewId]: !prev.views[viewId] } }))
    setIsDirty(true)
  }

  function togglePermission(bucket, action) {
    setDraft(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [bucket]: { ...prev.permissions[bucket], [action]: !prev.permissions[bucket][action] },
      },
    }))
    setIsDirty(true)
  }

  function setAllViews(value) {
    setDraft(prev => ({
      ...prev,
      views: Object.fromEntries(VIEW_ROWS.map(v => [v.id, value])),
    }))
    setIsDirty(true)
  }

  function doSave() {
    if (!draft?.name.trim()) return
    let updated
    if (selectedId) {
      updated = roles.map(r => r.id === selectedId ? { ...draft, id: selectedId } : r)
    } else {
      const saved = { ...draft, id: newId() }
      updated = [...roles, saved]
      setSelectedId(saved.id)
    }
    onRolesChange(updated)
    setIsDirty(false)
  }

  return (
    <div className="patterns-view">

      {/* Sidebar */}
      <div className="patterns-sidebar">
        <div className="patterns-sidebar-header">
          <span className="patterns-sidebar-title">User Types</span>
          <button className="patterns-new-btn" onClick={newRole}>+ New</button>
        </div>
        <div className="patterns-list">
          {roles.length === 0 && (
            <p className="patterns-empty">No user types yet.<br />Click + New to create one.</p>
          )}
          {roles.map(r => (
            <div
              key={r.id}
              className={`pattern-item${selectedId === r.id ? ' active' : ''}`}
              onClick={() => selectRole(r.id)}
            >
              <div className="pattern-item-main">
                <div className="pattern-item-name">{r.name || 'Unnamed'}</div>
                <div className="pattern-item-summary">{roleSummary(r)}</div>
              </div>
              <div className="pattern-item-actions">
                <button className="pitem-btn pitem-btn--del" title="Delete" onClick={e => deleteRole(r.id, e)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="patterns-editor">
        {!draft ? (
          <div className="patterns-editor-empty">
            <p>Select a user type to edit, or click <strong>+ New</strong> to create one.</p>
          </div>
        ) : (
          <>
            <div className="patterns-editor-header">
              <span className="patterns-editor-title">
                {selectedId ? 'Edit User Type' : 'New User Type'}
                {isDirty && <span className="patterns-unsaved"> · unsaved</span>}
              </span>
              <button
                className="patterns-save-btn"
                onClick={doSave}
                disabled={!isDirty || !draft.name.trim()}
              >
                Save User Type
              </button>
            </div>

            <div className="patterns-editor-body">
            <div className="ut-form-sections">
              <div className="pf-section">
                <div className="pf-section-label">Identity</div>
                <div className="pf-row">
                  <label className="pf-label">Name</label>
                  <input
                    className="pf-text-input"
                    type="text"
                    value={draft.name}
                    placeholder="e.g. Senior Manager"
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="pf-section">
                <div className="pf-section-label">
                  Visible Areas
                  <span className="ut-bulk-links">
                    <button type="button" className="ut-bulk-link" onClick={() => setAllViews(true)}>all</button>
                    <button type="button" className="ut-bulk-link" onClick={() => setAllViews(false)}>none</button>
                  </span>
                </div>
                <div className="ut-view-grid">
                  {VIEW_ROWS.map(v => (
                    <label key={v.id} className="ut-view-cell">
                      <input
                        type="checkbox"
                        checked={!!draft.views[v.id]}
                        onChange={() => toggleView(v.id)}
                      />
                      {v.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pf-section">
                <div className="pf-section-label">Permissions</div>
                <div className="ut-perm-table">
                  <div className="ut-perm-row ut-perm-row--head">
                    <span className="ut-perm-bucket" />
                    {CRUD_COLS.map(c => (
                      <span key={c.key} className="ut-perm-col-label">{c.label}</span>
                    ))}
                  </div>
                  {BUCKET_ROWS.map(b => (
                    <div key={b.key} className="ut-perm-row">
                      <span className="ut-perm-bucket">{b.label}</span>
                      {CRUD_COLS.map(c => (
                        <label key={c.key} className="ut-perm-checkbox">
                          <input
                            type="checkbox"
                            checked={!!draft.permissions[b.key]?.[c.key]}
                            onChange={() => togglePermission(b.key, c.key)}
                          />
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="ut-perm-note">
                  Permissions apply within areas this type can already see — Rights, Asset
                  Management/TAMS, Platforms, and Patterns detail edits aren't individually
                  gated yet, only their containing area.
                </p>
              </div>
            </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}

export default UserTypesView
