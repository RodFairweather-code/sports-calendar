import { useRef, useState } from 'react'
import { parseImportWorkbook } from '../services/excelImport'

function formatDuration(hours) {
  if (!hours) return '—'
  return `${hours}h`
}

function ImportExcelModal({ onAccept, onClose }) {
  const [step, setStep] = useState('pick')
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState(null)
  const fileInputRef = useRef(null)

  function pickFile(f) {
    if (!f) return
    setFile(f)
    setError('')
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    pickFile(e.dataTransfer.files?.[0])
  }

  async function handleImportClick() {
    if (!file) return
    setError('')
    const result = await parseImportWorkbook(file)
    if (result.error) {
      setError(result.error)
      return
    }
    setParsed(result)
    setStep('preview')
  }

  function handleAccept() {
    onAccept({
      sportName: parsed.sportName,
      competitionName: parsed.competitionName,
      rows: parsed.rows,
    })
  }

  return (
    <div className="excel-modal-backdrop" onClick={onClose}>
      <div className="excel-modal-dialog" onClick={e => e.stopPropagation()}>
        {step === 'pick' && (
          <>
            <h3>Import from Excel</h3>
            <p className="import-hint">
              Select or drop an .xlsx file. It must have Sport and Competition rows near the top,
              followed by a Date / Time / Duration / Venue / Home Team / Away Team table.
            </p>

            <div
              className={`excel-dropzone${dragActive ? ' excel-dropzone--active' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={e => pickFile(e.target.files?.[0])}
              />
              {file ? (
                <span className="excel-dropzone-filename">{file.name}</span>
              ) : (
                <span>Drop a spreadsheet here, or click to browse</span>
              )}
            </div>

            {error && <div className="excel-modal-error">{error}</div>}

            <div className="unsaved-dialog-actions">
              <button className="unsaved-btn unsaved-btn--cancel" onClick={onClose}>Cancel</button>
              <button
                className="unsaved-btn unsaved-btn--save"
                disabled={!file}
                onClick={handleImportClick}
              >
                Import
              </button>
            </div>
          </>
        )}

        {step === 'preview' && parsed && (
          <>
            <h3>Review import — {parsed.competitionName}</h3>
            <p className="import-hint">
              Sport: <strong>{parsed.sportName}</strong> &nbsp;·&nbsp; Competition: <strong>{parsed.competitionName}</strong> &nbsp;·&nbsp; {parsed.rows.length} event(s) parsed
            </p>

            {parsed.warnings.length > 0 && (
              <div className="excel-modal-error">
                {parsed.warnings.map((w, i) => <div key={i}>{w}</div>)}
              </div>
            )}

            <div className="excel-preview-scroll">
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Venue</th>
                    <th>Event</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((r, i) => (
                    <tr key={i} className="ed-row">
                      <td className="ed-date">{r.date}</td>
                      <td className="ed-time">{r.time}</td>
                      <td>{formatDuration(r.durationHours)}</td>
                      <td>{r.venue || '—'}</td>
                      <td>{r.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="unsaved-dialog-actions">
              <button className="unsaved-btn unsaved-btn--cancel" onClick={onClose}>Cancel</button>
              <button className="unsaved-btn unsaved-btn--save" onClick={handleAccept}>Accept</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ImportExcelModal
