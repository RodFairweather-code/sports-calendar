import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

function loadDecisions() {
  try { return JSON.parse(localStorage.getItem('editorial_decisions') || '{}') }
  catch { return {} }
}

function isSelected(eventId, decisions) {
  const d = decisions[eventId]
  if (!d) return false
  return Object.values(d).some(v => v === 'Y' || v === 'P')
}

function CalendarView({ events, onEventClick }) {
  const [decisions] = useState(loadDecisions)
  const [showAll, setShowAll] = useState(false)

  const displayEvents = showAll ? events : events.filter(e => isSelected(e.id, decisions))

  return (
    <main className="calendar-container">
      <div className="calendar-toolbar">
        <label className="calendar-img-toggle">
          <input
            type="checkbox"
            checked={showAll}
            onChange={e => setShowAll(e.target.checked)}
          />
          Show all events
        </label>
      </div>
      <div className="calendar-fc-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
          }}
          validRange={{ end: '2027-12-31' }}
          events={displayEvents}
          eventClick={(info) => onEventClick(info.event.id)}
          eventDisplay="block"
          height="100%"
          nowIndicator
        />
      </div>
    </main>
  )
}

export default CalendarView
