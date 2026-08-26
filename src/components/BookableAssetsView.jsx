import { useState } from 'react'
import { saveToStorage } from '../services/storage'
import { hasPermission } from '../services/roles'

const DEFAULT_DURATION = 8

function load() {
  try {
    const assets = JSON.parse(localStorage.getItem('bookable_assets') || '[]')
    return assets.map(a => ({
      cost: 0,
      duration: DEFAULT_DURATION,
      ...a,
    }))
  } catch { return [] }
}

function persist(assets) {
  saveToStorage('bookable_assets', assets)
}

function newId() {
  return `basset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function CreateAssetForm({ onCreate, onCancel }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [cost, setCost] = useState(0)
  const [duration, setDuration] = useState(DEFAULT_DURATION)

  const trimmedName = name.trim()
  const canCreate = trimmedName.length > 0 && quantity > 0 && duration > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canCreate) return
    onCreate({ name: trimmedName, quantity, cost, duration })
  }

  return (
    <div className="ba-modal-backdrop">
      <div className="ba-modal-dialog">
        <h3>Create Asset(s)</h3>
        <form onSubmit={handleSubmit}>
          <div className="ba-form-row">
            <label className="ba-form-label" htmlFor="ba-asset-name">Asset name</label>
            <input
              id="ba-asset-name"
              className="ba-form-input"
              type="text"
              value={name}
              placeholder="e.g. Edit Suites"
              autoFocus
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="ba-form-row">
            <label className="ba-form-label" htmlFor="ba-asset-qty">How many</label>
            <input
              id="ba-asset-qty"
              className="ba-form-input ba-form-input--number"
              type="number"
              min="1"
              max="999"
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>
          <div className="ba-form-row">
            <label className="ba-form-label" htmlFor="ba-asset-cost">Cost (£)</label>
            <input
              id="ba-asset-cost"
              className="ba-form-input ba-form-input--number"
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={e => setCost(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>
          <div className="ba-form-row">
            <label className="ba-form-label" htmlFor="ba-asset-duration">Duration (hours)</label>
            <input
              id="ba-asset-duration"
              className="ba-form-input ba-form-input--number"
              type="number"
              min="0.5"
              step="0.5"
              value={duration}
              onChange={e => setDuration(Math.max(0.5, parseFloat(e.target.value) || DEFAULT_DURATION))}
            />
          </div>
          <div className="ba-modal-actions">
            <button type="button" className="unsaved-btn unsaved-btn--cancel" onClick={onCancel}>Cancel</button>
            <button type="submit" className="unsaved-btn unsaved-btn--save" disabled={!canCreate}>Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BookableAssetsView({ role }) {
  const canCreate = hasPermission(role, 'technicalAssets', 'create')
  const canUpdate = hasPermission(role, 'technicalAssets', 'update')
  const canDelete = hasPermission(role, 'technicalAssets', 'delete')
  const [assets, setAssets] = useState(load)
  const [showForm, setShowForm] = useState(false)

  function handleCreate({ name, quantity, cost, duration }) {
    if (!canCreate) return
    const updated = [...assets, { id: newId(), name, quantity, cost, duration }]
    setAssets(updated)
    persist(updated)
    setShowForm(false)
  }

  function handleDelete(id) {
    if (!canDelete) return
    const updated = assets.filter(a => a.id !== id)
    setAssets(updated)
    persist(updated)
  }

  function handleFieldChange(id, field, value) {
    if (!canUpdate) return
    const updated = assets.map(a => a.id === id ? { ...a, [field]: value } : a)
    setAssets(updated)
    persist(updated)
  }

  return (
    <div className="ba-container">
      <div className="ba-toolbar">
        <div className="ed-toolbar-right">
          <button
            className="ba-create-btn"
            disabled={!canCreate}
            title={!canCreate ? "Your role doesn't have permission to create assets" : undefined}
            onClick={() => setShowForm(true)}
          >
            + Create Asset(s)
          </button>
        </div>
      </div>

      <div className="ba-view">
        {assets.length === 0 ? (
          <div className="ba-empty">
            <p>No bookable assets yet.</p>
            <span>Click <strong>+ Create Asset(s)</strong> to add a type of asset, e.g. "Edit Suites", and how many of them exist.</span>
          </div>
        ) : (
          <div className="ba-grid">
            {assets.map(a => (
              <div key={a.id} className="ba-card">
                <div className="ba-card-name">{a.name}</div>
                <div className="ba-card-qty">{a.quantity} available</div>
                <div className="ba-card-field">
                  <label>Cost (£)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={a.cost}
                    disabled={!canUpdate}
                    onChange={e => handleFieldChange(a.id, 'cost', Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
                <div className="ba-card-field">
                  <label>Duration (hrs)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={a.duration}
                    disabled={!canUpdate}
                    onChange={e => handleFieldChange(a.id, 'duration', Math.max(0.5, parseFloat(e.target.value) || DEFAULT_DURATION))}
                  />
                </div>
                <button
                  className="ba-card-del"
                  disabled={!canDelete}
                  title={canDelete ? 'Delete' : "Your role doesn't have permission to delete assets"}
                  onClick={() => handleDelete(a.id)}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CreateAssetForm
          onCreate={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

export default BookableAssetsView
