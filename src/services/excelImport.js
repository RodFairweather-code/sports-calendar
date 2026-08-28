import * as XLSX from 'xlsx'

const HEADER_NAMES = ['Date', 'Time', 'Duration', 'Venue', 'Home Team', 'Away Team']

const PALETTE = [
  '#1e5f74', '#7a1f8f', '#b8860b', '#2e7d32', '#c0392b',
  '#5d4037', '#00695c', '#4527a0', '#ad1457', '#37474f',
]

function pad2(n) {
  return String(n).padStart(2, '0')
}

// SheetJS builds date cells with the local Date constructor (new Date(y, m, d, ...)),
// so read them back with local getters too — mixing local-construct with UTC-read
// shifts the date by the browser's timezone offset (e.g. a day back in BST).
function dateCellToISODate(value) {
  if (value instanceof Date && !isNaN(value)) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
  }
  if (typeof value === 'string' && value.trim()) {
    // Date-only ISO strings parse as UTC per spec, so read those back in UTC.
    const d = new Date(value.trim())
    if (!isNaN(d)) return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
  }
  return null
}

// Accepts "13.30.00", "13:30:00", "13:30", an Excel time-fraction number, or a Date.
function timeCellToHHMM(value) {
  if (value instanceof Date && !isNaN(value)) {
    return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`
  }
  if (typeof value === 'number' && isFinite(value)) {
    const totalMinutes = Math.round(value * 24 * 60)
    return `${pad2(Math.floor(totalMinutes / 60) % 24)}:${pad2(totalMinutes % 60)}`
  }
  if (typeof value === 'string' && value.trim()) {
    const parts = value.trim().replace(/\./g, ':').split(':')
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    if (!isNaN(h) && !isNaN(m)) return `${pad2(h)}:${pad2(m)}`
  }
  return null
}

export function addMinutesToLocalDatetime(dateStr, timeStr, minutesToAdd) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [h, m] = timeStr.split(':').map(Number)
  const base = new Date(Date.UTC(year, month - 1, day, h, m))
  base.setUTCMinutes(base.getUTCMinutes() + minutesToAdd)
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(base.getUTCDate())}T${pad2(base.getUTCHours())}:${pad2(base.getUTCMinutes())}`
}

function findLabelValue(grid, label) {
  const row = grid.find(r => String(r[0] ?? '').trim().toLowerCase() === label.toLowerCase())
  return row ? String(row[1] ?? '').trim() : ''
}

function findHeaderRowIndex(grid) {
  return grid.findIndex(r =>
    HEADER_NAMES.every(name => r.some(cell => String(cell ?? '').trim().toLowerCase() === name.toLowerCase()))
  )
}

export function colorForName(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

// Reads the fixed template:
//   Sport | <name>
//   Competition | <name>
//   (blank)
//   Date | Time | Duration | Venue | Home Team | Away Team
//   ...data rows...
export async function parseImportWorkbook(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })

  const sportName = findLabelValue(grid, 'Sport')
  const competitionName = findLabelValue(grid, 'Competition')

  if (!sportName || !competitionName) {
    return { sportName, competitionName, rows: [], warnings: [], error: 'Could not find "Sport" and "Competition" rows near the top of the sheet.' }
  }

  const headerIdx = findHeaderRowIndex(grid)
  if (headerIdx === -1) {
    return { sportName, competitionName, rows: [], warnings: [], error: `Could not find a header row with columns: ${HEADER_NAMES.join(', ')}.` }
  }

  const headerRow = grid[headerIdx]
  const colIndex = {}
  for (const name of HEADER_NAMES) {
    colIndex[name] = headerRow.findIndex(c => String(c ?? '').trim().toLowerCase() === name.toLowerCase())
  }

  const rows = []
  const warnings = []

  for (let i = headerIdx + 1; i < grid.length; i++) {
    const r = grid[i]
    if (!r || r.every(c => c === null || c === '')) continue

    const rowNum = i + 1
    const isoDate = dateCellToISODate(r[colIndex['Date']])
    const time = timeCellToHHMM(r[colIndex['Time']])
    const durationHours = Number(r[colIndex['Duration']])
    const venue = r[colIndex['Venue']] != null ? String(r[colIndex['Venue']]).trim() : ''
    const homeTeam = r[colIndex['Home Team']] != null ? String(r[colIndex['Home Team']]).trim() : ''
    const awayTeam = r[colIndex['Away Team']] != null ? String(r[colIndex['Away Team']]).trim() : ''

    if (!isoDate || !time) {
      warnings.push(`Row ${rowNum}: skipped — could not read a valid date/time.`)
      continue
    }
    if (!homeTeam || !awayTeam) {
      warnings.push(`Row ${rowNum}: skipped — missing Home Team or Away Team.`)
      continue
    }

    rows.push({
      date: isoDate,
      time,
      durationHours: isFinite(durationHours) && durationHours > 0 ? durationHours : null,
      venue,
      homeTeam,
      awayTeam,
      title: `${homeTeam} v ${awayTeam}`,
    })
  }

  if (rows.length === 0) {
    return { sportName, competitionName, rows: [], warnings, error: 'No valid event rows were found in this file.' }
  }

  return { sportName, competitionName, rows, warnings, error: null }
}

export function buildImportedEventFromRow(row, competition) {
  const start = `${row.date}T${row.time}`
  const end = row.durationHours ? addMinutesToLocalDatetime(row.date, row.time, Math.round(row.durationHours * 60)) : undefined

  return {
    id: `imported|${crypto.randomUUID()}`,
    title: row.title,
    start,
    end,
    allDay: false,
    backgroundColor: competition.color,
    borderColor: competition.color,
    extendedProps: {
      competitionId: competition.id,
      competitionName: competition.name,
      governingBody: competition.governingBody,
      sport: competition.sport,
      homeTeam: row.homeTeam || null,
      awayTeam: row.awayTeam || null,
      homeScore: null,
      awayScore: null,
      venue: row.venue || null,
      round: null,
    },
  }
}
