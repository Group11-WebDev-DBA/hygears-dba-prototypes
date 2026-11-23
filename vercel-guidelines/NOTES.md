# Direction: "Vercel guidelines" (Column Captions)

**Idea:** the screen names its database. Every page header lists the tables and views it touches. Every column header and form label carries its real SQL column in small monospace (`quantity_available`, `time_out`, `can_approve`). Every business rule the database enforces is explained in the UI, with the trigger or constraint name. The look is monochrome plus one red: a calm internal tool where red always means "act on this".

Built to Vercel's Web Interface Guidelines: a skip link; visible keyboard focus rings; aria-live toasts; inline errors that focus the first bad field; Undo or a confirm dialog for every destructive or irreversible action; filters kept in the URL (`attendance.html?who=visitor&inside=yes`); dates through `Intl.DateTimeFormat`; tabular numbers; `…` placeholders; reduced-motion support; safe-area insets on the kiosk; a warning before leaving a form with unsaved changes.

## Palette (CSS variables in `style.css`)
| Var | Hex | Use |
|---|---|---|
| `--white` | #FFFFFF | panels, inputs |
| `--gray` | #F4F5F7 | page background, table heads |
| `--ink` | #14161A | text, dark buttons, focus ring |
| `--muted` | #5B6270 | secondary text |
| `--red` / `--red-dark` | #D7261E / #B01E17 | primary actions, alerts that need action |
| `--red-soft` | #FCEDEC | background of alert rows/notices |
| `--charcoal` | #1B1D22 | sidebar and kiosk header |
| `--line` | #DCDFE4 | borders |

## Fonts
Two stacks, nothing downloaded (works offline by double-click). Body is the system sans: Segoe UI on Windows, Roboto on Android. Column names, IDs and SQL use the system monospace (Consolas / ui-monospace).

## Files
`index.html` (door kiosk), `dashboard.html`, `attendance.html`, `people.html`, `items.html`, `requests.html`, `reports.html`, `settings.html`, `style.css`, `app.js`. Logo from `../assets/hygears-logo.png`. All data is obviously sample (`@example.com` emails, `0917 555 01xx` numbers).

The kiosk shares the charcoal header but not the officer menu, because the door phone shouldn't expose admin pages. Officers get to it from the sidebar ("At the door" → Attendance Kiosk).

## For the PHP rebuild
- **header.php** is the `<header class="sidebar">` block (identical on the 7 officer pages). Set `aria-current="page"` on the current link and the logged-in name and role from the session.
- **Form names = column names.** POST `first_name`, `student_id`, `purpose_id`, `item_type`, `quantity`, `due_date`, `remarks`, … straight into prepared statements.
- **Replace the JS arrays with queries.** `KIOSK_PEOPLE` and `inside` (kiosk), and `stock` / `ITEM_NAMES` (requests), come from `person`, from `attendance WHERE time_out IS NULL`, and from `v_item_stock`. Pending rows already carry `data-item-id` / `data-qty`; output `data-available` from `v_item_stock` too.
- **Approve must re-check stock on the server**, inside a transaction, because the DB doesn't block over-approval. Run `SELECT quantity_available FROM v_item_stock WHERE item_id IN (...) FOR UPDATE`, compare each line, and only then `UPDATE item_request SET status='approved', decided_by=?, decided_at=NOW()`. The JS check is for the user's benefit only.
- **Mark Returned** sets `request_line.returned_at = NOW()`. When all tool lines of a request are returned, set the request to `completed`.
- **Kiosk sign out** sets `UPDATE attendance SET time_out = NOW() WHERE attendance_id = ?`. Visitor sign-in is `INSERT person` (student_id NULL), then `INSERT attendance`.
- **Reports**: the SQL shown on `reports.html` is the real query. Paste it into PHP as is.
- **Escape output** with `htmlspecialchars()` (app.js has `esc()` doing the same job).
- **Export CSV** on the Attendance page is a stub. In PHP, send `Content-Type: text/csv` with the filtered rows.

## Open questions
- Advisers are members, so the trigger needs a `student_id`. The sample uses a faculty number. Confirm with Rico.
- Returning visitors: match an existing `person` by `contact_number` before inserting a new one.
