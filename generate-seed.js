import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const txtPath = join(__dirname, 'Start data.txt')
const seedPath = join(__dirname, 'src', 'seedData.js')

const txt = readFileSync(txtPath, 'utf8')
const lines = txt.split(/\r?\n/)

// --- Platforms ---
function parsePlatforms(lines) {
  const start = lines.findIndex(l => /platforms in the admin/i.test(l))
  if (start === -1) return []
  const result = []
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i].trim()
    if (/patterns in the admin/i.test(l) || /staff page/i.test(l)) break
    if (l && !/^add the following/i.test(l)) result.push(l)
  }
  return result
}

// --- Patterns ---
function parsePatternLine(line) {
  line = line.replace(/\.\s*$/, '')
  const firstComma = line.indexOf(',')
  if (firstComma === -1) return null
  const name = line.substring(0, firstComma).trim()
  const rest = line.substring(firstComma + 1)

  const cam    = rest.match(/(\d+)\s+cameramen?\s+(\d+)\s+hours?\s+from\s+start\s+until\s+(\d+)\s+hours?\s+after\s+end/i)
  const inVid  = rest.match(/(\d+)\s+incoming\s+lines/i)
  const outVid = rest.match(/(\d+)\s+outgoing\s+lines?\s+offset\s+(\d+)\s+hours?\s+from\s+start\s+until\s+(\d+)\s+hours?\s+after\s+finish/i)
  const inAud  = rest.match(/(\d+)\s+incoming\s+audios/i)
  const outAud = rest.match(/(\d+)\s+outgoing\s+audios?,?\s+offset\s+(\d+)\s+hours?\s+from\s+start\s+until\s+(\d+)\s+hours?\s+after\s+end/i)

  if (!cam) return null
  return {
    name,
    cameramen: parseInt(cam[1]),
    evsOperator: false,
    crewFrom: -parseInt(cam[2]),
    crewUntil: parseInt(cam[3]),
    incomingVideoLines:    inVid  ? parseInt(inVid[1])   : 0,
    outgoingVideoLines:    outVid ? parseInt(outVid[1])  : 0,
    videoFrom:             outVid ? -parseInt(outVid[2]) : 0,
    videoUntil:            outVid ? parseInt(outVid[3])  : 0,
    incomingAudioLines:    inAud  ? parseInt(inAud[1])   : 0,
    incomingTalkbackLines: 0,
    outgoingTalkbackLines: outAud ? parseInt(outAud[1])  : 0,
    audioFrom:             outAud ? -parseInt(outAud[2]) : 0,
    audioUntil:            outAud ? parseInt(outAud[3])  : 0,
  }
}

function parsePatterns(lines) {
  const start = lines.findIndex(l => /patterns in the admin/i.test(l))
  if (start === -1) return []
  const result = []
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i].trim()
    if (/staff page/i.test(l)) break
    if (l && !/^add the following/i.test(l)) result.push(l)
  }
  return result.map(parsePatternLine).filter(Boolean)
}

// --- Staff ---
const ROLE_MAP = {
  'cameramen':                 'cameramen',
  'onsite audio':              'onsiteAudio',
  'onsite audiobox':           'onsiteAudio',
  'onsite production manager': 'onsiteProductionManager',
  'director':                  'director',
  'producers':                 'producer',
  'producer':                  'producer',
  'commentator':               'commentator',
  'commentators':              'commentator',
  'evs operator':              'evsOperator',
  'graphics operator':         'graphicsOperator',
}

function parseStaff(lines) {
  const start = lines.findIndex(l => /staff page/i.test(l))
  if (start === -1) return {}
  const staff = {
    cameramen: [], onsiteAudio: [], onsiteProductionManager: [],
    director: [], producer: [], commentator: [], evsOperator: [], graphicsOperator: [],
  }
  let currentRole = null
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i].trim()
    if (!l) continue
    if (/tech stack/i.test(l)) break
    const header = l.match(/in the (.+?)(?:\s+box|box),?\s+add:?/i)
    if (header) {
      currentRole = ROLE_MAP[header[1].toLowerCase().trim()] ?? null
      continue
    }
    if (/^in the admin/i.test(l) || /^add the following/i.test(l)) continue
    if (currentRole) staff[currentRole].push(l)
  }
  return staff
}

// --- Tech Stack ---
const FIELD_MAP = {
  'video incoming':    'videoIncoming',
  'video outgoing':   'videoOutgoing',
  'talkback incoming':'talkbackIncoming',
  'talkback outgoing':'talkbackOutgoing',
  'audio incoming':   'audioIncoming',
  'audio outgoing':   'audioOutgoing',
  '2110':             'smpte2110',
}

function normaliseName(name) {
  return name.toLowerCase().replace(/\s+/g, '')
}

function parseTechStack(lines, platforms) {
  const start = lines.findIndex(l => /tech stack/i.test(l))
  if (start === -1) return {}

  // Build a lookup from normalised platform name → platform id
  const idByName = {}
  platforms.forEach((name, i) => {
    idByName[normaliseName(name)] = `plat_seed_${i + 1}`
  })

  const platformLines = {}
  let currentId = null

  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i].trim()
    if (!l) continue

    // "For BBC1 box:" or "For ITV Ealing box:"
    const platformHeader = l.match(/^for\s+(.+?)\s*box:?$/i)
    if (platformHeader) {
      const raw = normaliseName(platformHeader[1])
      // Try exact match first, then partial
      currentId = idByName[raw]
        ?? Object.entries(idByName).find(([k]) => k.startsWith(raw) || raw.startsWith(k))?.[1]
        ?? null
      continue
    }

    // "Video incoming = 8"
    const fieldLine = l.match(/^(.+?)\s*=\s*(\d+)$/)
    if (fieldLine && currentId) {
      const key = FIELD_MAP[fieldLine[1].toLowerCase().trim()]
      if (key) {
        if (!platformLines[currentId]) platformLines[currentId] = {}
        platformLines[currentId][key] = parseInt(fieldLine[2])
      }
    }
  }

  return {
    encoders: 0, decoders: 0, frameRateConverters: 0, audioOffset: 0, outgoingIdents: 0,
    platformLines,
  }
}

// --- Read current version and bump ---
let currentVersion = 1
try {
  const existing = readFileSync(seedPath, 'utf8')
  const m = existing.match(/const SEED_VERSION\s*=\s*(\d+)/)
  if (m) currentVersion = parseInt(m[1])
} catch { /* file doesn't exist yet */ }
const newVersion = currentVersion + 1

// --- Build data ---
const platforms  = parsePlatforms(lines)
const patterns   = parsePatterns(lines)
const staff      = parseStaff(lines)
const techStack  = parseTechStack(lines, platforms)

// --- Generate seedData.js ---
const platformObjs = platforms.map((name, i) =>
  `  { id: 'plat_seed_${i + 1}', name: ${JSON.stringify(name)}, defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },`
).join('\n')

const patternObjs = patterns.map((p, i) => `  {
    id: 'pat_seed_${i + 1}',
    name: ${JSON.stringify(p.name)},
    cameramen: ${p.cameramen}, evsOperator: false,
    crewFrom: ${p.crewFrom}, crewUntil: ${p.crewUntil},
    incomingVideoLines: ${p.incomingVideoLines}, outgoingVideoLines: ${p.outgoingVideoLines},
    videoFrom: ${p.videoFrom}, videoUntil: ${p.videoUntil},
    incomingAudioLines: ${p.incomingAudioLines}, incomingTalkbackLines: 0, outgoingTalkbackLines: ${p.outgoingTalkbackLines},
    audioFrom: ${p.audioFrom}, audioUntil: ${p.audioUntil},
  },`).join('\n')

const staffLines = Object.entries(staff)
  .map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`)
  .join('\n')

const techStackLines = Object.entries(techStack.platformLines)
  .map(([id, fields]) => `    ${JSON.stringify(id)}: ${JSON.stringify(fields)},`)
  .join('\n')

const output = `const SEED_VERSION = ${newVersion}

const PLATFORMS = [
${platformObjs}
]

const PATTERNS = [
${patternObjs}
]

const STAFF = {
${staffLines}
}

const TECH_STACK = {
  encoders: 0, decoders: 0, frameRateConverters: 0, audioOffset: 0, outgoingIdents: 0,
  platformLines: {
${techStackLines}
  },
}

export function seedLocalStorage() {
  const seededVersion = parseInt(localStorage.getItem('seed_version') || '0', 10)
  if (seededVersion >= SEED_VERSION) return

  localStorage.setItem('admin_platforms', JSON.stringify(PLATFORMS))
  localStorage.setItem('admin_patterns', JSON.stringify(PATTERNS))
  localStorage.setItem('admin_staff', JSON.stringify(STAFF))
  localStorage.setItem('admin_tech_stack', JSON.stringify(TECH_STACK))
  localStorage.setItem('seed_version', String(SEED_VERSION))
}
`

writeFileSync(seedPath, output)
const techCount = Object.keys(techStack.platformLines).length
console.log(`seedData.js regenerated (version ${newVersion}) — ${platforms.length} platforms, ${patterns.length} patterns, ${Object.values(staff).flat().length} staff, ${techCount} platform tech configs`)
