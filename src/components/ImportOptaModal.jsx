import { useState } from 'react'

function ImportOptaModal({ onConnect, onClose }) {
  const [accountId, setAccountId] = useState('')
  const [apiKey, setApiKey] = useState('')

  const canConnect = accountId.trim() && apiKey.trim()

  function handleConnect() {
    if (!canConnect) return
    onConnect({ accountId: accountId.trim(), apiKey: apiKey.trim() })
  }

  return (
    <div className="excel-modal-backdrop" onClick={onClose}>
      <div className="excel-modal-dialog" onClick={e => e.stopPropagation()}>
        <h3>Please enter details of your Opta Account</h3>
        <p className="import-hint">
          Connect your Opta account to import fixtures and results into the calendar.
        </p>

        <div className="import-grid">
          <div className="import-field">
            <label htmlFor="opta-account-id">Account ID / Username</label>
            <input
              id="opta-account-id"
              type="text"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              autoFocus
            />
          </div>
          <div className="import-field">
            <label htmlFor="opta-api-key">API Key / Password</label>
            <input
              id="opta-api-key"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
          </div>
        </div>

        <div className="unsaved-dialog-actions">
          <button className="unsaved-btn unsaved-btn--cancel" onClick={onClose}>Cancel</button>
          <button
            className="unsaved-btn unsaved-btn--save"
            disabled={!canConnect}
            onClick={handleConnect}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImportOptaModal
