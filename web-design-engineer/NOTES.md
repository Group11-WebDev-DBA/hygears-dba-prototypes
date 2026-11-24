# Direction: "Scrutineering" (web-design-engineer skill)

**Idea:** Shell Eco-marathon cars pass technical inspection (scrutineering) before they're allowed on track. Here every action passes an inspection first. Each form, and each pending request, carries a live checklist. Every line is a database rule in plain words plus its real trigger or constraint name (`chk_request_not_self`, `uq_item_name`, `trg_line_consumable_ins`), with a PASS / FAIL / NOTE / WAIT box. A request with a FAIL shows a "Blocked" stamp and can't be approved, and it says why. The dashboard is simply the list of checks that failed today.

## Palette (CSS variables in `style.css`)
| Var | Hex | Use |
|---|---|---|
| `--white` | #FFFFFF | panels, inputs |
| `--gray` | #F4F5F7 | page background |
| `--gray-2` | #E9EBEF | panel bands, table heads |
| `--line` | #D5D9E0 | borders |
| `--ink` | #14161A | text, PASS boxes, selected tiles, focus ring |
| `--muted` | #5B6270 | secondary text |
| `--red` / `--red-dark` | #D7261E / #B01E17 | primary buttons, FAIL, alerts |
| `--red-soft` | #FCEDEC | FAIL and overdue row background |
| `--charcoal` | #1B1D22 | sidebar, SQL blocks |

No green: PASS is a solid ink box with a tick, FAIL is a red box with an ✕, so status never depends on colour.

## Fonts
- **Atkinson Hyperlegible** (Braille Institute, built for legibility) for all text.
- **JetBrains Mono** for SQL names, check codes and stamps.

Both come from Google Fonts. Offline, the page falls back to Segoe UI and Consolas.

## Files
`index.html` (door kiosk), `dashboard.html`, `attendance.html`, `people.html`, `items.html`, `requests.html`, `reports.html`, `settings.html`, `style.css`, `app.js`. Logo: `../assets/hygears-logo.png`. Sample data matches the other directions (same people, items and loans). Emails use `@example.com` and numbers are `0917 555 01xx`.

## Built in from the start
- **Kiosk:** blocks a second sign-in while you're inside, and blocks a visitor whose contact number is already inside. On phones a "Leaving? Jump to Sign out" bar sits at the top. The student number is typed as digits on the number pad (`inputmode="numeric"`) and read back formatted (`2023001010` reads as `2023-00101-MN-0`). A link switches to the letter keyboard for numbers like `FAC-2019-0042`.
- **Requests:** a line with more than `quantity_available` FAILs and blocks Approve with a reason. Approving lowers stock, so other pending requests are re-inspected at once. Marking a tool returned raises stock and can unblock a request. Approve, Reject and Mark returned need a second tap within 4 s, and Reject needs a reason (`remarks`).
- **Phones:** table text is 16px, nothing scrolls sideways at 360px (long names wrap), and rows show the name first.

## For the PHP rebuild
- **header.php** is the `<header class="sidebar">` block. Set `aria-current="page"` on the current link, and show the logged-in name and role from the session.
- **Form names = column names** (`student_id`, `first_name`, `purpose_id`, `item_type`, `quantity_total`, `reorder_level`, `requested_by`, `due_date`, `remarks`, `restocked_on`). Feed them to prepared statements.
- **Sample arrays to queries** (top of `app.js`):
  - `persons` → `person`
  - `members` → `member`
  - `attendance` → `attendance`
  - `items[].available` → `v_item_stock.quantity_available`
  - `requests[].lines` → `request_line`
  - `openLoans()` → `v_open_loans`
  - `lowStock()` → `v_low_stock`
- **Render functions:** each `render…` function becomes a `foreach` over a query result.
- **Checks:** each `…Checks()` function is the list of rules to re-check in PHP before the INSERT/UPDATE. The JS is for the user; the server must check again.
- **Approve:** run it in a transaction:
  1. `SELECT quantity_available FROM v_item_stock WHERE item_id IN (...) FOR UPDATE`
  2. Compare each line with the stock.
  3. `UPDATE item_request SET status='approved', decided_by=?, decided_at=NOW()`

  The DB doesn't block over-approval, so this check is the only guard.
- **Consumable-only requests** are set to `completed` on approval, because nothing comes back.
- **Mark returned** sets `request_line.returned_at = NOW()`. When no tool lines are left out, set the request to `completed`.
- **Kiosk sign out:** `UPDATE attendance SET time_out = NOW() WHERE attendance_id = ?`.
- **Visitor sign in:** `INSERT person` (with `student_id` NULL), then `INSERT attendance`.
- **Reports:** the SQL shown on `reports.html` is the real query.
- **Export CSV** is a stub. In PHP, send `Content-Type: text/csv`.
- **Escaping:** `esc()` in `app.js` does the job of `htmlspecialchars()`.

## Open questions
- Should returning visitors be matched by `contact_number` before inserting a new `person`?
- Advisers need a `student_id` because of the trigger. The sample uses a faculty number (`FAC-2019-0042`). Confirm with Rico.
- Should officers be able to close a forgotten "still inside" row from the Attendance page?
