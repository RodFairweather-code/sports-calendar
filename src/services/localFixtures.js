import eplFixtures from '../data/fixtures/epl_2025.json'
import champFixtures from '../data/fixtures/championship_2025.json'
import leagueOneFixtures from '../data/fixtures/league_one_2025.json'
import leagueTwoFixtures from '../data/fixtures/league_two_2025.json'
import f1Fixtures from '../data/fixtures/f1_2026.json'
import premRugbyFixtures from '../data/fixtures/premiership_rugby_2025.json'
import atpFixtures from '../data/fixtures/atp_2026.json'
import wtaFixtures from '../data/fixtures/wta_2026.json'

const REGISTRY = {
  epl_2025: eplFixtures,
  championship_2025: champFixtures,
  league_one_2025: leagueOneFixtures,
  league_two_2025: leagueTwoFixtures,
  f1_2026: f1Fixtures,
  premiership_rugby_2025: premRugbyFixtures,
  atp_2026: atpFixtures,
  wta_2026: wtaFixtures,
}

const END_DATE = '2026-12-31'

export function getLocalFixtures(key) {
  const data = REGISTRY[key]
  if (!data) return []
  return data.filter(f => f.start && f.start.slice(0, 10) <= END_DATE)
}
