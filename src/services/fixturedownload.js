const BASE = 'https://fixturedownload.com/feed/json'
const END_DATE = '2026-12-31'

// Parses "DD/MM/YYYY HH:MM:SS" (UTC) → "YYYY-MM-DDTHH:MM:SSZ"
function parseDateUtc(str) {
  if (!str) return null
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}T${m[4]}Z`
  // fall back to ISO if fixturedownload ever changes format
  const d = new Date(str)
  return isNaN(d) ? null : d.toISOString()
}

async function fetchSlug(slug) {
  const res = await fetch(`${BASE}/${slug}`)
  if (res.status === 404) return []   // slug doesn't exist yet (future season)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${slug}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// Fetch all fixtures for a competition across its season slugs.
// Returns fixtures sorted by date, filtered to END_DATE.
export async function fetchCompetitionFixtures(slugs) {
  if (!slugs || slugs.length === 0) return []

  const results = await Promise.allSettled(slugs.map(fetchSlug))

  const seen = new Set()
  const fixtures = []

  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    for (const f of result.value) {
      const dateIso = parseDateUtc(f.DateUtc)
      if (!dateIso || dateIso.slice(0, 10) > END_DATE) continue
      const key = `${f.HomeTeam}|${f.AwayTeam}|${f.DateUtc}`
      if (seen.has(key)) continue
      seen.add(key)
      fixtures.push({ ...f, _dateIso: dateIso })
    }
  }

  return fixtures.sort((a, b) => a._dateIso.localeCompare(b._dateIso))
}
