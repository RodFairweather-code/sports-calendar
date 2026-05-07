import { useState } from 'react'

const EMPTY_DRAFT = {
  name: '',
  defaultIncomingLine: '',
  defaultOutgoingLine: '',
  fourWires: 0,
  feedRouting: '',
  mcrPhone: '',
  editorialPhone: '',
}

function newId() {
  return `plat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function load() {
  try { return JSON.parse(localStorage.getItem('admin_platforms') || '[]') }
  catch { return [] }
}

function persist(platforms) {
  localStorage.setItem('admin_platforms', JSON.stringify(platforms))
}

function loadTechStack() {
  try { return JSON.parse(localStorage.getItem('admin_tech_stack') || '{}') }
  catch { return {} }
}

function persistTechStack(data) {
  localStorage.setItem('admin_tech_stack', JSON.stringify(data))
}

function platformSummary(p) {
  const parts = []
  if (p.defaultIncomingLine) parts.push(`In: ${p.defaultIncomingLine}`)
  if (p.defaultOutgoingLine) parts.push(`Out: ${p.defaultOutgoingLine}`)
  if (p.fourWires > 0) parts.push(`${p.fourWires} × 4W`)
  return parts.join(' · ') || 'No lines configured'
}

function NumField({ label, value, onChange }) {
  return (
    <div className="pf-row">
      <label className="pf-label">{label}</label>
      <input
        className="pf-number-input"
        type="number"
        min="0"
        max="9999"
        value={value ?? 0}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
      />
    </div>
  )
}

function TextField({ label, value, field, placeholder, onChange }) {
  return (
    <div className="pf-row">
      <label className="pf-label">{label}</label>
      <input
        className="pf-text-input"
        type="text"
        value={value}
        placeholder={placeholder || ''}
        onChange={e => onChange(field, e.target.value)}
      />
    </div>
  )
}

function PhoneField({ label, value, field, onChange }) {
  return (
    <div className="pf-row">
      <label className="pf-label">{label}</label>
      <input
        className="pf-text-input"
        type="tel"
        value={value}
        placeholder="e.g. +44 20 7946 0000"
        onChange={e => onChange(field, e.target.value)}
      />
    </div>
  )
}

function UnsavedDialog({ name, onSave, onDiscard, onCancel }) {
  return (
    <div className="unsaved-backdrop">
      <div className="unsaved-dialog">
        <p className="unsaved-dialog-msg">
          <strong>Unsaved changes</strong><br />
          {name.trim()
            ? <span>"{name}" has unsaved changes. Save before continuing?</span>
            : <span>This platform has unsaved changes. Save before continuing?</span>}
        </p>
        <div className="unsaved-dialog-actions">
          <button className="unsaved-btn unsaved-btn--save"    onClick={onSave}>Save</button>
          <button className="unsaved-btn unsaved-btn--discard" onClick={onDiscard}>Discard</button>
          <button className="unsaved-btn unsaved-btn--cancel"  onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function PlatformsView() {
  const [platforms, setPlatforms] = useState(load)
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [techStack, setTechStack] = useState(loadTechStack)

  function setPlatLine(platformId, field, value) {
    setTechStack(prev => {
      const next = {
        ...prev,
        platformLines: {
          ...prev.platformLines,
          [platformId]: { ...prev.platformLines?.[platformId], [field]: value },
        },
      }
      persistTechStack(next)
      return next
    })
  }

  function pl(platformId, field) {
    return techStack.platformLines?.[platformId]?.[field] ?? 0
  }

  function guardDirty(action) {
    if (isDirty) {
      setPendingAction(() => action)
    } else {
      action()
    }
  }

  function selectPlatform(id) {
    guardDirty(() => {
      const p = platforms.find(p => p.id === id)
      if (!p) return
      setSelectedId(id)
      setDraft({ ...p })
      setIsDirty(false)
    })
  }

  function newPlatform() {
    guardDirty(() => {
      setSelectedId(null)
      setDraft({ ...EMPTY_DRAFT })
      setIsDirty(true)
    })
  }

  function copyPlatform(id, e) {
    e.stopPropagation()
    const p = platforms.find(p => p.id === id)
    if (!p) return
    guardDirty(() => {
      setSelectedId(null)
      setDraft({ ...p, name: `Copy of ${p.name}` })
      setIsDirty(true)
    })
  }

  function deletePlatform(id, e) {
    e.stopPropagation()
    const updated = platforms.filter(p => p.id !== id)
    setPlatforms(updated)
    persist(updated)
    if (selectedId === id) { setSelectedId(null); setDraft(null); setIsDirty(false) }
  }

  function setField(field, value) {
    setDraft(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  function doSave() {
    if (!draft?.name.trim()) return false
    let updated
    if (selectedId) {
      updated = platforms.map(p => p.id === selectedId ? { ...draft, id: selectedId } : p)
    } else {
      const saved = { ...draft, id: newId() }
      updated = [...platforms, saved]
      setSelectedId(saved.id)
    }
    setPlatforms(updated)
    persist(updated)
    setIsDirty(false)
    return true
  }

  function handleDialogSave() {
    const action = pendingAction
    setPendingAction(null)
    if (doSave()) action?.()
  }

  function handleDialogDiscard() {
    const action = pendingAction
    setPendingAction(null)
    setIsDirty(false)
    action?.()
  }

  function handleDialogCancel() {
    setPendingAction(null)
  }

  return (
    <div className="patterns-view">

      {pendingAction && (
        <UnsavedDialog
          name={draft?.name ?? ''}
          onSave={handleDialogSave}
          onDiscard={handleDialogDiscard}
          onCancel={handleDialogCancel}
        />
      )}

      {/* Sidebar */}
      <div className="patterns-sidebar">
        <div className="patterns-sidebar-header">
          <span className="patterns-sidebar-title">Platforms</span>
          <button className="patterns-new-btn" onClick={newPlatform}>+ New</button>
        </div>
        <div className="patterns-list">
          {platforms.length === 0 && (
            <p className="patterns-empty">No platforms yet.<br />Click + New to create one.</p>
          )}
          {platforms.map(p => (
            <div
              key={p.id}
              className={`pattern-item${selectedId === p.id ? ' active' : ''}`}
              onClick={() => selectPlatform(p.id)}
            >
              <div className="pattern-item-main">
                <div className="pattern-item-name">{p.name || 'Unnamed'}</div>
                <div className="pattern-item-summary">{platformSummary(p)}</div>
              </div>
              <div className="pattern-item-actions">
                <button className="pitem-btn" title="Copy" onClick={e => copyPlatform(p.id, e)}>Copy</button>
                <button className="pitem-btn pitem-btn--del" title="Delete" onClick={e => deletePlatform(p.id, e)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="patterns-editor">
        {!draft ? (
          <div className="patterns-editor-empty">
            <p>Select a platform to edit, or click <strong>+ New</strong> to create one.</p>
          </div>
        ) : (
          <>
            <div className="patterns-editor-header">
              <span className="patterns-editor-title">
                {selectedId ? 'Edit Platform' : 'New Platform'}
                {isDirty && <span className="patterns-unsaved"> · unsaved</span>}
              </span>
              <button
                className="patterns-save-btn"
                onClick={doSave}
                disabled={!isDirty || !draft.name.trim()}
              >
                Save Platform
              </button>
            </div>

            <div className="patterns-editor-body">
              <div className="patterns-form">

                <div className="pf-section">
                  <div className="pf-section-label">Identity</div>
                  <TextField label="Platform Name" value={draft.name} field="name"
                    placeholder="e.g. Sky Sports Main Event" onChange={setField} />
                </div>

                <div className="pf-section">
                  <div className="pf-section-label">Lines</div>
                  <TextField label="Default incoming line" value={draft.defaultIncomingLine}
                    field="defaultIncomingLine" placeholder="e.g. SDI-4" onChange={setField} />
                  <TextField label="Default outgoing line" value={draft.defaultOutgoingLine}
                    field="defaultOutgoingLine" placeholder="e.g. SDI-7" onChange={setField} />
                  <div className="pf-row">
                    <label className="pf-label">Number of four wires</label>
                    <input
                      className="pf-number-input"
                      type="number"
                      min="0"
                      max="99"
                      value={draft.fourWires}
                      onChange={e => setField('fourWires', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    />
                  </div>
                </div>

                <div className="pf-section">
                  <div className="pf-section-label">Feed Routing</div>
                  <div className="pf-row pf-row--full">
                    <label className="pf-label">How the feed reaches this platform</label>
                    <textarea
                      className="pf-textarea"
                      value={draft.feedRouting}
                      placeholder="Describe the signal path, handoff points, encoding format, etc."
                      onChange={e => setField('feedRouting', e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>

                <div className="pf-section">
                  <div className="pf-section-label">Contacts</div>
                  <PhoneField label="MCR phone number" value={draft.mcrPhone} field="mcrPhone" onChange={setField} />
                  <PhoneField label="Editorial phone number" value={draft.editorialPhone} field="editorialPhone" onChange={setField} />
                </div>

                {selectedId && (
                  <div className="pf-section">
                    <div className="pf-section-label">Line Capacity</div>
                    <NumField label="Video incoming"    value={pl(selectedId, 'videoIncoming')}    onChange={v => setPlatLine(selectedId, 'videoIncoming',    v)} />
                    <NumField label="Video outgoing"    value={pl(selectedId, 'videoOutgoing')}    onChange={v => setPlatLine(selectedId, 'videoOutgoing',    v)} />
                    <NumField label="Talkback incoming" value={pl(selectedId, 'talkbackIncoming')} onChange={v => setPlatLine(selectedId, 'talkbackIncoming', v)} />
                    <NumField label="Talkback outgoing" value={pl(selectedId, 'talkbackOutgoing')} onChange={v => setPlatLine(selectedId, 'talkbackOutgoing', v)} />
                    <NumField label="Audio incoming"    value={pl(selectedId, 'audioIncoming')}    onChange={v => setPlatLine(selectedId, 'audioIncoming',    v)} />
                    <NumField label="Audio outgoing"    value={pl(selectedId, 'audioOutgoing')}    onChange={v => setPlatLine(selectedId, 'audioOutgoing',    v)} />
                    <NumField label="2110"              value={pl(selectedId, 'smpte2110')}        onChange={v => setPlatLine(selectedId, 'smpte2110',        v)} />
                  </div>
                )}

              </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}

export default PlatformsView
