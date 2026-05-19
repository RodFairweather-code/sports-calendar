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
  encoders: 0,              encodersCost: 0,
  decoders: 0,              decodersCost: 0,
  frameRateConverters: 0,   frameRateConvertersCost: 0,
  audioOffset: 0,           audioOffsetCost: 0,
  outgoingIdents: 0,        outgoingIdentsCost: 0,
  productionBooths: 16,     productionBoothsCost: 0,
  videoIncoming: 0,         videoIncomingCost: 0,
  videoOutgoing: 0,         videoOutgoingCost: 0,
  audioIncoming: 0,         audioIncomingCost: 0,
  audioOutgoing: 0,         audioOutgoingCost: 0,
  talkbackIncoming: 0,      talkbackIncomingCost: 0,
  talkbackOutgoing: 0,      talkbackOutgoingCost: 0,
  platformLines: {},
}

// Equipment field: qty + cost side by side
function EquipField({ label, value, costValue, onChange, onCostChange }) {
  return (
    <div className="ts-field">
      <span className="ts-field-label">{label}</span>
      <div className="ts-field-right">
        <input
          className="ts-field-input"
          type="number" min="0" max="9999"
          value={value ?? 0}
          onChange={e => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
        />
        <span className="ts-cost-sep">£</span>
        <input
          className="ts-field-cost"
          type="number" min="0"
          value={costValue ?? 0}
          onChange={e => onCostChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
        />
      </div>
    </div>
  )
}

// Plain number field for platform lines (no cost)
function NumField({ label, value, onChange }) {
  return (
    <div className="ts-field">
      <span className="ts-field-label">{label}</span>
      <input
        className="ts-field-input"
        type="number" min="0" max="9999"
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
          <div className="ts-equip-header">
            <span />
            <span className="ts-col-head">Qty</span>
            <span className="ts-col-head">Cost / unit</span>
          </div>
          <div className="staff-grid">

            <TechCard title="Encoders &amp; Decoders">
              <EquipField label="Encoders" value={data.encoders} costValue={data.encodersCost}
                onChange={v => setTop('encoders', v)} onCostChange={v => setTop('encodersCost', v)} />
              <EquipField label="Decoders" value={data.decoders} costValue={data.decodersCost}
                onChange={v => setTop('decoders', v)} onCostChange={v => setTop('decodersCost', v)} />
            </TechCard>

            <TechCard title="Frame Rate Converters">
              <EquipField label="Frame Rate Converters" value={data.frameRateConverters} costValue={data.frameRateConvertersCost}
                onChange={v => setTop('frameRateConverters', v)} onCostChange={v => setTop('frameRateConvertersCost', v)} />
            </TechCard>

            <TechCard title="Audio Offset">
              <EquipField label="Audio Offset" value={data.audioOffset} costValue={data.audioOffsetCost}
                onChange={v => setTop('audioOffset', v)} onCostChange={v => setTop('audioOffsetCost', v)} />
            </TechCard>

            <TechCard title="Outgoing Idents">
              <EquipField label="Outgoing Idents" value={data.outgoingIdents} costValue={data.outgoingIdentsCost}
                onChange={v => setTop('outgoingIdents', v)} onCostChange={v => setTop('outgoingIdentsCost', v)} />
            </TechCard>

            <TechCard title="Production Booths">
              <EquipField label="Production Booths" value={data.productionBooths} costValue={data.productionBoothsCost}
                onChange={v => setTop('productionBooths', v)} onCostChange={v => setTop('productionBoothsCost', v)} />
            </TechCard>

            <TechCard title="Lines">
              <EquipField label="Video Incoming"    value={data.videoIncoming}    costValue={data.videoIncomingCost}    onChange={v => setTop('videoIncoming',    v)} onCostChange={v => setTop('videoIncomingCost',    v)} />
              <EquipField label="Video Outgoing"    value={data.videoOutgoing}    costValue={data.videoOutgoingCost}    onChange={v => setTop('videoOutgoing',    v)} onCostChange={v => setTop('videoOutgoingCost',    v)} />
              <EquipField label="Audio Incoming"    value={data.audioIncoming}    costValue={data.audioIncomingCost}    onChange={v => setTop('audioIncoming',    v)} onCostChange={v => setTop('audioIncomingCost',    v)} />
              <EquipField label="Audio Outgoing"    value={data.audioOutgoing}    costValue={data.audioOutgoingCost}    onChange={v => setTop('audioOutgoing',    v)} onCostChange={v => setTop('audioOutgoingCost',    v)} />
              <EquipField label="Talkback Incoming" value={data.talkbackIncoming} costValue={data.talkbackIncomingCost} onChange={v => setTop('talkbackIncoming', v)} onCostChange={v => setTop('talkbackIncomingCost', v)} />
              <EquipField label="Talkback Outgoing" value={data.talkbackOutgoing} costValue={data.talkbackOutgoingCost} onChange={v => setTop('talkbackOutgoing', v)} onCostChange={v => setTop('talkbackOutgoingCost', v)} />
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
