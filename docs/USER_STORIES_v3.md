# Sports Broadcasting Calendar — User Stories (v3)

Reverse-engineered directly from the deployed application source (v3.02) as of
**24 August 2026**. Every story below was written after reading the relevant
component(s) in the codebase, not carried forward from earlier drafts.

**Personas used** (as agreed): **Production Coordinator**, **Planner**,
**Production Lead**, **Operations Manager**, **Team Lead**, **Production
Assistant**. Two additional personas were introduced where the app's
functionality has no owner among the six above — see the note at the bottom
of this document.

**Epics** (as declared): Calendar and Event Imports · Planning and Production
· Operations · Bookable Assets · Admin and Configuration.

Acceptance criteria use the stacked `Given:` / `When:` / `Then:` / `And:`
format throughout.

---

## Table of Contents

1. [Epic: Calendar and Event Imports](#epic-calendar-and-event-imports) (CAL-001 – CAL-023)
2. [Epic: Planning and Production](#epic-planning-and-production) (PLN-001 – PLN-018)
3. [Epic: Operations](#epic-operations) (OPS-001 – OPS-024)
4. [Epic: Bookable Assets](#epic-bookable-assets) (AST-001 – AST-016)
5. [Epic: Admin and Configuration](#epic-admin-and-configuration) (ADM-001 – ADM-024)

---

## Epic: Calendar and Event Imports

### CAL-001 — See only planned events by default
**As a** Planner, **I want to** have the Calendar show only events with a recorded platform decision by default, **so that** I achieve a clean view of what's actually being planned instead of every fixture in the system.

Given: No filter has been changed since the Calendar page loaded.
When: The Planner opens the Calendar view.
Then: Only events with at least one platform decision marked Y or P are shown.
And: The "Show all events" checkbox is unchecked.

### CAL-002 — Reveal every event on demand
**As a** Planner, **I want to** switch the Calendar to show every event regardless of decision status, **so that** I achieve visibility of fixtures that haven't been planned yet.

Given: The Calendar is showing only planned events.
When: The Planner checks "Show all events".
Then: Every event for the currently active competitions appears on the Calendar.
And: Unchecking it returns the view to planned-events-only.

### CAL-003 — Browse the Calendar by month, week or day
**As a** Planner, **I want to** switch between month, week and day views, **so that** I achieve the right level of detail for the task at hand.

Given: The Calendar is open in Month view.
When: The Planner clicks Week or Day in the header toolbar.
Then: The Calendar re-renders at that granularity, keeping the same date in view.
And: A "Today" button and prev/next arrows remain available to navigate.

### CAL-004 — Filter the Calendar by sport, organisation or competition
**As a** Planner, **I want to** toggle which sports, governing bodies, or individual competitions are visible, **so that** I achieve a calendar showing only the fixtures relevant to my current task.

Given: Several competitions exist across multiple sports.
When: The Planner clicks a competition's toggle chip in the bottom bar.
Then: Only currently-active competitions' fixtures remain visible on the Calendar.
And: Clicking a Sport chip reveals an "Organisation" row of governing-body toggles nested under it.

### CAL-005 — Show or hide everything at once
**As a** Planner, **I want to** turn every competition on or off in one click, **so that** I achieve a fast reset instead of toggling each one individually.

Given: Some competitions are active and some are not.
When: The Planner clicks "Show All".
Then: Every competition across every sport becomes active.
When: The Planner instead clicks "Clear All".
Then: Every competition is deselected and the Calendar shows no events.

### CAL-006 — Open full event detail from the Calendar
**As a** Planner, **I want to** click any event on the Calendar to open its full detail, **so that** I achieve quick access to production, staffing and cost information without leaving the Calendar page.

Given: An event tile is visible on the Calendar.
When: The Planner clicks it.
Then: The Event Inspector panel slides in from the right showing that event's competition, date/time, venue, result (if any), and Resources/Costs tabs.

### CAL-007 — Create a Sport Event
**As a** Production Coordinator, **I want to** create a new sports fixture by filling in a form, **so that** I achieve the ability to add events not already covered by the bundled fixture data.

Given: The Production Coordinator is on the Import Events page with "Sport Event" selected.
When: They choose an existing competition, enter a title (or both home and away team), and set a start date and time, then click Save.
Then: A new event is added to the Calendar under that competition.
And: A success message confirms the event was added and reminds them to toggle the competition on to see it.

### CAL-008 — Register a brand-new competition while creating a Sport Event
**As a** Production Coordinator, **I want to** add a new competition (with sport, governing body and colour) inline while creating an event, **so that** I achieve event creation for a competition that doesn't exist yet without a separate admin step.

Given: The Production Coordinator selects "+ Add new competition…" in the Competition dropdown.
When: They enter a competition name and either pick an existing sport or add a new sport name, then save the event.
Then: The new competition is registered and immediately appears in the competition toggle bar.
And: The just-created event is filed under that new competition.

### CAL-009 — Mark a Sport Event as all-day or multi-day
**As a** Production Coordinator, **I want to** flag an event as all-day and optionally give it an end date, **so that** I achieve correct calendar representation of tournaments that span more than one day.

Given: The Production Coordinator ticks "All-day event".
When: They leave End Date blank and save.
Then: The event is created as a single all-day tile on its start date.
When: They instead enter an End Date (the day after the tournament ends) and save.
Then: The event spans from the start date up to, but not including, the end date on the Calendar.

### CAL-010 — Attach production detail while creating a Sport Event
**As a** Production Coordinator, **I want to** optionally set a production type, named staff, technical resource counts, equipment counts and a pre-production cost when creating an event, **so that** I achieve a fully resourced event in one step instead of having to revisit it later.

Given: The Production Coordinator expands the optional Production, Technical Resources, Equipment and Costs sections on the Sport Event form.
When: They pick a Production Type.
Then: The technical resource fields below are pre-filled from that pattern's defaults.
When: They fill in Director/Production Manager/etc. and a Pre-Production Cost, then save.
Then: All of that data is stored against the new event and is visible immediately in the Event Inspector's Resources and Costs tabs.

### CAL-011 — Create a Programme Event
**As a** Production Coordinator, **I want to** create a non-sport programme event with a Programme Title and Department instead of team/competition fields, **so that** I achieve correct scheduling of studio programming alongside sports fixtures.

Given: The Production Coordinator switches the Import Events form to "Programme Event".
When: They enter a Programme Title, pick or create a Department, and set a start date and time, then click Save.
Then: A new event is added to the Calendar filed under a "Programme" sport group with that Department as its competition.
And: The Production section is limited to Director, Production Manager and Producer; there is no Production Type dropdown.
And: Technical Resources has no Production Booth or OB Unit fields, "Studio Sound" replaces "Audio on Location", and Studio defaults to Yes.
And: There is no Equipment section, and the Costs field is labelled "Fixed Studio Cost" instead of "Pre-Production Cost".

### CAL-012 — Register a new Department while creating a Programme Event
**As a** Production Coordinator, **I want to** add a brand-new Department inline while creating a Programme Event, **so that** I achieve programme scheduling for a department that hasn't been used before.

Given: The Production Coordinator selects "+ Add new department…" in the Department dropdown.
When: They type a department name and save the Programme Event.
Then: The department is auto-registered with its own colour and appears as a competition-style toggle under the "Programme" sport group going forward.

### CAL-013 — Make a Programme Event repeat
**As a** Production Coordinator, **I want to** set a Programme Event to repeat daily, weekly, or on a custom interval, ending after a number of occasions or on a specific date, **so that** I achieve one-step scheduling of a recurring strand instead of creating each airing by hand.

Given: The Production Coordinator sets Repeat to Daily and "Ends" to "After 5 occasion(s)".
When: They save the form.
Then: Five separate calendar events are created, one per day starting from the chosen start date, each carrying the same title, department, production assignment and technical resources.
And: The success message states how many occurrences were created.

### CAL-014 — Bulk-import a competition's fixtures from Excel
**As a** Production Coordinator, **I want to** upload a spreadsheet of fixtures for a competition and review them before committing, **so that** I achieve fast onboarding of a full season's schedule instead of entering each match individually.

Given: The Production Coordinator opens "Import from Excel" and selects a file matching the Sport/Competition/Date-Time-Duration-Venue-Home Team-Away Team template.
When: The file parses successfully.
Then: A preview table lists every row that will be imported, with any skipped rows explained as warnings.
When: They click Accept.
Then: All previewed events are added to the Calendar under that competition (creating the competition if it doesn't already exist).

### CAL-015 — Be warned about an invalid or malformed import file
**As a** Production Coordinator, **I want to** see a clear error if my spreadsheet doesn't match the expected template, **so that** I achieve a fast fix instead of a failed, confusing import.

Given: The Production Coordinator selects a file missing the Sport/Competition header rows, or with no valid data rows.
When: They click Import.
Then: An error message names exactly what's missing (e.g. "Could not find 'Sport' and 'Competition' rows") and no events are created.

### CAL-016 — Delete an event and everything tied to it
**As a** Planner, **I want to** delete an event from the Event Inspector and have every reference to it removed app-wide, **so that** I achieve a schedule that no longer shows a cancelled or duplicate fixture anywhere in the system.

Given: An event has a production assignment, an editorial decision, a staff booking and a lock recorded against it.
When: The Planner opens that event's inspector panel and clicks "Delete Event", then confirms the warning dialog.
Then: The event disappears from the Calendar and every other view immediately.
And: Its production_assignments, editorial_decisions, staff_bookings and staff_locks records are all removed, and Planning/Production/Technical/Operations/Book Staff/Resource Gaps no longer reference it.

### CAL-017 — Be warned before deleting an event
**As a** Planner, **I want to** see a confirmation dialog before an event is permanently deleted, **so that** I achieve protection against an accidental, unrecoverable removal.

Given: The Planner has clicked "Delete Event" in the Event Inspector.
When: The confirm dialog appears naming the event and stating the action cannot be undone.
Then: Clicking Cancel leaves the event and all its data untouched.
And: Only confirming proceeds with deletion.

### CAL-018 — See day-by-day resourcing gaps across all active events
**As a** Operations Manager, **I want to** see which upcoming production days have unfilled director/EVS/graphics roles, **so that** I achieve early warning of a gap I need to fill before transmission.

Given: Several events are flagged Init Production or already have an assignment.
When: The Operations Manager opens Resource Gaps.
Then: Each date with at least one "Freelance required" role, or an event day with no qualified/available director, is listed under that date with the missing roles badged.
And: A day with everything covered shows "All required resources are available" instead.

### CAL-019 — See freelancer booking progress per event on the gaps view
**As a** Operations Manager, **I want to** see confirmed/offered/not-offered counts for each event's freelance roles, **so that** I achieve a quick read on which events still need chasing.

Given: An event has three freelance roles assigned, one confirmed and two not yet offered.
When: The Operations Manager views that event's row in Resource Gaps.
Then: The row shows "Confirmed = 1", "Offered = 0", "Not offered yet = 2".
And: The row is visually flagged as incomplete until all freelance roles are confirmed.

### CAL-020 — Filter Resource Gaps to what needs attention
**As a** Operations Manager, **I want to** filter the gaps list to Unavailable only, Incomplete, or All, **so that** I achieve focus on the events that actually need action.

Given: Resource Gaps defaults to "Unavailable only".
When: The Operations Manager clicks "Incomplete".
Then: Days with fully-covered-but-not-yet-confirmed bookings are also shown.
When: They click "All".
Then: Every active event, including fully confirmed ones, is listed.

### CAL-021 — See a possible-only event flagged distinctly
**As a** Planner, **I want to** see events that are only possible (no confirmed platform) marked as such wherever they appear, **so that** I achieve a clear distinction between certain and speculative coverage.

Given: An event has a P decision on at least one platform and no Y decisions.
When: The Planner views it on Planning, Production, or Resource Gaps.
Then: The row is visually highlighted and, on Resource Gaps, tagged "Possible event".

### CAL-022 — Jump to today or any date on Resource Gaps
**As a** Operations Manager, **I want to** jump the Resource Gaps list straight to today's date, **so that** I achieve a fast return to the current planning horizon after scrolling.

Given: The Resource Gaps list has been scrolled away from today.
When: The page loads (or is revisited).
Then: It automatically scrolls to the nearest date on or after today.

### CAL-023 — Auto-generate an event title from team names
**As a** Production Coordinator, **I want to** leave the Event Title blank and have it built automatically from the home and away teams, **so that** I achieve consistent naming without typing it out every time.

Given: The Production Coordinator leaves Event Title empty but fills in both Home Team and Away Team.
When: They save the Sport Event.
Then: The event's title is set to "<Home Team> v <Away Team>".
And: If neither a title nor both team names are given, the form blocks submission with a validation error.

---

## Epic: Planning and Production

### PLN-001 — Record a per-platform coverage decision
**As a** Planner, **I want to** mark each fixture as confirmed (Y), possible (P), or undecided per broadcast platform, **so that** I achieve a shared, unambiguous record of what's actually going out and where.

Given: A fixture has no decision recorded for a platform.
When: The Planner clicks that platform's cell.
Then: It becomes Y (confirmed); clicking again sets it to P (possible); clicking a third time clears it.
And: Pressing "Y" or "P" while the cell is focused sets that value directly, and Delete/Backspace clears it.

### PLN-002 — Bulk-fill a run of decisions with shift-click
**As a** Planner, **I want to** shift-click a decision cell to apply the same value to every row between my last click and this one, **so that** I achieve fast bulk-tagging of a whole run of fixtures instead of clicking each one.

Given: The Planner has just set one event's platform cell to Y.
When: They shift-click the same platform's cell on a fixture further down the list.
Then: Every fixture between the two rows has that platform cell set to Y.

### PLN-003 — Be warned when marking coverage for a platform with no rights
**As a** Planner, **I want to** be stopped and asked to confirm before recording a Y or P decision for a platform the competition has no rights for, **so that** I achieve protection against accidentally committing to coverage that isn't legally possible.

Given: Admin → Rights has "N" recorded for this competition/platform pair.
When: The Planner clicks that platform's decision cell to set it to Y or P.
Then: A dialog states "You do not have the rights for this selection. Continue anyway?"
And: Confirming logs the decision anyway; declining leaves the cell unchanged.
And: A platform with "N" rights shows a red cross overlay on its column for that competition even before any click.

### PLN-004 — Flag an event for production
**As a** Planner, **I want to** tick an "Init Production" checkbox on a fixture, **so that** I achieve automatic inclusion of that event on Production, Technical, Operations and Resource Gaps without re-entering it anywhere else.

Given: A fixture has Init Production unticked.
When: The Planner ticks it.
Then: The event appears in the Production worklist, in Technical's daily totals (if it has a Y/P decision too), and — if its pattern needs a booth, studio or OB unit — in Operations.
And: Shift-clicking the checkbox bulk-fills the same value across a run of rows, exactly like the decision cells.

### PLN-005 — Jump straight to a chosen date on Planning
**As a** Planner, **I want to** jump to today's date or any date I pick, **so that** I achieve fast navigation without scrolling through months of fixtures.

Given: The Planning grid is showing an arbitrary scroll position.
When: The Planner clicks "Today".
Then: The view scrolls to today's row (or the first upcoming row if none is today).
When: They instead pick a date in the date-picker.
Then: The view scrolls to, and highlights, the first row on or after that date.

### PLN-006 — See only events flagged for production, sorted by date
**As a** Production Lead, **I want to** see only events with Init Production ticked, in date order, **so that** I achieve a worklist that isn't cluttered with fixtures nobody is covering.

Given: Some fixtures have Init Production ticked and others don't.
When: The Production Lead opens Production.
Then: Only the ticked fixtures are listed, sorted by date/time.
And: If none are flagged, an empty-state message directs them to tick Init Production on Planning first.

### PLN-007 — Assign a production pattern to an event
**As a** Production Lead, **I want to** assign a production pattern (resource template) to each event from the Production page, **so that** I achieve automatically-derived crew and technical requirements instead of typing them per event.

Given: A production pattern named "4 Cam middle League" exists with predefined crew/line counts.
When: The Production Lead selects it for an event.
Then: That pattern is stored against the event and its name appears in the Technical Resources hint in the Event Inspector.
And: Changing the pattern later updates the derived requirements to match.

### PLN-008 — Get a qualified, non-clashing director shortlist
**As a** Production Lead, **I want to** the Director dropdown to only show people qualified for the chosen pattern and not already booked elsewhere that day, **so that** I achieve protection against double-booking or under-qualifying a shoot.

Given: A pattern requires the "8 Cam+" capability.
When: The Production Lead opens the Director dropdown for an event using that pattern.
Then: Only directors tagged with that capability, and not already assigned as director to another event on the same date, appear in the list.
And: Staff (non-freelance) directors are listed ahead of freelancers.

### PLN-009 — See an explicit "Freelance Required" flag
**As a** Production Lead, **I want to** be told explicitly when no qualified, available director exists for an event, **so that** I achieve a clear signal to source a freelancer rather than assume the slot is simply empty.

Given: A pattern is chosen and the qualified/available director pool for that event's date is empty.
When: The Production Lead views that event's Director column.
Then: "Freelance Required" is shown in place of a director dropdown.
And: If a director frees up later, the dropdown reappears in place of the flag.

### PLN-010 — Assign a production manager per event
**As a** Production Lead, **I want to** assign a production manager to each event from a dedicated dropdown, **so that** I achieve clear on-site accountability for every covered fixture.

Given: The Production Manager roster is configured in Admin → Staff.
When: The Production Lead selects a name in the Production Manager column for an event.
Then: It is saved against that event immediately, with no separate save step.

### PLN-011 — Assign production detail directly from the Event Inspector
**As a** Production Lead, **I want to** set production type, director, production manager, producer, commentator, cameraman, EVS operator, audio and graphics staff from the Event Inspector, **so that** I achieve the same resourcing control without switching to the Production page.

Given: The Production Lead opens an event's inspector panel with the Resources tab selected.
When: They change the Production Type dropdown.
Then: All technical resource fields below reset to that pattern's defaults, replacing any prior overrides.
When: They pick a name in any staff dropdown.
Then: That assignment is saved immediately and reflected in Production/Operations/Book Staff.

### PLN-012 — Override a pattern's technical resource defaults per event
**As a** Production Lead, **I want to** manually adjust an individual event's camera/line/booth counts away from its pattern's defaults, **so that** I achieve accurate resourcing for the rare event that doesn't fit its usual template.

Given: An event uses the "4 Cam middle League" pattern (4 cameramen by default).
When: The Production Lead changes Cameramen to 5 in the Event Inspector.
Then: That event now shows 5 cameramen everywhere resource totals are calculated, marked visually as an override, while the pattern itself remains unchanged for other events.

### PLN-013 — See daily technical resource totals
**As a** Production Lead, **I want to** see a day-by-day roll-up of required cameramen, EVS operators, audio, and video/audio/talkback lines, **so that** I achieve forward planning of crewing and circuit bookings ahead of transmission day.

Given: One or more events on a date have a Y or P platform decision.
When: The Production Lead opens Technical.
Then: That date shows a resource table totalling every pattern-derived (or overridden) requirement across those events.
And: A date with no decided events is simply not shown; if no dates qualify at all, an empty-state message points back to Planning.

### PLN-014 — See confirmed vs. possible demand separately
**As a** Production Lead, **I want to** see confirmed and possible events' resource needs shown separately as well as combined, **so that** I achieve visibility of worst-case demand without over-committing to fixtures that might not happen.

Given: A date has two Y-decided events and one P-decided (possible-only) event.
When: The Production Lead views that day on Technical.
Then: The event lists and resource totals are split into "Confirmed" and "Possible" columns, plus a "Combined Total" column summing both.

### PLN-015 — Jump to a date on Technical
**As a** Production Lead, **I want to** jump straight to today or a chosen date on the Technical page, **so that** I achieve fast access to the day I'm currently resourcing.

Given: The Technical page is scrolled away from today.
When: The Production Lead clicks Today or picks a date.
Then: The view scrolls to the nearest qualifying day on or after that date.

### PLN-016 — See which pattern is driving each event's requirements
**As a** Production Lead, **I want to** see the pattern name next to every event listed in Technical's daily breakdown, **so that** I achieve confidence that the totals reflect the right template.

Given: An event has a pattern assigned.
When: The Production Lead views that day in Technical.
Then: The event's list entry shows a pill with the pattern's name; an event with no pattern shows "— no pattern —".

### PLN-017 — Round-trip staff availability into director allocation
**As a** Production Lead, **I want to** the same-day-clash check to consider every event that day, not just ones I'm currently looking at, **so that** I achieve a genuinely accurate shortlist rather than one that misses a clash on another fixture.

Given: A director is already assigned to Event A on 2026-09-12.
When: The Production Lead opens the Director dropdown for Event B, also on 2026-09-12.
Then: That director is excluded from Event B's dropdown regardless of which page or order the two events were resourced in.

### PLN-018 — See a Programme Event's trimmed Production section on Production/Technical
**As a** Production Lead, **I want to** the Production and Technical pages to treat a Programme Event's derived requirements the same way as any other event, **so that** I achieve consistent day-by-day totals across sport and programme output.

Given: A Programme Event with Studio = Yes and Cameramen = 0 exists.
When: The Production Lead views its day on Technical.
Then: Its contribution to the daily resource totals reflects those explicit values (0 cameramen, Studio counted), exactly as a Sport Event's overrides would be.

---

## Epic: Operations

### OPS-001 — See per-day booth, studio and OB unit allocation
**As a** Operations Manager, **I want to** see every event needing a production booth, studio, or OB unit grouped by day, **so that** I achieve a single place to check and fill Operations-day staffing.

Given: Several Init-Production events have Production Booth, Studio, or OB Unit set to Yes (via pattern or override).
When: The Operations Manager opens Operations.
Then: Each date shows a row of booth cards, a "Studios" row, and an "OB Units" row as applicable, each card showing the event, time, venue, sport, pattern and current Director/EVS/Graphics allocation.
And: A day with no such events at all shows an empty-state message.

### OPS-002 — Auto-allocate a day's booth/studio/OB unit staff
**As a** Operations Manager, **I want to** auto-allocate director, EVS operator and graphics operator across a day's events in one click, **so that** I achieve fast, qualification-aware staffing instead of assigning each event by hand.

Given: A day has several booth events with no staff assigned yet.
When: The Operations Manager clicks "Auto allocate this day".
Then: Each unfilled role is filled with a qualified person not already used elsewhere that day, prioritising confirmed (Y) events over possible (P) ones over unscheduled ones.
And: A role that can't be filled from the qualified pool is set to "Freelance required" instead of being left blank.
And: Locked roles and roles that already have a name are left untouched.

### OPS-003 — Auto-allocate everything at once
**As a** Operations Manager, **I want to** run auto-allocation across every day in one click, **so that** I achieve a fully staffed Operations board in a single action at the start of a planning cycle.

Given: Multiple days have unfilled booth/studio/OB unit roles.
When: The Operations Manager clicks "Allocate Everything".
Then: Every day is auto-allocated in date order, each day's picks respecting the same-day-only-one-job-per-person rule.

### OPS-004 — Allocate staff forward from a chosen day
**As a** Operations Manager, **I want to** auto-allocate every day from a chosen date onward, **so that** I achieve staffing of the rest of the schedule without re-touching days already sorted.

Given: Today's date and every day after it still has gaps.
When: The Operations Manager clicks "Allocate forward" on a given day's header.
Then: That day and every later day are auto-allocated, days before it left untouched.

### OPS-005 — Clear a day's non-locked staff allocations
**As a** Operations Manager, **I want to** clear all non-locked director/EVS/graphics allocations for one day, **so that** I achieve a clean slate to re-allocate after a schedule change.

Given: A day has a mix of locked and unlocked role assignments.
When: The Operations Manager clicks "Clear this day" and confirms.
Then: Every unlocked role on that day is emptied; locked roles are left exactly as they were.
And: Any freelancer whose offer/acceptance was cleared is reported in a toast ("N accepted freelancer(s) reset to not offered" / "N offered...").

### OPS-006 — Clear all staff across the whole board
**As a** Operations Manager, **I want to** clear every non-locked allocation across every day in one click, **so that** I achieve a full reset when starting a new staffing pass.

Given: Multiple days have allocations, some locked.
When: The Operations Manager clicks "Clear all staff" and confirms the warning dialog.
Then: Every unlocked director/EVS/graphics role across every day is emptied, and a summary toast reports how many accepted/offered freelancers were reset.

### OPS-007 — Clear allocations forward from a chosen day
**As a** Operations Manager, **I want to** clear all non-locked allocations from a chosen date onward, **so that** I achieve a targeted reset of upcoming days without disturbing days already confirmed.

Given: A schedule change affects everything from next Tuesday onward.
When: The Operations Manager clicks "Clear allocation forward" on that day's header and confirms.
Then: That day and every later day have their unlocked roles cleared; earlier days are untouched.

### OPS-008 — Lock a single person's role assignment
**As a** Operations Manager, **I want to** lock an individual director/EVS/graphics assignment, **so that** I achieve protection of that one confirmed booking from being wiped by a bulk clear or re-allocate.

Given: An event's Director field shows a named allocation.
When: The Operations Manager clicks "Lock" on that role.
Then: The role shows "Locked" and is skipped by Clear/Allocate actions until explicitly unlocked.
And: An empty (TBA) or "Freelance required" slot cannot be locked.

### OPS-009 — Lock an entire event's staffing
**As a** Operations Manager, **I want to** lock all of an event's booth roles at once, **so that** I achieve one-click protection of a fully-staffed event ahead of a bulk operation.

Given: An event has director, EVS and graphics all assigned.
When: The Operations Manager clicks "Lock event" on that card.
Then: All of that event's roles become locked in one action; the button reads "Locked" and unlocking it releases all three together.

### OPS-010 — See an over-capacity warning on the booths board
**As a** Operations Manager, **I want to** see a visual warning when more booth events are scheduled on a day than there are physical booths, **so that** I achieve early notice of a resourcing clash before transmission day.

Given: Admin → Tech Stack defines a maximum number of production booths.
When: A day's booth events exceed that number.
Then: Every booth card beyond the limit is visually flagged "Over capacity".

### OPS-011 — Offer a job to a freelancer from Book Staff
**As a** Operations Manager, **I want to** offer a role to an assigned freelancer and get on-screen confirmation of who/what/when, **so that** I achieve certainty that the right offer was recorded, including that a calendar invite went out.

Given: A freelancer is assigned to the Director role on an event, with no booking status recorded yet.
When: The Operations Manager clicks "Offer job".
Then: The booking status becomes "Offered".
And: A toast reading "<name> has been offered <role> for <event> on <date> at <time>. A calendar invite has also been sent out." appears and disappears automatically after 8 seconds.

### OPS-012 — Confirm a freelancer's acceptance
**As a** Operations Manager, **I want to** mark an offered freelancer as Accepted, **so that** I achieve an accurate, final record of who is actually booked.

Given: A freelancer's role status is "Offered".
When: The Operations Manager clicks "Accepted".
Then: The status becomes "Confirmed" and the role is automatically locked (pencil becomes locked) so it isn't accidentally wiped by a bulk clear.

### OPS-013 — Manually lock or unlock a freelancer's booking from Book Staff
**As a** Operations Manager, **I want to** lock or unlock any row's booking independent of its status, **so that** I achieve manual control over which bookings are protected from bulk clears.

Given: A freelancer's row shows "Pencil" (unlocked).
When: The Operations Manager clicks "Lock".
Then: The row shows "Locked", and clicking again toggles it back to "Pencil".

### OPS-014 — Filter Book Staff by role and confirmation status
**As a** Operations Manager, **I want to** switch between role tabs (Director, Prod. Manager, EVS Operator, Graphics, Cameramen, Onsite Audio, Producer, Commentator, MAM Checkers) and filter to only unconfirmed bookings, **so that** I achieve a focused worklist for the role and status I'm currently chasing.

Given: Multiple roles have assignments across many events.
When: The Operations Manager selects the "Cameramen" tab and the "Unconfirmed" filter.
Then: Only cameraman assignments that are not yet Confirmed are listed, sorted by date.

### OPS-015 — See Staff vs Freelance status at a glance
**As a** Operations Manager, **I want to** see a clear Staff/Freelance badge on every row, **so that** I achieve instant recognition of which bookings need an offer/accept workflow at all.

Given: A role is filled by a permanent staff member.
When: The Operations Manager views Book Staff.
Then: That row shows a "Staff" badge and its status is automatically "Confirmed" with no Offer/Accept buttons shown.
And: A freelancer's row shows a "Freelance" badge with the full Offer → Accepted workflow available.

### OPS-016 — Offer and confirm a job directly from the Event Inspector
**As a** Operations Manager, **I want to** run the same offer/confirm/lock workflow for every staff role from within the Event Inspector, **so that** I achieve staffing an event without switching to a separate Book Staff page.

Given: An event's inspector panel is open on the Resources tab, with a freelance Director assigned and unbooked.
When: The Operations Manager clicks "Offer job" next to Director.
Then: The same 8-second toast confirming the offer appears next to the panel, and the button changes to "Confirm".
And: This works identically for Prod. Mgr, Producer, Commentator, Cameraman, EVS and Audio/Graphics fields.

### OPS-017 — See booking status colour-coded on every role field
**As a** Operations Manager, **I want to** see each staff field colour-coded by its booking status (confirmed, offered, unbooked), **so that** I achieve a fast visual scan of an event's staffing readiness.

Given: An event has one confirmed, one offered and one unbooked freelance role.
When: The Operations Manager opens its inspector panel.
Then: Each of the three fields is styled distinctly according to its status.

### OPS-018 — See day-by-day media/QC checklist for TAMS-flagged events
**As a** MAM Checker, **I want to** see every event selected for TAMS delivery in one worklist with QC checkboxes, filenames and record-port numbers, **so that** I achieve a single place to complete and track media logging for transmission.

Given: One or more events have a Y or P decision recorded for the platform named "TAMS".
When: The MAM Checker opens Asset Management.
Then: Those events are listed in date order with auto-generated Rec/Highlights filenames, NL Check / Log Sheet / Log on Viz checkboxes, Viz Check / Metadata Filled dropdowns (populated from the MAM Checkers staff roster), and an auto-assigned Record Port number for the day.
And: If no platform named "TAMS" exists, or no events have it selected, a clear empty-state message explains why.

### OPS-019 — Be warned when record port demand exceeds capacity
**As a** MAM Checker, **I want to** see a clear "Unavailable" flag when a day's TAMS events exceed the configured number of record ports, **so that** I achieve early warning of a capacity clash rather than discovering it at ingest time.

Given: Admin → Tech Stack defines 25 record ports, and 27 TAMS events fall on one day.
When: The MAM Checker views that day's rows in Asset Management.
Then: The 26th and 27th rows show "Unavailable" in the Record Port column instead of a port number.

### OPS-020 — Track QC sign-off per event
**As a** MAM Checker, **I want to** tick off NL Check, Log Sheet, Log on Viz, and enter Viz Check / Metadata Filled by name, **so that** I achieve an auditable record of who signed off each piece of media.

Given: An event's QC checklist is untouched.
When: The MAM Checker ticks the checkboxes and selects their name in the Viz Check dropdown.
Then: Those values are saved immediately per event and persist across reloads.

### OPS-021 — See possible-only events flagged on the Operations board
**As a** Operations Manager, **I want to** see events that are only possible (P, not Y) clearly marked on the booths/studio/OB-unit board, **so that** I achieve appropriate caution before firmly committing crew to a fixture that might not go ahead.

Given: A booth event has only a P decision recorded.
When: The Operations Manager views its card.
Then: The card is labelled "Possible event".

### OPS-022 — Jump to today or a chosen date on Operations
**As a** Operations Manager, **I want to** jump the Operations board to today or a picked date, **so that** I achieve fast access to the day I'm currently staffing.

Given: Operations is scrolled away from today.
When: The Operations Manager clicks Today or picks a date.
Then: The board scrolls to the nearest matching day.

### OPS-023 — See a booking-cleared summary after a bulk clear
**As a** Operations Manager, **I want to** see how many accepted and offered freelancers were reset by a clear action, **so that** I achieve confidence about the blast radius of what I just did.

Given: A "Clear this day" action wiped 2 accepted and 1 offered freelancer booking.
When: The clear completes.
Then: A toast reading the counts appears and disappears automatically after 5 seconds.

### OPS-024 — Offering a job never touches an already-locked or already-staff role
**As a** Operations Manager, **I want to** the Offer/Confirm workflow to be unavailable for locked roles and for permanent staff, **so that** I achieve protection against accidentally reopening a booking that's already settled.

Given: A role is either locked or filled by permanent staff.
When: The Operations Manager views that row in Book Staff or the Event Inspector.
Then: No Offer/Confirm buttons are shown for that role — only the Lock/Unlock control (for locked roles) or nothing at all (for staff, who are always "Confirmed").

---

## Epic: Bookable Assets

### AST-001 — Define a new type of bookable asset
**As a** Production Assistant, **I want to** create a new asset type with a name, quantity and default booking duration, **so that** I achieve the ability to book out shared resources like edit suites that aren't tied to a specific event.

Given: The Production Assistant opens Admin → Bookable Assets and clicks "+ Create Asset(s)".
When: They enter a name (e.g. "Edit Suites"), quantity, cost and default duration, then submit.
Then: That asset type appears as a card, with each of its numbered units available to book.

### AST-002 — Adjust an asset's cost or default duration
**As a** Production Assistant, **I want to** edit an existing asset's cost and default duration in place, **so that** I achieve up-to-date booking defaults without recreating the asset.

Given: An asset card is showing its current cost and duration.
When: The Production Assistant changes either value.
Then: The change saves immediately and applies to future bookings' pre-filled duration.

### AST-003 — Remove an asset type
**As a** Production Assistant, **I want to** delete an asset type that's no longer offered, **so that** I achieve a booking list that only shows what's actually available.

Given: An asset type exists.
When: The Production Assistant clicks its delete (✕) button.
Then: It is removed from the list; existing bookings referencing it are unaffected in storage but the type can no longer be selected for new bookings.

### AST-004 — Book a specific unit of an asset for a time window
**As a** Production Assistant, **I want to** book a specific numbered unit of an asset for a chosen date, start time and duration, **so that** I achieve a reserved slot for a specific production's needs.

Given: "Edit Suites" has 3 units defined.
When: The Production Assistant selects the asset, picks unit 2, a date, a start time and a duration, then clicks Book.
Then: A booking is created for that exact unit and time window, immediately visible in both List and Timeline views.

### AST-005 — Book an asset that's needed for more than one day
**As a** Production Assistant, **I want to** set an end date (and end time) on a booking so it spans multiple days, **so that** I achieve accurate reservation of an asset for a multi-day production instead of one artificial single-day booking.

Given: The Production Assistant is booking "Craft Edit 1" starting 24 Aug at 09:00.
When: They push the End date field forward to 27 Aug and leave the end time at 17:00.
Then: The Duration field auto-updates to 80 hours, and the booking is stored as a single continuous reservation from 24 Aug 09:00 to 27 Aug 17:00.
And: Editing the Duration field directly likewise recalculates the End date/End time to match.

### AST-006 — See a multi-day booking on every day it occupies
**As a** Production Assistant, **I want to** see a multi-day booking's timeline chip on every day it spans, not just its start day, **so that** I achieve an accurate view of the asset's real availability across the whole week.

Given: "Craft Edit 1" is booked continuously from 24 to 27 August.
When: The Production Assistant views the Timeline for that week.
Then: The start day's chip reads the full time range with a "(+3d)" suffix, and each subsequent day (25, 26, 27 Aug) shows a distinct "↦ continues" chip for the same booking.
And: Opening the Day Detail view for 26 August lists that booking with a "Continues from Mon, 24 Aug 2026" tag.

### AST-007 — Make an asset booking repeat
**As a** Production Assistant, **I want to** set a booking to repeat daily, weekly, or on a custom interval, ending after N occasions or on a date, **so that** I achieve one-step booking of a recurring weekly slot instead of creating it by hand every time.

Given: The Production Assistant sets Repeat to Weekly and Ends to "Until 30/09/2026".
When: They submit the form.
Then: One booking is created per week up to and including that end date, all linked as a single series.
And: The series is tagged "Recurring" in the List view.

### AST-008 — Be blocked from double-booking an asset
**As a** Production Assistant, **I want to** be shown exactly which existing booking clashes before I can confirm a new one, **so that** I achieve protection against accidentally reserving an asset that's already in use.

Given: "Camera 1" is already booked 09:00–17:00 on 26 August.
When: The Production Assistant tries to book "Camera 1" for 12:00–15:00 the same day.
Then: A warning lists the clashing booking (who booked it, its time range, and the overlapping hours) and the Book button is disabled until the clash is resolved.

### AST-009 — Record who booked an asset and why
**As a** Production Assistant, **I want to** record who booked an asset plus optional Production, Contract Number, Programme and free-text Notes, **so that** I achieve traceability of every booking back to the production it supports.

Given: The Production Assistant is filling in a booking.
When: They enter "Booked by", Production, Contract Number, Programme and Notes, then submit.
Then: All of those fields are stored with the booking and shown on its List/Timeline/Day-Detail entries.

### AST-010 — Edit an existing booking
**As a** Production Assistant, **I want to** open any booking and change its asset, unit, time, duration or metadata, **so that** I achieve correction of a booking without deleting and recreating it.

Given: A booking exists for "Sound Recording 2" on 28 August.
When: The Production Assistant clicks it and changes the start time, then saves.
Then: The booking updates in place, re-checked against clashes before the save is allowed to complete.

### AST-011 — Edit every occurrence of a recurring booking at once
**As a** Production Assistant, **I want to** apply an edit to the whole recurring series instead of just one occurrence, **so that** I achieve a single update instead of editing every date individually.

Given: A weekly-recurring booking series exists.
When: The Production Assistant edits one occurrence and ticks "Apply these changes to every occurrence in the series".
Then: The shared fields (asset, unit, time, duration, notes, etc.) update across every occurrence in the series, while each occurrence keeps its own individual date.

### AST-012 — Delete a single booking or an entire series
**As a** Production Assistant, **I want to** delete just one occurrence, or an entire recurring series, **so that** I achieve the right scope of removal depending on whether a whole strand or just one date was cancelled.

Given: A recurring booking series has 6 occurrences.
When: The Production Assistant opens one occurrence and clicks "Delete booking" then confirms.
Then: Only that one occurrence is removed; the rest of the series remains.
When: They instead click "Delete series" and confirm.
Then: All 6 occurrences are removed in one action.

### AST-013 — Switch between List and Timeline views
**As a** Production Assistant, **I want to** switch between a chronological list of bookings and a per-asset weekly timeline grid, **so that** I achieve whichever view suits the task — scanning upcoming bookings, or checking an asset's live availability.

Given: Bookings exist for several assets.
When: The Production Assistant clicks "Timeline".
Then: A grid shows every asset unit as a row and each day as a column, with booking chips placed accordingly, and 14 days visible at a time with Prev/Next/Today navigation.

### AST-014 — Start a booking directly from the Timeline grid
**As a** Production Assistant, **I want to** click an asset row or a specific day cell on the Timeline to start a new booking pre-filled with that asset/unit/date, **so that** I achieve a faster booking flow than filling in every field from scratch.

Given: The Production Assistant is viewing the Timeline.
When: They click an empty cell in the "Camera 3" row under 29 Aug.
Then: The booking form opens with Camera 3, unit and 29 Aug already selected.

### AST-015 — Drill into a single day's bookings
**As a** Production Assistant, **I want to** click a day header on the Timeline to see every booking on that day in one list, **so that** I achieve a focused view when a day is too busy to read on the grid.

Given: 26 August has multiple overlapping-looking chips across several assets.
When: The Production Assistant clicks the "26 Aug" column header.
Then: A Day Detail view lists every booking touching that date (including ones that started earlier and continue through it), each clickable to edit, plus a "+ Book Asset" shortcut pre-filled with that date.

### AST-016 — See a blocked booking flow when no assets exist yet
**As a** Production Assistant, **I want to** be told clearly to define an asset type first if none exist, **so that** I achieve a clear next step instead of a confusing dead-end "Book Asset" button.

Given: No bookable asset types have been created.
When: The Production Assistant opens Book Assets.
Then: The "+ Book Asset" button is disabled with a tooltip pointing to Admin → Bookable Assets, and the List/Timeline views show an explanatory empty state instead of a blank grid.

---

## Epic: Admin and Configuration

### ADM-001 — Create a reusable production pattern
**As a** System Administrator, **I want to** define a named production pattern with crew counts, line counts, timing offsets and equipment flags, **so that** I achieve a reusable resourcing template that Production Leads can apply to many events instead of configuring each one from scratch.

Given: The System Administrator opens Admin → Patterns and clicks "+ New".
When: They set a name, required capability, crew/video/audio counts, schedule offsets, and Production Booth/Studio/OB Unit/Passthrough flags, then click Save Pattern.
Then: The pattern appears in the sidebar list with a one-line summary, and becomes selectable from every Production Type dropdown in the app.

### ADM-002 — Copy an existing pattern as a starting point
**As a** System Administrator, **I want to** duplicate an existing pattern under a new name, **so that** I achieve a fast way to create a variant without re-entering every field.

Given: A pattern "8 Cam Feature Match" exists.
When: The System Administrator clicks "Copy" on it.
Then: A new unsaved draft named "Copy of 8 Cam Feature Match" opens in the editor with all the same field values, ready to adjust and save as a distinct pattern.

### ADM-003 — Delete a pattern
**As a** System Administrator, **I want to** remove a pattern that's no longer used, **so that** I achieve a clean, relevant list of production types.

Given: A pattern exists and is selected in the sidebar.
When: The System Administrator clicks its delete (✕) button.
Then: It's removed from the list immediately; if it was open in the editor, the editor clears.

### ADM-004 — Be warned about unsaved pattern changes
**As a** System Administrator, **I want to** see an "unsaved" indicator while editing a pattern, **so that** I achieve awareness that my edits haven't been committed yet.

Given: The System Administrator changes a field in the pattern editor.
When: They haven't clicked Save Pattern yet.
Then: The editor header shows "· unsaved" next to the title, and the Save button is only enabled while there's a name and a real change pending.

### ADM-005 — Maintain the staff/freelancer roster per role
**As a** Team Lead, **I want to** add and remove names under each staff role (Director, Cameramen, EVS Operator, etc.), **so that** I achieve an accurate, current roster for Production and Operations to book against.

Given: The Team Lead is viewing the Director role card.
When: They type a new name and click Add (or press Enter).
Then: The name is added to that role's list, sorted alphabetically, and is immediately selectable in every Director dropdown across the app.
When: They click the remove (✕) button next to an existing name.
Then: That person is removed from the role, along with any cost override or profile data recorded against them.

### ADM-006 — Set a default and per-person cost for each role
**As a** Team Lead, **I want to** set a default cost for a role and override it for specific individuals, **so that** I achieve accurate cost forecasting that reflects real day-rate differences between staff.

Given: "Director" has a default cost of £400.
When: The Team Lead enters £550 in a specific director's own cost field.
Then: That director's cost override is used everywhere costs are calculated for them; leaving their field blank falls back to the role default.

### ADM-007 — Mark a person as Staff or Freelance
**As a** Team Lead, **I want to** toggle whether a person is permanent Staff or a Freelancer, **so that** I achieve correct behaviour in the Offer/Confirm booking workflow (Staff bookings are auto-confirmed; freelancers go through Offer → Accept).

Given: A person's profile currently shows "Freelance".
When: The Team Lead clicks their Staff/Freelance tag to toggle it.
Then: It flips to "Staff", and any existing booking for them everywhere in the app now shows as automatically Confirmed with no Offer/Accept controls.

### ADM-008 — Record capability tags, seniority and email per person
**As a** Team Lead, **I want to** tag each person with capability flags (2 Cam / 4 Cam / 8 Cam+ / Studio / Tennis / Rugby), a seniority level, and an email address, **so that** I achieve the underlying data that drives pattern-qualified director shortlisting and future contact/notification features.

Given: A director has no capability tags set.
When: The Team Lead ticks "8 Cam+" and "Rugby" for them and sets seniority to 4.
Then: They immediately become eligible for the director shortlist on any event using a pattern requiring those capabilities.
And: If their email is left blank, it's auto-populated from their name (firstname.lastname@fakeemail.com) the first time their role detail page is opened.

### ADM-009 — See a person's full schedule from their staff record
**As a** Team Lead, **I want to** click on a person in their role's detail table and see every event they're allocated to, **so that** I achieve a full picture of someone's workload without cross-referencing multiple pages.

Given: "Aurelia Thorne" is assigned as Director on 3 events and Production Manager on 1.
When: The Team Lead clicks her row in the Director role detail table.
Then: A sidebar lists all 4 events with their dates and the role(s) she holds on each, sorted by date.

### ADM-010 — Define a broadcast platform
**As a** System Administrator, **I want to** create a platform with default line identifiers, four-wire count, feed routing notes and contact numbers, **so that** I achieve the reference data that Planning's decision columns and Rights grid are built from.

Given: The System Administrator clicks "+ New" in Admin → Platforms.
When: They set a name, default incoming/outgoing line, four-wire count, feed routing description, and MCR/editorial phone numbers, then save.
Then: The platform appears as a new column on the Planning grid, the Rights grid, and Technical Resources setup.

### ADM-011 — Be warned about unsaved platform changes before navigating away
**As a** System Administrator, **I want to** be prompted to save, discard, or cancel when I try to switch platforms (or create a new one) with unsaved edits, **so that** I achieve protection against silently losing in-progress changes.

Given: The System Administrator has unsaved edits open on "Sky MCR".
When: They click a different platform in the sidebar.
Then: A dialog offers Save / Discard / Cancel; only Save or Discard actually navigates away, and Cancel keeps them on the unsaved draft.

### ADM-012 — Set per-platform line capacity
**As a** System Administrator, **I want to** set a platform's video/audio/talkback/2110 line capacity, **so that** I achieve accurate technical-resource forecasting against real infrastructure limits.

Given: A platform "TAMS" is selected in the editor.
When: The System Administrator sets its Video Incoming capacity to 12.
Then: That number is stored and shown consistently in both Platforms and Tech Stack's "Lines by Platform" section (they share the same underlying data).

### ADM-013 — Configure fixed equipment counts and unit costs
**As a** System Administrator, **I want to** set quantities and per-unit costs for encoders, decoders, frame rate converters, audio offset units, outgoing idents, OB units, production booths, studios and record ports, **so that** I achieve the cost basis used throughout the app's cost calculations, and the capacity limits used for over-capacity warnings on Operations.

Given: The System Administrator sets Production Booths to 4 and its cost to £300.
When: They save.
Then: Operations flags any day with more than 4 booth events as over capacity, and every booth line item in event cost breakdowns uses £300 as its unit cost.
And: Every change auto-saves with no separate Save button.

### ADM-014 — Record broadcast rights per competition and platform
**As a** System Administrator, **I want to** record whether rights exist for each competition/platform combination, **so that** I achieve the source-of-truth that blocks Planners from accidentally scheduling coverage that isn't legally possible.

Given: The Rights grid shows "Unknown" for Premier League × Sky MCR.
When: The System Administrator clicks that cell.
Then: It cycles Unknown → Y (granted) → N (no rights) → Unknown; setting it to N causes Planning to show a rights-conflict warning if a Planner tries to mark that pair Y or P.

### ADM-015 — Set a default production pattern per competition
**As a** System Administrator, **I want to** set a default production pattern per competition from the Rights page, **so that** I achieve automatic sensible defaults for every event in that competition without a Production Lead having to pick one every time.

Given: "Gallagher Premiership" has no default pattern set.
When: The System Administrator selects "4 Cam middle League" as its default in the Rights grid.
Then: Every event in that competition with no explicit pattern override now derives its technical resources from that pattern automatically.

### ADM-016 — Unlock the hidden snapshot power-tools
**As a** System Administrator, **I want to** reveal a hidden set of bulk/dev tools by Ctrl+clicking the Admin nav tab, **so that** I achieve access to seed-regeneration and bulk-editing tools without cluttering the everyday Admin UI for other users.

Given: The snapshot tools are hidden by default.
When: The System Administrator holds Ctrl and clicks the "Admin" nav tab.
Then: An amber row of additional buttons appears at the bottom of every Admin sub-page; Ctrl+clicking Admin again hides them.

### ADM-017 — Snapshot the current staff roster into seed data
**As a** System Administrator, **I want to** download the current staff roster and profiles as a ready-to-commit seedStaff.js file, **so that** I achieve a repeatable way to bake today's staff configuration in as the default for every new user/browser.

Given: The snapshot tools are unlocked.
When: The System Administrator clicks "Snapshot".
Then: A seedStaff.js file downloads containing every role's names and profile data (isStaff, email, seniority, capability flags), formatted exactly as the app's seed module expects.

### ADM-018 — Snapshot the rights matrix into seed data
**As a** System Administrator, **I want to** download the current rights matrix as a ready-to-commit seedRights.js file, **so that** I achieve the same repeatable seeding workflow for rights data as for staff data.

Given: The snapshot tools are unlocked and rights decisions have been made for several competitions.
When: The System Administrator clicks "Snapshot Rights".
Then: A seedRights.js file downloads containing the full rights matrix, ready to replace the source file and commit.

### ADM-019 — Snapshot bookable assets and their bookings into seed data
**As a** System Administrator, **I want to** download the current bookable assets and their bookings as a ready-to-commit seedBookableAssets.js file, **so that** I achieve the same repeatable seeding workflow for the Bookable Assets feature.

Given: The snapshot tools are unlocked and assets/bookings exist.
When: The System Administrator clicks "Snapshot Assets".
Then: A seedBookableAssets.js file downloads containing both SEED_BOOKABLE_ASSETS and SEED_ASSET_BOOKINGS, ready to replace the source file and commit.

### ADM-020 — Bulk-set or clear Init Production across every event
**As a** System Administrator, **I want to** set Init Production for every event, only events with a platform decision, or clear it entirely, in one click, **so that** I achieve fast bulk test-data setup or a full reset without touching each event individually.

Given: The snapshot tools are unlocked.
When: The System Administrator clicks "Init All".
Then: Every event in the system has Init Production set to true, and a confirmation alert reports the count.
When: They instead click "Init selected".
Then: Init Production is cleared everywhere, then set true only for events with a Y/P decision on at least one platform, with a count of each reported.
When: They click "Clear All Init".
Then: Init Production is set false for every event that has a decision record.

### ADM-021 — Bulk-set or clear the TAMS platform decision
**As a** System Administrator, **I want to** set TAMS to Y for every event, derive it from other platform decisions, or clear it entirely, in one click, **so that** I achieve fast bulk configuration of TAMS delivery flags for testing or catch-up scenarios.

Given: A platform literally named "TAMS" exists in Admin → Platforms.
When: The System Administrator clicks "TAMS All".
Then: Every event's TAMS decision is set to Y, with a count reported; if no platform is named "TAMS", a clear alert explains what's missing instead.
When: They click "TAMS selected".
Then: TAMS is cleared everywhere, then set to Y for events with any other platform at Y, or P for events with any other platform at P (and no Y), with both counts reported.
When: They click "Clear TAMS".
Then: The TAMS decision is cleared for every event that has a decision record.

### ADM-022 — Seed a realistic demo distribution of editorial decisions
**As a** System Administrator, **I want to** one-click apply a realistic pattern of platform decisions across several named competitions, **so that** I achieve a populated demo/test dataset without manually clicking hundreds of decision cells.

Given: Sky MCR, TAMS, ITV Ealing and BBC 1 platforms all exist.
When: The System Administrator clicks "Select Many Events".
Then: Championship gets Sky MCR + TAMS on every event; League One and League Two get Sky MCR on a random ~50%/~25% sample; ATP Tour gets BBC 1 on every event and ITV Ealing on ~50%; Scottish Premiership gets BBC 1 on every event.
And: Those five competitions are activated in the toggle bar and the app navigates to Planning to show the result.
And: If any of the four required platforms is missing, an alert names exactly which ones need to be created first.

### ADM-023 — Clear every editorial decision in one action
**As a** System Administrator, **I want to** wipe every recorded platform decision across every event in one click, **so that** I achieve a full reset of the demo/test dataset's coverage state.

Given: The snapshot tools are unlocked.
When: The System Administrator clicks "Clear Many Events" and it completes.
Then: The entire editorial_decisions store is emptied, and a confirmation alert reports that every platform's decisions were cleared.

### ADM-024 — Navigate between Admin sub-pages
**As a** System Administrator, **I want to** switch between Patterns, Staff, Platforms, Tech Stack, Rights and Bookable Assets from a persistent bottom tab bar, **so that** I achieve fast movement between the different areas of configuration without losing my place in the app.

Given: The System Administrator is viewing Patterns.
When: They click "Rights" in the bottom tab bar.
Then: The main content area swaps to the Rights grid while the tab bar (and hidden snapshot tools, if unlocked) remains in place.

---

## Notes for the team

Two personas were introduced beyond the six the team specified, because the
app has functionality with no natural owner among Production Coordinator,
Planner, Production Lead, Operations Manager, Team Lead, or Production
Assistant:

- **System Administrator** — covers Patterns, Platforms, Tech Stack, Rights
  CRUD, and the hidden Ctrl+click snapshot/seed power-tools (ADM epic).
- **MAM Checker** — covers the TAMS media/QC logging worklist under Asset
  Management (OPS-018 – OPS-020). This role is not invented — it's the exact
  name already used for a staff role and dropdown option inside the app
  itself (Admin → Staff → "MAM Checkers").

Please confirm whether these should stand, be renamed, or be folded into one
of the six existing personas.
