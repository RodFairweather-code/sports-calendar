# Sports Broadcasting Calendar — User Stories (Methodology-Compliant)

Reverse-engineered from the deployed application (v3.00), reformatted per
`User Story Methodology.docx`: INVEST-checked, with Given/When/Then acceptance
criteria and full Jira-capture metadata per story.

> **INVEST recap** — every story below is **I**ndependent, **N**egotiable,
> **V**aluable, **E**stimable, **S**mall, and **T**estable. Acceptance criteria
> use Given/When/Then/And throughout.

**Workstream codes:** PLN Planning · PRD Production · TCH Technical ·
OPS Operations · BST Book Staff · RSG Resource Gaps · AST Asset Management ·
BKA Bookable Assets · IMP Import Events · ADM Admin · EVP Event Panel

**Source/Author** for every story: *Reverse-engineered from app behaviour —
Claude Code*. **Date Captured** for every story: *22/08/2026*. These two fields
are omitted per-story below to avoid repetition and shown once here.

---

## Workstream: Planning (PLN)
### Epic: Editorial Rights & Coverage Decisions

**[IMG-PLN-001] Show only relevant competitions on the calendar**
Priority: Medium
**As a** Editorial Coordinator
**I want** to toggle which sports, governing bodies, or individual competitions are shown on the calendar
**So that** I only see the fixtures relevant to my current planning task

Acceptance Criteria (Given / When / Then)
- Given the calendar is showing several competitions, When I click one competition's toggle, Then only currently-active competitions' fixtures remain visible.
- Given I have narrowed the view, When I click "Show All", Then every competition becomes active and all fixtures reappear.
- Given no sport is selected, When I click a governing body toggle, Then all competitions under that body switch on or off together.

**[IMG-PLN-002] Filter the calendar to IMG-distributed events only**
Priority: Medium
**As a** Rights Manager
**I want** to filter the calendar to show only events flagged as IMG events
**So that** I can review coverage for that distribution arrangement in isolation

Acceptance Criteria (Given / When / Then)
- Given at least one event has a Y or P platform decision recorded, When I check "Show only IMG events", Then only events with a recorded platform decision remain on the calendar.
- Given the filter is active, When I uncheck it, Then all fixtures for active competitions reappear.

**[IMG-PLN-003] Record a per-platform coverage decision**
Priority: High
**As a** Editorial Producer
**I want** to mark each fixture as confirmed (Y), possible (P), or undecided per broadcast platform
**So that** the whole team knows which events are actually going out and on which platforms

Acceptance Criteria (Given / When / Then)
- Given a fixture with no decision recorded for a platform, When I click that platform's decision cell, Then it becomes Y (confirmed).
- Given a cell already showing Y, When it is clicked, Then it clears back to blank.
- Given a cell is focused, When I press "P", Then it is set to Possible; When I press Delete/Backspace, Then it clears.

**[IMG-PLN-004] Flag an event for production**
Priority: High
**As a** Editorial Producer
**I want** to tick an "Init Production" checkbox on a fixture
**So that** it automatically appears on Production, Technical, Operations, and Resource Gaps without re-entering it anywhere else

Acceptance Criteria (Given / When / Then)
- Given a fixture with Init Production unticked, When I tick it, Then the event appears in the Production worklist immediately.
- Given Init Production is ticked and the event needs a booth/studio/OB unit per its pattern, When I open Operations, Then the event's card is present there too.

**[IMG-PLN-005] Jump straight to a chosen date**
Priority: Low
**As a** Editorial Producer
**I want** to jump to today's date or any date I pick
**So that** I don't have to scroll through months of fixtures to find what I'm working on

Acceptance Criteria (Given / When / Then)
- Given the Planning grid is showing an arbitrary scroll position, When I click "Today", Then the view scrolls to today's row.
- Given I pick a date in the date-picker, When the picker changes, Then the view scrolls to the first row on or after that date.

---

## Workstream: Production (PRD)
### Epic: Production Resourcing & Assignment

**[IMG-PRD-001] See only events flagged for production**
Priority: Medium
**As a** Production Manager
**I want** to see only events flagged Init Production, sorted by date
**So that** my worklist isn't cluttered with fixtures nobody is covering

Acceptance Criteria (Given / When / Then)
- Given some fixtures have Init Production ticked and others don't, When I open Production, Then only the ticked fixtures are listed, in date order.
- Given no fixtures are flagged, When I open Production, Then an empty-state message directs me to tick Init Production on Planning.

**[IMG-PRD-002] Assign a production pattern to an event**
Priority: High
**As a** Production Manager
**I want** to assign a production pattern (resource template) to each event
**So that** the correct crew and technical requirements are derived automatically instead of typed per event

Acceptance Criteria (Given / When / Then)
- Given a production pattern exists, When I select it for an event, Then that event's technical fields (camera count, EVS, lines, booth/studio/OB flags) default from the pattern.
- Given an event already has a pattern chosen, When I change it, Then the event's derived requirements update to match the new pattern.

**[IMG-PRD-003] Get a qualified, non-clashing director shortlist**
Priority: High
**As a** Production Manager
**I want** the director dropdown to only show people qualified for the pattern and not already booked that day
**So that** I can't accidentally double-book or under-qualify a shoot

Acceptance Criteria (Given / When / Then)
- Given a pattern requires an 8-camera capability, When I open the director dropdown, Then only directors tagged with that capability appear.
- Given a director is already assigned to another event on the same date, When I open the dropdown for a second event that day, Then that director does not appear in the list.

**[IMG-PRD-004] See an explicit "Freelance Required" flag**
Priority: Medium
**As a** Production Manager
**I want** to be told explicitly when no qualified director is available
**So that** I know to source a freelancer rather than assume the slot is simply unfilled

Acceptance Criteria (Given / When / Then)
- Given a pattern is chosen and the qualified/available director pool is empty, When I view that event's row, Then "Freelance Required" is shown in place of a director dropdown.
- Given a qualified director frees up (e.g. removed from another event), When the page is refreshed, Then the dropdown reappears in place of the flag.

**[IMG-PRD-005] Assign a production manager per event**
Priority: Medium
**As a** Production Manager
**I want** to assign a production manager to each event from a dedicated dropdown
**So that** on-site accountability is clear for every covered fixture

Acceptance Criteria (Given / When / Then)
- Given the Production Manager roster is configured, When I select a name in the PM column, Then it is saved against that event immediately.

---

## Workstream: Technical (TCH)
### Epic: Technical Resource Forecasting

**[IMG-TCH-001] See daily technical resource totals**
Priority: High
**As a** Technical/Engineering Coordinator
**I want** a day-by-day roll-up of required cameramen, EVS operators, audio, and video/audio/talkback lines
**So that** I can plan crewing and circuit bookings ahead of transmission day

Acceptance Criteria (Given / When / Then)
- Given one or more events on a date have a Y or P platform decision, When I open Technical, Then that date shows a resource table totalling every pattern-derived requirement for those events.
- Given no events on any date have a decision recorded, When I open Technical, Then an empty-state message directs me to Planning.

**[IMG-TCH-002] See confirmed vs. possible demand separately**
Priority: High
**As a** Technical/Engineering Coordinator
**I want** confirmed and possible events' resource needs shown separately as well as combined
**So that** I can see worst-case demand without over-committing to fixtures that might not happen

Acceptance Criteria (Given / When / Then)
- Given a date has both Y-decision and P-decision-only events, When I view that day, Then the Confirmed column, Possible column, and Combined Total column each total correctly and independently.

**[IMG-TCH-003] Jump to a specific transmission day**
Priority: Low
**As a** Technical/Engineering Coordinator
**I want** to jump to a chosen date's resource summary
**So that** I can prepare for a particular transmission day quickly

Acceptance Criteria (Given / When / Then)
- Given the Technical page is scrolled elsewhere, When I pick a date or click Today, Then the view scrolls to that day's resource block.

---

## Workstream: Operations (OPS)
### Epic: Automated Crew Allocation & Booth Management

**[IMG-OPS-001] See every booth/studio/OB-unit event grouped by day**
Priority: High
**As a** Operations Coordinator
**I want** every event needing a production booth, studio, or OB unit shown as a card grouped by day
**So that** I can see how many resources are in use on any given date

Acceptance Criteria (Given / When / Then)
- Given an event's pattern has Production Booth = Yes, When it is flagged for production, Then it appears as a booth card under the correct date.
- Given a booth's index within a day exceeds the configured booth capacity, When I view that card, Then it is marked "Over capacity".

**[IMG-OPS-002] Auto-allocate director/EVS/graphics staff**
Priority: High
**As a** Operations Coordinator
**I want** to auto-allocate staff for a single day, forward from a day, or everything at once
**So that** I don't have to hand-assign dozens of events one at a time

Acceptance Criteria (Given / When / Then)
- Given a day has multiple booth/studio/OB-unit events with empty roles, When I click "Auto allocate this day", Then every empty, unlocked role on that day is filled from the qualified staff pool.
- Given I click "Allocate forward" from a date, Then every day on or after that date is auto-allocated in the same run.

**[IMG-OPS-003] Never double-book a person on the same day**
Priority: High
**As a** Operations Coordinator
**I want** the auto-allocator to guarantee one job per person per day
**So that** I don't have to manually cross-check everyone's availability

Acceptance Criteria (Given / When / Then)
- Given a person is already assigned as Director on one event that day, When auto-allocate runs for other events that day, Then that person is not selected again for Director (or any other single-person role) that same day.

**[IMG-OPS-004] Fill in confirmed-first priority order**
Priority: Medium
**As a** Operations Coordinator
**I want** confirmed (Y) events to be staffed before possible (P) events, and possible before unscheduled
**So that** definite bookings always get first pick of staff over speculative ones

Acceptance Criteria (Given / When / Then)
- Given a limited staff pool is shared between a confirmed event and a possible event on the same day, When auto-allocate runs, Then the confirmed event is assigned first from that pool.

**[IMG-OPS-005] Fall back to "Freelance required" when staff run out**
Priority: Medium
**As a** Operations Coordinator
**I want** a clear "Freelance required" fallback when the qualified staff pool is exhausted
**So that** gaps are visible instead of silently left blank

Acceptance Criteria (Given / When / Then)
- Given every qualified, available person for a role has already been used that day, When auto-allocate reaches another event needing that role, Then it sets the role to "Freelance required" instead of leaving it blank.

**[IMG-OPS-006] Bulk-clear staff allocations**
Priority: Medium
**As a** Operations Coordinator
**I want** a one-click way to clear staff for a day, forward from a day, or everywhere
**So that** I can quickly re-run allocation after a schedule change without hand-removing every name

Acceptance Criteria (Given / When / Then)
- Given a day has staffed events, When I click "Clear this day" and confirm, Then Director/EVS/Graphics are removed from every unlocked event that day.
- Given I click "Clear all staff", When I confirm, Then all unlocked Director/EVS/Graphics assignments across every date are removed in one action.

**[IMG-OPS-007] Be warned about freelancers affected by a clear**
Priority: Medium
**As a** Operations Coordinator
**I want** to see how many accepted/offered freelancers were affected by a clear action
**So that** I don't inadvertently orphan a booking a freelancer already confirmed to

Acceptance Criteria (Given / When / Then)
- Given a cleared event had a freelancer marked Confirmed or Offered, When the clear completes, Then a notice reports the count of accepted and offered freelancers reset.

**[IMG-OPS-008] Lock an individual person's assignment**
Priority: High
**As a** Operations Coordinator
**I want** to lock one person's role assignment on an event
**So that** a later bulk clear or auto-allocate run can't overwrite a booking I've already finalised

Acceptance Criteria (Given / When / Then)
- Given a named Director on an event, When I click that role's Lock control, Then it shows as Locked and is skipped by Clear and Auto-allocate.
- Given a role is locked, When "Clear this day" is run, Then that role's name and booking status are left untouched while other roles on the same event may still be cleared.

**[IMG-OPS-009] Lock an entire event's staffing in one action**
Priority: Medium
**As a** Operations Coordinator
**I want** to lock all of an event's applicable roles at once from the card header
**So that** I don't have to lock Director, EVS, and Graphics separately when everything is confirmed

Acceptance Criteria (Given / When / Then)
- Given an event needs Director, EVS, and Graphics, When I click "Lock event", Then all three roles become locked together.
- Given all applicable roles are already locked, When I click the header control again, Then all of them unlock together.

**[IMG-OPS-010] Unlock a single role for a late change**
Priority: Medium
**As a** Operations Coordinator
**I want** to unlock one role on an already-locked event
**So that** I can make a late change for just that role without disturbing the rest of the booking

Acceptance Criteria (Given / When / Then)
- Given an event has Director and Graphics both locked, When I unlock only Graphics, Then Director remains locked and Graphics becomes editable/clearable again.

**[IMG-OPS-011] Auto-lock a booking when a freelancer confirms**
Priority: High
**As a** Operations Coordinator
**I want** a booking to lock itself the moment a freelancer's status is set to Confirmed
**So that** "pencil" and "confirmed" bookings are never visually indistinguishable by accident

Acceptance Criteria (Given / When / Then)
- Given a freelancer's status is Offered, When their status is changed to Confirmed (from any page), Then that person's role on that event is locked automatically without a separate action.

**[IMG-OPS-012] Hide the lock control on empty or unfulfilled roles**
Priority: Low
**As a** Operations Coordinator
**I want** the lock control hidden for roles showing TBA or "Freelance required"
**So that** I'm never offered a lock for a slot that has nothing in it to protect

Acceptance Criteria (Given / When / Then)
- Given a role shows "TBA", When I view that row, Then no Lock control is rendered next to it.
- Given a role shows "Freelance required", When I view that row, Then no Lock control is rendered next to it.
- Given a role becomes a real name after being filled, When the page re-renders, Then the Lock control appears for it.

---

## Workstream: Book Staff (BST)
### Epic: Freelancer Booking Lifecycle

**[IMG-BST-001] See every person's booking status in one table, by role**
Priority: High
**As a** Booking Coordinator
**I want** a single table of every person's booking status across all events, filterable by role
**So that** I can work through one department (e.g. all Directors) at a time

Acceptance Criteria (Given / When / Then)
- Given events have people assigned across multiple roles, When I select the "Director" role tab, Then only Director assignments are listed.

**[IMG-BST-002] Filter to only unconfirmed bookings**
Priority: High
**As a** Booking Coordinator
**I want** to filter the table to unconfirmed bookings only
**So that** I can focus my follow-up calls on freelancers still waiting to accept

Acceptance Criteria (Given / When / Then)
- Given a mix of confirmed and unconfirmed bookings for the selected role, When I click "Unconfirmed", Then only rows whose status is not Confirmed remain visible.

**[IMG-BST-003] Offer a job and record acceptance**
Priority: High
**As a** Booking Coordinator
**I want** to offer a job to a freelancer and then mark it accepted once they confirm
**So that** the booking's status reflects real-world confirmation, not just an assignment

Acceptance Criteria (Given / When / Then)
- Given a freelancer with no offer yet, When I click "Offer job", Then their status becomes Offered.
- Given a freelancer's status is Offered, When I click "Accepted", Then their status becomes Confirmed and the row auto-locks per IMG-OPS-011.

**[IMG-BST-004] Distinguish staff from freelance at a glance**
Priority: Medium
**As a** Booking Coordinator
**I want** a visible Staff/Freelance tag per booking row
**So that** I know who actually needs chasing versus who is automatically available

Acceptance Criteria (Given / When / Then)
- Given a person is tagged as staff in Admin → Staff, When their row appears here, Then it shows "Staff" and its status is always Confirmed.
- Given a person is tagged as freelance, When their row appears here, Then it shows "Freelance" with whatever status is actually stored.

**[IMG-BST-005] Lock or unlock a booking from this table**
Priority: Medium
**As a** Booking Coordinator
**I want** a Lock/Unlock action directly in this table
**So that** I can finalise or reopen a booking without navigating to Operations or the event panel

Acceptance Criteria (Given / When / Then)
- Given an unlocked row, When I click "Lock", Then the Locked column shows "Locked" and the Offer/Accept buttons disappear for that row.
- Given a locked row, When I click "Unlock", Then the Locked column reverts to "Pencil" and Offer/Accept controls reappear if applicable.

---

## Workstream: Resource Gaps (RSG)
### Epic: Crewing Risk Visibility

**[IMG-RSG-001] See a day-by-day list of understaffed events**
Priority: High
**As a** Resource Planner
**I want** a day-by-day list of events missing a Director, EVS Operator, or Graphics Operator
**So that** I can see exactly where the schedule is exposed without checking every event individually

Acceptance Criteria (Given / When / Then)
- Given an event has "Freelance required" recorded for any booth role, When I open Resource Gaps, Then that event is listed under its date with the missing role named.

**[IMG-RSG-002] Collapse fully-staffed days to an all-clear message**
Priority: Low
**As a** Resource Planner
**I want** days with no gaps to collapse to a simple "all clear" message
**So that** I don't have to scan a wall of green to find the actual problems

Acceptance Criteria (Given / When / Then)
- Given a date has zero gap events and zero incomplete bookings under the current filter, When I view that date group, Then it shows "All required resources are available" instead of a full event list.

**[IMG-RSG-003] See booking-confidence counts per event**
Priority: Medium
**As a** Resource Planner
**I want** confirmed/offered/not-offered counts shown per event
**So that** I understand not just whether someone is assigned but how solid that assignment is

Acceptance Criteria (Given / When / Then)
- Given an event has one confirmed staff member, one offered freelancer, and one not-yet-offered freelancer, When I view its row, Then it shows "Confirmed = 1", "Offered = 1", "Not offered yet = 1".

**[IMG-RSG-004] Filter between firefighting and full-audit views**
Priority: Medium
**As a** Resource Planner
**I want** to filter between "Unavailable only", "Incomplete", and "All" events
**So that** I can choose between firefighting mode and a full audit

Acceptance Criteria (Given / When / Then)
- Given the filter is "Unavailable only", When I view the page, Then only hard gaps (missing roles) are shown.
- Given I switch the filter to "All", Then fully-confirmed events also appear, clearly distinguished from gaps and incomplete bookings.

---

## Workstream: Asset Management (AST)
### Epic: Media Asset Logging & QC (TAMS)

**[IMG-AST-001] See a worklist of events needing media logging**
Priority: High
**As a** MAM/Media Logging Coordinator
**I want** a worklist of every event selected for a given platform (e.g. TAMS)
**So that** I know exactly which recordings need to be logged and checked

Acceptance Criteria (Given / When / Then)
- Given events have Y or P recorded against the TAMS platform in Planning, When I open Asset Management, Then those events are listed in date order.
- Given no platform is named "TAMS", When I open Asset Management, Then a message directs me to configure it in Admin → Platforms.

**[IMG-AST-002] Get auto-generated, consistent filenames**
Priority: Medium
**As a** MAM/Media Logging Coordinator
**I want** the recording and highlights filenames generated automatically from competition, teams, and season
**So that** naming stays consistent without manual typing or typos

Acceptance Criteria (Given / When / Then)
- Given an event has a home and away team and a recognised competition, When I view its row, Then a filename is generated following that competition's naming convention.
- Given home/away teams are missing, When I view the row, Then the filename shows "—" rather than a malformed name.

**[IMG-AST-003] Track QC checklist steps per event**
Priority: Medium
**As a** MAM/Media Logging Coordinator
**I want** to tick off natural-language check, log sheet, and log-on-Viz steps per event (and the highlights equivalents)
**So that** I have an auditable record of what's been processed

Acceptance Criteria (Given / When / Then)
- Given an event's checklist is untouched, When I tick "NL Check", Then that checkbox state is saved and persists on reload.

**[IMG-AST-004] Get an automatic record-port assignment with overflow warning**
Priority: Medium
**As a** MAM/Media Logging Coordinator
**I want** each event automatically assigned a record port number for its day, with a warning if capacity is exceeded
**So that** I can tell engineering exactly where a recording will land and flag over-capacity days early

Acceptance Criteria (Given / When / Then)
- Given three TAMS events on one day and four configured record ports, When I view that day, Then ports 1–3 are assigned in chronological order.
- Given a fourth event's port number would exceed configured capacity, When I view its row, Then it shows "Unavailable" instead of a port number.

**[IMG-AST-005] Capture free-text notes per event**
Priority: Low
**As a** MAM/Media Logging Coordinator
**I want** a free-text notes field per event
**So that** I can capture exceptions that don't fit the standard checklist

Acceptance Criteria (Given / When / Then)
- Given an event row, When I type into its Notes field, Then the text is saved and reappears after navigating away and back.

---

## Workstream: Bookable Assets (BKA)
### Epic: Equipment & Facility Booking

**[IMG-BKA-001] Book a specific unit of an asset**
Priority: High
**As a** Equipment Booking Coordinator
**I want** to book a named unit of an asset type (e.g. "Edit Suite 3") for a date, start time, and duration
**So that** physical resources are reserved the same way staff bookings are

Acceptance Criteria (Given / When / Then)
- Given at least one bookable asset type exists, When I complete the booking form and click Book, Then a new booking is created and visible in both List and Timeline views.
- Given no asset types exist yet, When I open the booking form, Then it directs me to Admin → Bookable Assets first.

**[IMG-BKA-002] Keep duration and end time in sync**
Priority: Medium
**As a** Equipment Booking Coordinator
**I want** editing duration to update the end time and vice versa, including across midnight
**So that** I never have to do the arithmetic myself

Acceptance Criteria (Given / When / Then)
- Given a start time of 09:00 and duration 8, When I view End time, Then it reads 17:00.
- Given I instead set End time to 03:00, When the form recalculates, Then Duration updates to 18 and a "+1 day" indicator appears.

**[IMG-BKA-003] Create a recurring booking**
Priority: High
**As a** Equipment Booking Coordinator
**I want** a booking to repeat daily, weekly, or on a custom interval, ending after N occasions or on a date
**So that** I don't have to create dozens of identical bookings by hand for a recurring production

Acceptance Criteria (Given / When / Then)
- Given I choose Weekly and "After 4 occasions", When I save, Then 4 bookings are created, one week apart, sharing a series identifier.
- Given I choose "Until" a specific date, When I save, Then bookings are created at the chosen interval up to and including that date.

**[IMG-BKA-004] Record the business context of a booking**
Priority: Medium
**As a** Equipment Booking Coordinator
**I want** to record who booked an asset, plus production, contract number, and programme
**So that** a booking's business context is visible without leaving this page

Acceptance Criteria (Given / When / Then)
- Given I fill in Production, Contract number, and Programme on the booking form, When I save, Then all three values are shown on the booking's row in List view and in the Timeline chip's tooltip.

**[IMG-BKA-005] Block double-booking with a clear warning**
Priority: High
**As a** Equipment Booking Coordinator
**I want** to be warned before saving a booking that overlaps an existing one on the same unit, naming who it clashes with and the overlapping hours
**So that** I can't accidentally double-book a physical resource

Acceptance Criteria (Given / When / Then)
- Given "Edit Suite 4" is already booked 07:20–15:20, When I try to book the same unit 09:00–17:00, Then a warning names the existing booking and shows "Clashing hours: 09:00–15:20", and the Book button is disabled.
- Given I change the unit or time so it no longer overlaps, When the form re-validates, Then the warning clears and the Book button re-enables.

**[IMG-BKA-006] Edit an existing booking**
Priority: High
**As a** Equipment Booking Coordinator
**I want** to edit a booking's asset, unit, date, time, and duration after the fact
**So that** I can correct mistakes or accommodate schedule changes without deleting and recreating it

Acceptance Criteria (Given / When / Then)
- Given an existing booking, When I click it and change its time, Then the saved booking reflects the new time without creating a duplicate.
- Given my edit would newly clash with another booking, When I try to save, Then the same conflict warning as IMG-BKA-005 blocks the save.

**[IMG-BKA-007] Apply an edit to a whole recurring series**
Priority: Medium
**As a** Equipment Booking Coordinator
**I want** to apply an edit to every occurrence in a series at once, while each occurrence keeps its own date
**So that** changing who's booking it or what time doesn't require editing every date individually

Acceptance Criteria (Given / When / Then)
- Given a 4-occurrence weekly series, When I edit one occurrence, tick "Apply to series", and change the Booked-by name, Then all 4 occurrences show the new name and none of their dates change.

**[IMG-BKA-008] Delete a single booking or a whole series**
Priority: Medium
**As a** Equipment Booking Coordinator
**I want** to delete just one occurrence or an entire recurring series
**So that** I have the right amount of precision when plans fall through

Acceptance Criteria (Given / When / Then)
- Given a recurring booking, When I click "Delete booking" on one occurrence, Then only that occurrence is removed and the rest of the series remains.
- Given the same booking, When I click "Delete series" and confirm, Then every occurrence sharing that series is removed.

### Epic: Booking Visibility & Utilisation

**[IMG-BKA-009] Browse all bookings as a chronological list**
Priority: Medium
**As a** Equipment Booking Coordinator
**I want** a simple chronological list of all bookings
**So that** I can quickly scan what's booked, by whom, and when

Acceptance Criteria (Given / When / Then)
- Given several bookings exist across different assets and dates, When I open List view, Then they are shown sorted by date and time, each with asset, unit, time range, and any recorded details.

**[IMG-BKA-010] See utilisation as a unit-by-day timeline grid**
Priority: High
**As a** Equipment Booking Coordinator
**I want** a grid with each unit as a row and each day as a column
**So that** I can see utilisation across all units and days at once

Acceptance Criteria (Given / When / Then)
- Given multiple asset types with multiple units, When I open Timeline view, Then every unit has its own row and each visible day has its own column, with bookings shown as chips in the correct cell.
- Given today falls within the visible window, When I view the grid, Then today's column is visually highlighted.

**[IMG-BKA-011] Start a booking directly from the timeline grid**
Priority: Medium
**As a** Equipment Booking Coordinator
**I want** to click an empty cell or a unit's row label to start a new booking pre-filled with that unit/date
**So that** I don't have to re-select options I've already clicked through to get to

Acceptance Criteria (Given / When / Then)
- Given I click an empty cell for "Cameras 2" on 26 Aug, When the booking form opens, Then Asset, Unit, and Date are pre-filled with those values.
- Given I click a unit's row label instead, When the form opens, Then Asset and Unit are pre-filled but Date is left for me to choose.

**[IMG-BKA-012] Drill into a single day across all assets**
Priority: Medium
**As a** Equipment Booking Coordinator
**I want** to click a day's header to see every booking across all assets for that day
**So that** I can do a daily "what's on" check without scanning the whole grid

Acceptance Criteria (Given / When / Then)
- Given several assets have bookings on 26 Aug, When I click that day's column header, Then a day-detail page lists every one of those bookings with full detail.
- Given I am on the day-detail page, When I click "Back", Then I return to exactly the Timeline view and date window I left.

**[IMG-BKA-013] Default to the highest-value overview**
Priority: Low
**As a** Equipment Booking Coordinator
**I want** Bookable Assets to open on Timeline rather than List
**So that** I get the highest-value overview first, without an extra click every visit

Acceptance Criteria (Given / When / Then)
- Given I navigate to Bookable Assets from the top nav for the first time in a session, When the page loads, Then Timeline is the active view.

---

## Workstream: Import Events (IMP)
### Epic: Ad-Hoc Fixture & Bulk Fixture Ingestion

**[IMG-IMP-001] Add a one-off event outside the bundled fixture data**
Priority: High
**As a** Editorial Coordinator
**I want** to add a one-off event (teams, date/time, venue) that isn't in the bundled fixture data
**So that** ad-hoc or late-breaking fixtures can still be scheduled and covered like any other event

Acceptance Criteria (Given / When / Then)
- Given I fill in the required fields and click Save, When the form submits, Then the new event appears on the Calendar under its competition's colour immediately.

**[IMG-IMP-002] Create a new sport or competition on the fly**
Priority: Medium
**As a** Editorial Coordinator
**I want** to create a brand-new sport or competition while importing a fixture
**So that** I'm not blocked waiting for someone to configure it in Admin first

Acceptance Criteria (Given / When / Then)
- Given no existing competition fits, When I choose "add new competition" and supply a name/colour/governing body, Then the new competition is available immediately, including in the competition toggles.

**[IMG-IMP-003] Fully specify a manually-added fixture**
Priority: Medium
**As a** Editorial Coordinator
**I want** to set production type, staff, and technical requirements at the point of import
**So that** a manually-added fixture is immediately as fully specified as a seeded one

Acceptance Criteria (Given / When / Then)
- Given I select a production pattern while importing, When I save, Then the imported event's technical fields pre-fill from that pattern exactly as they would for a seeded fixture.

**[IMG-IMP-004] Bulk-import a spreadsheet of fixtures**
Priority: High
**As a** Editorial Coordinator
**I want** to bulk-import a spreadsheet of same-sport/competition fixtures via a preview-then-accept step
**So that** adding a whole new competition's schedule doesn't mean typing in every match by hand

Acceptance Criteria (Given / When / Then)
- Given a spreadsheet with the expected Sport/Competition header rows and a Date/Time/Duration/Venue/Home/Away table, When I upload it, Then a preview of all parsed fixtures is shown before anything is saved.
- Given I accept the preview, When the import completes, Then every previewed fixture is added, and any sports/competitions not already configured are created automatically.

---

## Workstream: Admin (ADM)
### Epic: Production Template Configuration

**[IMG-ADM-001] Define reusable production patterns**
Priority: High
**As a** System Administrator
**I want** to define reusable production patterns (camera count, EVS/audio crew, line counts, booth/studio/OB flags)
**So that** assigning a production type to an event auto-fills all of its technical and staffing needs

Acceptance Criteria (Given / When / Then)
- Given I fill in a new pattern's fields and click Save, When I select that pattern on an event, Then the event's technical fields match the pattern's values exactly.

**[IMG-ADM-002] Copy an existing pattern**
Priority: Low
**As a** System Administrator
**I want** to copy an existing pattern as a starting point for a new one
**So that** I don't have to re-enter near-identical templates from scratch

Acceptance Criteria (Given / When / Then)
- Given a saved pattern, When I click Copy, Then a new unsaved draft opens pre-filled as "Copy of [name]" with all the same values, ready to edit and save separately.

**[IMG-ADM-003] Be warned about unsaved pattern changes**
Priority: Low
**As a** System Administrator
**I want** to be warned before navigating away from a pattern with unsaved changes
**So that** I don't lose work by clicking away accidentally

Acceptance Criteria (Given / When / Then)
- Given I have unsaved edits open, When I click another pattern in the list, Then a dialog offers to Save, Discard, or Cancel before navigating.

### Epic: Staff & Freelancer Roster Management

**[IMG-ADM-004] Maintain a roster of people per role**
Priority: High
**As a** System Administrator
**I want** to maintain a roster of people per role (director, producer, EVS operator, etc.)
**So that** every dropdown across the app draws from one accurate source of truth

Acceptance Criteria (Given / When / Then)
- Given I add a new name under the Director role, When I open any Director dropdown elsewhere in the app, Then the new name is available to select.

**[IMG-ADM-005] Mark a person as staff or freelance**
Priority: High
**As a** System Administrator
**I want** to mark each person as staff or freelance
**So that** the rest of the app knows whose bookings need an offer/confirm cycle and whose don't

Acceptance Criteria (Given / When / Then)
- Given a person is marked Staff, When they are assigned to an event, Then their booking status always shows Confirmed with no offer step required.
- Given a person is marked Freelance, When assigned, Then their booking status starts unbooked and must go through Offer → Confirm.

**[IMG-ADM-006] Record capability tags per person**
Priority: Medium
**As a** System Administrator
**I want** to record each person's capability tags (e.g. 8-cam feature match, tennis, rugby)
**So that** auto-allocation and manual assignment only ever suggest qualified people

Acceptance Criteria (Given / When / Then)
- Given a director is not tagged for an 8-cam feature match, When a pattern requiring that capability is assigned, Then that director is excluded from the eligible list for that event.

**[IMG-ADM-007] Set default and per-person day rates**
Priority: Medium
**As a** System Administrator
**I want** to set a seniority level and default day rate per role, with an override per individual
**So that** cost reporting is accurate without pricing every person from scratch

Acceptance Criteria (Given / When / Then)
- Given a role has a default rate and one person has an override, When that person's cost is calculated on the Event Panel, Then the override value is used instead of the default.

**[IMG-ADM-008] See a person's full upcoming schedule**
Priority: Medium
**As a** System Administrator
**I want** to click into a person and see their full upcoming schedule
**So that** I can answer "what is this person doing" without searching the whole calendar

Acceptance Criteria (Given / When / Then)
- Given a person is assigned to three future events across two roles, When I select them in the Staff role detail view, Then all three events and roles are listed with dates.

### Epic: Broadcast Platform Configuration

**[IMG-ADM-009] Define each broadcast platform**
Priority: High
**As a** System Administrator
**I want** to define each broadcast platform (name, default line IDs, four-wire count, MCR/editorial contacts)
**So that** editorial decisions, technical resourcing, and rights all reference the same consistent platform list

Acceptance Criteria (Given / When / Then)
- Given I create a new platform, When I open Planning, Then that platform appears as a new decision column immediately.

**[IMG-ADM-010] Set per-platform line capacity**
Priority: Medium
**As a** System Administrator
**I want** to set each platform's line capacity (video/audio/talkback in/out, 2110)
**So that** capacity reporting can be based on what a platform can actually carry, not just what's requested

Acceptance Criteria (Given / When / Then)
- Given a platform's video-incoming capacity is set, When I view Tech Stack → Lines by Platform, Then that same value is shown and editable there.

### Epic: Technical Inventory & Capacity Configuration

**[IMG-ADM-011] Record fixed equipment inventory and cost**
Priority: Medium
**As a** System Administrator
**I want** to record the site's fixed equipment inventory (encoders, decoders, booths, studios, OB units, record ports) with a cost per unit
**So that** capacity and cost reporting reflect what's physically available, not just what's requested

Acceptance Criteria (Given / When / Then)
- Given I set Production Booths to 8, When Operations computes over-capacity flags, Then any 9th concurrent booth on a day is marked Over capacity.

### Epic: Rights Matrix Management

**[IMG-ADM-012] Track granted/not-granted/unknown rights per competition per platform**
Priority: High
**As a** Rights Manager
**I want** a matrix of competition × platform showing granted, not granted, or unknown, cycled with one click
**So that** everyone can see broadcast rights status without digging through contracts

Acceptance Criteria (Given / When / Then)
- Given a cell shows blank (Unknown), When I click it, Then it becomes "Y" (granted); When clicked again, Then it becomes "N" (not granted); When clicked a third time, Then it returns to Unknown.

**[IMG-ADM-013] Set a default production pattern per competition**
Priority: Medium
**As a** Rights Manager
**I want** to set a default production pattern per competition
**So that** new events in that competition are pre-configured correctly without per-event setup

Acceptance Criteria (Given / When / Then)
- Given a competition has a default pattern set, When a new event in that competition is flagged for production with no pattern chosen explicitly, Then it inherits the competition's default pattern.

### Epic: Bookable Asset Catalogue Management

**[IMG-ADM-014] Define a bookable asset type and quantity**
Priority: High
**As a** System Administrator
**I want** to define a type of bookable asset with a name and quantity (e.g. "Edit Suites × 5")
**So that** operators booking equipment choose from real, finite inventory rather than free text

Acceptance Criteria (Given / When / Then)
- Given I create "Edit Suites" with quantity 5, When I open the booking form's "Which one" dropdown for that asset, Then exactly 5 numbered units are offered.

**[IMG-ADM-015] Set cost and default duration per asset type**
Priority: Medium
**As a** System Administrator
**I want** to set a cost and a default booking duration per asset type
**So that** new bookings default sensibly and cost reporting has a basis to work from

Acceptance Criteria (Given / When / Then)
- Given an asset type has duration set to 4 hours, When I start a new booking for it, Then the Duration field defaults to 4.

**[IMG-ADM-016] Retro-fit cost/duration onto pre-existing asset types**
Priority: Low
**As a** System Administrator
**I want** to edit an asset type's cost or duration at any time, including ones created before these fields existed
**So that** the catalogue can be corrected without deleting and recreating assets (and losing their bookings)

Acceptance Criteria (Given / When / Then)
- Given an asset type created before cost/duration existed, When I open it, Then it shows sensible defaults (£0 / 8 hours) that I can edit and save in place.

**[IMG-ADM-017] Remove an asset type no longer in use**
Priority: Low
**As a** System Administrator
**I want** to delete an asset type I no longer need
**So that** the booking catalogue stays relevant to what's actually available

Acceptance Criteria (Given / When / Then)
- Given an asset type with no future bookings, When I delete it, Then it no longer appears in the booking form or Timeline rows.

### Epic: Platform Data Operations & Seeding

**[IMG-ADM-018] Reach bulk/seed tools only via a hidden control**
Priority: Low
**As a** System Administrator
**I want** dangerous bulk/seed operations hidden behind a modifier-click, not visible during normal use
**So that** they aren't reachable or distracting during day-to-day admin work

Acceptance Criteria (Given / When / Then)
- Given the Admin tab is visible, When I Ctrl+click it, Then a row of "unsafe" bulk-operation buttons becomes visible in the Admin bottom bar; When I Ctrl+click again, Then they hide again.

**[IMG-ADM-019] Snapshot roster and rights data into seed files**
Priority: Low
**As a** System Administrator
**I want** to snapshot the current staff roster and rights matrix into downloadable seed files
**So that** a fresh deployment starts pre-populated with real, current data instead of empty defaults

Acceptance Criteria (Given / When / Then)
- Given I click "Snapshot", When the download completes, Then the file contains every current role's staff list and profiles in the same format the app seeds from on first load.

**[IMG-ADM-020] Bulk set/clear platform decisions for cleanup**
Priority: Low
**As a** System Administrator
**I want** bulk "set for all/selected" and "clear all/selected" tools for a named platform
**So that** I can quickly correct or re-baseline editorial decisions across many events during data cleanup

Acceptance Criteria (Given / When / Then)
- Given a platform named "TAMS" exists, When I click "TAMS All", Then every event gets that platform set to Y; When I click "Clear TAMS", Then it is cleared back to blank for every event.

---

## Workstream: Event Panel (EVP)
### Epic: Unified Event Command Centre

**[IMG-EVP-001] See one panel with full event detail and resources**
Priority: High
**As a** Editorial/Production/Technical user
**I want** one panel showing an event's full details, resource assignments, and cost breakdown
**So that** I don't have to jump between five different pages to understand a single fixture

Acceptance Criteria (Given / When / Then)
- Given I click any event anywhere in the app, When the panel opens, Then it shows date/venue/teams, a Resources tab, and a Costs tab, all for that one event.

**[IMG-EVP-002] Assign or change any staff role from the panel**
Priority: High
**As a** Production Manager
**I want** to assign or change any staff role directly from the event panel
**So that** I can fix a booking the moment I notice a problem, wherever I spotted it

Acceptance Criteria (Given / When / Then)
- Given the panel is open on an event, When I change the EVS dropdown, Then the change is saved immediately and reflected on Operations/Book Staff without a page reload.

**[IMG-EVP-003] Offer and confirm any of the eight roles from the panel**
Priority: Medium
**As a** Production Manager
**I want** to offer a job and mark it confirmed for any role (not just Director/EVS/Graphics)
**So that** Producer, Commentator, Cameraman, and Audio bookings get the same booking-status rigor

Acceptance Criteria (Given / When / Then)
- Given a freelance Commentator is assigned, When I click "Offer job" then "Confirm" on that row, Then its status becomes Confirmed exactly as it would for a Director.

**[IMG-EVP-004] Lock/unlock any role from the panel**
Priority: Medium
**As a** Production Manager
**I want** to lock or unlock any individual role's booking from this panel
**So that** finalising or reopening a booking doesn't require switching to the Operations board

Acceptance Criteria (Given / When / Then)
- Given a role is assigned, When I click its Lock button, Then the dropdown disables and the state is reflected on the Operations board for the same event.

**[IMG-EVP-005] See a full cost breakdown for the event**
Priority: Medium
**As a** Finance/Production Manager
**I want** a cost view showing named-staff pay, technical equipment cost, and platform line costs
**So that** I can see the full expected spend for a single fixture before it airs

Acceptance Criteria (Given / When / Then)
- Given staff, equipment, and platform lines are all assigned to an event, When I switch to the Costs tab, Then each cost line is itemised and a total is shown.

**[IMG-EVP-006] Override pattern-derived technical fields per event**
Priority: Medium
**As a** Production Manager
**I want** technical fields that inherit from the assigned pattern but can be overridden per event
**So that** exceptions (an unusually large shoot, an extra camera) don't require creating a whole new pattern for one event

Acceptance Criteria (Given / When / Then)
- Given an event's pattern specifies 4 cameramen, When I manually change that event's camera count to 6, Then 6 is saved and visibly flagged as an override from the pattern default.

---

*82 stories across 11 workstreams and 18 epics. Reflects functionality actually
implemented in the app as of v3.00 — no aspirational or planned features. Every
story above satisfies INVEST (Independent, Negotiable, Valuable, Estimable,
Small, Testable) and carries Given/When/Then acceptance criteria per the
methodology document.*
