# Direction: "Pit Wall" (impeccable skill, Operate mode)

**Idea:** the HQ's job is transparency: who is in the room, and what is out of it. So anything that is IN (a person) or OUT (a borrowed tool) gets a **running clock**, set in condensed timing figures like a race team's pit wall. That fits Hygears, a Shell Eco-marathon team. People inside show `2h 25m`; loans show `due today`, `4d left` or `3d overdue`. The signature move is the **timing tower**: a dark list of who's inside, longest stay first, with a big ticking clock per person. It sits on the kiosk (with one-tap Sign out) and the dashboard. Everything else is a calm, standard internal tool: a top bar, panels, tables, and an action queue instead of metric tiles.

The skill's Operate rules shaped it. The theme only lends type, palette, density and the one signature move. Navigation and controls stay standard. There are no stat-tile cards and no eyebrow labels, and every state is shown with an icon plus text. Destructive actions get an inline confirm or an Undo rather than modals.

## Palette (CSS variables in `style.css`)
| Var | Hex | Use |
|---|---|---|
| `--white` | #FFFFFF | panels, inputs |
| `--gray` | #F4F5F7 | page ground, table heads |
| `--ink` | #14161A | text, selected tiles, focus ring |
| `--muted` | #5B6270 | secondary text |
| `--red` / `--red-dark` | #D7261E / #B01E17 | primary actions, alerts that need action |
| `--red-tint` | #FCEDEC | overdue / low-stock rows and notices |
| `--charcoal` | #1B1D22 | top bar, timing tower, SQL blocks |
| `--on-dark` | #C9CDD4 | secondary text on charcoal |
| `--ok` / `--warn` | #1D6B3B / #7A4F00 | "Active / In stock" and "due today", always with an icon |
| `--line` / `--field` | #DDE0E5 / #868D99 | dividers / input borders (3:1) |

## Fonts
**Barlow** for text and **Barlow Condensed** for headings and the clocks. They're one family, motorsport/signage in feel, and loaded from Google Fonts. If offline, they fall back to Segoe UI / Arial Narrow, so double-click still works. Consolas is used only inside the SQL blocks on Reports.

## Files
`index.html` (door kiosk), `dashboard.html`, `attendance.html`, `people.html`, `items.html`, `requests.html`, `reports.html`, `settings.html`, `style.css`, `app.js`. Logo from `../assets/hygears-logo.png`. All data is sample (`@example.com`, `0917 555 01xx`). The page clock is fixed at Tue 24 Nov 2026, 11:05 AM (`SAMPLE_NOW` in app.js) and ticks from there.

The kiosk carries the same top bar as every page (the brief asks for one header). On the door device it collapses behind "Menu". In PHP, the officer pages must sit behind a login so the door phone can't open them.

## Screen → tables
| Screen | Reads | Writes |
|---|---|---|
| Kiosk | `person`, `purpose`, `attendance WHERE time_out IS NULL` | `person` (visitor / first-timer), `attendance` insert, `time_out` update |
| Dashboard | counts from `attendance`, `item_request`, `v_open_loans`, `v_low_stock` | none |
| Attendance | `attendance` ⋈ `person` ⋈ `purpose` (+ `member`/`role` for the type column) | none (export CSV) |
| People | `person` ⟕ `member` ⋈ `role` | `person`, `member` (role, email, joined_on, is_active) |
| Items | `item` ⋈ `category`, `v_item_stock`, `v_low_stock`, `restock` | `item`, `restock` |
| Requests | `item_request`, `request_line`, `v_item_stock`, `v_open_loans` | `item_request` (status, decided_by, decided_at, remarks), `request_line` (returned_at) |
| Reports | the views + GROUP BY queries shown beside each result | none |
| Settings | `role`, `purpose`, `category` | same (add; `can_approve` toggle) |

## For the PHP rebuild
- **header.php** is the `<header class="topbar">` block plus the icon sprite above it. Set `aria-current="page"` on the current link, and fill the signed-in name and role from the session.
- **Form names are the column names.** POST them straight into prepared statements. Change the category `<select>` and the "Requested by" `<select>` to use `category_id` / `person_id` values (the prototype uses names).
- **Replace the JS arrays with queries:** `KIOSK_PEOPLE` (`person` with a `student_id`), `ITEMS` (`item` + `v_item_stock`). The Items table is drawn by `renderItems()`; in PHP, print the `<tr>`s in a loop instead, using the same markup.
- **Approve guard:** before `UPDATE item_request SET status='approved'`, re-check each line against `v_item_stock.quantity_available` inside a transaction. The database doesn't block over-stock approval (see the brief), so the UI check alone isn't enough.
- **Student number:** the kiosk matches on digits only (`2023-00118` = `2023-00118-MN-0`), so do the same in SQL, e.g. compare `REPLACE(student_id,'-','')` with a `LIKE 'digits%'`.
- **Clocks:** output `data-since="{time_in}"` and `data-due="{due_date}"`. `tickClocks()` does the rest. Delete `SAMPLE_NOW` and use `new Date()`.
- **Request status:** consumables-only approved requests become `completed`; requests with tools stay `approved` until every tool line has a `returned_at`.
