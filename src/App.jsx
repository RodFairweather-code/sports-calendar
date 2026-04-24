import { useState, useMemo } from 'react'
import CalendarView from './components/CalendarView'
import EditorialView from './components/EditorialView'
import EventPanel from './components/EventPanel'
import CompetitionToggles from './components/CompetitionToggles'
import { COMPETITIONS } from './data/competitions'
import { getLocalFixtures } from './services/localFixtures'
import './App.css'

const VIEWS = [
  { id: 'calendar',   label: 'Calendar' },
  { id: 'editorial',  label: 'Editorial Decisions' },
  { id: 'production', label: 'Production' },
  { id: 'technical',  label: 'Technical' },
  { id: 'assets',     label: 'Asset Management' },
]

const GOVERNING_BODIES = Object.values(
  COMPETITIONS.reduce((acc, comp) => {
    if (!acc[comp.governingBody]) {
      acc[comp.governingBody] = {
        id: comp.governingBody,
        name: comp.governingBody,
        color: comp.color,
        competitionIds: [],
      }
    }
    acc[comp.governingBody].competitionIds.push(comp.id)
    return acc
  }, {})
)

const ALL_EVENTS = COMPETITIONS.flatMap(comp => {
  return getLocalFixtures(comp.dataKey).map((f, i) => ({
    id: `${comp.id}|${i}|${f.start}`,
    title: f.title || `${f.homeTeam} v ${f.awayTeam}`,
    start: f.start,
    end: f.end || undefined,
    allDay: !f.start || f.start.length === 10,
    backgroundColor: comp.color,
    borderColor: comp.color,
    extendedProps: {
      competitionId: comp.id,
      competitionName: comp.name,
      governingBody: comp.governingBody,
      sport: comp.sport,
      homeTeam: f.homeTeam || null,
      awayTeam: f.awayTeam || null,
      homeScore: f.homeScore ?? null,
      awayScore: f.awayScore ?? null,
      venue: f.stadium || f.location || null,
      round: f.round || f.competition || null,
    },
  }))
})

function App() {
  const [view, setView] = useState('calendar')
  const [activeComps, setActiveComps] = useState(
    () => new Set(COMPETITIONS.map(c => c.id))
  )
  const [selectedEvent, setSelectedEvent] = useState(null)

  const visibleEvents = useMemo(
    () => ALL_EVENTS.filter(e => activeComps.has(e.extendedProps.competitionId)),
    [activeComps]
  )

  function toggleComp(id) {
    setActiveComps(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCalendarEventClick(eventId) {
    const event = visibleEvents.find(e => e.id === eventId)
    if (event) setSelectedEvent(event)
  }

  function toggleGoverningBody(bodyId) {
    const body = GOVERNING_BODIES.find(b => b.id === bodyId)
    if (!body) return
    const allActive = body.competitionIds.every(id => activeComps.has(id))
    setActiveComps(prev => {
      const next = new Set(prev)
      if (allActive) {
        body.competitionIds.forEach(id => next.delete(id))
      } else {
        body.competitionIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sports Broadcasting Calendar</h1>
        <nav className="nav-tabs">
          {VIEWS.map(v => (
            <button
              key={v.id}
              className={`nav-tab${view === v.id ? ' active' : ''}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <span className="header-version">v1.2</span>
      </header>

      {view === 'calendar' && (
        <CalendarView events={visibleEvents} onEventClick={handleCalendarEventClick} />
      )}
      {view === 'editorial' && (
        <EditorialView events={visibleEvents} onEventClick={setSelectedEvent} />
      )}
      {(view === 'production' || view === 'technical' || view === 'assets') && (
        <div className="placeholder-view">
          <p>{VIEWS.find(v => v.id === view)?.label}</p>
          <span>Coming soon</span>
        </div>
      )}

      <CompetitionToggles
        competitions={COMPETITIONS}
        governingBodies={GOVERNING_BODIES}
        activeComps={activeComps}
        onToggle={toggleComp}
        onToggleBody={toggleGoverningBody}
      />

      {selectedEvent && (
        <EventPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}

export default App
