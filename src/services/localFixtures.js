import eplFixtures from '../data/fixtures/epl_2025.json'
import champFixtures from '../data/fixtures/championship_2025.json'
import leagueOneFixtures from '../data/fixtures/league_one_2025.json'
import leagueTwoFixtures from '../data/fixtures/league_two_2025.json'
import f1Fixtures from '../data/fixtures/f1_2026.json'
import premRugbyFixtures from '../data/fixtures/premiership_rugby_2025.json'
import atpFixtures from '../data/fixtures/atp_2026.json'
import wtaFixtures from '../data/fixtures/wta_2026.json'
import scottishPremFixtures from '../data/fixtures/scottish_premiership_2026.json'
import championship2627Fixtures from '../data/fixtures/championship_2026.json'
import leagueOne2627Fixtures from '../data/fixtures/league_one_2026.json'
import leagueTwo2627Fixtures from '../data/fixtures/league_two_2026.json'
import rugbyWorldCupFixtures from '../data/fixtures/rugby_world_cup_2027.json'
import nflFixtures from '../data/fixtures/nfl_2026.json'

const REGISTRY = {
  epl_2025: eplFixtures,
  championship_2025: champFixtures,
  league_one_2025: leagueOneFixtures,
  league_two_2025: leagueTwoFixtures,
  f1_2026: f1Fixtures,
  premiership_rugby_2025: premRugbyFixtures,
  atp_2026: atpFixtures,
  wta_2026: wtaFixtures,
  scottish_premiership_2026: scottishPremFixtures,
  championship_2026: championship2627Fixtures,
  league_one_2026: leagueOne2627Fixtures,
  league_two_2026: leagueTwo2627Fixtures,
  rugby_world_cup_2027: rugbyWorldCupFixtures,
  nfl_2026: nflFixtures,
}

const END_DATE = '2027-12-31'

export function getLocalFixtures(key) {
  const data = REGISTRY[key]
  if (!data) return []
  return data.filter(f => f.start && f.start.slice(0, 10) <= END_DATE)
}
