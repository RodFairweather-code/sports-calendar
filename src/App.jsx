import { useState, useMemo, useEffect } from 'react'
import CalendarView from './components/CalendarView'
import EditorialView from './components/EditorialView'
import EventPanel from './components/EventPanel'
import CompetitionToggles from './components/CompetitionToggles'
import AdminView from './components/AdminView'
import ProductionView from './components/ProductionView'
import TechnicalView from './components/TechnicalView'
import BoothsView from './components/BoothsView'
import BookStaffView from './components/BookStaffView'
import ResourceGapsView from './components/ResourceGapsView'
import AssetsView from './components/AssetsView'
import { COMPETITIONS } from './data/competitions'
import { getLocalFixtures } from './services/localFixtures'
import { SEED_STAFF, SEED_STAFF_PROFILES } from './data/seedStaff'
import { SEED_RIGHTS_MATRIX } from './data/seedRights'
import { saveToStorage } from './services/storage'
import './App.css'

// Populate localStorage from seed on first load (skipped if data already exists)
if (!localStorage.getItem('admin_staff'))
  saveToStorage('admin_staff', SEED_STAFF)
if (!localStorage.getItem('admin_staff_profiles'))
  saveToStorage('admin_staff_profiles', SEED_STAFF_PROFILES)
if (!localStorage.getItem('rights_matrix'))
  saveToStorage('rights_matrix', SEED_RIGHTS_MATRIX)

const VIEWS = [
  { id: 'calendar',   label: 'Calendar' },
  { id: 'editorial',  label: 'Editorial Decisions' },
  { id: 'production', label: 'Production' },
  { id: 'technical',  label: 'Technical' },
  { id: 'booths',      label: 'Operations' },
  { id: 'book-staff', label: 'Book Staff' },
  { id: 'resource-gaps',  label: 'Resource Gaps' },
  { id: 'assets',          label: 'Asset Management' },
  { id: 'admin',          label: 'Admin' },
]

const VISIBLE_COMPETITIONS = COMPETITIONS.filter(comp => !comp.hidden)

const GOVERNING_BODIES = Object.values(
  VISIBLE_COMPETITIONS.reduce((acc, comp) => {
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

const ALL_EVENTS = VISIBLE_COMPETITIONS.flatMap(comp => {
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
  const [activeComps, setActiveComps] = useState(() => new Set())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [snapshotUnlocked, setSnapshotUnlocked] = useState(false)
  const [storageWarning, setStorageWarning] = useState(null)

  useEffect(() => {
    function onQuotaExceeded(e) {
      setStorageWarning(e.detail.key)
    }
    window.addEventListener('storage-quota-exceeded', onQuotaExceeded)
    return () => window.removeEventListener('storage-quota-exceeded', onQuotaExceeded)
  }, [])

  const visibleEvents = useMemo(
    () => ALL_EVENTS.filter(e => activeComps.has(e.extendedProps.competitionId)),
    [activeComps]
  )

  function activateComps(ids) {
    setActiveComps(prev => new Set([...prev, ...ids]))
  }

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
              data-id={v.id}
              className={`nav-tab${view === v.id ? ' active' : ''}`}
              onClick={e => {
                if (v.id === 'admin' && e.ctrlKey) {
                  setSnapshotUnlocked(prev => !prev)
                }
                setView(v.id)
              }}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <span className="header-version">v2.64</span>
      </header>

      {storageWarning && (
        <div className="storage-quota-banner">
          <span>
            Storage is full — your last change was <strong>not saved</strong>.
            Free up browser storage (localhost origin) and try again.
            {' '}(failed key: <code>{storageWarning}</code>)
          </span>
          <button onClick={() => setStorageWarning(null)}>Dismiss</button>
        </div>
      )}

      {view === 'calendar' && (
        <CalendarView events={visibleEvents} onEventClick={handleCalendarEventClick} />
      )}
      {view === 'editorial' && (
        <EditorialView events={visibleEvents} onEventClick={setSelectedEvent} />
      )}
      {view === 'production' && (
        <ProductionView events={visibleEvents} onEventClick={setSelectedEvent} />
      )}
      {view === 'technical' && <TechnicalView events={visibleEvents} />}
      {view === 'booths' && <BoothsView events={visibleEvents} onEventClick={setSelectedEvent} />}
      {view === 'book-staff' && <BookStaffView events={visibleEvents} />}
      {view === 'assets' && <AssetsView events={ALL_EVENTS} />}
      {view === 'resource-gaps' && <ResourceGapsView allEvents={ALL_EVENTS} onEventClick={setSelectedEvent} />}
      {view === 'admin' && <AdminView snapshotUnlocked={snapshotUnlocked} allEvents={ALL_EVENTS} onNavigate={setView} onActivateComps={activateComps} />}

      {view !== 'admin' && view !== 'resource-gaps' && view !== 'book-staff' && (
        <CompetitionToggles
          competitions={VISIBLE_COMPETITIONS}
          governingBodies={GOVERNING_BODIES}
          activeComps={activeComps}
          onToggle={toggleComp}
          onToggleBody={toggleGoverningBody}
        />
      )}

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
