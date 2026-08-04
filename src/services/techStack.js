export const TECH_STACK_DEFAULTS = {
  encoders: 0,              encodersCost: 0,
  decoders: 0,              decodersCost: 0,
  frameRateConverters: 0,   frameRateConvertersCost: 0,
  audioOffset: 0,           audioOffsetCost: 0,
  outgoingIdents: 0,        outgoingIdentsCost: 0,
  productionBooths: 16,     productionBoothsCost: 0,
  studios: 5,               studiosCost: 2000,
  obUnits: 8,               obUnitsCost: 4000,
  recordPorts: 25,          recordPortsCost: 100,
  videoIncoming: 0,         videoIncomingCost: 0,
  videoOutgoing: 0,         videoOutgoingCost: 0,
  audioIncoming: 0,         audioIncomingCost: 0,
  audioOutgoing: 0,         audioOutgoingCost: 0,
  talkbackIncoming: 0,      talkbackIncomingCost: 0,
  talkbackOutgoing: 0,      talkbackOutgoingCost: 0,
  platformLines: {},
}

// Fields not yet saved to localStorage (e.g. a field added to DEFAULTS after
// this browser last visited Admin -> Tech Stack) fall back to the default
// here, instead of silently reading as 0/undefined wherever techStack is used.
export function loadTechStack() {
  try {
    return { ...TECH_STACK_DEFAULTS, ...JSON.parse(localStorage.getItem('admin_tech_stack') || '{}') }
  } catch {
    return { ...TECH_STACK_DEFAULTS }
  }
}
