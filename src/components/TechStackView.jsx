import { useState } from 'react'

function loadTechStack() {
  try { return JSON.parse(localStorage.getItem('admin_tech_stack') || '{}') }
  catch { return {} }
}

function persistTechStack(data) {
  localStorage.setItem('admin_tech_stack', JSON.stringify(data))
}

function loadPlatforms() {
  try { return JSON.parse(localStorage.getItem('admin_platforms') || '[]') }
  catch { return [] }
}

const DEFAULTS = {
  encoders: 0,
  decoders: 0,
  frameRateConverters: 0,
  audioOffset: 0,
  outgoingIdents: 0,
  platformLines: {},
}

function NumField({ label, value, onChange }) {
  return (
    <div className="ts-field">
      <span className="ts-field-label">{label}</span>
      <input
        className="ts-field-input"
        type="number"
        min="0"
        max="9999"
        value={value ?? 0}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
      />
    </div>
  )
}

function TechCard({ title, children }) {
  return (
    <div className="staff-card">
      <div className="staff-card-header">
        <span className="staff-card-title">{title}</span>
      </div>
      <div className="ts-card-body">
        {children}
      </div>
    </div>
  )
}

function TechStackView() {
  const [platforms] = useState(loadPlatforms)
  const [data, setData] = useState(() => ({ ...DEFAULTS, ...loadTechStack() }))

  function setTop(field, value) {
    setData(prev => {
      const next = { ...prev, [field]: value }
      persistTechStack(next)
      return next
    })
  }

  function setPlatLine(platformId, field, value) {
    setData(prev => {
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
    return data.platformLines?.[platformId]?.[field] ?? 0
  }

  return (
    <div className="staff-view">
      <div className="ts-page">

        {/* ── Fixed equipment ──────────────────────────────── */}
        <div className="ts-section">
          <h2 className="ts-section-title">Equipment</h2>
          <div className="staff-grid">

            <TechCard title="Encoders &amp; Decoders">
              <NumField label="Encoders" value={data.encoders}
                onChange={v => setTop('encoders', v)} />
              <NumField label="Decoders" value={data.decoders}
                onChange={v => setTop('decoders', v)} />
            </TechCard>

            <TechCard title="Frame Rate Converters">
              <NumField label="Frame Rate Converters" value={data.frameRateConverters}
                onChange={v => setTop('frameRateConverters', v)} />
            </TechCard>

            <TechCard title="Audio Offset">
              <NumField label="Audio Offset" value={data.audioOffset}
                onChange={v => setTop('audioOffset', v)} />
            </TechCard>

            <TechCard title="Outgoing Idents">
              <NumField label="Outgoing Idents" value={data.outgoingIdents}
                onChange={v => setTop('outgoingIdents', v)} />
            </TechCard>

          </div>
        </div>

        {/* ── Lines by platform ────────────────────────────── */}
        <div className="ts-section">
          <h2 className="ts-section-title">Lines by Platform</h2>
          {platforms.length === 0 ? (
            <p className="ts-empty">
              No platforms configured yet. Add platforms in Admin → Platforms first.
            </p>
          ) : (
            <div className="staff-grid">
              {platforms.map(p => (
                <TechCard key={p.id} title={p.name}>
                  <NumField label="Video incoming"     value={pl(p.id, 'videoIncoming')}    onChange={v => setPlatLine(p.id, 'videoIncoming',    v)} />
                  <NumField label="Video outgoing"     value={pl(p.id, 'videoOutgoing')}    onChange={v => setPlatLine(p.id, 'videoOutgoing',    v)} />
                  <NumField label="Talkback incoming"  value={pl(p.id, 'talkbackIncoming')} onChange={v => setPlatLine(p.id, 'talkbackIncoming', v)} />
                  <NumField label="Talkback outgoing"  value={pl(p.id, 'talkbackOutgoing')} onChange={v => setPlatLine(p.id, 'talkbackOutgoing', v)} />
                  <NumField label="Audio incoming"     value={pl(p.id, 'audioIncoming')}    onChange={v => setPlatLine(p.id, 'audioIncoming',    v)} />
                  <NumField label="Audio outgoing"     value={pl(p.id, 'audioOutgoing')}    onChange={v => setPlatLine(p.id, 'audioOutgoing',    v)} />
                  <NumField label="2110"               value={pl(p.id, 'smpte2110')}        onChange={v => setPlatLine(p.id, 'smpte2110',        v)} />
                </TechCard>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default TechStackView
