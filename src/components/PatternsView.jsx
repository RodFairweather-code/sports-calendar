import { useState } from 'react'

const EMPTY_DRAFT = {
  name: '',
  // Crew
  cameramen: 0,
  evsOperator: 0,
  audioOnLocation: 0,
  crewFrom: 0,
  crewUntil: 0,
  // Video Lines
  incomingVideoLines: 0,
  outgoingVideoLines: 0,
  videoFrom: 0,
  videoUntil: 0,
  // Audio & Talkback
  incomingAudioLines: 0,
  incomingTalkbackLines: 0,
  outgoingTalkbackLines: 0,
  audioFrom: 0,
  audioUntil: 0,
  // Production
  productionBooth: false,
}

function newId() {
  return `pat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function load() {
  try { return JSON.parse(localStorage.getItem('admin_patterns') || '[]') }
  catch { return [] }
}

function persist(patterns) {
  localStorage.setItem('admin_patterns', JSON.stringify(patterns))
}

function summary(p) {
  const parts = []
  if (p.cameramen > 0) parts.push(`${p.cameramen} cam`)
  if (p.evsOperator > 0) parts.push(`${p.evsOperator} EVS`)
  if (p.audioOnLocation > 0) parts.push(`${p.audioOnLocation} audio loc`)
  if (p.incomingVideoLines > 0 || p.outgoingVideoLines > 0)
    parts.push(`vid ${p.incomingVideoLines}↓ ${p.outgoingVideoLines}↑`)
  if (p.incomingAudioLines > 0) parts.push(`${p.incomingAudioLines} audio`)
  if (p.incomingTalkbackLines > 0 || p.outgoingTalkbackLines > 0)
    parts.push(`tb ${p.incomingTalkbackLines}↓ ${p.outgoingTalkbackLines}↑`)
  return parts.join(' · ') || 'No resources set'
}

function parseHours(raw) {
  const v = parseFloat(raw)
  return isNaN(v) ? 0 : Math.round(v * 2) / 2  // snap to nearest 0.5
}

function NumField({ label, value, field, onChange }) {
  return (
    <div className="pf-row">
      <label className="pf-label">{label}</label>
      <input
        className="pf-number-input"
        type="number"
        min="0"
        max="99"
        value={value}
        onChange={e => onChange(field, Math.max(0, parseInt(e.target.value, 10) || 0))}
      />
    </div>
  )
}

function ToggleField({ label, value, field, onChange }) {
  return (
    <div className="pf-row">
      <label className="pf-label">{label}</label>
      <label className="pf-toggle">
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(field, e.target.checked)}
        />
        <span className="pf-toggle-track"><span className="pf-toggle-thumb" /></span>
        <span className="pf-toggle-text">{value ? 'Yes' : 'No'}</span>
      </label>
    </div>
  )
}

function TimingRow({ fromField, untilField, fromValue, untilValue, onChange }) {
  return (
    <div className="pf-row pf-row--timing">
      <label className="pf-label">
        Schedule offset
        <span className="pf-label-hint">hrs from event</span>
      </label>
      <div className="pf-timing-pair">
        <div className="pf-timing-field">
          <span className="pf-timing-sublabel">From start</span>
          <input
            className="pf-hour-input"
            type="number"
            step="0.5"
            min="-24"
            max="24"
            value={fromValue}
            onChange={e => onChange(fromField, parseHours(e.target.value))}
          />
          <span className="pf-timing-unit">hrs</span>
        </div>
        <div className="pf-timing-field">
          <span className="pf-timing-sublabel">Until end</span>
          <input
            className="pf-hour-input"
            type="number"
            step="0.5"
            min="-24"
            max="24"
            value={untilValue}
            onChange={e => onChange(untilField, parseHours(e.target.value))}
          />
          <span className="pf-timing-unit">hrs</span>
        </div>
      </div>
    </div>
  )
}

function PatternsView() {
  const [patterns, setPatterns] = useState(load)
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [isDirty, setIsDirty] = useState(false)

  function selectPattern(id) {
    const p = patterns.find(p => p.id === id)
    if (!p) return
    setSelectedId(id)
    setDraft({ ...EMPTY_DRAFT, ...p })
    setIsDirty(false)
  }

  function newPattern() {
    setSelectedId(null)
    setDraft({ ...EMPTY_DRAFT })
    setIsDirty(true)
  }

  function copyPattern(id, e) {
    e.stopPropagation()
    const p = patterns.find(p => p.id === id)
    if (!p) return
    setSelectedId(null)
    setDraft({ ...EMPTY_DRAFT, ...p, name: `Copy of ${p.name}` })
    setIsDirty(true)
  }

  function deletePattern(id, e) {
    e.stopPropagation()
    const updated = patterns.filter(p => p.id !== id)
    setPatterns(updated)
    persist(updated)
    if (selectedId === id) { setSelectedId(null); setDraft(null) }
  }

  function setField(field, value) {
    setDraft(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  function savePattern() {
    if (!draft?.name.trim()) return
    let updated
    if (selectedId) {
      updated = patterns.map(p => p.id === selectedId ? { ...draft, id: selectedId } : p)
    } else {
      const saved = { ...draft, id: newId() }
      updated = [...patterns, saved]
      setSelectedId(saved.id)
    }
    setPatterns(updated)
    persist(updated)
    setIsDirty(false)
  }

  return (
    <div className="patterns-view">

      {/* Sidebar */}
      <div className="patterns-sidebar">
        <div className="patterns-sidebar-header">
          <span className="patterns-sidebar-title">Saved Patterns</span>
          <button className="patterns-new-btn" onClick={newPattern}>+ New</button>
        </div>
        <div className="patterns-list">
          {patterns.length === 0 && (
            <p className="patterns-empty">No patterns yet.<br />Click + New to create one.</p>
          )}
          {patterns.map(p => (
            <div
              key={p.id}
              className={`pattern-item${selectedId === p.id ? ' active' : ''}`}
              onClick={() => selectPattern(p.id)}
            >
              <div className="pattern-item-main">
                <div className="pattern-item-name">{p.name || 'Unnamed'}</div>
                <div className="pattern-item-summary">{summary(p)}</div>
              </div>
              <div className="pattern-item-actions">
                <button className="pitem-btn" title="Copy" onClick={e => copyPattern(p.id, e)}>Copy</button>
                <button className="pitem-btn pitem-btn--del" title="Delete" onClick={e => deletePattern(p.id, e)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="patterns-editor">
        {!draft ? (
          <div className="patterns-editor-empty">
            <p>Select a pattern to edit, or click <strong>+ New</strong> to create one.</p>
          </div>
        ) : (
          <>
            <div className="patterns-editor-header">
              <span className="patterns-editor-title">
                {selectedId ? 'Edit Pattern' : 'New Pattern'}
                {isDirty && <span className="patterns-unsaved"> · unsaved</span>}
              </span>
              <button
                className="patterns-save-btn"
                onClick={savePattern}
                disabled={!isDirty || !draft.name.trim()}
              >
                Save Pattern
              </button>
            </div>

            <div className="patterns-editor-body">
              <div className="patterns-form">

                <div className="pf-section">
                  <div className="pf-section-label">Identity</div>
                  <div className="pf-row">
                    <label className="pf-label">Pattern Name</label>
                    <input
                      className="pf-text-input"
                      type="text"
                      value={draft.name}
                      onChange={e => setField('name', e.target.value)}
                      placeholder="e.g. Standard Match Coverage"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="pf-section">
                  <div className="pf-section-label">Crew</div>
                  <NumField label="Cameramen on location" value={draft.cameramen} field="cameramen" onChange={setField} />
                  <NumField label="EVS Operators" value={draft.evsOperator} field="evsOperator" onChange={setField} />
                  <NumField label="Audio on location" value={draft.audioOnLocation} field="audioOnLocation" onChange={setField} />
                  <TimingRow
                    fromField="crewFrom" untilField="crewUntil"
                    fromValue={draft.crewFrom} untilValue={draft.crewUntil}
                    onChange={setField}
                  />
                </div>

                <div className="pf-section">
                  <div className="pf-section-label">Video Lines</div>
                  <NumField label="Incoming video lines" value={draft.incomingVideoLines} field="incomingVideoLines" onChange={setField} />
                  <NumField label="Outgoing video lines" value={draft.outgoingVideoLines} field="outgoingVideoLines" onChange={setField} />
                  <TimingRow
                    fromField="videoFrom" untilField="videoUntil"
                    fromValue={draft.videoFrom} untilValue={draft.videoUntil}
                    onChange={setField}
                  />
                </div>

                <div className="pf-section">
                  <div className="pf-section-label">Audio &amp; Talkback</div>
                  <NumField label="Incoming audio lines" value={draft.incomingAudioLines} field="incomingAudioLines" onChange={setField} />
                  <NumField label="Incoming talkback lines" value={draft.incomingTalkbackLines} field="incomingTalkbackLines" onChange={setField} />
                  <NumField label="Outgoing talkback lines" value={draft.outgoingTalkbackLines} field="outgoingTalkbackLines" onChange={setField} />
                  <TimingRow
                    fromField="audioFrom" untilField="audioUntil"
                    fromValue={draft.audioFrom} untilValue={draft.audioUntil}
                    onChange={setField}
                  />
                </div>

                <div className="pf-section">
                  <div className="pf-section-label">Production</div>
                  <ToggleField label="Production booth" value={draft.productionBooth} field="productionBooth" onChange={setField} />
                </div>

              </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}

export default PatternsView
