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
  line = line.replace(/\.\s*$/, '').trim()
  const firstComma = line.indexOf(',')
  if (firstComma === -1) return null
  const name = line.substring(0, firstComma).trim()
  const rest = line.substring(firstComma + 1)

  // Crew counts
  const camMatch   = rest.match(/(\d+)\s+cameramen?/i)
  const audioMatch = rest.match(/(\d+)\s+audio\s+on\s+location/i)
  const evsMatch   = rest.match(/(\d+)\s+evs\s+operator/i)

  // Crew timing — appears as "N hours from start until N hour(s) after end" in crew section
  // Use a non-greedy search anchored to the crew portion (before the first comma after it)
  const crewSection = rest.split(',')[0]
  const crewTiming  = crewSection.match(/(\d+)\s+hours?\s+from\s+start\s+until\s+(\d+)\s+hours?\s+after\s+end/i)

  // Video lines
  const inVidMatch  = rest.match(/(\d+)\s+incoming\s+lines/i)
  const outVidMatch = rest.match(/(\d+)\s+outgoing\s+lines?\s+offset\s+(\d+)\s+hours?\s+from\s+start\s+until\s+(\d+)\s+hours?\s+after\s+finish/i)

  // Audio lines
  const inAudMatch  = rest.match(/(\d+)\s+incoming\s+audios?/i)
  const outAudMatch = rest.match(/(\d+)\s+outgoing\s+audios?,?\s+offset\s+(\d+)\s+hours?\s+from\s+start\s+until\s+(\d+)\s+hours?\s+after\s+end/i)

  // Production booth
  const boothMatch  = rest.match(/production\s+booth\s+set\s+to\s+(yes|no)/i)

  return {
    name,
    cameramen:             camMatch    ? parseInt(camMatch[1])             : 0,
    audioOnLocation:       audioMatch  ? parseInt(audioMatch[1])           : 0,
    evsOperator:           evsMatch    ? parseInt(evsMatch[1])             : 0,
    crewFrom:              crewTiming  ? -parseInt(crewTiming[1])          : 0,
    crewUntil:             crewTiming  ? parseInt(crewTiming[2])           : 0,
    incomingVideoLines:    inVidMatch  ? parseInt(inVidMatch[1])           : 0,
    outgoingVideoLines:    outVidMatch ? parseInt(outVidMatch[1])          : 0,
    videoFrom:             outVidMatch ? -parseInt(outVidMatch[2])         : 0,
    videoUntil:            outVidMatch ? parseInt(outVidMatch[3])          : 0,
    incomingAudioLines:    inAudMatch  ? parseInt(inAudMatch[1])           : 0,
    incomingTalkbackLines: 0,
    outgoingTalkbackLines: outAudMatch ? parseInt(outAudMatch[1])          : 0,
    audioFrom:             outAudMatch ? -parseInt(outAudMatch[2])         : 0,
    audioUntil:            outAudMatch ? parseInt(outAudMatch[3])          : 0,
    productionBooth:       boothMatch  ? boothMatch[1].toLowerCase() === 'yes' : false,
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

// --- Default patterns (Production page) ---
const COMP_NAME_TO_ID = {
  'efl league 1':          'league_one',
  'efl league 2':          'league_two',
  'el championship':       'championship',
  'gallaher premiership':  'gallagher_premiership',
  'gallagher premiership': 'gallagher_premiership',
  'wta tour':              'wta_tour',
  'atp tour':              'atp_tour',
  'premier league':        'premier_league',
}

function parseDefaultPatterns(lines, patterns) {
  const start = lines.findIndex(l => /production page/i.test(l) && /pattern/i.test(l))
  if (start === -1) return {}
  const patternByName = {}
  patterns.forEach((p, i) => { patternByName[p.name.toLowerCase()] = `pat_seed_${i + 1}` })
  const result = {}
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i].trim()
    if (!l) continue
    const m = l.match(/^(.+?)\s*=\s*(.+)$/)
    if (!m) break
    const compId = COMP_NAME_TO_ID[m[1].trim().toLowerCase()]
    const patName = m[2].trim().toLowerCase()
    const patId   = patternByName[patName]
      ?? Object.entries(patternByName).find(([k]) => k.includes(patName) || patName.includes(k))?.[1]
    if (compId && patId) result[compId] = patId
  }
  return result
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
const LINE_FIELD_MAP = {
  'video incoming':     'videoIncoming',
  'video outgoing':     'videoOutgoing',
  'talkback incoming':  'talkbackIncoming',
  'talkback outgoing':  'talkbackOutgoing',
  'audio incoming':     'audioIncoming',
  'audio outgoing':     'audioOutgoing',
  '2110':               'smpte2110',
}

const EQUIPMENT_MAP = {
  'encoders':              'encoders',
  'decoders':              'decoders',
  'frame rate converters': 'frameRateConverters',
  'audio offset':          'audioOffset',
  'outgoing idents':       'outgoingIdents',
  'production booths':     'productionBooths',
}

function normaliseName(name) {
  return name.toLowerCase().replace(/\s+/g, '')
}

function parseTechStack(lines, platforms) {
  const start = lines.findIndex(l => /tech stack/i.test(l))
  if (start === -1) return {}

  const idByName = {}
  platforms.forEach((name, i) => {
    idByName[normaliseName(name)] = `plat_seed_${i + 1}`
  })

  const platformLines = {}
  const equipment = { encoders: 0, decoders: 0, frameRateConverters: 0, audioOffset: 0, outgoingIdents: 0, productionBooths: 16 }
  let currentId = null

  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i].trim()
    if (!l) continue
    if (/production page/i.test(l)) break

    const platformHeader = l.match(/^for\s+(.+?)\s*box:?$/i)
    if (platformHeader) {
      const raw = normaliseName(platformHeader[1])
      currentId = idByName[raw]
        ?? Object.entries(idByName).find(([k]) => k.startsWith(raw) || raw.startsWith(k))?.[1]
        ?? null
      continue
    }

    if (/box$/i.test(l) && !/=/.test(l)) { currentId = null; continue }

    const fieldLine = l.match(/^(.+?)\s*=\s*(\d+)$/)
    if (!fieldLine) continue
    const key = fieldLine[1].toLowerCase().trim()
    const val = parseInt(fieldLine[2])

    if (currentId) {
      const mapped = LINE_FIELD_MAP[key]
      if (mapped) {
        if (!platformLines[currentId]) platformLines[currentId] = {}
        platformLines[currentId][mapped] = val
      }
    } else {
      const mapped = EQUIPMENT_MAP[key]
      if (mapped) equipment[mapped] = val
    }
  }

  return { ...equipment, platformLines }
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
const platforms       = parsePlatforms(lines)
const patterns        = parsePatterns(lines)
const defaultPatterns = parseDefaultPatterns(lines, patterns)
const staff           = parseStaff(lines)
const techStack       = parseTechStack(lines, platforms)

// --- Generate seedData.js ---
const platformObjs = platforms.map((name, i) =>
  `  { id: 'plat_seed_${i + 1}', name: ${JSON.stringify(name)}, defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },`
).join('\n')

const patternObjs = patterns.map((p, i) => `  {
    id: 'pat_seed_${i + 1}', name: ${JSON.stringify(p.name)},
    cameramen: ${p.cameramen}, evsOperator: ${p.evsOperator}, audioOnLocation: ${p.audioOnLocation},
    crewFrom: ${p.crewFrom}, crewUntil: ${p.crewUntil},
    incomingVideoLines: ${p.incomingVideoLines}, outgoingVideoLines: ${p.outgoingVideoLines},
    videoFrom: ${p.videoFrom}, videoUntil: ${p.videoUntil},
    incomingAudioLines: ${p.incomingAudioLines}, incomingTalkbackLines: 0, outgoingTalkbackLines: ${p.outgoingTalkbackLines},
    audioFrom: ${p.audioFrom}, audioUntil: ${p.audioUntil},
    productionBooth: ${p.productionBooth},
  },`).join('\n')

const defaultPatternLines = Object.entries(defaultPatterns)
  .map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`)
  .join('\n')

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

const DEFAULT_PATTERNS = {
${defaultPatternLines}
}

const STAFF = {
${staffLines}
}

const TECH_STACK = {
  encoders: ${techStack.encoders}, decoders: ${techStack.decoders}, frameRateConverters: ${techStack.frameRateConverters}, audioOffset: ${techStack.audioOffset}, outgoingIdents: ${techStack.outgoingIdents}, productionBooths: ${techStack.productionBooths},
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
  localStorage.setItem('rights_default_patterns', JSON.stringify(DEFAULT_PATTERNS))
  localStorage.setItem('seed_version', String(SEED_VERSION))
}
`

writeFileSync(seedPath, output)
const techCount = Object.keys(techStack.platformLines).length
console.log(`seedData.js regenerated (version ${newVersion}) — ${platforms.length} platforms, ${patterns.length} patterns, ${Object.values(staff).flat().length} staff, ${techCount} platform tech configs`)
