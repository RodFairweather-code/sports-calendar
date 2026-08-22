# Sports Broadcasting Calendar — User Stories

Reverse-engineered from the current application functionality (v3.00). Grouped by
feature area. Format: *As a (role), I want to (action) so that I achieve (benefit).*

---

## Calendar

1. As an **editorial coordinator**, I want to see all fixtures across every sport and
   competition on a single month/week/day calendar so that I can spot scheduling
   clashes and quiet periods at a glance.
2. As an **editorial coordinator**, I want to toggle which sports, governing bodies,
   or individual competitions are shown so that I only see the fixtures relevant to
   my current planning task.
3. As an **editorial coordinator**, I want a one-click "Show All" so that I can
   quickly reset back to the full fixture list after narrowing my view.
4. As a **rights manager**, I want to filter the calendar to "IMG events only" so
   that I can review just the fixtures under that distribution arrangement.
5. As **any user**, I want to click any fixture to open its full detail panel so
   that I can see or edit everything about that event without leaving the calendar.
6. As an **editorial coordinator**, I want the calendar to visually distinguish
   today's date so that I always know where "now" is relative to the schedule.

## Planning (Editorial Decisions)

7. As an **editorial producer**, I want to mark each fixture as confirmed (Y),
   possible (P), or undecided per broadcast platform so that the whole team knows
   which events are actually going out and where.
8. As an **editorial producer**, I want a single click to cycle a platform decision
   (blank → Y → clear) so that I can update coverage decisions quickly during a
   planning meeting.
9. As an **editorial producer**, I want to flag an event as "Init Production" so
   that it automatically appears on the Production, Technical, Operations, and
   Resource Gaps pages without re-entering it anywhere else.
10. As an **editorial producer**, I want to jump straight to today's date or any
    chosen date so that I don't have to scroll through months of fixtures to find
    what I'm working on.

## Production

11. As a **production manager**, I want to see only the events flagged for
    production, sorted by date, so that my worklist isn't cluttered with fixtures
    nobody is covering.
12. As a **production manager**, I want to assign a production pattern (resource
    template) to each event so that the correct crew and technical requirements are
    derived automatically instead of being typed out per event.
13. As a **production manager**, I want the director dropdown to only show people
    qualified for that pattern's requirements and not already booked elsewhere that
    day so that I can't accidentally double-book or under-qualify a shoot.
14. As a **production manager**, I want to be told explicitly when no qualified
    director is available ("Freelance Required") so that I know to source a
    freelancer rather than assuming the slot is just unfilled.
15. As a **production manager**, I want to assign a production manager per event so
    that on-site accountability is clear for every covered fixture.

## Technical

16. As a **technical/engineering coordinator**, I want a day-by-day roll-up of
    required cameramen, EVS operators, audio, and video/audio/talkback line counts
    so that I can plan crewing and circuit bookings ahead of transmission day.
17. As a **technical/engineering coordinator**, I want confirmed and possible
    events' resource needs shown separately as well as combined so that I can see
    worst-case demand without over-committing to fixtures that might not happen.
18. As a **technical/engineering coordinator**, I want to jump to a specific date's
    resource summary so that I can prepare for a particular transmission day
    quickly.

## Operations (Booths, Studios & OB Units)

19. As an **operations coordinator**, I want every event needing a production
    booth, studio, or OB unit to appear as its own card grouped by day so that I can
    see exactly how many resources are in use on any given date.
20. As an **operations coordinator**, I want to auto-allocate director, EVS, and
    graphics staff for a single day, a range of days, or everything at once so that
    I don't have to hand-assign dozens of events one at a time.
21. As an **operations coordinator**, I want the auto-allocator to never double-book
    the same person across two events on the same day so that I don't have to
    manually cross-check everyone's availability.
22. As an **operations coordinator**, I want events to be filled in priority order
    (confirmed, then possible, then unscheduled) so that definite bookings always
    get first pick of staff over speculative ones.
23. As an **operations coordinator**, I want a clear "Freelance required" fallback
    when the qualified staff pool is exhausted so that gaps are visible instead of
    silently left blank.
24. As an **operations coordinator**, I want a one-click way to clear all staff (for
    a day, forward from a day, or everywhere) so that I can quickly re-run
    allocation after a schedule change, without hand-removing every name.
25. As an **operations coordinator**, I want to be warned how many accepted/offered
    freelancers were affected when I clear allocations so that I don't
    inadvertently orphan a booking a freelancer already confirmed to.
26. As an **operations coordinator**, I want booths flagged when they exceed the
    site's booth capacity so that I know to escalate or re-plan before the day.
27. As an **operations coordinator**, I want to lock an individual person's
    assignment on an event so that a later bulk clear or auto-allocate run can't
    overwrite a booking I've already finalised.
28. As an **operations coordinator**, I want to lock an entire event's staffing in
    one action so that I don't have to lock director, EVS, and graphics separately
    when everything for that event is confirmed.
29. As an **operations coordinator**, I want to unlock a specific person on an
    already-locked event so that I can make a late change for just that one role
    without disturbing the rest of the booking.
30. As an **operations coordinator**, I want a booking to lock itself automatically
    the moment a freelancer confirms so that "pencil" and "confirmed" bookings are
    never visually indistinguishable by accident.
31. As an **operations coordinator**, I want the lock control hidden for roles that
    are still TBA or unfulfilled ("Freelance required") so that I'm not offered a
    lock for a slot that has nothing in it to protect.

## Book Staff

32. As a **booking coordinator**, I want a single table of every person's booking
    status across all events, filterable by role, so that I can work through one
    department (e.g. all Directors) at a time.
33. As a **booking coordinator**, I want to filter to only unconfirmed bookings so
    that I can focus my follow-up calls on the freelancers still waiting to accept.
34. As a **booking coordinator**, I want to offer a job to a freelancer and then
    mark it accepted once they confirm so that the booking's status reflects real
    real-world confirmation, not just an assignment.
35. As a **booking coordinator**, I want to see at a glance whether a booked person
    is staff or freelance so that I know who actually needs chasing (freelancers)
    versus who is automatically available (staff).
36. As a **booking coordinator**, I want to lock or unlock a booking directly from
    this table so that I can finalise or reopen a booking without navigating to the
    Operations board or the event panel.

## Resource Gaps

37. As a **resource planner**, I want a day-by-day list of events missing a
    director, EVS operator, or graphics operator so that I can see exactly where
    the schedule is exposed without checking every event individually.
38. As a **resource planner**, I want days with no gaps to collapse to a simple "all
    clear" message so that I don't have to scan a wall of green to find the
    problems.
39. As a **resource planner**, I want to see confirmed/offered/not-offered counts
    per event so that I understand not just *whether* someone is assigned but
    *how solid* that assignment actually is.
40. As a **resource planner**, I want to filter between "unavailable only",
    "incomplete", and "all" events so that I can choose between firefighting mode
    and a full audit.

## Asset Management (TAMS / MAM Logging)

41. As a **MAM/media logging coordinator**, I want a worklist of every event
    selected for a given platform (e.g. TAMS) so that I know exactly which
    recordings need to be logged and checked.
42. As a **MAM/media logging coordinator**, I want the recording and highlights
    filenames generated automatically from competition, teams, and season so that
    naming stays consistent without manual typing or typos.
43. As a **MAM/media logging coordinator**, I want to tick off natural-language
    check, log sheet, and log-on-Viz steps per event so that I have an auditable
    record of what's been processed.
44. As a **MAM/media logging coordinator**, I want each event automatically assigned
    a record port number for its day so that I can tell engineering exactly where a
    recording will land, and be warned if a day has more recordings than ports.
45. As a **MAM/media logging coordinator**, I want a free-text notes field per event
    so that I can capture exceptions that don't fit the standard checklist.

## Bookable Assets — Booking

46. As an **equipment booking coordinator**, I want to book out a specific unit of
    an asset (e.g. "Edit Suite 3") for a date, start time, and duration so that
    physical resources are reserved the same way staff are.
47. As an **equipment booking coordinator**, I want the end time and duration
    fields to stay in sync (editing one recalculates the other) so that I never
    have to do the arithmetic myself, and overnight bookings are handled correctly.
48. As an **equipment booking coordinator**, I want to set up a booking that
    repeats daily, weekly, or on a custom interval, ending after N occasions or on
    a specific date, so that I don't have to create dozens of identical bookings
    by hand for a recurring production.
49. As an **equipment booking coordinator**, I want to record who booked an asset,
    plus the production, contract number, and programme it's for, so that a
    booking's business context is visible without leaving this page.
50. As an **equipment booking coordinator**, I want to be warned before saving a
    booking that overlaps an existing one on the same unit — showing who it clashes
    with and the exact overlapping hours — so that I can't accidentally double-book
    a physical resource.
51. As an **equipment booking coordinator**, I want to edit a booking after the
    fact (including asset, unit, date, time, and duration) so that I can correct
    mistakes or accommodate schedule changes without deleting and recreating it.
52. As an **equipment booking coordinator**, I want to apply an edit to every
    occurrence in a recurring series at once (while each occurrence keeps its own
    date) so that changing "who's booking it" or "what time" doesn't require
    editing every date individually.
53. As an **equipment booking coordinator**, I want to delete a single booking or
    an entire recurring series so that I have the right amount of precision when
    plans fall through.

## Bookable Assets — Viewing

54. As an **equipment booking coordinator**, I want a simple chronological list of
    all bookings so that I can quickly scan what's booked, by whom, and when.
55. As an **equipment booking coordinator**, I want a timeline/grid view with each
    unit as a row and each day as a column so that I can see utilisation across all
    units and days at once, the way a diary/wall-planner would show it.
56. As an **equipment booking coordinator**, I want to click an empty cell or a
    unit's row label in the timeline to start a new booking pre-filled with that
    unit/date so that I don't have to re-select the same options I just clicked
    through to get there.
57. As an **equipment booking coordinator**, I want to click a day's header to see
    every booking across all assets for that single day so that I can do a daily
    "what's on" check without scanning the whole timeline grid.
58. As an **equipment booking coordinator**, I want a clear way back from that daily
    view to whatever I was looking at before so that drilling into a day doesn't
    cost me my place in the timeline.
59. As an **equipment booking coordinator**, I want the Bookable Assets page to open
    on the timeline by default so that I get the highest-value overview first,
    without an extra click every time I visit.

## Import Events

60. As an **editorial coordinator**, I want to add a one-off event that isn't in the
    bundled fixture data (team names, date/time, venue) so that ad-hoc or late-
    breaking fixtures can still be scheduled and covered like any other event.
61. As an **editorial coordinator**, I want to create a brand-new sport or
    competition on the fly while importing a fixture so that I'm not blocked
    waiting for someone to configure it in Admin first.
62. As an **editorial coordinator**, I want to set production type, staff, and
    technical requirements at the point of import so that a manually-added fixture
    is immediately as fully specified as a seeded one.
63. As an **editorial coordinator**, I want to bulk-import a whole spreadsheet of
    same-sport/competition fixtures via a preview-then-accept step so that adding
    an entire new competition's schedule doesn't mean typing in every match by
    hand.

## Admin — Patterns (Production Templates)

64. As a **system administrator**, I want to define reusable production patterns
    (camera count, EVS/audio crew, video/audio/talkback line counts, booth/studio/
    OB unit flags) so that assigning a production type to an event auto-fills all
    of its technical and staffing needs.
65. As a **system administrator**, I want to copy an existing pattern as a starting
    point for a new one so that I don't have to re-enter near-identical templates
    from scratch.
66. As a **system administrator**, I want to be warned about unsaved changes before
    navigating away from a pattern I'm editing so that I don't lose work by
    clicking away accidentally.

## Admin — Staff

67. As a **system administrator**, I want to maintain a roster of people per role
    (director, producer, EVS operator, etc.) so that every dropdown across the app
    draws from one accurate source of truth.
68. As a **system administrator**, I want to mark each person as staff or freelance
    so that the rest of the app knows whose bookings need an offer/confirm cycle
    and whose don't.
69. As a **system administrator**, I want to record each person's capability tags
    (e.g. can do an 8-cam feature match, can do tennis/rugby) so that auto-
    allocation and manual assignment only ever suggest qualified people.
70. As a **system administrator**, I want to set a seniority level and default day
    rate per role, with the option to override an individual's rate, so that cost
    reporting is accurate without pricing every person from scratch.
71. As a **system administrator**, I want to click into a person and see their full
    upcoming schedule so that I can answer "what is this person doing" without
    searching the whole calendar.

## Admin — Platforms

72. As a **system administrator**, I want to define each broadcast platform (name,
    default line IDs, four-wire count, MCR/editorial contact numbers) so that
    editorial decisions, technical resourcing, and rights all reference the same
    consistent platform list.
73. As a **system administrator**, I want to set each platform's line capacity
    (video/audio/talkback in and out, 2110) so that Technical Stack reporting can
    flag when demand across events exceeds what a platform can actually carry.

## Admin — Tech Stack

74. As a **system administrator**, I want to record the site's fixed equipment
    inventory (encoders, decoders, frame-rate converters, booths, studios, OB
    units, record ports) with a cost per unit so that capacity and cost reporting
    reflect what's physically available, not just what's requested.
75. As a **system administrator**, I want to record per-platform line capacity in
    one place so that it's consistent with what's configured against each platform
    elsewhere in the app.

## Admin — Rights

76. As a **rights manager**, I want a matrix of competition × platform showing
    granted / not granted / unknown, cycled with a single click, so that everyone
    can see broadcast rights status without digging through contracts.
77. As a **rights manager**, I want to set a default production pattern per
    competition so that new events in that competition are pre-configured
    correctly without per-event setup.

## Admin — Bookable Assets (Asset Type Setup)

78. As a **system administrator**, I want to define a type of bookable asset (name
    and how many exist, e.g. "Edit Suites × 5") so that operators booking equipment
    are choosing from real, finite inventory rather than free text.
79. As a **system administrator**, I want to set a cost and a default booking
    duration per asset type so that new bookings default sensibly and cost
    reporting has a basis to work from.
80. As a **system administrator**, I want to edit an asset type's cost or duration
    at any time — including ones created before these fields existed — so that
    the catalogue can be corrected without deleting and recreating assets (and
    losing their existing bookings).
81. As a **system administrator**, I want to delete an asset type I no longer need
    so that the booking catalogue stays relevant to what's actually available.

## Event Detail Panel (cross-cutting)

82. As **any editorial/production/technical user**, I want one panel that shows an
    event's full details, resource assignments, and cost breakdown so that I don't
    have to jump between five different pages to understand a single fixture.
83. As a **production manager**, I want to assign or change any staff role directly
    from the event panel so that I can fix a booking the moment I notice a problem,
    wherever I spotted it.
84. As a **production manager**, I want to offer a job and mark it confirmed for
    any role from this panel (not just Director/EVS/Graphics) so that Producer,
    Commentator, Cameraman, and Audio bookings get the same booking-status rigor.
85. As a **production manager**, I want to lock/unlock any individual role's
    booking from this panel so that finalising or reopening a booking doesn't
    require switching to the Operations board.
86. As a **finance/production manager**, I want a cost view for the event showing
    named-staff pay, technical equipment cost, and platform line costs so that I
    can see the full expected spend for a single fixture before it airs.
87. As a **production manager**, I want technical fields that inherit from the
    assigned pattern but can be overridden per event so that exceptions (an
    unusually large shoot, an extra camera) don't require creating a whole new
    pattern just for one event.

## Hidden Admin / Data Operations

88. As a **system administrator**, I want a hidden power-tools bar (unlocked via a
    modifier click) so that dangerous bulk/seed operations aren't visible or
    reachable during normal day-to-day use.
89. As a **system administrator**, I want to snapshot the current staff roster and
    rights matrix into seed files so that a fresh deployment starts pre-populated
    with real, current data instead of empty defaults.
90. As a **system administrator**, I want bulk "set TAMS for all/selected" and
    "clear all/selected" tools so that I can quickly correct or re-baseline
    editorial decisions across many events at once during data cleanup.

---

*Generated by inspecting the deployed component behaviour of the Sports
Broadcasting Calendar app (React 18 + Vite, local-JSON/localStorage-only, no
backend) as of v3.00. Reflects functionality actually implemented, not aspirational
or planned features.*
