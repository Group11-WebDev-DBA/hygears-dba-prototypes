# Hygears HQ System (DBA side): prototype brief

The Database Administration project: the **internal** system used inside the Hygears headquarters (HQ room) and by officers. It replaces the paper logbooks for entry/exit and attendance, and tracks inventory and borrowing, for transparency and to prevent theft. This is NOT the public website (that's the WebDev project); no public pages, no membership applications, no merch.

Each direction lives in its own folder here and covers the same screens with the same sample data, so the choice is between looks. Static HTML + CSS + a little vanilla JS for states, opens by double-click. The group will rebuild the chosen one in PHP + MySQL on top of `hygears.sql`.

## The database (source of truth: `hygears.sql` in this folder, by Rico)
Every screen maps to these tables/views. Use their real column names in labels and sample data so the PHP rebuild is direct.
- `person` (student_id nullable for outside visitors, first_name, last_name, contact_number, affiliation)
- `member` (person, role, email, is_active, joined_on) and `role` (Member, Officer, President, Adviser; `can_approve`)
- `attendance` (person, purpose, time_in, time_out, notes) and `purpose` (Meeting, Project work, Workshop, Tool use, Study, Visit)
- `item` (category, name, item_type tool/consumable, quantity_total, reorder_level, is_active) and `category` (Hand tools, Power tools, Electronics, Measuring instruments, Cutting consumables, Soldering consumables)
- `restock` (item, quantity, restocked_on, notes)
- `item_request` (requested_by member, decided_by approver, requested_at, decided_at, status pending/approved/rejected/completed, remarks) and `request_line` (item, quantity, due_date tools only, returned_at)
- Views: `v_item_stock` (quantity_available), `v_low_stock`, `v_open_loans` (who has what, is_overdue)
- Rules enforced by the DB: members need a student ID; time_out after time_in; consumables have no due date; only active members whose role can_approve may decide; nobody approves their own request. Known gap: approving more than the available stock isn't blocked, so the UI must check quantity_available before approving.

## Screens
| Screen | What it does |
|---|---|
| `index.html` HQ door / attendance kiosk | Runs on a phone or tablet at the HQ door. Sign in: enter student number (or pick "Visitor" and type name, contact, affiliation), choose purpose. Sign out: find yourself in "In the HQ now" and tap Sign out. Big, fast, one-thumb. Shows who's inside right now. |
| `dashboard.html` | Officer overview: people in HQ now, pending requests, overdue tools, low-stock consumables, today's attendance count. |
| `attendance.html` | Attendance log with filters (date, purpose, members vs visitors), time in/out, still-inside rows; export button (stub). |
| `people.html` | People and members: list, search, add person, mark as member with role, active/inactive. |
| `items.html` | Inventory: items with category, type, total, available, reorder level, active; add/edit item; Restock form; low-stock flags. |
| `requests.html` | Borrowing requests: new request (member, items + quantities, due date for tools), pending list with Approve/Reject (blocked if not enough stock, with a clear message), approved loans with Mark returned, overdue highlighted. |
| `reports.html` | Ready-made queries for the paper: open loans, overdue, low stock, attendance per day/purpose, most borrowed items. Show the SQL beside each one (the DBA prof grades the database). |
| `settings.html` | Lookups: roles (with can_approve), purposes, categories. |

Sample data: about 8 people (2 visitors), 6 members with roles, 12 items mixed tools/consumables, a few requests in each status, today's attendance. All clearly sample. Real people's names are not known, so use obviously sample names.

## Look
- **No cream, no orange.** White `#FFFFFF`, cool light gray `#F4F5F7`, near-black `#14161A` text, secondary `#5B6270`, Hygears red `#D7261E` only for primary actions and alerts that need action, optional charcoal `#1B1D22` sidebar/header with the white HG mark. Status needs text + icon, never colour alone.
- Logo: `../assets/hygears-logo.png`. Tagline if needed: "Engineering Innovation • Research • Technology • Leadership".
- It's an internal tool: calm, dense where useful (tables), very clear. Not a marketing page.
- **Mobile matters**: the kiosk is used on a phone/tablet at the door, and officers check requests on phones. Tables reflow into rows/cards under 640px. Tap targets ≥ 44px. No horizontal scroll at 360px.

## Rules (professor + class level)
- Same rules as the WebDev lecture (`../../../Web-Development/ui-requirements-nov21.md`): limited palette, accent only for actions, 4.5:1 contrast, two fonts max, 16px body, CSS variables, ONE shared style.css, same header/sidebar on every page with current page highlighted, labels/hints/errors on forms, alt text, focus states.
- **Copyable by students**: plain semantic HTML, one style.css with hex CSS variables, Flexbox and simple Grid, media queries, plain vanilla JS functions with comments. No oklch/color-mix/:has()/container queries/modules/frameworks/build step.

## Output per direction
- The 8 screens, one `style.css`, optional `app.js`, `NOTES.md` (name, palette, fonts, memorable idea, what's needed for the PHP rebuild), `QA.md` (from the QA step).
