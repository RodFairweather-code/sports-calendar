const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3'
const END_DATE = '2026-12-31'

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// TheSportsDB returns leagues under "countries" (some older endpoints use "countrys" or "leagues")
function extractLeagues(data) {
  return data.countries || data.countrys || data.leagues || []
}

export async function getAllSports() {
  const data = await apiFetch('/all_sports.php')
  return (data.sports || []).sort((a, b) => a.strSport.localeCompare(b.strSport))
}

// Resolve a TheSportsDB league ID by searching for a league name.
// Tries country+sport first for a narrower result, then sport-only.
export async function findLeagueByName(name, sport, country) {
  const paths = []
  if (country) paths.push(`/search_all_leagues.php?s=${encodeURIComponent(sport)}&c=${encodeURIComponent(country)}`)
  paths.push(`/search_all_leagues.php?s=${encodeURIComponent(sport)}`)

  const nameLower = name.toLowerCase()

  for (const path of paths) {
    try {
      const data = await apiFetch(path)
      const leagues = extractLeagues(data)
      if (!leagues.length) continue

      const exact = leagues.find(l => l.strLeague.toLowerCase() === nameLower)
      if (exact) return exact.idLeague

      const partial = leagues.find(l =>
        l.strLeague.toLowerCase().includes(nameLower) ||
        nameLower.includes(l.strLeague.toLowerCase())
      )
      if (partial) return partial.idLeague
    } catch { /* try next path */ }
  }
  return null
}

// Returns all leagues for a sport grouped into { name (country), competitions[] }.
// Used as fallback when a sport has no static governing body data.
export async function getLeaguesGroupedByCountry(sport) {
  try {
    const data = await apiFetch(`/search_all_leagues.php?s=${encodeURIComponent(sport)}`)
    const leagues = extractLeagues(data)

    const map = {}
    for (const league of leagues) {
      const country = league.strCountry || 'International'
      if (!map[country]) map[country] = { name: country, competitions: [] }
      map[country].competitions.push({ name: league.strLeague, id: league.idLeague })
    }

    return Object.values(map)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(g => ({
        ...g,
        competitions: g.competitions.sort((a, b) => a.name.localeCompare(b.name)),
      }))
  } catch {
    return []
  }
}

async function getEventsBySeason(leagueId, season) {
  try {
    const data = await apiFetch(`/eventsseason.php?id=${leagueId}&s=${encodeURIComponent(season)}`)
    return data.events || []
  } catch {
    return []
  }
}

async function getNextEvents(leagueId) {
  try {
    const data = await apiFetch(`/eventsnextleague.php?id=${leagueId}`)
    return data.events || []
  } catch {
    return []
  }
}

async function getPastEvents(leagueId) {
  try {
    const data = await apiFetch(`/eventspastleague.php?id=${leagueId}`)
    return data.events || []
  } catch {
    return []
  }
}

export async function fetchLeagueEvents(leagueId) {
  const seasons = ['2025-2026', '2026-2027', '2025', '2026']

  // Season endpoint returns league-specific data. The eventsnextleague /
  // eventspastleague endpoints return the same League-1 sample fixtures for
  // every ID on the free tier, so only use them as a last resort.
  const seasonResults = await Promise.allSettled(
    seasons.map(s => getEventsBySeason(leagueId, s))
  )

  const seen = new Set()
  const allEvents = []

  for (const result of seasonResults) {
    if (result.status !== 'fulfilled') continue
    for (const event of result.value) {
      if (!event.idEvent || seen.has(event.idEvent)) continue
      if (!event.dateEvent || event.dateEvent > END_DATE) continue
      seen.add(event.idEvent)
      allEvents.push(event)
    }
  }

  // Fall back to next/past only when the season search found nothing
  if (allEvents.length === 0) {
    const fallback = await Promise.allSettled([
      getNextEvents(leagueId),
      getPastEvents(leagueId),
    ])
    for (const result of fallback) {
      if (result.status !== 'fulfilled') continue
      for (const event of result.value) {
        if (!event.idEvent || seen.has(event.idEvent)) continue
        if (!event.dateEvent || event.dateEvent > END_DATE) continue
        seen.add(event.idEvent)
        allEvents.push(event)
      }
    }
  }

  return allEvents.sort((a, b) => a.dateEvent.localeCompare(b.dateEvent))
}
