# Hallmark direction: "Whiteprint"

**Idea:** every screen is a drawing sheet. Square corners, near-black keylines instead of shadows or cards, and a **title block** at the top of each page (like the corner block on an engineering drawing). It holds the page name, the tables and views the screen uses, one rule it enforces, and the sheet number (01 / 08). It reads as an engineering org's tool, and it shows the professor how each screen maps to hygears.sql.

The door kiosk has big radio tiles and a charcoal "In the HQ now" count block. On phones and tablets a two-button switch (Sign in / Sign out (4 inside)) jumps between the two halves.

Made with the Hallmark skill (app-screen and fast-mode branches, Blueprint theme dealt and recoloured to the brief's whiteprint palette). As the brief requires, there is no stamp, no tokens.css and no base.css.

## Palette (hex variables in style.css)
| Variable | Hex | Use |
|---|---|---|
| --white | #FFFFFF | sheets, inputs |
| --gray | #F4F5F7 | page ground, filter strips, SQL blocks |
| --ink | #14161A | text, keylines, selected tiles |
| --muted | #5B6270 | secondary text, ids |
| --rule | #C9CDD3 | light row dividers |
| --red | #D7261E | primary buttons and alerts only |
| --red-dark / --red-tint | #B21E17 / #FDECEB | hover, alert text, alert row background |
| --ok / --ok-tint | #1E6B3A / #EAF2EC | success messages, with a tick |
| --charcoal | #1B1D22 | the kiosk's "In the HQ now" block |

## Fonts
- Chakra Petch 600: h1 (uppercase), h2, big figures.
- IBM Plex Sans 400/500/600: everything else.
- Both come from Google Fonts and fall back to Segoe UI or Arial offline. SQL on Reports uses the system's Consolas.

## Files
`index.html` (door kiosk), `dashboard.html`, `attendance.html`, `people.html`, `items.html`, `requests.html`, `reports.html`, `settings.html`, `style.css`, `app.js`, `QA.md`.

## For the PHP rebuild
- **Includes:** everything from `<header class="topbar">` to `</header>` becomes `header.php`. Set `aria-current="page"` from the current file name. The footer plus `<script src="app.js">` becomes `footer.php`.
- **Forms:** element ids and labels already use the column names. Add `name="..."` with the same names, `method="post"`, and replace each `e.preventDefault()` handler in app.js with a real POST. Keep the JS checks and check again in PHP.
- **Stock check (the DB gap):** before `UPDATE item_request SET status='approved'`, run `SELECT quantity_available FROM v_item_stock WHERE item_id = ?` for each line and refuse if any `quantity > quantity_available`. Do it in a transaction, and show the same message as the prototype. The hidden `<ul id="stock-data">` in requests.html only stands in for this query.
- **Sign in:** look up `person` by student_id. If it's new, insert a person row. Refuse if an `attendance` row with `time_out IS NULL` already exists for that person. Then insert attendance (person_id, purpose_id). Sign out: `UPDATE attendance SET time_out = NOW() WHERE attendance_id = ?`.
- **Decisions:** set decided_by to the logged-in officer and decided_at to NOW(). Don't show Approve/Reject when requested_by is the logged-in user (the CHECK and trigger would reject it anyway).
- **Mark returned:** `UPDATE request_line SET returned_at = NOW()`. When every tool line of a request is returned, set the request to `completed`.
- **Login:** officer pages need a login (password_hash/password_verify). The kiosk device should only open index.html.
- **Output:** escape with htmlspecialchars and use prepared statements everywhere.
- **Open question for Rico:** an Adviser has to be a member, and a member needs a student_id, so a faculty adviser can't be stored as written.

All names, student numbers, phone numbers and records are sample data.
