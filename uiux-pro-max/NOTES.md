# Direction: "Tool Tags" (ui-ux-pro-max)

**Idea:** HQ is a workshop, so the system looks like one. Every panel is a parts bin with a black tag on its top edge naming the table, view or statement it shows (`v_open_loans`, `INSERT INTO restock`). Borders are hard 2px ink, corners are sharp, and shadows are flat 4px offsets. Buttons sink into their shadow when pressed. The current page in the menu is a black tag. Red only marks the action to take or an alert that needs one.

**Where it came from:** the ui-ux-pro-max skill's style data, **Neubrutalism** (bold black borders, hard offset shadows, flat colour, no gradients). It is toned down for an internal tool: the brief's palette replaces the style's pop colours, and the skill's "Neo Brutalism / Space Grotesk" font pairing is kept. The skill's auto design-system suggestion (dark glassmorphism, green accent) was rejected because the brief forbids it. Its UX rules were applied: 44px targets, confirmation before irreversible actions, error next to the field, mobile-first tables as cards, and reduced motion.

This direction differs from the other folders. Vercel "Column Captions" has a charcoal sidebar, Hallmark "Whiteprint" uses drawing title blocks, and taste "Ledger" is a monospace logbook. Tool Tags has a **white** sidebar with a black current-page tag, hard-shadow bins, and table-name tabs on every panel.

## Palette (CSS variables in `style.css`)
| Var | Hex | Use |
|---|---|---|
| `--white` | #FFFFFF | panels, inputs, sidebar |
| `--gray` | #F4F5F7 | page background, rule callouts |
| `--gray-2` | #E6E8EC | table heads, disabled |
| `--ink` | #14161A | text, borders, shadows, current page, focus ring |
| `--muted` | #5B6270 | secondary text, SQL captions |
| `--red` / `--red-dark` | #D7261E / #B01E17 | primary buttons, Overdue/Low stock/Short tags |
| `--red-soft` | #FDECEB | rows and stat bins that need action |
| `--charcoal` | #1B1D22 | logo backing, SQL code blocks |

## Fonts
Two families. **Space Grotesk** (Google Fonts, 400/500/700) is used for headings and body. A system **monospace** (Consolas) is used only for SQL names and code. Offline, Space Grotesk falls back to Segoe UI or Roboto, and the pages still work by double-click.

## Screens
- `index.html`: door kiosk.
  - The same header as the other pages, collapsed to a top bar with Menu.
  - A big PUP student / Visitor switch.
  - Live name match as you type. The 5 middle digits are enough.
  - Purpose tiles.
  - The Sign in button stays pinned in thumb reach on phones and tablets.
  - A full-panel confirmation that resets after 8 s.
  - People already inside can't sign in twice. Members are matched by person and visitors by contact number. A "Go to my Sign out" button jumps to their row.
  - On phones and tablets, a black "Leaving? Sign out here" bar jumps to the list.
- `dashboard.html`: five stat bins, each with the SQL it counts, plus four short tables.
- `attendance.html`: filters for date, purpose, members/visitors and still-inside, kept in the URL. Export is a stub.
- `people.html`: search, add person, an optional member row with role, and Activate/Deactivate.
- `items.html`: filters, add/edit item (one form), Restock with a log, and low-stock rows.
- `requests.html`: Pending, Tools out, New request and Decided. Approve is blocked over `quantity_available` and on your own request. Approvals and returns update stock for every other pending request.
- `reports.html`: 7 queries, each result beside its SQL (`v_item_stock`, open loans, overdue, low stock, per day, per purpose, most borrowed).
- `settings.html`: roles (with `can_approve`), purposes and categories.

All data is sample data: `@example.com` emails, `0917 555 01xx` numbers, and "today" is 24 Nov 2026.

## For the PHP rebuild
- **header.php** is the `<header class="side">` block, identical on all 8 pages. Set `aria-current="page"` on the current link, and the signed-in name and role from the session. On the door device, hide the officer links unless an officer is logged in.
- **Form names = column names**: `first_name`, `last_name`, `student_id`, `contact_number`, `affiliation`, `purpose_id`, `role_id`, `email`, `joined_on`, `is_active`, `name`, `category_id`, `item_type`, `quantity_total`, `reorder_level`, `quantity`, `restocked_on`, `notes`, `requested_by`, `remarks`. Request lines are arrays: `item_id[]`, `quantity[]`, `due_date[]`. The kiosk's `kind` (student/visitor) and People's `is_member` are UI-only switches.
- **Replace the JS arrays with queries** at the top of each section in `app.js`:
  - `KIOSK_PEOPLE` comes from `person` with a `student_id`.
  - `inside` comes from `attendance WHERE time_out IS NULL`.
  - `STOCK` comes from `v_item_stock`.
  - `ITEMS` and `PEOPLE_NAMES` come from `item` and `person`.
- **Approve must re-check stock on the server** in a transaction, because the DB doesn't block over-approval:
  1. `SELECT quantity_available FROM v_item_stock WHERE item_id IN (...) FOR UPDATE`.
  2. Compare each line against it.
  3. Then run `UPDATE item_request SET status='approved', decided_by=?, decided_at=NOW()`.
  
  The JS check is only there for the user.
- **Mark returned** sets `request_line.returned_at = NOW()`. When every tool line of a request is returned, set the request to `completed` (the prototype doesn't do this yet).
- **Kiosk:**
  - Sign in is `INSERT INTO attendance (person_id, purpose_id)`.
  - Before inserting, check `SELECT 1 FROM attendance WHERE person_id = ? AND time_out IS NULL` to block double sign-in.
  - Visitors: look up `person` by `contact_number` first, and insert a new person (with `student_id` NULL) only if there's no match.
  - Sign out is `UPDATE attendance SET time_out = NOW() WHERE attendance_id = ?`.
- **Reports:** the SQL on `reports.html` is the real query. Paste it into PHP as is.
- **Escape output** with `htmlspecialchars()` (`esc()` in app.js does the same job). Use prepared statements everywhere.
- **Export CSV** is a stub. In PHP, send `Content-Type: text/csv` with the filtered rows.

## Open questions
- Advisers are members, so the trigger requires a `student_id`. The sample uses a faculty number. Confirm with Rico.
- Should deactivating a member also block their pending requests?
