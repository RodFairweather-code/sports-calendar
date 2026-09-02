import { useEffect, useRef, useState } from 'react'
import { saveToStorage } from '../services/storage'
import { loadLocks, persistLocks, isRoleLocked, withRoleLock } from '../services/staffLocks'
import { hasPermission } from '../services/roles'
import { GALLERY_ROLES, GALLERY_LOCATIONS, galleryField } from '../services/galleryRoles'

const GALLERY_ROLE_KEYS = new Set(GALLERY_ROLES.map(r => r.role))

function formatDate(start) {
  if (!start) return '—'
  const d = new Date(start.slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function loadAssignments() {
  try { return JSON.parse(localStorage.getItem('production_assignments') || '{}') }
  catch { return {} }
}

function loadProfiles() {
  try { return JSON.parse(localStorage.getItem('admin_staff_profiles') || '{}') }
  catch { return {} }
}

function loadBookings() {
  try { return JSON.parse(localStorage.getItem('staff_bookings') || '{}') }
  catch { return {} }
}

function persistBookings(b) {
  saveToStorage('staff_bookings', b)
}

const ROLE_TABS = [
  { key: 'director',          label: 'Director',       staffKey: 'director' },
  { key: 'productionManager', label: 'Prod. Manager',  staffKey: 'onsiteProductionManager' },
  { key: 'evsOperator',       label: 'EVS Operator',   staffKey: 'evsOperator' },
  { key: 'graphicsOperator',  label: 'Graphics',       staffKey: 'graphicsOperator' },
  { key: 'cameraman',         label: 'Cameramen',      staffKey: 'cameramen' },
  { key: 'onsiteAudio',       label: 'Onsite Audio',   staffKey: 'onsiteAudio' },
  { key: 'producer',          label: 'Producer',       staffKey: 'producer' },
  { key: 'commentator',       label: 'Commentator',    staffKey: 'commentator' },
  { key: 'mamChecker',        label: 'MAM Checkers',   staffKey: 'mamCheckers' },
]

const FILTERS = [
  { key: 'all',         label: 'All' },
  { key: 'unconfirmed', label: 'Unconfirmed' },
]

function BookStaffView({ events, role }) {
  const canUpdate = hasPermission(role, 'humanAssets', 'update')
  const [selectedRole, setSelectedRole] = useState(ROLE_TABS[0].key)
  const [filter, setFilter] = useState('all')
  const [assignments] = useState(loadAssignments)
  const [profiles] = useState(loadProfiles)
  const [bookings, setBookings] = useState(loadBookings)
  const [locks, setLocks] = useState(loadLocks)
  const [notice, setNotice] = useState(null)
  const noticeTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(noticeTimerRef.current), [])

  const todayStr = new Date().toISOString().slice(0, 10)
  const roleTab = ROLE_TABS.find(r => r.key === selectedRole)

  // Gallery roles are staffed once per facility, so a single event yields one
  // row per location it uses; every other role is a single event-level field.
  const roleFields = GALLERY_ROLE_KEYS.has(selectedRole)
    ? GALLERY_LOCATIONS.map(l => ({ field: galleryField(l.key, selectedRole), locLabel: l.label }))
    : [{ field: selectedRole, locLabel: null }]

  const sorted = [...events].sort((a, b) => {
    if (!a.start) return 1
    if (!b.start) return -1
    return a.start.localeCompare(b.start)
  })

  const rows = sorted.flatMap(event => {
    const asgn = assignments[event.id] || {}
    return roleFields.flatMap(({ field, locLabel }) => {
      const person = asgn[field]
      if (!person || person === 'Freelance required') return []

      const isStaff = profiles[roleTab.staffKey]?.[person]?.isStaff ?? false
      const storedStatus = bookings[event.id]?.[field] || ''
      const effectiveStatus = isStaff ? 'confirmed' : storedStatus
      const locked = isRoleLocked(locks, event.id, field)

      return [{ event, field, locLabel, person, isStaff, effectiveStatus, locked }]
    })
  })

  const filtered = filter === 'unconfirmed'
    ? rows.filter(r => r.effectiveStatus !== 'confirmed')
    : rows

  function setBookingStatus(eventId, field, status) {
    if (!canUpdate) return
    setBookings(prev => {
      const next = { ...prev, [eventId]: { ...prev[eventId], [field]: status } }
      persistBookings(next)
      return next
    })
    // A confirmed freelancer is booking-final — pencil becomes locked automatically.
    if (status === 'confirmed') {
      setLocks(prev => {
        const next = withRoleLock(prev, eventId, field, true)
        persistLocks(next)
        return next
      })
    }
  }

  function offerJob(event, field, locLabel, person) {
    if (!canUpdate) return
    setBookingStatus(event.id, field, 'offered')
    const timeStr = event.start?.length > 10 ? ` at ${event.start.slice(11, 16)}` : ''
    const roleName = locLabel ? `${roleTab.label} (${locLabel})` : roleTab.label
    clearTimeout(noticeTimerRef.current)
    setNotice(`${person} has been offered ${roleName} for ${event.title} on ${formatDate(event.start)}${timeStr}. A calendar invite has also been sent out.`)
    noticeTimerRef.current = setTimeout(() => setNotice(null), 8000)
  }

  function toggleLock(eventId, field) {
    if (!canUpdate) return
    setLocks(prev => {
      const next = withRoleLock(prev, eventId, field, !isRoleLocked(prev, eventId, field))
      persistLocks(next)
      return next
    })
  }

  return (
    <div className="book-staff-view">
      {notice && <div className="bs-toast">{notice}</div>}
      <div className="book-staff-scroll">
        {filtered.length === 0 ? (
          <div className="book-staff-empty">
            {rows.length === 0
              ? `No ${roleTab.label} assigned to any event.`
              : `No unconfirmed ${roleTab.label} found.`}
          </div>
        ) : (
          <table className="book-staff-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Competition</th>
                <th>Role</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Locked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ event, field, locLabel, person, isStaff, effectiveStatus, locked }) => {
                const ep = event.extendedProps
                return (
                  <tr key={`${event.id}|${field}`}>
                    <td className="bs-date">{formatDate(event.start)}</td>
                    <td className="bs-event">{event.title}</td>
                    <td className="bs-comp">
                      <span className="ed-dot" style={{ background: event.backgroundColor }} />
                      {ep.competitionName}
                    </td>
                    <td className="bs-role">{locLabel ? `${roleTab.label} (${locLabel})` : roleTab.label}</td>
                    <td className="bs-name">{person}</td>
                    <td>
                      <span className={`bs-badge bs-badge--${isStaff ? 'staff' : 'freelance'}`}>
                        {isStaff ? 'Staff' : 'Freelance'}
                      </span>
                    </td>
                    <td>
                      <span className={`bs-badge bs-badge--${effectiveStatus || 'unbooked'}`}>
                        {effectiveStatus === 'confirmed' ? 'Confirmed'
                          : effectiveStatus === 'offered' ? 'Offered'
                          : 'Not offered'}
                      </span>
                    </td>
                    <td>
                      <span className={`bs-badge bs-badge--${locked ? 'confirmed' : 'unbooked'}`}>
                        {locked ? 'Locked' : 'Pencil'}
                      </span>
                    </td>
                    <td className="bs-actions">
                      {/* Freelancers can still be offered / confirmed while the
                          allocation is locked — locking only pins who the person is. */}
                      {!isStaff && effectiveStatus === '' && (
                        <button
                          className="bs-action-btn bs-action-btn--offer"
                          disabled={!canUpdate}
                          title={!canUpdate ? "Your role doesn't have permission to edit staff bookings" : undefined}
                          onClick={() => offerJob(event, field, locLabel, person)}
                        >
                          Offer job
                        </button>
                      )}
                      {!isStaff && effectiveStatus === 'offered' && (
                        <button
                          className="bs-action-btn bs-action-btn--accept"
                          disabled={!canUpdate}
                          title={!canUpdate ? "Your role doesn't have permission to edit staff bookings" : undefined}
                          onClick={() => setBookingStatus(event.id, field, 'confirmed')}
                        >
                          Accepted
                        </button>
                      )}
                      <button
                        className={`bs-action-btn${locked ? ' bs-action-btn--accept' : ''}`}
                        disabled={!canUpdate}
                        title={!canUpdate ? "Your role doesn't have permission to edit staff bookings" : undefined}
                        onClick={() => toggleLock(event.id, field)}
                      >
                        {locked ? 'Unlock' : 'Lock'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="book-staff-banner">
        <div className="bs-role-tabs">
          {ROLE_TABS.map(r => (
            <button
              key={r.key}
              className={`bs-role-tab${selectedRole === r.key ? ' active' : ''}`}
              onClick={() => setSelectedRole(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="bs-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`bs-filter-btn${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BookStaffView
