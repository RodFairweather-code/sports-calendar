const SEED_VERSION = 35

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
    id: 'pat_seed_1', name: "2 Cam Lower League",
    cameramen: 2, evsOperator: 1, audioOnLocation: 1,
    crewFrom: -2, crewUntil: 2,
    incomingVideoLines: 4, outgoingVideoLines: 2,
    videoFrom: -2, videoUntil: 2,
    incomingAudioLines: 6, incomingTalkbackLines: 0, outgoingTalkbackLines: 4,
    audioFrom: -2, audioUntil: 2,
    productionBooth: true,
  },
  {
    id: 'pat_seed_2', name: "4 Cam middle League",
    cameramen: 4, evsOperator: 2, audioOnLocation: 2,
    crewFrom: -3, crewUntil: 2,
    incomingVideoLines: 8, outgoingVideoLines: 4,
    videoFrom: -2, videoUntil: 2,
    incomingAudioLines: 8, incomingTalkbackLines: 0, outgoingTalkbackLines: 6,
    audioFrom: -2, audioUntil: 2,
    productionBooth: true,
  },
  {
    id: 'pat_seed_3', name: "8 Cam Feature Match",
    cameramen: 8, evsOperator: 4, audioOnLocation: 3,
    crewFrom: -4, crewUntil: 3,
    incomingVideoLines: 10, outgoingVideoLines: 4,
    videoFrom: -3, videoUntil: 2,
    incomingAudioLines: 12, incomingTalkbackLines: 0, outgoingTalkbackLines: 8,
    audioFrom: -3, audioUntil: 2,
    productionBooth: false,
  },
  {
    id: 'pat_seed_4', name: "250 Tennis",
    cameramen: 0, evsOperator: 1, audioOnLocation: 0,
    crewFrom: 0, crewUntil: 0,
    incomingVideoLines: 4, outgoingVideoLines: 2,
    videoFrom: -2, videoUntil: 2,
    incomingAudioLines: 6, incomingTalkbackLines: 0, outgoingTalkbackLines: 4,
    audioFrom: -2, audioUntil: 2,
    productionBooth: false,
  },
  {
    id: 'pat_seed_5', name: "Grand Slam Tennis",
    cameramen: 1, evsOperator: 1, audioOnLocation: 1,
    crewFrom: -2, crewUntil: 2,
    incomingVideoLines: 8, outgoingVideoLines: 4,
    videoFrom: -2, videoUntil: 2,
    incomingAudioLines: 12, incomingTalkbackLines: 0, outgoingTalkbackLines: 8,
    audioFrom: -2, audioUntil: 2,
    productionBooth: false,
  },
]

const DEFAULT_PATTERNS = {
  league_one: "pat_seed_2",
  league_two: "pat_seed_1",
  championship: "pat_seed_2",
  gallagher_premiership: "pat_seed_2",
  wta_tour: "pat_seed_4",
  atp_tour: "pat_seed_4",
  premier_league: "pat_seed_3",
}

const STAFF = {
  cameramen: ["Arthur D","Brian C","Charlie","Denise","Fiona"],
  onsiteAudio: ["Gus","Helen","James","Ken"],
  onsiteProductionManager: ["Louise","Max","Neil","Oscar"],
  director: ["Aurelia Thorne","Kaelen Vance","Seraphina Vex","Bastian Vance","Lyra Nightshade","Orion Vance","Isolde Moros","Dashiell Vance","Elara Fray","Talon Vance","Calliope Moon","Magnus Vance","Vespera Kross","Silas Vance","Elysia Dawnwalker","Persephone Gale","Darrow Vanc","Penny","Qudos","Rad","Stan","Vanessa"],
  producer: ["Abagail","Benny","Cammy","Donna","Felicity"],
  commentator: ["Graham","Henry","Indya","Jules","Killian"],
  evsOperator: ["Elara Moonbrook","Kaelen Thorne","Selene Valerius","Garrick Stoneheart","Lyra Silverleaf","Theron Blackwood","Mirelle Starling","Alaric Voss","Seraphina Dawn","Zephyr Oakhaven","Isadora Nightshade","Cassian Reed","Elowen Frost","Roland Vance","Thalassa Blue","Dorian Graymalkin","Nyx Shadowstep","Soren Whitethorn","Juniper Ash","Bastian Gale","Liam","Mike","Nola","Olivia","Peter","Rowena"],
  graphicsOperator: ["Aris Thorne","Elara Vance","Kaelen Reed","Selene Marlo","Jace Halloway","Mira Sterling","Orion Kade","Lyra Belrose","Silas Fenwick","Talia Vane","Finnian Cole","Elowen Frost","Cassian Dax","Isolda Vale","Dorian Grey","Althea Rowe","Gideon Hayes","Seraphina Blythe","Lucian Crane","Evadne Ward","Susan","Tabatha","Xavier","Aaron","Bonnie","Chloe","Thalia"],
}

const DEFAULT_STAFF_COSTS = {
  defaults: {
  cameramen: 250,
  onsiteAudio: 230,
  onsiteProductionManager: 350,
  director: 400,
  producer: 375,
  commentator: 250,
  evsOperator: 200,
  graphicsOperator: 150,
  },
  overrides: {},
}

const TECH_STACK = {
  encoders: 24, encodersCost: 100,
  decoders: 24, decodersCost: 120,
  frameRateConverters: 4, frameRateConvertersCost: 500,
  audioOffset: 8, audioOffsetCost: 50,
  outgoingIdents: 8, outgoingIdentsCost: 10,
  productionBooths: 16, productionBoothsCost: 500,
  videoIncoming: 200, videoIncomingCost: 20,
  videoOutgoing: 150, videoOutgoingCost: 25,
  audioIncoming: 50, audioIncomingCost: 10,
  audioOutgoing: 75, audioOutgoingCost: 15,
  talkbackIncoming: 125, talkbackIncomingCost: 20,
  talkbackOutgoing: 125, talkbackOutgoingCost: 22,
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
  localStorage.setItem('rights_default_patterns', JSON.stringify(DEFAULT_PATTERNS))
  localStorage.setItem('admin_staff_costs', JSON.stringify(DEFAULT_STAFF_COSTS))
  localStorage.setItem('seed_version', String(SEED_VERSION))
}
