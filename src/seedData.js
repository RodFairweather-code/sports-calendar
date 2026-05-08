const SEED_VERSION = 13

const PLATFORMS = [
  { id: 'plat_seed_1', name: "BBC 1", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_2', name: "ITV Ealing", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_3', name: "Sky MCR", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_4', name: "TAMS", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_5', name: "NBCU", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
  { id: 'plat_seed_6', name: "Reuters", defaultIncomingLine: '', defaultOutgoingLine: '', fourWires: 0, feedRouting: '', mcrPhone: '', editorialPhone: '' },
]

const PATTERNS = [

]

const STAFF = {
  cameramen: ["Arthur D","Brian C","Charlie","Denise","Fiona"],
  onsiteAudio: ["Gus","Helen","James","Ken"],
  onsiteProductionManager: ["Louise","Max","Neil","Oscar"],
  director: ["Penny","Qudos","Rad","Stan","Vanessa"],
  producer: ["Abagail","Benny","Cammy","Donna","Felicity"],
  commentator: ["Graham","Henry","Indya","Jules","Killian"],
  evsOperator: ["Liam","Mike","Nola","Olivia","Peter","Rowena"],
  graphicsOperator: ["Susan","Tabatha","Xavier","Aaron","Bonnie","Chloe","Thalia"],
}

const TECH_STACK = {
  encoders: 24, decoders: 24, frameRateConverters: 4, audioOffset: 8, outgoingIdents: 8,
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
