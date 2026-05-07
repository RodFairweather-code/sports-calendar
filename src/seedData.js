const SEED_VERSION = 8

const PLATFORMS = [
  { id: 'plat_seed_1', name: "BBC 1", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_2', name: "ITV Ealing", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_3', name: "Sky MCR", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_4', name: "TAMS", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_5', name: "NBCU", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_6', name: "Reuters", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
]

const PATTERNS = [
  {
    id: 'pat_seed_1',
    name: "2 Cam Lower League",
    cameramen: 2, evsOperator: false,
    crewFrom: -2, crewUntil: 2,
    incomingVideoLines: 4, outgoingVideoLines: 2,
    videoFrom: -2, videoUntil: 2,
    incomingAudioLines: 6, incomingTalkbackLines: 0, outgoingTalkbackLines: 4,
    audioFrom: -2, audioUntil: 2,
  },
  {
    id: 'pat_seed_2',
    name: "4 Cam middle League",
    cameramen: 4, evsOperator: false,
    crewFrom: -3, crewUntil: 2,
    incomingVideoLines: 8, outgoingVideoLines: 4,
    videoFrom: -2, videoUntil: 2,
    incomingAudioLines: 8, incomingTalkbackLines: 0, outgoingTalkbackLines: 6,
    audioFrom: -2, audioUntil: 2,
  },
  {
    id: 'pat_seed_3',
    name: "8 Cam Feature Match",
    cameramen: 8, evsOperator: false,
    crewFrom: -4, crewUntil: 3,
    incomingVideoLines: 10, outgoingVideoLines: 4,
    videoFrom: -3, videoUntil: 2,
    incomingAudioLines: 12, incomingTalkbackLines: 0, outgoingTalkbackLines: 8,
    audioFrom: -3, audioUntil: 2,
  },
]

const STAFF = {
  cameramen: ["Arthur D","Brian","Charlie","Denise","Fiona"],
  onsiteAudio: ["Gus","Helen","James","Ken"],
  onsiteProductionManager: ["Louise","Max","Neil","Oscar"],
  director: ["Penny","Qudos","Rad","Stan","Vanessa"],
  producer: ["Abagail","Benny","Cammy","Donna","Felicity"],
  commentator: ["Graham","Henry","Indya","Jules","Killian"],
  evsOperator: ["Liam","Mike","Nola","Olivia","Peter","Rowena"],
  graphicsOperator: ["Susan","Tabatha","Xavier","Aaron","Bonnie","Chloe","Thalia"],
}

const TECH_STACK = {
  encoders: 0, decoders: 0, frameRateConverters: 0, audioOffset: 0, outgoingIdents: 0,
  platformLines: {
    "plat_seed_1": {"videoIncoming":8,"videoOutgoing":16,"talkbackIncoming":24,"talkbackOutgoing":16,"smpte2110":120},
    "plat_seed_2": {"videoIncoming":16,"videoOutgoing":24,"talkbackIncoming":42,"talkbackOutgoing":24,"smpte2110":80},
    "plat_seed_3": {"videoIncoming":12,"videoOutgoing":12,"talkbackIncoming":36,"talkbackOutgoing":21,"smpte2110":160},
    "plat_seed_4": {"videoIncoming":0,"videoOutgoing":24,"talkbackIncoming":12,"talkbackOutgoing":12,"smpte2110":56},
    "plat_seed_5": {"videoIncoming":4,"videoOutgoing":8,"talkbackIncoming":8,"talkbackOutgoing":8,"smpte2110":180},
    "plat_seed_6": {"videoIncoming":2,"videoOutgoing":4,"talkbackIncoming":4,"talkbackOutgoing":12,"smpte2110":240},
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
