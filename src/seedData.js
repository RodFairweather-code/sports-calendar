const SEED_VERSION = 2

const PLATFORMS = [
  { id: 'plat_seed_1', name: 'BBC 1',       defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_2', name: 'ITV Ealing',  defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_3', name: 'Sky MCR',     defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_4', name: 'TAMS',        defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_5', name: 'NBCU',        defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_6', name: 'Reuters',     defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
]

const PATTERNS = [
  {
    id: 'pat_seed_1',
    name: '2 Cam Lower League',
    cameramen: 2, evsOperator: false,
    crewFrom: -2, crewUntil: 2,
    incomingVideoLines: 4, outgoingVideoLines: 2,
    videoFrom: -2, videoUntil: 2,
    incomingAudioLines: 6, incomingTalkbackLines: 0, outgoingTalkbackLines: 4,
    audioFrom: -2, audioUntil: 2,
  },
  {
    id: 'pat_seed_2',
    name: '4 Cam Middle League',
    cameramen: 4, evsOperator: false,
    crewFrom: -3, crewUntil: 2,
    incomingVideoLines: 8, outgoingVideoLines: 4,
    videoFrom: -2, videoUntil: 2,
    incomingAudioLines: 8, incomingTalkbackLines: 0, outgoingTalkbackLines: 6,
    audioFrom: -2, audioUntil: 2,
  },
  {
    id: 'pat_seed_3',
    name: '8 Cam Feature Match',
    cameramen: 8, evsOperator: false,
    crewFrom: -4, crewUntil: 3,
    incomingVideoLines: 10, outgoingVideoLines: 4,
    videoFrom: -3, videoUntil: 2,
    incomingAudioLines: 12, incomingTalkbackLines: 0, outgoingTalkbackLines: 8,
    audioFrom: -3, audioUntil: 2,
  },
]

const STAFF = {
  cameramen:               ['Arthur', 'Brian', 'Charlie', 'Denise', 'Fiona'],
  onsiteAudio:             ['Gus', 'Helen', 'James', 'Ken'],
  onsiteProductionManager: ['Louise', 'Max', 'Neil', 'Oscar'],
  director:                ['Penny', 'Qudos', 'Rad', 'Stan', 'Vanessa'],
  producer:                [],
  commentator:             [],
  evsOperator:             [],
  graphicsOperator:        [],
}

export function seedLocalStorage() {
  const seededVersion = parseInt(localStorage.getItem('seed_version') || '0', 10)
  if (seededVersion >= SEED_VERSION) return

  localStorage.setItem('admin_platforms', JSON.stringify(PLATFORMS))
  localStorage.setItem('admin_patterns', JSON.stringify(PATTERNS))
  localStorage.setItem('admin_staff', JSON.stringify(STAFF))
  localStorage.setItem('seed_version', String(SEED_VERSION))
}
