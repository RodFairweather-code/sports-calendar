// Derive the required capability from a pattern.
// The cameramen count is the primary signal; requiredCapability overrides for
// non-camera types (studio, tennis, rugby) where cameramen count is 0.
export function deriveRequiredCap(pattern) {
  if (!pattern) return ''
  const cams = pattern.cameramen || 0
  if (cams >= 8) return 'cam8plus'
  if (cams >= 4) return 'cam4'
  if (cams >= 1) return 'cam2'
  // No cameras — fall back to explicit field (tennis, rugby, studio etc.)
  return pattern.requiredCapability || ''
}

// Filter a list of staff names to those who can fulfil the required capability.
// Higher capabilities imply lower ones: 8 Cam+ can do 4 Cam or 2 Cam jobs;
// 4 Cam can do 2 Cam jobs. Studio / Tennis / Rugby are exact matches.
export function capable(names, profiles, roleKey, requiredCap) {
  if (!requiredCap) return names
  const rp = profiles[roleKey] || {}
  return names.filter(n => {
    const caps = rp[n]?.caps
    if (!caps) return false
    if (requiredCap === 'cam2')     return caps.cam2 || caps.cam4 || caps.cam8plus
    if (requiredCap === 'cam4')     return caps.cam4 || caps.cam8plus
    if (requiredCap === 'cam8plus') return caps.cam8plus
    return caps[requiredCap] === true  // studio, tennis, rugby
  })
}

// Sort a list of names so contracted staff appear before freelancers.
// Preserves relative order within each group.
export function staffFirst(names, profiles, roleKey) {
  const rp = profiles[roleKey] || {}
  return [...names].sort((a, b) => {
    const aStaff = rp[a]?.isStaff !== false ? 1 : 0  // default true if unset
    const bStaff = rp[b]?.isStaff !== false ? 1 : 0
    return bStaff - aStaff
  })
}

// Order a capable pool for auto-allocation so work spreads evenly instead of
// always starting from the top of the list. Priority:
//   1. contracted staff before freelancers (same tiering as staffFirst)
//   2. fewest existing assignments first — this is what rotates people through
//   3. original list order, as a stable tie-break
// `loadMap` is name -> count of jobs already held in this role.
export function orderByLoad(names, profiles, roleKey, loadMap) {
  const rp = profiles[roleKey] || {}
  return names
    .map((n, i) => ({
      n,
      i,
      staffRank: rp[n]?.isStaff !== false ? 0 : 1,
      load: loadMap.get(n) || 0,
    }))
    .sort((a, b) => a.staffRank - b.staffRank || a.load - b.load || a.i - b.i)
    .map(x => x.n)
}
