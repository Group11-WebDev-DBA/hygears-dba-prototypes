# frontend-design direction: "Shadow Board"

**Idea:** the system is a workshop **shadow board**, the pegboard where each tool has a painted outline so you can see at a glance what's missing. That's exactly the brief's job: transparency and stopping tools from walking off.
- Tools are drawn as slots. A solid slot is on the wall. A dashed outline is out, with the borrower's initials (red if overdue). This shows up on the Dashboard tool wall, the Items table, and the "On the wall now" list on Requests, which updates as an officer approves or marks returns.
- Consumables get a bin gauge with the reorder level marked in red.
- The sidebar is the pegboard: a dotted gray rack where each page hangs as a key tag. The current page's tag is filled charcoal.
- The HQ door kiosk is an **in/out tag board**. Everyone inside has a tag with a punched hole and their own Sign out button. A new tag swings onto its peg (the one animation, off with reduced motion).

How it differs from the others: Column Captions (vercel-guidelines) has a charcoal sidebar and SQL names under labels. Whiteprint (hallmark) has a white top bar and drawing-sheet title blocks. This one has a light pegboard rack, slot and bin graphics for stock, and human labels in forms, with the column names in table headers and `name` attributes.

Made with Anthropic's frontend-design skill. Where the two conflicted, the brief won: its palette, two fonts, and class-level CSS/JS.

## Palette (hex variables in style.css)
| Variable | Hex | Use |
|---|---|---|
| --white | #FFFFFF | page, inputs, tags |
| --board | #F4F5F7 | pegboard rack, filter strips, SQL blocks, tool-wall tiles |
| --ink | #14161A | text, solid slots, selected tiles |
| --muted | #5B6270 | secondary text, empty-slot outlines |
| --line | #D3D7DE | dividers, input borders |
| --peg | #C3C8D0 | pegboard holes (decoration only) |
| --charcoal | #1B1D22 | current nav tag, "In the HQ now" header |
| --red / --red-dark / --red-tint | #D7261E / #B51E17 / #FCEBEA | primary buttons, overdue, low stock, blocked approvals |
| --ok / --ok-tint | #1F6E43 / #E8F3EC | success messages, "In stock" (always with a tick) |
| --focus | #1A56C4 | keyboard focus ring |

## Fonts
- **Saira Condensed** 600/700: headings, big tally figures, slot initials. A narrow, engineered face that suits a racing org.
- **Public Sans** 400/600: everything else, 16px body.
- Both load from Google Fonts and fall back to Arial Narrow / Segoe UI offline. The SQL on Reports uses the system's Consolas.

## Files
`index.html` (HQ door kiosk), `dashboard.html`, `attendance.html`, `people.html`, `items.html`, `requests.html`, `reports.html`, `settings.html`, `style.css`, `app.js`, `QA.md`. They open by double-click. Nothing is saved, so reloading a page resets it.

## Try it
- Kiosk: type `2023 00141` (Mika, already inside, so she's refused), `2025 00456` (first visit, asks for name and number once), or pick Visitor. Sign out shows Undo.
- Requests: approve #1041, then #1045 turns red because only 1 multimeter is left. #1042 is blocked (4 discs, 3 in stock). Mark Mika's multimeters returned and #1045 frees up. #1044 is your own, so it has no buttons.
- Items: restock Solder wire 0.8 mm and the low-stock flag clears.

## For the PHP rebuild
- **Includes:** `<header class="rack">` … `</header>` becomes `header.php`. Set `aria-current="page"` on the current file's link. The footer and `<script src="app.js">` become `footer.php`.
- **Forms:** `name` attributes already match the columns. Add `method="post"`, and replace each `e.preventDefault()` handler with a real POST. Keep the JS checks and repeat them in PHP. Every "save" function in app.js has a comment with its SQL.
- **Sign in:** normalize the student number the same way (9 digits become `YYYY-NNNNN-MN-0`). Look up `person` by student_id. If there's no row, insert one with the name and number. Refuse if an `attendance` row with `time_out IS NULL` exists for that person_id. Then `INSERT INTO attendance (person_id, purpose_id)`. Visitors are matched by contact_number. Sign out: `UPDATE attendance SET time_out = NOW() WHERE attendance_id = ?`.
- **Stock check (the DB gap):** in a transaction, lock the item rows (`SELECT ... FROM item WHERE item_id = ? FOR UPDATE`), then for each line read `SELECT quantity_available FROM v_item_stock WHERE item_id = ?`. Refuse if `quantity > quantity_available`, using the prototype's message, then `UPDATE item_request SET status = 'approved', decided_by = ?, decided_at = NOW()`. A request with only consumable lines can go straight to `completed`. The `#stock-list` data attributes on requests.html stand in for this query.
- **Decisions:** decided_by is the logged-in officer. Hide Approve/Reject when requested_by is that officer (chk_request_not_self would refuse it anyway). Require remarks when rejecting.
- **Mark returned:** `UPDATE request_line SET returned_at = NOW() WHERE line_id = ?`. When no tool line of the request is still out, set the request to `completed`.
- **Login:** officer pages need a login (password_hash / password_verify). The door tablet should open only index.html, without the officer nav.
- **Output and input:** htmlspecialchars on everything echoed, and prepared statements everywhere.

## Open questions
- **Adviser (for Rico):** an Adviser must be a member, and a member needs a student_id, so a faculty adviser can't be stored as the schema is written.
- **Item units:** "rolls", "pieces" and "packs" are shown in the subtitles, but there's no unit column. Add `item.unit` if the group wants it.
- **Branch campuses:** the kiosk assumes `-MN-0`. Add a campus picker if non-Manila students use the HQ.

All names, student numbers, phone numbers and records are sample data.
