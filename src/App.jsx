import { useState, useMemo, useEffect } from 'react'
import CalendarView from './components/CalendarView'
import EditorialView from './components/EditorialView'
import EventPanel from './components/EventPanel'
import CompetitionToggles from './components/CompetitionToggles'
import AdminView from './components/AdminView'
import ProductionView from './components/ProductionView'
import TechnicalView from './components/TechnicalView'
import TechnicalBookedView from './components/TechnicalBookedView'
import BoothsView from './components/BoothsView'
import BookStaffView from './components/BookStaffView'
import ResourceGapsView from './components/ResourceGapsView'
import AssetsView from './components/AssetsView'
import BookAssetsView from './components/BookAssetsView'
import ImportEventsView from './components/ImportEventsView'
import ManageCompetitionsModal from './components/ManageCompetitionsModal'
import { COMPETITIONS } from './data/competitions'
import { getLocalFixtures } from './services/localFixtures'
import { SEED_STAFF, SEED_STAFF_PROFILES } from './data/seedStaff'
import { SEED_RIGHTS_MATRIX } from './data/seedRights'
import { SEED_PATTERNS } from './data/seedPatterns'
import { SEED_BOOKABLE_ASSETS, SEED_ASSET_BOOKINGS } from './data/seedBookableAssets'
import { SEED_ROLES } from './data/seedRoles'
import { saveToStorage } from './services/storage'
import { loadImportedEvents, addImportedEvent, addImportedEvents, removeImportedEvent, removeImportedEvents } from './services/importedEvents'
import { loadCustomCompetitions, addCustomCompetition, removeCustomCompetitions } from './services/customCompetitions'
import { loadDeletedEventIds, addDeletedEventId, addDeletedEventIds } from './services/deletedEvents'
import { loadDeletedCompetitionIds, addDeletedCompetitionIds } from './services/deletedCompetitions'
import { clearEventReferences } from './services/eventCleanup'
import { loadRoles, persistRoles, loadCurrentRoleId, persistCurrentRoleId, getActiveRole, canSeeView } from './services/roles'
import imgLogoWhite from './assets/img-brand/img-logo-white.png'
import './App.css'

const SKIN_KEY = 'ui_skin'

function loadSkin() {
  const stored = localStorage.getItem(SKIN_KEY)
  return stored === 'img' ? 'img' : 'classic'
}

// Populate localStorage from seed on first load (skipped if data already exists)
if (!localStorage.getItem('admin_staff'))
  saveToStorage('admin_staff', SEED_STAFF)
if (!localStorage.getItem('admin_staff_profiles'))
  saveToStorage('admin_staff_profiles', SEED_STAFF_PROFILES)
if (!localStorage.getItem('rights_matrix'))
  saveToStorage('rights_matrix', SEED_RIGHTS_MATRIX)
if (!localStorage.getItem('admin_patterns'))
  saveToStorage('admin_patterns', SEED_PATTERNS)
if (!localStorage.getItem('bookable_assets'))
  saveToStorage('bookable_assets', SEED_BOOKABLE_ASSETS)
if (!localStorage.getItem('asset_bookings'))
  saveToStorage('asset_bookings', SEED_ASSET_BOOKINGS)
if (!localStorage.getItem('admin_roles'))
  saveToStorage('admin_roles', SEED_ROLES)

const VIEWS = [
  { id: 'calendar',   label: 'Calendar' },
  { id: 'editorial',  label: 'Planning' },
  { id: 'production', label: 'Production' },
  { id: 'technical',  label: 'Technical' },
  { id: 'technical2', label: 'Technical 2' },
  { id: 'booths',      label: 'Operations' },
  { id: 'book-staff', label: 'Book Staff' },
  { id: 'resource-gaps',  label: 'Resource Gaps' },
  { id: 'assets',          label: 'Asset Management' },
  { id: 'book-assets',     label: 'Bookable Assets' },
  { id: 'import',          label: 'Import Events' },
  { id: 'admin',          label: 'Admin' },
]

const VISIBLE_COMPETITIONS = COMPETITIONS.filter(comp => !comp.hidden)

function buildGoverningBodies(comps) {
  return Object.values(
    comps.reduce((acc, comp) => {
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
}

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
  const [importedEvents, setImportedEvents] = useState(loadImportedEvents)
  const [customCompetitions, setCustomCompetitions] = useState(loadCustomCompetitions)
  const [deletedEventIds, setDeletedEventIds] = useState(() => new Set(loadDeletedEventIds()))
  const [deletedCompetitionIds, setDeletedCompetitionIds] = useState(() => new Set(loadDeletedCompetitionIds()))
  const [bookingContextEvent, setBookingContextEvent] = useState(null)
  const [preBookingView, setPreBookingView] = useState('calendar')
  const [skin, setSkin] = useState(loadSkin)
  const [roles, setRoles] = useState(loadRoles)
  const [currentRoleId, setCurrentRoleId] = useState(loadCurrentRoleId)
  const [showAssumeRole, setShowAssumeRole] = useState(false)
  const [showManageComps, setShowManageComps] = useState(false)

  const activeRole = useMemo(
    () => getActiveRole(roles, currentRoleId),
    [roles, currentRoleId]
  )

  useEffect(() => {
    localStorage.setItem(SKIN_KEY, skin)
  }, [skin])

  // If the assumed role changes (or its own view access was edited) while
  // sitting on a now-forbidden tab, fall back to the first tab it can see.
  useEffect(() => {
    if (!canSeeView(activeRole, view)) {
      const fallback = VIEWS.find(v => canSeeView(activeRole, v.id))
      setView(fallback ? fallback.id : 'calendar')
    }
  }, [activeRole, view])

  useEffect(() => {
    function onQuotaExceeded(e) {
      setStorageWarning(e.detail.key)
    }
    window.addEventListener('storage-quota-exceeded', onQuotaExceeded)
    return () => window.removeEventListener('storage-quota-exceeded', onQuotaExceeded)
  }, [])

  const combinedEvents = useMemo(
    () => [...ALL_EVENTS, ...importedEvents].filter(e => !deletedEventIds.has(e.id)),
    [importedEvents, deletedEventIds]
  )

  const visibleEvents = useMemo(
    () => combinedEvents.filter(e => activeComps.has(e.extendedProps.competitionId)),
    [combinedEvents, activeComps]
  )

  const allCompetitions = useMemo(
    () => [...VISIBLE_COMPETITIONS, ...customCompetitions].filter(c => !deletedCompetitionIds.has(c.id)),
    [customCompetitions, deletedCompetitionIds]
  )

  const governingBodies = useMemo(
    () => buildGoverningBodies(allCompetitions),
    [allCompetitions]
  )

  function handleAddImportedEvent(event) {
    setImportedEvents(addImportedEvent(event))
  }

  function handleAddImportedEvents(events) {
    setImportedEvents(addImportedEvents(events))
  }

  function handleAddCompetition(competition) {
    setCustomCompetitions(addCustomCompetition(competition))
  }

  function handleDeleteEvent(event) {
    clearEventReferences(event.id)
    if (event.id.startsWith('imported|')) {
      setImportedEvents(removeImportedEvent(event.id))
    } else {
      setDeletedEventIds(new Set(addDeletedEventId(event.id)))
    }
    setSelectedEvent(null)
  }

  // Deletes one or more competitions (and, transitively, every event that
  // belongs to them) leaving no trace behind: production assignments,
  // editorial decisions, staff bookings/locks, and the competition itself.
  function handleDeleteCompetitions(competitionIds) {
    const idSet = new Set(competitionIds)
    const eventsToRemove = combinedEvents.filter(e => idSet.has(e.extendedProps.competitionId))
    eventsToRemove.forEach(e => clearEventReferences(e.id))

    const importedIds = eventsToRemove.filter(e => e.id.startsWith('imported|')).map(e => e.id)
    const builtInEventIds = eventsToRemove.filter(e => !e.id.startsWith('imported|')).map(e => e.id)

    if (importedIds.length > 0) setImportedEvents(removeImportedEvents(importedIds))
    if (builtInEventIds.length > 0) setDeletedEventIds(new Set(addDeletedEventIds(builtInEventIds)))

    const customIds = competitionIds.filter(id => customCompetitions.some(c => c.id === id))
    const builtInCompIds = competitionIds.filter(id => !customIds.includes(id))

    if (customIds.length > 0) setCustomCompetitions(removeCustomCompetitions(customIds))
    if (builtInCompIds.length > 0) setDeletedCompetitionIds(new Set(addDeletedCompetitionIds(builtInCompIds)))

    setActiveComps(prev => {
      if (![...idSet].some(id => prev.has(id))) return prev
      const next = new Set(prev)
      idSet.forEach(id => next.delete(id))
      return next
    })
    if (selectedEvent && idSet.has(selectedEvent.extendedProps.competitionId)) {
      setSelectedEvent(null)
    }
  }

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

  function handleAddBookableAssets(event) {
    setPreBookingView(view)
    setBookingContextEvent(event)
    setSelectedEvent(null)
    setView('book-assets')
  }

  function handleDoneBookingAssets() {
    const event = bookingContextEvent
    setBookingContextEvent(null)
    setView(preBookingView)
    if (event) {
      setSelectedEvent(combinedEvents.find(e => e.id === event.id) || event)
    }
  }

  function handleAssumeRole(roleId) {
    setCurrentRoleId(roleId)
    persistCurrentRoleId(roleId)
  }

  function handleRolesChange(nextRoles) {
    setRoles(nextRoles)
    persistRoles(nextRoles)
    // If the role being previewed was just deleted, fall back rather than
    // keep pointing at an id nothing matches.
    if (!nextRoles.some(r => r.id === currentRoleId)) {
      handleAssumeRole(nextRoles[0]?.id || '')
    }
  }

  function toggleGoverningBody(bodyId) {
    const body = governingBodies.find(b => b.id === bodyId)
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
    <div className="app" data-skin={skin}>
      <header className="app-header">
        {skin === 'img' && <img src={imgLogoWhite} alt="IMG" className="app-header-logo" />}
        <h1
          onClick={e => { if (e.ctrlKey) setShowAssumeRole(prev => !prev) }}
          title="Ctrl+click to assume a different user type"
        >
          Sports Broadcasting Calendar
        </h1>
        <nav className="nav-tabs">
          {VIEWS.filter(v => canSeeView(activeRole, v.id)).map(v => (
            <button
              key={v.id}
              data-id={v.id}
              className={`nav-tab${view === v.id ? ' active' : ''}`}
              onClick={e => {
                if ((v.id === 'admin' || v.id === 'calendar') && e.ctrlKey) {
                  // Reveals the power-tools bar only — it no longer also
                  // pops the Assume Role picker; that stays reachable via
                  // Ctrl+click on the header title, or the bar's own button.
                  setSnapshotUnlocked(true)
                } else {
                  // Plain click on any tab re-hides the power-tools bar —
                  // it should only ever be visible right after the
                  // deliberate Ctrl+Admin / Ctrl+Calendar gesture.
                  setSnapshotUnlocked(false)
                }
                setView(v.id)
              }}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <span className="header-version">v3.16</span>
      </header>

      {showAssumeRole && (
        <div className="ba-modal-backdrop" onClick={() => setShowAssumeRole(false)}>
          <div className="ba-modal-dialog assume-role-dialog" onClick={e => e.stopPropagation()}>
            <h3>Assume Role</h3>
            <p className="assume-role-hint">
              Preview the app as a different user type. This changes what's visible for
              everyone using this browser until switched back — it isn't real access
              control (that arrives with OKTA), just a way to demonstrate each role.
            </p>
            <div className="assume-role-list">
              {roles.map(r => (
                <button
                  key={r.id}
                  className={`assume-role-option${r.id === currentRoleId ? ' assume-role-option--active' : ''}`}
                  onClick={() => { handleAssumeRole(r.id); setShowAssumeRole(false) }}
                >
                  <span className="assume-role-name">{r.name}</span>
                  {r.id === currentRoleId && <span className="assume-role-badge">Current</span>}
                </button>
              ))}
            </div>
            <div className="ba-modal-actions">
              <button type="button" className="unsaved-btn unsaved-btn--cancel" onClick={() => setShowAssumeRole(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showManageComps && (
        <ManageCompetitionsModal
          competitions={allCompetitions}
          allEvents={combinedEvents}
          onDeleteCompetitions={handleDeleteCompetitions}
          onClose={() => setShowManageComps(false)}
        />
      )}

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

      {view === 'calendar' && canSeeView(activeRole, 'calendar') && (
        <CalendarView events={visibleEvents} onEventClick={handleCalendarEventClick} />
      )}
      {view === 'editorial' && canSeeView(activeRole, 'editorial') && (
        <EditorialView events={visibleEvents} onEventClick={setSelectedEvent} role={activeRole} />
      )}
      {view === 'production' && canSeeView(activeRole, 'production') && (
        <ProductionView events={visibleEvents} onEventClick={setSelectedEvent} />
      )}
      {view === 'technical' && canSeeView(activeRole, 'technical') && <TechnicalView events={visibleEvents} />}
      {view === 'technical2' && canSeeView(activeRole, 'technical2') && <TechnicalBookedView events={visibleEvents} />}
      {view === 'booths' && canSeeView(activeRole, 'booths') && <BoothsView events={visibleEvents} onEventClick={setSelectedEvent} />}
      {view === 'book-staff' && canSeeView(activeRole, 'book-staff') && <BookStaffView events={visibleEvents} role={activeRole} />}
      {view === 'assets' && canSeeView(activeRole, 'assets') && <AssetsView events={combinedEvents} />}
      {view === 'book-assets' && canSeeView(activeRole, 'book-assets') && (
        <BookAssetsView eventContext={bookingContextEvent} onDone={handleDoneBookingAssets} role={activeRole} />
      )}
      {view === 'resource-gaps' && canSeeView(activeRole, 'resource-gaps') && <ResourceGapsView allEvents={combinedEvents} onEventClick={setSelectedEvent} />}
      {view === 'admin' && canSeeView(activeRole, 'admin') && (
        <AdminView
          snapshotUnlocked={snapshotUnlocked}
          allEvents={combinedEvents}
          onNavigate={setView}
          onActivateComps={activateComps}
          skin={skin}
          onSkinChange={setSkin}
          roles={roles}
          onRolesChange={handleRolesChange}
          currentRoleId={currentRoleId}
          onOpenAssumeRole={() => setShowAssumeRole(true)}
          onOpenManageComps={() => setShowManageComps(true)}
        />
      )}
      {view === 'import' && canSeeView(activeRole, 'import') && (
        <ImportEventsView
          competitions={allCompetitions}
          onAdd={handleAddImportedEvent}
          onAddBatch={handleAddImportedEvents}
          onAddCompetition={handleAddCompetition}
          role={activeRole}
        />
      )}

      {view !== 'admin' && view !== 'resource-gaps' && view !== 'book-staff' && view !== 'import' && view !== 'book-assets' && (
        <CompetitionToggles
          competitions={allCompetitions}
          governingBodies={governingBodies}
          activeComps={activeComps}
          onToggle={toggleComp}
          onToggleBody={toggleGoverningBody}
          onShowAll={() => activateComps(allCompetitions.map(c => c.id))}
          onClearAll={() => setActiveComps(new Set())}
        />
      )}

      {selectedEvent && (
        <EventPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDeleteEvent={handleDeleteEvent}
          onAddBookableAssets={handleAddBookableAssets}
          role={activeRole}
        />
      )}
    </div>
  )
}

export default App
