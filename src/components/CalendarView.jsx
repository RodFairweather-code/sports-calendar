import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

function CalendarView({ events, onEventClick }) {
  return (
    <main className="calendar-container">
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
        validRange={{ end: '2027-01-01' }}
        events={events}
        eventClick={(info) => onEventClick(info.event.id)}
        eventDisplay="block"
        height="100%"
        nowIndicator
      />
    </main>
  )
}

export default CalendarView
