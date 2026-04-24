const PALETTE = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#e91e63', '#00bcd4', '#ff5722',
  '#607d8b', '#795548', '#4caf50', '#2196f3', '#ff9800',
]

let index = 0
const map = new Map()

export function getLeagueColor(leagueId) {
  if (!map.has(leagueId)) {
    map.set(leagueId, PALETTE[index % PALETTE.length])
    index++
  }
  return map.get(leagueId)
}

export function releaseLeagueColor(leagueId) {
  map.delete(leagueId)
}
