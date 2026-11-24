# Direction: "Time Card" (superdesign skill, written guidance only)

**Idea:** the HQ runs on cards and stamps. The door kiosk works like a Bundy clock: you punch a time card IN, it hangs in the "In the HQ now" rack with the clock-stamped time on its punch strip, and you punch it OUT on the way home. Borrowing works like request slips: an officer stamps each slip `APPROVED`, `REJECTED` or `COMPLETED`, and a returned tool gets a `RETURNED` stamp, each with who stamped it and when. The header carries a black time-clock display with the date and time. Everything else is a calm internal tool: charcoal sidebar, white panels, plain tables.

How the skill shaped it: superdesign's no-CLI path is "write a design system first as a hard constraint (product context, jobs, styling, motion, requirements), build the shared layout components first, then author pages directly". That design system is below; the sidebar/header shell was built once and reused on all 8 pages. Its CLI, canvas and image generation were not used.

## Design system
**Jobs to be done:** a member punches in or out in seconds at the door; a visitor signs in without a student number; an officer approves only what's on the shelf and chases overdue tools; the inventory officer restocks and spots low stock; the professor sees the tables, views and rules behind every screen.

**Palette (CSS variables in `style.css`)**
| Var | Hex | Use |
|---|---|---|
| `--white` | #FFFFFF | panels, cards, inputs |
| `--gray` / `--gray-2` | #F4F5F7 / #E8EAEE | page ground / table heads and card punch strips |
| `--ink` | #14161A | text, stamps, selected tiles, focus ring, clock display |
| `--muted` | #5B6270 | secondary text (6.1:1 on white) |
| `--red` / `--red-dark` | #D7261E / #B01E17 | primary buttons / alert text and stamps |
| `--red-tint` | #FCEDEC | overdue and low-stock rows |
| `--charcoal` / `--charcoal-2` | #1B1D22 / #2A2D34 | sidebar / current page and hover |
| `--on-dark` | #C9CDD4 | sidebar text |
| `--line` / `--field` | #D5D9E0 / #868D99 | dividers / input and card borders (3.3:1) |

Red appears only on primary buttons and on things an officer must act on (overdue, low stock, can't-approve). Every status has an icon and a word.

**Fonts:** IBM Plex Sans (body, labels) and IBM Plex Mono (time stamps, the clock, rubber stamps, student numbers, SQL). One family in two cuts, so it reads as one system. Loaded from Google Fonts; offline it falls back to Segoe UI / Consolas, so double-click still works.

**Components:** time card (`.card`: punch strip + who + action), rubber stamp (`.stamp`, boxed mono caps, tilted 3°; `.alert` = red; `.flat` = untilted inside tables), request slip (`.slip` with dashed line items), panel, notice (icon + text), buttons (red primary, outlined secondary, `armed` = black while waiting for the second tap), reflowing table.

**Motion:** one only. A new stamp "presses" in (0.18 s scale + settle). Turned off under `prefers-reduced-motion`.

**Mobile:** sidebar folds into a sticky top bar with Menu at 900 px; tables become rows under 640 px with the name first; kiosk has a "Signing out? Find your card" jump at the top; tap targets ≥ 44 px (pad keys 60 px). Checked at 360 and 768 px: no sideways scroll.

## Files
`index.html` (door kiosk), `dashboard.html`, `attendance.html`, `people.html`, `items.html`, `requests.html`, `reports.html`, `settings.html`, `style.css`, `app.js`, `QA.md`. Logo from `../assets/hygears-logo.png`. All data is sample (`@example.com`, `0917 555 01xx`), same people and items as the other directions. The page clock starts at Tue 24 Nov 2026, 11:05 AM (`SAMPLE_NOW` in app.js) and runs from there.

## Screen → tables
| Screen | Reads | Writes |
|---|---|---|
| Kiosk | `person` (by student_id), `purpose`, `attendance WHERE time_out IS NULL` | `person` (visitor / first-timer), `attendance` insert, `time_out` update |
| Dashboard | counts from `attendance`, `item_request`, `v_open_loans`, `v_low_stock` | none |
| Attendance | `attendance` ⋈ `person` ⋈ `purpose` ⟕ `member` | none (CSV export stub) |
| People | `person` ⟕ `member` ⋈ `role` | `person`, `member` (role_id, email, joined_on, is_active) |
| Items | `item` ⋈ `category`, `v_item_stock`, `v_low_stock`, `restock` | `item`, `restock` |
| Requests | `item_request`, `request_line`, `v_item_stock`, `v_open_loans` | `item_request` (status, decided_by, decided_at, remarks), `request_line` (returned_at) |
| Reports | the views + GROUP BY queries shown beside each result | none |
| Settings | `role`, `purpose`, `category` | same (add; `can_approve` toggle) |

## For the PHP rebuild
- **sidebar.php + header.php:** the `<aside class="sidebar">` and `<header class="topbar">` blocks (plus the icon sprite above them). Set `aria-current="page"` on the current link; fill the name and role from the session. The officer pages need a login; the door device should only reach the kiosk.
- **Form names are column names.** POST them into prepared statements. Selects already carry ids (`category_id`, `role_id`, `purpose_id`, `requested_by` = person_id).
- **Request lines:** `item_id[]`, `quantity[]`, `due_date[]` arrive as parallel arrays. Loop by index; turn an empty `due_date` into NULL. The consumable due date is `readonly`, not `disabled`, on purpose: disabled fields aren't posted and the arrays would stop lining up.
- **Approve guard:** before `UPDATE item_request SET status='approved'`, re-check each line against `v_item_stock.quantity_available` inside a transaction. The database doesn't block over-stock approval, so the screen check alone isn't enough. Consumables-only requests go straight to `completed`.
- **Approve / Reject / Mark returned** are JS buttons here. In PHP make each a small POST form (`request_id` or `line_id` + action; Reject also posts `remarks`). Keep the second-tap behaviour in app.js (`secondTap()`) on top of the form.
- **Kiosk lookup:** the box posts `student_id` as typed (`2023-00118`); match with `WHERE student_id LIKE '2023-00118%'`. If nothing matches, the same form carries `first_name`, `last_name`, `contact_number`, `affiliation` for a new `person` row. Block a second open row with `WHERE person_id = ? AND time_out IS NULL`.
- **Replace the sample arrays:** `PEOPLE` (kiosk) and `STOCK` (requests) become queries; the HTML rows are already written the way a PHP loop would print them.
- **Clock:** delete `SAMPLE_NOW` and use `new Date()`; print `data-since="{time_in}"` on the rack cards.
- **Known schema point:** members need a student ID, so the Adviser does too. Raise it with Rico if the adviser is faculty.
